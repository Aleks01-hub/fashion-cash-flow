package br.com.caixacentral.stock;
import java.util.Comparator;
import java.util.List;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/stock/movements")
public class StockController {
 private final StockMovementRepository repository;
 public StockController(StockMovementRepository repository){this.repository=repository;}
 @GetMapping public List<StockMovement> all(){
  return repository.findAll().stream().sorted(Comparator.comparing(StockMovement::getDate).reversed()).limit(500).toList();
 }
}
