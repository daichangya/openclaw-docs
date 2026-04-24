---
read_when:
    - Installation ou configuration de plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Travailler avec des bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T07:38:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a93114ddb312552f4c321b6e318f3e19810cf5059dd0c68fde93da41936566b8
    source_path: tools/plugin.md
    workflow: 15
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
outils, Skills, parole, transcription en temps réel, voix en temps réel,
compréhension des médias, génération d’images, génération vidéo, récupération web, recherche
web, et plus encore. Certains plugins sont **cœur** (livrés avec OpenClaw), d’autres
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

    Puis configurez sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local, préfixe explicite
`clawhub:<pkg>`, ou spécification de package simple (ClawHub d’abord, puis repli npm).

Si la configuration est invalide, l’installation échoue normalement en mode fail-closed et vous oriente vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin inclus pour les plugins qui participent à
`openclaw.install.allowInvalidConfigRecovery`.

Les installations packagées d’OpenClaw n’installent pas de façon anticipée tout l’arbre de dépendances runtime
de chaque plugin inclus. Lorsqu’un plugin OpenClaw inclus est actif depuis
la configuration de plugin, une configuration de canal héritée, ou un manifeste activé par défaut, le
démarrage ne répare que les dépendances runtime déclarées de ce plugin avant de l’importer.
Les plugins externes et chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de plugin :

| Format     | Fonctionnement                                                       | Exemples                                               |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| **Natif** | `openclaw.plugin.json` + module runtime ; s’exécute dans le processus       | Plugins officiels, packages npm communautaires         |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée vers les fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent dans `openclaw plugins list`. Voir [Plugin Bundles](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et [Aperçu du SDK de Plugin](/fr/plugins/sdk-overview).

## Plugins officiels

### Installables (npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/fr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/fr/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/fr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/fr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/fr/plugins/zalouser)   |

### Cœur (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins Memory">
    - `memory-core` — recherche Memory incluse (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — Memory long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin navigateur inclus pour l’outil navigateur, la CLI `openclaw browser`, la méthode gateway `browser.request`, le runtime navigateur, et le service de contrôle navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont VS Code Copilot Proxy (désactivé par défaut)
  </Accordion>
</AccordionGroup>

Vous cherchez des plugins tiers ? Voir [Plugins communautaires](/fr/plugins/community).

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

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interrupteur principal (par défaut : `true`)              |
| `allow`          | Liste d’autorisation des plugins (facultatif)             |
| `deny`           | Liste d’interdiction des plugins (facultatif ; deny l’emporte) |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires            |
| `slots`          | Sélecteurs de slots exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Activations + configuration par plugin                    |

Les changements de configuration **nécessitent un redémarrage du gateway**. Si le Gateway s’exécute avec surveillance de configuration
+ redémarrage dans le processus activés (le chemin par défaut `openclaw gateway`), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un identifiant de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw recherche les plugins dans cet ordre (première correspondance gagnante) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichiers ou répertoires.
  </Step>

  <Step title="Plugins d’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins inclus">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins provenant de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les plugins inclus suivent l’ensemble intégré activé par défaut sauf remplacement
- Les slots exclusifs peuvent forcer l’activation du plugin sélectionné pour ce slot
- Certains plugins inclus opt-in sont activés automatiquement lorsque la configuration nomme une
  surface appartenant au plugin, comme une référence de modèle de fournisseur, une configuration de canal, ou un runtime de harnais
- Les routes Codex de la famille OpenAI conservent des frontières de plugin séparées :
  `openai-codex/*` appartient au plugin OpenAI, tandis que le plugin inclus du
  serveur d’application Codex est sélectionné par `embeddedHarness.runtime: "codex"` ou par les références de modèles héritées `codex/*`

## Slots de plugins (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

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

| Slot            | Ce qu’il contrôle         | Par défaut           |
| --------------- | ------------------------- | -------------------- |
| `memory`        | Plugin Memory actif       | `memory-core`        |
| `contextEngine` | Moteur de contexte actif  | `legacy` (intégré)   |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # seulement les plugins chargés
openclaw plugins list --verbose            # lignes de détail par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau global
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # installer (ClawHub d’abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser l’installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le développement
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm exacte résolue
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # mettre à jour un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements config/install
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins inclus sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles inclus, les fournisseurs de parole inclus, et le plugin navigateur inclus). D’autres plugins inclus nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase en place un plugin installé existant ou un pack de hooks. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau de routine des plugins npm
suivis. Ce n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute
l’identifiant du plugin installé à cette liste d’autorisation avant de l’activer, de sorte que les installations soient
immédiatement chargeables après redémarrage.

`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package vers l’enregistrement du plugin suivi et enregistre la nouvelle spécification pour les mises à jour futures.
Passer le nom du package sans version fait revenir une installation épinglée exacte vers
la branche de version par défaut du registre. Si le plugin npm installé correspond déjà à
la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans téléchargement, réinstallation ni réécriture de configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations via marketplace persistent des métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un remplacement d’urgence pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations et mises à jour de plugins de se poursuivre malgré des résultats `critical` intégrés, mais il ne contourne toujours pas les blocages de politique `before_install` du plugin ni les blocages dus aux échecs de scan.

Cet indicateur CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations de dépendances de Skills adossées au Gateway utilisent à la place le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de téléchargement/installation de skills ClawHub.

Les bundles compatibles participent au même flux list/inspect/enable/disable
des plugins. La prise en charge runtime actuelle inclut les Skills de bundle, les
command-skills Claude, les valeurs par défaut de `settings.json` Claude, les
valeurs par défaut Claude `.lsp.json` et `lspServers` déclarées dans le manifeste, les
command-skills Cursor, et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que
les entrées MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à un bundle.

Les sources marketplace peuvent être un nom de marketplace connu Claude provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub,
ou une URL git. Pour les marketplaces distants, les entrées de plugin doivent rester dans le dépôt marketplace cloné et utiliser uniquement des sources de chemin relatives.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Aperçu de l’API des plugins

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les
anciens plugins peuvent encore utiliser `activate(api)` comme alias hérité, mais les nouveaux plugins doivent
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
du plugin. Le chargeur retombe encore sur `activate(api)` pour les anciens plugins,
mais les plugins inclus et les nouveaux plugins externes doivent considérer `register` comme le
contrat public.

Méthodes d’enregistrement courantes :

| Method                                  | Ce que cela enregistre     |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Fournisseur de modèle (LLM) |
| `registerChannel`                       | Canal de chat              |
| `registerTool`                          | Outil d’agent              |
| `registerHook` / `on(...)`              | Hooks de cycle de vie      |
| `registerSpeechProvider`                | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider` | STT en streaming           |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex     |
| `registerMediaUnderstandingProvider`    | Analyse image/audio        |
| `registerImageGenerationProvider`       | Génération d’images        |
| `registerMusicGenerationProvider`       | Génération musicale        |
| `registerVideoGenerationProvider`       | Génération vidéo           |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web              |
| `registerHttpRoute`                     | Point de terminaison HTTP  |
| `registerCommand` / `registerCli`       | Commandes CLI              |
| `registerContextEngine`                 | Moteur de contexte         |
| `registerService`                       | Service d’arrière-plan     |

Comportement de garde des hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Pour le comportement complet des hooks typés, voir [Aperçu du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Lié

- [Créer des plugins](/fr/plugins/building-plugins) — créer votre propre plugin
- [Plugin Bundles](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un plugin
- [Internals des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
