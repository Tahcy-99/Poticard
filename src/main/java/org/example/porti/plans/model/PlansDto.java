package org.example.porti.plans.model;

import lombok.*;
import java.util.List;

public class PlansDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Res {
        private Long idx;
        private String name;
        private int monthlyPrice;
        private int yearlyPrice;
        private List<String> benefits;

        public static Res from(Plans entity) {
            return Res.builder()
                    .idx(entity.getIdx())
                    .name(entity.getName())
                    .monthlyPrice(entity.getMonthlyPrice())
                    .yearlyPrice(entity.getYearlyPrice())
                    .benefits(entity.getBenefits())
                    .build();
        }
    }
}