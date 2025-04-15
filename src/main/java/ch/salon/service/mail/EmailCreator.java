package ch.salon.service.mail;

import ch.salon.service.handlers.EmailMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.context.MessageSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import static java.nio.charset.StandardCharsets.UTF_8;

@Component
public class EmailCreator {

    private final JavaMailSender javaMailSender;
    private final SpringTemplateEngine mailTemplateEngine;
    private final MessageSource messageSource;

    public EmailCreator(JavaMailSender javaMailSender, SpringTemplateEngine mailTemplateEngine,
                        MessageSource messageSource) {
        this.javaMailSender = javaMailSender;
        this.mailTemplateEngine = mailTemplateEngine;
        this.messageSource = messageSource;
    }

    public String getTranslatedText(String subjectKey, Locale locale, Object... args) {
        Locale definedLocale = locale != null ? locale : Locale.FRENCH;
        return this.messageSource.getMessage(subjectKey, args, definedLocale);
    }

    public String getContentHtml(String templateName, Context context) {
        return mailTemplateEngine.process(templateName, context);
    }

    @Async
    public void sendAsync(EmailMessage emailMessage) throws Exception {
        this.send(emailMessage, null);
    }

    @Async
    public void sendAsync(EmailMessage emailMessage, Map<String, InputStreamSource> attachments) throws Exception {
        this.send(emailMessage, attachments);
    }

    public void send(EmailMessage emailMessage) throws Exception {
        this.send(emailMessage, null);
    }

    public void send(EmailMessage emailMessage, Map<String, InputStreamSource> attachments) throws Exception {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            attachments = attachments != null && !attachments.isEmpty() ? attachments : new HashMap<>();

            MimeMessageHelper message = getMimeMessageHelper(mimeMessage, !attachments.isEmpty(), emailMessage);

            for (Map.Entry<String, InputStreamSource> entry : attachments.entrySet()) {
                message.addAttachment(entry.getKey(), entry.getValue());
            }

            javaMailSender.send(mimeMessage);
        } catch (MailException | MessagingException e) {
            throw new MailSendException("Failed to send message for " + emailMessage.getTo(), e);
        }
    }

    private MimeMessageHelper getMimeMessageHelper(MimeMessage mimeMessage, boolean withAttachments,
                                                   EmailMessage emailMessage) throws MessagingException, IOException {
        MimeMessageHelper message = new MimeMessageHelper(mimeMessage, true, UTF_8.name());

        // FIXME CHANGE THAT LATER
        message.setFrom(emailMessage.getFrom());

        // FIXME CHANGE THAT LATER, AVOID SENDING PROD
        message.setTo(emailMessage.getTo().contains("dylan") ? emailMessage.getTo() : "dylan.claude.work@gmail.com");
        message.setSubject(emailMessage.getSubject());
        message.setText(emailMessage.getBody(), true);
        message.addInline("logo_salon", new ClassPathResource("images/logo_salon.jpg").getFile());
        return message;
    }
}
