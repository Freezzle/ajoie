package ch.salon.service.dto;

import ch.salon.service.duplicate.DuplicateMatchCriterion;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
public class DuplicateCandidateDTO {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String homeCity;
    private String homePostalCode;
    private Instant registrationDate;
    private long participationsCount;
    private boolean suggested;
    private List<DuplicateMatchCriterion> criteria;
}
