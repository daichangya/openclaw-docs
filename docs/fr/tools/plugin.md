---
read_when:
    - Installation ou configuration de plugins
    - Compréhension de la découverte des plugins et des règles de chargement
    - Utilisation de bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-05T12:57:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
outils, Skills, parole, transcription en temps réel, voix en temps réel,
compréhension des médias, génération d'images, génération de vidéos, récupération web, recherche web,
et plus encore. Certains plugins sont **core** (fournis avec OpenClaw), d'autres
sont **externes** (publiés sur npm par la communauté).

## Démarrage rapide

<Steps>
  <Step title="Voir ce qui est chargé">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installer un plugin">
    ```bash
    # Depuis npm
    openclaw plugins install @openclaw/voice-call

    # Depuis un répertoire local ou une archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Redémarrer la Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configurez ensuite sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif dans le chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d'installation utilise le même résolveur que la CLI : chemin/archive local, préfixe explicite
`clawhub:<pkg>`, ou spécification de package simple (ClawHub d'abord, puis repli sur npm).

Si la configuration est invalide, l'installation échoue normalement de manière fermée et vous renvoie vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin groupé pour les plugins qui activent
`openclaw.install.allowInvalidConfigRecovery`.

## Types de plugins

OpenClaw reconnaît deux formats de plugin :

| Format     | Fonctionnement                                                  | Exemples                                              |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| **Natif** | `openclaw.plugin.json` + module d'exécution ; s'exécute en processus | Plugins officiels, packages npm de la communauté      |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée vers les fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent dans `openclaw plugins list`. Voir [Plugin Bundles](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Building Plugins](/fr/plugins/building-plugins)
et la [vue d'ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Plugins officiels

### Installables (npm)

| Plugin          | Package                | Documentation                        |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/fr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/fr/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/fr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/fr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/fr/plugins/zalouser)   |

### Core (fournis avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de mémoire">
    - `memory-core` — recherche mémoire groupée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs vocaux (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin browser groupé pour l'outil browser, la CLI `openclaw browser`, la méthode gateway `browser.request`, le runtime browser et le service de contrôle du navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont VS Code Copilot Proxy (désactivé par défaut)
  </Accordion>
</AccordionGroup>

Vous cherchez des plugins tiers ? Voir [Community Plugins](/fr/plugins/community).

## Configuration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Field            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | Commutateur principal (par défaut : `true`)                |
| `allow`          | Liste d'autorisation des plugins (facultatif)              |
| `deny`           | Liste de refus des plugins (facultatif ; deny est prioritaire) |
| `load.paths`     | Fichiers/répertoires de plugin supplémentaires             |
| `slots`          | Sélecteurs de slots exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Commutateurs + configuration par plugin                    |

Les modifications de configuration **nécessitent un redémarrage de la gateway**. Si la Gateway s'exécute avec la surveillance de configuration
et le redémarrage en processus activés (le chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l'écriture de la configuration.

<Accordion title="États de plugin : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d'activation l'ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un id de plugin que la découverte n'a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw analyse les plugins dans cet ordre (la première correspondance l'emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichiers ou de répertoires.
  </Step>

  <Step title="Extensions du workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensions globales">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins groupés">
    Fournis avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D'autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d'activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` est toujours prioritaire sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins provenant du workspace sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les plugins groupés suivent l'ensemble intégré activé par défaut, sauf remplacement
- Les slots exclusifs peuvent forcer l'activation du plugin sélectionné pour ce slot

