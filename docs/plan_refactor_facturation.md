# Plan d'implémentation — Refonte de la facturation (étapes 1 à 5)

> Référence normative : `docs/REFONTE_FACTURATION.md` (v2).
> Prototype de départ : `docs/prototype-billing-v2/` (26 classes de domaine + 12 classes de test, 105 tests verts —
> voir `docs/prototype-rapport-tests.txt`).
> Ce plan couvre **les étapes 1 à 5** du §11. Les étapes 6 (UI Angular), 7 (rappels/pertes/export comptable) et
> 8 (bascule 2027 + suppression du code mort) feront l'objet d'un plan ultérieur.

---

## 1. Problème

La facturation actuelle (`InvoicingPlan` / `Invoice` / `Payment` + `RefreshInvoicingPlansService`, ~718 lignes)
présente des défauts bloquants :

| Constat (vérifié dans le code) | Emplacement |
|---|---|
| Montants en `Double` partout | `Invoice.getTotalAmount()`, `Salon.priceMeal1..3`, `PriceStandSalon.price` |
| Documents émis modifiables / supprimables sans contrôle d'état | `AdminInvoicingPlanResource` : `PUT`/`DELETE` sur invoices et payments |
| Paiements collés à un document, modifiables, supprimables | `InvoicingPlan.payments` (`cascade=ALL`, `orphanRemoval=true`) |
| Annulation = simple changement d'état, aucune pièce comptable | `billing/ActionCancelHandler` |
| « Payé » posé à la main | `billing/ActionCloseHandler`, `ActionPayAllCashHandler` |
| Numérotation attribuée au brouillon, logique dupliquée | `RefreshInvoicingPlansService:701`, `InvoicingPlanService:423` |
| Règles salon mêlées au calcul de facturation | `RefreshInvoicingPlansService.buildExpectedInvoices` (lignes 539-600) |
| Facturation déclenchée avant acceptation | `PublicRegistrationService` (2 appels), `AdminParticipationResource`, `Importation2026Service` |
| QR sans référence → rapprochement bancaire impossible | `GenerateQRCode.buildBill` lignes 37-39 |
| `State.ISOLATED` = astuce pour les repas séparés | `domain/enumeration/State.java` |
| Annulation d'une participation bloquée dès qu'une facture existe | `participation/ActionCancelHandler` |
| Aucun test automatisé (`src/test/java` vide) | `src/test/java/ch/salon/service/` (dossier vide) |

## 2. Approche

Construire un module **`ch.salon.billing` générique** (aucune notion de salon) à côté de l'existant, piloté par un
**adaptateur `ch.salon.participation.billing`**, derrière un drapeau par salon. L'ancien moteur reste intact
jusqu'à la bascule (étape 8, hors périmètre de ce plan).

Le prototype fournit déjà un moteur d'écarts correct, des invariants et une suite de tests ; il sert de socle,
après retrait des acomptes et application des 7 écarts du §5.6.

### Décisions arrêtées avec le mainteneur

| Sujet | Décision |
|---|---|
| **Acomptes** | **Retirés** de la v2. Seuls les points d'extension du §9 sont respectés (clés `deposit:*` réservées, série `A` réservée, enums extensibles, `LineType.isCharge()`, affectations polymorphes, `CancellationDecision` en record). |
| **Import camt.054** | **Reporté** à une étape ultérieure. L'étape 3 se limite à la saisie manuelle de paiements + paiements non identifiés. L'abstraction (`BankNotification`, `ImportResult`, `bank_reference` unique, idempotence) est posée mais sans parseur. |
| **Persistance** | **Agrégat pur + repository** : `ch.salon.billing.domain` reste sans Spring ni JPA (règle ArchUnit §3). Un `BillingCaseRepository` charge l'agrégat complet et persiste les nouveautés. |
| **Numérotation** | Clé = (`tenant_id`, `salon_id`, `series`, `year`). Chaque salon a sa propre suite continue. |
| **Drapeau de bascule** | Nouveau champ booléen `billingV2Enabled` sur l'entité `Salon`. |
| **Livraison** | Une seule fois, découpage git libre ; `./mvnw verify` vert à la fin de chaque étape. |
| **PDF** | Modèles actuels conservés, adaptations minimales (§7). Pas de nouveau design. |

