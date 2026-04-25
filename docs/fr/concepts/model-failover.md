---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des périodes de refroidissement ou du comportement de repli du modèle
    - Mise à jour des règles de repli pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
summary: Comment OpenClaw fait tourner les profils d’authentification et effectue un repli entre les modèles
title: Repli du modèle
x-i18n:
    generated_at: "2026-04-25T18:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e128c288ed420874f1b5eb28ecaa4ada66f09152c1b0b73b1d932bf5e86b6dd7
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli du modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les sous-tendent.

## Flux d’exécution

Pour une exécution de texte normale, OpenClaw évalue les candidats dans cet ordre :

1. Le modèle de session actuellement sélectionné.
2. Les `agents.defaults.model.fallbacks` configurés, dans l’ordre.
3. Le modèle principal configuré à la fin lorsque l’exécution a démarré à partir d’un remplacement.

À l’intérieur de chaque candidat, OpenClaw essaie le repli du profil d’authentification avant de passer
au candidat de modèle suivant.

Séquence de haut niveau :

1. Résoudre le modèle de session actif et la préférence de profil d’authentification.
2. Construire la chaîne des candidats de modèle.
3. Essayer le fournisseur actuel avec les règles de rotation/refroidissement des profils d’authentification.
4. Si ce fournisseur est épuisé avec une erreur justifiant un repli, passer au
   candidat de modèle suivant.
5. Persister le remplacement de repli sélectionné avant le début de la nouvelle tentative afin que les autres
   lecteurs de session voient le même fournisseur/modèle que celui que l’exécuteur est sur le point d’utiliser.
6. Si le candidat de repli échoue, annuler uniquement les champs de remplacement de session appartenant au repli
   lorsqu’ils correspondent encore à ce candidat échoué.
7. Si tous les candidats échouent, lever une `FallbackSummaryError` avec le détail
   par tentative et l’expiration de refroidissement la plus proche lorsqu’elle est connue.

Ceci est intentionnellement plus restreint que « enregistrer et restaurer toute la session ». L’exécuteur
de réponse ne persiste que les champs de sélection de modèle qu’il possède pour le repli :

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de repli échouée d’écraser des
mutations de session plus récentes et sans lien, telles que des changements manuels via `/model` ou des mises à jour de rotation de session
survenus pendant l’exécution de la tentative.

## Stockage de l’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** à la fois pour les clés API et les jetons OAuth.

- Les secrets se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hérité : `~/.openclaw/agent/auth-profiles.json`).
- L’état d’exécution du routage de l’authentification se trouve dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` correspond **uniquement aux métadonnées + au routage** (pas de secrets).
- Fichier OAuth hérité pour import uniquement : `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation).

Plus de détails : [/concepts/oauth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## ID de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut : `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur a plusieurs profils, OpenClaw choisit un ordre comme suit :

1. **Configuration explicite** : `auth.order[provider]` (si défini).
2. **Profils configurés** : `auth.profiles` filtrés par fournisseur.
3. **Profils stockés** : entrées dans `auth-profiles.json` pour le fournisseur.

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin :

- **Clé primaire :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien d’abord, au sein de chaque type).
- Les **profils en refroidissement/désactivés** sont déplacés à la fin, ordonnés par expiration la plus proche.

### Persistance de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi par session** pour garder les caches du fournisseur chauds.
Il **n’effectue pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une compaction se termine (le compteur de compaction s’incrémente)
- le profil soit en refroidissement/désactivé

La sélection manuelle via `/model …@<profileId>` définit un **remplacement utilisateur** pour cette session
et n’est pas auto-rotée tant qu’une nouvelle session ne démarre pas.

Les profils auto-épinglés (sélectionnés par le routeur de session) sont traités comme une **préférence** :
ils sont essayés en premier, mais OpenClaw peut effectuer une rotation vers un autre profil en cas de limites de débit/d’expirations de délai.
Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle
sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil de clé API pour le même fournisseur, le round-robin peut basculer entre eux d’un message à l’autre à moins qu’un profil ne soit épinglé. Pour forcer un profil unique :

- Épinglez avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez un remplacement par session via `/model …` avec un remplacement de profil (lorsqu’il est pris en charge par votre surface UI/chat).

## Refroidissements

