package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class DelayStats implements Serializable {
    private Double medianDays;
    private List<Long> buckets;
}
