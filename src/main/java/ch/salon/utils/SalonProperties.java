package ch.salon.utils;

import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.web.cors.CorsConfiguration;

@ConfigurationProperties(
        prefix = "salon",
        ignoreUnknownFields = false
)
@Data
public class SalonProperties {
    private final SalonProperties.Async async = new SalonProperties.Async();
    private final SalonProperties.Http http = new SalonProperties.Http();
    private final SalonProperties.Database database = new SalonProperties.Database();
    private final SalonProperties.Cache cache = new SalonProperties.Cache();
    private final SalonProperties.Mail mail = new SalonProperties.Mail();
    private final SalonProperties.Security security = new SalonProperties.Security();
    private final SalonProperties.ApiDocs apiDocs = new SalonProperties.ApiDocs();
    private final SalonProperties.Logging logging = new SalonProperties.Logging();
    private final CorsConfiguration cors = new CorsConfiguration();
    private final SalonProperties.Social social = new SalonProperties.Social();
    private final SalonProperties.Gateway gateway = new SalonProperties.Gateway();
    private final SalonProperties.Registry registry = new SalonProperties.Registry();
    private final SalonProperties.ClientApp clientApp = new SalonProperties.ClientApp();
    private final SalonProperties.AuditEvents auditEvents = new SalonProperties.AuditEvents();

    @Data
    public static class Async {
        private int corePoolSize = 2;
        private int maxPoolSize = 50;
        private int queueCapacity = 10000;
    }

    @Data
    public static class Http {
        private final SalonProperties.Http.Cache cache = new SalonProperties.Http.Cache();

        @Data
        public static class Cache {
            private int timeToLiveInDays = 1461;
        }
    }

    @Data
    public static class Database {
        private final SalonProperties.Database.Couchbase couchbase = new SalonProperties.Database.Couchbase();

        @Data
        public static class Couchbase {
            private String bucketName;
            private String scopeName;
        }
    }

    @Data
    public static class Cache {
        private final SalonProperties.Cache.Hazelcast hazelcast = new SalonProperties.Cache.Hazelcast();
        private final SalonProperties.Cache.Caffeine caffeine = new SalonProperties.Cache.Caffeine();
        private final SalonProperties.Cache.Ehcache ehcache = new SalonProperties.Cache.Ehcache();
        private final SalonProperties.Cache.Infinispan infinispan = new SalonProperties.Cache.Infinispan();
        private final SalonProperties.Cache.Memcached memcached = new SalonProperties.Cache.Memcached();
        private final SalonProperties.Cache.Redis redis = new SalonProperties.Cache.Redis();

        @Data
        public static class Hazelcast {
            private int timeToLiveSeconds = 3600;
            private int backupCount = 1;
        }

        @Data
        public static class Caffeine {
            private int timeToLiveSeconds = 3600;
            private long maxEntries = 100L;
        }

        @Data
        public static class Ehcache {
            private int timeToLiveSeconds = 3600;
            private long maxEntries = 100L;
        }

        @Data
        public static class Infinispan {
            private String configFile = "default-configs/default-jgroups-tcp.xml";
            private boolean statsEnabled = false;
            private final SalonProperties.Cache.Infinispan.Local local = new SalonProperties.Cache.Infinispan.Local();
            private final SalonProperties.Cache.Infinispan.Distributed distributed = new SalonProperties.Cache.Infinispan.Distributed();
            private final SalonProperties.Cache.Infinispan.Replicated replicated = new SalonProperties.Cache.Infinispan.Replicated();

            @Data
            public static class Local {
                private long timeToLiveSeconds = 60L;
                private long maxEntries = 100L;
            }

            @Data
            public static class Distributed {
                private long timeToLiveSeconds = 60L;
                private long maxEntries = 100L;
                private int instanceCount = 1;
            }

            @Data
            public static class Replicated {
                private long timeToLiveSeconds = 60L;
                private long maxEntries = 100L;
            }
        }

        @Data
        public static class Memcached {
            private boolean enabled = false;
            private String servers = "localhost:11211";
            private int expiration = 300;
            private boolean useBinaryProtocol = true;
            private SalonProperties.Cache.Memcached.Authentication authentication = new SalonProperties.Cache.Memcached.Authentication();

            @Data
            public static class Authentication {
                private boolean enabled = false;
                private String username;
                private String password;
            }
        }

        @Data
        public static class Redis {
            private String[] server;
            private int expiration;
            private boolean cluster;
            private int connectionPoolSize;
            private int connectionMinimumIdleSize;
            private int subscriptionConnectionPoolSize;
            private int subscriptionConnectionMinimumIdleSize;

            public Redis() {
                this.server = SalonDefaults.Cache.Redis.server;
                this.expiration = 300;
                this.cluster = false;
                this.connectionPoolSize = 64;
                this.connectionMinimumIdleSize = 24;
                this.subscriptionConnectionPoolSize = 50;
                this.subscriptionConnectionMinimumIdleSize = 1;
            }
        }
    }

