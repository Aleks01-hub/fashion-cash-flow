package br.com.caixacentral.sale;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
    private final SaleRepository repository;
    private final SaleService saleService;

    public SaleController(SaleRepository repository, SaleService saleService) {
        this.repository = repository;
        this.saleService = saleService;
    }

    @GetMapping public List<Sale> all(){return repository.findAll();}
    @GetMapping("/{id}") public Sale one(@PathVariable UUID id){return repository.findById(id).orElseThrow();}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Sale create(@RequestBody Sale sale){ return saleService.create(sale); }
}
