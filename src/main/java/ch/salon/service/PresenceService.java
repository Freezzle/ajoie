package ch.salon.service;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private static final Duration ONLINE_TTL = Duration.ofSeconds(75);

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messaging;

    private final Map<String, PresenceState> byLogin = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToLogin = new ConcurrentHashMap<>();

    @Transactional
    public void connect(String login, String sessionId) {
        PresenceState s = byLogin.computeIfAbsent(login, l -> new PresenceState());
        s.sessionIds.add(sessionId);
        s.lastSeen = Instant.now();
        s.online = true;
        sessionToLogin.put(sessionId, login);

        // Maj DB lastSeen (pas trop souvent -> ici ok car connect rare)
        userRepository.updateLastSeenAt(login, s.lastSeen);

        publish();
    }

    @Transactional
    public void disconnect(String sessionId) {
        String login = sessionToLogin.remove(sessionId);
        if (login == null) return;

        PresenceState s = byLogin.get(login);
        if (s == null) return;

        s.sessionIds.remove(sessionId);
        s.lastSeen = Instant.now();
        userRepository.updateLastSeenAt(login, s.lastSeen);

        if (s.sessionIds.isEmpty()) s.online = false;

        publish();
    }

    @Transactional
    public void heartbeat(String login) {
        PresenceState s = byLogin.computeIfAbsent(login, l -> new PresenceState());
        s.lastSeen = Instant.now();
        if (!s.sessionIds.isEmpty()) s.online = true;

        // Throttle simple (évite d’écrire en DB toutes les 20s)
        if (s.lastSeenPersisted == null || Duration.between(s.lastSeenPersisted, s.lastSeen).toSeconds() >= 60) {
            userRepository.updateLastSeenAt(login, s.lastSeen);
            s.lastSeenPersisted = s.lastSeen;
        }

        publish();
    }

    public int onlineCount() {
        Instant cutoff = Instant.now().minus(ONLINE_TTL);
        return (int) byLogin.values().stream()
                .filter(s -> s.online && s.lastSeen != null && s.lastSeen.isAfter(cutoff))
                .count();
    }

    @Transactional(readOnly = true)
    public List<PresenceSummaryDTO> summary() {
        Instant cutoff = Instant.now().minus(ONLINE_TTL);

        var logins = byLogin.keySet();
        Map<String, User> users = userRepository.findAllByLoginIn(logins).stream()
                .collect(Collectors.toMap(User::getLogin, u -> u));

        return byLogin.entrySet().stream()
                .map(e -> {
                    String login = e.getKey();
                    PresenceState s = e.getValue();
                    User u = users.get(login);

                    boolean online = s.online && s.lastSeen != null && s.lastSeen.isAfter(cutoff);

                    String displayName = (u != null)
                            ? (Stream.of(u.getFirstName(), u.getLastName()).filter(Objects::nonNull).collect(Collectors.joining(" ")).trim())
                            : login;
                    if (displayName == null || displayName.isBlank()) displayName = login;

                    Instant lastLoginAt = (u != null) ? u.getLastLoginAt() : null;
                    Instant lastSeenAtDb = (u != null) ? u.getLastSeenAt() : null;

                    // lastSeen “front” = ping le plus récent si dispo, sinon DB
                    Instant lastSeen = (s.lastSeen != null && s.lastSeen.isAfter(Instant.EPOCH)) ? s.lastSeen : lastSeenAtDb;

                    return new PresenceSummaryDTO(login, displayName, online, lastSeen, lastLoginAt);
                })
                .sorted(Comparator
                        .comparing(PresenceSummaryDTO::online).reversed()
                        .thenComparing(dto -> Optional.ofNullable(dto.lastSeen()).orElse(Instant.EPOCH), Comparator.reverseOrder())
                )
                .toList();
    }

    public void bootstrapFromDb(List<User> users) {
        for (User u : users) {
            PresenceState s = byLogin.computeIfAbsent(u.getLogin(), l -> new PresenceState());
            s.online = false;
            s.sessionIds.clear();

            s.lastSeen = u.getLastSeenAt() != null ? u.getLastSeenAt() : Instant.EPOCH;
            s.lastSeenPersisted = s.lastSeen;
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void purgeOldCache() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(30));

        byLogin.entrySet().removeIf(e -> {
            PresenceState s = e.getValue();
            return s.sessionIds.isEmpty()
                    && s.lastSeen != null
                    && s.lastSeen.isBefore(cutoff);
        });
    }

    public void publishNow() {
        publish();
    }

    public void expireStale() {
        Instant cutoff = Instant.now().minus(ONLINE_TTL);
        boolean changed = false;

        for (PresenceState s : byLogin.values()) {
            if (s.online && s.lastSeen != null && s.lastSeen.isBefore(cutoff)) {
                s.online = false;
                s.sessionIds.clear();
                changed = true;
            }
        }
        if (changed) publish();
    }

    private void publish() {
        messaging.convertAndSend("/topic/presence", summary());
        messaging.convertAndSend("/topic/presence-count", onlineCount());
    }

    public record PresenceSummaryDTO(
            String login,
            String displayName,
            boolean online,
            Instant lastSeen,
            Instant lastLoginAt
    ) {}

    private static class PresenceState {
        volatile boolean online = false;
        volatile Instant lastSeen = Instant.EPOCH;
        volatile Instant lastSeenPersisted = null;
        Set<String> sessionIds = ConcurrentHashMap.newKeySet();
    }
}