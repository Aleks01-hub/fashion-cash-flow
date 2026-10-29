package br.com.caixacentral.product;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "product_variations", indexes = {
    @Index(name = "idx_variation_product_color_size", columnList = "product_id,color,size")
})
public class Variation {
    @Id @GeneratedValue private UUID id;
    @Column(name = "product_id", nullable = false) private UUID productId;
    @Column(nullable = false, length = 40) private String color;
    @Column(nullable = false, length = 20) private String size;
    @Column(nullable = false) private int quantity;
    @Column(nullable = false) private int minStock;

    protected Variation() {}
    public Variation(UUID productId, String color, String size, int quantity, int minStock) {
        this.productId = productId;
        this.color = color;
        this.size = size;
        this.quantity = quantity;
        this.minStock = minStock;
    }
    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getMinStock() { return minStock; }
    public void setMinStock(int minStock) { this.minStock = minStock; }
}
