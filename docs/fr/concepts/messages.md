---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement de streaming
    - Documenter la visibilité du raisonnement et les implications sur l’utilisation
summary: Flux des messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-05T12:40:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
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

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut du streaming par blocs et du découpage.
- Remplacements par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Consultez [Configuration](/gateway/configuration) pour le schéma complet.

## Déduplication entrante

Les canaux peuvent renvoyer le même message après des reconnexions. OpenClaw conserve un
cache de courte durée indexé par canal/compte/peer/session/ID de message afin que les livraisons en double
ne déclenchent pas une nouvelle exécution d’agent.

## Antirebond entrant

Des messages rapides et consécutifs du **même expéditeur** peuvent être regroupés en un seul
tour d’agent via `messages.inbound`. L’antirebond est limité par canal + conversation
et utilise le message le plus récent pour le fil de réponse/les IDs.

Configuration (valeur globale par défaut + remplacements par canal) :

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

- L’antirebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes sont vidés immédiatement.
- Les commandes de contrôle contournent l’antirebond afin de rester autonomes.

## Sessions et appareils

Les sessions appartiennent à la passerelle, pas aux clients.

- Les discussions directes se replient vers la clé de session principale de l’agent.
- Les groupes/canaux obtiennent leurs propres clés de session.
- Le magasin de sessions et les transcriptions résident sur l’hôte de la passerelle.

Plusieurs appareils/canaux peuvent être mappés à la même session, mais l’historique n’est pas entièrement
resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues
conversations afin d’éviter des contextes divergents. L’interface de contrôle et le TUI affichent toujours la
transcription de session adossée à la passerelle ; ils constituent donc la source de vérité.

Détails : [Gestion des sessions](/concepts/session).

## Corps entrants et contexte d’historique

OpenClaw sépare le **corps de l’invite** du **corps de la commande** :

- `Body` : texte de l’invite envoyé à l’agent. Il peut inclure des enveloppes de canal et
  des wrappers d’historique facultatifs.
- `CommandBody` : texte brut de l’utilisateur pour l’analyse des directives/commandes.
- `RawBody` : alias hérité de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Pour les **discussions non directes** (groupes/canaux/salons), le **corps du message actuel** est préfixé par le
libellé de l’expéditeur (même style que celui utilisé pour les entrées d’historique). Cela garde cohérents
les messages en temps réel et les messages mis en file/en historique dans l’invite de l’agent.

Les tampons d’historique sont **en attente uniquement** : ils incluent les messages de groupe qui n’ont _pas_
déclenché d’exécution (par exemple, les messages filtrés par le contrôle par mention) et **excluent** les messages
déjà présents dans la transcription de session.

Le retrait des directives ne s’applique qu’à la section du **message actuel** afin que l’historique
reste intact. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou
`RawBody`) sur le texte du message d’origine et conserver `Body` comme invite combinée.
Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur globale
par défaut) et des remplacements par canal comme `channels.slack.historyLimit` ou
`channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file, redirigés vers l’exécution
courante ou collectés pour un tour de suivi.

- Configurez cela via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, plus variantes de backlog.

Détails : [Mise en file d’attente](/concepts/queue).

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles au fur et à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte des canaux et évite de couper les blocs de code délimités.

Réglages clés :

- `agents.defaults.blockStreamingDefault` (`on|off`, off par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Remplacements par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux non Telegram exigent `*.blockStreaming: true` explicite)

Détails : [Streaming + chunking](/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut exposer ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement continue de compter dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le streaming du raisonnement dans la bulle de brouillon.

Détails : [Directives de pensée + raisonnement](/tools/thinking) et [Utilisation des jetons](/reference/token-use).

## Préfixes, fils et réponses

Le formatage des messages sortants est centralisé dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), plus `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Fil de réponse via `replyToMode` et valeurs par défaut par canal

Détails : [Configuration](/gateway/configuration-reference#messages) et documentation des canaux.

## Lié

- [Streaming](/concepts/streaming) — livraison de messages en temps réel
- [Retry](/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [Queue](/concepts/queue) — file de traitement des messages
- [Channels](/channels) — intégrations des plateformes de messagerie
