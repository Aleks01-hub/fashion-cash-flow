package br.com.caixacentral.av;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contas-av")
public class AvController {
    private final AvService service;
    public AvController(AvService service) { this.service = service; }

    @GetMapping
    public List<AvService.AccountView> listAll() { return service.listAll(); }

    @GetMapping("/cliente/{customerId}")
    public List<AvService.AccountView> byCustomer(@PathVariable UUID customerId) {
        return service.byCustomer(customerId);
    }

    @GetMapping("/{accountId}")
    public AvService.AccountView get(@PathVariable UUID accountId) {
        return service.get(accountId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvService.AccountView create(@Valid @RequestBody AvService.CreateAccountRequest input) {
        return service.create(input);
    }

    @PostMapping("/{accountId}/abatimento")
    public AvService.AccountView registerPayment(@PathVariable UUID accountId,
                                                 @Valid @RequestBody AvService.PaymentRequest input) {
        return service.registerPayment(accountId, input);
    }
}
