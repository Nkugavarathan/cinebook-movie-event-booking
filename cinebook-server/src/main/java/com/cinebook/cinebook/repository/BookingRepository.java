package com.cinebook.cinebook.repository;

import com.cinebook.cinebook.model.Booking;
import com.cinebook.cinebook.model.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /** Row lock so the webhook and the redirect-confirm never process one booking twice. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    Optional<Booking> findByStripeSessionId(String sessionId);

    boolean existsByReference(String reference);

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUserIdAndShowTimeIdAndStatus(Long userId, Long showTimeId, BookingStatus status);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime time);

    @Query("""
            select b from Booking b
            where (:status is null or b.status = :status)
              and (:q is null
                   or lower(b.reference) like lower(concat('%', :q, '%'))
                   or lower(b.user.email) like lower(concat('%', :q, '%'))
                   or lower(b.user.name) like lower(concat('%', :q, '%'))
                   or lower(b.showTime.movie.title) like lower(concat('%', :q, '%')))
            order by b.createdAt desc
            """)
    List<Booking> search(@Param("status") BookingStatus status, @Param("q") String q, Pageable pageable);

    List<Booking> findByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(BookingStatus status);

    @Query("select coalesce(sum(b.totalAmount), 0) from Booking b where b.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") BookingStatus status);

    @Query("select b from Booking b where b.status = :status and b.confirmedAt >= :from")
    List<Booking> findByStatusConfirmedSince(@Param("status") BookingStatus status, @Param("from") LocalDateTime from);

    List<Booking> findByStatus(BookingStatus status);

    boolean existsByShowTimeIdIn(Collection<Long> showTimeIds);

    long countByShowTimeIdAndStatusIn(Long showTimeId, Collection<BookingStatus> statuses);
}
