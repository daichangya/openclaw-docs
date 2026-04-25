---
read_when:
    - Installation ou configuration de plugins
    - Comprendre les règles de découverte et de chargement des plugins
    - Travailler avec des bundles de plugins compatibles Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:22:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

Les plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d'agent, outils, Skills, parole, transcription temps réel, voix en temps réel,
compréhension média, génération d'images, génération de vidéos, récupération web, recherche
web, et plus encore. Certains plugins sont **core** (livrés avec OpenClaw), d'autres
sont **external** (publiés sur npm par la communauté).

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

    Ensuite, configurez sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>
</Steps>

Si vous préférez un contrôle natif dans le chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Le chemin d'installation utilise le même résolveur que le CLI : chemin/archive local, spécification
explicite `clawhub:<pkg>`, ou spécification de paquet brute (ClawHub d'abord, puis repli sur npm).

Si la configuration est invalide, l'installation échoue normalement en mode fermé et vous oriente vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de
réinstallation de plugin fourni pour les plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.

Les installations empaquetées d'OpenClaw n'installent pas de manière anticipée tout l'arbre des dépendances
runtime de chaque plugin fourni. Lorsqu'un plugin fourni appartenant à OpenClaw est actif depuis
la configuration des plugins, l'ancienne configuration de canal ou un manifeste activé par défaut, le démarrage
répare uniquement les dépendances runtime déclarées de ce plugin avant de l'importer.
La désactivation explicite garde la priorité : `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` et `channels.<id>.enabled: false`
empêchent la réparation automatique des dépendances runtime fournies pour ce plugin/canal.
Les plugins externes et les chemins de chargement personnalisés doivent toujours être installés via
`openclaw plugins install`.

## Types de Plugin

OpenClaw reconnaît deux formats de plugin :

| Format     | Fonctionnement                                                  | Exemples                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module runtime ; s'exécute en processus | Plugins officiels, paquets npm communautaires          |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent dans `openclaw plugins list`. Consultez [Bundles de Plugin](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un plugin natif, commencez par [Créer des plugins](/fr/plugins/building-plugins)
et [Vue d'ensemble du SDK Plugin](/fr/plugins/sdk-overview).

## Plugins officiels

### Installables (npm)

| Plugin          | Paquet                | Documentation                        |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/fr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/fr/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/fr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/fr/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/fr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/fr/plugins/zalouser)   |

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
    - `memory-lancedb` — mémoire à long terme installée à la demande avec rappel/capture automatiques (définissez `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Fournisseurs vocaux (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autres">
    - `browser` — plugin navigateur fourni pour l'outil navigateur, le CLI `openclaw browser`, la méthode gateway `browser.request`, le runtime navigateur et le service de contrôle navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` — pont VS Code Copilot Proxy (désactivé par défaut)
  </Accordion>
</AccordionGroup>

Vous cherchez des plugins tiers ? Consultez [Plugins communautaires](/fr/plugins/community).

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
| `enabled`        | Bascule maître (par défaut : `true`)                      |
| `allow`          | Liste d'autorisation des plugins (facultatif)             |
| `deny`           | Liste de refus des plugins (facultatif ; deny l'emporte)  |
| `load.paths`     | Fichiers/répertoires de plugin supplémentaires            |
| `slots`          | Sélecteurs de slot exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>` | Bascules + configuration par plugin                       |

Les modifications de configuration **nécessitent un redémarrage de la gateway**. Si la Gateway s'exécute avec la
surveillance de la configuration + le redémarrage en processus activés (le chemin par défaut `openclaw gateway`),
ce redémarrage est généralement effectué automatiquement peu après l'écriture de la configuration.
Il n'existe aucun chemin de hot reload pris en charge pour le code runtime natif des plugins ou les hooks
de cycle de vie ; redémarrez le processus Gateway qui dessert le canal en direct avant
d'attendre l'exécution du code `register(api)` mis à jour, des hooks `api.on(...)`, des outils, des services ou
des hooks fournisseur/runtime.

`openclaw plugins list` est un instantané local du registre/configuration des plugins. Un
plugin `enabled` à cet endroit signifie que le registre persistant et la configuration actuelle autorisent le
plugin à participer. Cela ne prouve pas qu'un processus enfant Gateway distant déjà en cours d'exécution
a redémarré avec le même code de plugin. Sur des configurations VPS/conteneur avec
des processus wrapper, envoyez les redémarrages au processus réel `openclaw gateway run`,
ou utilisez `openclaw gateway restart` sur la Gateway en cours d'exécution.

<Accordion title="États des plugins : désactivé vs manquant vs invalide">
  - **Désactivé** : le plugin existe mais les règles d'activation l'ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un id de plugin que la découverte n'a pas trouvé.
  - **Invalide** : le plugin existe mais sa configuration ne correspond pas au schéma déclaré.
</Accordion>

## Découverte et priorité

OpenClaw analyse les plugins dans cet ordre (la première correspondance l'emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` — chemins explicites de fichier ou de répertoire.
  </Step>

  <Step title="Plugins d'espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins fournis">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, parole).
    D'autres nécessitent une activation explicite.
  </Step>
</Steps>

### Règles d'activation

- `plugins.enabled: false` désactive tous les plugins
- `plugins.deny` l'emporte toujours sur allow
- `plugins.entries.\<id\>.enabled: false` désactive ce plugin
- Les plugins provenant de l'espace de travail sont **désactivés par défaut** (ils doivent être activés explicitement)
- Les plugins fournis suivent l'ensemble intégré activé par défaut sauf surcharge
- Les slots exclusifs peuvent forcer l'activation du plugin sélectionné pour ce slot
- Certains plugins fournis à opt-in sont activés automatiquement lorsque la configuration nomme une
  surface appartenant au plugin, comme une référence de modèle de fournisseur, une configuration de canal ou un
  runtime de harnais
- Les routes Codex de la famille OpenAI conservent des frontières de plugin distinctes :
  `openai-codex/*` appartient au plugin OpenAI, tandis que le plugin fourni
  app-server Codex est sélectionné par `embeddedHarness.runtime: "codex"` ou par les anciennes
  références de modèle `codex/*`

## Dépannage des hooks runtime

Si un plugin apparaît dans `plugins list` mais que les effets secondaires de `register(api)` ou les hooks
ne s'exécutent pas dans le trafic de chat en direct, vérifiez d'abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l'URL Gateway active,
  le profil, le chemin de configuration et le processus sont bien ceux que vous modifiez.
- Redémarrez la Gateway en direct après les changements d'installation/configuration/code du plugin. Dans les
  conteneurs wrapper, PID 1 peut n'être qu'un superviseur ; redémarrez ou signalez le processus enfant
  `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --json` pour confirmer les enregistrements de hooks et
  les diagnostics. Les hooks de conversation non fournis comme `llm_input`,
  `llm_output` et `agent_end` nécessitent
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s'exécute avant la résolution du modèle
  pour les tours d'agent ; `llm_output` ne s'exécute qu'après qu'une tentative de modèle a
  produit une sortie assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les
  surfaces de session/état de la Gateway et, lors du débogage des payloads fournisseur, démarrez
  la Gateway avec `--raw-stream --raw-stream-path <path>`.

## Slots de Plugin (catégories exclusives)

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

| Slot            | Ce qu'il contrôle         | Par défaut         |
| --------------- | ------------------------- | ------------------ |
| `memory`        | Plugin de mémoire active  | `memory-core`      |
| `contextEngine` | Moteur de contexte actif  | `legacy` (intégré) |

## Référence CLI

```bash
openclaw plugins list                       # inventaire compact
openclaw plugins list --enabled            # uniquement les plugins activés
openclaw plugins list --verbose            # lignes détaillées par plugin
openclaw plugins list --json               # inventaire lisible par machine
openclaw plugins inspect <id>              # détails approfondis
openclaw plugins inspect <id> --json       # lisible par machine
openclaw plugins inspect --all             # tableau à l'échelle de l'ensemble
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspecter l'état du registre persistant
openclaw plugins registry --refresh        # reconstruire le registre persistant

openclaw plugins install <package>         # installer (ClawHub d'abord, puis npm)
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
openclaw plugins uninstall <id>          # supprimer les enregistrements de configuration/d'installation
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins fournis sont livrés avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles fournis, les fournisseurs vocaux fournis et le plugin navigateur
fourni). D'autres plugins fournis nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase sur place un plugin ou pack de hooks installé existant. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Il n'est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d'installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l'id du plugin
installé à cette liste d'autorisation avant de l'activer, afin que les installations soient
immédiatement chargeables après redémarrage.

OpenClaw conserve un registre local persistant des plugins comme modèle de lecture à froid pour
l'inventaire des plugins, la propriété des contributions et la planification du démarrage. Les flux
d'installation, de mise à jour, de désinstallation, d'activation et de désactivation actualisent ce registre
après avoir modifié l'état du plugin. Si le registre est manquant, obsolète ou invalide, `openclaw plugins registry
--refresh` le reconstruit à partir du journal d'installation durable, de la politique de configuration et des
métadonnées de manifeste/paquet, sans charger les modules runtime des plugins.

`openclaw plugins update <id-or-npm-spec>` s'applique aux installations suivies. Le fait de transmettre
une spécification de paquet npm avec un dist-tag ou une version exacte résout le nom du paquet
vers l'enregistrement du plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Le fait de transmettre le nom du paquet sans version fait revenir une installation épinglée à une version exacte
sur la ligne de publication par défaut du registre. Si le plugin npm installé correspond déjà
à la version résolue et à l'identité d'artefact enregistrée, OpenClaw ignore la mise à jour
sans téléchargement, réinstallation ni réécriture de la configuration.

`--pin` est réservé à npm. Il n'est pas pris en charge avec `--marketplace`, car
les installations depuis une marketplace conservent des métadonnées de source de marketplace au lieu d'une spécification npm.

`--dangerously-force-unsafe-install` est une surcharge de secours pour les faux
positifs du scanner intégré de code dangereux. Elle permet aux installations de plugins
et aux mises à jour de plugins de continuer malgré des résultats intégrés `critical`, mais elle
ne contourne toujours pas les blocages de politique `before_install` du plugin ni les blocages dus aux échecs de scan.

Ce drapeau CLI s'applique uniquement aux flux d'installation/mise à jour des plugins. Les installations
de dépendances de Skills adossées à Gateway utilisent à la place la surcharge de requête correspondante
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de
téléchargement/installation de Skills ClawHub.

Les bundles compatibles participent au même flux list/inspect/enable/disable des plugins. La prise en charge runtime actuelle inclut les bundle skills, les command-skills Claude,
les valeurs par défaut Claude `settings.json`, Claude `.lsp.json` et les valeurs par défaut
`lspServers` déclarées dans le manifeste, les command-skills Cursor et les répertoires
de hooks Codex compatibles.

`openclaw plugins inspect <id>` signale aussi les capacités de bundle détectées ainsi que les
entrées de serveur MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à des bundles.

Les sources de marketplace peuvent être un nom de marketplace connu de Claude provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, une forme abrégée GitHub comme `owner/repo`, une URL de dépôt GitHub
ou une URL git. Pour les marketplaces distantes, les entrées de plugin doivent rester à l'intérieur du
dépôt de marketplace cloné et utiliser uniquement des sources de chemin relatif.

Consultez la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Vue d'ensemble de l'API Plugin

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
Le chargeur continue de revenir à `activate(api)` pour les anciens plugins,
mais les plugins fournis et les nouveaux plugins externes doivent traiter `register` comme le
contrat public.

`api.registrationMode` indique à un plugin pourquoi son entrée est en cours de chargement :

| Mode            | Signification                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation runtime. Enregistrez les outils, hooks, services, commandes, routes et autres effets de bord en direct.            |
| `discovery`     | Découverte de capacités en lecture seule. Enregistrez les fournisseurs et les métadonnées ; le code d'entrée du plugin de confiance peut se charger, mais ignorez les effets de bord en direct. |
| `setup-only`    | Chargement des métadonnées de configuration du canal via une entrée de configuration légère.                                   |
| `setup-runtime` | Chargement de la configuration du canal qui a aussi besoin de l'entrée runtime.                                                |
| `cli-metadata`  | Collecte des métadonnées des commandes CLI uniquement.                                                                         |

Les entrées de plugin qui ouvrent des sockets, des bases de données, des workers en arrière-plan ou des
clients de longue durée doivent protéger ces effets de bord avec `api.registrationMode === "full"`.
Les chargements de découverte sont mis en cache séparément des chargements d'activation et ne remplacent
pas le registre Gateway en cours d'exécution. La découverte n'active rien, mais n'est pas sans import :
OpenClaw peut évaluer l'entrée de plugin de confiance ou le module de plugin de canal pour construire
l'instantané. Gardez les niveaux supérieurs des modules légers et sans effets de bord, et déplacez les
clients réseau, sous-processus, écouteurs, lectures d'identifiants et démarrage de service
derrière les chemins runtime complets.

Méthodes d'enregistrement courantes :

| Méthode                                  | Ce qu'elle enregistre         |
| ---------------------------------------- | ----------------------------- |
| `registerProvider`                       | Fournisseur de modèle (LLM)   |
| `registerChannel`                        | Canal de chat                 |
| `registerTool`                           | Outil d'agent                 |
| `registerHook` / `on(...)`               | Hooks de cycle de vie         |
| `registerSpeechProvider`                 | Synthèse vocale / STT         |
| `registerRealtimeTranscriptionProvider`  | STT en streaming              |
| `registerRealtimeVoiceProvider`          | Voix temps réel duplex        |
| `registerMediaUnderstandingProvider`     | Analyse image/audio           |
| `registerImageGenerationProvider`        | Génération d'images           |
| `registerMusicGenerationProvider`        | Génération de musique         |
| `registerVideoGenerationProvider`        | Génération de vidéos          |
| `registerWebFetchProvider`               | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`              | Recherche web                 |
| `registerHttpRoute`                      | Endpoint HTTP                 |
| `registerCommand` / `registerCli`        | Commandes CLI                 |
| `registerContextEngine`                  | Moteur de contexte            |
| `registerService`                        | Service en arrière-plan       |

Comportement de garde des hooks pour les hooks de cycle de vie typés :

- `before_tool_call`: `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call`: `{ block: false }` n'a aucun effet et n'efface pas un blocage antérieur.
- `before_install`: `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install`: `{ block: false }` n'a aucun effet et n'efface pas un blocage antérieur.
- `message_sending`: `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending`: `{ cancel: false }` n'a aucun effet et n'efface pas une annulation antérieure.

Les exécutions natives de l'app-server Codex réinjectent les événements d'outils natifs Codex dans cette
surface de hooks. Les plugins peuvent bloquer les outils Codex natifs via `before_tool_call`,
observer les résultats via `after_tool_call` et participer aux approbations de
`PermissionRequest` de Codex. Le pont ne réécrit pas encore les arguments des outils natifs Codex. La limite exacte de prise en charge du runtime Codex se trouve dans le
[contrat de prise en charge v1 du harnais Codex](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez la [vue d'ensemble du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Voir aussi

- [Créer des plugins](/fr/plugins/building-plugins) — créez votre propre plugin
- [Bundles de Plugin](/fr/plugins/bundles) — compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) — ajoutez des outils d'agent dans un plugin
- [Internals des plugins](/fr/plugins/architecture) — modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) — listes tierces
