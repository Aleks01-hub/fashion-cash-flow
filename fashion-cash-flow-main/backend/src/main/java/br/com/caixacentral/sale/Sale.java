package br.com.caixacentral.sale;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name="sales")
public class Sale {
    @Id @GeneratedValue private UUID id;
    @Column(nullable=false,unique=true) private long number;
    @Column(nullable=false) private Instant date;
    private UUID customerId;
    private String customerName;
    private String paymentMethod;
    private double subtotal;
    private double discount;
    private double total;
    private double amountPaid;
    private LocalDate dueDate;
    private String notes;

    @OneToMany(mappedBy="sale",cascade=CascadeType.ALL,orphanRemoval=true)
    private List<SaleItem> items=new ArrayList<>();

    public UUID getId(){return id;}
    public long getNumber(){return number;} public void setNumber(long number){this.number=number;}
    public Instant getDate(){return date;} public void setDate(Instant date){this.date=date;}
    public UUID getCustomerId(){return customerId;} public void setCustomerId(UUID customerId){this.customerId=customerId;}
    public String getCustomerName(){return customerName;} public void setCustomerName(String customerName){this.customerName=customerName;}
    public String getPaymentMethod(){return paymentMethod;} public void setPaymentMethod(String paymentMethod){this.paymentMethod=paymentMethod;}
    public double getSubtotal(){return subtotal;} public void setSubtotal(double subtotal){this.subtotal=subtotal;}
    public double getDiscount(){return discount;} public void setDiscount(double discount){this.discount=discount;}
    public double getTotal(){return total;} public void setTotal(double total){this.total=total;}
    public double getAmountPaid(){return amountPaid;} public void setAmountPaid(double amountPaid){this.amountPaid=amountPaid;}
    public LocalDate getDueDate(){return dueDate;} public void setDueDate(LocalDate dueDate){this.dueDate=dueDate;}
    public String getNotes(){return notes;} public void setNotes(String notes){this.notes=notes;}
    public List<SaleItem> getItems(){return items;}
    public void setItems(List<SaleItem> items){this.items.clear();if(items!=null){items.forEach(i->i.setSale(this));this.items.addAll(items);}}
}
