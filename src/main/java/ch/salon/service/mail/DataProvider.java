package ch.salon.service.mail;

import org.thymeleaf.context.Context;

public interface DataProvider {
    Context getContext();

    String getTemplateName();
}
