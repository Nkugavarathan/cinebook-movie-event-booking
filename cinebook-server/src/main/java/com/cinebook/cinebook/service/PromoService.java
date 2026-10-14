package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.BookingResponseDTO;
import com.cinebook.cinebook.dto.PromoCodeDTO;
import com.cinebook.cinebook.dto.PromoCodeRequest;
import com.cinebook.cinebook.exception.ApiException;
import com.cinebook.cinebook.exception.PromoInvalidatedException;
import com.cinebook.cinebook.model.*;
import com.cinebook.cinebook.repository.BookingRepository;
import com.cinebook.cinebook.repository.PromoCodeRepository;
import com.cinebook.cinebook.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Promo codes: admin CRUD, and applying a code to a held (PENDING) booking. The discount is always
 * computed here on the server; the client only sends the code.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromoService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMM yyyy, h:mm a", Locale.ENGLISH);

    private final PromoCodeRepository promoRepo;
    private final BookingRepository bookingRepo;
    private final BookingLock bookingLock;
    private final CurrentUser currentUser;
    private final StripeGateway stripe;
    private final DtoMapper mapper;

    /** Smallest amount we let a customer pay after a discount (Stripe has a minimum charge). */
    @Value("${app.payment.min-amount:200}")
    private BigDecimal minPayable;

    // ---------------------------------------------------------------- checkout

    @Transactional
    public BookingResponseDTO apply(Long bookingId, String rawCode) {
        Booking b = lockOwnedPending(bookingId);
        PromoCode promo = promoRepo.findByCodeIgnoreCase(rawCode.trim())
                .orElseThrow(() -> ApiException.badRequest("\"" + rawCode.trim().toUpperCase() + "\" isn't a valid promo code"));
        BigDecimal discount = discountFor(promo, b);
        setDiscount(b, promo.getCode(), discount);
        log.info("Promo {} applied to {}: -{} {}", promo.getCode(), b.getReference(), discount, b.getCurrency());
        return mapper.booking(b);
    }

    @Transactional
    public BookingResponseDTO remove(Long bookingId) {
        Booking b = lockOwnedPending(bookingId);
        setDiscount(b, null, BigDecimal.ZERO);
        return mapper.booking(b);
    }

    /**
     * Called right before creating the Stripe session: the code may have expired or run out since
     * it was applied. If so it's removed and the customer is told the new total.
     */
    @Transactional(noRollbackFor = PromoInvalidatedException.class)
    public void revalidateBeforePayment(Booking b) {
        if (b.getPromoCode() == null) return;
        PromoCode promo = promoRepo.findByCodeIgnoreCase(b.getPromoCode()).orElse(null);
        try {
            if (promo == null) throw ApiException.badRequest("This promo code no longer exists");
            BigDecimal discount = discountFor(promo, b);
            if (discount.compareTo(b.getDiscountAmount()) != 0) setDiscount(b, promo.getCode(), discount);
        } catch (ApiException e) {
            String code = b.getPromoCode();
            setDiscount(b, null, BigDecimal.ZERO);
            bookingRepo.saveAndFlush(b);
            throw new PromoInvalidatedException("Promo " + code + " can no longer be used (" + e.getMessage()
                    + "). It has been removed - your total is now " + Money.format(b.getTotalAmount(), b.getCurrency()) + ".");
        }
    }

    /** Discount this code gives on this booking, or a clear reason why it can't be used. */
    BigDecimal discountFor(PromoCode p, Booking b) {
        LocalDateTime now = LocalDateTime.now();
        BigDecimal subtotal = subtotal(b);
        String cur = b.getCurrency();
        if (!p.isActive()) throw ApiException.badRequest("This promo code is no longer active");
        if (p.getStartsAt() != null && now.isBefore(p.getStartsAt())) {
            throw ApiException.badRequest("This code starts on " + p.getStartsAt().format(DATE));
        }
        if (p.getExpiresAt() != null && now.isAfter(p.getExpiresAt())) {
            throw ApiException.badRequest("This code expired on " + p.getExpiresAt().format(DATE));
        }
        if (p.getMinOrderAmount() != null && subtotal.compareTo(p.getMinOrderAmount()) < 0) {
            throw ApiException.badRequest("This code needs an order of at least " + Money.format(p.getMinOrderAmount(), cur));
        }
        if (p.getUsageLimit() != null && bookingRepo.countPromoUses(p.getCode(), b.getId(), null, now,
                BookingStatus.CONFIRMED, BookingStatus.PENDING) >= p.getUsageLimit()) {
            throw ApiException.badRequest("This code has reached its usage limit");
        }
        if (p.getPerUserLimit() != null && bookingRepo.countPromoUses(p.getCode(), b.getId(), b.getUser().getId(), now,
                BookingStatus.CONFIRMED, BookingStatus.PENDING) >= p.getPerUserLimit()) {
            throw ApiException.badRequest(p.getPerUserLimit() == 1
                    ? "You've already used this code" : "You've used this code the maximum number of times");
        }

        BigDecimal discount = p.getDiscountType() == DiscountType.PERCENT
                ? subtotal.multiply(p.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : p.getDiscountValue();
        if (p.getDiscountType() == DiscountType.PERCENT && p.getMaxDiscount() != null) {
            discount = discount.min(p.getMaxDiscount());
        }
        discount = discount.min(subtotal).setScale(2, RoundingMode.HALF_UP);
        if (subtotal.subtract(discount).compareTo(minPayable) < 0) {
            throw ApiException.badRequest("This code can't be used on such a small order");
        }
        return discount;
    }

    private void setDiscount(Booking b, String code, BigDecimal discount) {
        BigDecimal subtotal = subtotal(b);
        b.setSubtotalAmount(subtotal);
        b.setPromoCode(code);
        b.setDiscountAmount(code == null ? null : discount);
        b.recalculateTotal();
        // A Stripe session made for the old total must not be paid.
        if (b.getStripeSessionId() != null) {
            stripe.expireSessionQuietly(b.getStripeSessionId());
            b.setStripeSessionId(null);
        }
        bookingRepo.save(b);
    }

    private static BigDecimal subtotal(Booking b) {
        return b.getSubtotalAmount() != null ? b.getSubtotalAmount() : b.getTotalAmount();
    }

    private Booking lockOwnedPending(Long bookingId) {
        User user = currentUser.require();
        Booking b = bookingLock.lock(bookingId).orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!b.getUser().getId().equals(user.getId())) throw ApiException.notFound("Booking not found");
        if (b.getStatus() != BookingStatus.PENDING || b.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("Promo codes can only be added before you pay");
        }
        return b;
    }

    // ---------------------------------------------------------------- admin

    @Transactional(readOnly = true)
    public List<PromoCodeDTO> list() {
        Map<String, Object[]> stats = stats();
        return promoRepo.findAllByOrderByCreatedAtDesc().stream().map(p -> toDto(p, stats.get(p.getCode()))).toList();
    }

    @Transactional
    public PromoCodeDTO create(PromoCodeRequest req) {
        String code = req.code().trim().toUpperCase();
        if (promoRepo.existsByCodeIgnoreCase(code)) throw ApiException.conflict("A promo code " + code + " already exists");
        PromoCode p = new PromoCode();
        p.setCode(code);
        p.setCreatedAt(LocalDateTime.now());
        apply(p, req);
        return toDto(promoRepo.save(p), null);
    }

    @Transactional
    public PromoCodeDTO update(Long id, PromoCodeRequest req) {
        PromoCode p = find(id);
        String code = req.code().trim().toUpperCase();
        if (!code.equals(p.getCode())) {
            if (bookingRepo.existsByPromoCodeIgnoreCase(p.getCode())) {
                throw ApiException.conflict("This code has been used, so it can't be renamed. Create a new code instead.");
            }
            if (promoRepo.existsByCodeIgnoreCase(code)) throw ApiException.conflict("A promo code " + code + " already exists");
            p.setCode(code);
        }
        apply(p, req);
        return toDto(promoRepo.save(p), stats().get(p.getCode()));
    }

    @Transactional
    public void delete(Long id) {
        PromoCode p = find(id);
        if (bookingRepo.existsByPromoCodeIgnoreCase(p.getCode())) {
            throw ApiException.conflict("This code has been used on bookings, so it can't be deleted. Turn it off instead.");
        }
        promoRepo.delete(p);
    }

    private void apply(PromoCode p, PromoCodeRequest r) {
        if (r.discountType() == DiscountType.PERCENT && r.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ApiException.badRequest("A percentage discount can't be more than 100%");
        }
        if (r.startsAt() != null && r.expiresAt() != null && !r.expiresAt().isAfter(r.startsAt())) {
            throw ApiException.badRequest("The expiry date must be after the start date");
        }
        p.setDescription(r.description() == null || r.description().isBlank() ? null : r.description().trim());
        p.setDiscountType(r.discountType());
        p.setDiscountValue(r.discountValue());
        p.setMaxDiscount(r.discountType() == DiscountType.PERCENT ? r.maxDiscount() : null);
        p.setMinOrderAmount(r.minOrderAmount() != null && r.minOrderAmount().signum() > 0 ? r.minOrderAmount() : null);
        p.setStartsAt(r.startsAt());
        p.setExpiresAt(r.expiresAt());
        p.setUsageLimit(r.usageLimit());
        p.setPerUserLimit(r.perUserLimit());
        p.setActive(r.active() == null || r.active());
    }

    private PromoCode find(Long id) {
        return promoRepo.findById(id).orElseThrow(() -> ApiException.notFound("Promo code not found"));
    }

    private Map<String, Object[]> stats() {
        Map<String, Object[]> map = new HashMap<>();
        for (Object[] row : bookingRepo.promoStats(BookingStatus.CONFIRMED)) map.put((String) row[0], row);
        return map;
    }

    private PromoCodeDTO toDto(PromoCode p, Object[] s) {
        long used = s == null ? 0 : ((Number) s[1]).longValue();
        BigDecimal given = s == null ? BigDecimal.ZERO : (BigDecimal) s[2];
        LocalDateTime now = LocalDateTime.now();
        String status = !p.isActive() ? "DISABLED"
                : p.getExpiresAt() != null && now.isAfter(p.getExpiresAt()) ? "EXPIRED"
                : p.getStartsAt() != null && now.isBefore(p.getStartsAt()) ? "SCHEDULED"
                : p.getUsageLimit() != null && used >= p.getUsageLimit() ? "USED_UP"
                : "ACTIVE";
        return new PromoCodeDTO(p.getId(), p.getCode(), p.getDescription(), p.getDiscountType(), p.getDiscountValue(),
                p.getMaxDiscount(), p.getMinOrderAmount(), p.getStartsAt(), p.getExpiresAt(), p.getUsageLimit(),
                p.getPerUserLimit(), p.isActive(), p.getCreatedAt(), used, given, status, mapper.currency());
    }
}
