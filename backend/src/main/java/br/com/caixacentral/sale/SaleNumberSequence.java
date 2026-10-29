package br.com.caixacentral.sale;

import jakarta.persistence.*;

@Entity
@Table(name = "sale_number_sequence")
public class SaleNumberSequence {
    @Id private Long id;
    @Column(nullable = false) private long nextNumber;
    protected SaleNumberSequence() {}
    public SaleNumberSequence(Long id, long nextNumber) { this.id = id; this.nextNumber = nextNumber; }
    public Long getId() { return id; }
    public long getNextNumber() { return nextNumber; }
    public void setNextNumber(long nextNumber) { this.nextNumber = nextNumber; }
}
