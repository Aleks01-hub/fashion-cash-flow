package br.com.caixacentral.product;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository repository;
    public ProductController(ProductRepository repository){this.repository=repository;}

    @GetMapping public List<Product> all(){return repository.findAll();}
    @GetMapping("/{id}") public Product one(@PathVariable UUID id){return repository.findById(id).orElseThrow();}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Product create(@Valid @RequestBody Product product){return repository.save(product);}
    @PutMapping("/{id}") public Product update(@PathVariable UUID id,@Valid @RequestBody Product input){
        Product current=repository.findById(id).orElseThrow();
        current.setName(input.getName()); current.setCategory(input.getCategory()); current.setPrice(input.getPrice());
        current.setMinStock(input.getMinStock()); current.setPhoto(input.getPhoto()); current.setBarcode(input.getBarcode());
        current.setUnit(input.getUnit()); current.setCost(input.getCost()); current.setMargin(input.getMargin()); current.setWholesale(input.getWholesale());
        current.setSupplier(input.getSupplier()); current.setBrand(input.getBrand()); current.setReference(input.getReference()); current.setLocation(input.getLocation());
        current.setInactive(input.isInactive());
        return repository.save(current);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable UUID id){repository.deleteById(id);}
}
