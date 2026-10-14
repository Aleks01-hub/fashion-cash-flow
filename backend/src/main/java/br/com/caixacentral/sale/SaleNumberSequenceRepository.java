package br.com.caixacentral.sale;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SaleNumberSequenceRepository extends JpaRepository<SaleNumberSequence, Long> {
    /** Creates the sequence only once, starting after the highest existing sale number. */
    @Modifying
    @Query(value = "INSERT IGNORE INTO sale_number_sequence (id, next_number) SELECT 1, COALESCE(MAX(number), 0) + 1 FROM sales", nativeQuery = true)
    int ensureSequenceExists();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SaleNumberSequence s where s.id = 1")
    java.util.Optional<SaleNumberSequence> lockSequence();
}
