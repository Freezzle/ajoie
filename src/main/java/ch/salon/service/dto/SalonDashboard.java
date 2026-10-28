package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;
import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class SalonDashboard implements Serializable {
    private List<DatedAmount> payments;
    private Map<String, Map<Status, Long>> statusCounts;
    private long loyalReturning;
    private long loyalNew;
    private Map<String, Double> revenueByService;
    private DelayStats paymentDelay;
    private DelayStats verificationDelay;
    private Map<String, Long> billingProgress;
    private Aging receivables;
    private List<UUID> confirmedStandIds;
    private List<UUID> confirmedTalkIds;
}
