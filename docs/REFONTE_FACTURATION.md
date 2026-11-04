# Refonte de la facturation — instructions pour l'agent de développement (v2)

> Ce fichier est destiné à l'IA (agent de code) qui va refactorer le projet **ajoie**
> (Spring Boot 4 / Java 21 / JPA + PostgreSQL / Liquibase / Thymeleaf + Flying Saucer / Angular).
> Il dit **quoi** construire, **pourquoi**, **dans quel ordre**, et **comment vérifier**.
> Lis-le en entier avant de toucher au code.
>
> **Périmètre de cette version**
> - ✅ Facturation normale : une ou plusieurs factures par participation, corrections, annulations, paiements,
>   avoirs, remboursements, rappels, pertes, clôture.
> - ⏸️ **Acomptes : PAS implémentés maintenant**, mais le modèle doit permettre de les ajouter sans refonte
>   (section 9 : points d'extension à respecter dès maintenant).
> - 🎨 **Modèles PDF : on garde les modèles actuels** (`templates/document/invoice.html`,
>   `invoice-receipt.html` et fragments `common/*`). On les **adapte au minimum** pour les nouvelles données et
>   les nouveaux types de documents (section 7). Pas de nouveau design.
>
> Langue du domaine : français (libellés, documents, messages). Code : identifiants en anglais.

---

## 0. Comment travailler

1. **Ne rien supprimer de l'existant avant la dernière étape.** Le nouveau module vit à côté de l'ancien
   (`InvoicingPlan`, `RefreshInvoicingPlansService`…) jusqu'à la bascule, derrière un drapeau par salon.
2. **Une étape = une PR**, compilable, testée, sans régression. Respecter l'ordre de la section 11.
3. **Tests d'abord pour le moteur** : les scénarios de la section 12 sont la spécification.
   Le dossier `src/test` n'existe pas encore : le créer (JUnit 5 + AssertJ via `spring-boot-starter-test`,
   Testcontainers PostgreSQL déjà dans le `pom.xml`).
4. **Montants : `BigDecimal` uniquement** (jamais `Double`/`double`), échelle 2, `RoundingMode.HALF_UP`.
5. **Rien d'émis ou d'enregistré ne se modifie ni ne se supprime** (document, ligne, paiement, affectation,
   remboursement). Une erreur se corrige toujours par une **opération inverse tracée**.
6. En cas de doute sur une règle, **ne pas inventer** : poser la question dans la PR (section 13).

---

## 1. Ce qui existe aujourd'hui

