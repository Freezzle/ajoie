package ch.salon.service.handlers;

import java.util.UUID;

public record EmailAttachment(String filename, String contextCode, UUID contextId){
}
