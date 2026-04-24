---
read_when:
    - Installer ou configurer des plugins
    - Comprendre la découverte des plugins et les règles de chargement
    - Travailler avec des bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:25:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agent, outils, skills, parole, transcription en temps réel, voix en temps réel,
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

    Ensuite, configurez sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local,
`clawhub:<pkg>` explicite, ou spécification de package nue (ClawHub d’abord, puis repli sur npm).

Si la configuration est invalide, l’installation échoue normalement en mode fermé et vous oriente vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin bundlé pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.

Les installations packagées d’OpenClaw n’installent pas de manière anticipée tout l’arbre de dépendances
d’exécution de chaque plugin bundlé. Lorsqu’un plugin bundlé appartenant à OpenClaw est actif via
la configuration des plugins, une ancienne configuration de canal, ou un manifeste activé par défaut,
le démarrage répare uniquement les dépendances d’exécution déclarées de ce plugin avant de l’importer.
Les plugins externes et les chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de plugins

OpenClaw reconnaît deux formats de plugins :

| Format     | Fonctionnement                                                    | Exemples                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module d’exécution ; s’exécute en processus | Plugins officiels, packages npm communautaires         |
| **Bundle** | Structure compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent dans `openclaw plugins list`. Voir [Bundles de plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

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
    - `memory-core` — recherche mémoire bundlée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs de parole (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin de navigateur bundlé pour l’outil navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, le runtime du navigateur et le service de contrôle du navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont proxy VS Code Copilot (désactivé par défaut)
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

| Champ            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interrupteur principal (par défaut : `true`)              |
| `allow`          | Liste d’autorisation des plugins (facultatif)             |
| `deny`           | Liste de refus des plugins (facultatif ; deny l’emporte)  |
| `load.paths`     | Fichiers/répertoires de plugins supplémentaires           |
| `slots`          | Sélecteurs d’emplacements exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Activations/désactivations + configuration par plugin     |

Les changements de configuration **nécessitent un redémarrage du Gateway**. Si le Gateway s’exécute avec
la surveillance de configuration + le redémarrage en processus activés (le chemin par défaut `openclaw gateway`),
ce redémarrage est généralement effectué automatiquement peu après l’écriture de la configuration.
Il n’existe aucun chemin de rechargement à chaud pris en charge pour le code d’exécution des plugins natifs ou les hooks
de cycle de vie ; redémarrez le processus Gateway qui dessert le canal en direct avant
de vous attendre à ce que le code `register(api)` mis à jour, les hooks `api.on(...)`, les outils, les services, ou
les hooks de fournisseur/runtime s’exécutent.

`openclaw plugins list` est un instantané local de la CLI/configuration. Un plugin `loaded`
y signifie que le plugin est détectable et chargeable depuis la configuration/les fichiers vus par cette
invocation de la CLI. Cela ne prouve pas qu’un enfant Gateway distant déjà en cours d’exécution
a redémarré avec le même code de plugin. Sur des configurations VPS/conteneur avec des processus enveloppants,
envoyez les redémarrages au véritable processus `openclaw gateway run`, ou utilisez
`openclaw gateway restart` contre le Gateway en cours d’exécution.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un identifiant de plugin que la découverte n’a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw recherche les plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichiers ou de répertoires.
  </Step>

  <Step title="Plugins d’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins bundlés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D’autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d’activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l’emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins provenant de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les plugins bundlés suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du plugin sélectionné pour cet emplacement
- Certains plugins bundlés optionnels sont activés automatiquement lorsque la configuration nomme une
  surface appartenant au plugin, telle qu’une référence de modèle de fournisseur, une configuration de canal, ou un
  runtime de harnais
- Les routes Codex de la famille OpenAI conservent des frontières de plugins distinctes :
  `openai-codex/*` appartient au plugin OpenAI, tandis que le plugin bundlé de serveur d’application Codex
  est sélectionné par `embeddedHarness.runtime: "codex"` ou par les anciennes
  références de modèle `codex/*`

## Dépannage des hooks d’exécution

Si un plugin apparaît dans `plugins list` mais que les effets de bord de `register(api)` ou les hooks
ne s’exécutent pas dans le trafic de chat en direct, vérifiez d’abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL du
  Gateway actif, le profil, le chemin de configuration et le processus sont bien ceux que vous modifiez.
- Redémarrez le Gateway en direct après les changements de plugin/installation/configuration/code. Dans les
  conteneurs enveloppants, PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --json` pour confirmer les enregistrements de hooks et les
  diagnostics. Les hooks de conversation non bundlés tels que `llm_input`,
  `llm_output` et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s’exécute avant la résolution
  du modèle pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle
  produit une sortie d’assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les
  surfaces de session/état du Gateway et, lors du débogage des charges utiles fournisseur, démarrez
  le Gateway avec `--raw-stream --raw-stream-path <path>`.

## Emplacements de plugins (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

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

| Emplacement     | Ce qu’il contrôle            | Par défaut          |
| --------------- | ---------------------------- | ------------------- |
| `memory`        | Plugin Active Memory         | `memory-core`       |
| `contextEngine` | Moteur de contexte actif     | `legacy` (intégré)  |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # uniquement les plugins chargés
openclaw plugins list --verbose            # lignes de détail par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détail approfondi
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau sur l’ensemble du parc
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics

openclaw plugins install <package>         # installer (ClawHub d’abord, puis npm)
openclaw plugins install clawhub:<pkg>     # installer depuis ClawHub uniquement
openclaw plugins install <spec> --force    # écraser une installation existante
openclaw plugins install <path>            # installer depuis un chemin local
openclaw plugins install -l <path>         # lier (sans copie) pour le développement
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # enregistrer la spécification npm résolue exacte
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # mettre à jour un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # tout mettre à jour
openclaw plugins uninstall <id>          # supprimer les enregistrements de config/installation
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins bundlés sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles bundlés, les fournisseurs de parole bundlés et le plugin de navigateur
bundlé). D’autres plugins bundlés nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase sur place un plugin ou un hook pack déjà installé. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Cette option n’est pas prise en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’id du plugin
installé à cette liste d’autorisation avant de l’activer, afin que les installations soient
immédiatement chargeables après redémarrage.

`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Passer
une spécification de package npm avec un dist-tag ou une version exacte résout le nom du package
vers l’enregistrement de plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Passer le nom du package sans version fait revenir une installation exacte épinglée vers
la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour
sans télécharger, réinstaller ni réécrire la configuration.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car
les installations depuis une marketplace conservent les métadonnées de source de la marketplace au lieu
d’une spécification npm.

`--dangerously-force-unsafe-install` est une dérogation de dernier recours pour les faux
positifs du scanner de code dangereux intégré. Il permet aux installations et mises à jour
de plugins de continuer malgré les détections intégrées `critical`, mais il
ne contourne toujours pas les blocages de stratégie `before_install` des plugins ni le blocage en cas d’échec d’analyse.

Ce drapeau CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations
de dépendances de skills via le Gateway utilisent à la place la dérogation de requête correspondante
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux distinct
de téléchargement/installation de skills ClawHub.

Les bundles compatibles participent au même flux `plugins list`/`inspect`/`enable`/`disable`.
La prise en charge actuelle à l’exécution inclut les skills de bundle, les command-skills Claude,
les valeurs par défaut de Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et
`lspServers` déclarées par manifeste, les command-skills Cursor et les répertoires de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que
les entrées de serveur MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à un bundle.

Les sources de marketplace peuvent être un nom de marketplace connu de Claude depuis
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub,
ou une URL git. Pour les marketplaces distantes, les entrées de plugin doivent rester à l’intérieur du
dépôt de marketplace cloné et utiliser uniquement des sources de chemin relatif.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Vue d’ensemble de l’API Plugin

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens
plugins peuvent encore utiliser `activate(api)` comme alias historique, mais les nouveaux plugins doivent
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

OpenClaw charge l’objet d’entrée et appelle `register(api)` lors de l’activation
du plugin. Le chargeur bascule encore sur `activate(api)` pour les anciens plugins,
mais les plugins bundlés et les nouveaux plugins externes doivent considérer `register` comme le
contrat public.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre       |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM) |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Outil d’agent               |
| `registerHook` / `on(...)`              | Hooks de cycle de vie       |
| `registerSpeechProvider`                | Synthèse vocale / STT       |
| `registerRealtimeTranscriptionProvider` | STT en streaming            |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex      |
| `registerMediaUnderstandingProvider`    | Analyse image/audio         |
| `registerImageGenerationProvider`       | Génération d’images         |
| `registerMusicGenerationProvider`       | Génération musicale         |
| `registerVideoGenerationProvider`       | Génération vidéo            |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web               |
| `registerHttpRoute`                     | Point de terminaison HTTP   |
| `registerCommand` / `registerCli`       | Commandes CLI               |
| `registerContextEngine`                 | Moteur de contexte          |
| `registerService`                       | Service d’arrière-plan      |

Comportement des garde-fous de hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est sans effet et n’annule pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est sans effet et n’annule pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est sans effet et n’annule pas une annulation antérieure.

Pour le comportement complet des hooks typés, voir [Vue d’ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Liens connexes

- [Créer des plugins](/fr/plugins/building-plugins) — créer votre propre plugin
- [Bundles de plugins](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajouter des outils d’agent dans un plugin
- [Internes des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes de plugins tiers
