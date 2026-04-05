---
permalink: /security/formal-verification/
read_when:
    - Examiner les garanties ou limites du modèle de sécurité formel
    - Reproduire ou mettre à jour les vérifications des modèles de sécurité TLA+/TLC
summary: Modèles de sécurité vérifiés par machine pour les chemins les plus risqués d’OpenClaw.
title: Vérification formelle (modèles de sécurité)
x-i18n:
    generated_at: "2026-04-05T12:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Vérification formelle (modèles de sécurité)

Cette page suit les **modèles de sécurité formels** d’OpenClaw (TLA+/TLC aujourd’hui ; d’autres si nécessaire).

> Remarque : certains anciens liens peuvent encore faire référence à l’ancien nom du projet.

**Objectif (vision cible) :** fournir un argument vérifié par machine selon lequel OpenClaw applique sa
politique de sécurité voulue (autorisation, isolation des sessions, restriction des outils, et
sécurité face aux mauvaises configurations), sous des hypothèses explicites.

**Ce que c’est (aujourd’hui) :** une **suite de régression de sécurité** exécutable, pilotée par l’attaquant :

- Chaque affirmation possède une vérification de modèle exécutable sur un espace d’états fini.
- Beaucoup d’affirmations ont un **modèle négatif** associé qui produit une trace de contre-exemple pour une classe réaliste de bug.

**Ce que ce n’est pas (encore) :** une preuve que « OpenClaw est sûr à tous égards » ou que l’implémentation TypeScript complète est correcte.

## Où se trouvent les modèles

Les modèles sont maintenus dans un dépôt séparé : [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Réserves importantes

- Ce sont des **modèles**, pas l’implémentation TypeScript complète. Une dérive entre le modèle et le code est possible.
- Les résultats sont bornés par l’espace d’états exploré par TLC ; un résultat « vert » n’implique pas une sécurité au-delà des hypothèses et limites modélisées.
- Certaines affirmations reposent sur des hypothèses environnementales explicites (par ex. déploiement correct, entrées de configuration correctes).

## Reproduire les résultats

Aujourd’hui, les résultats se reproduisent en clonant localement le dépôt des modèles et en exécutant TLC (voir ci-dessous). Une itération future pourrait proposer :

- des modèles exécutés en CI avec artefacts publics (traces de contre-exemple, journaux d’exécution)
- un flux hébergé « exécuter ce modèle » pour de petites vérifications bornées

Pour commencer :

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ requis (TLC s’exécute sur la JVM).
# Le dépôt embarque un `tla2tools.jar` épinglé (outils TLA+) et fournit `bin/tlc` + des cibles Make.

make <target>
```

### Exposition de gateway et mauvaise configuration d’une gateway ouverte

**Affirmation :** un bind au-delà du loopback sans auth peut rendre possible une compromission distante / augmenter l’exposition ; token/password bloque les attaquants non authentifiés (selon les hypothèses du modèle).

- Exécutions vertes :
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rouge (attendu) :
  - `make gateway-exposure-v2-negative`

Voir aussi : `docs/gateway-exposure-matrix.md` dans le dépôt des modèles.

### Pipeline exec des nœuds (capacité la plus risquée)

**Affirmation :** `exec host=node` exige (a) une liste d’autorisation de commandes de nœud plus les commandes déclarées et (b) une approbation live lorsqu’elle est configurée ; les approbations sont tokenisées pour empêcher la relecture (dans le modèle).

- Exécutions vertes :
  - `make nodes-pipeline`
  - `make approvals-token`
- Rouge (attendu) :
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Magasin d’appairage (restriction des DM)

**Affirmation :** les demandes d’appairage respectent la TTL et les plafonds de demandes en attente.

- Exécutions vertes :
  - `make pairing`
  - `make pairing-cap`
- Rouge (attendu) :
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Restriction d’entrée (mentions + contournement par commande de contrôle)

**Affirmation :** dans les contextes de groupe exigeant une mention, une « commande de contrôle » non autorisée ne peut pas contourner la restriction par mention.

- Vert :
  - `make ingress-gating`
- Rouge (attendu) :
  - `make ingress-gating-negative`

### Isolation routage/clé de session

**Affirmation :** les DM provenant de pairs distincts ne se regroupent pas dans la même session sauf s’ils sont explicitement liés/configurés.

- Vert :
  - `make routing-isolation`
- Rouge (attendu) :
  - `make routing-isolation-negative`

## v1++ : modèles bornés supplémentaires (concurrence, nouvelles tentatives, exactitude des traces)

Ce sont des modèles complémentaires qui renforcent la fidélité autour des modes d’échec du monde réel (mises à jour non atomiques, nouvelles tentatives et diffusion des messages).

### Concurrence / idempotence du magasin d’appairage

**Affirmation :** un magasin d’appairage doit appliquer `MaxPending` et l’idempotence même sous entrelacements (c’est-à-dire que « vérifier puis écrire » doit être atomique / verrouillé ; un rafraîchissement ne doit pas créer de doublons).

Ce que cela signifie :

- Sous des requêtes concurrentes, vous ne pouvez pas dépasser `MaxPending` pour un canal.
- Des requêtes/rafraîchissements répétés pour le même `(channel, sender)` ne doivent pas créer de lignes en attente actives en double.

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

### Corrélation/idempotence des traces d’entrée

**Affirmation :** l’ingestion doit préserver la corrélation des traces à travers la diffusion et être idempotente face aux nouvelles tentatives du fournisseur.

Ce que cela signifie :

- Lorsqu’un événement externe devient plusieurs messages internes, chaque partie conserve la même identité de trace/événement.
- Les nouvelles tentatives ne doivent pas entraîner de double traitement.
- Si les IDs d’événement du fournisseur sont absents, la déduplication retombe sur une clé sûre (par ex. ID de trace) pour éviter de supprimer des événements distincts.

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

### Priorité de dmScope en routage + identityLinks

**Affirmation :** le routage doit conserver l’isolation des sessions DM par défaut, et ne regrouper les sessions que lorsqu’il est explicitement configuré (priorité des canaux + liens d’identité).

Ce que cela signifie :

- Les remplacements de dmScope spécifiques au canal doivent l’emporter sur les valeurs globales par défaut.
- identityLinks ne doit regrouper qu’au sein de groupes explicitement liés, et non entre pairs sans rapport.

- Vert :
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rouge (attendu) :
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
