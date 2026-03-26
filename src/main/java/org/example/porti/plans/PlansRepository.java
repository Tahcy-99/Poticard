package org.example.porti.plans;

import org.example.porti.plans.model.Plans;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlansRepository extends JpaRepository<Plans, Long> {
}