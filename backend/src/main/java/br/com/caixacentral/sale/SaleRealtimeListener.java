package br.com.caixacentral.sale;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class SaleRealtimeListener {
    private final SimpMessagingTemplate messaging;

    public SaleRealtimeListener(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSaleCreated(SaleCreatedEvent event) {
        messaging.convertAndSend("/topic/vendas", event);
    }
}
