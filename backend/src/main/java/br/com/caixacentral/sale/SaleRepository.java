package br.com.caixacentral.sale;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, UUID> {
}
