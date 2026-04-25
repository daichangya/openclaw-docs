---
read_when:
    - Expliquer comment les messages entrants deviennent des réponses
    - Clarifier les sessions, les modes de mise en file d’attente ou le comportement du streaming
    - Documenter la visibilité du raisonnement et les implications d’utilisation
summary: Flux de messages, sessions, mise en file d’attente et visibilité du raisonnement
title: Messages
x-i18n:
    generated_at: "2026-04-25T18:18:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

Cette page rassemble le fonctionnement d’OpenClaw pour les messages entrants, les sessions, la mise en file d’attente, le streaming et la visibilité du raisonnement.

## Flux de messages (vue d’ensemble)

```
Message entrant
  -> routage/liaisons -> clé de session
  -> file d’attente (si une exécution est active)
  -> exécution de l’agent (streaming + outils)
  -> réponses sortantes (limites du canal + découpage)
```

Les principaux réglages se trouvent dans la configuration :

- `messages.*` pour les préfixes, la mise en file d’attente et le comportement des groupes.
- `agents.defaults.*` pour les valeurs par défaut du streaming par blocs et du découpage.
- Les surcharges par canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) pour les plafonds et les bascules de streaming.

Voir [Configuration](/fr/gateway/configuration) pour le schéma complet.

## Déduplication des messages entrants

Les canaux peuvent renvoyer le même message après des reconnexions. OpenClaw conserve un cache de courte durée indexé par canal/compte/peer/session/id de message afin que les livraisons en double ne déclenchent pas une nouvelle exécution de l’agent.

## Antirebond des messages entrants

Des messages rapides et consécutifs provenant du **même expéditeur** peuvent être regroupés en un seul tour d’agent via `messages.inbound`. L’antirebond est appliqué par canal + conversation et utilise le message le plus récent pour le threading des réponses/ID.

Configuration (valeur par défaut globale + surcharges par canal) :

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