Lorsqu’un profil échoue à cause d’erreurs d’authentification/de limite de débit (ou d’une expiration de délai qui ressemble
à une limite de débit), OpenClaw le marque en refroidissement et passe au profil suivant.
Ce compartiment de limite de débit est plus large qu’un simple `429` : il inclut aussi des messages de fournisseur
comme `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, ainsi que des limites périodiques de fenêtre d’usage telles que
`weekly/monthly limit reached`.
Les erreurs de format/de requête invalide (par exemple les échecs de validation d’ID d’appel d’outil Cloud Code Assist)
sont traitées comme justifiant un repli et utilisent les mêmes refroidissements.
Les erreurs de raison d’arrêt compatibles OpenAI telles que `Unhandled stop reason: error`,
`stop reason: error` et `reason: error` sont classées comme des signaux
d’expiration de délai/repli.
Le texte générique du serveur peut également tomber dans ce compartiment d’expiration de délai lorsque la source correspond
à un motif transitoire connu. Par exemple, le simple message du wrapper de flux pi-ai
`An unknown error occurred` est traité comme justifiant un repli pour tous les fournisseurs
car pi-ai l’émet lorsque les flux du fournisseur se terminent avec `stopReason: "aborted"` ou
`stopReason: "error"` sans détails spécifiques. Les charges utiles JSON `api_error` avec un texte transitoire du serveur
comme `internal server error`, `unknown error, 520`,
`upstream error` ou `backend error` sont également traitées comme des expirations de délai
justifiant un repli.
Le texte générique en amont spécifique à OpenRouter comme le simple `Provider returned error`
n’est traité comme une expiration de délai que lorsque le contexte fournisseur est réellement OpenRouter.
Le texte générique interne de repli comme `LLM request failed with an unknown
error.` reste conservateur et ne déclenche pas le repli à lui seul.

Certains SDK de fournisseur peuvent sinon attendre une longue fenêtre `Retry-After` avant de
rendre le contrôle à OpenClaw. Pour les SDK basés sur Stainless comme Anthropic et
OpenAI, OpenClaw plafonne par défaut les attentes internes au SDK `retry-after-ms` / `retry-after` à 60
secondes et expose immédiatement les réponses réessayables plus longues afin que ce chemin de
repli puisse s’exécuter. Réglez ou désactivez ce plafond avec
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; voir [/concepts/retry](/fr/concepts/retry).

Les refroidissements de limite de débit peuvent également être limités au modèle :

- OpenClaw enregistre `cooldownModel` pour les échecs dus à une limite de débit lorsque l’ID
  du modèle en échec est connu.
- Un modèle frère sur le même fournisseur peut quand même être essayé lorsque le refroidissement est
  limité à un autre modèle.
- Les périodes de facturation/désactivation bloquent toujours l’ensemble du profil sur tous les modèles.

Les refroidissements utilisent un backoff exponentiel :

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (plafond)

L’état est stocké dans `auth-state.json` sous `usageStats` :

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Désactivations de facturation

Les échecs de facturation/de crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant un repli, mais ils ne sont généralement pas transitoires. Au lieu d’un refroidissement court, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et effectue une rotation vers le profil/fournisseur suivant.

Toutes les réponses ayant l’apparence d’un problème de facturation ne sont pas des `402`, et tous les `402` HTTP n’atterrissent
pas ici. OpenClaw conserve le texte explicite de facturation dans la voie de facturation même lorsqu’un
fournisseur renvoie à la place `401` ou `403`, mais les correspondances spécifiques au fournisseur restent
limitées au fournisseur auquel elles appartiennent (par exemple OpenRouter `403 Key limit
exceeded`). Pendant ce temps, les erreurs temporaires `402` de fenêtre d’usage et de
limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque
le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` ou `organization spending limit exceeded`).
Elles restent sur le chemin de refroidissement court/repli au lieu du long chemin de
désactivation de facturation.

L’état est stocké dans `auth-state.json` :

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Valeurs par défaut :

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et plafonne à **24 heures**.
- Les compteurs de backoff se réinitialisent si le profil n’a pas échoué pendant **24 heures** (configurable).
- Les nouvelles tentatives en surcharge permettent **1 rotation de profil sur le même fournisseur** avant le repli du modèle.
- Les nouvelles tentatives en surcharge utilisent un backoff de **0 ms** par défaut.

## Repli du modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans
`agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux
expirations de délai qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli).

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les refroidissements de facturation. Par défaut, OpenClaw autorise une nouvelle tentative de profil d’authentification sur le même fournisseur, puis passe immédiatement au repli de modèle configuré suivant sans attendre.
Les signaux de fournisseur occupé tels que `ModelNotReadyException` tombent dans ce compartiment de surcharge. Réglez ce comportement avec `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` et
`auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution démarre avec un remplacement de modèle (hooks ou CLI), les replis se terminent quand même sur
`agents.defaults.model.primary` après avoir essayé les replis configurés.

### Règles de la chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé
plus les replis configurés.

Règles :

- Le modèle demandé est toujours en premier.
- Les replis configurés explicitement sont dédupliqués mais non filtrés par la liste d’autorisation des modèles. Ils sont traités comme une intention explicite de l’opérateur.
- Si l’exécution actuelle est déjà sur un repli configuré dans la même
  famille de fournisseurs, OpenClaw continue d’utiliser la chaîne configurée complète.
