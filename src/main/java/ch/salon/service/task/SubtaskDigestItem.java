package ch.salon.service.task;

import lombok.Value;

@Value
public class SubtaskDigestItem {
    String title;
    String taskTitle;
    String description;
    String responsible;
    String statusLabel;
    String dueLabel;
}
