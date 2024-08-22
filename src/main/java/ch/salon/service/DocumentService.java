package ch.salon.service;

import ch.salon.service.mail.DataProvider;
import com.lowagie.text.pdf.BaseFont;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Service;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.w3c.tidy.Tidy;
import org.xhtmlrenderer.pdf.ITextRenderer;

@Service
public class DocumentService {

    private final SpringTemplateEngine documentTemplateEngine;

    public DocumentService(@Qualifier("documentTemplateEngine") SpringTemplateEngine documentTemplateEngine) {
        this.documentTemplateEngine = documentTemplateEngine;
    }

    private static String convertToXhtml(String html) throws UnsupportedEncodingException {
        Tidy tidy = new Tidy();
        tidy.setInputEncoding(StandardCharsets.UTF_8.name());
        tidy.setOutputEncoding(StandardCharsets.UTF_8.name());
        tidy.setXHTML(true);
        ByteArrayInputStream inputStream = new ByteArrayInputStream(html.getBytes(StandardCharsets.UTF_8));
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        tidy.parseDOM(inputStream, outputStream);
        return outputStream.toString(StandardCharsets.UTF_8);
    }

    public InputStreamSource generate(DataProvider dataProvider) throws Exception {
        String renderedHtmlContent = documentTemplateEngine.process(dataProvider.getTemplateName(), dataProvider.getContext());
        String xHtml = convertToXhtml(renderedHtmlContent); // Conversion en XHTML

        ITextRenderer renderer = new ITextRenderer();
        renderer.getFontResolver().addFont("/templates/document/common/Code39.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

        String baseUrl = FileSystems.getDefault()
            .getPath("src", "main", "resources", "templates", "document", "common")
            .toUri()
            .toURL()
            .toString();
        renderer.setDocumentFromString(xHtml, baseUrl);
        renderer.layout();

        // Generate PDF output
        OutputStream outputStream = new FileOutputStream("output.pdf"); // Remplacez par le chemin du fichier PDF de sortie
        renderer.createPDF(outputStream);
        outputStream.close();

        // Generate PDF to ByteArrayOutputStream
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        renderer.createPDF(byteArrayOutputStream);
        byteArrayOutputStream.close();

        // Convert ByteArrayOutputStream to InputStreamSource
        return new ByteArrayResource(byteArrayOutputStream.toByteArray());
    }
}
