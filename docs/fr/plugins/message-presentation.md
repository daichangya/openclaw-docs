---
read_when:
    - Ajout ou modification du rendu des cartes de message, boutons ou listes de sélection
    - Créer un plugin de canal prenant en charge des messages sortants enrichis
    - Modification de la présentation des messages ou des capacités de livraison de l’outil message
    - Débogage des régressions de rendu propres au fournisseur pour les cartes/blocs/composants
summary: Cartes de message sémantiques, boutons, listes de sélection, texte de repli et indications de livraison pour les plugins de canal
title: Présentation des messages
x-i18n:
    generated_at: "2026-04-24T07:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

La présentation des messages est le contrat partagé d’OpenClaw pour une interface de chat enrichie en sortie.
Elle permet aux agents, commandes CLI, flux d’approbation et plugins de décrire
une seule fois l’intention du message, tandis que chaque plugin de canal rend la meilleure forme native possible.

Utilisez la présentation pour une UI de message portable :

- sections de texte
- petit texte de contexte/pied de page
- séparateurs
- boutons
- menus de sélection
- titre et tonalité de la carte

N’ajoutez pas de nouveaux champs natifs propres au fournisseur tels que `components` Discord, `blocks` Slack, `buttons` Telegram, `card` Teams ou `card` Feishu à l’outil de message partagé. Ce sont des sorties de rendu appartenant au plugin de canal.

## Contrat

Les auteurs de plugins importent le contrat public depuis :

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Forme :

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

Sémantique des boutons :

- `value` est une valeur d’action applicative reroutée via le chemin d’interaction
  existant du canal lorsque le canal prend en charge les contrôles cliquables.
- `url` est un bouton lien. Il peut exister sans `value`.
- `label` est requis et est également utilisé dans le repli texte.
- `style` est indicatif. Les moteurs de rendu doivent mapper les styles non pris en charge vers une valeur
  par défaut sûre, et non faire échouer l’envoi.

Sémantique des sélections :

- `options[].value` est la valeur applicative sélectionnée.
- `placeholder` est indicatif et peut être ignoré par les canaux sans prise en charge native
  des listes de sélection.
- Si un canal ne prend pas en charge les listes de sélection, le texte de repli liste les libellés.

## Exemples côté producteur

Carte simple :

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Bouton lien uniquement :

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu de sélection :

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Envoi CLI :

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Livraison épinglée :

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Livraison épinglée avec JSON explicite :

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contrat de rendu

Les plugins de canal déclarent la prise en charge du rendu sur leur adaptateur sortant :

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Les champs de capacité sont volontairement de simples booléens. Ils décrivent ce que le
moteur de rendu peut rendre interactif, pas toutes les limites de la plateforme native. Les moteurs de rendu restent propriétaires
des limites propres à la plateforme comme le nombre maximal de boutons, de blocs et la
taille des cartes.

## Flux de rendu du cœur

Lorsqu’un `ReplyPayload` ou une action de message inclut `presentation`, le cœur :

1. Normalise la charge utile de présentation.
2. Résout l’adaptateur sortant du canal cible.
3. Lit `presentationCapabilities`.
4. Appelle `renderPresentation` lorsque l’adaptateur peut rendre la charge utile.
5. Revient à un texte prudent lorsque l’adaptateur est absent ou ne peut pas rendre.
6. Envoie la charge utile résultante via le chemin normal de livraison du canal.
7. Applique les métadonnées de livraison telles que `delivery.pin` après le premier
   message envoyé avec succès.

Le cœur gère le comportement de repli afin que les producteurs puissent rester agnostiques vis-à-vis des canaux. Les
plugins de canal restent propriétaires du rendu natif et de la gestion des interactions.

## Règles de dégradation

La présentation doit pouvoir être envoyée en toute sécurité sur les canaux limités.

Le texte de repli inclut :

- `title` comme première ligne
- les blocs `text` comme paragraphes normaux
- les blocs `context` comme lignes de contexte compactes
- les blocs `divider` comme séparateur visuel
- les libellés de bouton, y compris les URL pour les boutons lien
- les libellés des options de sélection

Les contrôles natifs non pris en charge doivent se dégrader plutôt que faire échouer l’ensemble de l’envoi.
Exemples :

- Telegram avec boutons inline désactivés envoie un texte de repli.
- Un canal sans prise en charge des sélections liste les options de sélection sous forme de texte.
- Un bouton lien uniquement devient soit un bouton lien natif, soit une ligne d’URL de repli.
- Les échecs d’épinglage facultatifs ne font pas échouer le message livré.

