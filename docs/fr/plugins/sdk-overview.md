---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez un export spécifique du SDK
sidebarTitle: SDK overview
summary: Import map, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK Plugin
x-i18n:
    generated_at: "2026-04-24T07:23:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Le SDK Plugin est le contrat typé entre les plugins et le noyau. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  Vous cherchez plutôt un guide pratique ?

- Premier plugin ? Commencez par [Créer des plugins](/fr/plugins/building-plugins).
- Plugin de canal ? Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins).
- Plugin de fournisseur ? Voir [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins).
  </Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de build spécifiques aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface ombrelle plus large et les helpers partagés tels que
`buildChannelConfigSchema`.

<Warning>
  N’importez pas les coutures pratiques marquées fournisseur ou canal (par exemple
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Les plugins intégrés composent des sous-chemins génériques du SDK dans leurs propres barrels
  `api.ts` / `runtime-api.ts` ; les consommateurs du noyau doivent soit utiliser ces barrels locaux au plugin
  soit ajouter un contrat générique de SDK étroit lorsqu’un besoin est réellement
  inter-canaux.

Un petit ensemble de coutures helpers de plugins intégrés (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*`, et similaires) apparaît encore dans
la map d’export générée. Elles existent uniquement pour la maintenance des plugins intégrés et ne sont
pas des chemins d’import recommandés pour de nouveaux plugins tiers.
</Warning>

## Référence des sous-chemins

Le SDK Plugin est exposé comme un ensemble de sous-chemins étroits groupés par domaine (entrée de plugin,
canal, fournisseur, authentification, runtime, capacité, memory et helpers réservés
aux plugins intégrés). Pour le catalogue complet — groupé et lié — voir
[Sous-chemins du SDK Plugin](/fr/plugins/sdk-subpaths).

La liste générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre                 |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inférence textuelle (LLM)             |
| `api.registerAgentHarness(...)`                  | Exécuteur d’agent bas niveau expérimental |
| `api.registerCliBackend(...)`                    | Backend d’inférence CLI local         |
| `api.registerChannel(...)`                       | Canal de messagerie                   |
| `api.registerSpeechProvider(...)`                | Synthèse TTS / STT                    |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex    |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images/audio/vidéo          |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                   |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale                   |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                      |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                         |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                        |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (requis ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)    |

### Infrastructure

| Méthode                                          | Ce qu’elle enregistre                 |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook d’événement                      |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`      | Méthode RPC Gateway                   |
| `api.registerGatewayDiscoveryService(service)`  | Annonceur local de découverte Gateway |
| `api.registerCli(registrar, opts?)`             | Sous-commande CLI                     |
| `api.registerService(service)`                  | Service d’arrière-plan                |
| `api.registerInteractiveHandler(registration)`  | Gestionnaire interactif               |
| `api.registerEmbeddedExtensionFactory(factory)` | Fabrique d’extension Pi embedded-runner |
| `api.registerMemoryPromptSupplement(builder)`   | Section additive d’invite adjacente à memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus additif de search/read memory  |

<Note>
  Les espaces de noms d’administration du noyau réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) restent toujours `operator.admin`, même si un plugin essaie d’assigner un
  périmètre de méthode gateway plus étroit. Préférez des préfixes spécifiques au plugin pour
  les méthodes appartenant au plugin.
</Note>

<Accordion title="Quand utiliser registerEmbeddedExtensionFactory">
  Utilisez `api.registerEmbeddedExtensionFactory(...)` lorsqu’un plugin a besoin du timing natif Pi
  pendant les exécutions intégrées OpenClaw — par exemple des réécritures asynchrones de `tool_result`
  qui doivent se produire avant l’émission du message final de résultat d’outil.

C’est aujourd’hui une couture réservée aux plugins intégrés : seuls les plugins intégrés peuvent en enregistrer une,
et ils doivent déclarer `contracts.embeddedExtensionFactories: ["pi"]` dans
`openclaw.plugin.json`. Gardez les hooks normaux de plugin OpenClaw pour tout ce
qui ne nécessite pas cette couture de plus bas niveau.
</Accordion>

### Enregistrement de découverte Gateway

`api.registerGatewayDiscoveryService(...)` permet à un plugin d’annoncer le
Gateway actif sur un transport de découverte local tel que mDNS/Bonjour. OpenClaw appelle le
service au démarrage du Gateway lorsque la découverte locale est activée, transmet les
ports Gateway actuels et des indications TXT non secrètes, et appelle le gestionnaire
`stop` renvoyé à l’arrêt du Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Les plugins de découverte Gateway ne doivent pas traiter les valeurs TXT annoncées comme des secrets ni comme
une authentification. La découverte est une indication de routage ; l’authentification Gateway et l’épinglage TLS restent les détenteurs de la confiance.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de niveau supérieur :

- `commands` : racines de commande explicites possédées par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI racine,
  le routage et l’enregistrement paresseux de la CLI du plugin

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin normal de la CLI racine,
fournissez des `descriptors` qui couvrent chaque racine de commande de niveau supérieur exposée par ce
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin de l’enregistrement paresseux de la CLI racine.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
de placeholders adossés aux descripteurs pour le chargement paresseux à l’analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un backend CLI IA local
tel que `codex-cli`.

- Le `id` du backend devient le préfixe fournisseur dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` sur la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple normaliser d’anciennes formes d’indicateurs).

### Emplacements exclusifs

| Méthode                                     | Ce qu’elle enregistre                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts à l’invite. |
| `api.registerMemoryCapability(capability)` | Capacité memory unifiée                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section d’invite memory                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage memory                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime memory                                                                                                                                   |

### Adaptateurs d’embedding memory

| Méthode                                         | Ce qu’elle enregistre                         |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embedding memory pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive de plugin memory préférée.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer les artefacts memory exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’atteindre la disposition privée d’un
  plugin memory spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin memory héritées mais compatibles.
- `registerMemoryEmbeddingProvider` permet au plugin memory actif d’enregistrer un
  ou plusieurs ID d’adaptateur d’embedding (par exemple `openai`, `gemini` ou un ID
  personnalisé défini par plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces ID d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                       | Ce qu’elle fait              |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé    |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), pas comme un remplacement.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), pas comme un remplacement.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique la remise, les gestionnaires de priorité inférieure et le chemin de remise du modèle par défaut sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme aucune décision (identique à l’omission de `cancel`), pas comme un remplacement.
- `message_received` : utilisez le champ typé `threadId` lorsque vous avez besoin du routage entrant de fil/sujet. Gardez `metadata` pour les extras spécifiques au canal.
- `message_sending` : utilisez les champs de routage typés `replyToId` / `threadId` avant de revenir aux `metadata` spécifiques au canal.
- `gateway_start` : utilisez `ctx.config`, `ctx.workspaceDir` et `ctx.getCron?.()` pour l’état de démarrage appartenant au gateway au lieu de vous appuyer sur des hooks internes `gateway:startup`.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | ID du plugin                                                                               |
| `api.name`               | `string`                  | Nom d’affichage                                                                            |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                             |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                         |
| `api.source`             | `string`                  | Chemin source du plugin                                                                    |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                   |
| `api.config`             | `OpenClawConfig`          | Snapshot actuel de configuration (snapshot runtime actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au plugin depuis `plugins.entries.<id>.config`                    |
| `api.runtime`            | `PluginRuntime`           | [Helpers runtime](/fr/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger limité (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                           |

## Convention de module interne

À l’intérieur de votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports runtime internes uniquement
  index.ts          # Point d’entrée du plugin
  setup-entry.ts    # Entrée légère de configuration uniquement (facultative)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK n’est que le contrat externe.
</Warning>

Les surfaces publiques de plugin intégré chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et autres fichiers d’entrée publics similaires) préfèrent le
snapshot actif de configuration runtime lorsqu’OpenClaw est déjà en cours d’exécution. Si aucun snapshot runtime
n’existe encore, elles reviennent au fichier de configuration résolu sur disque.

Les plugins fournisseurs peuvent exposer un barrel de contrat local au plugin lorsqu’un
helper est intentionnellement spécifique à un fournisseur et n’a pas encore sa place dans un sous-chemin générique du SDK. Exemples intégrés :

- **Anthropic** : couture publique `api.ts` / `contract-api.ts` pour les helpers
  d’en-tête bêta Claude et de stream `service_tier`.
- **`@openclaw/openai-provider`** : `api.ts` exporte des constructeurs de fournisseur,
  des helpers de modèles par défaut et des constructeurs de fournisseurs temps réel.
- **`@openclaw/openrouter-provider`** : `api.ts` exporte le constructeur du fournisseur
  ainsi que des helpers d’onboarding/configuration.

<Warning>
  Le code de production d’extension doit aussi éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper est réellement partagé, promouvez-le vers un sous-chemin neutre du SDK
  comme `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux plugins entre eux.
</Warning>

## Associé

<CardGroup cols={2}>
  <Card title="Points d’entrée" icon="door-open" href="/fr/plugins/sdk-entrypoints">
    Options de `definePluginEntry` et `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpers runtime" icon="gears" href="/fr/plugins/sdk-runtime">
    Référence complète de l’espace de noms `api.runtime`.
  </Card>
  <Card title="Configuration et config" icon="sliders" href="/fr/plugins/sdk-setup">
    Packaging, manifestes et schémas de configuration.
  </Card>
  <Card title="Tests" icon="vial" href="/fr/plugins/sdk-testing">
    Utilitaires de test et règles de lint.
  </Card>
  <Card title="Migration SDK" icon="arrows-turn-right" href="/fr/plugins/sdk-migration">
    Migration depuis les surfaces obsolètes.
  </Card>
  <Card title="Internes des plugins" icon="diagram-project" href="/fr/plugins/architecture">
    Architecture approfondie et modèle de capacité.
  </Card>
</CardGroup>
