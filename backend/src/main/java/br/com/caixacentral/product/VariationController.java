package br.com.caixacentral.product;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/products/{productId}/variations")
public class VariationController {
    private final VariationRepository variations;
    private final ProductRepository products;

    public VariationController(VariationRepository variations, ProductRepository products) {
        this.variations = variations;
        this.products = products;
    }

    public record VariationRequest(@NotBlank String color, @NotBlank String size,
                                   @Min(0) int quantity, @Min(0) int minStock) {}
    public record StockAdjustment(@Min(1) int quantity, @NotBlank String operation) {}

    @GetMapping
    public List<Variation> list(@PathVariable UUID productId) {
        if (!products.existsById(productId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        return variations.findByProductId(productId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Variation create(@PathVariable UUID productId, @Valid @RequestBody VariationRequest input) {
        if (!products.existsById(productId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado");
        if (variations.findByProductIdAndColorIgnoreCaseAndSizeIgnoreCase(productId, input.color(), input.size()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe uma variação com essa cor e tamanho");
        }
        return variations.save(new Variation(productId, input.color().trim(), input.size().trim(), input.quantity(), input.minStock()));
    }

    @PatchMapping("/{variationId}/stock")
    @Transactional
    public Variation adjustStock(@PathVariable UUID productId, @PathVariable UUID variationId,
                                 @Valid @RequestBody StockAdjustment input) {
        Variation variation = variations.findByIdForUpdate(variationId)
            .filter(v -> v.getProductId().equals(productId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variação não encontrada"));
        int updated;
        if ("entrada".equalsIgnoreCase(input.operation())) updated = variation.getQuantity() + input.quantity();
        else if ("saida".equalsIgnoreCase(input.operation())) updated = variation.getQuantity() - input.quantity();
        else throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Operação deve ser entrada ou saida");
        if (updated < 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Estoque insuficiente");
        variation.setQuantity(updated);
        return variations.save(variation);
    }
}
