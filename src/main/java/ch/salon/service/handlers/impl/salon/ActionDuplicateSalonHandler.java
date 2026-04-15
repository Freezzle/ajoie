package ch.salon.service.handlers.impl.salon;

import ch.salon.domain.Salon;
import ch.salon.service.SalonService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.RequiredField;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.FieldType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionDuplicateSalonHandler implements BusinessActionHandler<Salon>, ActionMetadataProvider {

    private final SalonService salonService;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }
        return ActionSupport.allowed("action.salon-duplicate.help");
    }

    @Override
    public void execute(Salon payload, Map<String, Object> context) {
        String place = getString(context, "place");
        String referenceNumber = getString(context, "referenceNumber");
        Instant startingDate = getInstant(context, "startingDate");
        Instant endingDate = getInstant(context, "endingDate");
        boolean copyPrices = getBoolean(context, "copyPrices");
        boolean copyTalksPlanning = getBoolean(context, "copyTalksPlanning");
        boolean copyVolunteerPlanning = getBoolean(context, "copyVolunteerPlanning");
        boolean copyTasks = getBoolean(context, "copyTasks");

        salonService.duplicateSalon(payload, place, referenceNumber, startingDate, endingDate,
                copyPrices, copyTalksPlanning, copyVolunteerPlanning, copyTasks);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.SALON_DUPLICATE;
    }

    @Override
    public List<RequiredField> getRequiredFields() {
        return List.of(
                new RequiredField("place", FieldType.TEXT, "action.salon-duplicate.field.place"),
                new RequiredField("referenceNumber", FieldType.TEXT, "action.salon-duplicate.field.referenceNumber"),
                new RequiredField("startingDate", FieldType.DATE, "action.salon-duplicate.field.startingDate"),
                new RequiredField("endingDate", FieldType.DATE, "action.salon-duplicate.field.endingDate"),
                new RequiredField("copyPrices", FieldType.CHECKBOX, "action.salon-duplicate.field.copyPrices"),
                new RequiredField("copyTalksPlanning", FieldType.CHECKBOX, "action.salon-duplicate.field.copyTalksPlanning"),
                new RequiredField("copyVolunteerPlanning", FieldType.CHECKBOX, "action.salon-duplicate.field.copyVolunteerPlanning"),
                new RequiredField("copyTasks", FieldType.CHECKBOX, "action.salon-duplicate.field.copyTasks")
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String getString(Map<String, Object> context, String key) {
        Object val = context.get(key);
        return val != null ? val.toString() : null;
    }

    private Instant getInstant(Map<String, Object> context, String key) {
        Object val = context.get(key);
        if (val == null) return null;
        if (val instanceof Instant i) return i;
        // The frontend sends dates as ISO strings
        return Instant.parse(val.toString());
    }

    private boolean getBoolean(Map<String, Object> context, String key) {
        Object val = context.get(key);
        if (val instanceof Boolean b) return b;
        if (val instanceof String s) return Boolean.parseBoolean(s);
        return false;
    }
}
