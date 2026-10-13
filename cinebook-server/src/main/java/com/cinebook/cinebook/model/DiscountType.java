package com.cinebook.cinebook.model;

public enum DiscountType {
    /** value is a percentage of the order (optionally capped by maxDiscount). */
    PERCENT,
    /** value is a fixed amount in the shop currency. */
    FIXED
}
