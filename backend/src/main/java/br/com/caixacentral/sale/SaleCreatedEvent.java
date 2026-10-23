package br.com.caixacentral.sale;

import java.time.Instant;
import java.util.UUID;

public record SaleCreatedEvent(UUID id, long number, double total, Instant date) {
    public static SaleCreatedEvent from(Sale sale) {
        return new SaleCreatedEvent(sale.getId(), sale.getNumber(), sale.getTotal(), sale.getDate());
    }
}