- L’antirebond s’applique aux messages **texte uniquement** ; les médias/pièces jointes déclenchent un envoi immédiat.
- Les commandes de contrôle contournent l’antirebond afin de rester autonomes — **sauf** lorsqu’un canal active explicitement le regroupement des MP du même expéditeur (par exemple [BlueBubbles `coalesceSameSenderDms`](/fr/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), où les commandes en MP attendent dans la fenêtre d’antirebond afin qu’une charge utile envoyée en plusieurs parties puisse rejoindre le même tour d’agent.

## Sessions et appareils

Les sessions appartiennent à la Gateway, pas aux clients.

- Les discussions directes sont regroupées dans la clé de session principale de l’agent.
- Les groupes/canaux ont leur propre clé de session.
- Le magasin de sessions et les transcriptions vivent sur l’hôte de la Gateway.

Plusieurs appareils/canaux peuvent correspondre à la même session, mais l’historique n’est pas entièrement resynchronisé vers chaque client. Recommandation : utilisez un appareil principal pour les longues conversations afin d’éviter un contexte divergent. L’interface de contrôle et la TUI affichent toujours la transcription de session soutenue par la Gateway ; elles constituent donc la source de vérité.

Détails : [Gestion des sessions](/fr/concepts/session).

## Corps des messages entrants et contexte d’historique

OpenClaw sépare le **corps du prompt** du **corps de commande** :

- `Body` : texte du prompt envoyé à l’agent. Il peut inclure des enveloppes de canal et des wrappers d’historique facultatifs.
- `CommandBody` : texte brut de l’utilisateur pour l’analyse des directives/commandes.
- `RawBody` : alias historique de `CommandBody` (conservé pour compatibilité).

Lorsqu’un canal fournit un historique, il utilise un wrapper partagé :

- `[Messages du chat depuis votre dernière réponse - pour le contexte]`
- `[Message actuel - répondez à celui-ci]`

Pour les **discussions non directes** (groupes/canaux/salons), le **corps du message actuel** reçoit le préfixe du libellé de l’expéditeur (dans le même style que celui utilisé pour les entrées d’historique). Cela maintient la cohérence des messages en temps réel et des messages mis en file d’attente/d’historique dans le prompt de l’agent.

Les tampons d’historique sont **uniquement en attente** : ils incluent les messages de groupe qui n’ont _pas_ déclenché d’exécution (par exemple, les messages conditionnés par une mention) et **excluent** les messages déjà présents dans la transcription de session.

Le retrait des directives s’applique uniquement à la section du **message actuel** afin de préserver l’historique. Les canaux qui encapsulent l’historique doivent définir `CommandBody` (ou `RawBody`) sur le texte original du message et conserver `Body` comme prompt combiné. Les tampons d’historique sont configurables via `messages.groupChat.historyLimit` (valeur par défaut globale) et des surcharges par canal comme `channels.slack.historyLimit` ou `channels.telegram.accounts.<id>.historyLimit` (définissez `0` pour désactiver).

## Mise en file d’attente et suivis

Si une exécution est déjà active, les messages entrants peuvent être mis en file d’attente, dirigés vers l’exécution en cours ou collectés pour un tour de suivi.

- Configuration via `messages.queue` (et `messages.queue.byChannel`).
- Modes : `interrupt`, `steer`, `followup`, `collect`, ainsi que des variantes de backlog.

Détails : [Mise en file d’attente](/fr/concepts/queue).

## Streaming, découpage et regroupement

Le streaming par blocs envoie des réponses partielles à mesure que le modèle produit des blocs de texte.
Le découpage respecte les limites de texte du canal et évite de couper le code délimité.

Principaux réglages :

- `agents.defaults.blockStreamingDefault` (`on|off`, désactivé par défaut)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (regroupement basé sur l’inactivité)
- `agents.defaults.humanDelay` (pause de type humain entre les réponses par blocs)
- Surcharges par canal : `*.blockStreaming` et `*.blockStreamingCoalesce` (les canaux autres que Telegram exigent un `*.blockStreaming: true` explicite)

Détails : [Streaming + découpage](/fr/concepts/streaming).

## Visibilité du raisonnement et jetons

OpenClaw peut afficher ou masquer le raisonnement du modèle :

- `/reasoning on|off|stream` contrôle la visibilité.
- Le contenu de raisonnement compte tout de même dans l’utilisation des jetons lorsqu’il est produit par le modèle.
- Telegram prend en charge le streaming du raisonnement dans la bulle de brouillon.

Détails : [Directives de réflexion + raisonnement](/fr/tools/thinking) et [Utilisation des jetons](/fr/reference/token-use).

## Préfixes, threading et réponses

La mise en forme des messages sortants est centralisée dans `messages` :

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` et `channels.<channel>.accounts.<id>.responsePrefix` (cascade de préfixes sortants), ainsi que `channels.whatsapp.messagePrefix` (préfixe entrant WhatsApp)
- Threading des réponses via `replyToMode` et les valeurs par défaut par canal

Détails : [Configuration](/fr/gateway/config-agents#messages) et la documentation des canaux.

## Réponses silencieuses

Le jeton silencieux exact `NO_REPLY` / `no_reply` signifie « ne pas envoyer de réponse visible à l’utilisateur ».
Lorsqu’un tour comporte aussi des médias d’outil en attente, comme un audio TTS généré, OpenClaw supprime le texte silencieux mais livre tout de même la pièce jointe média.
OpenClaw résout ce comportement selon le type de conversation :

- Les conversations directes interdisent le silence par défaut et réécrivent une réponse silencieuse seule en un court message visible de secours.
- Les groupes/canaux autorisent le silence par défaut.
- L’orchestration interne autorise le silence par défaut.

Les valeurs par défaut se trouvent sous `agents.defaults.silentReply` et
`agents.defaults.silentReplyRewrite` ; `surfaces.<id>.silentReply` et
`surfaces.<id>.silentReplyRewrite` peuvent les surcharger par surface.

Lorsque la session parente comporte une ou plusieurs exécutions de sous-agents générées encore en attente, les réponses silencieuses seules sont abandonnées sur toutes les surfaces au lieu d’être réécrites, afin que le parent reste silencieux jusqu’à ce que l’événement de fin de l’enfant livre la vraie réponse.

## Lié

- [Streaming](/fr/concepts/streaming) — livraison des messages en temps réel
- [Nouvelle tentative](/fr/concepts/retry) — comportement de nouvelle tentative de livraison des messages
- [File d’attente](/fr/concepts/queue) — file de traitement des messages
- [Canaux](/fr/channels) — intégrations de plateformes de messagerie
