package br.com.caixacentral.av;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvAccountRepository extends JpaRepository<AvAccount, UUID> {
    List<AvAccount> findByCustomer_IdOrderByCreatedAtDesc(UUID customerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AvAccount a join fetch a.customer where a.id = :id")
    Optional<AvAccount> findByIdForUpdate(@Param("id") UUID id);
}
