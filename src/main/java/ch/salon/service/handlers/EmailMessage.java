package ch.salon.service.handlers;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class EmailMessage {
    private String from;
    private String to;
    private List<String> bcc = new ArrayList<>();
    private Integer recipientsCount;
    private String subject;
    private String body;
    private List<EmailAttachment> attachments = new ArrayList<>();
}