### Réglages métier retenus (`SalonSettingsData`, tous configurables)

| Réglage | Valeur par défaut |
|---|---|
| `paymentTermDays` | **30** jours |
| `reminderIntervalDays` | **7** jours |
| `reminderFees` | **0** (configurable ; facturable seulement si inscrit au règlement, R19) |
| `cancellationAllowedUntil` | configurable ; par défaut = **date de début du salon** (`salon.startingDate`) |
| `paymentDifferenceThreshold` | **5.–** ; l'écart n'est **jamais** soldé automatiquement — l'admin déclenche toujours `writeOff` manuellement |
| `servicePeriodLabel` | généré depuis `salon.startingDate`/`endingDate` (ex. « Salon des 15–16 mai 2027 »), surchargeable |

---

## 3. Étape 1 — Domaine `ch.salon.billing.domain`

**Objectif** : moteur pur, sans Spring ni JPA, testé par les scénarios du §12.

### 1.1 Mise en place du dossier de test

`src/test/java` existe mais est vide. Créer l'arborescence `src/test/java/ch/salon/billing/` et
`src/test/resources/logback.xml` (référencé par surefire dans le `pom.xml`).
Dépendances déjà présentes : `spring-boot-starter-test` (JUnit 5 + AssertJ), ArchUnit 1.3.0, Testcontainers PostgreSQL.

### 1.2 Reprise du prototype

Copier `docs/prototype-billing-v2/src/main/java/ch/salon/billing/domain/*` vers
`src/main/java/ch/salon/billing/domain/`, puis :

**À retirer (acomptes)** :
- `BillingCase.requestDeposit`, `cancelDeposits`, `issueDepositCreditNote`, `deposits`, `depositPaid`,
  `deducted`, `depositCredited`, `depositAvailableForDeduction`, `undeductedDeposits`
  (`BillingCase.java` lignes 226-348) ;
- `LineType.DEPOSIT_DEDUCTION` ; la branche de déduction dans `issue()` (lignes 195-214) ;
- les tests d'acompte de `ParticipationWorkflowTest` / `CancellationTest`.

**À conserver intact** : le moteur d'écarts (`pendingLines`, `billedPositions`, `syncCharges`), `Money`,
`CreditorReference`, les invariants (`checkInvariants`), le test aléatoire, les scénarios de référence.

### 1.3 Les 7 écarts du §5.6 à corriger

| # | Correction | Fichier visé |
|---|---|---|
| 1 | Retrait des acomptes (ci-dessus) | `BillingCase` |
| 2 | **Un document de crédit par facture d'origine** (R2) : `issue()` doit grouper les lignes négatives par facture d'origine (en consommant depuis la **plus récente** quand une clé/variante existe sur plusieurs factures) et émettre un `CREDIT_NOTE` par facture corrigée | `BillingCase.issue`, `PendingLine.corrects` |
| 3 | **Une facture ne contient jamais de `REVERSAL`** (R1) : séparer l'émission en 2 temps — documents de crédit d'abord, facture des lignes positives ensuite | `BillingCase.issue` |
| 4 | Ajouter `CreditPurpose { PARTIAL, CANCELLATION }` : `CANCELLATION` si toutes les lignes de la facture d'origine sont intégralement contre-passées | nouveau `CreditPurpose`, `BillingDocument` |
| 5 | **Imputation art. 86-87 CO** (R14) : document désigné s'il est ouvert → dettes exigibles par échéance la plus ancienne → non échues par échéance → avoir. Remplace le tri actuel par `issueDate` (`BillingCase:459-464`) | `BillingCase.openReceivablesOldestFirst`, `allocateAvailableCredit` |
| 6 | Ajouter : paiement non identifié, `assignPayment`, `reallocate`, `reversePayment`, `writeOff`, `recoverWrittenOff`, `transferCredit`, `cancelInvoice`, `reissueInvoice`, `rectifyCreditNote`, `changeDueDate` | `BillingCase` (§5.3/§5.4) |
| 7 | (Étape 2) persistance | — |

