---
read_when:
    - Diagnostic de la rotation des profils d’authentification, des périodes de refroidissement ou du comportement de repli des modèles
    - Mise à jour des règles de basculement pour les profils d’authentification ou les modèles
    - Comprendre comment les surcharges de modèle de session interagissent avec les nouvelles tentatives de repli
summary: Comment OpenClaw fait tourner les profils d’authentification et revient à d’autres modèles en cas d’échec
title: Basculement de modèle en cas d’échec
x-i18n:
    generated_at: "2026-04-24T07:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gère les échecs en deux étapes :

1. **Rotation des profils d’authentification** au sein du provider actuel.
2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

Ce document explique les règles d’exécution et les données qui les sous-tendent.

## Flux d’exécution

Pour une exécution texte normale, OpenClaw évalue les candidats dans cet ordre :

1. Le modèle de session actuellement sélectionné.
2. `agents.defaults.model.fallbacks` configurés dans l’ordre.
3. Le modèle principal configuré à la fin lorsque l’exécution a démarré depuis une surcharge.

À l’intérieur de chaque candidat, OpenClaw essaie le basculement des profils d’authentification avant de passer
au candidat de modèle suivant.

Séquence de haut niveau :

1. Résoudre le modèle de session actif et la préférence de profil d’authentification.
2. Construire la chaîne de candidats de modèle.
3. Essayer le provider actuel avec les règles de rotation/refroidissement des profils d’authentification.
4. Si ce provider est épuisé avec une erreur justifiant le basculement, passer au
   candidat de modèle suivant.
5. Persister la surcharge de repli sélectionnée avant le début de la nouvelle tentative afin que les autres
   lecteurs de session voient le même provider/modèle que celui que le runner va utiliser.
6. Si le candidat de repli échoue, annuler uniquement les champs de surcharge de session appartenant au repli
   lorsqu’ils correspondent encore à ce candidat en échec.
7. Si tous les candidats échouent, lever une `FallbackSummaryError` avec un détail par tentative
   et l’expiration de refroidissement la plus proche lorsqu’elle est connue.

Cela est volontairement plus étroit que « sauvegarder et restaurer toute la session ». Le
runner de réponse ne persiste que les champs de sélection de modèle qu’il possède pour le repli :

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Cela empêche une nouvelle tentative de repli échouée d’écraser des mutations de session plus récentes et sans rapport,
comme des changements manuels `/model` ou des mises à jour de rotation de session
survenus pendant l’exécution de la tentative.

## Stockage d’authentification (clés + OAuth)

OpenClaw utilise des **profils d’authentification** à la fois pour les clés API et les jetons OAuth.

- Les secrets résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (hérité : `~/.openclaw/agent/auth-profiles.json`).
- L’état d’exécution du routage d’authentification réside dans `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- La configuration `auth.profiles` / `auth.order` est réservée aux **métadonnées + au routage** (sans secrets).
- Fichier OAuth hérité importé uniquement : `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation).

Plus de détails : [/concepts/oauth](/fr/concepts/oauth)

Types d’identifiants :

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` pour certains providers)

## Identifiants de profil

Les connexions OAuth créent des profils distincts afin de permettre la coexistence de plusieurs comptes.

- Par défaut : `provider:default` lorsqu’aucun e-mail n’est disponible.
- OAuth avec e-mail : `provider:<email>` (par exemple `google-antigravity:user@gmail.com`).

Les profils résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` sous `profiles`.

## Ordre de rotation

Lorsqu’un provider possède plusieurs profils, OpenClaw choisit un ordre comme suit :

1. **Configuration explicite** : `auth.order[provider]` (si défini).
2. **Profils configurés** : `auth.profiles` filtrés par provider.
3. **Profils stockés** : entrées dans `auth-profiles.json` pour le provider.

Si aucun ordre explicite n’est configuré, OpenClaw utilise un ordre round-robin :

- **Clé primaire :** type de profil (**OAuth avant les clés API**).
- **Clé secondaire :** `usageStats.lastUsed` (le plus ancien en premier, dans chaque type).
- Les **profils en refroidissement/désactivés** sont déplacés à la fin, classés par expiration la plus proche.

### Persistance de session (favorable au cache)

