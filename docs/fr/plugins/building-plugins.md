---
read_when:
    - Vous souhaitez créer un nouveau Plugin OpenClaw
    - Vous avez besoin d’un guide de démarrage rapide pour le développement de Plugin
    - Vous ajoutez un nouveau canal, provider, outil ou autre capacité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier Plugin OpenClaw en quelques minutes
title: Créer des Plugins
x-i18n:
    generated_at: "2026-04-24T07:22:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Les Plugins étendent OpenClaw avec de nouvelles capacités : canaux, providers de modèles,
voix, transcription en temps réel, voix en temps réel, compréhension des médias, génération d’images,
génération de vidéos, récupération web, recherche web, outils d’agent, ou toute
combinaison de ceux-ci.

Vous n’avez pas besoin d’ajouter votre Plugin au dépôt OpenClaw. Publiez sur
[ClawHub](/fr/tools/clawhub) ou npm et les utilisateurs l’installent avec
`openclaw plugins install <package-name>`. OpenClaw essaie d’abord ClawHub puis
revient automatiquement à npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Familiarité avec TypeScript (ESM)
- Pour les Plugins dans le dépôt : dépôt cloné et `pnpm install` exécuté

## Quel type de Plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connectez OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de provider" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajoutez un provider de modèle (LLM, proxy, ou point de terminaison personnalisé)
  </Card>
  <Card title="Plugin d’outil / de hook" icon="wrench">
    Enregistrez des outils d’agent, des hooks d’événement ou des services — suite ci-dessous
  </Card>
</CardGroup>

Pour un Plugin de canal dont l’installation n’est pas garantie lorsque onboarding/setup
s’exécute, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Cela produit une paire adaptateur de configuration + assistant
qui annonce l’exigence d’installation et échoue en fermeture stricte sur les véritables écritures de configuration
tant que le Plugin n’est pas installé.

## Démarrage rapide : Plugin d’outil

