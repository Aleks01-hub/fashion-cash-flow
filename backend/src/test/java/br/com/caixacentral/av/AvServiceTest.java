package br.com.caixacentral.av;

import br.com.caixacentral.customer.Customer;
import br.com.caixacentral.customer.CustomerRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AvServiceTest {
    private AvAccountRepository accounts;
    private AvPaymentRepository payments;
    private CustomerRepository customers;
    private AvService service;
    private AvAccount account;
    private UUID accountId;

    @BeforeEach
    void setUp() {
        accounts = mock(AvAccountRepository.class);
        payments = mock(AvPaymentRepository.class);
        customers = mock(CustomerRepository.class);
        service = new AvService(accounts, payments, customers);
        accountId = UUID.randomUUID();

        Customer customer = mock(Customer.class);
        when(customer.getId()).thenReturn(UUID.randomUUID());
        when(customer.getName()).thenReturn("Cliente de teste");

        account = new AvAccount();
        account.setCustomer(customer);
        account.setDescription("Compra de roupas");
        account.setOriginalAmount(new BigDecimal("80.00"));
        account.setCurrentBalance(new BigDecimal("80.00"));
        account.setDueDate(LocalDate.now().plusDays(30));
        account.setStatus(AvAccount.Status.ACTIVE);

        when(accounts.findByIdForUpdate(accountId)).thenReturn(Optional.of(account));
        when(accounts.save(any(AvAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(payments.save(any(AvPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(payments.findByAccount_IdOrderByPaidAtDesc(accountId)).thenReturn(List.of());
    }

    @Test
    void registerPartialPaymentReducesBalanceAndKeepsAccountOpen() {
        AvService.AccountView result = service.registerPayment(accountId,
            new AvService.PaymentRequest(new BigDecimal("25.50"), AvPayment.Method.PIX, "Entrada"));

        assertEquals(new BigDecimal("54.50"), result.currentBalance());
        assertEquals(AvAccount.Status.ACTIVE, result.status());
        verify(payments).save(argThat(payment ->
            payment.getAmount().compareTo(new BigDecimal("25.50")) == 0
                && payment.getBalanceBefore().compareTo(new BigDecimal("80.00")) == 0
                && payment.getBalanceAfter().compareTo(new BigDecimal("54.50")) == 0));
    }

    @Test
    void fullPaymentMarksAccountAsPaid() {
        AvService.AccountView result = service.registerPayment(accountId,
            new AvService.PaymentRequest(new BigDecimal("80.00"), AvPayment.Method.CASH, null));

        assertEquals(new BigDecimal("0.00"), result.currentBalance());
        assertEquals(AvAccount.Status.PAID, result.status());
    }

    @Test
    void paymentGreaterThanBalanceIsRejectedWithoutSavingPayment() {
        assertThrows(ResponseStatusException.class, () -> service.registerPayment(accountId,
            new AvService.PaymentRequest(new BigDecimal("80.01"), AvPayment.Method.PIX, null)));

        verify(payments, never()).save(any(AvPayment.class));
        assertEquals(new BigDecimal("80.00"), account.getCurrentBalance());
    }

    @Test
    void zeroOrNegativePaymentIsRejected() {
        assertThrows(ResponseStatusException.class, () -> service.registerPayment(accountId,
            new AvService.PaymentRequest(BigDecimal.ZERO, AvPayment.Method.PIX, null)));
        assertThrows(ResponseStatusException.class, () -> service.registerPayment(accountId,
            new AvService.PaymentRequest(new BigDecimal("-1.00"), AvPayment.Method.PIX, null)));
        verify(accounts, never()).findByIdForUpdate(any());
    }
}
