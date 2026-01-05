package ch.salon.repository;

import ch.salon.domain.User;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    String USERS_BY_LOGIN_CACHE = "usersByLogin";

    String USERS_BY_EMAIL_CACHE = "usersByEmail";

    Optional<User> findOneByActivationKey(String activationKey);

    List<User> findAllByActivatedIsFalseAndActivationKeyIsNotNullAndCreatedDateBefore(Instant dateTime);

    Optional<User> findOneByResetKey(String resetKey);

    Optional<User> findOneByEmailIgnoreCase(String email);

    Optional<User> findOneByLogin(String login);

    @EntityGraph(attributePaths = "authorities")
    @Cacheable(cacheNames = USERS_BY_LOGIN_CACHE)
    Optional<User> findOneWithAuthoritiesByLogin(String login);

    @EntityGraph(attributePaths = "authorities")
    @Cacheable(cacheNames = USERS_BY_EMAIL_CACHE)
    Optional<User> findOneWithAuthoritiesByEmailIgnoreCase(String email);

    Page<User> findAllByIdNotNullAndActivatedIsTrue(Pageable pageable);

    @Modifying
    @Query("update User u set u.lastLoginAt = :ts where u.login = :login")
    @Transactional
    void updateLastLoginAt(@Param("login") String login, @Param("ts") Instant ts);

    @Modifying
    @Query("update User u set u.lastSeenAt = :ts where u.login = :login")
    @Transactional
    void updateLastSeenAt(@Param("login") String login, @Param("ts") Instant ts);

    @Query("""
        select u from User u
        where (u.lastSeenAt is not null and u.lastSeenAt >= :since)
           or (u.lastLoginAt is not null and u.lastLoginAt >= :since)
    """)
    List<User> findRecentlyActive(@Param("since") Instant since);

    @Query("select u from User u where u.login in :logins")
    List<User> findAllByLoginIn(@Param("logins") Collection<String> logins);
}
