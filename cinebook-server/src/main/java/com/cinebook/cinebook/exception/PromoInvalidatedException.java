package com.cinebook.cinebook.exception;

import org.springframework.http.HttpStatus;

/**
 * A promo code stopped being valid between "apply" and "pay". The code has already been removed
 * from the booking, so transactions must commit (not roll back) when this is thrown.
 */
public class PromoInvalidatedException extends ApiException {
    public PromoInvalidatedException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