OpenClaw **épingle le profil d’authentification choisi par session** afin de garder les caches provider chauds.
Il **ne** fait **pas** de rotation à chaque requête. Le profil épinglé est réutilisé jusqu’à :

- réinitialisation de la session (`/new` / `/reset`)
- fin d’une Compaction (le compteur de Compaction s’incrémente)
- mise en refroidissement/désactivation du profil

La sélection manuelle via `/model …@<profileId>` définit une **surcharge utilisateur** pour cette session
et n’est pas tournée automatiquement jusqu’au démarrage d’une nouvelle session.

Les profils épinglés automatiquement (sélectionnés par le routeur de session) sont traités comme une **préférence** :
ils sont essayés en premier, mais OpenClaw peut tourner vers un autre profil en cas de limites de débit/délais d’attente.
Les profils épinglés par l’utilisateur restent verrouillés sur ce profil ; s’il échoue et que des replis de modèle
sont configurés, OpenClaw passe au modèle suivant au lieu de changer de profil.

### Pourquoi OAuth peut « sembler perdu »

Si vous avez à la fois un profil OAuth et un profil de clé API pour le même provider, le round-robin peut alterner entre eux d’un message à l’autre sauf s’ils sont épinglés. Pour forcer un profil unique :

- Épinglez avec `auth.order[provider] = ["provider:profileId"]`, ou
- Utilisez une surcharge par session via `/model …` avec une surcharge de profil (lorsque cela est pris en charge par votre surface UI/chat).

## Refroidissements

Lorsqu’un profil échoue en raison d’erreurs d’authentification/de limite de débit (ou d’un délai d’attente qui
ressemble à une limitation de débit), OpenClaw le place en refroidissement et passe au profil suivant.
Ce compartiment de limitation de débit est plus large que le simple `429` : il inclut aussi les messages
de provider tels que `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, et les limites périodiques de fenêtre d’utilisation comme
`weekly/monthly limit reached`.
Les erreurs de format/requête invalide (par exemple les échecs de validation d’identifiant d’appel d’outil de Cloud Code Assist) sont traitées comme justifiant le basculement et utilisent les mêmes refroidissements.
Les erreurs de raison d’arrêt compatibles OpenAI telles que `Unhandled stop reason: error`,
`stop reason: error`, et `reason: error` sont classées comme signaux
de délai d’attente/basculement.
Le texte générique côté provider peut aussi tomber dans ce compartiment de délai d’attente lorsque
la source correspond à un motif transitoire connu. Par exemple, chez Anthropic, un
simple `An unknown error occurred` et les charges utiles JSON `api_error` avec un texte serveur transitoire
tel que `internal server error`, `unknown error, 520`, `upstream error`,
ou `backend error` sont traités comme des délais d’attente justifiant le basculement. Le texte générique spécifique à OpenRouter
en amont tel que `Provider returned error` seul n’est également traité comme
délai d’attente que lorsque le contexte provider est réellement OpenRouter. Le texte de repli interne générique tel que `LLM request failed with an unknown error.` reste
conservateur et ne déclenche pas le basculement à lui seul.

Certains SDK provider peuvent autrement dormir pendant une longue fenêtre `Retry-After` avant de
rendre la main à OpenClaw. Pour les SDK basés sur Stainless tels qu’Anthropic et
OpenAI, OpenClaw plafonne les attentes internes au SDK `retry-after-ms` / `retry-after` à 60
secondes par défaut et fait remonter immédiatement les réponses réessayables plus longues afin que ce
chemin de basculement puisse s’exécuter. Réglez ou désactivez ce plafond avec
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ; voir [/concepts/retry](/fr/concepts/retry).

Les refroidissements de limite de débit peuvent aussi être limités au modèle :

- OpenClaw enregistre `cooldownModel` pour les échecs de limite de débit lorsque l’identifiant
  du modèle en échec est connu.
- Un modèle frère sur le même provider peut toujours être essayé lorsque le refroidissement est
  limité à un modèle différent.
- Les fenêtres de facturation/désactivation bloquent toujours l’ensemble du profil sur tous les modèles.

Les refroidissements utilisent un backoff exponentiel :

- 1 minute
- 5 minutes
- 25 minutes
- 1 heure (plafond)

L’état est stocké dans `auth-state.json` sous `usageStats` :

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

Les échecs de facturation/crédit (par exemple « crédits insuffisants » / « solde de crédit trop faible ») sont traités comme justifiant le basculement, mais ils sont généralement non transitoires. Au lieu d’un refroidissement court, OpenClaw marque le profil comme **désactivé** (avec un backoff plus long) et passe au profil/provider suivant.

Toutes les réponses ayant une forme de facturation ne sont pas des `402`, et tous les `402` HTTP n’arrivent pas
ici. OpenClaw conserve le texte explicite de facturation dans la voie de facturation même lorsqu’un
provider renvoie `401` ou `403` à la place, mais les correspondances spécifiques aux providers restent
limitées au provider qui les possède (par exemple OpenRouter `403 Key limit
exceeded`). Pendant ce temps, les erreurs temporaires `402` de fenêtre d’utilisation et
de limite de dépense d’organisation/espace de travail sont classées comme `rate_limit` lorsque
le message semble réessayable (par exemple `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, ou `organization spending limit exceeded`).
Celles-ci restent sur le chemin court de refroidissement/basculement au lieu du long
chemin de désactivation pour facturation.

