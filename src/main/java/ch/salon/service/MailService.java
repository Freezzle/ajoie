package ch.salon.service;

import static ch.salon.domain.enumeration.EmailTemplate.*;

import ch.salon.EmailData;
import ch.salon.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import tech.jhipster.config.JHipsterProperties;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private static final String USER = "user";
    private static final String BASE_URL = "baseUrl";

    private final JHipsterProperties jHipsterProperties;
    private final JavaMailSender javaMailSender;
    private final MessageSource messageSource;
    private final SpringTemplateEngine mailTemplateEngine;
    private final EventLogService eventLogService;

    public MailService(
        JHipsterProperties jHipsterProperties,
        JavaMailSender javaMailSender,
        MessageSource messageSource,
        @Qualifier("mailTemplateEngine") SpringTemplateEngine mailTemplateEngine,
        EventLogService eventLogService
    ) {
        this.jHipsterProperties = jHipsterProperties;
        this.javaMailSender = javaMailSender;
        this.messageSource = messageSource;
        this.mailTemplateEngine = mailTemplateEngine;
        this.eventLogService = eventLogService;
    }

    @Async
    public void sendCreationEmail(User user) {
        log.debug("Sending creation email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        EmailData emailData = new EmailData();
        emailData.setTemplate(CREATION_ACCOUNT_EMAIL);
        emailData.setContext(context);

        this.sendEmailSync(emailData, user.getEmail(), null);
    }

    @Async
    public void sendActivationEmail(User user) {
        log.debug("Sending activation email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        EmailData emailData = new EmailData();
        emailData.setTemplate(ACTIVATION_EMAIL);
        emailData.setContext(context);

        this.sendEmailSync(emailData, user.getEmail(), null);
    }

    @Async
    public void sendPasswordResetMail(User user) {
        log.debug("Sending password reset email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        EmailData emailData = new EmailData();
        emailData.setTemplate(RESET_PASSWORD_EMAIL);
        emailData.setContext(context);

        this.sendEmailSync(emailData, user.getEmail(), null);
    }

    @Async
    public void sendEmailAsync(EmailData emailData, String emailto, Object[] argsSubject) {
        this.sendEmailSync(emailData, emailto, argsSubject);
    }

    public void sendEmailSync(EmailData emailData, String emailto, Object[] argsSubject) {
        String content = mailTemplateEngine.process(emailData.getTemplate().getTemplateName(), emailData.getContext());
        String subject = messageSource.getMessage(emailData.getTemplate().getSubjectKey(), argsSubject, emailData.getContext().getLocale());

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper message = new MimeMessageHelper(
                mimeMessage,
                !emailData.getAttachments().isEmpty(),
                StandardCharsets.UTF_8.name()
            );
            // FIXME CHANGE THAT LATER
            message.setFrom("dylan.claude.work@gmail.com");

            // FIXME CHANGE THAT LATER, AVOID SENDING PROD
            message.setTo(emailto.contains("dylan") ? emailto : "dylan.claude.work@gmail.com");
            message.setSubject(subject);
            message.setText(content, true);

            for (Map.Entry<String, InputStreamSource> entry : emailData.getAttachments().entrySet()) {
                message.addAttachment(entry.getKey(), entry.getValue());
            }

            javaMailSender.send(mimeMessage);
            log.debug("Sent email to User '{}'", emailto);
        } catch (MailException | MessagingException e) {
            throw new MailSendException("Failed to send message for " + emailto, e);
        }
    }
}
