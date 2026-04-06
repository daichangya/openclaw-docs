---
read_when:
    - Vous avez besoin du comportement détaillé de `openclaw onboard`
    - Vous déboguez les résultats d'onboarding ou intégrez des clients d'onboarding
sidebarTitle: CLI reference
summary: Référence complète du flux de configuration de la CLI, de la configuration de l'authentification et des modèles, des sorties et des éléments internes
title: Référence de configuration de la CLI
x-i18n:
    generated_at: "2026-04-06T03:13:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92f379b34a2b48c68335dae4f759117c770f018ec51b275f4f40421c6b3abb23
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Référence de configuration de la CLI

Cette page est la référence complète pour `openclaw onboard`.
Pour le guide rapide, consultez [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l'assistant

Le mode local (par défaut) vous guide à travers :

- La configuration du modèle et de l'authentification (abonnement OpenAI Code OAuth, Anthropic Claude CLI ou clé API, ainsi que les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- L'emplacement de l'espace de travail et les fichiers d'initialisation
- Les paramètres de la passerelle (port, liaison, authentification, tailscale)
- Les canaux et les fournisseurs (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles et d'autres plugins de canal intégrés)
- L'installation du daemon (LaunchAgent, unité utilisateur systemd ou tâche planifiée Windows native avec solution de secours via le dossier Startup)
- La vérification d'état
- La configuration des Skills

Le mode distant configure cette machine pour se connecter à une passerelle située ailleurs.
Il n'installe ni ne modifie quoi que ce soit sur l'hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection de la configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Réexécuter l'assistant n'efface rien à moins de choisir explicitement Réinitialiser (ou de passer `--reset`).
    - La CLI `--reset` utilise par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi l'espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l'assistant s'arrête et vous demande d'exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` et propose plusieurs périmètres :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l'espace de travail)
  </Step>
  <Step title="Modèle et authentification">
    - La matrice complète des options figure dans [Options d'authentification et de modèle](#options-dauthentification-et-de-modele).
  </Step>
  <Step title="Espace de travail">
    - Par défaut `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers de l'espace de travail nécessaires au rituel d'amorçage du premier démarrage.
    - Structure de l'espace de travail : [Espace de travail de l'agent](/fr/concepts/agent-workspace).
  </Step>
  <Step title="Passerelle">
    - Demande le port, la liaison, le mode d'authentification et l'exposition tailscale.
    - Recommandé : garder l'authentification par jeton activée même pour loopback afin que les clients WS locaux doivent s'authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en clair** (par défaut)
      - **Utiliser SecretRef** (option)
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en clair ou SecretRef.
    - Chemin SecretRef pour jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d'environnement non vide dans l'environnement du processus d'onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l'authentification uniquement si vous faites entièrement confiance à chaque processus local.
    - Les liaisons non-loopback exigent toujours une authentification.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [BlueBubbles](/fr/channels/bluebubbles) : recommandé pour iMessage ; URL du serveur + mot de passe + webhook
    - [iMessage](/fr/channels/imessage) : chemin CLI hérité `imsg` + accès à la base de données
    - Sécurité des messages privés : l'appairage est utilisé par défaut. Le premier message privé envoie un code ; approuvez-le via
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d'autorisation.
  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour un environnement headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L'assistant tente `loginctl enable-linger <user>` afin que la passerelle reste active après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d'abord sans sudo.
    - Windows natif : tâche planifiée en priorité
      - Si la création de la tâche est refusée, OpenClaw bascule vers un élément de connexion par utilisateur dans le dossier Startup et démarre immédiatement la passerelle.
      - Les tâches planifiées restent préférées car elles fournissent un meilleur état du superviseur.
    - Sélection de l'environnement d'exécution : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n'est pas recommandé.
  </Step>
  <Step title="Vérification d'état">
    - Démarre la passerelle (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d'état en direct de la passerelle à la sortie de statut, y compris les sondes de canaux lorsqu'elles sont prises en charge.
  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les prérequis.
    - Vous permet de choisir le gestionnaire Node : npm, pnpm ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Fin">
    - Résumé et étapes suivantes, y compris les options d'application iOS, Android et macOS.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n'est détectée, l'assistant affiche les instructions de transfert de port SSH pour l'interface de contrôle au lieu d'ouvrir un navigateur.
Si les ressources de l'interface de contrôle sont absentes, l'assistant tente de les construire ; la solution de secours est `pnpm ui:build` (installe automatiquement les dépendances de l'interface).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour se connecter à une passerelle située ailleurs.

<Info>
Le mode distant n'installe ni ne modifie quoi que ce soit sur l'hôte distant.
</Info>

Ce que vous définissez :

- URL de la passerelle distante (`ws://...`)
- Jeton si l'authentification de la passerelle distante est requise (recommandé)

<Note>
- Si la passerelle est limitée à loopback, utilisez un tunnel SSH ou un tailnet.
- Indices de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)
</Note>

## Options d'authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé API Anthropic">
    Utilise `ANTHROPIC_API_KEY` si elle est présente ou demande une clé, puis l'enregistre pour l'utilisation par le daemon.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (réutilisation de Codex CLI)">
    Si `~/.codex/auth.json` existe, l'assistant peut le réutiliser.
    Les identifiants Codex CLI réutilisés restent gérés par Codex CLI ; à l'expiration, OpenClaw
    relit d'abord cette source et, lorsque le fournisseur peut l'actualiser, écrit
    l'identifiant actualisé dans le stockage Codex au lieu d'en prendre lui-même
    la gestion.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.4` lorsque le modèle n'est pas défini ou vaut `openai/*`.

  </Accordion>
  <Accordion title="Clé API OpenAI">
    Utilise `OPENAI_API_KEY` si elle est présente ou demande une clé, puis stocke l'identifiant dans les profils d'authentification.

    Définit `agents.defaults.model` sur `openai/gpt-5.4` lorsque le modèle n'est pas défini, vaut `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Clé API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme fournisseur de modèle.
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
    Demande l'ID de compte, l'ID de passerelle et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur hébergée par défaut est `MiniMax-M2.7` ; la configuration par clé API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur des points de terminaison chinois ou globaux.
    Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud et modèles ouverts locaux)">
    Demande l'URL de base (par défaut `http://127.0.0.1:11434`), puis propose le mode Cloud + local ou local.
    Détecte les modèles disponibles et suggère des valeurs par défaut.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec des points de terminaison compatibles OpenAI et compatibles Anthropic.

    L'onboarding interactif prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API de fournisseur :
    - **Coller la clé API maintenant** (en clair)
    - **Utiliser une référence secrète** (référence d'environnement ou référence de fournisseur configurée, avec validation préalable)

    Indicateurs non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; revient à `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|anthropic>` (facultatif ; `openai` par défaut)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l'authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement du modèle :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le fournisseur et le modèle.
- Lorsque l'onboarding démarre à partir d'un choix d'authentification de fournisseur, le sélecteur de modèle privilégie
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, cette même préférence
  correspond aussi à leurs variantes coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur préféré serait vide, le sélecteur revient
  au catalogue complet au lieu de n'afficher aucun modèle.
- L'assistant exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si l'authentification est manquante.

Chemins des identifiants et des profils :

- Profils d'authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement par défaut de l'onboarding conserve les clés API sous forme de valeurs en clair dans les profils d'authentification.
- `--secret-input-mode ref` active le mode référence à la place du stockage de clé en clair.
  En configuration interactive, vous pouvez choisir l'un des deux :
  - référence de variable d'environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - référence de fournisseur configuré (`file` ou `exec`) avec alias de fournisseur + id
- Le mode référence interactif exécute une validation préalable rapide avant l'enregistrement.
  - Références d'environnement : valide le nom de la variable + la valeur non vide dans l'environnement d'onboarding courant.
  - Références de fournisseur : valide la configuration du fournisseur et résout l'id demandé.
  - Si la validation préalable échoue, l'onboarding affiche l'erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` ne prend en charge que l'environnement.
  - Définissez la variable d'environnement du fournisseur dans l'environnement du processus d'onboarding.
  - Les indicateurs de clé en ligne (par exemple `--openai-api-key`) exigent que cette variable d'environnement soit définie ; sinon l'onboarding échoue immédiatement.
  - Pour les fournisseurs personnalisés, le mode `ref` non interactif stocke `models.providers.<id>.apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon l'onboarding échoue immédiatement.
- Les identifiants d'authentification de la passerelle prennent en charge les choix en clair et SecretRef en configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en clair** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : en clair ou SecretRef.
- Chemin SecretRef pour jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations existantes en clair continuent de fonctionner sans changement.

<Note>
Conseil pour les environnements headless et serveur : terminez OAuth sur une machine disposant d'un navigateur, puis copiez
le `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
`$OPENCLAW_STATE_DIR/...`) vers l'hôte de la passerelle. `credentials/oauth.json`
n'est qu'une source d'import héritée.
</Note>

## Sorties et éléments internes

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (l'onboarding local utilise par défaut `"coding"` lorsqu'il n'est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, liaison, authentification, tailscale)
- `session.dmScope` (l'onboarding local définit par défaut cette valeur sur `per-channel-peer` lorsqu'elle n'est pas définie ; les valeurs explicites existantes sont conservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d'autorisation de canaux (Slack, Discord, Matrix, Microsoft Teams) lorsque vous activez l'option pendant les invites (les noms sont résolus en ID lorsque c'est possible)
- `skills.install.nodeManager`
  - L'indicateur `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours définir ultérieurement `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et des `bindings` facultatifs.

Les identifiants WhatsApp sont stockés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont fournis sous forme de plugins. Lorsqu'ils sont sélectionnés pendant la configuration, l'assistant
demande d'installer le plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC de l'assistant de passerelle :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et interface de contrôle) peuvent afficher les étapes sans réimplémenter la logique d'onboarding.

Comportement de la configuration Signal :

- Télécharge la ressource de version appropriée
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM exigent Java 21
- Les builds natifs sont utilisés lorsqu'ils sont disponibles
- Windows utilise WSL2 et suit le flux Linux signal-cli à l'intérieur de WSL

## Documentation associée

- Hub d'onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation de la CLI](/fr/start/wizard-cli-automation)
- Référence de commande : [`openclaw onboard`](/cli/onboard)
