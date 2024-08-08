package ch.salon.service;

import static ch.salon.service.enumeration.EmailTemplateEnum.*;

import ch.salon.domain.*;
import ch.salon.service.enumeration.EmailTemplateEnum;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
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
    private final SpringTemplateEngine templateEngine;

    public MailService(
        JHipsterProperties jHipsterProperties,
        JavaMailSender javaMailSender,
        MessageSource messageSource,
        SpringTemplateEngine templateEngine
    ) {
        this.jHipsterProperties = jHipsterProperties;
        this.javaMailSender = javaMailSender;
        this.messageSource = messageSource;
        this.templateEngine = templateEngine;
    }

    public void sendInvoiceMail(Salon salon, Exponent exponent, InvoicingPlan invoicingPlan) {
        log.debug("Sending invoice email to '{}'", exponent.getEmail());

        Context context = new Context(Locale.FRENCH);
        context.setVariable("salon", salon.getPlace());
        context.setVariable("billingNumber", invoicingPlan.getBillingNumber());
        context.setVariable("fullName", exponent.getFullName());
        context.setVariable("startDate", DateUtils.instantToIso(salon.getStartingDate()));
        context.setVariable("endDate", DateUtils.instantToIso(salon.getEndingDate()));

        Object[] args = { invoicingPlan.getBillingNumber(), salon.getPlace() };

        this.sendEmailFromTemplateSync(context, exponent.getEmail(), INVOICE_EMAIL, args);
    }

    @Async
    public void sendActivationEmail(User user) {
        log.debug("Sending activation email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        this.sendEmailFromTemplateSync(context, user.getEmail(), ACTIVATION_EMAIL, null);
    }

    @Async
    public void sendCreationEmail(User user) {
        log.debug("Sending creation email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        this.sendEmailFromTemplateSync(context, user.getEmail(), CREATION_ACCOUNT_EMAIL, null);
    }

    @Async
    public void sendPasswordResetMail(User user) {
        log.debug("Sending password reset email to '{}'", user.getEmail());

        Context context = new Context(Locale.forLanguageTag(user.getLangKey()));
        context.setVariable(USER, user);
        context.setVariable(BASE_URL, jHipsterProperties.getMail().getBaseUrl());

        this.sendEmailFromTemplateSync(context, user.getEmail(), REST_PASSWORD_EMAIL, null);
    }

    private void sendEmailFromTemplateSync(Context context, String emailto, EmailTemplateEnum template, Object[] argsSubject) {
        String content = templateEngine.process(template.getTemplateName(), context);
        String subject = messageSource.getMessage(template.getSubjectKey(), argsSubject, context.getLocale());

        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            message.setFrom("dylan.claude.work@gmail.com"); // FIXME CHANGE THAT LATER
            message.setTo(emailto.contains("dylan") ? emailto : "dylan.claude.work@gmail.com"); // FIXME CHANGE THAT LATER, AVOID SENDING PROD
            message.setSubject(subject);
            message.setText(content, true);

            // FIXME : TO REMOVE
            File file = new File("email.eml");
            try (FileOutputStream fos = new FileOutputStream(file)) {
                mimeMessage.writeTo(fos);
            } catch (Exception e) {}

            javaMailSender.send(mimeMessage);
            log.debug("Sent email to User '{}'", emailto);
        } catch (MailException | MessagingException e) {
            throw new MailSendException("Failed to send message for " + emailto, e);
        }
    }
}
