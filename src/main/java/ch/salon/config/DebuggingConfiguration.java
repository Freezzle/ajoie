package ch.salon.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class DebuggingConfiguration {

    @PostConstruct
    public void debug() {
    }
}
