package br.com.caixacentral.av;

import br.com.caixacentral.customer.Customer;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "av_accounts", indexes = {
    @Index(name = "idx_av_account_customer", columnList = "customer_id"),
    @Index(name = "idx_av_account_status_due", columnList = "status,due_date")
})
public class AvAccount {
    public enum Status { ACTIVE, PAID, OVERDUE }

    @Id @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, length = 240)
    private String description;

    @Column(name = "original_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "current_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentBalance;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.ACTIVE;

    public UUID getId() { return id; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getOriginalAmount() { return originalAmount; }
    public void setOriginalAmount(BigDecimal originalAmount) { this.originalAmount = originalAmount; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}
