---
read_when:
    - Diagnostiquer la rotation des profils d’authentification, les cooldowns ou le comportement de repli des modèles
    - Mettre à jour les règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les remplacements de modèle de session interagissent avec les nouvelles tentatives de repli
summary: Comment OpenClaw fait tourner les profils d’authentification et bascule entre les modèles
title: Basculement de modèle
x-i18n:
    generated_at: "2026-04-05T12:40:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Basculement de modèle

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du fournisseur actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles du runtime et les données qui les sous-tendent.

## Flux du runtime

Pour une exécution texte normale, OpenClaw évalue les candidats dans cet ordre :

1. Le modèle de session actuellement sélectionné.
2. Les `agents.defaults.model.fallbacks` configurés dans l’ordre.
3. Le modèle principal configuré à la fin lorsque l’exécution a commencé depuis un remplacement.

À l’intérieur de chaque candidat, OpenClaw essaie le basculement de profil d’authentification avant de passer
au candidat de modèle suivant.

Séquence de haut niveau :

1. Résoudre le modèle de session actif et la préférence de profil d’authentification.
2. Construire la chaîne de candidats de modèle.
3. Essayer le fournisseur actuel avec les règles de rotation/cooldown des profils d’authentification.
4. Si ce fournisseur est épuisé avec une erreur justifiant un basculement, passer au candidat
   de modèle suivant.
5. Persister le remplacement de repli sélectionné avant que la nouvelle tentative ne démarre afin que les autres
   lecteurs de session voient le même fournisseur/modèle que celui que l’exécuteur s’apprête à utiliser.
6. Si le candidat de repli échoue, annuler uniquement les champs de remplacement de session
   détenus par le repli lorsqu’ils correspondent encore à ce candidat en échec.
7. Si tous les candidats échouent, lever une `FallbackSummaryError` avec le détail
   de chaque tentative et l’expiration de cooldown la plus proche lorsqu’elle est connue.

C’est volontairement plus étroit que « sauvegarder et restaurer toute la session ». L’exécuteur
de réponse ne persiste que les champs de sélection de modèle dont il est responsable pour le repli :

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela évite qu’une nouvelle tentative de repli en échec n’écrase des mutations de session
plus récentes et non liées, comme des changements manuels `/model` ou des mises à jour de rotation
de session survenues pendant l’exécution de la tentative.

## Stockage des authentifiants (clés + OAuth)

OpenClaw utilise des **profils d’authentification** à la fois pour les clés API et les jetons OAuth.

- Les secrets se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hérité : `~/.openclaw/agent/auth-profiles.json`).
- La config `auth.profiles` / `auth.order` contient **uniquement les métadonnées + le routage** (pas de secrets).
- Fichier OAuth hérité réservé à l’import : `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors du premier usage).

Plus de détails : [/concepts/oauth](/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains fournisseurs)

## ID de profil

Les connexions OAuth créent des profils distincts afin que plusieurs comptes puissent coexister.

- Par défaut : `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un fournisseur possède plusieurs profils, OpenClaw choisit un ordre comme suit :

1. **Configuration explicite** : `auth.order[provider]` (si défini).
2. **Profils configurés** : `auth.profiles` filtrés par fournisseur.
3. **Profils stockés** : entrées dans `auth-profiles.json` pour le fournisseur.

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin :

- **Clé primaire :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien d’abord, au sein de chaque type).
- Les **profils en cooldown/désactivés** sont déplacés à la fin, triés par expiration la plus proche.

### Persistance de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi par session** afin de garder les caches du fournisseur chauds.
Il **ne** fait **pas** tourner le profil à chaque requête. Le profil épinglé est réutilisé jusqu’à ce que :

- la session soit réinitialisée (`/new` / `/reset`)
- une compaction se termine (le compteur de compaction s’incrémente)
- le profil soit en cooldown/désactivé

La sélection manuelle via `/model …@<profileId>` définit un **remplacement utilisateur** pour cette session
et n’est pas tournée automatiquement tant qu’une nouvelle session ne commence pas.

Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** :
ils sont essayés en premier, mais OpenClaw peut passer à un autre profil en cas de limites de débit/timeouts.
Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle
sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil à clé API pour le même fournisseur, le round-robin peut alterner entre eux d’un message à l’autre sauf s’ils sont épinglés. Pour forcer un profil unique :

- Épinglez avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez un remplacement par session via `/model …` avec un remplacement de profil (lorsque pris en charge par votre surface UI/chat).

## Cooldowns

