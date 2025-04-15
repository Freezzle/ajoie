package ch.salon.config;

import ch.salon.aop.logging.RepositoryAction;
import org.springframework.beans.factory.ListableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Configuration
public class ActionRepositoryConfiguration {

    @Bean(name = "actionRepositories")
    public Map<String, JpaRepository<?, UUID>> actionRepositories(ListableBeanFactory beanFactory) {
        Map<String, JpaRepository<?, UUID>> result = new HashMap<>();

        Map<String, Object> candidates = beanFactory.getBeansWithAnnotation(Repository.class);
        for (Object candidate : candidates.values()) {
            Class<?>[] interfaces = candidate.getClass().getInterfaces();
            for (Class<?> iface : interfaces) {
                RepositoryAction annotation = iface.getAnnotation(RepositoryAction.class);
                if (annotation != null && candidate instanceof JpaRepository<?, ?> repo) {
                    result.put(annotation.value(), (JpaRepository<?, UUID>) repo);
                }
            }
        }

        return Collections.unmodifiableMap(result);
    }
}
