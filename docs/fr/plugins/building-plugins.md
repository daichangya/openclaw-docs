---
read_when:
    - Vous voulez créer un nouveau plugin OpenClaw
    - Vous avez besoin d'un guide de démarrage rapide pour le développement de plugins
    - Vous ajoutez un nouveau canal, fournisseur, outil ou autre capacité à OpenClaw
sidebarTitle: Getting Started
summary: Créez votre premier plugin OpenClaw en quelques minutes
title: Créer des plugins
x-i18n:
    generated_at: "2026-04-06T03:09:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9be344cb300ecbcba08e593a95bcc93ab16c14b28a0ff0c29b26b79d8249146c
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Créer des plugins

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs
de modèles, parole, transcription en temps réel, voix en temps réel, compréhension des médias, génération d'images,
génération de vidéos, récupération web, recherche web, outils d'agent, ou toute
combinaison de ces éléments.

Vous n'avez pas besoin d'ajouter votre plugin au dépôt OpenClaw. Publiez-le sur
[ClawHub](/fr/tools/clawhub) ou sur npm, et les utilisateurs l'installeront avec
`openclaw plugins install <package-name>`. OpenClaw essaie d'abord ClawHub puis
revient automatiquement à npm.

## Prérequis

- Node >= 22 et un gestionnaire de paquets (npm ou pnpm)
- Familiarité avec TypeScript (ESM)
- Pour les plugins dans le dépôt : dépôt cloné et `pnpm install` exécuté

## Quel type de plugin ?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Connecter OpenClaw à une plateforme de messagerie (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Ajouter un fournisseur de modèles (LLM, proxy ou endpoint personnalisé)
  </Card>
  <Card title="Plugin d'outil / hook" icon="wrench">
    Enregistrer des outils d'agent, des hooks d'événement ou des services — continuez ci-dessous
  </Card>
</CardGroup>

Si un plugin de canal est facultatif et peut ne pas être installé lorsque
l'onboarding/la configuration s'exécute, utilisez `createOptionalChannelSetupSurface(...)` depuis
`openclaw/plugin-sdk/channel-setup`. Cela produit une paire adaptateur de configuration + assistant
qui annonce l'exigence d'installation et échoue de manière fermée sur les véritables écritures de configuration
tant que le plugin n'est pas installé.

## Démarrage rapide : plugin d'outil

Ce guide crée un plugin minimal qui enregistre un outil d'agent. Les plugins de canal
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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Chaque plugin a besoin d'un manifeste, même sans configuration. Voir
    [Manifest](/fr/plugins/manifest) pour le schéma complet. Les extraits de publication
    canoniques ClawHub se trouvent dans `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Écrire le point d'entrée">

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

    `definePluginEntry` est destiné aux plugins non liés aux canaux. Pour les canaux, utilisez
    `defineChannelPluginEntry` — voir [Channel Plugins](/fr/plugins/sdk-channel-plugins).
    Pour connaître toutes les options du point d'entrée, voir [Entry Points](/fr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Tester et publier">

    **Plugins externes :** validez et publiez avec ClawHub, puis installez :

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw vérifie également ClawHub avant npm pour les spécifications de package nues comme
    `@myorg/openclaw-my-plugin`.

    **Plugins dans le dépôt :** placez-les sous l'arborescence de workspace des plugins intégrés — ils seront découverts automatiquement.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacités des plugins

Un seul plugin peut enregistrer n'importe quel nombre de capacités via l'objet `api` :

| Capacité               | Méthode d'enregistrement                         | Guide détaillé                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inférence de texte (LLM) | `api.registerProvider(...)`                    | [Provider Plugins](/fr/plugins/sdk-provider-plugins)                               |
| Canal / messagerie     | `api.registerChannel(...)`                       | [Channel Plugins](/fr/plugins/sdk-channel-plugins)                                 |
| Parole (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voix en temps réel     | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`  | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération d'images    | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de musique  | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Génération de vidéos   | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Récupération web       | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Recherche web          | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/fr/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Outils d'agent         | `api.registerTool(...)`                          | Ci-dessous                                                                      |
| Commandes personnalisées | `api.registerCommand(...)`                     | [Entry Points](/fr/plugins/sdk-entrypoints)                                        |
| Hooks d'événement      | `api.registerHook(...)`                          | [Entry Points](/fr/plugins/sdk-entrypoints)                                        |
| Routes HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/fr/plugins/architecture#gateway-http-routes)                          |
| Sous-commandes CLI     | `api.registerCli(...)`                           | [Entry Points](/fr/plugins/sdk-entrypoints)                                        |

