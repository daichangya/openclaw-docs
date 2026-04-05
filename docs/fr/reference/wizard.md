---
read_when:
    - Rechercher une étape ou un drapeau spécifique de l'onboarding
    - Automatiser l'onboarding avec le mode non interactif
    - Déboguer le comportement de l'onboarding
sidebarTitle: Onboarding Reference
summary: 'Référence complète de l''onboarding CLI : chaque étape, drapeau et champ de configuration'
title: Référence de l'onboarding
x-i18n:
    generated_at: "2026-04-05T12:54:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Référence de l'onboarding

Ceci est la référence complète pour `openclaw onboard`.
Pour une vue d'ensemble de haut niveau, voir [Onboarding (CLI)](/fr/start/wizard).

## Détails du flux (mode local)

<Steps>
  <Step title="Détection d'une configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez **Conserver / Modifier / Réinitialiser**.
    - Relancer l'onboarding n'efface **rien** sauf si vous choisissez explicitement **Réinitialiser**
      (ou passez `--reset`).
    - `--reset` en CLI cible par défaut `config+creds+sessions` ; utilisez `--reset-scope full`
      pour supprimer aussi l'espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l'assistant s'arrête et vous demande
      d'exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` (jamais `rm`) et propose les portées suivantes :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l'espace de travail)
  </Step>
  <Step title="Model/Auth">
    - **Clé API Anthropic** : utilise `ANTHROPIC_API_KEY` si présente ou demande une clé, puis l'enregistre pour l'utilisation par le daemon.
    - **Anthropic Claude CLI** : choix d'assistant Anthropic préféré dans onboarding/configure. Sur macOS, l'onboarding vérifie l'élément du trousseau « Claude Code-credentials » (choisissez « Always Allow » pour que les démarrages via launchd ne se bloquent pas) ; sur Linux/Windows, il réutilise `~/.claude/.credentials.json` s'il est présent et bascule la sélection du modèle vers une référence canonique `claude-cli/claude-*`.
    - **Jeton de configuration Anthropic (hérité/manuel)** : de nouveau disponible dans onboarding/configure, mais Anthropic a indiqué aux utilisateurs d'OpenClaw que le chemin Claude-login d'OpenClaw compte comme utilisation de harnais tiers et nécessite **Extra Usage** sur le compte Claude.
    - **Abonnement OpenAI Code (Codex) (Codex CLI)** : si `~/.codex/auth.json` existe, l'onboarding peut le réutiliser. Les identifiants Codex CLI réutilisés restent gérés par Codex CLI ; à l'expiration, OpenClaw relit d'abord cette source et, lorsque le fournisseur peut les rafraîchir, réécrit l'identifiant rafraîchi dans le stockage Codex au lieu d'en prendre lui-même la gestion.
    - **Abonnement OpenAI Code (Codex) (OAuth)** : flux navigateur ; collez le `code#state`.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.4` lorsque le modèle n'est pas défini ou vaut `openai/*`.
    - **Clé API OpenAI** : utilise `OPENAI_API_KEY` si présente ou demande une clé, puis la stocke dans les profils d'authentification.
      - Définit `agents.defaults.model` sur `openai/gpt-5.4` lorsque le modèle n'est pas défini, vaut `openai/*` ou `openai-codex/*`.
    - **Clé API xAI (Grok)** : demande `XAI_API_KEY` et configure xAI comme fournisseur de modèle.
    - **OpenCode** : demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, à obtenir sur https://opencode.ai/auth) et vous permet de choisir le catalogue Zen ou Go.
    - **Ollama** : demande l'URL de base Ollama, propose le mode **Cloud + Local** ou **Local**, découvre les modèles disponibles et télécharge automatiquement le modèle local sélectionné si nécessaire.
    - Plus de détails : [Ollama](/providers/ollama)
    - **Clé API** : stocke la clé pour vous.
    - **Vercel AI Gateway (proxy multi-modèles)** : demande `AI_GATEWAY_API_KEY`.
    - Plus de détails : [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway** : demande l'ID de compte, l'ID de gateway, et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Plus de détails : [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax** : la configuration est écrite automatiquement ; le modèle hébergé par défaut est `MiniMax-M2.7`.
      La configuration par clé API utilise `minimax/...`, et la configuration OAuth utilise
      `minimax-portal/...`.
    - Plus de détails : [MiniMax](/providers/minimax)
    - **StepFun** : la configuration est écrite automatiquement pour StepFun standard ou Step Plan sur des points de terminaison Chine ou globaux.
    - Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    - Plus de détails : [StepFun](/providers/stepfun)
    - **Synthetic (compatible Anthropic)** : demande `SYNTHETIC_API_KEY`.
    - Plus de détails : [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)** : la configuration est écrite automatiquement.
    - **Kimi Coding** : la configuration est écrite automatiquement.
    - Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Ignorer** : aucune authentification encore configurée.
    - Choisissez un modèle par défaut parmi les options détectées (ou saisissez manuellement provider/model). Pour une qualité optimale et un risque plus faible d'injection de prompt, choisissez le modèle le plus fort de dernière génération disponible dans votre pile de fournisseurs.
    - L'onboarding exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou sans authentification.
    - Le mode de stockage par défaut des clés API utilise des valeurs en clair dans les profils d'authentification. Utilisez `--secret-input-mode ref` pour stocker à la place des références adossées à l'environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Les profils d'authentification se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (clés API + OAuth). `~/.openclaw/credentials/oauth.json` est un héritage uniquement utilisé pour l'import.
    - Plus de détails : [/concepts/oauth](/concepts/oauth)
    <Note>
    Astuce pour les serveurs/headless : terminez OAuth sur une machine disposant d'un navigateur, puis copiez
    le `auth-profiles.json` de cet agent (par exemple
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
    correspondant sous `$OPENCLAW_STATE_DIR/...`) vers l'hôte gateway. `credentials/oauth.json`
    n'est qu'une source d'import héritée.
    </Note>
  </Step>
  <Step title="Espace de travail">
    - Valeur par défaut `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers d'espace de travail nécessaires au rituel d'amorçage de l'agent.
    - Structure complète de l'espace de travail + guide de sauvegarde : [Espace de travail agent](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode d'authentification, exposition Tailscale.
    - Recommandation d'authentification : conservez **Token** même en loopback afin que les clients WS locaux doivent s'authentifier.
    - En mode token, la configuration interactive propose :
      - **Générer/stocker un jeton en clair** (par défaut)
      - **Utiliser SecretRef** (opt-in)
      - Quickstart réutilise les SecretRef existants `gateway.auth.token` pour `env`, `file` et `exec` afin d'amorcer la sonde/le dashboard pendant l'onboarding.
      - Si ce SecretRef est configuré mais ne peut pas être résolu, l'onboarding échoue tôt avec un message clair de correction au lieu de dégrader silencieusement l'authentification runtime.
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en clair ou via SecretRef.
    - Chemin SecretRef de jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d'environnement non vide dans l'environnement du processus d'onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l'authentification uniquement si vous faites entièrement confiance à tous les processus locaux.
    - Les bind hors loopback nécessitent toujours une authentification.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/channels/whatsapp) : connexion QR facultative.
    - [Telegram](/channels/telegram) : jeton de bot.
    - [Discord](/channels/discord) : jeton de bot.
    - [Google Chat](/channels/googlechat) : JSON de compte de service + audience du webhook.
    - [Mattermost](/channels/mattermost) (plugin) : jeton de bot + URL de base.
    - [Signal](/channels/signal) : installation facultative de `signal-cli` + configuration du compte.
    - [BlueBubbles](/channels/bluebubbles) : **recommandé pour iMessage** ; URL du serveur + mot de passe + webhook.
    - [iMessage](/channels/imessage) : chemin CLI `imsg` hérité + accès à la base de données.
    - Sécurité des DM : la valeur par défaut est le jumelage. Le premier DM envoie un code ; approuvez-le via `openclaw pairing approve <channel> <code>` ou utilisez des listes d'autorisation.
  </Step>
  <Step title="Recherche web">
    - Choisissez un fournisseur pris en charge tel que Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignorez).
    - Les fournisseurs adossés à une API peuvent utiliser des variables d'environnement ou une configuration existante pour une configuration rapide ; les fournisseurs sans clé utilisent à la place leurs prérequis spécifiques.
    - Ignorez avec `--skip-search`.
    - Configurez plus tard avec : `openclaw configure --section web`.
  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour un usage headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux (et Windows via WSL2) : unité utilisateur systemd
      - L'onboarding tente d'activer le linger via `loginctl enable-linger <user>` afin que la gateway reste active après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d'abord sans sudo.
    - **Sélection du runtime :** Node (recommandé ; requis pour WhatsApp/Telegram). Bun est **non recommandé**.
    - Si l'authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l'installation du daemon le valide mais ne persiste pas les valeurs résolues en clair du jeton dans les métadonnées d'environnement du superviseur de service.
    - Si l'authentification par jeton nécessite un jeton et que le SecretRef du jeton configuré n'est pas résolu, l'installation du daemon est bloquée avec des instructions exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n'est pas défini, l'installation du daemon est bloquée jusqu'à ce que le mode soit explicitement défini.
  </Step>
  <Step title="Vérification d'état">
    - Démarre la gateway (si nécessaire) et exécute `openclaw health`.
    - Astuce : `openclaw status --deep` ajoute la sonde d'état live de la gateway à la sortie de status, y compris des sondes de canaux lorsque c'est pris en charge (nécessite une gateway joignable).
  </Step>
  <Step title="Skills (recommandé)">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous permet de choisir un gestionnaire Node : **npm / pnpm** (bun non recommandé).
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Terminer">
    - Résumé + étapes suivantes, y compris les applications iOS/Android/macOS pour des fonctionnalités supplémentaires.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n'est détectée, l'onboarding affiche des instructions de port-forward SSH pour l'interface utilisateur de contrôle au lieu d'ouvrir un navigateur.
Si les assets de l'interface utilisateur de contrôle sont absents, l'onboarding tente de les construire ; le repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Mode non interactif

Utilisez `--non-interactive` pour automatiser ou scénariser l'onboarding :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Ajoutez `--json` pour obtenir un résumé lisible par machine.

SecretRef du jeton gateway en mode non interactif :

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.

<Note>
`--json` n'implique **pas** le mode non interactif. Utilisez `--non-interactive` (et `--workspace`) pour les scripts.
</Note>

Des exemples de commandes spécifiques aux fournisseurs se trouvent dans [Automatisation CLI](/start/wizard-cli-automation#provider-specific-examples).
Utilisez cette page de référence pour la sémantique des drapeaux et l'ordre des étapes.

### Ajouter un agent (mode non interactif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC de l'assistant gateway

La gateway expose le flux d'onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Les clients (application macOS, interface utilisateur de contrôle) peuvent afficher les étapes sans avoir à réimplémenter la logique d'onboarding.

## Configuration Signal (`signal-cli`)

L'onboarding peut installer `signal-cli` depuis les releases GitHub :

- Télécharge l'asset de release approprié.
- Le stocke sous `~/.openclaw/tools/signal-cli/<version>/`.
- Écrit `channels.signal.cliPath` dans votre configuration.

Remarques :

- Les builds JVM nécessitent **Java 21**.
- Les builds natives sont utilisées lorsqu'elles sont disponibles.
- Windows utilise WSL2 ; l'installation de signal-cli suit le flux Linux dans WSL.

## Ce que l'assistant écrit

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si MiniMax est choisi)
- `tools.profile` (l'onboarding local définit par défaut `"coding"` lorsqu'il n'est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (détails du comportement : [Référence CLI de configuration](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d'autorisation de canaux (Slack/Discord/Matrix/Microsoft Teams) lorsque vous activez cette option pendant les invites (les noms sont résolus en IDs lorsque c'est possible).
- `skills.install.nodeManager`
  - `setup --node-manager` accepte `npm`, `pnpm`, ou `bun`.
  - La configuration manuelle peut toujours utiliser `yarn` en définissant directement `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et d'éventuels `bindings`.

Les identifiants WhatsApp se trouvent sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

Certains canaux sont fournis comme plugins. Lorsque vous en choisissez un pendant la configuration, l'onboarding
vous demandera de l'installer (npm ou chemin local) avant qu'il puisse être configuré.

## Documentation associée

- Vue d'ensemble de l'onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Onboarding de l'application macOS : [Onboarding](/start/onboarding)
- Référence de configuration : [Configuration de la gateway](/gateway/configuration)
- Fournisseurs : [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord), [Google Chat](/channels/googlechat), [Signal](/channels/signal), [BlueBubbles](/channels/bluebubbles) (iMessage), [iMessage](/channels/imessage) (hérité)
- Skills : [Skills](/tools/skills), [Configuration des Skills](/tools/skills-config)
