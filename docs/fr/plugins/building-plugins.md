---
read_when:
    - Vous souhaitez créer un nouveau plugin OpenClaw
    - Vous avez besoin d’un démarrage rapide pour le développement de plugins
    - Vous ajoutez un nouveau canal, fournisseur, outil ou une autre capacité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier plugin OpenClaw en quelques minutes
title: Créer des plugins
x-i18n:
    generated_at: "2026-04-05T12:50:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Créer des plugins

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
parole, transcription en temps réel, voix en temps réel, compréhension des médias, génération
d’images, génération de vidéos, récupération web, recherche web, outils d’agent, ou toute
combinaison.

Vous n’avez pas besoin d’ajouter votre plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/tools/clawhub) ou npm et les utilisateurs l’installent avec
`openclaw plugins install <package-name>`. OpenClaw essaie d’abord ClawHub puis
bascule automatiquement vers npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Familiarité avec TypeScript (ESM)
- Pour les plugins dans le dépôt : dépôt cloné et `pnpm install` exécuté

## Quel type de plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèles (LLM, proxy ou point de terminaison personnalisé)
  </Card>
  <Card title="Plugin d’outil / hook" icon="wrench">
    Enregistrer des outils d’agent, des hooks d’événement ou des services — voir ci-dessous
  </Card>
</CardGroup>

Si un plugin de canal est facultatif et peut ne pas être installé lorsque l’intégration guidée/la configuration
s’exécute, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Cela produit une paire adaptateur de configuration + assistant
qui annonce l’exigence d’installation et échoue en mode fermé sur les vraies écritures de configuration
tant que le plugin n’est pas installé.

## Démarrage rapide : plugin d’outil

Cette procédure crée un plugin minimal qui enregistre un outil d’agent. Les plugins de canal
et de fournisseur ont des guides dédiés liés ci-dessus.

