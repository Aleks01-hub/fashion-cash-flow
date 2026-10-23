package br.com.caixacentral.stock;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="stock_movements")
public class StockMovement {
 @Id @GeneratedValue private UUID id;
 @Column(nullable=false) private Instant date;
 @Column(nullable=false) private String type;
 @Column(nullable=false) private UUID productId;
 private String productName; private String color; private String size; private int quantity;
 @Column(columnDefinition="text") private String note;
 public UUID getId(){return id;}
 public Instant getDate(){return date;} public void setDate(Instant v){date=v;}
 public String getType(){return type;} public void setType(String v){type=v;}
 public UUID getProductId(){return productId;} public void setProductId(UUID v){productId=v;}
 public String getProductName(){return productName;} public void setProductName(String v){productName=v;}
 public String getColor(){return color;} public void setColor(String v){color=v;}
 public String getSize(){return size;} public void setSize(String v){size=v;}
 public int getQuantity(){return quantity;} public void setQuantity(int v){quantity=v;}
 public String getNote(){return note;} public void setNote(String v){note=v;}
}
