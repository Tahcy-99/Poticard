package org.example.porti.section;

import org.example.porti.section.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByPortfolioIdxOrderBySectionOrder(Long portfolioIdx);
}