<Steps>
  <Step title="Créer le package et le manifeste">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Ajoute un outil personnalisé à OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Chaque plugin a besoin d’un manifeste, même sans configuration. Voir
    [Manifest](/plugins/manifest) pour le schéma complet. Les extraits canoniques de publication ClawHub
    se trouvent dans `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Écrire le point d’entrée">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Ajoute un outil personnalisé à OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Faire une chose",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Reçu : ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` est destiné aux plugins non liés aux canaux. Pour les canaux, utilisez
    `defineChannelPluginEntry` — voir [Plugins de canal](/plugins/sdk-channel-plugins).
    Pour toutes les options de points d’entrée, consultez [Points d’entrée](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie aussi ClawHub avant npm pour les spécifications de package brutes comme
    `@myorg/openclaw-my-plugin`.

    **Plugins dans le dépôt :** placez-les sous l’arborescence du workspace de plugins intégrés — découverte automatique.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités des plugins

Un seul plugin peut enregistrer n’importe quel nombre de capacités via l’objet `api` :

| Capacité              | Méthode d’enregistrement                         | Guide détaillé                                                                  |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inférence texte (LLM) | `api.registerProvider(...)`                      | [Plugins de fournisseur](/plugins/sdk-provider-plugins)                         |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                  | [Backends CLI](/gateway/cli-backends)                                           |
| Canal / messagerie    | `api.registerChannel(...)`                       | [Plugins de canal](/plugins/sdk-channel-plugins)                                |
| Parole (TTS/STT)      | `api.registerSpeechProvider(...)`                | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix temps réel       | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d’images   | `api.registerImageGenerationProvider(...)`       | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de vidéos  | `api.registerVideoGenerationProvider(...)`       | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération web      | `api.registerWebFetchProvider(...)`              | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche web         | `api.registerWebSearchProvider(...)`             | [Plugins de fournisseur](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Outils d’agent        | `api.registerTool(...)`                          | Ci-dessous                                                                      |
| Commandes personnalisées | `api.registerCommand(...)`                    | [Points d’entrée](/plugins/sdk-entrypoints)                                     |
| Hooks d’événement     | `api.registerHook(...)`                          | [Points d’entrée](/plugins/sdk-entrypoints)                                     |
| Routes HTTP           | `api.registerHttpRoute(...)`                     | [Internals](/plugins/architecture#gateway-http-routes)                          |
| Sous-commandes CLI    | `api.registerCli(...)`                           | [Points d’entrée](/plugins/sdk-entrypoints)                                     |

Pour l’API d’enregistrement complète, consultez [Vue d’ensemble du SDK](/plugins/sdk-overview#registration-api).

Si votre plugin enregistre des méthodes RPC Gateway personnalisées, gardez-les sur un
préfixe propre au plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours vers
`operator.admin`, même si un plugin demande une portée plus étroite.

Sémantique des gardes de hooks à garder à l’esprit :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme aucune décision.
- `before_tool_call` : `{ requireApproval: true }` met en pause l’exécution de l’agent et demande une approbation à l’utilisateur via la surcouche d’approbation exec, les boutons Telegram, les interactions Discord ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme aucune décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme aucune décision.

La commande `/approve` gère à la fois les approbations exec et plugin avec un repli borné : lorsqu’un identifiant d’approbation exec est introuvable, OpenClaw réessaie le même identifiant via les approbations plugin. Le transfert des approbations plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une plomberie d’approbation personnalisée doit détecter ce même cas de repli borné,
préférez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
plutôt que de faire correspondre manuellement des chaînes d’expiration d’approbation.

Consultez [Sémantique des décisions de hook dans la vue d’ensemble du SDK](/plugins/sdk-overview#hook-decision-semantics) pour plus de détails.

## Enregistrement d’outils d’agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être requis (toujours
disponibles) ou facultatifs (adhésion explicite de l’utilisateur) :

```typescript
register(api) {
  // Outil requis — toujours disponible
  api.registerTool({
    name: "my_tool",
    description: "Faire une chose",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Outil facultatif — l’utilisateur doit l’ajouter à la liste d’autorisation
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Exécuter un workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Les utilisateurs activent les outils facultatifs dans la configuration :

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Les noms d’outils ne doivent pas entrer en conflit avec les outils du cœur (les conflits sont ignorés)
- Utilisez `optional: true` pour les outils avec effets de bord ou exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d’un plugin en ajoutant l’identifiant du plugin à `tools.allow`

## Conventions d’import

Importez toujours depuis des chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Incorrect : racine monolithique (obsolète, sera supprimée)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, consultez [Vue d’ensemble du SDK](/plugins/sdk-overview).

À l’intérieur de votre plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les imports internes — n’importez jamais votre propre plugin via son chemin SDK.

Pour les plugins de fournisseur, gardez les assistants spécifiques au fournisseur dans ces barrels
à la racine du package, sauf si la jonction est réellement générique. Exemples intégrés actuels :

- Anthropic : wrappers de flux Claude et assistants `service_tier` / bêta
- OpenAI : constructeurs de fournisseurs, assistants de modèle par défaut, fournisseurs temps réel
- OpenRouter : constructeur de fournisseur plus assistants d’intégration guidée/configuration

Si un assistant n’est utile qu’à l’intérieur d’un package de fournisseur intégré, gardez-le sur cette
jonction à la racine du package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certaines jonctions d’assistants générées `openclaw/plugin-sdk/<bundled-id>` existent encore pour la
maintenance et la compatibilité des plugins intégrés, par exemple
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Traitez-les comme des surfaces réservées,
pas comme le modèle par défaut pour les nouveaux plugins tiers.

## Checklist avant soumission

<Check>**package.json** a les bonnes métadonnées `openclaw`</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests passent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passe (plugins dans le dépôt)</Check>

## Tests de publication bêta

1. Surveillez les tags de publication GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications pour le compte X officiel d’OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de publication.
2. Testez votre plugin contre le tag bêta dès qu’il apparaît. La fenêtre avant stable n’est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après le test avec soit `all good`, soit ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Placez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas labelliser les PR, donc le titre est le signal côté PR pour les mainteneurs et l’automatisation. Les bloqueurs avec une PR sont fusionnés ; les bloqueurs sans PR peuvent quand même partir en publication. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie vert. Si vous ratez la fenêtre, votre correctif arrivera probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/plugins/sdk-overview">
    Référence de la table d’import et de l’API d’enregistrement
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste de plugin" icon="file-json" href="/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Lié

- [Architecture des plugins](/plugins/architecture) — analyse approfondie de l’architecture interne
- [Vue d’ensemble du SDK](/plugins/sdk-overview) — référence du SDK de plugins
- [Manifest](/plugins/manifest) — format du manifeste de plugin
- [Plugins de canal](/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Plugins de fournisseur](/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