## Slots de plugin (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" pour désactiver
      contextEngine: "legacy", // ou un id de plugin
    },
  },
}
```

| Slot            | Ce qu'il contrôle          | Valeur par défaut     |
| --------------- | -------------------------- | --------------------- |
| `memory`        | Plugin mémoire actif       | `memory-core`         |
| `contextEngine` | Moteur de contexte actif   | `legacy` (intégré)    |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # uniquement les plugins chargés
openclaw plugins list --verbose            # lignes de détail par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau à l'échelle de l'ensemble
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # installer (ClawHub d'abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser une installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm exacte résolue
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # mettre à jour un plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements de config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins groupés sont fournis avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles groupés, les fournisseurs vocaux groupés et le plugin browser
groupé). D'autres plugins groupés nécessitent encore `openclaw plugins enable <id>`.

`--force` écrase en place un plugin installé existant ou un pack de hooks.
Il n'est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu de
copier vers une cible d'installation gérée.

`--pin` est propre à npm. Il n'est pas pris en charge avec `--marketplace`, car
les installations marketplace conservent des métadonnées de source marketplace au lieu d'une spécification npm.

`--dangerously-force-unsafe-install` est un remplacement de secours pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et mises à jour de plugins
de continuer au-delà des résultats intégrés `critical`, mais il
ne contourne toujours pas les blocages de politique `before_install` des plugins ni les blocages dus à l'échec de l'analyse.

Cet indicateur CLI s'applique uniquement aux flux d'installation/mise à jour de plugins. Les
installations de dépendances de Skills prises en charge par la Gateway utilisent à la place le remplacement de requête
correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de téléchargement/installation
des Skills ClawHub.

Les bundles compatibles participent au même flux list/inspect/enable/disable des plugins.
La prise en charge d'exécution actuelle inclut les Skills de bundle, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et
`lspServers` déclarées dans le manifeste, les command-skills Cursor, et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées ainsi que
les entrées de serveurs MCP et LSP prises en charge ou non prises en charge pour les plugins basés sur des bundles.

Les sources de marketplace peuvent être un nom de marketplace Claude connu provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub,
ou une URL git. Pour les marketplaces distantes, les entrées de plugin doivent rester à l'intérieur du
dépôt marketplace cloné et n'utiliser que des sources de chemin relatives.

Voir la [référence CLI `openclaw plugins`](/cli/plugins) pour tous les détails.

## Vue d'ensemble de l'API des plugins

Les plugins natifs exportent un objet d'entrée qui expose `register(api)`. Les anciens
plugins peuvent encore utiliser `activate(api)` comme alias hérité, mais les nouveaux plugins doivent
utiliser `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw charge l'objet d'entrée et appelle `register(api)` pendant l'activation du plugin.
Le chargeur continue de se rabattre sur `activate(api)` pour les anciens plugins,
mais les plugins groupés et les nouveaux plugins externes doivent considérer `register` comme le
contrat public.

Méthodes d'enregistrement courantes :

| Method                                  | Ce qu'elle enregistre         |
| --------------------------------------- | ----------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM)  |
| `registerChannel`                       | Canal de chat                 |
| `registerTool`                          | Outil d'agent                 |
| `registerHook` / `on(...)`              | Hooks de cycle de vie         |
| `registerSpeechProvider`                | Synthèse vocale / STT         |
| `registerRealtimeTranscriptionProvider` | STT en streaming              |
| `registerRealtimeVoiceProvider`         | Voix temps réel bidirectionnelle |
| `registerMediaUnderstandingProvider`    | Analyse d'image/audio         |
| `registerImageGenerationProvider`       | Génération d'images           |
| `registerVideoGenerationProvider`       | Génération de vidéos          |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web                 |
| `registerHttpRoute`                     | Endpoint HTTP                 |
| `registerCommand` / `registerCli`       | Commandes CLI                 |
| `registerContextEngine`                 | Moteur de contexte            |
| `registerService`                       | Service d'arrière-plan        |

Comportement des garde-fous de hook pour les hooks de cycle de vie typés :

- `before_tool_call`: `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call`: `{ block: false }` n'a aucun effet et n'efface pas un blocage antérieur.
- `before_install`: `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install`: `{ block: false }` n'a aucun effet et n'efface pas un blocage antérieur.
- `message_sending`: `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending`: `{ cancel: false }` n'a aucun effet et n'efface pas une annulation antérieure.

Pour le comportement complet des hooks typés, voir [Vue d'ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Lié

- [Building Plugins](/fr/plugins/building-plugins) — créez votre propre plugin
- [Plugin Bundles](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Plugin Manifest](/fr/plugins/manifest) — schéma du manifeste
- [Registering Tools](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d'agent dans un plugin
- [Plugin Internals](/fr/plugins/architecture) — modèle de capacité et pipeline de chargement
- [Community Plugins](/fr/plugins/community) — listes tierces
