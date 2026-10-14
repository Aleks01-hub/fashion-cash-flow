package br.com.caixacentral.sale;

import br.com.caixacentral.product.Product;
import br.com.caixacentral.product.ProductRepository;
import br.com.caixacentral.product.Variation;
import br.com.caixacentral.product.VariationRepository;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class SaleService {
    private final SaleRepository sales;
    private final ProductRepository products;
    private final VariationRepository variations;
    private final ApplicationEventPublisher events;\n    private final SaleNumberSequenceRepository numberSequences;

    public SaleService(SaleRepository sales, ProductRepository products,
                       VariationRepository variations, ApplicationEventPublisher events,\n                       SaleNumberSequenceRepository numberSequences) {
        this.sales = sales;
        this.products = products;
        this.variations = variations;
        this.events = events;\n        this.numberSequences = numberSequences;
    }

    @Transactional
    public Sale create(Sale sale) {
        if (sale.getItems() == null || sale.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A venda precisa ter ao menos um item");
        }
        if (sale.getDiscount() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Desconto não pode ser negativo");
        double subtotal = 0;
        Set<String> requested = new HashSet<>();
        for (SaleItem item : sale.getItems()) {
            if (item.getQuantity() <= 0 || item.getUnitPrice() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade e preço inválidos");
            }
            Variation variation = findAndLockVariation(item);
            if (!requested.add(variation.getId().toString())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Envie cada variação apenas uma vez por venda");
            }
            if (variation.getQuantity() < item.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Estoque insuficiente para " + variation.getColor() + " / " + variation.getSize());
            }
            variation.setQuantity(variation.getQuantity() - item.getQuantity());
            variations.save(variation);
            Product product = products.findById(variation.getProductId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
            item.setProductId(product.getId());
            item.setVariationId(variation.getId());
            item.setProductName(product.getName());
            item.setColor(variation.getColor());
            item.setSize(variation.getSize());
            item.setTotal(roundMoney(item.getUnitPrice() * item.getQuantity()));
            subtotal += item.getTotal();
            item.setSale(sale);
        }
        if (sale.getDiscount() > subtotal) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Desconto maior que o subtotal");
        sale.setSubtotal(roundMoney(subtotal));
        sale.setTotal(roundMoney(subtotal - sale.getDiscount()));
        if (sale.getAmountPaid() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor recebido inválido");
        if (sale.getDate() == null) sale.setDate(Instant.now());
        // Número sequencial provisório para MVP; substituir por sequência atômica antes de vendas concorrentes.
        if (sale.getNumber() <= 0) sale.setNumber(sales.count() + 1);
        Sale saved = sales.save(sale);
        events.publishEvent(SaleCreatedEvent.from(saved));
        return saved;
    }

    private Variation findAndLockVariation(SaleItem item) {
        if (item.getVariationId() != null) {
            return variations.findByIdForUpdate(item.getVariationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variação não encontrada"));
        }
        if (item.getProductId() == null || item.getColor() == null || item.getSize() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe variationId ou productId, color e size em cada item");
        }
        return variations.findByProductAndColorAndSizeForUpdate(item.getProductId(), item.getColor(), item.getSize())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variação não encontrada para produto/cor/tamanho"));
    }

    private double roundMoney(double value) { return Math.round((value + 1e-9) * 100.0) / 100.0; }
}