L’état est stocké dans `auth-state.json` :

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

- Le backoff de facturation commence à **5 heures**, double à chaque échec de facturation et plafonne à **24 heures**.
- Les compteurs de backoff sont réinitialisés si le profil n’a pas échoué depuis **24 heures** (configurable).
- Les nouvelles tentatives sur surcharge autorisent **1 rotation de profil sur le même provider** avant le repli de modèle.
- Les nouvelles tentatives sur surcharge utilisent un backoff de **0 ms** par défaut.

## Repli de modèle

Si tous les profils d’un provider échouent, OpenClaw passe au modèle suivant dans
`agents.defaults.model.fallbacks`. Cela s’applique aux échecs d’authentification, aux limites de débit et aux
délais d’attente qui ont épuisé la rotation des profils (les autres erreurs ne font pas avancer le repli).

Les erreurs de surcharge et de limite de débit sont gérées plus agressivement que les refroidissements de facturation. Par défaut, OpenClaw autorise une nouvelle tentative avec un profil d’authentification sur le même provider,
puis bascule sans attendre vers le modèle de repli configuré suivant.
Les signaux de provider occupé tels que `ModelNotReadyException` tombent dans ce compartiment de surcharge.
Réglez cela avec `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, et
`auth.cooldowns.rateLimitedProfileRotations`.

Lorsqu’une exécution démarre avec une surcharge de modèle (hooks ou CLI), les replis se terminent quand même à
`agents.defaults.model.primary` après avoir essayé les replis configurés.

### Règles de chaîne de candidats

OpenClaw construit la liste des candidats à partir du `provider/model` actuellement demandé
plus les replis configurés.

Règles :

- Le modèle demandé est toujours en premier.
- Les replis configurés explicites sont dédupliqués mais non filtrés par la liste d’autorisation
  de modèles. Ils sont traités comme une intention explicite de l’opérateur.
- Si l’exécution actuelle est déjà sur un repli configuré dans la même famille de providers,
  OpenClaw continue à utiliser la chaîne configurée complète.
- Si l’exécution actuelle est sur un provider différent de la configuration et que ce modèle actuel
  ne fait pas déjà partie de la chaîne de repli configurée, OpenClaw n’ajoute pas
  de replis configurés sans lien provenant d’un autre provider.
- Lorsque l’exécution a démarré depuis une surcharge, le primaire configuré est ajouté à
  la fin afin que la chaîne puisse revenir au défaut normal une fois les candidats précédents épuisés.

### Quelles erreurs font avancer le repli

Le repli de modèle continue sur :

- échecs d’authentification
- limites de débit et épuisement du refroidissement
- erreurs de surcharge/provider occupé
- erreurs de basculement ayant la forme d’un délai d’attente
- désactivations de facturation
- `LiveSessionModelSwitchError`, qui est normalisée en chemin de basculement afin qu’un
  modèle persisté obsolète ne crée pas de boucle externe de nouvelle tentative
- autres erreurs non reconnues lorsqu’il reste encore des candidats

Le repli de modèle ne continue pas sur :

- annulations explicites qui n’ont pas la forme d’un délai d’attente/basculement
- erreurs de dépassement de contexte qui doivent rester dans la logique de Compaction/nouvelle tentative
  (par exemple `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, ou `ollama error: context
length exceeded`)
- une erreur inconnue finale lorsqu’il ne reste plus de candidats

