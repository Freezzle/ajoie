# Récap hebdomadaire des sous-tâches par email

> Instructions pour GitHub Copilot. Lis tout le fichier avant de coder : les règles métier et les fichiers existants à imiter sont décrits ci-dessous. Respecte les conventions du projet (Spring Boot 3, Lombok, Thymeleaf, multi-tenant Hibernate via `@TenantId`).

## 1. Objectif

Chaque **lundi à 06h00 (heure de Zurich)**, envoyer automatiquement à **chaque utilisateur actif d'un tenant** un email qui récapitule, pour chaque salon du tenant :

- les sous-tâches **en retard** ;
- les sous-tâches **de la semaine** (du lundi au dimanche).

Si un salon n'a **aucune sous-tâche en retard ni aucune sous-tâche dans la semaine**, on **n'envoie rien** pour ce salon.

## 2. Règles métier

| Règle | Détail |
|---|---|
| Date effective d'une sous-tâche | `coalesce(snoozedUntil, dueDate)` : une sous-tâche reportée (snooze) compte à sa date de report. |
| Sous-tâches ignorées | `status` = `DONE` ou `CANCELLED`, ou `dueDate` nulle. |
| Statuts gardés | `PENDING`, `IN_PROGRESS`, `BLOCKED`. |
| En retard | date effective **strictement avant** le lundi de la semaine. |
| Cette semaine | date effective entre le **lundi et le dimanche inclus**. |
| Salons concernés | uniquement les salons pas encore terminés : `salon.endingDate` nulle ou ≥ début du lundi. Ainsi, les vieilles sous-tâches d'un salon passé ne sont pas relancées chaque semaine. |
| Destinataires | tous les `User` du tenant avec `activated = true`, `tenantMemberStatus = "ACTIVE"` et un email non vide. |
| Nombre d'emails | **un email par utilisateur et par salon** qui a au moins une sous-tâche. Pas d'email si les deux listes sont vides. |
| Langue | `user.langKey` (repli sur `Locale.FRENCH`). |
| Tri | par date effective, puis `taskInstance.sortOrder`, puis `subtask.sortOrder`. **Obligatoire** : le template regroupe les lignes qui ont la même date. |

### Libellé de date (`dueLabel`)

Calculé en Java par rapport au lundi d'envoi (`today`) :

