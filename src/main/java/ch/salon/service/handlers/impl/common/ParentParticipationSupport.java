package ch.salon.service.handlers.impl.common;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;

import java.util.function.Function;

public final class ParentParticipationSupport {
    private ParentParticipationSupport() {
    }

    public static <T> ActionSupport supportsWhenParentActive(
            T payload,
            boolean transitionAllowed,
            String helpKey,
            String conditionKey,
            Function<T, Participation> participationExtractor
    ) {
        if (payload == null || !transitionAllowed) {
            return ActionSupport.rejected();
        }

        Participation participation = participationExtractor.apply(payload);
        boolean parentParticipationActive = participation != null
                && participation.getStatus() != Status.REFUSED
                && participation.getStatus() != Status.CANCELED;

        return ActionSupport.fromConditions(
                helpKey,
                ConditionalKey.of(parentParticipationActive, conditionKey)
        );
    }
}
