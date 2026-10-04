package br.com.caixacentral.customer;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerRepository repository;
    public CustomerController(CustomerRepository repository){this.repository=repository;}

    @GetMapping public List<Customer> all(){return repository.findAll();}
    @GetMapping("/{id}") public Customer one(@PathVariable UUID id){return repository.findById(id).orElseThrow();}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Customer create(@Valid @RequestBody Customer customer){return repository.save(customer);}
    @PutMapping("/{id}") public Customer update(@PathVariable UUID id,@Valid @RequestBody Customer input){
        Customer current=repository.findById(id).orElseThrow();
        current.setName(input.getName()); current.setWhatsapp(input.getWhatsapp()); current.setCpf(input.getCpf());
        current.setAddress(input.getAddress()); current.setPreferredSize(input.getPreferredSize()); current.setBirthDate(input.getBirthDate());
        current.setNotes(input.getNotes()); current.setAvTotal(input.getAvTotal()); current.setAvBalance(input.getAvBalance()); current.setAvDueDate(input.getAvDueDate());
        return repository.save(current);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable UUID id){repository.deleteById(id);}
}
