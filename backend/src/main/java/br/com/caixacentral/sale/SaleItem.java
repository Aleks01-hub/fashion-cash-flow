package br.com.caixacentral.sale;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name="sale_items")
public class SaleItem {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="sale_id") private Sale sale;
    private UUID productId;
    private String productName;
    private String color;
    private String size;
    private int quantity;
    private double unitPrice;
    private double total;

    public UUID getId(){return id;}
    public Sale getSale(){return sale;} public void setSale(Sale sale){this.sale=sale;}
    public UUID getProductId(){return productId;} public void setProductId(UUID productId){this.productId=productId;}
    public String getProductName(){return productName;} public void setProductName(String productName){this.productName=productName;}
    public String getColor(){return color;} public void setColor(String color){this.color=color;}
    public String getSize(){return size;} public void setSize(String size){this.size=size;}
    public int getQuantity(){return quantity;} public void setQuantity(int quantity){this.quantity=quantity;}
    public double getUnitPrice(){return unitPrice;} public void setUnitPrice(double unitPrice){this.unitPrice=unitPrice;}
    public double getTotal(){return total;} public void setTotal(double total){this.total=total;}
}