    @Data
    public static class Mail {
        private boolean enabled = false;
        private String from = "";
        private String baseUrl = "";
    }

    @Data
    public static class Security {
        private String contentSecurityPolicy = "default-src 'self'; frame-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:";
        private final SalonProperties.Security.ClientAuthorization clientAuthorization = new SalonProperties.Security.ClientAuthorization();
        private final SalonProperties.Security.Authentication authentication = new SalonProperties.Security.Authentication();
        private final SalonProperties.Security.RememberMe rememberMe = new SalonProperties.Security.RememberMe();
        private final SalonProperties.Security.OAuth2 oauth2 = new SalonProperties.Security.OAuth2();

        @Data
        public static class ClientAuthorization {
            private String accessTokenUri;
            private String tokenServiceId;
            private String clientId;
            private String clientSecret;

            public ClientAuthorization() {
                this.accessTokenUri = SalonDefaults.Security.ClientAuthorization.accessTokenUri;
                this.tokenServiceId = SalonDefaults.Security.ClientAuthorization.tokenServiceId;
                this.clientId = SalonDefaults.Security.ClientAuthorization.clientId;
                this.clientSecret = SalonDefaults.Security.ClientAuthorization.clientSecret;
            }
        }

        @Data
        public static class Authentication {
            private final SalonProperties.Security.Authentication.Jwt jwt = new SalonProperties.Security.Authentication.Jwt();

            @Data
            public static class Jwt {
                private String secret;
                private String base64Secret;
                private long tokenValidityInSeconds;
                private long tokenValidityInSecondsForRememberMe;

                public Jwt() {
                    this.secret = SalonDefaults.Security.Authentication.Jwt.secret;
                    this.base64Secret = SalonDefaults.Security.Authentication.Jwt.base64Secret;
                    this.tokenValidityInSeconds = 1800L;
                    this.tokenValidityInSecondsForRememberMe = 2592000L;
                }
            }
        }

        @Data
        public static class RememberMe {
            private @NotNull String key;

            public RememberMe() {
                this.key = SalonDefaults.Security.RememberMe.key;
            }
        }

        @Data
        public static class OAuth2 {
            private List<String> audience = new ArrayList<>();

            public List<String> getAudience() {
                return Collections.unmodifiableList(this.audience);
            }
        }
    }

    @Data
    public static class ApiDocs {
        private String title = "Application API";
        private String description = "API documentation";
        private String version = "0.0.1";
        private String termsOfServiceUrl;
        private String contactName;
        private String contactUrl;
        private String contactEmail;
        private String license;
        private String licenseUrl;
        private String[] defaultIncludePattern;
        private String[] managementIncludePattern;
        private SalonProperties.ApiDocs.Server[] servers;

        public ApiDocs() {
            this.termsOfServiceUrl = SalonDefaults.ApiDocs.termsOfServiceUrl;
            this.contactName = SalonDefaults.ApiDocs.contactName;
            this.contactUrl = SalonDefaults.ApiDocs.contactUrl;
            this.contactEmail = SalonDefaults.ApiDocs.contactEmail;
            this.license = SalonDefaults.ApiDocs.license;
            this.licenseUrl = SalonDefaults.ApiDocs.licenseUrl;
            this.defaultIncludePattern = SalonDefaults.ApiDocs.defaultIncludePattern;
            this.managementIncludePattern = SalonDefaults.ApiDocs.managementIncludePattern;
            this.servers = new SalonProperties.ApiDocs.Server[0];
        }

        @Data
        public static class Server {
            private String url;
            private String description;
        }
    }

    @Data
    public static class Logging {
        private boolean useJsonFormat = false;
        private final SalonProperties.Logging.Logstash logstash = new SalonProperties.Logging.Logstash();

        @Data
        public static class Logstash {
            private boolean enabled = false;
            private String host = "localhost";
            private int port = 5000;
            private int ringBufferSize = 512;
        }
    }

    @Data
    public static class Social {
        private String redirectAfterSignIn = "/#/home";
    }

    @Data
    public static class Gateway {
        private final SalonProperties.Gateway.RateLimiting rateLimiting = new SalonProperties.Gateway.RateLimiting();
        private Map<String, List<String>> authorizedMicroservicesEndpoints;

        public Gateway() {
            this.authorizedMicroservicesEndpoints = SalonDefaults.Gateway.authorizedMicroservicesEndpoints;
        }

        @Data
        public static class RateLimiting {
            private boolean enabled = false;
            private long limit = 100000L;
            private int durationInSeconds = 3600;
        }
    }

    @Data
    public static class Registry {
        private String password;

        public Registry() {
            this.password = SalonDefaults.Registry.password;
        }
    }

    @Data
    public static class ClientApp {
        private String name = "salonApp";
    }

    @Data
    public static class AuditEvents {
        private int retentionPeriod = 30;
    }
}
