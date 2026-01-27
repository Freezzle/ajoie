package ch.salon.service;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.security.tenant.TenantSecurityUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

/**
 * Multi-tenant aware presence service.
 * Caches online/offline status of users per tenant.
 * All operations are scoped to the current tenant in the request context.
 * <p>
 * Important:
 * - PresenceService requires TENANT mode context (authenticated users only)
 * - Calls from SYSTEM mode or without tenant context will throw TenantContextMissingException
 * - Each tenant's presence cache is completely isolated
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    private static final Logger logger = LoggerFactory.getLogger(PresenceService.class);
    private static final Duration ONLINE_TTL = Duration.ofSeconds(75);

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messaging;
    private final TenantSecurityUtil tenantSecurityUtil;

    /**
     * Per-tenant presence cache: Map<tenantId_String, Map<login, PresenceState>>
     */
    private final Map<String, Map<String, PresenceState>> tenantCaches = new ConcurrentHashMap<>();

    /**
     * Global session -> (tenantId, login) mapping for cleanup on disconnect
     */
    private final Map<String, TenantLogin> sessionToTenantLogin = new ConcurrentHashMap<>();

    private static class TenantLogin {
        final String tenantId;
        final String login;

        TenantLogin(String tenantId, String login) {
            this.tenantId = tenantId;
            this.login = login;
        }
    }

    /**
     * Register a user as connected in the current tenant.
     * Requires TENANT mode context.
     */
    @Transactional
    public void connect(String login, String sessionId) {
        var tenantId = tenantSecurityUtil.getCurrentTenantId();
        String tenantIdStr = tenantId.toString();

        var tenantCache = tenantCaches.computeIfAbsent(tenantIdStr, k -> new ConcurrentHashMap<>());
        PresenceState s = tenantCache.computeIfAbsent(login, l -> new PresenceState());
        s.sessionIds.add(sessionId);
        s.lastSeen = Instant.now();
        s.online = true;
        sessionToTenantLogin.put(sessionId, new TenantLogin(tenantIdStr, login));

        // Update DB lastSeen
        userRepository.updateLastSeenAt(login, s.lastSeen);

        publishForTenant(tenantId);
        logger.debug("User {} connected in tenant {}", login, tenantId);
    }

    /**
     * Unregister a user as disconnected.
     */
    @Transactional
    public void disconnect(String sessionId) {
        TenantLogin tl = sessionToTenantLogin.remove(sessionId);
        if (tl == null) return;

        var tenantCache = tenantCaches.get(tl.tenantId);
        if (tenantCache == null) return;

        PresenceState s = tenantCache.get(tl.login);
        if (s == null) return;

        s.sessionIds.remove(sessionId);
        s.lastSeen = Instant.now();
        userRepository.updateLastSeenAt(tl.login, s.lastSeen);

        if (s.sessionIds.isEmpty()) s.online = false;

        publishForTenant(UUID.fromString(tl.tenantId));
        logger.debug("User {} disconnected from tenant {}", tl.login, tl.tenantId);
    }

    /**
     * Update heartbeat for a user in the current tenant.
     * Requires TENANT mode context.
     */
    @Transactional
    public void heartbeat(String login) {
        var tenantId = tenantSecurityUtil.getCurrentTenantId();
        String tenantIdStr = tenantId.toString();

        var tenantCache = tenantCaches.computeIfAbsent(tenantIdStr, k -> new ConcurrentHashMap<>());
        PresenceState s = tenantCache.computeIfAbsent(login, l -> new PresenceState());
        s.lastSeen = Instant.now();
        if (!s.sessionIds.isEmpty()) s.online = true;

        // Throttle DB writes (only write if 60+ seconds have passed)
        if (s.lastSeenPersisted == null || Duration.between(s.lastSeenPersisted, s.lastSeen).toSeconds() >= 60) {
            userRepository.updateLastSeenAt(login, s.lastSeen);
            s.lastSeenPersisted = s.lastSeen;
        }

        publishForTenant(tenantId);
    }

    public int onlineCount() {
        var tenantId = tenantSecurityUtil.getCurrentTenantId();
        String tenantIdStr = tenantId.toString();
        var tenantCache = tenantCaches.getOrDefault(tenantIdStr, new ConcurrentHashMap<>());

        Instant cutoff = Instant.now().minus(ONLINE_TTL);
        return (int) tenantCache.values().stream()
                .filter(s -> s.online && s.lastSeen != null && s.lastSeen.isAfter(cutoff))
                .count();
    }

    @Transactional(readOnly = true)
    public List<PresenceSummaryDTO> summary() {
        var tenantId = tenantSecurityUtil.getCurrentTenantId();
        String tenantIdStr = tenantId.toString();
        var tenantCache = tenantCaches.getOrDefault(tenantIdStr, new ConcurrentHashMap<>());

        Instant cutoff = Instant.now().minus(ONLINE_TTL);

        var logins = tenantCache.keySet();
        Map<String, User> users = userRepository.findAllByLoginIn(logins).stream()
                .collect(Collectors.toMap(User::getLogin, u -> u));

        return tenantCache.entrySet().stream()
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

                    // lastSeen "front" = ping le plus récent si dispo, sinon DB
                    Instant lastSeen = (s.lastSeen != null && s.lastSeen.isAfter(Instant.EPOCH)) ? s.lastSeen : lastSeenAtDb;

                    return new PresenceSummaryDTO(login, displayName, online, lastSeen, lastLoginAt);
                })
                .sorted(Comparator
                        .comparing(PresenceSummaryDTO::online).reversed()
                        .thenComparing(dto -> Optional.ofNullable(dto.lastSeen()).orElse(Instant.EPOCH), Comparator.reverseOrder())
                )
                .toList();
    }

    public void bootstrapFromDb(Map<UUID, List<User>> usersByTenant) {
        for (var entry : usersByTenant.entrySet()) {
            UUID tenantId = entry.getKey();
            List<User> users = entry.getValue();
            String tenantIdStr = tenantId.toString();
            var tenantCache = tenantCaches.computeIfAbsent(tenantIdStr, k -> new ConcurrentHashMap<>());

            for (User u : users) {
                PresenceState s = tenantCache.computeIfAbsent(u.getLogin(), l -> new PresenceState());
                s.online = false;
                s.sessionIds.clear();
                s.lastSeen = u.getLastSeenAt() != null ? u.getLastSeenAt() : Instant.EPOCH;
                s.lastSeenPersisted = s.lastSeen;
            }
        }
    }

    @Scheduled(fixedDelay = 60_000)
    public void purgeOldCache() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(30));

        // Purge old entries from all tenant caches
        for (Map<String, PresenceState> tenantCache : tenantCaches.values()) {
            tenantCache.entrySet().removeIf(e -> {
                PresenceState s = e.getValue();
                return s.sessionIds.isEmpty()
                        && s.lastSeen != null
                        && s.lastSeen.isBefore(cutoff);
            });
        }
    }

    public void publishNow() {
        if (tenantSecurityUtil.isTenantMode()) {
            var tenantId = tenantSecurityUtil.getCurrentTenantId();
            publishForTenant(tenantId);
        } else {
            for (String tenantIdStr : tenantCaches.keySet()) {
                publishForTenant(UUID.fromString(tenantIdStr));
            }
        }
    }

    public void expireStale() {
        // Expire stale entries in all tenant caches
        Instant cutoff = Instant.now().minus(ONLINE_TTL);
        boolean changed = false;

        for (Map<String, PresenceState> tenantCache : tenantCaches.values()) {
            for (PresenceState s : tenantCache.values()) {
                if (s.online && s.lastSeen != null && s.lastSeen.isBefore(cutoff)) {
                    s.online = false;
                    s.sessionIds.clear();
                    changed = true;
                }
            }
        }
        if (changed) {
            // Publish to all tenants
            for (String tenantIdStr : tenantCaches.keySet()) {
                publishForTenant(UUID.fromString(tenantIdStr));
            }
        }
    }

    /**
     * Publish presence updates for a specific tenant via WebSocket.
     * Sends updated presence list and online count to all clients in that tenant.
     */
    private void publishForTenant(UUID tenantId) {
        String tenantIdStr = tenantId.toString();
        messaging.convertAndSend("/topic/presence/" + tenantIdStr, summaryForTenant(tenantId));
        messaging.convertAndSend("/topic/presence-count/" + tenantIdStr, onlineCountForTenant(tenantId));
    }

    private int onlineCountForTenant(UUID tenantId) {
        String tenantIdStr = tenantId.toString();
        var tenantCache = tenantCaches.getOrDefault(tenantIdStr, new ConcurrentHashMap<>());

        Instant cutoff = Instant.now().minus(ONLINE_TTL);
        return (int) tenantCache.values().stream()
                .filter(s -> s.online && s.lastSeen != null && s.lastSeen.isAfter(cutoff))
                .count();
    }

    @Transactional(readOnly = true)
    protected List<PresenceSummaryDTO> summaryForTenant(UUID tenantId) {
        String tenantIdStr = tenantId.toString();
        var tenantCache = tenantCaches.getOrDefault(tenantIdStr, new ConcurrentHashMap<>());

        Instant cutoff = Instant.now().minus(ONLINE_TTL);

        var logins = tenantCache.keySet();
        Map<String, User> users = userRepository.findAllByLoginIn(logins).stream()
                .collect(Collectors.toMap(User::getLogin, u -> u));

        return tenantCache.entrySet().stream()
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

                    // lastSeen "front" = ping le plus récent si dispo, sinon DB
                    Instant lastSeen = (s.lastSeen != null && s.lastSeen.isAfter(Instant.EPOCH)) ? s.lastSeen : lastSeenAtDb;

                    return new PresenceSummaryDTO(login, displayName, online, lastSeen, lastLoginAt);
                })
                .sorted(Comparator
                        .comparing(PresenceSummaryDTO::online).reversed()
                        .thenComparing(dto -> Optional.ofNullable(dto.lastSeen()).orElse(Instant.EPOCH), Comparator.reverseOrder())
                )
                .toList();
    }

    public record PresenceSummaryDTO(
            String login,
            String displayName,
            boolean online,
            Instant lastSeen,
            Instant lastLoginAt
    ) {
    }

    private static class PresenceState {
        volatile boolean online = false;
        volatile Instant lastSeen = Instant.EPOCH;
        volatile Instant lastSeenPersisted = null;
        Set<String> sessionIds = ConcurrentHashMap.newKeySet();
    }
}