Lorsqu’un profil échoue à cause d’erreurs d’authentification/de limitation de débit (ou d’un timeout qui
ressemble à une limitation de débit), OpenClaw le place en cooldown et passe au profil suivant.
Ce groupe de limitations de débit est plus large qu’un simple `429` : il inclut aussi des messages de fournisseur
comme `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, ainsi que des limites d’usage périodiques comme
`weekly/monthly limit reached`.
Les erreurs de format/de requête invalide (par exemple les échecs de validation d’ID d’appel d’outil Cloud Code Assist) sont traitées comme justifiant un basculement et utilisent les mêmes cooldowns.
Les erreurs de stop-reason compatibles OpenAI telles que `Unhandled stop reason: error`,
`stop reason: error` et `reason: error` sont classées comme signaux de timeout/basculement.
Le texte générique de serveur à portée fournisseur peut également tomber dans cette catégorie timeout lorsque
la source correspond à un motif transitoire connu. Par exemple, côté Anthropic,
`An unknown error occurred` brut et les charges utiles JSON `api_error` avec un texte serveur transitoire
tel que `internal server error`, `unknown error, 520`, `upstream error`,
ou `backend error` sont traités comme justifiant un basculement de type timeout. Le texte générique amont spécifique à OpenRouter comme `Provider returned error`
brut est également traité comme un timeout uniquement lorsque le contexte fournisseur est réellement OpenRouter. Le texte générique interne de repli tel que `LLM request failed with an unknown error.` reste
conservateur et ne déclenche pas à lui seul un basculement.

Les cooldowns de limitation de débit peuvent aussi être limités à un modèle :

- OpenClaw enregistre `cooldownModel` pour les échecs de limitation de débit lorsque l’ID
  du modèle en échec est connu.
- Un modèle frère chez le même fournisseur peut encore être essayé lorsque le cooldown
  est limité à un autre modèle.
- Les fenêtres de facturation/désactivation bloquent toujours l’ensemble du profil sur tous les modèles.

Les cooldowns utilisent un backoff exponentiel :

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (plafond)

L’état est stocké dans `auth-profiles.json` sous `usageStats` :

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

Les échecs de facturation/de crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant un basculement, mais ils sont généralement peu transitoires. Au lieu d’un court cooldown, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et passe au profil/fournisseur suivant.

Toutes les réponses ayant une forme de facturation ne sont pas `402`, et tous les `402` HTTP
ne tombent pas ici. OpenClaw conserve le texte explicite de facturation dans la voie facturation même lorsqu’un
fournisseur renvoie à la place `401` ou `403`, mais les correspondances spécifiques au fournisseur restent
limitées au fournisseur propriétaire (par exemple OpenRouter `403 Key limit
exceeded`). Entre-temps, les erreurs temporaires `402` de fenêtre d’usage et
de limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque
le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, ou `organization spending limit exceeded`).
Celles-ci restent sur le chemin de court cooldown/basculement au lieu du chemin long
de désactivation pour facturation.

L’état est stocké dans `auth-profiles.json` :

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

Valeurs par défaut :

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et est plafonné à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué depuis **24 heures** (configurable).
- Les nouvelles tentatives en surcharge autorisent **1 rotation de profil chez le même fournisseur** avant le repli de modèle.
- Les nouvelles tentatives en surcharge utilisent un backoff de **0 ms** par défaut.

## Repli de modèle

Si tous les profils d’un fournisseur échouent, OpenClaw passe au modèle suivant dans
`agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et
aux timeouts qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli).

Les erreurs de surcharge et de limitation de débit sont gérées plus agressivement que les cooldowns
de facturation. Par défaut, OpenClaw autorise une nouvelle tentative de profil d’authentification chez le même fournisseur,
puis passe immédiatement au repli de modèle configuré suivant sans attendre.
Les signaux de fournisseur occupé comme `ModelNotReadyException` tombent dans cette catégorie
de surcharge. Ajustez cela avec `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, et
`auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution commence avec un remplacement de modèle (hooks ou CLI), les replis se terminent tout de même sur
`agents.defaults.model.primary` après avoir essayé les replis configurés.

### Règles de la chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé
plus les replis configurés.

Règles :

- Le modèle demandé est toujours en premier.
- Les replis configurés explicites sont dédupliqués mais non filtrés par la liste d’autorisation
  des modèles. Ils sont traités comme une intention explicite de l’opérateur.
- Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de fournisseur,
  OpenClaw continue d’utiliser la chaîne complète configurée.
- Si l’exécution actuelle est sur un fournisseur différent de celui de la configuration et que ce modèle
  actuel ne fait pas déjà partie de la chaîne de repli configurée, OpenClaw n’ajoute pas
  des replis configurés non liés d’un autre fournisseur.
