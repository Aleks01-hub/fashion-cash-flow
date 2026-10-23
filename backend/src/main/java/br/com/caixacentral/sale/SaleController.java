package br.com.caixacentral.sale;

import br.com.caixacentral.product.Product;
import br.com.caixacentral.product.ProductRepository;
import br.com.caixacentral.stock.StockMovement;
import br.com.caixacentral.stock.StockMovementRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
    private final SaleRepository repository;
    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final ObjectMapper mapper;

    public SaleController(SaleRepository repository, ProductRepository products,
                          StockMovementRepository movements, ObjectMapper mapper) {
        this.repository = repository;
        this.products = products;
        this.movements = movements;
        this.mapper = mapper;
    }

    @GetMapping
    public List<Sale> all() {
        return repository.findAll().stream()
            .sorted(Comparator.comparing(Sale::getDate, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
    }

    @GetMapping("/{id}")
    public Sale one(@PathVariable UUID id) {
        return repository.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda não encontrada."));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Sale create(@RequestBody Sale sale) {
        if (sale.getItems() == null || sale.getItems().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A venda precisa ter pelo menos um item.");

        // Group identical product/colour/size lines before validating stock to
        // prevent two lines from overselling the same variation.
        Map<String, Integer> requested = new LinkedHashMap<>();
        Map<String, SaleItem> firstLine = new LinkedHashMap<>();
        for (SaleItem item : sale.getItems()) {
            if (item.getProductId() == null || item.getQuantity() <= 0 || item.getUnitPrice() < 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item de venda inválido.");
            String key = item.getProductId() + "|" + safe(item.getColor()) + "|" + safe(item.getSize());
            requested.merge(key, item.getQuantity(), Integer::sum);
            firstLine.putIfAbsent(key, item);
        }

        Map<UUID, Product> changedProducts = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> entry : requested.entrySet()) {
            SaleItem item = firstLine.get(entry.getKey());
            Product product = products.findById(item.getProductId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado: " + item.getProductName()));
            if (product.isInactive())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "O produto " + product.getName() + " está inativo.");
            List<Map<String, Object>> variations = readVariations(product.getVariationsJson());
            Map<String, Object> variation = variations.stream().filter(v ->
                Objects.equals(safe(v.get("color")), safe(item.getColor())) &&
                Objects.equals(safe(v.get("size")), safe(item.getSize()))).findFirst().orElseThrow(() ->
                new ResponseStatusException(HttpStatus.CONFLICT, "Variação não encontrada: " + product.getName() + " / " + item.getColor() + " / " + item.getSize()));
            int available = number(variation.get("qty"));
            if (available < entry.getValue())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Estoque insuficiente para " + product.getName() + " (" + item.getColor() + " / " + item.getSize() + "). Disponível: " + available);
            variation.put("qty", available - entry.getValue());
            product.setVariationsJson(writeVariations(variations));
            changedProducts.put(product.getId(), product);

            StockMovement movement = new StockMovement();
            movement.setDate(Instant.now());
            movement.setType("venda");
            movement.setProductId(product.getId());
            movement.setProductName(product.getName());
            movement.setColor(item.getColor());
            movement.setSize(item.getSize());
            movement.setQuantity(-entry.getValue());
            movement.setNote("Venda " + (sale.getNumber() > 0 ? "#" + sale.getNumber() : "pendente"));
            movements.save(movement);
        }

        products.saveAll(changedProducts.values());
        sale.setDate(sale.getDate() == null ? Instant.now() : sale.getDate());
        if (sale.getNumber() <= 0)
            sale.setNumber(repository.findTopByOrderByNumberDesc().map(s -> s.getNumber() + 1).orElse(1001L));
        sale.setPaymentStatus("Ficha (AV)".equals(sale.getPaymentMethod()) && sale.getAmountPaid() < sale.getTotal() ? "pendente" : "pago");
        sale.getItems().forEach(item -> item.setSale(sale));
        return repository.save(sale);
    }

    private List<Map<String, Object>> readVariations(String json) {
        try { return mapper.readValue(json == null || json.isBlank() ? "[]" : json, new TypeReference<List<Map<String, Object>>>() {}); }
        catch (Exception ex) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível ler as variações de estoque."); }
    }
    private String writeVariations(List<Map<String, Object>> variations) {
        try { return mapper.writeValueAsString(variations); }
        catch (Exception ex) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível atualizar o estoque."); }
    }
    private static String safe(Object value) { return value == null ? "" : String.valueOf(value); }
    private static int number(Object value) {
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception ex) { return 0; }
    }
}
