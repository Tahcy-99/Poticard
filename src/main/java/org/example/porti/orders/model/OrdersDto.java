package org.example.porti.orders.model;

import lombok.Builder;
import lombok.Getter;

public class OrdersDto {

    @Builder
    @Getter
    public static class VerifyReq {
        private String paymentId;
        private String merchantUid;
        private String planCode;
        private String email;
        private int amount;
    }

    @Builder
    @Getter
    public static class OrdersRes {
        private Long ordersIdx;
        private boolean paid;

        public static OrdersRes from(Orders entity) {
            return OrdersRes.builder()
                    .ordersIdx(entity.getIdx())
                    .paid(entity.isPaid())
                    .build();
        }
    }
}