### 1.4 Ajouts de modèle

- `ChargeSpec` : ajouter `category`, `taxCode`, `attributes` si absents du prototype ; `TaxCode { NONE }`.
- `Party` (remplace/complète `Debtor`) avec `requireIssuable()` : nom + localité + pays obligatoires (R11),
  sinon `issue()` refuse **sans consommer de numéro**.
- `Allocation` : `sourceType` (`PAYMENT`, `CREDIT_NOTE`), `targetType` (`DOCUMENT`, `REFUND`, `WRITE_OFF`,
  `TRANSFER`), `reversesAllocationId`, montant signé, `reason`, `user`.
- `LineType` : ajouter `RECTIFICATION` ; `isCharge()` reste le filtre unique du moteur d'écarts.
- Événements §5.5 : ajouter `PaymentReceivedOnClosedDocument`, `DocumentReopened`,
  `UnidentifiedPaymentReceived` à `BillingEvent`.

### 1.5 Tests (spécification exécutable)

Reprendre les classes du prototype (`SyncRulesTest`, `IssuingTest`, `PaymentsTest`, `CancellationTest`,
`ParticipationCancellationTest`, `ParticipationWorkflowTest`, `RealLifeScenariosTest`, `ReferenceScenarioTest`,
`RandomizedInvariantsTest`, `CreditorReferenceTest`, `BillingArchitectureTest` + le `support/`), puis :

