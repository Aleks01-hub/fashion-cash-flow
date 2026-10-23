package br.com.caixacentral.sale;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
    private final SaleRepository repository;
    public SaleController(SaleRepository repository){this.repository=repository;}

    @GetMapping public List<Sale> all(){return repository.findAll();}
    @GetMapping("/{id}") public Sale one(@PathVariable UUID id){return repository.findById(id).orElseThrow();}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Sale create(@Valid @RequestBody Sale sale){
        sale.setDate(sale.getDate()==null?java.time.Instant.now():sale.getDate());
        sale.getItems().forEach(item->item.setSale(sale));
        return repository.save(sale);
    }
}