L’exception principale est `delivery.pin.required: true` ; si l’épinglage est demandé comme
requis et que le canal ne peut pas épingler le message envoyé, la livraison signale un échec.

## Mappage fournisseur

Moteurs de rendu groupés actuels :

| Canal           | Cible de rendu native              | Notes                                                                                                                                              |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components et conteneurs de composants | Préserve l’ancien `channelData.discord.components` pour les producteurs existants de charges utiles natives au fournisseur, mais les nouveaux envois partagés doivent utiliser `presentation`. |
| Slack           | Block Kit                          | Préserve l’ancien `channelData.slack.blocks` pour les producteurs existants de charges utiles natives au fournisseur, mais les nouveaux envois partagés doivent utiliser `presentation`.       |
| Telegram        | Texte plus claviers inline         | Les boutons/sélections nécessitent la capacité de boutons inline pour la surface cible ; sinon un texte de repli est utilisé.                    |
| Mattermost      | Texte plus props interactives      | Les autres blocs se dégradent en texte.                                                                                                            |
| Microsoft Teams | Cartes adaptatives                 | Le texte simple `message` est inclus avec la carte lorsque les deux sont fournis.                                                                  |
| Feishu          | Cartes interactives                | L’en-tête de carte peut utiliser `title` ; le corps évite de dupliquer ce titre.                                                                  |
| Canaux simples  | Repli texte                        | Les canaux sans moteur de rendu obtiennent quand même une sortie lisible.                                                                          |

La compatibilité avec les charges utiles natives au fournisseur est une facilité de transition pour les producteurs
de réponses existants. Ce n’est pas une raison pour ajouter de nouveaux champs natifs partagés.

## Présentation vs InteractiveReply

`InteractiveReply` est l’ancien sous-ensemble interne utilisé par les helpers d’approbation et d’interaction.
Il prend en charge :

- texte
- boutons
- sélections

`MessagePresentation` est le contrat canonique partagé d’envoi. Il ajoute :

- titre
- tonalité
- contexte
- séparateur
- boutons lien uniquement
- métadonnées génériques de livraison via `ReplyPayload.delivery`

Utilisez les helpers de `openclaw/plugin-sdk/interactive-runtime` lorsque vous raccordez du
code plus ancien :

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Le nouveau code doit accepter ou produire directement `MessagePresentation`.

## Épinglage de livraison

L’épinglage relève du comportement de livraison, pas de la présentation. Utilisez `delivery.pin` au lieu de
champs natifs au fournisseur tels que `channelData.telegram.pin`.

Sémantique :

- `pin: true` épingle le premier message livré avec succès.
- `pin.notify` vaut par défaut `false`.
- `pin.required` vaut par défaut `false`.
- Les échecs d’épinglage facultatifs se dégradent et laissent le message envoyé intact.
- Les échecs d’épinglage requis font échouer la livraison.
- Les messages découpés en morceaux épinglent le premier morceau livré, pas le morceau final.

Les actions manuelles de message `pin`, `unpin` et `pins` existent toujours pour les
messages existants lorsque le fournisseur prend en charge ces opérations.

## Checklist pour les auteurs de plugins

- Déclarez `presentation` depuis `describeMessageTool(...)` lorsque le canal peut
  rendre ou dégrader en toute sécurité une présentation sémantique.
- Ajoutez `presentationCapabilities` à l’adaptateur sortant runtime.
- Implémentez `renderPresentation` dans le code runtime, pas dans le code
  de configuration de plugin du plan de contrôle.
- Gardez les bibliothèques UI natives hors des chemins critiques de configuration/catalogue.
- Préservez les limites de la plateforme dans le moteur de rendu et les tests.
- Ajoutez des tests de repli pour les boutons non pris en charge, les sélections, les boutons URL, la duplication titre/texte et les envois mixtes `message` + `presentation`.
- Ajoutez la prise en charge de l’épinglage de livraison via `deliveryCapabilities.pin` et
  `pinDeliveredMessage` uniquement lorsque le fournisseur peut épingler l’identifiant du message envoyé.
- N’exposez pas de nouveaux champs natifs au fournisseur de type carte/bloc/composant/bouton via
  le schéma partagé d’action de message.

## Documentation associée

- [Message CLI](/fr/cli/message)
- [Vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [Architecture des plugins](/fr/plugins/architecture-internals#message-tool-schemas)
- [Plan de refactorisation de présentation des canaux](/fr/plan/ui-channels)
