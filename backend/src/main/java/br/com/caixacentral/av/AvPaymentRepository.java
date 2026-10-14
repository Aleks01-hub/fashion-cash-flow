package br.com.caixacentral.av;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvPaymentRepository extends JpaRepository<AvPayment, UUID> {
    List<AvPayment> findByAccount_IdOrderByPaidAtDesc(UUID accountId);
}
