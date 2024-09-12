package ch.salon.web.rest.dto;

import ch.salon.domain.enumeration.Status;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class SalonStatistiques implements Serializable {

    private final Map<Status, Long> participationsStates = new HashMap<>();
    private final Map<Status, Long> standsStates = new HashMap<>();
    private final Map<Status, Long> conferencesStates = new HashMap<>();
    private final Map<String, Long> dimensionsStates = new HashMap<>();

    private final Map<String, Long> mealsStatesFromAcceptedParticipation = new HashMap<>();
    private final Map<String, Long> dimensionsStatesFromAcceptedParticipation = new HashMap<>();

    private final long receivedIncomeFromAcceptedParticipation = 0;
    private final long expectedIncomeFromAcceptedParticipation = 0;
    private final long expectedIncomeAtAll = 0;
}
