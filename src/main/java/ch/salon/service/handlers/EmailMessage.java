package ch.salon.service.handlers;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class EmailMessage {
    private String from;
    private String to;
    private String subject;
    private String body;
    private List<EmailAttachment> attachments = new ArrayList<>();
}