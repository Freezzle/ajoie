package ch.salon.config;

import ch.salon.domain.listener.TenantEnforcementListener;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.internal.SessionFactoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Registers the TenantEnforcementListener with Hibernate.
 */
@Component
public class HibernateListenerConfiguration {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private TenantEnforcementListener tenantEnforcementListener;

    @PostConstruct
    public void registerListeners() {
        SessionFactoryImpl sessionFactory = entityManagerFactory.unwrap(SessionFactoryImpl.class);
        EventListenerRegistry registry = sessionFactory.getServiceRegistry().getService(EventListenerRegistry.class);

        registry.prependListeners(EventType.PRE_INSERT, tenantEnforcementListener);
        registry.prependListeners(EventType.PRE_UPDATE, tenantEnforcementListener);
    }
}
