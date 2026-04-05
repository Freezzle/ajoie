package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
public class TaskCommentDTO implements Serializable {

    private UUID id;
    private UUID taskInstanceId;
    private String authorName;
    private String body;
    private Instant createdAt;
}