- Lorsque l’exécution a commencé depuis un remplacement, le modèle principal configuré est ajouté à
  la fin afin que la chaîne puisse revenir vers la valeur par défaut normale une fois les candidats
  précédents épuisés.

### Quelles erreurs font avancer le repli

Le repli de modèle continue sur :

- les échecs d’authentification
- les limites de débit et l’épuisement des cooldowns
- les erreurs de surcharge/fournisseur occupé
- les erreurs de type timeout justifiant un basculement
- les désactivations de facturation
- `LiveSessionModelSwitchError`, qui est normalisée dans un chemin de basculement afin qu’un
  modèle persistant obsolète ne crée pas de boucle externe de nouvelle tentative
- les autres erreurs non reconnues lorsqu’il reste encore des candidats

Le repli de modèle ne continue pas sur :

- les abandons explicites qui ne sont pas de type timeout/basculement
- les erreurs de dépassement de contexte qui doivent rester dans la logique de compaction/nouvelle tentative
  (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, ou `ollama error: context
length exceeded`)
- une erreur inconnue finale lorsqu’il ne reste plus de candidats

### Comportement d’ignorance de cooldown vs sondage

Lorsque tous les profils d’authentification d’un fournisseur sont déjà en cooldown, OpenClaw
n’ignore pas automatiquement ce fournisseur pour toujours. Il prend une décision par candidat :

- Les échecs d’authentification persistants ignorent immédiatement tout le fournisseur.
- Les désactivations de facturation sont généralement ignorées, mais le candidat principal peut encore être sondé
  avec limitation afin que la récupération soit possible sans redémarrage.
- Le candidat principal peut être sondé près de l’expiration du cooldown, avec une limitation par fournisseur.
- Les modèles frères de repli chez le même fournisseur peuvent être tentés malgré le cooldown lorsque
  l’échec semble transitoire (`rate_limit`, `overloaded`, ou inconnu). C’est particulièrement pertinent
  lorsqu’une limitation de débit est limitée à un modèle et qu’un modèle frère peut encore
  se rétablir immédiatement.
- Les sondages transitoires en cooldown sont limités à un par fournisseur et par exécution de repli afin
  qu’un seul fournisseur ne bloque pas le repli inter-fournisseurs.

## Remplacements de session et changement de modèle en direct

Les changements de modèle de session sont un état partagé. L’exécuteur actif, la commande `/model`,
les mises à jour de compaction/session et la réconciliation de session en direct lisent ou écrivent
tous des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec les changements de modèle en direct :

- Seuls les changements de modèle explicites pilotés par l’utilisateur marquent un changement en direct en attente. Cela
  inclut `/model`, `session_status(model=...)` et `sessions.patch`.
- Les changements de modèle pilotés par le système, comme la rotation de repli, les remplacements heartbeat,
  ou la compaction, ne marquent jamais à eux seuls un changement en direct en attente.
- Avant qu’une nouvelle tentative de repli ne commence, l’exécuteur de réponse persiste les champs
  de remplacement du repli sélectionné dans l’entrée de session.
- La réconciliation de session en direct préfère les remplacements de session persistés aux champs de modèle
  obsolètes du runtime.
- Si la tentative de repli échoue, l’exécuteur annule uniquement les champs de remplacement
  qu’il a écrits, et seulement s’ils correspondent encore à ce candidat en échec.

Cela évite la course classique :

1. Le modèle principal échoue.
2. Un candidat de repli est choisi en mémoire.
3. Le stockage de session indique encore l’ancien modèle principal.
4. La réconciliation de session en direct lit l’état obsolète de la session.
5. La nouvelle tentative est ramenée à l’ancien modèle avant même que la tentative de repli
   ne commence.

Le remplacement de repli persisté ferme cette fenêtre, et l’annulation étroite
préserve les changements de session manuels ou runtime plus récents.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails de chaque tentative qui alimentent les journaux et les messages
de cooldown visibles par l’utilisateur :

- fournisseur/modèle essayé
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, et
  raisons de basculement similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. L’exécuteur
de réponse externe peut s’en servir pour construire un message plus spécifique comme « tous les modèles
sont temporairement limités » et inclure l’expiration de cooldown la plus proche lorsqu’elle est connue.

Ce résumé de cooldown tient compte du modèle :

- les limitations de débit limitées à d’autres modèles sont ignorées pour la chaîne
  fournisseur/modèle tentée
- si le blocage restant est une limitation de débit limitée au modèle correspondant, OpenClaw
  signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Voir [Configuration de Gateway](/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Voir [Modèles](/concepts/models) pour la vue d’ensemble plus large de la sélection de modèle et du repli.
