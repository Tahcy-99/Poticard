package org.example.porti.plans;

import lombok.RequiredArgsConstructor;
import org.example.porti.common.model.BaseResponse;
import org.example.porti.plans.model.PlansDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/plan")
@RestController
@RequiredArgsConstructor
public class PlansController {
    private final PlansService planService;

    @GetMapping("/list")
    public ResponseEntity list() {
        List<PlansDto.Res> plans = planService.list();
        return ResponseEntity.ok(BaseResponse.success(plans));
    }
}