Ce guide crée un Plugin minimal qui enregistre un outil d’agent. Les Plugins de canal
et de provider ont des guides dédiés liés ci-dessus.

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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Chaque Plugin a besoin d’un manifeste, même sans configuration. Voir
    [Manifeste](/fr/plugins/manifest) pour le schéma complet. Les extraits canoniques de publication ClawHub
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
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` est destiné aux Plugins non canal. Pour les canaux, utilisez
    `defineChannelPluginEntry` — voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).
    Pour toutes les options de point d’entrée, voir [Points d’entrée](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie aussi ClawHub avant npm pour les spécifications nues de package comme
    `@myorg/openclaw-my-plugin`.

    **Plugins dans le dépôt :** placez-les sous l’arborescence d’espace de travail des Plugins intégrés — découverte automatique.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités de Plugin

Un seul Plugin peut enregistrer autant de capacités qu’il le souhaite via l’objet `api` :

| Capacité              | Méthode d’enregistrement                        | Guide détaillé                                                                 |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Inférence texte (LLM) | `api.registerProvider(...)`                     | [Plugins de provider](/fr/plugins/sdk-provider-plugins)                           |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                 | [Backends CLI](/fr/gateway/cli-backends)                                          |
| Canal / messagerie    | `api.registerChannel(...)`                      | [Plugins de canal](/fr/plugins/sdk-channel-plugins)                               |
| Voix (TTS/STT)        | `api.registerSpeechProvider(...)`               | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix en temps réel    | `api.registerRealtimeVoiceProvider(...)`        | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d’images   | `api.registerImageGenerationProvider(...)`      | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération musicale   | `api.registerMusicGenerationProvider(...)`      | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de vidéos  | `api.registerVideoGenerationProvider(...)`      | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération web      | `api.registerWebFetchProvider(...)`             | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche web         | `api.registerWebSearchProvider(...)`            | [Plugins de provider](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Extension Pi intégrée | `api.registerEmbeddedExtensionFactory(...)`     | [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api)                |
| Outils d’agent        | `api.registerTool(...)`                         | Ci-dessous                                                                      |
| Commandes personnalisées | `api.registerCommand(...)`                   | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                    |
| Hooks d’événement     | `api.registerHook(...)`                         | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                    |
| Routes HTTP           | `api.registerHttpRoute(...)`                    | [Internals](/fr/plugins/architecture-internals#gateway-http-routes)               |
| Sous-commandes CLI    | `api.registerCli(...)`                          | [Points d’entrée](/fr/plugins/sdk-entrypoints)                                    |

Pour l’API d’enregistrement complète, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#registration-api).

Utilisez `api.registerEmbeddedExtensionFactory(...)` lorsqu’un Plugin a besoin de
hooks Pi-native embedded-runner, comme la réécriture asynchrone de `tool_result` avant l’émission du message final de résultat d’outil. Préférez les hooks de Plugin OpenClaw classiques lorsque le travail n’a pas besoin du timing d’extension Pi.

Si votre Plugin enregistre des méthodes RPC gateway personnalisées, gardez-les sous un
préfixe spécifique au Plugin. Les espaces de noms d’administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours en
`operator.admin`, même si un Plugin demande un scope plus étroit.

Sémantique des garde-fous de hook à garder en tête :

- `before_tool_call` : `{ block: true }` est terminal et arrête les handlers de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme absence de décision.
- `before_tool_call` : `{ requireApproval: true }` met en pause l’exécution de l’agent et demande une approbation utilisateur via l’overlay d’approbation exec, les boutons Telegram, les interactions Discord, ou la commande `/approve` sur n’importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les handlers de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme absence de décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les handlers de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme absence de décision.
- `message_received` : préférez le champ typé `threadId` lorsque vous avez besoin du routage entrant thread/sujet. Gardez `metadata` pour les extras spécifiques au canal.
- `message_sending` : préférez les champs de routage typés `replyToId` / `threadId` aux clés de métadonnées spécifiques au canal.

La commande `/approve` gère à la fois les approbations exec et Plugin avec un repli borné : lorsqu’un identifiant d’approbation exec est introuvable, OpenClaw réessaie le même identifiant via les approbations Plugin. Le transfert des approbations Plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une plomberie d’approbation personnalisée doit détecter ce même cas de repli borné,
préférez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
au lieu d’associer manuellement des chaînes d’expiration d’approbation.

Voir [Vue d’ensemble du SDK : sémantique des décisions de hook](/fr/plugins/sdk-overview#hook-decision-semantics) pour les détails.

## Enregistrer des outils d’agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être requis (toujours
disponibles) ou facultatifs (opt-in utilisateur) :

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
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
- Les utilisateurs peuvent activer tous les outils d’un Plugin en ajoutant l’identifiant du Plugin à `tools.allow`

## Conventions d’import

Importez toujours depuis des chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview).

Dans votre Plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les imports internes — n’importez jamais votre propre Plugin via son chemin SDK.

Pour les Plugins provider, conservez les helpers spécifiques au provider dans ces
barrels à la racine du package, sauf si l’interface est réellement générique. Exemples intégrés actuels :

- Anthropic : wrappers de flux Claude et helpers `service_tier` / beta
- OpenAI : builders provider, helpers de modèle par défaut, providers temps réel
- OpenRouter : builder provider plus helpers onboarding/configuration

Si un helper n’est utile qu’à l’intérieur d’un package provider intégré, gardez-le sur cette interface
à la racine du package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certaines interfaces helper générées `openclaw/plugin-sdk/<bundled-id>` existent encore pour la
maintenance et la compatibilité des Plugins intégrés, par exemple
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Traitez-les comme des surfaces réservées, et non comme le modèle par défaut pour les nouveaux Plugins tiers.

## Checklist avant soumission

<Check>**package.json** contient les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d’entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests passent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passe (Plugins dans le dépôt)</Check>

## Tests de version bêta

1. Surveillez les tags de publication GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez également activer les notifications du compte X officiel OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de publication.
2. Testez votre Plugin contre le tag bêta dès qu’il apparaît. La fenêtre avant la stable ne dure généralement que quelques heures.
3. Publiez dans le fil de votre Plugin dans le canal Discord `plugin-forum` après les tests avec soit `all good`, soit ce qui a cassé. Si vous n’avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Mettez le lien de l’issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l’issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas ajouter de labels aux PR, donc le titre est le signal côté PR pour les mainteneurs et l’automatisation. Les bloqueurs avec une PR sont fusionnés ; les bloqueurs sans PR peuvent quand même partir en publication. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie vert. Si vous manquez la fenêtre, votre correction arrivera probablement au cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un Plugin de canal de messagerie
  </Card>
  <Card title="Plugins de provider" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un Plugin de provider de modèle
  </Card>
  <Card title="Vue d’ensemble du SDK" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la carte d’import et de l’API d’enregistrement
  </Card>
  <Card title="Helpers d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Tests" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Manifeste de Plugin" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Lié

- [Architecture des Plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture interne
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence du SDK Plugin
- [Manifeste](/fr/plugins/manifest) — format du manifeste de Plugin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de Plugins de canal
- [Plugins de provider](/fr/plugins/sdk-provider-plugins) — création de Plugins de provider
