---
read_when:
    - Vous avez besoin du comportement détaillé de openclaw onboard
    - Vous déboguez les résultats d’onboarding ou intégrez des clients d’onboarding
sidebarTitle: CLI reference
summary: Référence complète du flux de configuration CLI, de la configuration auth/modèle, des sorties et des internals
title: Référence de configuration CLI
x-i18n:
    generated_at: "2026-04-24T07:33:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Cette page est la référence complète de `openclaw onboard`.
Pour le guide court, voir [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l’assistant

Le mode local (par défaut) vous guide à travers :

- Configuration du modèle et de l’authentification (OAuth OpenAI Code subscription, Claude CLI ou clé API Anthropic, plus les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- Emplacement de l’espace de travail et fichiers bootstrap
- Paramètres du Gateway (port, bind, auth, tailscale)
- Canaux et providers (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, et autres Plugins de canal intégrés)
- Installation du daemon (LaunchAgent, unité utilisateur systemd, ou tâche planifiée Windows native avec repli Startup-folder)
- Vérification d’état
- Configuration des Skills

Le mode distant configure cette machine pour se connecter à un gateway exécuté ailleurs.
Il n’installe ni ne modifie quoi que ce soit sur l’hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection de configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Relancer l’assistant n’efface rien à moins de choisir explicitement Réinitialiser (ou de passer `--reset`).
    - Le `--reset` du CLI vise par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et vous demande d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` et propose des portées :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)
  </Step>
  <Step title="Modèle et authentification">
    - La matrice complète des options figure dans [Options d’authentification et de modèle](#auth-and-model-options).
  </Step>
  <Step title="Espace de travail">
    - Par défaut `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers d’espace de travail nécessaires au rituel de bootstrap du premier lancement.
    - Disposition de l’espace de travail : [Espace de travail d’agent](/fr/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Demande le port, le bind, le mode d’authentification et l’exposition tailscale.
    - Recommandé : gardez l’authentification par jeton activée même pour loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte brut** (par défaut)
      - **Utiliser SecretRef** (opt-in)
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en texte brut ou via SecretRef.
    - Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à chaque processus local.
    - Les binds non loopback exigent toujours une authentification.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : QR de connexion facultatif
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience de Webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [BlueBubbles](/fr/channels/bluebubbles) : recommandé pour iMessage ; URL du serveur + mot de passe + Webhook
    - [iMessage](/fr/channels/imessage) : ancien chemin CLI `imsg` + accès à la base de données
    - Sécurité DM : la valeur par défaut est l’association. Le premier DM envoie un code ; approuvez-le via
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour un mode headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L’assistant tente `loginctl enable-linger <user>` afin que le gateway reste actif après déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - Windows natif : tâche planifiée d’abord
      - Si la création de la tâche est refusée, OpenClaw revient à un élément de connexion par utilisateur dans le dossier Startup et démarre immédiatement le gateway.
      - Les tâches planifiées restent préférées car elles fournissent un meilleur statut de supervision.
    - Sélection du runtime : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n’est pas recommandé.
  </Step>
  <Step title="Vérification d’état">
    - Démarre le gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde de santé du gateway en direct à la sortie de statut, y compris les sondes de canal lorsqu’elles sont prises en charge.
  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous permet de choisir le gestionnaire Node : npm, pnpm, ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Fin">
    - Résumé et étapes suivantes, y compris les options d’application iOS, Android et macOS.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’assistant affiche les instructions de redirection de port SSH pour l’interface de contrôle au lieu d’ouvrir un navigateur.
Si les ressources de l’interface de contrôle sont manquantes, l’assistant tente de les construire ; la solution de repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour se connecter à un gateway exécuté ailleurs.

<Info>
Le mode distant n’installe ni ne modifie quoi que ce soit sur l’hôte distant.
</Info>

Ce que vous définissez :

- URL du gateway distant (`ws://...`)
- Jeton si l’authentification du gateway distant est requise (recommandé)

<Note>
- Si le gateway est limité à loopback, utilisez un tunnel SSH ou un tailnet.
- Indices de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)
</Note>

## Options d’authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé API Anthropic">
    Utilise `ANTHROPIC_API_KEY` s’il est présent ou demande une clé, puis la sauvegarde pour l’usage daemon.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="OpenAI Code subscription (association d’appareil)">
    Flux d’association navigateur avec un code d’appareil de courte durée.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Clé API OpenAI">
    Utilise `OPENAI_API_KEY` s’il est présent ou demande une clé, puis stocke l’identifiant dans les profils d’authentification.

    Définit `agents.defaults.model` sur `openai/gpt-5.4` lorsque le modèle n’est pas défini, est `openai/*`, ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Clé API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme provider de modèle.
  </Accordion>
  <Accordion title="OpenCode">
    Demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) et vous permet de choisir le catalogue Zen ou Go.
    URL de configuration : [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clé API (générique)">
    Stocke la clé pour vous.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Demande `AI_GATEWAY_API_KEY`.
    Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Demande l’identifiant de compte, l’identifiant de gateway, et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur hébergée par défaut est `MiniMax-M2.7` ; la configuration par clé API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison Chine ou global.
    Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud et modèles open locaux)">
    Demande d’abord `Cloud + Local`, `Cloud only`, ou `Local only`.
    `Cloud only` utilise `OLLAMA_API_KEY` avec `https://ollama.com`.
    Les modes adossés à l’hôte demandent l’URL de base (par défaut `http://127.0.0.1:11434`), découvrent les modèles disponibles et suggèrent des valeurs par défaut.
    `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personnalisé">
    Fonctionne avec des points de terminaison compatibles OpenAI et Anthropic.

    L’onboarding interactif prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API provider :
    - **Coller la clé API maintenant** (texte brut)
    - **Utiliser une référence de secret** (référence env ou référence provider configurée, avec validation préalable)

    Indicateurs non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; revient à `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|anthropic>` (facultatif ; défaut `openai`)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l’authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement du modèle :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le provider et le modèle.
- Lorsque l’onboarding démarre à partir d’un choix d’authentification provider, le sélecteur de modèle préfère automatiquement
  ce provider. Pour Volcengine et BytePlus, cette même préférence correspond
  aussi à leurs variantes coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de provider préféré serait vide, le sélecteur revient au catalogue complet au lieu de n’afficher aucun modèle.
- L’assistant exécute une vérification de modèle et avertit si le modèle configuré est inconnu ou s’il manque l’authentification.

Chemins des identifiants et profils :

- Profils d’authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement d’onboarding par défaut persiste les clés API comme valeurs en texte brut dans les profils d’authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage de clé en texte brut.
  Dans la configuration interactive, vous pouvez choisir :
  - référence de variable d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - référence provider configurée (`file` ou `exec`) avec alias de provider + id
- Le mode référence interactif exécute une validation préalable rapide avant la sauvegarde.
  - Références env : valide le nom de variable + valeur non vide dans l’environnement courant d’onboarding.
  - Références provider : valide la configuration provider et résout l’identifiant demandé.
  - Si la validation préalable échoue, l’onboarding affiche l’erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` est uniquement adossé à env.
  - Définissez la variable d’environnement provider dans l’environnement du processus d’onboarding.
  - Les indicateurs de clé inline (par exemple `--openai-api-key`) exigent que cette variable env soit définie ; sinon l’onboarding échoue immédiatement.
  - Pour les providers personnalisés, le mode `ref` non interactif stocke `models.providers.<id>.apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de provider personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon l’onboarding échoue immédiatement.
- Les identifiants d’authentification du gateway prennent en charge les choix texte brut et SecretRef dans la configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en texte brut** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : texte brut ou SecretRef.
- Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations existantes en texte brut continuent de fonctionner sans changement.

<Note>
Conseil pour les serveurs et le mode headless : terminez OAuth sur une machine avec navigateur, puis copiez le `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
`$OPENCLAW_STATE_DIR/...`) vers l’hôte gateway. `credentials/oauth.json`
n’est qu’une source d’import héritée.
</Note>

