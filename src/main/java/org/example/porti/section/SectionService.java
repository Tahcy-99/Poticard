package org.example.porti.section;

import lombok.RequiredArgsConstructor;
import org.example.porti.section.model.Section;
import org.example.porti.section.model.SectionDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SectionService {
    private final SectionRepository sectionRepository;

    @Transactional(readOnly = true)
    public List<SectionDto.Res> getSectionList(Long portfolioIdx) {
        List<Section> sections = sectionRepository.findByPortfolioIdxOrderBySectionOrder(portfolioIdx);
        return sections.stream()
                .map(SectionDto.Res::from)
                .toList();
    }

    @Transactional
    public void updateSection(Long sectionIdx, SectionDto.Req updateReq) {
        Section section = sectionRepository.findById(sectionIdx)
                .orElseThrow(() -> new RuntimeException("섹션을 찾을 수 없습니다."));

        section.setSectionTitle(updateReq.getSectionTitle());
        section.setContents(updateReq.getContents());
    }
}