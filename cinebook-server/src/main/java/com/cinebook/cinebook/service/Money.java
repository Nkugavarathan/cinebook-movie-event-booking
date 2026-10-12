package com.cinebook.cinebook.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

/** Formats amounts for emails / PDFs: "$12.50" for USD, otherwise "LKR 1,500.00". */
public final class Money {

    private Money() {
    }

    public static String format(BigDecimal amount, String currency) {
        if (amount == null) return "";
        String code = currency == null ? "" : currency.toUpperCase();
        try {
            Currency c = Currency.getInstance(code);
            if ("USD".equals(code)) {
                NumberFormat f = NumberFormat.getCurrencyInstance(Locale.US);
                f.setCurrency(c);
                return f.format(amount);
            }
            NumberFormat f = NumberFormat.getNumberInstance(Locale.US);
            f.setMinimumFractionDigits(c.getDefaultFractionDigits());
            f.setMaximumFractionDigits(c.getDefaultFractionDigits());
            return code + " " + f.format(amount);
        } catch (Exception e) {
            return code + " " + amount;
        }
    }
}
