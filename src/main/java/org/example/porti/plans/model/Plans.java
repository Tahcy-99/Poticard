package org.example.porti.plans.model;

import jakarta.persistence.*;
import lombok.*;
import org.example.porti.utils.StringListConverter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Entity
public class Plans {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;
    private String name;      // 요금제 이름
    private int monthlyPrice; // 월간 가격
    private int yearlyPrice;  // 연간 가격

    @Convert(converter = StringListConverter.class)
    private List<String> benefits; // 요금제 혜택 리스트
}