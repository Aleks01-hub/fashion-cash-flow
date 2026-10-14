package br.com.caixacentral.sale;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface SaleNumberSequenceRepository extends JpaRepository<SaleNumberSequence, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SaleNumberSequence s where s.id = 1")
    Optional<SaleNumberSequence> lockSequence();
}
