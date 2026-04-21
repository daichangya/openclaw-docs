---
read_when:
    - Installation ou configuration de Plugins
    - Comprendre la découverte des Plugins et les règles de chargement
    - Travailler avec des bundles de Plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les Plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-21T07:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Les Plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
outils, Skills, parole, transcription realtime, voix realtime,
compréhension des médias, génération d’images, génération de vidéos, récupération web,
recherche web, et plus encore. Certains Plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes** (publiés sur npm par la communauté).

## Démarrage rapide

<Steps>
  <Step title="Voir ce qui est chargé">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installer un Plugin">
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

Si vous préférez un contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin / archive local, 
`clawhub:<pkg>` explicite, ou spécification de paquet nue (ClawHub d’abord, puis repli npm).

Si la configuration est invalide, l’installation échoue normalement de façon sûre et vous dirige vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de réinstallation de Plugin fourni
pour les Plugins qui activent
`openclaw.install.allowInvalidConfigRecovery`.

Les installations packagées d’OpenClaw n’installent pas à l’avance tout l’arbre de dépendances
runtime de chaque Plugin fourni. Lorsqu’un Plugin fourni détenu par OpenClaw est actif via
la configuration Plugin, une configuration de canal héritée ou un manifeste activé par défaut,
les réparations au démarrage n’installent que les dépendances runtime déclarées de ce Plugin avant de l’importer.
Les Plugins externes et chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de Plugins

OpenClaw reconnaît deux formats de Plugin :

| Format     | Fonctionnement                                                  | Exemples                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module runtime ; s’exécute dans le processus | Plugins officiels, paquets npm de la communauté   |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée vers les fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent dans `openclaw plugins list`. Voir [Bundles de Plugin](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un Plugin natif, commencez par [Créer des Plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Plugins officiels

### Installables (npm)

| Plugin          | Paquet                | Documentation                       |
| --------------- | --------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/fr/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/fr/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/fr/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call) |
| Zalo            | `@openclaw/zalo`      | [Zalo](/fr/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/fr/plugins/zalouser)  |

### Core (livrés avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins mémoire">
    - `memory-core` — recherche mémoire fournie (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire long terme installée à la demande avec rappel / capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — Plugin navigateur fourni pour l’outil navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, le runtime navigateur et le service de contrôle navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (désactivé par défaut)
  </Accordion>
</AccordionGroup>

Vous cherchez des Plugins tiers ? Voir [Plugins communautaires](/fr/plugins/community).

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
| `enabled`        | Bascule maître (par défaut : `true`)                      |
| `allow`          | Liste d’autorisation des Plugins (optionnel)              |
| `deny`           | Liste de refus des Plugins (optionnel ; deny l’emporte)   |
| `load.paths`     | Fichiers / répertoires de Plugin supplémentaires          |
| `slots`          | Sélecteurs de slot exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascules + configuration par Plugin                       |

Les changements de configuration **exigent un redémarrage du Gateway**. Si le Gateway fonctionne avec
surveillance de configuration + redémarrage dans le processus activés (chemin `openclaw gateway` par défaut), ce
redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.

<Accordion title="États de Plugin : désactivé vs manquant vs invalide">
  - **Désactivé** : le Plugin existe mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un identifiant de Plugin que la découverte n’a pas trouvé.
  - **Invalide** : le Plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw recherche les Plugins dans cet ordre (première correspondance gagnante) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichier ou répertoire.
  </Step>

  <Step title="Extensions de l’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensions globales">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins fournis">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D’autres exigent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les Plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les Plugins issus de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les Plugins fournis suivent l’ensemble intégré activé par défaut sauf remplacement
- Les slots exclusifs peuvent forcer l’activation du Plugin sélectionné pour ce slot

## Slots de Plugin (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" pour désactiver
      contextEngine: "legacy", // ou un identifiant de Plugin
    },
  },
}
```

| Slot            | Ce qu’il contrôle      | Valeur par défaut    |
| --------------- | ---------------------- | -------------------- |
| `memory`        | Plugin mémoire actif   | `memory-core`        |
| `contextEngine` | Moteur de contexte actif | `legacy` (intégré) |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # seulement les Plugins chargés
openclaw plugins list --verbose            # lignes de détail par Plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # table sur toute la flotte
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
openclaw plugins update <id>             # mettre à jour un Plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements de config / installation
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les Plugins fournis sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles fournis, les fournisseurs de parole fournis et le Plugin navigateur
fourni). D’autres Plugins fournis exigent quand même `openclaw plugins enable <id>`.

`--force` écrase sur place un Plugin ou un hook pack déjà installé.
Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu de
copier vers une cible d’installation gérée.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations marketplace conservent des métadonnées de source marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un remplacement de dernier recours pour les faux
positifs du scanner intégré de code dangereux. Il permet aux installations
et mises à jour de Plugins de continuer malgré des résultats intégrés `critical`, mais il
ne contourne toujours pas les blocages de politique Plugin `before_install` ni les blocages en cas d’échec d’analyse.

Cette option CLI ne s’applique qu’aux flux d’installation / mise à jour de Plugins. Les installations de dépendances de Skills
adossées au Gateway utilisent à la place le remplacement de requête correspondant `dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de téléchargement / installation de skill ClawHub.

