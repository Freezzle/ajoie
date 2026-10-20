package ch.salon.domain;

import lombok.Data;

@Data
public class TalkTypeConfig {
    private int durationTalkMinutes;
    private int preparationMinutes;
    private int cleanupMinutes;
}
