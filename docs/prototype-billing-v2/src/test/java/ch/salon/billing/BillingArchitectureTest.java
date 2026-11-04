package ch.salon.billing;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * La facturation est GÉNÉRIQUE : elle ne doit dépendre d'aucun élément métier du salon
 * (participations, stands, repas…) ni de Spring/JPA dans son domaine. Ce sont les participations
 * qui appellent la facturation, jamais l'inverse.
 */
@AnalyzeClasses(packages = "ch.salon", importOptions = ImportOption.DoNotIncludeTests.class)
class BillingArchitectureTest {

    @ArchTest
    static final ArchRule billingIgnoresSalonDomain = noClasses()
            .that().resideInAPackage("ch.salon.billing..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "ch.salon.domain..", "ch.salon.service..", "ch.salon.web..", "ch.salon.repository..")
            .because("la facturation est un module générique, appelé par les participations");

    @ArchTest
    static final ArchRule billingDomainIsFrameworkFree = noClasses()
            .that().resideInAPackage("ch.salon.billing.domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "org.springframework..", "jakarta.persistence..", "org.hibernate..")
            .because("le domaine de facturation porte les règles, la persistance est un adaptateur");
}