| Élément | Emplacement | Problème |
|---|---|---|
| `InvoicingPlan` (= un document), `Invoice` (= une ligne), `Payment` | `src/main/java/ch/salon/domain/` | Montants `Double` ; document émis modifiable (`updateInvoice`/`deleteInvoice` sans contrôle d'état) ; paiements collés à un document et modifiables ; annulation = changement d'état sans pièce comptable |
| `RefreshInvoicingPlansService` (~700 lignes) | `service/` | Règles du salon (stands, repas, frais postaux) mélangées au calcul de facturation ; appelé dès l'inscription publique (avant acceptation) |
| `incrementBillingNumber` (dupliqué dans 2 services) | `service/` | Numéro attribué au brouillon ; `FIX ME` : repart à 0 si tout est annulé |
| `State` : `DRAFT, ISOLATED, IS_ISSUING, ISSUED, PAID, CANCELLED` | `domain/enumeration/` | `ISOLATED` = astuce des repas séparés ; `PAID` posé à la main |
| `handlers/impl/billing/*` | `service/handlers/impl/billing/` | `ActionCloseHandler` marque payé à la main ; `ActionCancelHandler` annule sans document ; `ActionPayAllCashHandler`… |
| `participation/ActionCancelHandler` | | Annulation **bloquée** dès qu'une facture existe |
| `participation/ActionValidateHandler` | | `TODO` : valider seulement si payé ou arrangement |
| `GenerateQRCode.buildBill` | `service/` | `reference = null` + message libre → rapprochement bancaire impossible |
| `DownloadInvoiceHandler`, `DownloadReceiptHandler` | `handlers/impl/billing/` | Construisent le contexte Thymeleaf depuis `InvoicingPlan` |

Appels de `refreshInvoicingPlans(...)` à remplacer par la synchronisation (§6.3) :
`AdminParticipationResource:97`, `Importation2026Service:184`, `PublicRegistrationService:171` et `:214`.

---

## 2. Règles métier et comptables (référence)

**[norme]** = droit ou norme technique suisse · **[usage]** = bonne pratique comptable courante ·
**[métier]** = décision du salon (modifiable, à confirmer section 13).

### 2.1 Documents de cette version

| Code | Document | Série | Contenu autorisé | Effet comptable (proposition, à valider fiduciaire) |
|---|---|---|---|---|
| `INVOICE` | Facture | `F` | Prestations (lignes positives) + rabais (lignes `DISCOUNT` négatives) | 1100 Débiteurs / 3xxx Produits |
| `CREDIT_NOTE` + `purpose=PARTIAL` | Note de crédit sur facture | `NC` | Lignes négatives corrigeant **une seule** facture | 3xxx Produits / 1100 Débiteurs |
| `CREDIT_NOTE` + `purpose=CANCELLATION` | Annulation de facture | `NC` | Copie négative **exacte** d'**une seule** facture | 3xxx Produits / 1100 Débiteurs |

Documents non comptables (sans numéro de série, mais archivés et tracés) : quittance, rappel,
relevé de compte, avis de remboursement.

- **R1 [usage]** Une facture ne contient **jamais** de ligne « Annulation : … ». Toute correction = un document de crédit.
- **R2 [usage]** Un document de crédit corrige **une seule** facture et cite son numéro et sa date.
- **R3 [usage]** Titres explicites : « Facture », « Note de crédit sur la facture F-… », « Annulation de la facture F-… ».
  Jamais « Note de crédit » seul (sonne « on vous doit de l'argent » ; en TVA suisse le terme désigne aussi un
  document établi par l'acheteur).
- **R4 [usage]** Texte du document de crédit selon l'état de la facture corrigée : impayée → « le montant dû est
  réduit / plus aucun montant n'est dû » ; payée → « X est porté en déduction de F-… » ou « vous sera remboursé ».
- **R5 [usage]** Une perte sur créance n'est **pas** une note de crédit : opération `WRITE_OFF`.
- **R6 [usage]** Une note de crédit émise par erreur ne s'annule pas : on émet une **facture de rectification**
  (mêmes lignes en positif) qui la cite.

### 2.2 Numérotation

- **R7 [usage]** Une série par type × année : `F-2027-0001`, `NC-2027-0001` (la série `A` est réservée aux acomptes,
  §9). Numéro attribué **uniquement à l'émission**, dans la transaction, via un compteur en base verrouillé
  (`SELECT … FOR UPDATE`). Pas de trou, pas de doublon. (En Suisse ce n'est pas une obligation légale stricte, mais
  c'est la pratique attendue en révision et en contrôle TVA.)
- **R8** Pas de brouillon numéroté : « à facturer » = lignes calculées, pas un document.

### 2.3 Conservation et intégrité

- **R9 [norme]** Conservation 10 ans (art. 958f CO) ; intégrité : toute modification doit être visible
  (Olico art. 3). → Aucun `UPDATE`/`DELETE` sur documents émis, lignes, paiements, affectations, remboursements ;
  PDF émis archivé + empreinte SHA-256 en base ; « Renvoyer » renvoie **le même fichier**.
- **R10 [usage]** L'adresse du débiteur est **copiée** dans le document à l'émission.

### 2.4 QR-facture

- **R11 [norme]** QR-facture SIX v2.3 : adresses **structurées** (type S) pour créancier et débiteur ; minimum nom +
  localité + pays. Émission **refusée** sinon (le projet a déjà des adresses structurées via `PostalParty`).
- **R12 [norme]** Référence **créancier RF (ISO 11649, SCOR)** dérivée du numéro (`F-2027-0001` → `RF..F20270001`).
  Pas de référence QRR (exigerait un QR-IBAN).
- **R13** Montant du QR = **solde à payer** du document à l'émission ; sur un rappel = montant restant dû, même référence.
  Pas de QR sur un document de crédit, ni si le solde est 0.

### 2.5 Paiements, avoirs, retards

- **R14 [norme]** Ordre d'imputation d'un paiement (art. 86-87 CO) :
  1. le document désigné par le débiteur (référence QR, communication) **s'il est encore ouvert** ;
  2. sinon les dettes **exigibles** (échéance ≤ date de valeur du paiement), la **plus anciennement échue** d'abord ;
  3. puis les documents non échus, par échéance ;
  4. le reste devient un **avoir** du dossier.
  Une note de crédit s'impute d'abord sur la facture qu'elle corrige, puis selon 2-4.
- **R15 [usage]** Imputer un avoir sur une **autre** facture (compensation) est permis mais **communiqué** :
  mention sur le document concerné + **relevé de compte** joint.
- **R16 [usage]** Avoir non imputé : remboursé, ou reporté sur l'édition suivante **avec accord écrit** (pièce jointe
  obligatoire au transfert).
- **R17** Statut d'un document **toujours calculé** : `OPEN`, `PARTIALLY_PAID`, `OVERDUE`, `PAID`,
  `CANCELLED` (soldé par une `CANCELLATION`), `WRITTEN_OFF`.
- **R18** L'événement « facture réglée » dit si elle a été réglée **par de l'argent** (`paid=true`) ou par un document
  de crédit (`paid=false`). Seul `paid=true` peut valider une participation.
- **R19 [norme]** Frais de rappel : **seulement** s'ils sont prévus dans le règlement exposants. Facturés par facture
  complémentaire (`FEE`).
- **R20 [norme]** Intérêt moratoire 5 %/an (art. 104 CO) dû dès l'échéance fixée (art. 102 al. 2 CO).
  Option **désactivée par défaut**.
- **R21 [usage]** Espèces : arrondi aux 5 centimes.
- **R22 [métier]** Écart de paiement ≤ seuil configurable (défaut 0 = désactivé) : soldable par `WRITE_OFF`
  motif « écart de paiement ».

### 2.6 TVA

- **R23 [norme]** Association non assujettie (seuil CHF 250'000 pour une association culturelle sans but lucratif
  gérée bénévolement) : **aucune TVA** sur les documents. Prévoir `TaxCode` par ligne (`NONE` aujourd'hui).

### 2.7 Mentions sur chaque document

Émetteur (nom, adresse, site, IBAN), destinataire, titre, numéro, date d'émission, **date ou période de la
prestation** (« Salon des 15–16 mai 2027 »), échéance (factures), lignes (libellé, quantité, prix unitaire,
montant), total, **imputations** (paiements, avoirs) et **solde à payer**, référence QR, contacts.
Document de crédit : facture corrigée (numéro + date) + motif.

---

## 3. Architecture cible

```
ch.salon.billing                       ← module GÉNÉRIQUE (aucune notion de salon)
├── domain                             ← règles pures : pas de Spring, pas de JPA dans la logique
├── application                        ← BillingService (API), BankImportService, DunningService, ExportService
├── infrastructure                     ← JPA, repositories, numérotation, archivage PDF, lecture camt.054
└── web                                ← AdminBillingResource

ch.salon.participation.billing         ← ADAPTATEUR côté salon
├── ParticipationBillingPolicy         ← quoi facturer, prix, groupes, échéances
├── ParticipationBillingSync           ← appelé après chaque modification de participation
├── ParticipationBillingEventListener  ← réagit aux événements de la facturation
├── ParticipationCancellationService   ← orchestre l'annulation
└── BillingDocumentViewModelFactory    ← prépare les variables des modèles PDF ACTUELS (§7)
```

Règles ArchUnit (dépendance déjà dans le `pom.xml`) :
- `ch.salon.billing..` ne dépend pas de `ch.salon.domain..`, `ch.salon.service..`, `ch.salon.web..` (hors `billing`).
- `ch.salon.billing.domain..` ne dépend pas de `org.springframework..`, `jakarta.persistence..`, `org.hibernate..`.
- Seul `ch.salon.participation.billing..` appelle `BillingService`.

La facturation identifie ce qu'elle facture par une **`SourceRef(type, id)`** (ex. `("PARTICIPATION", uuid)`).
Elle doit pouvoir servir demain à d'autres sources (sponsoring, cotisations…).

---

## 4. Modèle de données du module `billing`

> Point de départ possible : le prototype fourni (`prototype-billing-v2.zip`, package `ch.salon.billing`, 105 tests
> verts). Il est correct pour le moteur d'écarts, les paiements et les invariants. **Ne pas reprendre sa partie
> acompte** (`requestDeposit`, `cancelDeposits`, `DEPOSIT_DEDUCTION`) : la retirer, en gardant les points
> d'extension du §9. Corrections à appliquer : §5.6.

### 4.1 Value objects

```java
record Money(BigDecimal amount)                     // échelle 2, HALF_UP ; plus/minus/times/negate/min/roundToCash
record SourceRef(String type, String id)            // type en MAJUSCULES
record Party(String name, String street, String houseNumber, String postalCode,
             String city, String country, String language, String email)   // requireIssuable()
record ChargeSpec(String key, String label, BigDecimal quantity, Money unitPrice, Money listPrice,
                  ChargeKind kind, String group, String category, TaxCode taxCode,
                  Map<String,String> attributes)    // quantity > 0 ; prix négatif seulement si DISCOUNT
record Variant(String label, Money unitPrice, String group, ChargeKind kind, String category,
               TaxCode taxCode, Map<String,String> attributes)  // tout sauf quantité et prix catalogue
enum ChargeKind { SERVICE, DISCOUNT, FEE }
enum TaxCode { NONE }
enum DocumentKind { INVOICE, CREDIT_NOTE }          // §9 : DEPOSIT_INVOICE s'ajoutera ici
enum CreditPurpose { PARTIAL, CANCELLATION }        // §9 : DEPOSIT_CANCELLATION s'ajoutera ici
enum LineType { NEW, ADJUSTMENT, REVERSAL, RECTIFICATION;
                boolean isCharge() { return true; } } // §9 : DEPOSIT (isCharge=false) s'ajoutera ici
```

### 4.2 Tables (nouveau changelog dans `config/liquibase/changelog/0.0.2/`, inclus dans `0.0.2_master.xml`)

| Table | Colonnes principales | Remarques |
|---|---|---|
| `billing_case` | `id`, `tenant_id`, `source_type`, `source_id`, `label`, `currency` (`CHF`), `party_*` (adresse courante), `service_period_label`, `closed_at`, `version` | unique (`tenant_id`,`source_type`,`source_id`) ; `version` = verrou optimiste |
| `billing_desired_charge` | `case_id`, `key`, `label`, `quantity NUMERIC(12,3)`, `unit_price NUMERIC(12,2)`, `list_price`, `kind`, `group_key`, `category`, `tax_code`, `attributes JSONB`, `position` | **remplacée en entier** à chaque `syncCharges` |
| `billing_document` | `id`, `case_id`, `kind`, `purpose`, `number` unique, `group_key`, `issue_date`, `due_date`, `service_period_label`, `party_snapshot JSONB`, `total NUMERIC(12,2)`, `corrects_document_id`, `reason`, `qr_reference`, `pdf_path`, `pdf_sha256`, `sending_method`, `sent_at`, `send_error` | immuable sauf `sent_at`/`send_error` ; l'échéance se prolonge via `billing_due_date_change` |
| `billing_document_line` | `document_id`, `position`, `key`, `label`, `display_label`, `quantity`, `unit_price`, `amount`, `list_price`, `kind`, `category`, `tax_code`, `attributes JSONB`, `line_type`, `corrects_document_id` | immuable |
| `billing_payment` | `id`, `case_id` (nullable tant que non identifié), `value_date`, `amount` (>0), `mode` (`BANK`,`CASH`,`SERVICE`,`OTHER`), `bank_reference` unique nullable, `debtor_reference`, `payer_name`, `note` | immuable |
| `billing_payment_reversal` | `id`, `payment_id`, `date`, `reason` (`RETURNED_BY_BANK`, `ENTRY_ERROR`), `user` | neutralise un paiement et toutes ses affectations |
| `billing_allocation` | `id`, `source_type` (`PAYMENT`,`CREDIT_NOTE`), `source_id`, `target_type` (`DOCUMENT`,`REFUND`,`WRITE_OFF`,`TRANSFER`), `target_id`, `amount` (peut être **négatif** si `reverses_allocation_id`), `reverses_allocation_id`, `date`, `user`, `reason` | immuable ; une ré-affectation = contre-affectation + nouvelle affectation |
| `billing_refund` | `id`, `case_id`, `date`, `amount`, `reason`, `iban`, `status` (`PREPARED`,`SENT`,`RETURNED`), `exported_at` | un remboursement revenu (`RETURNED`) recrée l'avoir |
| `billing_write_off` | `id`, `document_id`, `date`, `amount`, `reason`, `recovered_amount` | |
| `billing_reminder` | `id`, `document_id`, `level` (1-3), `sent_at`, `open_amount`, `fee_document_id` | remplace `invoicing_plan_reminder` |
| `billing_due_date_change` | `document_id`, `old_due_date`, `new_due_date`, `reason`, `user`, `at` | |
| `billing_credit_transfer` | `id`, `from_case_id`, `to_case_id`, `amount`, `agreement_blob_id`, `date`, `user` | report d'avoir (R16) |
| `billing_number_sequence` | `tenant_id`, `series`, `year`, `next_value` | verrou `FOR UPDATE` |

Journal d'actions : réutiliser `EventLogService` (nouvel `EntityType.BILLING_CASE` / `BILLING_DOCUMENT`).

### 4.3 Grandeurs calculées (jamais stockées)

- `openAmount(doc)` = `total − Σ affectations (nettes) ciblant doc` (factures seulement).
- `status(doc, today)` (R17).
- `credit(case)` = Σ (montant de chaque source non annulée − Σ affectations nettes depuis cette source).
- `balance(case)` = Σ open − credit, **doit égaler** `ledgerBalance` = Σ totaux documents − Σ paiements non
  annulés + Σ remboursements (hors `RETURNED`) − Σ pertes + Σ récupérations.
  → `checkInvariants()` après chaque opération (en test **et** en production : log + rollback si faux).

---

## 5. Algorithmes

### 5.1 `syncCharges(source, List<ChargeSpec> desired)` — déclaratif, idempotent

Remplace l'état attendu **en entier** ; les lignes « à facturer » sont **recalculées à chaque lecture**.
Pour chaque clé (attendue ∪ déjà facturée) :
1. toute **variante** déjà facturée ≠ variante attendue (ou clé disparue) → ligne `REVERSAL` (−quantité nette) ;
2. variante attendue : `delta = attendu − net facturé` ; ≠ 0 → `NEW` (rien facturé) ou `ADJUSTMENT` (signé).
Ordre des postes sans effet ; deux envois identiques = aucun changement. Refuser clé en double, quantité ≤ 0, prix
négatif hors `DISCOUNT`, clés commençant par `deposit:` (réservées, §9). Un dossier clôturé refuse tout `sync`.

### 5.2 `issue(source, IssueRequest{group, dueDate})` — séparer ventes et corrections

1. **Lignes négatives** (`REVERSAL`, `ADJUSTMENT` < 0) → réparties par **facture d'origine** (pour une clé/variante
   présente sur plusieurs factures : consommer depuis la **plus récente**). → **un document de crédit par facture
   d'origine**, `CANCELLATION` si toutes ses lignes sont intégralement contre-passées, sinon `PARTIAL`.
   Une ligne `DISCOUNT` nouvelle (geste accordé après coup) : si le groupe a déjà une facture → note de crédit sur la
   plus récente ; sinon rabais sur la nouvelle facture.
2. **Lignes positives** → **une facture** pour le groupe.
3. Ordre : documents de crédit d'abord, puis la facture (l'avoir s'impute dessus, R14).
4. Solde à payer = `openAmount` après imputations → montant du QR, figé dans le PDF.
5. Numéroter (R7), copier l'adresse (R10), générer + archiver le PDF (R9), publier les événements.
Retour : documents émis (0..n). Rien à émettre → liste vide, aucun numéro consommé.

### 5.3 Opérations directes sur documents (actions admin)

| Opération | Effet |
|---|---|
| `cancelInvoice(doc, reason)` | `CANCELLATION` de cette facture (copie négative). Si la facture était payée → avoir. N'altère pas l'attendu : à utiliser pour une facture **erronée** (mauvais débiteur, doublon), sinon passer par `sync` + `issue`. |
| `reissueInvoice(cancelledDoc)` | Nouvelle facture, mêmes lignes, nouveau numéro, cite l'ancienne (annulation par erreur, débiteur corrigé). |
| `rectifyCreditNote(creditNote, reason)` | Facture de rectification (lignes `RECTIFICATION` positives) qui annule l'effet d'une note de crédit erronée (R6). |
| `changeDueDate(doc, newDate, reason)` | Trace dans `billing_due_date_change` ; le PDF n'est pas réémis. |
| `resend(doc)` | Renvoie le PDF archivé (même empreinte). |

### 5.4 Paiements et argent

| Opération | Effet |
|---|---|
| `recordPayment(source?, amount, mode, valueDate, debtorReference, bankReference)` | `amount > 0` ; `bankReference` déjà connue → ignoré ; source inconnue → paiement **non identifié** (`case_id` null) ; imputation R14 ; événements. |
| `assignPayment(payment, source)` | Rattache un paiement non identifié à un dossier, puis R14. |
| `reallocate(payment, fromDoc, toDoc, amount, reason)` | Contre-affectation + nouvelle affectation (paiement mal rapproché, erreur d'exposant). |
| `reversePayment(payment, reason)` | Retour bancaire ou erreur de saisie : contre-affectations de toutes ses affectations, puis neutralisation. Les factures redeviennent ouvertes. |
| `refund(source, amount, reason, iban)` | ≤ avoir ; statut `PREPARED → SENT` ; `markRefundReturned` recrée l'avoir. |
| `transferCredit(fromSource, toSource, amount, agreement)` | Report d'avoir avec accord écrit (R16). |
| `writeOff(doc, amount, reason)` | Perte sur créance ; le document passe `WRITTEN_OFF` s'il est soldé ainsi. |
| `recoverWrittenOff(doc, payment, amount)` | Paiement reçu après une perte : récupération (écriture « récupération de créance amortie »). |

### 5.5 Événements (Spring `ApplicationEventPublisher`, synchrones dans la transaction ; e-mails **après commit**)

```java
sealed interface BillingEvent { SourceRef source(); }
DocumentIssued(source, number, kind, purpose, total)
PaymentRecorded(source, paymentId, amount)
PaymentReceivedOnClosedDocument(source, paymentId, documentNumber, documentStatus) // alerte admin (§10)
DocumentSettled(source, number, kind, boolean paid)     // R18
DocumentReopened(source, number)                        // après reversePayment / reallocate
DocumentOverdue(source, number, kind, Money open)       // publié une fois par document et par échéance
CaseSettled(source)                                     // solde 0 et avoir 0
CreditAvailable(source, Money credit)
UnidentifiedPaymentReceived(paymentId, amount, debtorReference)
```

### 5.6 Écarts entre le prototype fourni et cette cible

| # | Prototype v2 | Cible v2 |
|---|---|---|
| 1 | Acomptes implémentés (`requestDeposit`, `DEPOSIT_DEDUCTION`…) | **Retirés** ; garder seulement les points d'extension §9 |
| 2 | Un `CREDIT_NOTE` peut corriger plusieurs factures | Un document de crédit par facture d'origine (R2) |
| 3 | Une facture peut contenir des lignes `REVERSAL` | Interdit (R1) — séparer (§5.2) |
| 4 | Pas de `purpose` | `PARTIAL` / `CANCELLATION` (R3) |
| 5 | Imputation par date d'émission | Ordre art. 86-87 CO par échéance (R14) |
| 6 | Pas de paiement non identifié, ré-affectation, retour de paiement, perte, rectification de NC | À ajouter (§5.3, §5.4) |
| 7 | En mémoire | JPA + numérotation verrouillée + verrou optimiste du dossier |

Garder : le moteur d'écarts, les invariants, le test aléatoire, les scénarios de référence (attentes à adapter).

---

## 6. Côté participations (`ch.salon.participation.billing`)

### 6.1 Modèle

- **Pas de champ « processus de facturation » maintenant** (§9). Conserver `needArrangement`, `modePaymentMeals`,
  `invoiceSendingMethod`.
- Réglages salon (`SalonSettingsData`) : `paymentTermDays` (30), `reminderIntervalDays` (10),
  `reminderFees` (null = aucun, R19), `servicePeriodLabel`, `cancellationAllowedUntil` (défaut : veille du salon).

### 6.2 `ParticipationBillingPolicy`

```java
List<ChargeSpec> desiredCharges(Participation p)
  // vide si statut ∉ {ACCEPTED, VALIDATED} — sauf CANCELED avec frais : seul "cancellation-fee"
  // sous-objets ACCEPTED/VALIDATED : "stand:{id}", "electricity:{id}", "table:{id}",
  //   "conference:{id}", "workshop:{id}", stand partagé…
  // repas "meal:1|2|3" : group = modePaymentMeals == SEPARATE ? "meals" : "main"
  // envoi postal : "postal-fee" (FEE) ; gestes commerciaux : DISCOUNT
  // attributs = ce qui, s'il change, doit donner annulation + nouvelle ligne (ex. dimension)
IssueRequest issueRequest(Participation p, String group)   // échéance : date du salon si arrangement, sinon +paymentTermDays
```

Reprendre les prix de `RefreshInvoicingPlansService.buildExpectedInvoices` / `estimateCost` (mêmes montants :
test de non-régression étape 5).

### 6.3 `ParticipationBillingSync.sync(participationId)`

`openCase` + `syncCharges(source, policy.desiredCharges(p))`. À appeler **à la place** de chaque
`refreshInvoicingPlans(...)` et après toute modification d'un sous-objet, des repas ou du mode d'envoi.
**Rien** n'est envoyé tant que la participation est `IN_VERIFICATION` (l'inscription publique ne crée plus de brouillon).
Après clôture : plus de `sync`.

### 6.4 Cycle de vie (handlers existants à adapter)

| Transition | Déclencheur | Effet |
|---|---|---|
| `IN_VERIFICATION → ACCEPTED` | `ActionAcceptHandler` | sous-objets → `ACCEPTED` ; `sync` (lignes à facturer, aucun document) ; e-mail d'acceptation |
| `IN_VERIFICATION → REFUSED` | `ActionRefuseHandler` | aucun appel facturation |
| `ACCEPTED → VALIDATED` | `DocumentSettled(kind=INVOICE, paid=true)` sur une facture du groupe `main` | sous-objets `ACCEPTED → VALIDATED` ; e-mail de validation |
| `ACCEPTED → VALIDATED` | `DocumentIssued(kind=INVOICE)` + `needArrangement` | idem |
| `ACCEPTED → VALIDATED` | `ActionValidateHandler` (« valider quand même ») | idem + motif obligatoire ; supprimer le `TODO` |
| `* → CANCELED` | `ActionCancelHandler` jusqu'à `cancellationAllowedUntil` | §6.5 ; **supprimer** la condition actuelle `invoices-settled` |
| `CANCELED → ACCEPTED` | nouvelle action `ActionReinstateHandler` (avant le salon) | sous-objets → `ACCEPTED` ; `sync` ; l'avoir éventuel s'imputera sur la prochaine facture |
| `VALIDATED → CLOSED` | `ActionCloseHandler` | salon terminé **et** dossier soldé (rien à facturer, solde 0, avoir 0, aucun paiement non identifié lié) |
| sous-objet demandé plus tard | `IN_VERIFICATION` (non facturé) → accepté → `ACCEPTED`, ou `VALIDATED` si la participation l'est | `sync` |

`ParticipationBillingEventListener` : `@EventListener` sur `BillingEvent`, ignore `source.type != "PARTICIPATION"`.
Une participation **validée** ne redevient jamais « acceptée » à cause d'un `DocumentReopened` (retour de paiement) :
on la signale « paiement à régulariser » dans la liste à relancer.

### 6.5 `ParticipationCancellationService.cancel(p, decision)`

`decision = { Money cancellationFee (≥0), boolean refundNow }`
1. Refuser après `cancellationAllowedUntil`.
2. Participation + sous-objets → `CANCELED`.
3. `desiredCharges` = `[cancellation-fee]` si frais > 0, sinon `[]` → `sync` → `issue` sur chaque groupe en attente :
   annulations (une par facture) + éventuelle facture de frais (l'avoir s'y impute).
4. `refundNow` et avoir > 0 → `refund` ; sinon l'avoir part dans « avoirs à traiter ».
5. E-mail : confirmation d'annulation + documents émis + relevé de compte.

---

## 7. PDF : garder les modèles actuels, les adapter au minimum

**Ne pas refaire le design.** Garder `templates/document/invoice.html`, `invoice-receipt.html`, `common/header.html`,
`common/letterhead.html`, `common/footer.html`, `common/styles.css`. Créer un `BillingDocumentViewModelFactory` qui
**fournit les mêmes variables qu'aujourd'hui**, pour limiter les modifications du modèle :

| Variable actuelle | Nouvelle source |
|---|---|
| `headerTitle` | selon le type : « FACTURE », « NOTE DE CRÉDIT », « ANNULATION DE FACTURE » (clés i18n) |
| `reference` | numéro du document (`F-2027-0001`) |
| `sentDate`, `expirationDate` | date d'émission, échéance (vide pour un document de crédit) |
| `invoices` (`getLabel`, `getCustomAmount`, `getQuantity`, `getTotalAmount`) | lignes du document (adapter par un petit DTO exposant les mêmes getters ; montants `BigDecimal`) |
| `payments` (`getLabel`, `getAmount`) + `hasPaidSomething` | **imputations** sur ce document : paiements (« Paiement reçu le … »), avoirs (« Avoir NC-… imputé ») |
| `total` | solde à payer (facture) ou montant crédité (négatif, document de crédit) |
| `arrangement` | inchangé |
| `qrBillDataUri` | QR avec référence RF ; **absent** si document de crédit ou solde 0 |
| `sender`, `recipient`, `contact`, `phone`, `iban` | inchangés (recipient = **snapshot** du document) |

Ajouts minimaux dans `invoice.html` (seulement ce que les nouvelles données exigent) :
- variables nouvelles : `isCreditDocument`, `correctedNumber`, `correctedDate`, `creditReason`, `servicePeriod` ;
- si `isCreditDocument` : une ligne « Facture corrigée : F-… du … » + motif dans le bloc d'infos, masquer le bloc
  « Important » et le QR, texte R4 à la place ;
- `servicePeriod` affiché sous la référence s'il est renseigné ;
- libellés i18n nouveaux dans `i18n/messages*.properties` (préfixe `document.invoice.credit.*`), aucune chaîne en dur.

`invoice-receipt.html` (quittance) : même factory, variables inchangées.

Nouveaux documents **non comptables** : rappel et relevé de compte. Les faire avec la **même structure** que
`invoice.html` (mêmes fragments `common/*`, même CSS), sans nouveau design : `reminder.html` (titre « RAPPEL n »,
document d'origine, montant restant, QR) et `statement.html` (tableau des documents, paiements, solde).

`GenerateQRCode` : `bill.setReference(CreditorReference.fromDocumentNumber(number))`, message « Facture F-… ».

> **Non-conformités à signaler au comité (ne pas corriger sans accord, car le modèle reste inchangé)** :
> 1. le bulletin QR est réduit à la largeur utile de la page (≈170 mm) alors que la norme prévoit 210 × 105 mm
>    en bas de page ;
> 2. le bloc adresse n'est pas dans la zone visible des enveloppes à fenêtre (C5 à droite : x 117–196 mm,
>    y 47–81 mm). Les modèles corrigés existent dans le kit (`templates/invoice_3*.html`) si le comité le décide.

---

## 8. Administration (UI Angular `src/main/webapp/app/admin/`)

Remplacer `admin/invoicing-plan` par `admin/billing` :
- **Onglet Facturation** d'une participation : aperçu « à facturer » par groupe, documents (statut calculé, PDF,
  envoi), paiements et imputations, avoir, historique ; actions : Émettre, Émettre les corrections, Annuler une
  facture, Réémettre, Rectifier une note de crédit, Encaisser en espèces, Prolonger l'échéance, Envoyer un rappel,
  Rembourser, Reporter l'avoir, Passer en perte, Renvoyer.
- **Listes de travail** du salon : à émettre, à relancer, **paiements non identifiés**, **paiements reçus sur une
  facture soldée ou annulée**, avoirs à traiter, remboursements revenus, envois en échec, clôturables.
- **Import bancaire** : dépôt camt.054 → rapport (rapprochés / doublons / non identifiés / reçus sur facture close).
- **Export comptable** : CSV journal (date, pièce, débit, crédit, montant, libellé, source), comptes paramétrables.
- Dialogue d'**annulation de participation** (frais, rembourser maintenant).
- **Paiement** : jamais « marquer payée » à la main ; jamais d'édition d'un paiement (seulement « annuler le
  paiement » avec motif, puis en saisir un nouveau).

---

## 9. Extension future : acomptes (NE PAS implémenter, mais ne pas fermer la porte)

Ce qu'il faudra ajouter plus tard, et ce qu'il faut **respecter dès maintenant** pour que ce soit possible :

| À ajouter plus tard | À respecter maintenant |
|---|---|
| `DocumentKind.DEPOSIT_INVOICE` (série `A`, compte 2030) | `DocumentKind` est un enum extensible ; aucun `switch` exhaustif sans `default` qui lèverait une erreur ; série `A` réservée |
| `CreditPurpose.DEPOSIT_CANCELLATION` | idem pour `CreditPurpose` |
| `LineType.DEPOSIT` avec `isCharge() == false` | `billedPositions()` et le moteur d'écarts ne comptent que les lignes `isCharge()` |
| Imputation d'acompte = affectation `source_type = DEPOSIT` → facture | `billing_allocation.source_type` est une chaîne/enum extensible ; le bloc « imputations » du PDF liste **toute** affectation entrante avec son libellé |
| Participation : `billingProcess` (`STANDARD`/`DEPOSIT`), `PriceStandSalon.depositAmount` | le listener de validation est une liste de règles (`ValidationRule`) : ajouter « acompte payé » = une règle de plus |
| `ParticipationCancellationService` : option « acompte conservé » | `CancellationDecision` est un record extensible |
| Clés `deposit:*` | déjà réservées par `syncCharges` |

Règles comptables qui s'appliqueront (pour mémoire) : un acompte n'est pas une vente (passif 2030) ; la facture
finale affiche le total des prestations et l'acompte **imputé sous le total** ; la part impayée d'un acompte est
annulée par un document d'annulation sans effet sur le chiffre d'affaires ; un acompte remboursé ne passe pas par
une note de crédit. Le prototype v2 contient une implémentation de référence (à corriger sur ces points).

---

## 10. Cas limites — comportement attendu (chacun a son test, §12)

| # | Situation | Comportement attendu | Mécanisme |
|---|---|---|---|
| C1 | **Facture annulée, puis paiement reçu dessus (croisement)** | La facture annulée **n'est jamais rouverte**. Le paiement va aux autres factures exigibles du dossier (R14) ; sinon il devient un **avoir**. Alerte « paiement reçu sur facture annulée F-… ». L'admin choisit : **rembourser** (avis) ou, si l'annulation était une erreur / la participation est rétablie, **réémettre** la facture : l'avoir s'impute automatiquement dessus. | `recordPayment` → `PaymentReceivedOnClosedDocument` → `refund` ou `reissueInvoice` / `ActionReinstateHandler` |
| C2 | Exposant paie avec le QR d'une facture **remplacée** (ex. ancienne F-0001 515, nouvelle F-0003 550) | Le paiement va sur la dette exigible ouverte (F-0003) ; solde restant 35 ; relevé envoyé. | R14 |
| C3 | Facture **payée deux fois** | Le second paiement → avoir → remboursement (ou imputation sur une autre facture ouverte). | R14, `refund` |
| C4 | Paiement reçu **juste après** l'émission d'une note de crédit / annulation | Avoir ; même traitement que C1. | idem |
| C5 | Paiement **partiel**, puis annulation de la participation | L'annulation solde le restant ; la part payée devient avoir ; frais éventuels imputés ; reste remboursé. | §6.5 |
| C6 | Paiement **sans référence** ou référence inconnue | Paiement **non identifié** (sans dossier) ; liste de travail ; l'admin l'affecte au bon dossier. | `assignPayment` |
| C7 | Paiement **rapproché au mauvais exposant** (référence d'un autre) | Ré-affectation tracée vers le bon dossier ; la facture d'origine redevient ouverte (`DocumentReopened`). | `reallocate` (entre dossiers : contre-affectation + `assignPayment`) |
| C8 | **Retour bancaire** (IBAN faux, rejet) ou **erreur de saisie** d'un paiement espèces | `reversePayment` avec motif ; les factures redeviennent ouvertes ; participation validée non dé-validée mais signalée. Jamais de modification du paiement. | `reversePayment` |
| C9 | Montant légèrement inférieur (frais bancaires étrangers) | Facture partiellement payée ; l'admin peut solder l'écart par perte « écart de paiement » si ≤ seuil. | R22, `writeOff` |
| C10 | Facture **émise par erreur** (doublon, mauvais exposant) | `cancelInvoice` avec motif ; si payée → avoir → remboursement. | §5.3 |
| C11 | **Mauvaise adresse** / changement de débiteur (ex. l'employeur paie) | Facture non payée : `cancelInvoice` + `reissueInvoice` au nouveau débiteur. Payée : laisser telle quelle (snapshot), nouvelles factures à la nouvelle adresse. | §5.3, R10 |
| C12 | Mauvais prix détecté après émission | Corriger la règle / le prix côté participation → `sync` → `issue` : note de crédit ou facture complémentaire. | §5.1-5.2 |
| C13 | **Note de crédit émise par erreur** | Facture de rectification (lignes `RECTIFICATION`) qui la cite ; jamais de suppression. | `rectifyCreditNote` |
| C14 | Participation **annulée puis rétablie** | `ActionReinstateHandler` ; `sync` → nouvelle facture ; l'avoir (s'il existe) s'impute dessus. | §6.4 |
| C15 | Annulation demandée **après le début du salon** (absence) | Refusée : la prestation reste due. Geste éventuel = note de crédit manuelle avec motif. | §6.5 |
| C16 | **Salon annulé** (force majeure) | Action en masse : annulation de toutes les participations, `refundNow` ou report d'avoir avec accord. | §6.5, `transferCredit` |
| C17 | **Rappel envoyé alors que le paiement est en route** | L'import bancaire tourne **avant** le contrôle des retards ; le rappel mentionne « si vous avez payé entre-temps, ne tenez pas compte de ce rappel ». Si des frais de rappel ont été facturés et que la date de valeur du paiement est antérieure au rappel → l'admin annule la facture de frais (`cancelInvoice`). | ordre des tâches, `cancelInvoice` |
| C18 | Paiement reçu **après passage en perte** | Récupération de créance amortie ; le document reste `WRITTEN_OFF` avec montant récupéré. | `recoverWrittenOff` |
| C19 | Paiement reçu **après clôture** de la participation | Le dossier reste clôturé pour la facturation (aucun `sync`) mais reçoit l'argent : avoir → remboursement. | §6.4 |
| C20 | **Remboursement revenu** (IBAN faux) | Remboursement `RETURNED` → l'avoir réapparaît ; demander un nouvel IBAN. | `markRefundReturned` |
| C21 | Avoir reporté sur l'édition suivante | Seulement avec accord écrit joint ; trace dans les deux dossiers ; s'impute sur la première facture de la nouvelle participation. | `transferCredit` |
| C22 | **Deux admins** émettent en même temps / import bancaire pendant une émission | Verrou optimiste sur le dossier (`version`) : la seconde action échoue proprement et se relance ; numéros uniques (verrou de série). | §4.2 |
| C23 | E-mail d'envoi en échec | Document émis quand même, `send_error` renseigné, liste « envois en échec », « Renvoyer » = même PDF. | `resend` |
| C24 | Changement de mode d'envoi après émission | E-mail → courrier : frais postaux en facture complémentaire ; courrier → e-mail : note de crédit des frais. | §5.1-5.2 |
| C25 | Facture à 0 (changement de libellé à prix égal) | Annulation de l'ancienne + nouvelle facture du même montant ; pas de QR, réglée par l'avoir. | §5.2 |
| C26 | Facture émise en décembre pour un salon l'année suivante | Numéro de l'année d'**émission** ; période de prestation sur le document ; l'export comptable suit la date d'émission. | R7 |
| C27 | Paiement en EUR ou d'un pays étranger sans référence | Non géré automatiquement : paiement non identifié, traitement manuel. | C6 |

---

## 11. Plan d'implémentation (une PR par étape)

| Étape | Contenu | Critères d'acceptation |
|---|---|---|
| 1 | `billing.domain` : reprendre le prototype, **retirer les acomptes**, appliquer §5.6, ajouter §5.3-5.4, points d'extension §9 | Tests §12 (domaine + cas limites) verts ; `checkInvariants` dans chaque test ; aucun `Double` |
| 2 | Persistance JPA + Liquibase (§4.2) + numérotation verrouillée + immuabilité + verrou optimiste | Testcontainers : 50 émissions concurrentes → numéros uniques et continus ; UPDATE/DELETE impossibles sur les tables immuables |
| 3 | `BillingService` + événements + import camt.054 + paiements non identifiés + `scanOverdue` planifié **après** l'import | Scénario de référence en intégration ; fichier camt.054 d'exemple rapproché ; doublon ignoré ; C1, C6, C7, C8 en intégration |
| 4 | PDF : `BillingDocumentViewModelFactory`, adaptations minimales §7, rappel + relevé, QR RF, archivage + SHA-256, envoi | Rendu de chaque type comparé à l'actuel (aucun changement visuel pour une facture simple) ; QR décodable avec la bonne référence et le bon montant |
| 5 | Côté participations (§6) derrière `billing.v2.enabled` par salon | Non-régression : pour chaque participation 2026, Σ `desiredCharges` = total actuellement facturé ; scénarios cycle de vie et annulation verts |
| 6 | UI admin (§8) | UC des flux faisables sans appel API manuel |
| 7 | Rappels (frais/intérêts désactivés par défaut), pertes, récupérations, report d'avoir, export comptable | Journal équilibré (Σ débits = Σ crédits) sur le scénario de référence |
| 8 | Bascule pour le salon 2027 ; anciennes tables en lecture seule ; suppression du code mort (`RefreshInvoicingPlansService`, `State.ISOLATED`, anciens handlers billing, `incrementBillingNumber`) | ArchUnit vert ; plus aucune référence à l'ancien moteur hors historique |

**Données existantes** : pas de migration des éditions passées. L'édition 2026 se termine sur l'ancien système ;
le nouveau démarre en 2027 (`F-2027-0001`) ; l'ancien reste consultable en lecture seule (PDF existants).

---

## 12. Tests obligatoires (spécification exécutable)

Reprendre les tests du prototype (`src/test/java/ch/salon/billing/…`) **sans les tests d'acompte**, adaptés à §5.6.

- **Synchronisation** : idempotence ; ordre indifférent ; changement avant émission sans document ; ajout puis retrait
  sans trace ; quantité modifiée après émission → `ADJUSTMENT` ; variante modifiée → `REVERSAL` + `NEW` ; prix
  catalogue seul → rien ; changement de groupe ; liste vide → tout contre-passé ; validations ; dossier clôturé refuse.
- **Émission** : aucune facture ne contient `REVERSAL` ; retrait sur facture impayée → `NC PARTIAL` qui la cite,
  aucun argent ; tout retiré → `CANCELLATION` par facture ; stand 3x3 → 3x4 **et** électricité retirée après F-0001
  payée (515) → `NC PARTIAL` −485 sur F-0001 + `F` 550, avoir imputé, solde 65 ; numérotation continue par série et
  année ; aucun numéro consommé si rien à émettre ou adresse incomplète ; échéance 30 j / date du salon / refus si
  antérieure.
- **Paiements** : partiel ; en retard ; un virement pour deux factures ; ordre art. 87 CO ; référence d'une facture
  payée → autre dette exigible ; prépaiement → avoir puis imputation ; doublon camt ignoré ; arrondi 5 ct ;
  remboursement ≤ avoir.
- **Cas limites** : un test par ligne C1 à C26 du §10.
- **Cycle de vie participation** : rien en vérification ; acceptation = brouillon seulement ; facture `main` payée →
  validée ; arrangement → validée à l'émission ; annulation par note de crédit ≠ payée → pas de validation ;
  validation forcée tracée ; sous-objet ajouté après validation ; refus sans dossier ; rétablissement ; retour de
  paiement sur participation validée → signalée, pas dé-validée ; événement d'une autre source ignoré.
- **Annulation** (vérifier chaque fois : dossier soldé, avoir 0, argent conservé = frais, documents antérieurs
  inchangés) :

| Situation | Documents attendus | Conservé |
|---|---|---|
| En vérification | aucun dossier | 0 |
| Brouillon seul | rien | 0 |
| Brouillon + frais 50 | `F` frais 50 | 50 |
| Factures impayées | `NC CANCELLATION` par facture | 0 |
| Factures payées | `NC CANCELLATION` + remboursement | 0 |
| Factures payées + frais 50 | `NC CANCELLATION` + `F` frais 50 (réglée par l'avoir) + remboursement du reste | 50 |
| Facture principale payée, repas impayés, frais 50 | idem, les avoirs se compensent | 50 |
| Frais > payé | idem, solde de frais restant à encaisser | frais |
| Après `cancellationAllowedUntil` | refus | — |

- **Robustesse** : 300 vies aléatoires × 60 opérations (sync, émission, paiements partiels/excédentaires/non
  identifiés, ré-affectations, retours de paiement, remboursements, annulations, rétablissements) ; à **chaque pas** :
  `balance == ledgerBalance` ; pas d'avoir inutilisé si une facture est ouverte ; total = Σ lignes ; aucune facture
  négative ni contenant `REVERSAL` ; prestations émises + à facturer = attendu ; à la fin : soldé et clôturable.
  Compteurs minimums prouvant l'exploration.
- **Qualité des tests** : injecter 3 bugs (poste retiré non annulé, imputation par date d'émission, validation sur
  `paid=false`) → au moins un test échoue pour chacun.
- **Architecture** : ArchUnit (§3).

---

## 13. Points à faire valider

1. **Fiduciaire** : plan comptable (produits par catégorie, pertes, récupérations), format d'export.
2. **Comité** : délais (paiement 30 j, rappels 10 j) ; rappels manuels ou automatiques ; frais de rappel et
   d'annulation inscrits au règlement ; date limite d'annulation ; report d'avoir autorisé ou non ; seuil d'écart de
   paiement ; correction des deux non-conformités du modèle PDF (§7).
3. **Banque** : obtention des avis camt.054 (e-banking ou EBICS) ; IBAN pour les remboursements.

---

## 14. Définition de « terminé »

- Étapes 1-8 livrées, `./mvnw verify` vert, ArchUnit vert.
- Scénario de référence (prestations finales 625.–) : F-0001 515, F-0002 67.50 (repas), NC sur F-0001 −485,
  F-0003 550 (avoir imputé, solde 65), NC sur F-0002 −22.50 (imputée sur F-0003, solde 42.50), 3 paiements,
  dossier soldé, journal équilibré.
- Une facture simple sort **visuellement identique** à aujourd'hui (même modèle), avec la nouvelle numérotation et un QR rapprochable.
- Aucun `Double` dans la facturation ; rien d'émis n'est modifiable ; aucune notion de participation dans
  `ch.salon.billing` ; ajouter les acomptes ne demande que les éléments listés au §9.
