package br.com.caixacentral.av;

import br.com.caixacentral.customer.Customer;
import br.com.caixacentral.customer.CustomerRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AvService {
    private final AvAccountRepository accounts;
    private final AvPaymentRepository payments;
    private final CustomerRepository customers;

    public AvService(AvAccountRepository accounts, AvPaymentRepository payments, CustomerRepository customers) {
        this.accounts = accounts;
        this.payments = payments;
        this.customers = customers;
    }

    public record CreateAccountRequest(UUID customerId, String description, BigDecimal amount, LocalDate dueDate) {}
    public record PaymentRequest(BigDecimal amount, AvPayment.Method method, String notes) {}
    public record PaymentView(UUID id, BigDecimal amount, BigDecimal balanceBefore, BigDecimal balanceAfter,
                              AvPayment.Method method, Instant paidAt, String notes) {}
    public record AccountView(UUID id, UUID customerId, String customerName, String description,
                              BigDecimal originalAmount, BigDecimal currentBalance, Instant createdAt,
                              LocalDate dueDate, AvAccount.Status status, List<PaymentView> payments) {}

    @Transactional
    public AccountView create(CreateAccountRequest input) {
        if (input == null || input.customerId() == null || input.description() == null ||
            input.description().isBlank() || input.amount() == null || input.amount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe cliente, descrição e valor positivo.");
        }
        Customer customer = customers.findById(input.customerId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));
        BigDecimal amount = money(input.amount());
        AvAccount account = new AvAccount();
        account.setCustomer(customer);
        account.setDescription(input.description().trim());
        account.setOriginalAmount(amount);
        account.setCurrentBalance(amount);
        account.setDueDate(input.dueDate());
        account.setStatus(input.dueDate() != null && input.dueDate().isBefore(LocalDate.now())
            ? AvAccount.Status.OVERDUE : AvAccount.Status.ACTIVE);
        return view(accounts.save(account), List.of());
    }

    @Transactional
    public AccountView registerPayment(UUID accountId, PaymentRequest input) {
        if (input == null || input.amount() == null || input.amount().signum() <= 0 || input.method() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor positivo e a forma de pagamento.");
        }
        AvAccount account = accounts.findByIdForUpdate(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta AV não encontrada."));
        BigDecimal amount = money(input.amount());
        BigDecimal before = money(account.getCurrentBalance());
        if (amount.compareTo(before) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pagamento não pode ser maior que o saldo devedor.");
        }
        BigDecimal after = before.subtract(amount).setScale(2, RoundingMode.HALF_UP);
        AvPayment payment = new AvPayment();
        payment.setAccount(account);
        payment.setAmount(amount);
        payment.setBalanceBefore(before);
        payment.setBalanceAfter(after);
        payment.setMethod(input.method());
        payment.setNotes(input.notes());
        payments.save(payment);

        account.setCurrentBalance(after);
        account.setStatus(after.signum() == 0 ? AvAccount.Status.PAID
            : account.getDueDate() != null && account.getDueDate().isBefore(LocalDate.now())
                ? AvAccount.Status.OVERDUE : AvAccount.Status.ACTIVE);
        accounts.save(account);
        return view(account, payments.findByAccount_IdOrderByPaidAtDesc(accountId).stream().map(AvService::paymentView).toList());
    }

    @Transactional
    public List<AccountView> byCustomer(UUID customerId) {
        if (!customers.existsById(customerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado.");
        }
        return accounts.findByCustomer_IdOrderByCreatedAtDesc(customerId).stream()
            .map(a -> view(a, payments.findByAccount_IdOrderByPaidAtDesc(a.getId()).stream().map(AvService::paymentView).toList()))
            .toList();
    }

    @Transactional
    public AccountView get(UUID accountId) {
        AvAccount account = accounts.findById(accountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta AV não encontrada."));
        return view(account, payments.findByAccount_IdOrderByPaidAtDesc(accountId).stream().map(AvService::paymentView).toList());
    }

    private static BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
    private static PaymentView paymentView(AvPayment p) {
        return new PaymentView(p.getId(), p.getAmount(), p.getBalanceBefore(), p.getBalanceAfter(),
            p.getMethod(), p.getPaidAt(), p.getNotes());
    }
    private static AccountView view(AvAccount a, List<PaymentView> history) {
        return new AccountView(a.getId(), a.getCustomer().getId(), a.getCustomer().getName(), a.getDescription(),
            a.getOriginalAmount(), a.getCurrentBalance(), a.getCreatedAt(), a.getDueDate(), a.getStatus(), history);
    }
}
