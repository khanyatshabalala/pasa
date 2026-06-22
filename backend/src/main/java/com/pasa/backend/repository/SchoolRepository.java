package com.pasa.backend.repository;

import com.pasa.backend.domain.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchoolRepository extends JpaRepository<School, UUID> {
    List<School> findByProvince(String province);
    List<School> findByDistrict(String district);
    Optional<School> findByEmisNumber(String emisNumber);
    boolean existsByEmisNumber(String emisNumber);
}
