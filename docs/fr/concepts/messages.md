---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement de streaming
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux de messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-24T07:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Cette page relie la manière dont OpenClaw gère les messages entrants, les sessions, la mise en file d’attente,
le streaming et la visibilité du raisonnement.

## Flux des messages (vue d’ensemble)

```
Message entrant
  -> routage/bindings -> clé de session
  -> file d’attente (si une exécution est active)
  -> exécution de l’agent (streaming + outils)
  -> réponses sortantes (limites du canal + segmentation)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut de streaming par blocs et de segmentation.
- Remplacements par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent redistribuer le même message après des reconnexions. OpenClaw conserve un
cache de courte durée basé sur channel/account/peer/session/message id afin que les livraisons en double
ne déclenchent pas une nouvelle exécution de l’agent.

## Anti-rebond des messages entrants

Des messages consécutifs rapides provenant du **même expéditeur** peuvent être regroupés dans un seul
tour d’agent via `messages.inbound`. L’anti-rebond est limité par canal + conversation
et utilise le message le plus récent pour le fil de réponse/les ID.

Configuration (valeur par défaut globale + remplacements par canal) :

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

Remarques :

- L’anti-rebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont vidés immédiatement.
- Les commandes de contrôle contournent l’anti-rebond afin de rester autonomes — **sauf** lorsqu’un canal adhère explicitement au regroupement DM même expéditeur (par ex. [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes DM attendent dans la fenêtre d’anti-rebond pour qu’une charge utile envoyée en morceaux puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent au gateway, pas aux clients.

- Les discussions directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le stockage des sessions et les transcriptions résident sur l’hôte gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement
resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues
conversations afin d’éviter des contextes divergents. Control UI et TUI affichent toujours la
transcription de session adossée au gateway, ils constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de commande** :

- `Body` : texte du prompt envoyé à l’agent. Il peut inclure des enveloppes de canal et
  des encapsulations facultatives d’historique.
- `CommandBody` : texte utilisateur brut pour l’analyse des directives/commandes.
- `RawBody` : alias hérité de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise une encapsulation partagée :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salles), le **corps du message actuel** reçoit en préfixe
le libellé de l’expéditeur (même style que pour les entrées d’historique). Cela rend cohérents, dans le prompt de l’agent,
les messages en temps réel et les messages mis en file d’attente/d’historique.

Les tampons d’historique sont **pending-only** : ils incluent les messages de groupe qui n’ont _pas_
déclenché d’exécution (par exemple, des messages soumis au déclenchement par mention) et **excluent** les messages
déjà présents dans la transcription de session.

Le retrait des directives ne s’applique qu’à la section du **message actuel** afin que l’historique
reste intact. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou
`RawBody`) sur le texte du message d’origine et conserver `Body` comme prompt combiné.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur par défaut
globale) et des remplacements par canal comme `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, dirigés vers l’exécution
actuelle, ou collectés pour un tour de suivi.

- Configurez via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, plus des variantes de backlog.

Détails : [Mise en file d’attente](/fr/concepts/queue).

## Streaming, segmentation et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
La segmentation respecte les limites de texte des canaux et évite de scinder du code délimité.

Principaux paramètres :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux hors Telegram exigent un `*.blockStreaming: true` explicite)

Détails : [Streaming + segmentation](/fr/concepts/streaming).

## Visibilité du raisonnement et tokens

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu du raisonnement compte toujours dans l’utilisation des tokens lorsqu’il est produit par le modèle.
- Telegram prend en charge le streaming du raisonnement dans la bulle de brouillon.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des tokens](/fr/reference/token-use).

## Préfixes, fils et réponses

Le formatage des messages sortants est centralisé dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Réponses dans les fils via `replyToMode` et les valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas livrer de réponse visible par l’utilisateur ».
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une
  réponse silencieuse brute en un court repli visible.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les remplacer par surface.

Lorsque la session parente a une ou plusieurs exécutions de sous-agent engendrées en attente,
les réponses silencieuses brutes sont supprimées sur toutes les surfaces au lieu d’être réécrites, afin que le
parent reste silencieux jusqu’à ce que l’événement d’achèvement de l’enfant livre la vraie réponse.

## Lié

- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [Queue](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
