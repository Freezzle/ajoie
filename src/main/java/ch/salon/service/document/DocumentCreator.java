package ch.salon.service.document;

import com.lowagie.text.pdf.BaseFont;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.w3c.tidy.Tidy;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;

@Component
public class DocumentCreator {

    private final SpringTemplateEngine documentTemplateEngine;

    public DocumentCreator(@Qualifier("documentTemplateEngine") SpringTemplateEngine documentTemplateEngine) {
        this.documentTemplateEngine = documentTemplateEngine;
    }

    public InputStreamSource generate(IDocumentCreatorContract instance) throws Exception {
        // Populate template HTML with data
        String renderedHtmlContent = documentTemplateEngine.process(instance.getTemplateName(), instance.getContext());
        // Convert HTML to XHTML
        String xHtml = convertToXhtml(renderedHtmlContent);

        ITextRenderer renderer = new ITextRenderer();
        renderer.getFontResolver()
                .addFont("/templates/document/common/Code39.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

        // Fill styles & co in the XHTML
        String baseUrl = FileSystems.getDefault()
                                    .getPath("src", "main", "resources", "templates", "document", "common")
                                    .toUri()
                                    .toURL()
                                    .toString();
        renderer.setDocumentFromString(xHtml, baseUrl);
        renderer.layout();

        // Convert PDF to ByteArrayOutputStream
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        renderer.createPDF(byteArrayOutputStream);
        byteArrayOutputStream.close();

        // Convert ByteArrayOutputStream to InputStreamSource
        return new ByteArrayResource(byteArrayOutputStream.toByteArray());
    }

    private String convertToXhtml(String html) {
        Tidy tidy = new Tidy();
        tidy.setInputEncoding(StandardCharsets.UTF_8.name());
        tidy.setOutputEncoding(StandardCharsets.UTF_8.name());
        tidy.setXHTML(true);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8));
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        tidy.parseDOM(inputStream, outputStream);
        return outputStream.toString(StandardCharsets.UTF_8);
    }
}