- supprimer les tests d'acompte ;
- adapter les attentes aux écarts 2-5 (une NC par facture, `purpose`, ordre d'imputation) ;
- **ajouter un test par cas limite C1 à C26** du §10 ;
- ajouter les tests d'annulation du tableau §12 (9 situations) ;
- robustesse : 300 vies × 60 opérations, invariants à chaque pas, compteurs d'exploration minimums ;
- **qualité des tests** : injecter les 3 bugs du §12 (poste retiré non annulé, imputation par date d'émission,
  validation sur `paid=false`) et vérifier qu'au moins un test tombe pour chacun.

**Critères d'acceptation** : tests verts ; `checkInvariants()` appelé dans chaque test ; aucun `Double`/`double`
dans `ch.salon.billing` ; `BillingArchitectureTest` vert.

---

## 4. Étape 2 — Persistance JPA + Liquibase

### 2.1 Schéma

Nouveau changelog `config/liquibase/changelog/0.0.2/0.0.2_202611-billing.xml`, inclus en fin de
`0.0.2/0.0.2_master.xml` (convention existante : XML, `relativeToChangelogFile="false"`).

Les 14 tables du §4.2, **plus** `salon_id` et `tenant_id` là où nécessaire :

`billing_case`, `billing_desired_charge`, `billing_document`, `billing_document_line`, `billing_payment`,
`billing_payment_reversal`, `billing_allocation`, `billing_refund`, `billing_write_off`, `billing_reminder`,
`billing_due_date_change`, `billing_credit_transfer`, `billing_number_sequence`.

Adaptations au projet :
- toutes les tables portent `tenant_id` et les entités implémentent `TenantOwned` (39 entités le font déjà,
  filtrage automatique par `@TenantId` + `TenantEnforcementListener`) ;
- `billing_number_sequence` : clé unique (`tenant_id`, `salon_id`, `series`, `year`) ;
- types : `NUMERIC(12,2)` pour les montants, `NUMERIC(12,3)` pour les quantités, `JSONB` pour
  `attributes` / `party_snapshot` ;
- ajout de `salon.billing_v2_enabled BOOLEAN NOT NULL DEFAULT false` ;
- ajout des nouveaux réglages dans `SalonSettingsData` (JSONB, pas de migration de schéma).

### 2.2 Immuabilité en base

Déclencheurs PostgreSQL `BEFORE UPDATE OR DELETE` levant une exception sur `billing_document`,
`billing_document_line`, `billing_payment`, `billing_allocation`, `billing_refund` — sauf la liste blanche
`billing_document.sent_at` / `send_error` / `pdf_path` / `pdf_sha256`.
Côté Java : entités sans setter public, `@Immutable` Hibernate.

### 2.3 Repository d'agrégat

```
ch.salon.billing.infrastructure
├── jpa/            entités JPA (BillingCaseEntity, BillingDocumentEntity, …) + mappers
├── JpaBillingCaseRepository   implémente BillingCaseRepository (port du domaine)
├── JpaDocumentNumberSequence  implémente DocumentNumberSequence (SELECT … FOR UPDATE)
└── PdfArchiveStore            archivage + SHA-256
```

- `load(SourceRef)` → reconstruit un `BillingCase` complet (documents, lignes, paiements, affectations,
  remboursements, pertes) ;
- `save(BillingCase)` → insère **uniquement** les nouveautés ; `version` du dossier = verrou optimiste (C22) ;
- `DocumentNumberSequence` JPA : `SELECT … FOR UPDATE` sur `billing_number_sequence`, dans la transaction,
  numéro attribué **uniquement à l'émission** ; réinitialisation à 1 au changement d'année (R7).

### 2.4 Tests

Testcontainers PostgreSQL (`*IT` → failsafe) :
- 50 émissions concurrentes → numéros uniques, continus, sans trou ;
- `UPDATE`/`DELETE` sur les tables immuables → exception ;
- chargement/sauvegarde de l'agrégat : aller-retour fidèle (tous les invariants tiennent après rechargement) ;
- collision de verrou optimiste → échec propre et rejouable ;
- isolation multi-tenant : un dossier d'un autre tenant est invisible.

---

## 5. Étape 3 — `BillingService` + événements + paiements

### 3.1 API applicative

`ch.salon.billing.application.BillingService` — seul point d'entrée, transactionnel :

| Catégorie | Opérations |
|---|---|
| Dossier | `openCase`, `syncCharges`, `pendingLines`, `closeCase`, `changeDebtor` |
| Émission | `issue(source, IssueRequest{group, dueDate})` |
| Documents | `cancelInvoice`, `reissueInvoice`, `rectifyCreditNote`, `changeDueDate`, `resend` |
| Argent | `recordPayment`, `assignPayment`, `reallocate`, `reversePayment`, `refund`, `markRefundReturned`, `transferCredit`, `writeOff`, `recoverWrittenOff` |
| Lecture | `caseView`, `documentView`, `statement`, listes de travail |
| Planifié | `scanOverdue` |

### 3.2 Événements

Publication via `ApplicationEventPublisher`, **synchrone dans la transaction** ; les e-mails partent
**après commit** (`@TransactionalEventListener(AFTER_COMMIT)`).
`checkInvariants()` après chaque opération, **y compris en production** : log d'erreur + rollback si faux.

Journal d'actions : réutiliser `EventLogService` avec deux nouveaux `EntityType` :
`BILLING_CASE`, `BILLING_DOCUMENT`.

### 3.3 Paiements non identifiés

`recordPayment` sans source → `billing_payment.case_id = null`, événement `UnidentifiedPaymentReceived`,
liste de travail. `assignPayment(payment, source)` rattache puis applique R14.
`bank_reference` unique → un même avis saisi deux fois est ignoré (idempotence déjà prévue pour l'import futur).

### 3.4 Retards

`scanOverdue` planifié (`@Scheduled`) ; `DocumentOverdue` publié **une seule fois par document et par échéance**
(prolonger l'échéance réarme l'événement). L'ordonnancement « import bancaire avant contrôle des retards »
(C17) est préparé mais sans effet tant que l'import est reporté.

### 3.5 Web

`ch.salon.billing.web.AdminBillingResource` — nouveaux endpoints `/api/admin/billing/**`,
`@PreAuthorize` `ADMIN_BUSINESS` (convention de `AdminInvoicingPlanResource`).
**Aucune route existante n'est modifiée.**

**Critères d'acceptation** : scénario de référence en intégration ; C1, C6, C7, C8, C19, C22 en intégration ;
double saisie d'une même `bank_reference` ignorée.

---

## 6. Étape 4 — PDF, QR et archivage

### 4.1 `BillingDocumentViewModelFactory`

Produit **exactement les variables actuelles** de `DownloadInvoiceHandler` (lignes 50-103) pour que
`templates/document/invoice.html` et `invoice-receipt.html` changent le moins possible :

`headerTitle`, `reference`, `sentDate`, `expirationDate`, `contact`, `phone`, `arrangement`, `invoices`,
`payments`, `hasPaidSomething`, `total`, `iban`, `qrBillDataUri`, `sender`, `recipient`.

Correspondances nouvelles :
- `invoices` → petit DTO exposant `getLabel()`, `getCustomAmount()`, `getQuantity()`, `getTotalAmount()`
  en `BigDecimal` ;
- `payments` → **imputations** du document : paiements (« Paiement reçu le … ») et avoirs
  (« Avoir NC-… imputé ») — le bloc liste **toute affectation entrante**, ce qui prépare les acomptes (§9) ;
- `total` → solde à payer (facture) ou montant crédité, négatif (document de crédit) ;
- `recipient` → **snapshot** figé du document (R10), pas l'exposant courant ;
- `headerTitle` → « FACTURE » / « NOTE DE CRÉDIT SUR LA FACTURE F-… » / « ANNULATION DE LA FACTURE F-… » (R3).

### 4.2 Adaptations minimales de `invoice.html`

Nouvelles variables : `isCreditDocument`, `correctedNumber`, `correctedDate`, `creditReason`, `servicePeriod`.
Si `isCreditDocument` : ligne « Facture corrigée : F-… du … » + motif ; blocs « Important » et QR masqués ;
texte R4 à la place (impayée → « plus aucun montant n'est dû » ; payée → « porté en déduction » / « remboursé »).
`servicePeriod` affiché sous la référence.
Nouvelles clés i18n `document.invoice.credit.*` dans les 4 fichiers `i18n/messages*.properties`
(fr, de, en, défaut) — **aucune chaîne en dur**.

### 4.3 QR

`CreditorReference.fromDocumentNumber(number)` (déjà dans le prototype, testé par `CreditorReferenceTest`) :
`F-2027-0001` → `RF..F20270001` (ISO 11649). Brancher dans `GenerateQRCode.buildBill`
(remplace la référence nulle, lignes 37-39), message « Facture F-… ».
Montant du QR = **solde à payer à l'émission**, figé dans le PDF (R13).
Pas de QR si document de crédit ou solde 0.
`bill.setAmountFromDouble` → passer en `BigDecimal`.

### 4.4 Nouveaux documents non comptables

`reminder.html` (titre « RAPPEL n », document d'origine, montant restant dû, même référence QR) et
`statement.html` (relevé de compte : documents, paiements, solde) — **mêmes fragments `common/*`,
même CSS, aucun nouveau design**.

### 4.5 Archivage

PDF émis écrit une fois + empreinte SHA-256 en base (R9) ; `resend(doc)` renvoie **le même fichier**.
Échec d'envoi → document émis quand même, `send_error` renseigné (C23).

**Critères d'acceptation** : une facture simple sort **visuellement identique** à aujourd'hui ; QR décodable
avec la bonne référence RF et le bon montant ; `resend` → empreinte inchangée.

### 4.6 À signaler au comité (ne pas corriger sans accord)

1. Le bulletin QR est réduit à ~170 mm au lieu de 210 × 105 mm en bas de page.
2. Le bloc adresse n'est pas dans la fenêtre C5 (x 117–196 mm, y 47–81 mm).

---

## 7. Étape 5 — Adaptateur `ch.salon.participation.billing`

### 5.1 `ParticipationBillingPolicy`

`List<ChargeSpec> desiredCharges(Participation p)` — **reprend exactement les prix** de
`RefreshInvoicingPlansService.buildExpectedInvoices` (lignes 539-600) et `estimateCost` (lignes 498-526) :

| Clé | Source du prix | Groupe |
|---|---|---|
| `stand:{id}` | `PriceStandSalon.price` selon la dimension | `main` |
| `shared:{id}` | `salon.priceSharingStand` | `main` |
| `conference:{id}` | `salon.priceConference` | `main` |
| `workshop:{id}` | `salon.priceWorkshop` | `main` |
| `meal:1|2|3` | `salon.priceMeal1..3` × `participation.nbMeal1..3` | `meals` si `modePaymentMeals == SEPARATE`, sinon `main` |
| `postal-fee` | 3.00 (`POSTAL_FEE_AMOUNT`), `ChargeKind.FEE` | `main` |
| `cancellation-fee` | décision d'annulation, `FEE` | `main` |
| gestes commerciaux | `ChargeKind.DISCOUNT` (montant négatif) | groupe concerné |

Règles :
- liste **vide** si statut ∉ {`ACCEPTED`, `VALIDATED`} — sauf `CANCELED` avec frais : seul `cancellation-fee` ;
- seuls les sous-objets `ACCEPTED`/`VALIDATED` sont facturés ;
- `attributes` = ce qui, s'il change, doit donner **annulation + nouvelle ligne** (ex. `dimension` d'un stand) ;
- `Double` → `BigDecimal` à la frontière : conversion unique et explicite dans la policy
  (les entités `Salon`/`PriceStandSalon` gardent leurs `Double` tant que l'ancien moteur vit).

`IssueRequest issueRequest(Participation p, String group)` : échéance = `salon.endingDate` si
`needArrangement`, sinon `issueDate + paymentTermDays` (30).

### 5.2 `ParticipationBillingSync.sync(participationId)`

`openCase` + `syncCharges(source, policy.desiredCharges(p))`.
Remplace les 4 appels actuels, **derrière le drapeau `salon.billingV2Enabled`** :
`AdminParticipationResource:97`, `Importation2026Service:184`, `PublicRegistrationService:171` et `:214`.
Appelé aussi après toute modification d'un sous-objet, des repas ou du mode d'envoi.
**Rien** n'est envoyé tant que la participation est `IN_VERIFICATION` (l'inscription publique ne crée plus de
brouillon). Après clôture : plus aucun `sync`.

### 5.3 Cycle de vie (§6.4)

| Transition | Déclencheur | Effet |
|---|---|---|
| `IN_VERIFICATION → ACCEPTED` | `ActionAcceptHandler` | sous-objets `ACCEPTED` ; `sync` ; aucun document |
| `IN_VERIFICATION → REFUSED` | `ActionRefuseHandler` | aucun appel facturation |
| `ACCEPTED → VALIDATED` | `DocumentSettled(INVOICE, paid=true)` sur une facture du groupe `main` | sous-objets `ACCEPTED → VALIDATED` + e-mail |
| `ACCEPTED → VALIDATED` | `DocumentIssued(INVOICE)` + `needArrangement` | idem |
| `ACCEPTED → VALIDATED` | `ActionValidateHandler` (« valider quand même ») | idem + **motif obligatoire** ; supprimer le `TODO` existant |
| `* → CANCELED` | `ActionCancelHandler` jusqu'à `cancellationAllowedUntil` | §5.4 ci-dessous ; **supprimer** la condition `invoices-settled` |
| `CANCELED → ACCEPTED` | **nouveau** `ActionReinstateHandler` | sous-objets `ACCEPTED` ; `sync` ; l'avoir s'imputera sur la prochaine facture |
| `VALIDATED → CLOSED` | `ActionCloseHandler` | salon terminé **et** dossier soldé (rien à facturer, solde 0, avoir 0, aucun paiement non identifié lié) |

`ParticipationBillingEventListener` : `@EventListener` sur `BillingEvent`, **ignore** `source.type != "PARTICIPATION"`.
La validation s'appuie sur une **liste de `ValidationRule`** (point d'extension §9 : « acompte payé » sera une règle
de plus). Une participation validée n'est **jamais** dé-validée par un `DocumentReopened` (retour de paiement) :
elle est signalée « paiement à régulariser ».

### 5.4 `ParticipationCancellationService.cancel(p, CancellationDecision)`

`CancellationDecision = { Money cancellationFee (≥ 0), boolean refundNow }` — record extensible (§9).

1. Refuser après `cancellationAllowedUntil` (défaut : `salon.startingDate`) — C15.
2. Participation + sous-objets → `CANCELED`.
3. `desiredCharges` = `[cancellation-fee]` si frais > 0, sinon `[]` → `sync` → `issue` sur chaque groupe :
   une annulation par facture + éventuelle facture de frais (l'avoir s'y impute).
4. `refundNow` et avoir > 0 → `refund` ; sinon l'avoir part dans « avoirs à traiter ».
5. E-mail : confirmation + documents émis + relevé de compte.

### 5.5 Non-régression (critère d'acceptation central)

Test paramétré sur **toutes les participations du salon 2026** : pour chacune,
`Σ desiredCharges (nouvelle policy) == Σ montants facturés par l'ancien moteur`.
Tout écart est soit un bug de la policy, soit un écart documenté et justifié.

Plus : scénarios cycle de vie et tableau d'annulation (§12) verts.

---

## 8. Ce qui n'est PAS fait dans ce plan

| Sujet | Étape | Raison |
|---|---|---|
| Import bancaire camt.054 (parseur, rapprochement, rapport) | 3 (reportée) | Décision : saisie manuelle d'abord |
| UI admin Angular `admin/billing` | 6 | Hors périmètre |
| Rappels automatiques, pertes, récupérations, report d'avoir, export comptable CSV | 7 | Hors périmètre (les opérations domaine existent, l'outillage non) |
| Bascule 2027, mise en lecture seule de l'ancien, suppression du code mort | 8 | Hors périmètre |
| Acomptes | future | Points d'extension §9 respectés |
| Migration des données 2026 | — | Aucune : 2026 se termine sur l'ancien système |
| Intérêts moratoires (R20) | — | Option désactivée par défaut |
| TVA | — | Association non assujettie ; `TaxCode.NONE` en place |

---

## 9. Points de vigilance

1. **Ne rien supprimer de l'existant** avant l'étape 8. `RefreshInvoicingPlansService`, `InvoicingPlan`,
   `State.ISOLATED`, les handlers billing actuels et `incrementBillingNumber` restent en place et fonctionnels.
2. **`./mvnw verify` exécute Spotless en `process-sources`** (phase `apply`) : il reformate les sources.
   Lancer un `verify` avant commit pour éviter un diff parasite.
3. **Tests unitaires vs intégration** : surefire exclut `**/*IT*` et `**/*IntTest*`, failsafe les inclut.
   Les tests de domaine (étape 1) doivent donc **ne pas** contenir `IT` dans leur nom.
4. **Multi-tenant** : `TenantEnforcementListener` lève une `SecurityException` sur `UPDATE` d'une entité d'un
   autre tenant. Les tâches planifiées (`scanOverdue`) tournent hors requête HTTP → `TenantContextHolder` en
   mode SYSTEM : le `tenantId` doit être posé explicitement.
5. **`Double` aux frontières** : `Salon.priceMeal*`, `PriceStandSalon.price`, `salon.priceConference`… restent
   en `Double`. Conversion `BigDecimal.valueOf(double)` **uniquement** dans `ParticipationBillingPolicy`,
   jamais d'arithmétique en `double`.
6. **ArchUnit** : écrire les 3 règles du §3 dès l'étape 1 pour qu'elles cassent le build au premier écart.
7. **`checkInvariants()` en production** : prévoir un log explicite et un rollback, pas un simple `assert`.

---

## 10. Définition de « terminé » pour ce plan

- Étapes 1 à 5 livrées, `./mvnw verify` vert, ArchUnit vert.
- Scénario de référence reproduit : prestations finales 625.– → F-0001 515, F-0002 67.50 (repas),
  NC sur F-0001 −485, F-0003 550 (avoir imputé, solde 65), NC sur F-0002 −22.50 (imputée sur F-0003,
  solde 42.50), 3 paiements, dossier soldé.
- Une facture simple sort **visuellement identique** à aujourd'hui, avec la nouvelle numérotation et un QR
  rapprochable.
- Non-régression 2026 : `Σ desiredCharges == Σ facturé` pour chaque participation.
- Aucun `Double` dans `ch.salon.billing` ; rien d'émis n'est modifiable (vérifié en base) ; aucune notion de
  participation dans `ch.salon.billing`.
- L'ancien moteur fonctionne toujours à l'identique quand `billingV2Enabled = false`.
