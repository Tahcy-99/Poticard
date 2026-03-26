package org.example.porti.plans;

import lombok.RequiredArgsConstructor;
import org.example.porti.plans.model.Plans;
import org.example.porti.plans.model.PlansDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlansService {
    private final PlansRepository planRepository;

    @Transactional(readOnly = true)
    public List<PlansDto.Res> list() {
        List<Plans> planList = planRepository.findAll();
        return planList.stream().map(PlansDto.Res::from).toList();
    }
}