## Sorties et internals

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si MiniMax est choisi)
- `tools.profile` (l’onboarding local le définit par défaut sur `"coding"` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont préservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (l’onboarding local le définit par défaut sur `per-channel-peer` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont préservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation de canal (Slack, Discord, Matrix, Microsoft Teams) lorsque vous activez l’option pendant les invites (les noms sont résolus en identifiants quand c’est possible)
- `skills.install.nodeManager`
  - Le drapeau `setup --node-manager` accepte `npm`, `pnpm`, ou `bun`.
  - La configuration manuelle peut toujours définir `skills.install.nodeManager: "yarn"` plus tard.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et éventuellement `bindings`.

Les identifiants WhatsApp vont sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont livrés comme Plugins. Lorsqu’ils sont sélectionnés pendant la configuration, l’assistant
demande d’installer le Plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC de l’assistant Gateway :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et interface de contrôle) peuvent afficher les étapes sans réimplémenter la logique d’onboarding.

Comportement de la configuration Signal :

- Télécharge la ressource de publication appropriée
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM nécessitent Java 21
- Les builds natifs sont utilisés lorsqu’ils sont disponibles
- Windows utilise WSL2 et suit le flux Linux signal-cli dans WSL

## Documentation associée

- Hub d’onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation CLI](/fr/start/wizard-cli-automation)
- Référence de commande : [`openclaw onboard`](/fr/cli/onboard)
