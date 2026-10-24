package ch.salon.service.document;

import org.apache.commons.lang3.StringUtils;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Assainit le HTML saisi dans l'éditeur riche avant son injection dans un PDF.
 * <p>
 * Flying Saucer (via JTidy) est strict : les balises inconnues, les scripts et les styles embarqués
 * cassent le rendu. On ne conserve donc qu'une liste blanche de balises de mise en forme et on retire
 * tous les attributs, à l'exception des liens {@code href} en http(s)/mailto.
 */
public final class HtmlSanitizer {

    private static final Set<String> ALLOWED_TAGS = Set.of(
            "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "sub", "sup",
            "ul", "ol", "li", "blockquote", "pre", "code", "span", "div", "a",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "table", "thead", "tbody", "tr", "td", "th");

    /** Éléments supprimés avec leur contenu : ils n'ont aucun sens dans un document imprimé. */
    private static final Pattern DANGEROUS_BLOCKS = Pattern.compile(
            "<\\s*(script|style|iframe|object|embed|form|svg)\\b[^>]*>.*?<\\s*/\\s*\\1\\s*>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern COMMENTS = Pattern.compile("<!--.*?-->", Pattern.DOTALL);

    private static final Pattern TAG = Pattern.compile("<\\s*(/?)\\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>");

    private static final Pattern HREF = Pattern.compile("href\\s*=\\s*([\"'])(.*?)\\1",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private static final Pattern SAFE_HREF = Pattern.compile("^(https?://|mailto:)", Pattern.CASE_INSENSITIVE);

    private HtmlSanitizer() {
    }

    /**
     * @return le HTML nettoyé, ou {@code null} si le contenu est vide une fois les balises retirées.
     */
    public static String sanitize(String html) {
        if (StringUtils.isBlank(html)) {
            return null;
        }

        String cleaned = COMMENTS.matcher(DANGEROUS_BLOCKS.matcher(html).replaceAll("")).replaceAll("");

        Matcher matcher = TAG.matcher(cleaned);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(result, Matcher.quoteReplacement(rewriteTag(matcher)));
        }
        matcher.appendTail(result);

        String sanitized = result.toString();
        return hasText(sanitized) ? sanitized : null;
    }

    private static String rewriteTag(Matcher matcher) {
        boolean closing = !matcher.group(1).isEmpty();
        String tag = matcher.group(2).toLowerCase();

        if (!ALLOWED_TAGS.contains(tag)) {
            // Balise inconnue : on la retire mais on conserve son contenu textuel.
            return "";
        }
        if (closing) {
            return "</" + tag + ">";
        }
        if ("a".equals(tag)) {
            String href = extractSafeHref(matcher.group(3));
            return href == null ? "<a>" : "<a href=\"" + escapeAttribute(href) + "\">";
        }
        return "<" + tag + ">";
    }

    private static String extractSafeHref(String attributes) {
        Matcher href = HREF.matcher(attributes);
        if (!href.find()) {
            return null;
        }
        String value = href.group(2).trim();
        return SAFE_HREF.matcher(value).find() ? value : null;
    }

    private static String escapeAttribute(String value) {
        return value.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }

    /** Vrai si, une fois les balises et les espaces insécables retirés, il reste du texte. */
    private static boolean hasText(String html) {
        String stripped = html.replaceAll("<[^>]*>", "").replace("&nbsp;", " ").replace('\u00a0', ' ');
        return StringUtils.isNotBlank(stripped);
    }
}
