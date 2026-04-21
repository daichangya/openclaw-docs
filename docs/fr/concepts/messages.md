---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarification des sessions, des modes de mise en file d’attente ou du comportement de streaming
    - Documentation de la visibilité du raisonnement et des implications d’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-21T06:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
    source_path: concepts/messages.md
    workflow: 15
---

# Messages

Cette page rassemble la manière dont OpenClaw gère les messages entrants, les sessions, la mise en file d’attente,
le streaming et la visibilité du raisonnement.

## Flux des messages (vue d’ensemble)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement dans les groupes.
- `agents.defaults.*` pour les valeurs par défaut du block streaming et du découpage.
- Les remplacements propres au canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication en entrée

Les canaux peuvent renvoyer le même message après des reconnexions. OpenClaw conserve un
cache de courte durée indexé par canal/compte/peer/session/message id afin que les livraisons en double
ne déclenchent pas une nouvelle exécution d’agent.

## Debouncing en entrée

Des messages consécutifs rapides provenant du **même expéditeur** peuvent être regroupés en un seul
tour d’agent via `messages.inbound`. Le debouncing est délimité par canal + conversation
et utilise le message le plus récent pour le threading/les ID de réponse.

Configuration (valeur par défaut globale + remplacements par canal) :

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Remarques :

- Le debounce s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont vidés immédiatement.
- Les commandes de contrôle contournent le debouncing afin de rester autonomes.

## Sessions et appareils

Les sessions appartiennent à la gateway, pas aux clients.

- Les discussions directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions se trouvent sur l’hôte gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement
resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues
conversations afin d’éviter un contexte divergent. L’interface Control et le TUI affichent toujours la
transcription de session adossée à la gateway, ce sont donc les sources de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de commande** :

- `Body` : texte du prompt envoyé à l’agent. Il peut inclure des enveloppes de canal et
  des wrappers d’historique facultatifs.
- `CommandBody` : texte brut de l’utilisateur pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé par le
libellé de l’expéditeur (même style que celui utilisé pour les entrées d’historique). Cela garantit la cohérence entre les
messages en temps réel et les messages mis en file d’attente/d’historique dans le prompt de l’agent.

Les tampons d’historique sont **en attente uniquement** : ils incluent les messages de groupe qui n’ont _pas_
déclenché d’exécution (par exemple, les messages filtrés par mention) et **excluent** les messages
déjà présents dans la transcription de session.

Le retrait des directives s’applique uniquement à la section du **message actuel** afin que l’historique
reste intact. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou
`RawBody`) sur le texte d’origine du message et conserver `Body` comme prompt combiné.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur
par défaut globale) et des remplacements par canal comme `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (définir `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, dirigés vers l’exécution
actuelle ou collectés pour un tour de suivi.

- Configurez cela via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, plus les variantes de backlog.

Détails : [Mise en file d’attente](/fr/concepts/queue).

## Streaming, découpage et regroupement

Le block streaming envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte du canal et évite de scinder le code délimité.

Principaux réglages :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non Telegram nécessitent `*.blockStreaming: true` explicite)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte tout de même dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le streaming du raisonnement dans la bulle de brouillon.

Détails : [Directives Thinking + reasoning](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, threading et réponses

La mise en forme des messages sortants est centralisée dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Threading des réponses via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/configuration-reference#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas envoyer de réponse visible par l’utilisateur ».
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse silencieuse brute
  en une courte réponse visible de secours.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les remplacer pour chaque surface.

## Liens associés

- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [Queue](/fr/concepts/queue) — file de traitement des messages
- [Channels](/fr/channels) — intégrations avec les plateformes de messagerie
