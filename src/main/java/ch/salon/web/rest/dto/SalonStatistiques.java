package ch.salon.web.rest.dto;

import ch.salon.domain.enumeration.Status;
import java.awt.*;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SalonStatistiques implements Serializable {

    private Map<Status, Long> participationsStates = new HashMap<>();
    private Map<Status, Long> standsStates = new HashMap<>();
    private Map<Status, Long> conferencesStates = new HashMap<>();
    private Map<String, Long> dimensionsStates = new HashMap<>();

    private Map<String, Long> mealsStatesFromAcceptedParticipation = new HashMap<>();
    private Map<String, Long> dimensionsStatesFromAcceptedParticipation = new HashMap<>();

    private long receivedIncomeFromAcceptedParticipation = 0;
    private long expectedIncomeFromAcceptedParticipation = 0;
    private long expectedIncomeAtAll = 0;
}