### Comportement de saut de refroidissement vs sonde

Lorsque chaque profil d’authentification d’un provider est déjà en refroidissement, OpenClaw ne
saute pas automatiquement ce provider pour toujours. Il prend une décision par candidat :

- Les échecs d’authentification persistants sautent immédiatement tout le provider.
- Les désactivations de facturation sont généralement sautées, mais le candidat principal peut quand même être sondé
  avec limitation afin de permettre une récupération sans redémarrage.
- Le candidat principal peut être sondé à l’approche de l’expiration du refroidissement, avec une limitation par provider.
- Les modèles frères de repli sur le même provider peuvent être essayés malgré le refroidissement lorsque
  l’échec semble transitoire (`rate_limit`, `overloaded`, ou inconnu). C’est
  particulièrement pertinent lorsqu’une limite de débit est limitée au modèle et qu’un modèle frère
  peut quand même récupérer immédiatement.
- Les sondes de refroidissement transitoire sont limitées à une par provider et par exécution de repli afin
  qu’un seul provider ne bloque pas le repli inter-providers.

## Surcharges de session et basculement de modèle en direct

Les changements de modèle de session constituent un état partagé. Le runner actif, la commande `/model`,
les mises à jour de Compaction/session, et la réconciliation de session en direct lisent ou écrivent tous
des parties de la même entrée de session.

Cela signifie que les nouvelles tentatives de repli doivent se coordonner avec le basculement de modèle en direct :

- Seuls les changements de modèle explicitement pilotés par l’utilisateur marquent un basculement en direct en attente. Cela
  inclut `/model`, `session_status(model=...)`, et `sessions.patch`.
- Les changements de modèle pilotés par le système tels que la rotation de repli, les surcharges Heartbeat,
  ou la Compaction ne marquent jamais à eux seuls un basculement en direct en attente.
- Avant le début d’une nouvelle tentative de repli, le runner de réponse persiste les champs
  de surcharge de repli sélectionnés dans l’entrée de session.
- La réconciliation de session en direct préfère les surcharges de session persistées aux champs de modèle
  d’exécution obsolètes.
- Si la tentative de repli échoue, le runner annule uniquement les champs de surcharge
  qu’il a écrits, et seulement s’ils correspondent encore à ce candidat en échec.

Cela évite la course classique :

1. Le primaire échoue.
2. Un candidat de repli est choisi en mémoire.
3. Le magasin de session indique encore l’ancien primaire.
4. La réconciliation de session en direct lit l’état de session obsolète.
5. La nouvelle tentative revient à l’ancien modèle avant même le début de la tentative de repli.

La surcharge de repli persistée ferme cette fenêtre, et l’annulation étroite
préserve les changements de session manuels ou d’exécution plus récents.

## Observabilité et résumés d’échec

`runWithModelFallback(...)` enregistre les détails par tentative qui alimentent les journaux et
les messages d’utilisateur concernant les refroidissements :

- provider/modèle essayé
- raison (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, et
  raisons de basculement similaires)
- statut/code facultatif
- résumé d’erreur lisible par un humain

Lorsque tous les candidats échouent, OpenClaw lève `FallbackSummaryError`. Le
runner de réponse externe peut l’utiliser pour construire un message plus précis du type « tous les modèles
sont temporairement limités par le débit » et inclure l’expiration de refroidissement la plus proche lorsqu’elle
est connue.

Ce résumé de refroidissement tient compte du modèle :

- les limites de débit limitées à d’autres modèles sont ignorées pour la chaîne
  provider/modèle essayée
- si le blocage restant est une limite de débit limitée au modèle correspondante, OpenClaw
  signale la dernière expiration correspondante qui bloque encore ce modèle

## Configuration associée

Consultez [Configuration du Gateway](/fr/gateway/configuration) pour :

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routage `agents.defaults.imageModel`

Consultez [Modèles](/fr/concepts/models) pour une vue d’ensemble plus large de la sélection de modèle et du repli.
