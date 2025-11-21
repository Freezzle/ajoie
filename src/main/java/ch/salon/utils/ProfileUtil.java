package ch.salon.utils;

import org.springframework.boot.SpringApplication;

import java.util.HashMap;
import java.util.Map;

public class ProfileUtil {
    private static final String SPRING_PROFILE_DEFAULT = "spring.profiles.default";

    private ProfileUtil() {
    }

    public static void addDefaultProfile(SpringApplication app) {
        Map<String, Object> defProperties = new HashMap();
        defProperties.put(SPRING_PROFILE_DEFAULT, "dev");
        app.setDefaultProperties(defProperties);
    }
}