Pour l'API complète d'enregistrement, voir [SDK Overview](/fr/plugins/sdk-overview#registration-api).

Si votre plugin enregistre des méthodes RPC de passerelle personnalisées, conservez-les sur un
préfixe spécifique au plugin. Les espaces de noms d'administration du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours vers
`operator.admin`, même si un plugin demande une portée plus restreinte.

Sémantique des gardes de hook à garder en tête :

- `before_tool_call` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_tool_call` : `{ block: false }` est traité comme absence de décision.
- `before_tool_call` : `{ requireApproval: true }` met en pause l'exécution de l'agent et invite l'utilisateur à approuver via la surcouche d'approbation exec, les boutons Telegram, les interactions Discord, ou la commande `/approve` sur n'importe quel canal.
- `before_install` : `{ block: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `before_install` : `{ block: false }` est traité comme absence de décision.
- `message_sending` : `{ cancel: true }` est terminal et arrête les gestionnaires de priorité inférieure.
- `message_sending` : `{ cancel: false }` est traité comme absence de décision.

La commande `/approve` gère à la fois les approbations exec et plugin avec un repli borné : lorsqu'un identifiant d'approbation exec n'est pas trouvé, OpenClaw réessaie le même identifiant via les approbations plugin. Le transfert des approbations plugin peut être configuré indépendamment via `approvals.plugin` dans la configuration.

Si une logique d'approbation personnalisée doit détecter ce même cas de repli borné,
préférez `isApprovalNotFoundError` depuis `openclaw/plugin-sdk/error-runtime`
plutôt que de faire correspondre manuellement des chaînes d'expiration d'approbation.

Voir [SDK Overview hook decision semantics](/fr/plugins/sdk-overview#hook-decision-semantics) pour plus de détails.

## Enregistrer des outils d'agent

Les outils sont des fonctions typées que le LLM peut appeler. Ils peuvent être requis (toujours
disponibles) ou facultatifs (activation par l'utilisateur) :

```typescript
register(api) {
  // Outil requis — toujours disponible
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Outil facultatif — l'utilisateur doit l'ajouter à l'allowlist
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

- Les noms d'outils ne doivent pas entrer en conflit avec les outils du cœur (les conflits sont ignorés)
- Utilisez `optional: true` pour les outils avec effets de bord ou exigences binaires supplémentaires
- Les utilisateurs peuvent activer tous les outils d'un plugin en ajoutant l'ID du plugin à `tools.allow`

## Conventions d'import

Importez toujours depuis des chemins ciblés `openclaw/plugin-sdk/<subpath>` :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Mauvais : racine monolithique (dépréciée, sera supprimée)
import { ... } from "openclaw/plugin-sdk";
```

Pour la référence complète des sous-chemins, voir [SDK Overview](/fr/plugins/sdk-overview).

Dans votre plugin, utilisez des fichiers barrel locaux (`api.ts`, `runtime-api.ts`) pour
les imports internes — n'importez jamais votre propre plugin via son chemin SDK.

Pour les plugins de fournisseur, conservez les helpers spécifiques au fournisseur dans ces
barrels à la racine du package sauf si l'interface est réellement générique. Exemples intégrés actuels :

- Anthropic : wrappers de flux Claude et helpers `service_tier` / beta
- OpenAI : constructeurs de fournisseur, helpers de modèle par défaut, fournisseurs temps réel
- OpenRouter : constructeur de fournisseur plus helpers d'onboarding/configuration

Si un helper n'est utile qu'à l'intérieur d'un package de fournisseur intégré, gardez-le sur cette
interface à la racine du package au lieu de le promouvoir dans `openclaw/plugin-sdk/*`.

Certaines interfaces helper générées `openclaw/plugin-sdk/<bundled-id>` existent encore pour
la maintenance et la compatibilité des plugins intégrés, par exemple
`plugin-sdk/feishu-setup` ou `plugin-sdk/zalo-setup`. Traitez-les comme des
surfaces réservées, et non comme le modèle par défaut pour les nouveaux plugins tiers.

## Liste de contrôle avant soumission

<Check>**package.json** a les métadonnées `openclaw` correctes</Check>
<Check>Le manifeste **openclaw.plugin.json** est présent et valide</Check>
<Check>Le point d'entrée utilise `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Tous les imports utilisent des chemins ciblés `plugin-sdk/<subpath>`</Check>
<Check>Les imports internes utilisent des modules locaux, pas des auto-imports SDK</Check>
<Check>Les tests passent (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passe (plugins dans le dépôt)</Check>

## Tests de versions bêta

1. Surveillez les tags de release GitHub sur [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) et abonnez-vous via `Watch` > `Releases`. Les tags bêta ressemblent à `v2026.3.N-beta.1`. Vous pouvez aussi activer les notifications pour le compte X officiel d'OpenClaw [@openclaw](https://x.com/openclaw) pour les annonces de release.
2. Testez votre plugin avec le tag bêta dès son apparition. La fenêtre avant la version stable n'est généralement que de quelques heures.
3. Publiez dans le fil de votre plugin dans le canal Discord `plugin-forum` après les tests avec soit `all good`, soit ce qui a cassé. Si vous n'avez pas encore de fil, créez-en un.
4. Si quelque chose casse, ouvrez ou mettez à jour une issue intitulée `Beta blocker: <plugin-name> - <summary>` et appliquez le label `beta-blocker`. Mettez le lien de l'issue dans votre fil.
5. Ouvrez une PR vers `main` intitulée `fix(<plugin-id>): beta blocker - <summary>` et liez l'issue à la fois dans la PR et dans votre fil Discord. Les contributeurs ne peuvent pas appliquer de labels aux PR, donc le titre est le signal côté PR pour les mainteneurs et l'automatisation. Les bloqueurs avec une PR sont fusionnés ; les bloqueurs sans PR peuvent quand même être livrés. Les mainteneurs surveillent ces fils pendant les tests bêta.
6. Le silence signifie que tout est bon. Si vous manquez la fenêtre, votre correction arrivera probablement dans le cycle suivant.

## Étapes suivantes

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/fr/plugins/sdk-channel-plugins">
    Créer un plugin de canal de messagerie
  </Card>
  <Card title="Plugins de fournisseur" icon="cpu" href="/fr/plugins/sdk-provider-plugins">
    Créer un plugin de fournisseur de modèles
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/fr/plugins/sdk-overview">
    Référence de la carte d'import et de l'API d'enregistrement
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, recherche, sous-agent via api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/fr/plugins/sdk-testing">
    Utilitaires et modèles de test
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/fr/plugins/manifest">
    Référence complète du schéma de manifeste
  </Card>
</CardGroup>

## Connexe

- [Plugin Architecture](/fr/plugins/architecture) — analyse approfondie de l'architecture interne
- [SDK Overview](/fr/plugins/sdk-overview) — référence du Plugin SDK
- [Manifest](/fr/plugins/manifest) — format du manifeste de plugin
- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
