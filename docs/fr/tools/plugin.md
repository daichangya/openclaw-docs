---
read_when:
    - Installation ou configuration de plugins
    - Compréhension de la découverte des plugins et des règles de chargement
    - Utilisation de bundles de plugins compatibles avec Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-06T03:13:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2472a3023f3c1c6ee05b0cdc228f6b713cc226a08695b327de8a3ad6973c83
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
outils, Skills, voix, transcription en temps réel, voix en temps réel,
compréhension des médias, génération d’images, génération de vidéos, récupération web, recherche web,
et plus encore. Certains plugins sont **core** (livrés avec OpenClaw), d’autres
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
    # From npm
    openclaw plugins install @openclaw/voice-call

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Redémarrer la Gateway">
    ```bash
    openclaw gateway restart
    ```

    Ensuite, configurez dans `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif par chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local, `clawhub:<pkg>`
explicite, ou spécification de package simple (ClawHub d’abord, puis repli sur npm).

Si la configuration est invalide, l’installation échoue normalement de manière sûre et vous oriente vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin groupé pour les plugins qui adoptent
`openclaw.install.allowInvalidConfigRecovery`.

## Types de plugins

OpenClaw reconnaît deux formats de plugin :

| Format     | Fonctionnement                                                    | Exemples                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module d’exécution ; s’exécute en processus | Plugins officiels, packages npm communautaires         |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent dans `openclaw plugins list`. Voir [Plugin Bundles](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Building Plugins](/fr/plugins/building-plugins)
et la [Plugin SDK Overview](/fr/plugins/sdk-overview).

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

### Core (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de mémoire">
    - `memory-core` — recherche de mémoire groupée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs vocaux (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin browser groupé pour l’outil browser, la CLI `openclaw browser`, la méthode gateway `browser.request`, le runtime browser et le service de contrôle du navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
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

| Champ            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Commutateur principal (par défaut : `true`)               |
| `allow`          | Allowlist des plugins (facultatif)                        |
| `deny`           | Liste de refus des plugins (facultatif ; deny l’emporte)  |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires           |
| `slots`          | Sélecteurs de slot exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Basculements + configuration par plugin                   |

Les modifications de configuration **nécessitent un redémarrage de la gateway**. Si la Gateway fonctionne avec la surveillance de configuration
et le redémarrage en processus activés (le chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un identifiant de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichier ou de répertoire.
  </Step>

  <Step title="Extensions de l’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensions globales">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins groupés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, voix).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins provenant de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les plugins groupés suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les slots exclusifs peuvent forcer l’activation du plugin sélectionné pour ce slot

## Slots de plugin (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | Ce qu’il contrôle         | Par défaut          |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Plugin de mémoire actif   | `memory-core`       |
| `contextEngine` | Moteur de contexte actif  | `legacy` (intégré)  |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # plugins chargés uniquement
openclaw plugins list --verbose            # lignes de détail par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détails complets
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau global
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # installer (ClawHub d’abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser une installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le développement
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm exacte résolue
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # mettre à jour un plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements config/installation
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins groupés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles groupés, les fournisseurs vocaux groupés et le plugin browser
groupé). D’autres plugins groupés nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase sur place un plugin ou hook pack installé existant.
Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu de
copier vers une cible d’installation gérée.

`--pin` est uniquement pour npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations marketplace conservent les métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est une dérogation d’urgence pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et mises à jour de plugins de continuer malgré des résultats intégrés `critical`, mais il
ne contourne toujours pas les blocages de politique `before_install` des plugins ni les blocages dus aux échecs d’analyse.

Ce drapeau CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills
adossées à la gateway utilisent à la place la dérogation de requête correspondante `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux distinct de téléchargement/installation de Skills ClawHub.

Les bundles compatibles participent au même flux plugin list/inspect/enable/disable.
La prise en charge actuelle du runtime comprend les bundle skills, les Claude command-skills,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers`
déclarées dans le manifeste, les Cursor command-skills et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées ainsi que les entrées de serveurs MCP et LSP prises en charge ou non prises en charge pour les plugins basés sur des bundles.

Les sources marketplace peuvent être un nom de marketplace Claude connu issu de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou
un chemin `marketplace.json`, une notation GitHub abrégée comme `owner/repo`, une URL de dépôt GitHub, ou une URL git. Pour les marketplaces distantes, les entrées de plugin doivent rester à l’intérieur du
dépôt marketplace cloné et utiliser uniquement des sources de chemin relatives.

Voir la [référence CLI `openclaw plugins`](/cli/plugins) pour tous les détails.

## Aperçu de l’API des plugins

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les plugins plus anciens
peuvent encore utiliser `activate(api)` comme alias hérité, mais les nouveaux plugins doivent
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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation
du plugin. Le chargeur se replie toujours sur `activate(api)` pour les anciens plugins,
mais les plugins groupés et les nouveaux plugins externes doivent traiter `register` comme
le contrat public.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre       |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM) |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Outil d’agent               |
| `registerHook` / `on(...)`              | Hooks de cycle de vie       |
| `registerSpeechProvider`                | Synthèse vocale / STT       |
| `registerRealtimeTranscriptionProvider` | STT en streaming            |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex      |
| `registerMediaUnderstandingProvider`    | Analyse d’image/audio       |
| `registerImageGenerationProvider`       | Génération d’images         |
| `registerMusicGenerationProvider`       | Génération musicale         |
| `registerVideoGenerationProvider`       | Génération de vidéos        |
| `registerWebFetchProvider`              | Fournisseur de récupération / extraction web |
| `registerWebSearchProvider`             | Recherche web               |
| `registerHttpRoute`                     | Point de terminaison HTTP   |
| `registerCommand` / `registerCli`       | Commandes CLI               |
| `registerContextEngine`                 | Moteur de contexte          |
| `registerService`                       | Service d’arrière-plan      |

Comportement des gardes de hook pour les hooks de cycle de vie typés :

- `before_tool_call`: `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call`: `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install`: `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install`: `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending`: `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending`: `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Pour le comportement complet des hooks typés, voir [SDK Overview](/fr/plugins/sdk-overview#hook-decision-semantics).

## Lié

- [Building Plugins](/fr/plugins/building-plugins) — créez votre propre plugin
- [Plugin Bundles](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Plugin Manifest](/fr/plugins/manifest) — schéma du manifeste
- [Registering Tools](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un plugin
- [Plugin Internals](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Community Plugins](/fr/plugins/community) — listes tierces