- Si l’exécution actuelle est sur un fournisseur différent de la configuration et que ce modèle actuel
  ne fait pas déjà partie de la chaîne de repli configurée, OpenClaw n’ajoute pas
  de replis configurés sans lien provenant d’un autre fournisseur.
- Lorsque l’exécution a démarré à partir d’un remplacement, le modèle principal configuré est ajouté à
  la fin afin que la chaîne puisse revenir au défaut normal une fois les
  candidats précédents épuisés.

### Quelles erreurs font avancer le repli

Le repli du modèle continue sur :

- les échecs d’authentification
- les limites de débit et l’épuisement du refroidissement
- les erreurs de surcharge/fournisseur occupé
- les erreurs de type expiration de délai justifiant un repli
- les désactivations de facturation
- `LiveSessionModelSwitchError`, qui est normalisée en chemin de repli afin qu’un
  modèle persistant obsolète ne crée pas de boucle de nouvelle tentative externe
- les autres erreurs non reconnues lorsqu’il reste encore des candidats

Le repli du modèle ne continue pas sur :

- les abandons explicites qui ne sont pas de type expiration de délai/repli
- les erreurs de dépassement de contexte qui doivent rester dans la logique de compaction/nouvelle tentative
  (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, ou `ollama error: context
length exceeded`)
- une erreur inconnue finale lorsqu’il ne reste plus de candidats

### Comportement d’évitement du refroidissement vs sonde

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en refroidissement, OpenClaw
ne saute pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

- Les échecs d’authentification persistants font ignorer immédiatement l’ensemble du fournisseur.
- Les désactivations de facturation sont généralement ignorées, mais le candidat principal peut tout de même être sondé
  avec une limitation afin que la récupération soit possible sans redémarrage.
- Le candidat principal peut être sondé à l’approche de l’expiration du refroidissement, avec une limitation
  par fournisseur.
- Les modèles frères de repli sur le même fournisseur peuvent être tentés malgré le refroidissement lorsque
  l’échec semble transitoire (`rate_limit`, `overloaded` ou inconnu). Cela est
  particulièrement pertinent lorsqu’une limite de débit est limitée au modèle et qu’un modèle frère peut
  encore récupérer immédiatement.
- Les sondes de refroidissement transitoire sont limitées à une par fournisseur et par exécution de repli afin
  qu’un fournisseur unique ne bloque pas le repli inter-fournisseurs.

## Remplacements de session et changement de modèle en session active

Les changements de modèle de session constituent un état partagé. L’exécuteur actif, la commande `/model`,
les mises à jour de compaction/session et la réconciliation de session active lisent ou écrivent tous
des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le changement de modèle en session active :

- Seuls les changements de modèle explicites pilotés par l’utilisateur marquent un changement actif en attente. Cela
  inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle pilotés par le système, tels que la rotation de repli, les remplacements Heartbeat,
  ou la compaction, ne marquent jamais d’eux-mêmes un changement actif en attente.
- Avant le début d’une nouvelle tentative de repli, l’exécuteur de réponse persiste les champs de remplacement
  de repli sélectionnés dans l’entrée de session.
- La réconciliation de session active préfère les remplacements de session persistés aux
  champs de modèle d’exécution obsolètes.
- Si la tentative de repli échoue, l’exécuteur annule uniquement les champs de remplacement
  qu’il a écrits, et seulement s’ils correspondent encore à ce candidat échoué.

Cela empêche la condition de concurrence classique :

1. Le principal échoue.
2. Le candidat de repli est choisi en mémoire.
3. Le magasin de session indique encore l’ancien principal.
4. La réconciliation de session active lit l’état de session obsolète.
5. La nouvelle tentative revient à l’ancien modèle avant même que la tentative de repli
   ne commence.

Le remplacement de repli persisté ferme cette fenêtre, et l’annulation ciblée
préserve les changements de session manuels ou d’exécution plus récents.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails par tentative qui alimentent les journaux et
la messagerie de refroidissement visible par l’utilisateur :

- fournisseur/modèle tenté
- motif (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, et
  raisons de repli similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. L’exécuteur
de réponse externe peut l’utiliser pour construire un message plus spécifique tel que « tous les modèles
sont temporairement limités par le débit » et inclure l’expiration de refroidissement la plus proche lorsqu’elle
est connue.

Ce résumé de refroidissement tient compte du modèle :

- les limites de débit limitées à un modèle sans lien sont ignorées pour la
  chaîne fournisseur/modèle tentée
- si le blocage restant est une limite de débit limitée au modèle correspondante, OpenClaw
  signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Voir [Configuration de Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- le routage de `agents.defaults.imageModel`

Voir [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection des modèles et du repli.
