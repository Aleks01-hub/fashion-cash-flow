package br.com.caixacentral.stock;

import br.com.caixacentral.product.Product;
import br.com.caixacentral.product.ProductRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/stock")
public class StockController {
 private final StockMovementRepository movements;
 private final ProductRepository products;
 private final ObjectMapper mapper;
 public StockController(StockMovementRepository movements, ProductRepository products, ObjectMapper mapper) {
  this.movements=movements; this.products=products; this.mapper=mapper;
 }
 @GetMapping("/movements") public List<StockMovement> allMovements(){
  return movements.findAll().stream().sorted(Comparator.comparing(StockMovement::getDate).reversed()).limit(500).toList();
 }
 @PostMapping("/adjustments") @ResponseStatus(HttpStatus.CREATED) @Transactional
 public StockMovement adjust(@RequestBody Adjustment request) {
  if(request.productId()==null || request.quantity()==0 || request.color()==null || request.size()==null)
   throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Informe produto, cor, tamanho e quantidade diferente de zero.");
  Product product=products.findById(request.productId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Produto não encontrado."));
  List<Map<String,Object>> variations;
  try { variations=mapper.readValue(product.getVariationsJson()==null?"[]":product.getVariationsJson(),new TypeReference<List<Map<String,Object>>>(){}); }
  catch(Exception ex){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Não foi possível ler o estoque.");}
  Map<String,Object> variation=variations.stream().filter(v->Objects.equals(String.valueOf(v.get("color")),request.color())&&Objects.equals(String.valueOf(v.get("size")),request.size())).findFirst()
   .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Variação não encontrada."));
  int current=variation.get("qty") instanceof Number n?n.intValue():0;
  if(current+request.quantity()<0) throw new ResponseStatusException(HttpStatus.CONFLICT,"O ajuste deixaria o estoque negativo.");
  variation.put("qty",current+request.quantity());
  try {product.setVariationsJson(mapper.writeValueAsString(variations));}
  catch(Exception ex){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Não foi possível salvar o estoque.");}
  products.save(product);
  StockMovement movement=new StockMovement();
  movement.setDate(Instant.now()); movement.setType(request.type()==null?"ajuste":request.type());
  movement.setProductId(product.getId()); movement.setProductName(product.getName()); movement.setColor(request.color());
  movement.setSize(request.size()); movement.setQuantity(request.quantity()); movement.setNote(request.note());
  return movements.save(movement);
 }
 public record Adjustment(UUID productId,String color,String size,int quantity,String type,String note){}
}
