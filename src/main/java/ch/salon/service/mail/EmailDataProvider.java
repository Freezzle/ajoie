package ch.salon.service.mail;

import org.thymeleaf.context.Context;

public interface EmailDataProvider {
    Context getContext();
}