Les bundles compatibles participent au même flux list/inspect/enable/disable
des Plugins. La prise en charge runtime actuelle inclut les Skills de bundle, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et `lspServers` déclarés par manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées ainsi que
les entrées de serveur MCP et LSP prises en charge ou non pour les Plugins adossés à des bundles.

Les sources marketplace peuvent être un nom de marketplace connu Claude issu de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub
ou une URL git. Pour les marketplaces distants, les entrées de Plugin doivent rester dans le
dépôt de marketplace cloné et n’utiliser que des sources de chemin relatif.

Voir la [référence CLI `openclaw plugins`](/cli/plugins) pour tous les détails.

## Vue d’ensemble de l’API Plugin

Les Plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens
Plugins peuvent encore utiliser `activate(api)` comme alias hérité, mais les nouveaux Plugins doivent
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

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation du Plugin.
Le chargeur revient encore à `activate(api)` pour les anciens Plugins,
mais les Plugins fournis et les nouveaux Plugins externes doivent considérer `register` comme le contrat public.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre        |
| --------------------------------------- | ---------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM) |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Outil d’agent                |
| `registerHook` / `on(...)`              | Hooks de cycle de vie        |
| `registerSpeechProvider`                | Synthèse vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT en streaming             |
| `registerRealtimeVoiceProvider`         | Voix realtime duplex         |
| `registerMediaUnderstandingProvider`    | Analyse d’image / audio      |
| `registerImageGenerationProvider`       | Génération d’images          |
| `registerMusicGenerationProvider`       | Génération musicale          |
| `registerVideoGenerationProvider`       | Génération de vidéos         |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web                |
| `registerHttpRoute`                     | Point de terminaison HTTP    |
| `registerCommand` / `registerCli`       | Commandes CLI                |
| `registerContextEngine`                 | Moteur de contexte           |
| `registerService`                       | Service en arrière-plan      |

Comportement des gardes de hook pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité plus basse sont ignorés.
- `before_tool_call` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité plus basse sont ignorés.
- `before_install` : `{ block: false }` est sans effet et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité plus basse sont ignorés.
- `message_sending` : `{ cancel: false }` est sans effet et n’efface pas une annulation antérieure.

Pour le comportement complet des hooks typés, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Voir aussi

- [Créer des Plugins](/fr/plugins/building-plugins) — créer votre propre Plugin
- [Bundles de Plugin](/fr/plugins/bundles) — compatibilité avec les bundles Codex/Claude/Cursor
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un Plugin
- [Internes des Plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
