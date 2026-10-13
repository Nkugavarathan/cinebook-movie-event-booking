package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Row locking lives in service.BookingLock (it must also refresh cached state).

    Optional<Booking> findByStripeSessionId(String sessionId);

    boolean existsByReference(String reference);

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUserIdAndShowTimeIdAndStatus(Long userId, Long showTimeId, BookingStatus status);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime time);

    @Query("""
            select b from Booking b
            join b.user u join b.showTime st left join st.movie m left join st.event e
            where (:status is null or b.status = :status)
              and (:q is null
                   or lower(b.reference) like lower(concat('%', :q, '%'))
                   or lower(u.email) like lower(concat('%', :q, '%'))
                   or lower(u.name) like lower(concat('%', :q, '%'))
                   or lower(m.title) like lower(concat('%', :q, '%'))
                   or lower(e.name) like lower(concat('%', :q, '%'))
                   or lower(b.contactName) like lower(concat('%', :q, '%'))
                   or lower(b.contactEmail) like lower(concat('%', :q, '%'))
                   or b.contactPhone like concat('%', :q, '%'))
            order by b.createdAt desc
            """)
    List<Booking> search(@Param("status") BookingStatus status, @Param("q") String q, Pageable pageable);

    List<Booking> findByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(BookingStatus status);

    /** Per user: [userId, confirmed bookings, total spent, last booking time]. */
    @Query("""
            select b.user.id, count(b),
                   coalesce(sum(case when lower(b.currency) = lower(:currency) then b.totalAmount else 0 end), 0),
                   max(b.createdAt)
            from Booking b where b.status = :status group by b.user.id
            """)
    List<Object[]> statsByUser(@Param("status") BookingStatus status, @Param("currency") String currency);

    boolean existsByUserId(Long userId);

    /**
     * Uses of a promo code that count towards its limits: paid bookings, plus holds still being paid
     * (so two people can't both grab the last use). Abandoned / refunded bookings free the use again.
     */
    @Query("""
            select count(b) from Booking b
            where upper(b.promoCode) = upper(:code) and b.id <> :excludeId
              and (b.status = :confirmed or (b.status = :pending and b.expiresAt > :now))
              and (:userId is null or b.user.id = :userId)
            """)
    long countPromoUses(@Param("code") String code, @Param("excludeId") Long excludeId,
                        @Param("userId") Long userId, @Param("now") LocalDateTime now,
                        @Param("confirmed") BookingStatus confirmed, @Param("pending") BookingStatus pending);

    /** Per code: [CODE, paid uses, total discount given]. */
    @Query("""
            select upper(b.promoCode), count(b), coalesce(sum(b.discountAmount), 0)
            from Booking b where b.status = :status and b.promoCode is not null
            group by upper(b.promoCode)
            """)
    List<Object[]> promoStats(@Param("status") BookingStatus status);

    boolean existsByPromoCodeIgnoreCase(String code);

    @Query("select coalesce(sum(b.totalAmount), 0) from Booking b where b.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") BookingStatus status);

    @Query("select b from Booking b where b.status = :status and b.confirmedAt >= :from")
    List<Booking> findByStatusConfirmedSince(@Param("status") BookingStatus status, @Param("from") LocalDateTime from);

    List<Booking> findByStatus(BookingStatus status);

    boolean existsByShowTimeIdIn(Collection<Long> showTimeIds);

    long countByShowTimeIdAndStatusIn(Long showTimeId, Collection<BookingStatus> statuses);
}
