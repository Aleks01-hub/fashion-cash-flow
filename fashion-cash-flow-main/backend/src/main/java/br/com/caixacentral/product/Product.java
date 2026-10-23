package br.com.caixacentral.product;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(nullable=false) private String name;
    private String category;
    private double price;
    private int minStock;
    @Column(length=100000) private String photo;
    private String barcode;
    private String unit;
    private double cost;
    private double margin;
    private double wholesale;
    private String supplier;
    private String brand;
    private String reference;
    private String location;
    private boolean inactive;

    public UUID getId(){return id;}
    public String getName(){return name;}
    public void setName(String name){this.name=name;}
    public String getCategory(){return category;}
    public void setCategory(String category){this.category=category;}
    public double getPrice(){return price;}
    public void setPrice(double price){this.price=price;}
    public int getMinStock(){return minStock;}
    public void setMinStock(int minStock){this.minStock=minStock;}
    public String getPhoto(){return photo;}
    public void setPhoto(String photo){this.photo=photo;}
    public String getBarcode(){return barcode;}
    public void setBarcode(String barcode){this.barcode=barcode;}
    public String getUnit(){return unit;}
    public void setUnit(String unit){this.unit=unit;}
    public double getCost(){return cost;}
    public void setCost(double cost){this.cost=cost;}
    public double getMargin(){return margin;}
    public void setMargin(double margin){this.margin=margin;}
    public double getWholesale(){return wholesale;}
    public void setWholesale(double wholesale){this.wholesale=wholesale;}
    public String getSupplier(){return supplier;}
    public void setSupplier(String supplier){this.supplier=supplier;}
    public String getBrand(){return brand;}
    public void setBrand(String brand){this.brand=brand;}
    public String getReference(){return reference;}
    public void setReference(String reference){this.reference=reference;}
    public String getLocation(){return location;}
    public void setLocation(String location){this.location=location;}
    public boolean isInactive(){return inactive;}
    public void setInactive(boolean inactive){this.inactive=inactive;}
}
