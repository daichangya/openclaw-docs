---
read_when:
    - Refactorisation de l’interface des messages de canal, des charges utiles interactives ou des moteurs de rendu natifs des canaux
    - Modification des capacités de l’outil de message, des indications de livraison ou des marqueurs inter-contexte
    - Débogage de la propagation d’import Discord Carbon ou de la paresse d’exécution des plugins de canal
summary: Découpler la présentation sémantique des messages des moteurs de rendu d’interface natifs des canaux.
title: Plan de refactorisation de la présentation des canaux
x-i18n:
    generated_at: "2026-04-24T07:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Statut

Implémenté pour l’agent partagé, la CLI, la capacité de plugin et les surfaces de livraison sortante :

- `ReplyPayload.presentation` transporte l’interface sémantique des messages.
- `ReplyPayload.delivery.pin` transporte les demandes d’épinglage des messages envoyés.
- Les actions de message partagées exposent `presentation`, `delivery` et `pin` au lieu des éléments natifs au fournisseur comme `components`, `blocks`, `buttons` ou `card`.
- Le cœur rend ou dégrade automatiquement la présentation via les capacités sortantes déclarées par les plugins.
- Les moteurs de rendu Discord, Slack, Telegram, Mattermost, Microsoft Teams et Feishu consomment le contrat générique.
- Le code du plan de contrôle du canal Discord n’importe plus de conteneurs d’interface adossés à Carbon.

La documentation canonique se trouve désormais dans [Message Presentation](/fr/plugins/message-presentation).
Conservez ce plan comme contexte historique d’implémentation ; mettez à jour le guide canonique
lors des changements de contrat, de moteur de rendu ou de comportement de repli.

## Problème

L’interface des canaux est actuellement répartie sur plusieurs surfaces incompatibles :

- Le cœur possède un hook de rendu inter-contexte de forme Discord via `buildCrossContextComponents`.
- `channel.ts` de Discord peut importer l’interface native Carbon via `DiscordUiContainer`, ce qui injecte des dépendances d’interface runtime dans le plan de contrôle du plugin de canal.
- L’agent et la CLI exposent des échappatoires de charges utiles natives comme les `components` Discord, les `blocks` Slack, les `buttons` Telegram ou Mattermost, et les `card` Teams ou Feishu.
- `ReplyPayload.channelData` transporte à la fois des indications de transport et des enveloppes d’interface native.
- Le modèle générique `interactive` existe, mais il est plus étroit que les mises en page plus riches déjà utilisées par Discord, Slack, Teams, Feishu, LINE, Telegram et Mattermost.

Cela rend le cœur conscient des formes d’interface natives, affaiblit la paresse d’exécution des plugins et donne aux agents trop de manières spécifiques au fournisseur d’exprimer la même intention de message.

## Objectifs

- Le cœur décide de la meilleure présentation sémantique pour un message à partir des capacités déclarées.
- Les extensions déclarent leurs capacités et rendent la présentation sémantique dans des charges utiles de transport natives.
- L’interface Web Control UI reste séparée de l’interface native des chats.
- Les charges utiles natives des canaux ne sont pas exposées via la surface de message partagée de l’agent ou de la CLI.
- Les fonctionnalités de présentation non prises en charge se dégradent automatiquement vers la meilleure représentation textuelle.
- Le comportement de livraison comme l’épinglage d’un message envoyé est une métadonnée de livraison générique, pas de la présentation.

## Non-objectifs

- Aucun shim de rétrocompatibilité pour `buildCrossContextComponents`.
- Aucune échappatoire publique native pour `components`, `blocks`, `buttons` ou `card`.
- Aucune importation par le cœur de bibliothèques d’interface natives aux canaux.
- Aucun point d’extension SDK spécifique au fournisseur pour les canaux inclus.

## Modèle cible

Ajouter un champ `presentation` appartenant au cœur à `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive` devient un sous-ensemble de `presentation` pendant la migration :

- Le bloc texte `interactive` correspond à `presentation.blocks[].type = "text"`.
- Le bloc boutons `interactive` correspond à `presentation.blocks[].type = "buttons"`.
- Le bloc select `interactive` correspond à `presentation.blocks[].type = "select"`.

Les schémas externes de l’agent et de la CLI utilisent désormais `presentation` ; `interactive` reste un assistant hérité interne d’analyse/rendu pour les producteurs de réponses existants.

## Métadonnées de livraison

Ajouter un champ `delivery` appartenant au cœur pour le comportement d’envoi qui n’est pas de l’interface.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Sémantique :

- `delivery.pin = true` signifie épingler le premier message livré avec succès.
- `notify` vaut `false` par défaut.
- `required` vaut `false` par défaut ; les canaux non pris en charge ou les échecs d’épinglage se dégradent automatiquement en poursuivant la livraison.
- Les actions de message manuelles `pin`, `unpin` et `list-pins` restent disponibles pour les messages existants.

La liaison actuelle ACP des sujets Telegram devrait passer de `channelData.telegram.pin = true` à `delivery.pin = true`.

## Contrat de capacité runtime

Ajouter des hooks de rendu de présentation et de livraison au niveau de l’adaptateur sortant runtime, pas du plugin de canal du plan de contrôle.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Comportement du cœur :

- Résoudre le canal cible et l’adaptateur runtime.
- Demander les capacités de présentation.
- Dégrader les blocs non pris en charge avant le rendu.
- Appeler `renderPresentation`.
- S’il n’existe aucun moteur de rendu, convertir la présentation en repli texte.
- Après un envoi réussi, appeler `pinDeliveredMessage` lorsque `delivery.pin` est demandé et pris en charge.

