---
permalink: /security/formal-verification/
read_when:
    - Examen des garanties ou limites des modèles de sécurité formels
    - Reproduction ou mise à jour des vérifications de modèle de sécurité TLA+/TLC
summary: Modèles de sécurité vérifiés par machine pour les chemins les plus risqués d’OpenClaw.
title: Vérification formelle (modèles de sécurité)
x-i18n:
    generated_at: "2026-04-24T07:32:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Cette page suit les **modèles de sécurité formels** d’OpenClaw (TLA+/TLC aujourd’hui ; davantage si nécessaire).

> Remarque : certains anciens liens peuvent faire référence à l’ancien nom du projet.

**Objectif (étoile polaire) :** fournir un argument vérifié par machine qu’OpenClaw applique
sa politique de sécurité prévue (autorisation, isolation de session, filtrage des outils, et
sécurité face aux mauvaises configurations), sous des hypothèses explicites.

**Ce que c’est (aujourd’hui) :** une **suite de régression de sécurité** exécutable, pilotée par un attaquant :

- Chaque affirmation a une vérification de modèle exécutable sur un espace d’états fini.
- De nombreuses affirmations ont un **modèle négatif** associé qui produit une trace de contre-exemple pour une classe de bug réaliste.

**Ce que ce n’est pas (encore) :** une preuve que « OpenClaw est sécurisé en tous points » ni que l’implémentation TypeScript complète est correcte.

## Où vivent les modèles

Les modèles sont maintenus dans un dépôt séparé : [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Réserves importantes

- Ce sont des **modèles**, pas l’implémentation TypeScript complète. Un décalage entre modèle et code est possible.
- Les résultats sont bornés par l’espace d’états exploré par TLC ; un résultat « vert » n’implique pas la sécurité au-delà des hypothèses et bornes modélisées.
- Certaines affirmations reposent sur des hypothèses environnementales explicites (par ex. déploiement correct, entrées de configuration correctes).

## Reproduire les résultats

Aujourd’hui, les résultats se reproduisent en clonant localement le dépôt de modèles puis en exécutant TLC (voir ci-dessous). Une future itération pourrait offrir :

- des modèles exécutés en CI avec des artefacts publics (traces de contre-exemple, journaux d’exécution)
- un workflow hébergé « exécuter ce modèle » pour de petites vérifications bornées

Pour démarrer :

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Exposition du Gateway et mauvaise configuration d’un gateway ouvert

**Affirmation :** un bind au-delà de loopback sans authentification peut rendre possible un compromis à distance / augmente l’exposition ; le jeton/mot de passe bloque les attaquants non authentifiés (selon les hypothèses du modèle).

- Exécutions vertes :
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rouge (attendu) :
  - `make gateway-exposure-v2-negative`

Voir aussi : `docs/gateway-exposure-matrix.md` dans le dépôt de modèles.

### Pipeline exec des Nodes (capacité la plus risquée)

**Affirmation :** `exec host=node` nécessite (a) une liste d’autorisation de commandes Node plus des commandes déclarées et (b) une approbation en direct lorsqu’elle est configurée ; les approbations sont tokenisées pour empêcher la relecture (dans le modèle).

- Exécutions vertes :
  - `make nodes-pipeline`
  - `make approvals-token`
- Rouge (attendu) :
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Magasin d’association (filtrage DM)

**Affirmation :** les demandes d’association respectent le TTL et les plafonds de demandes en attente.

- Exécutions vertes :
  - `make pairing`
  - `make pairing-cap`
- Rouge (attendu) :
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Filtrage d’ingress (mentions + contournement par commande de contrôle)

**Affirmation :** dans les contextes de groupe exigeant une mention, une « commande de contrôle » non autorisée ne peut pas contourner le filtrage par mention.

- Vert :
  - `make ingress-gating`
- Rouge (attendu) :
  - `make ingress-gating-negative`

### Routage/isolation des clés de session

**Affirmation :** les DM de pairs distincts ne se retrouvent pas dans la même session sauf s’ils sont explicitement liés/configurés.

- Vert :
  - `make routing-isolation`
- Rouge (attendu) :
  - `make routing-isolation-negative`

## v1++ : modèles bornés supplémentaires (concurrence, nouvelles tentatives, correction des traces)

Ce sont des modèles de suivi qui renforcent la fidélité autour des modes d’échec du monde réel (mises à jour non atomiques, nouvelles tentatives, et fan-out de messages).

### Concurrence / idempotence du magasin d’association

**Affirmation :** un magasin d’association doit faire respecter `MaxPending` et l’idempotence même sous entrelacements (c.-à-d. que « vérifier puis écrire » doit être atomique / verrouillé ; un rafraîchissement ne doit pas créer de doublons).

Ce que cela signifie :

- Sous requêtes concurrentes, il est impossible de dépasser `MaxPending` pour un canal.
- Les requêtes/rafraîchissements répétés pour le même `(channel, sender)` ne doivent pas créer de lignes pending actives en double.

- Exécutions vertes :
  - `make pairing-race` (vérification de plafond atomique/verrouillée)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rouge (attendu) :
  - `make pairing-race-negative` (course de plafond begin/commit non atomique)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Corrélation / idempotence des traces d’ingress

**Affirmation :** l’ingestion doit préserver la corrélation de trace à travers le fan-out et rester idempotente sous nouvelles tentatives provider.

Ce que cela signifie :

- Lorsqu’un événement externe devient plusieurs messages internes, chaque partie conserve la même identité de trace/événement.
- Les nouvelles tentatives n’aboutissent pas à un double traitement.
- Si les identifiants d’événement du provider sont manquants, la déduplication revient à une clé sûre (par ex. l’identifiant de trace) pour éviter de supprimer des événements distincts.

- Vert :
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rouge (attendu) :
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Priorité dmScope du routage + identityLinks

**Affirmation :** le routage doit garder les sessions DM isolées par défaut, et ne fusionner des sessions que lorsqu’elles sont explicitement configurées (priorité de canal + identity links).

Ce que cela signifie :

- Les remplacements dmScope spécifiques au canal doivent l’emporter sur les valeurs globales par défaut.
- Les identityLinks ne doivent fusionner qu’au sein de groupes explicitement liés, et non entre pairs non liés.

- Vert :
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rouge (attendu) :
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Lié

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Contribuer au modèle de menace](/fr/security/CONTRIBUTING-THREAT-MODEL)
