---
read_when:
    - Installation ou configuration de plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Travailler avec des bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T14:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63aa1b5ed9e3aaa2117b78137a457582b00ea47d94af7da3780ddae38e8e3665
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
outils, Skills, voix, transcription en temps réel, voix en temps réel,
compréhension des médias, génération d’images, génération de vidéos, récupération web, recherche web,
et plus encore. Certains plugins sont **noyau** (livrés avec OpenClaw), d’autres
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

  <Step title="Redémarrer le Gateway">
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

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local(e),  
`clawhub:<pkg>` explicite, ou spécification de package simple (ClawHub d’abord, puis repli vers npm).

Si la configuration est invalide, l’installation échoue normalement de manière fermée et vous dirige vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin intégré pour les plugins qui activent
`openclaw.install.allowInvalidConfigRecovery`.

Les installations OpenClaw empaquetées n’installent pas immédiatement tout l’arbre de
dépendances d’exécution de chaque plugin intégré. Lorsqu’un plugin intégré géré par OpenClaw est actif via
la configuration du plugin, une configuration de canal héritée, ou un manifeste activé par défaut, le démarrage
répare uniquement les dépendances d’exécution déclarées de ce plugin avant de l’importer.
Les plugins externes et chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de plugins :

| Format     | Fonctionnement                                                       | Exemples                                               |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| **Natif** | `openclaw.plugin.json` + module d’exécution ; s’exécute dans le processus | Plugins officiels, packages npm communautaires         |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Voir [Bundles de plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK de plugins](/fr/plugins/sdk-overview).

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

### Noyau (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de mémoire">
    - `memory-core` — recherche en mémoire intégrée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs de voix (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin navigateur intégré pour l’outil navigateur, la CLI `openclaw browser`, la méthode gateway `browser.request`, le runtime navigateur et le service de contrôle navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont proxy VS Code Copilot (désactivé par défaut)
  </Accordion>
</AccordionGroup>

Vous cherchez des plugins tiers ? Voir [Plugins communautaires](/fr/plugins/community).

## Configuration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Champ            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interrupteur principal (par défaut : `true`)              |
| `allow`          | Liste d’autorisation des plugins (facultative)            |
| `deny`           | Liste de refus des plugins (facultative ; le refus l’emporte) |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires           |
| `slots`          | Sélecteurs de slot exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Basculements + configuration par plugin                   |

Les modifications de configuration **nécessitent un redémarrage du gateway**. Si le Gateway s’exécute avec la surveillance de configuration
et le redémarrage en cours de processus activés (chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe, mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un identifiant de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe, mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw analyse les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichier ou de répertoire.
  </Step>

  <Step title="Plugins d’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins intégrés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, voix).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l’emporte toujours sur `allow`
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins d’origine espace de travail sont **désactivés par défaut** (ils doivent être activés explicitement)
- Les plugins intégrés suivent l’ensemble intégré activé par défaut sauf remplacement
- Les slots exclusifs peuvent forcer l’activation du plugin sélectionné pour ce slot

## Slots de plugins (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" pour désactiver
      contextEngine: "legacy", // ou un identifiant de plugin
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
openclaw plugins list --enabled            # seulement les plugins chargés
openclaw plugins list --verbose            # lignes de détail par plugin
openclaw plugins list --json               # inventaire lisible par une machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par une machine
openclaw plugins inspect --all             # tableau à l’échelle de la flotte
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
openclaw plugins update <id-or-npm-spec> # mettre à jour un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements de config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins intégrés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles intégrés, les fournisseurs de voix intégrés et le plugin navigateur
intégré). D’autres plugins intégrés nécessitent encore `openclaw plugins enable <id>`.

`--force` écrase sur place un plugin installé existant ou un pack de hooks. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Ce n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’identifiant du
plugin installé à cette liste d’autorisation avant de l’activer, afin que les installations puissent être chargées
immédiatement après redémarrage.

`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement du plugin suivi et enregistre la nouvelle spécification pour les mises à jour futures.
Passer le nom du package sans version ramène une installation exacte épinglée vers
la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans téléchargement, réinstallation ni réécriture de la configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations via marketplace conservent les métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un remplacement de secours pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations de plugins
et aux mises à jour de plugins de continuer malgré des résultats intégrés `critical`, mais il
ne contourne toujours pas les blocages de politique `before_install` du plugin ni le blocage en cas d’échec du scan.

Ce drapeau CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations
de dépendances de Skills adossées au gateway utilisent à la place le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux distinct de téléchargement/installation de Skills ClawHub.

Les bundles compatibles participent au même flux `plugins list`/`inspect`/`enable`/`disable`.
La prise en charge actuelle à l’exécution inclut les bundles de Skills, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et
`lspServers` déclarés dans le manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées ainsi que les entrées de serveur MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à un bundle.

Les sources de marketplace peuvent être un nom de marketplace connu de Claude à partir de
`~/.claude/plugins/known_marketplaces.json`, une racine locale de marketplace ou un chemin
`marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub,
ou une URL git. Pour les marketplaces distants, les entrées de plugins doivent rester à l’intérieur du
dépôt marketplace cloné et utiliser uniquement des sources de chemin relatives.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Vue d’ensemble de l’API des plugins

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens
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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation du plugin. Le chargeur continue d’utiliser `activate(api)` comme repli pour les anciens plugins,
mais les plugins intégrés et les nouveaux plugins externes doivent considérer `register` comme le contrat public.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre      |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Fournisseur de modèle (LLM) |
| `registerChannel`                       | Canal de chat              |
| `registerTool`                          | Outil d’agent              |
| `registerHook` / `on(...)`              | Hooks de cycle de vie      |
| `registerSpeechProvider`                | Synthèse vocale / STT      |
| `registerRealtimeTranscriptionProvider` | STT en streaming           |
| `registerRealtimeVoiceProvider`         | Voix en temps réel duplex  |
| `registerMediaUnderstandingProvider`    | Analyse d’image/audio      |
| `registerImageGenerationProvider`       | Génération d’images        |
| `registerMusicGenerationProvider`       | Génération musicale        |
| `registerVideoGenerationProvider`       | Génération vidéo           |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web              |
| `registerHttpRoute`                     | Point de terminaison HTTP  |
| `registerCommand` / `registerCli`       | Commandes CLI              |
| `registerContextEngine`                 | Moteur de contexte         |
| `registerService`                       | Service d’arrière-plan     |

Comportement des gardes de hook pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` ne fait rien et n’annule pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` ne fait rien et n’annule pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` ne fait rien et n’annule pas une annulation antérieure.

Pour le comportement complet des hooks typés, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Liens connexes

- [Créer des plugins](/fr/plugins/building-plugins) — créer votre propre plugin
- [Bundles de plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste du plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un plugin
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