- `today - 1` → `Hier`
- `today` → `Aujourd'hui`
- `today + 1` → `Demain`
- autre date **dans la semaine** → jour abrégé + date, ex. `Jeu. 19.11` (`EEE dd.MM`, locale de l'utilisateur, première lettre en majuscule, avec le point)
- autre date **en retard** → `dd.MM`, ex. `12.11` (ajouter `.yyyy` si l'année est différente de l'année en cours)

### Libellé de statut (`statusLabel`)

Clés i18n à ajouter dans `src/main/resources/i18n/messages*.properties` (mêmes libellés que le front dans `i18n/fr/task.json`). **Respecter la convention du projet : accents en échappement `\uXXXX`.**

```properties
task.status.PENDING=À faire
task.status.IN_PROGRESS=En cours
task.status.BLOCKED=Bloquée
task.status.DONE=Terminée
task.status.CANCELLED=Annulée
email.task-weekly-digest.title=Tes sous-tâches de la semaine - {0}
```

`{0}` = `salon.place`. Ajouter les mêmes clés dans `messages.properties` (et `messages_en`/`messages_de` traduits).

## 3. Code existant à réutiliser (ne pas réinventer)

| Besoin | Où regarder |
|---|---|
| Modèle d'envoi d'email à imiter | `service/registration/RegistrationEmailService.java` (`EmailMessage`, `emailCreator.getTranslatedText`, `emailCreator.getContentHtml`, `emailCreator.send`, journalisation `EventLogService`) |
| Layout commun (en-tête, pied de page) | ajouté automatiquement par `service/mail/EmailCreator#send` via `templates/mail/layout.html` : le template ne contient que le corps (`th:fragment="content"`) |
| Contexte tenant hors requête HTTP | `security/tenant/TenantContextHolder.runAsSystem(...)` et `runAsTenant(tenantId, ...)` |
| Transactions | `security/tenant/TransactionalTenantOperation` (`executeReadOnlyAndReturn`) |
| Planification existante | `@EnableScheduling` déjà présent dans `config/AsyncConfiguration.java` ; exemples de `@Scheduled(cron=...)` dans `service/UserService.java` |
| URL de base | `utils/SalonProperties#getMail().getBaseUrl()` (voir `RegistrationEmailService#buildEditLink`) |
| Adresse d'expédition | `@Value("${spring.mail.username:}") String senderEmail` |
| Lien vers la liste des tâches | route Angular `admin/salons/:idSalon/tasks` → `baseUrl + "/admin/salons/" + salonId + "/tasks"` |

`SubtaskInstance`, `TaskInstance`, `Salon` et `User` portent `@TenantId` : **dans `runAsTenant`, Hibernate filtre automatiquement sur le tenant**, ne pas ajouter de condition `tenantId` à la main. `Tenant` n'est pas filtré.

## 4. Fichiers à créer / modifier

### 4.1 `repository/SubtaskInstanceRepository.java` (ajout)

```java
@Query("""
    select s from SubtaskInstance s
    join fetch s.taskInstance t
    join fetch t.salon sa
    where s.status not in :excludedStatuses
      and s.dueDate is not null
      and coalesce(s.snoozedUntil, s.dueDate) <= :weekEnd
      and (sa.endingDate is null or sa.endingDate >= :salonNotEndedBefore)
    order by sa.id, coalesce(s.snoozedUntil, s.dueDate), t.sortOrder, s.sortOrder
    """)
List<SubtaskInstance> findOpenSubtasksForDigest(
        @Param("excludedStatuses") Collection<TaskStatus> excludedStatuses,
        @Param("weekEnd") LocalDate weekEnd,
        @Param("salonNotEndedBefore") Instant salonNotEndedBefore);
```

### 4.2 `repository/UserRepository.java` (ajout)

```java
List<User> findAllByActivatedIsTrueAndTenantMemberStatus(String tenantMemberStatus);
```

### 4.3 `service/task/SubtaskDigestItem.java`

Classe avec **getters** (Lombok `@Value`), pas un `record` : le template accède aux propriétés via `st.title`, etc.

```java
@Value
public class SubtaskDigestItem {
    String title;
    String taskTitle;      // taskInstance.title
    String description;    // brut : le template tronque à 48 caractères
    String responsible;
    String statusLabel;    // traduit via task.status.*
    String dueLabel;       // voir règles §2
}
```

### 4.4 `service/task/WeeklyTaskDigestService.java`

Responsabilités :

1. `sendWeeklyDigests(LocalDate monday)` :
    - `List<Tenant> tenants = TenantContextHolder.runAsSystem(() -> tenantRepository.findAll());`
    - pour chaque tenant : `TenantContextHolder.runAsTenant(tenant.getId(), () -> sendForTenant(monday))`. Une erreur sur un tenant est **journalisée et n'arrête pas** les autres.
2. `sendForTenant(LocalDate monday)` :
    - `weekEnd = monday.plusDays(6)` ; `salonNotEndedBefore = monday.atStartOfDay(ZoneId.of("Europe/Zurich")).toInstant()` ;
    - charger sous-tâches et utilisateurs dans `transactionalOps.executeReadOnlyAndReturn(...)` et **convertir en `SubtaskDigestItem` dans la transaction** (les relations sont LAZY) ;
    - regrouper par salon (`LinkedHashMap` pour garder l'ordre) ;
    - pour chaque salon : séparer `overdue` (date effective < `monday`) et `week` (le reste) ; si les deux sont vides → `continue` ;
    - pour chaque utilisateur destinataire : construire le `Context` (locale de l'utilisateur, `dueLabel` et `statusLabel` calculés dans cette locale) et envoyer.
3. Envoi d'un email (calqué sur `RegistrationEmailService#send`) :

```java
EmailMessage emailMessage = new EmailMessage();
emailMessage.setFrom(senderEmail);
emailMessage.setTo(user.getEmail());
emailMessage.setSubject(emailCreator.getTranslatedText("email.task-weekly-digest.title", locale, salon.getPlace()));

Context context = new Context(locale);
context.setVariable("firstName", user.getFirstName());
context.setVariable("salon", salon.getPlace());
context.setVariable("tasksLink", buildTasksLink(salon.getId()));
context.setVariable("overdue", overdueItems);   // List<SubtaskDigestItem>, triée
context.setVariable("week", weekItems);         // List<SubtaskDigestItem>, triée
emailMessage.setBody(emailCreator.getContentHtml("task/subtask-weekly-digest", context));

emailCreator.send(emailMessage);
```

- entourer chaque envoi d'un `try/catch` : un échec pour un utilisateur ne bloque pas les suivants ;
- après chaque salon, journaliser via `eventLogService.eventFromSystem("Récap hebdomadaire des sous-tâches envoyé (" + n + " destinataires)", EventType.EMAIL, EntityType.SALON, salon.getId(), null)` ; en cas d'erreur, un événement « Problème d'envoi : récap hebdomadaire ».

Rendre `sendWeeklyDigests(LocalDate)` **public et testable** avec une date passée en paramètre (ne pas appeler `LocalDate.now()` dedans).

### 4.5 `service/task/WeeklyTaskDigestScheduler.java`

```java
@Component
@RequiredArgsConstructor
public class WeeklyTaskDigestScheduler {

    private static final ZoneId ZONE = ZoneId.of("Europe/Zurich");
    private final WeeklyTaskDigestService weeklyTaskDigestService;

    /** Tous les lundis à 06h00, heure de Zurich. */
    @Scheduled(cron = "0 0 6 * * MON", zone = "Europe/Zurich")
    public void sendWeeklyDigest() {
        weeklyTaskDigestService.sendWeeklyDigests(LocalDate.now(ZONE));
    }
}
```

### 4.6 `src/main/resources/templates/mail/task/subtask-weekly-digest.html`

À créer **tel quel** (déjà validé visuellement dans le layout du projet) :

```html
<!--/*
    Récap hebdomadaire des sous-tâches (v2c)
    Variables : firstName, salon, tasksLink, overdue, week
    Chaque liste doit être TRIÉE par date d'échéance : la date n'est affichée qu'une fois par groupe de même échéance.
    Éléments : title, taskTitle (titre de la tâche parente), description (peut être null, tronquée à 48 caractères),
               responsible (peut être null), statusLabel,
               dueLabel : "Hier", "Aujourd'hui", "Demain", sinon "Jeu. 19.11" (semaine) ou "12.11" (retard)
*/-->
<div xmlns:th="http://www.thymeleaf.org" th:fragment="content">
    <p style="margin:0 0 6px 0;">
        Bonjour <strong th:text="${firstName}">Prénom</strong> 👋<br/>
        Voici les sous-tâches de la semaine pour ton salon <strong th:text="${salon}">Salon d'automne 2026</strong> :
    </p>
    <p style="margin:0 0 16px 0;">
        ⚠️ <strong th:text="${#lists.size(overdue)}">3</strong> en retard &nbsp;·&nbsp; 📅 <strong th:text="${#lists.size(week)}">5</strong> cette semaine
    </p>

    <table role="presentation" style="width:100%; border-spacing:0; border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; font-size:14px; line-height:19px;">
        <tr>
            <td style="width:84px; padding:6px 8px 6px 0; border-bottom:1px solid #d4ac4a; color:#777777; font-size:12px;">Quand</td>
            <td style="padding:6px 8px; border-bottom:1px solid #d4ac4a; color:#777777; font-size:12px;">Sous-tâche</td>
            <td style="width:72px; padding:6px 0 6px 8px; border-bottom:1px solid #d4ac4a; color:#777777; font-size:12px;">Statut</td>
        </tr>

        <tr th:unless="${#lists.isEmpty(overdue)}"><td colspan="3" style="padding:14px 0 2px 0; color:#c62828;"><strong>⚠️ En retard</strong></td></tr>
        <tr th:each="st, iterStat : ${overdue}" style="border-top:1px solid #eeeeee;" th:style="${iterStat.first or st.dueLabel != overdue[iterStat.index - 1].dueLabel} ? 'border-top:1px solid #eeeeee;' : ''">
            <td style="padding:6px 8px 6px 0; vertical-align:top; white-space:nowrap; color:#c62828;"><span th:if="${iterStat.first or st.dueLabel != overdue[iterStat.index - 1].dueLabel}" th:text="${st.dueLabel}">12.11</span></td>
            <td style="padding:6px 8px; vertical-align:top;">
                <span style="font-size:11px; letter-spacing:0.5px; text-transform:uppercase; color:#999999;" th:text="${st.taskTitle}">Badges &amp; accueil</span><br/>
                <strong th:text="${st.title}">Commander les badges exposants</strong>
                <th:block th:if="${st.description}"><br/><span style="color:#555555;" th:text="${#strings.abbreviate(st.description, 48)}">Valider le BAT avec l&#x27;imprimeur et passer la ...</span></th:block>
                <th:block th:if="${st.responsible}"><br/><span style="font-size:12px; color:#777777;">👤 <span th:text="${st.responsible}">Marie Dupont</span></span></th:block>
            </td>
            <td style="padding:6px 0 6px 8px; vertical-align:top; white-space:nowrap;" th:text="${st.statusLabel}">En cours</td>
        </tr>

        <tr th:unless="${#lists.isEmpty(week)}"><td colspan="3" style="padding:14px 0 2px 0; color:#222222;"><strong>📅 Cette semaine</strong></td></tr>
        <tr th:each="st, iterStat : ${week}" style="border-top:1px solid #eeeeee;" th:style="${iterStat.first or st.dueLabel != week[iterStat.index - 1].dueLabel} ? 'border-top:1px solid #eeeeee;' : ''">
            <td style="padding:6px 8px 6px 0; vertical-align:top; white-space:nowrap; color:#222222;"><span th:if="${iterStat.first or st.dueLabel != week[iterStat.index - 1].dueLabel}" th:text="${st.dueLabel}">Aujourd'hui</span></td>
            <td style="padding:6px 8px; vertical-align:top;">
                <span style="font-size:11px; letter-spacing:0.5px; text-transform:uppercase; color:#999999;" th:text="${st.taskTitle}">Plan &amp; stands</span><br/>
                <strong th:text="${st.title}">Envoyer le plan des stands</strong>
                <th:block th:if="${st.description}"><br/><span style="color:#555555;" th:text="${#strings.abbreviate(st.description, 48)}">Partager la version finale avec tous les expo...</span></th:block>
                <th:block th:if="${st.responsible}"><br/><span style="font-size:12px; color:#777777;">👤 <span th:text="${st.responsible}">Luc Martin</span></span></th:block>
            </td>
            <td style="padding:6px 0 6px 8px; vertical-align:top; white-space:nowrap;" th:text="${st.statusLabel}">À faire</td>
        </tr>
    </table>

    <p style="margin:18px 0 8px 0;">
        👉 <a th:href="${tasksLink}" href="#" style="color:#004d40; font-weight:bold;">Voir la liste des tâches du salon</a>
    </p>
    <p>
        Bonne semaine et à lundi prochain ! ✨
    </p>
</div>
```

Ne pas modifier les styles inline : les clients mail (Gmail, Outlook) ignorent les feuilles de style externes.

## 5. Tests à écrire

Test d'intégration (`@SpringBootTest`, `JavaMailSender` mocké ou GreenMail) sur `WeeklyTaskDigestService#sendWeeklyDigests(LocalDate.of(2026, 11, 16))` :

1. Sous-tâche `PENDING` due le jeudi de la semaine → un email, dans `week`, `dueLabel` = `Jeu. 19.11`.
2. Sous-tâche `IN_PROGRESS` due le vendredi précédent → dans `overdue`, `dueLabel` = `13.11`.
3. Sous-tâche due la veille (dimanche) → `dueLabel` = `Hier`.
4. Sous-tâche `DONE` ou `CANCELLED` dans la semaine → ignorée.
5. Sous-tâche due la semaine suivante → ignorée.
6. Sous-tâche en retard mais `snoozedUntil` la semaine suivante → ignorée ; `snoozedUntil` mercredi → dans `week`.
7. Salon sans aucune sous-tâche retenue → **aucun email**.
8. Deux tenants → chaque utilisateur ne reçoit que les sous-tâches de son tenant.
9. Utilisateur non activé, `INVITED` ou `SUSPENDED` → ne reçoit rien.
10. Deux sous-tâches à la même date → la date n'apparaît qu'une fois dans le HTML rendu (`getContentHtml`).
11. Échec d'envoi pour un utilisateur → les autres reçoivent quand même leur email.

## 6. Points d'attention

- **Plusieurs instances de l'application** : `@Scheduled` s'exécute sur chaque instance, ce qui enverrait des doublons. Si l'application tourne sur plus d'une instance, ajouter ShedLock (`@SchedulerLock(name = "weeklyTaskDigest")`).
- **`app.mail.redirect-all-to`** : en dev/test, tous les emails sont redirigés vers cette adresse (voir `EmailCreator`), c'est normal.
- **Fuseau horaire** : toujours `Europe/Zurich` pour le cron et pour le calcul du lundi, la base est en UTC.
- **Volume** : ne pas faire de requête par sous-tâche (N+1) ; la requête §4.1 charge déjà tâche et salon (`join fetch`).
- Ne pas envoyer en `@Async` dans la boucle : envoyer de façon synchrone dans le job, qui tourne déjà hors requête HTTP.