## Mappage des canaux

Discord :

- Rendre `presentation` en components v2 et conteneurs Carbon dans des modules runtime uniquement.
- Conserver les assistants de couleur d’accent dans des modules légers.
- Supprimer les imports `DiscordUiContainer` du code du plan de contrôle du plugin de canal.

Slack :

- Rendre `presentation` en Block Kit.
- Supprimer l’entrée `blocks` de l’agent et de la CLI.

Telegram :

- Rendre text, context et dividers sous forme de texte.
- Rendre actions et select comme claviers inline lorsqu’ils sont configurés et autorisés pour la surface cible.
- Utiliser le repli texte lorsque les boutons inline sont désactivés.
- Déplacer l’épinglage des sujets ACP vers `delivery.pin`.

Mattermost :

- Rendre actions comme boutons interactifs lorsqu’ils sont configurés.
- Rendre les autres blocs en repli texte.

Microsoft Teams :

- Rendre `presentation` en Adaptive Cards.
- Conserver les actions manuelles pin/unpin/list-pins.
- Éventuellement implémenter `pinDeliveredMessage` si la prise en charge Graph est fiable pour la conversation cible.

Feishu :

- Rendre `presentation` en cartes interactives.
- Conserver les actions manuelles pin/unpin/list-pins.
- Éventuellement implémenter `pinDeliveredMessage` pour l’épinglage de messages envoyés si le comportement de l’API est fiable.

LINE :

- Rendre `presentation` en messages Flex ou template lorsque c’est possible.
- Revenir au texte pour les blocs non pris en charge.
- Supprimer les charges utiles d’interface LINE de `channelData`.

Canaux simples ou limités :

- Convertir la présentation en texte avec un formatage conservateur.

## Étapes de refactorisation

1. Réappliquer le correctif de publication Discord qui sépare `ui-colors.ts` de l’interface adossée à Carbon et supprime `DiscordUiContainer` de `extensions/discord/src/channel.ts`.
2. Ajouter `presentation` et `delivery` à `ReplyPayload`, à la normalisation des charges utiles sortantes, aux résumés de livraison et aux charges utiles des hooks.
3. Ajouter le schéma `MessagePresentation` et les assistants d’analyse dans un sous-chemin SDK/runtime étroit.
4. Remplacer les capacités de message `buttons`, `cards`, `components` et `blocks` par des capacités de présentation sémantiques.
5. Ajouter des hooks d’adaptateur sortant runtime pour le rendu de présentation et l’épinglage de livraison.
6. Remplacer la construction des components inter-contexte par `buildCrossContextPresentation`.
7. Supprimer `src/infra/outbound/channel-adapters.ts` et retirer `buildCrossContextComponents` des types de plugins de canal.
8. Modifier `maybeApplyCrossContextMarker` pour qu’il attache `presentation` au lieu de paramètres natifs.
9. Mettre à jour les chemins d’envoi plugin-dispatch pour qu’ils ne consomment que la présentation sémantique et les métadonnées de livraison.
10. Supprimer les paramètres de charge utile native de l’agent et de la CLI : `components`, `blocks`, `buttons` et `card`.
11. Supprimer les assistants SDK qui créent des schémas d’outil de message natifs, en les remplaçant par des assistants de schéma de présentation.
12. Supprimer les enveloppes d’interface/native de `channelData` ; ne conserver que les métadonnées de transport jusqu’à ce que chaque champ restant soit examiné.
13. Migrer les moteurs de rendu Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu et LINE.
14. Mettre à jour la documentation pour la CLI de message, les pages de canaux, le SDK de Plugin et le guide pratique des capacités.
15. Exécuter un profilage de propagation des imports pour Discord et les points d’entrée de canaux concernés.

Les étapes 1 à 11 et 13 à 14 sont implémentées dans cette refactorisation pour les contrats de l’agent partagé, de la CLI, des capacités de plugin et des adaptateurs sortants. L’étape 12 reste une passe de nettoyage interne plus profonde pour les enveloppes de transport `channelData` privées au fournisseur. L’étape 15 reste une validation ultérieure si nous voulons des chiffres quantifiés de propagation des imports au-delà de la barrière type/test.

## Tests

Ajouter ou mettre à jour :

- Tests de normalisation de présentation.
- Tests de dégradation automatique de la présentation pour les blocs non pris en charge.
- Tests des marqueurs inter-contexte pour les chemins plugin dispatch et livraison cœur.
- Tests de matrice de rendu des canaux pour Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE et le repli texte.
- Tests de schéma d’outil de message prouvant que les champs natifs ont disparu.
- Tests CLI prouvant que les indicateurs natifs ont disparu.
- Régression de paresse d’import du point d’entrée Discord couvrant Carbon.
- Tests d’épinglage de livraison couvrant Telegram et le repli générique.

## Questions ouvertes

- `delivery.pin` doit-il être implémenté pour Discord, Slack, Microsoft Teams et Feishu dès la première passe, ou seulement pour Telegram au début ?
- `delivery` doit-il à terme absorber des champs existants comme `replyToId`, `replyToCurrent`, `silent` et `audioAsVoice`, ou rester centré sur les comportements post-envoi ?
- La présentation doit-elle prendre directement en charge des images ou des références de fichiers, ou les médias doivent-ils pour l’instant rester séparés de la mise en page de l’interface ?

## Lié

- [Aperçu des canaux](/fr/channels)
- [Message Presentation](/fr/plugins/message-presentation)
