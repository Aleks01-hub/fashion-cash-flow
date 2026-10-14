package br.com.caixacentral.product;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VariationRepository extends JpaRepository<Variation, UUID> {
    List<Variation> findByProductId(UUID productId);
    Optional<Variation> findByProductIdAndColorIgnoreCaseAndSizeIgnoreCase(UUID productId, String color, String size);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Variation v where v.id = :id")
    Optional<Variation> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Variation v where v.productId = :productId and lower(v.color) = lower(:color) and lower(v.size) = lower(:size)")
    Optional<Variation> findByProductAndColorAndSizeForUpdate(
        @Param("productId") UUID productId,
        @Param("color") String color,
        @Param("size") String size
    );
}
