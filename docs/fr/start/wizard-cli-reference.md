---
read_when:
    - Vous avez besoin du comportement détaillé de `openclaw onboard`
    - Vous déboguez les résultats de l'onboarding ou intégrez des clients d'onboarding
sidebarTitle: CLI reference
summary: Référence complète du flux de configuration de la CLI, de la configuration auth/modèle, des sorties et des éléments internes
title: Référence de configuration de la CLI
x-i18n:
    generated_at: "2026-04-05T12:55:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Référence de configuration de la CLI

Cette page est la référence complète de `openclaw onboard`.
Pour le guide court, voir [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l'assistant

Le mode local (par défaut) vous guide à travers :

- La configuration du modèle et de l'authentification (abonnement OpenAI Code avec OAuth, Anthropic Claude CLI ou clé API, ainsi que les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- L'emplacement du workspace et les fichiers d'amorçage
- Les paramètres de la gateway (port, bind, auth, tailscale)
- Les canaux et fournisseurs (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles et autres plugins de canal groupés)
- L'installation du démon (LaunchAgent, unité utilisateur systemd ou tâche planifiée Windows native avec repli vers le dossier Démarrage)
- La vérification d'état
- La configuration des Skills

Le mode distant configure cette machine pour se connecter à une gateway située ailleurs.
Il n'installe ni ne modifie rien sur l'hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection d'une configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Relancer l'assistant n'efface rien, sauf si vous choisissez explicitement Réinitialiser (ou passez `--reset`).
    - Dans la CLI, `--reset` cible par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi le workspace.
    - Si la configuration est invalide ou contient des clés héritées, l'assistant s'arrête et vous demande d'exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` et propose les portées suivantes :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi le workspace)
  </Step>
  <Step title="Modèle et auth">
    - La matrice complète des options figure dans [Options d'authentification et de modèle](#options-dauthentification-et-de-modele).
  </Step>
  <Step title="Workspace">
    - Valeur par défaut `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers du workspace nécessaires pour le rituel d'amorçage du premier lancement.
    - Structure du workspace : [Workspace d'agent](/fr/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Demande le port, le bind, le mode auth et l'exposition Tailscale.
    - Recommandé : gardez l'authentification par jeton activée même pour le loopback afin que les clients WS locaux doivent s'authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte brut** (par défaut)
      - **Utiliser SecretRef** (option)
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en texte brut ou avec SecretRef.
    - Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d'environnement non vide dans l'environnement du processus d'onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez auth uniquement si vous faites entièrement confiance à tous les processus locaux.
    - Les binds hors loopback nécessitent toujours auth.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative
    - [Telegram](/fr/channels/telegram) : jeton du bot
    - [Discord](/fr/channels/discord) : jeton du bot
    - [Google Chat](/fr/channels/googlechat) : JSON du compte de service + audience du webhook
    - [Mattermost](/fr/channels/mattermost) : jeton du bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [BlueBubbles](/fr/channels/bluebubbles) : recommandé pour iMessage ; URL du serveur + mot de passe + webhook
    - [iMessage](/fr/channels/imessage) : chemin de la CLI héritée `imsg` + accès à la base de données
    - Sécurité des messages privés : le mode par défaut est l'appairage. Le premier message privé envoie un code ; approuvez-le via
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d'autorisation.
  </Step>
  <Step title="Installation du démon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour un environnement sans interface, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L'assistant tente `loginctl enable-linger <user>` pour que la gateway reste active après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d'abord sans sudo.
    - Windows natif : tâche planifiée d'abord
      - Si la création de tâche est refusée, OpenClaw bascule vers un élément de connexion par utilisateur dans le dossier Démarrage et lance immédiatement la gateway.
      - Les tâches planifiées restent préférées car elles offrent un meilleur état du superviseur.
    - Sélection du runtime : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n'est pas recommandé.
  </Step>
  <Step title="Vérification d'état">
    - Démarre la gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d'état en direct de la gateway à la sortie d'état, y compris les sondes de canaux quand elles sont prises en charge.
  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les prérequis.
    - Vous permet de choisir le gestionnaire Node : npm, pnpm ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Fin">
    - Résumé et prochaines étapes, y compris les options d'application iOS, Android et macOS.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n'est détectée, l'assistant affiche les instructions de redirection de port SSH pour l'interface utilisateur Control au lieu d'ouvrir un navigateur.
Si les ressources de l'interface utilisateur Control sont absentes, l'assistant tente de les construire ; la solution de repli est `pnpm ui:build` (installe automatiquement les dépendances de l'UI).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour se connecter à une gateway située ailleurs.

<Info>
Le mode distant n'installe ni ne modifie rien sur l'hôte distant.
</Info>

Ce que vous configurez :

- URL de la gateway distante (`ws://...`)
- Jeton si l'authentification de la gateway distante est requise (recommandé)

<Note>
- Si la gateway est limitée au loopback, utilisez un tunnel SSH ou un tailnet.
- Indications de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)
</Note>

## Options d'authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé API Anthropic">
    Utilise `ANTHROPIC_API_KEY` s'il est présent ou demande une clé, puis l'enregistre pour l'utilisation par le démon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Réutilise une connexion locale Claude CLI sur l'hôte de la gateway et bascule la
    sélection du modèle vers une référence canonique `claude-cli/claude-*`.

    Il s'agit d'un chemin de repli local disponible dans `openclaw onboard` et
    `openclaw configure`. Pour la production, préférez une clé API Anthropic.

    - macOS : vérifie l'élément du trousseau « Claude Code-credentials »
    - Linux et Windows : réutilise `~/.claude/.credentials.json` s'il est présent

    Sur macOS, choisissez « Toujours autoriser » pour que les démarrages via launchd ne soient pas bloqués.

  </Accordion>
  <Accordion title="Abonnement OpenAI Code (réutilisation de Codex CLI)">
    Si `~/.codex/auth.json` existe, l'assistant peut le réutiliser.
    Les identifiants Codex CLI réutilisés restent gérés par Codex CLI ; à l'expiration, OpenClaw
    relit d'abord cette source et, lorsque le fournisseur peut les actualiser, écrit
    l'identifiant actualisé dans le stockage Codex au lieu d'en prendre lui-même
    la gestion.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.4` lorsque le modèle n'est pas défini ou vaut `openai/*`.

  </Accordion>
  <Accordion title="Clé API OpenAI">
    Utilise `OPENAI_API_KEY` s'il est présent ou demande une clé, puis stocke l'identifiant dans les profils d'authentification.

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
    Demande l'ID du compte, l'ID de la gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur hébergée par défaut est `MiniMax-M2.7` ; la configuration par clé API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur des endpoints Chine ou globaux.
    La version standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud et modèles ouverts locaux)">
    Demande l'URL de base (par défaut `http://127.0.0.1:11434`), puis propose le mode Cloud + Local ou Local.
    Détecte les modèles disponibles et suggère des valeurs par défaut.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec des endpoints compatibles OpenAI et compatibles Anthropic.

    L'onboarding interactif prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API de fournisseur :
    - **Coller la clé API maintenant** (texte brut)
    - **Utiliser une référence secrète** (référence d'environnement ou référence de fournisseur configurée, avec validation préalable)

    Indicateurs non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; utilise `CUSTOM_API_KEY` en repli)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|anthropic>` (facultatif ; `openai` par défaut)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse auth non configuré.
  </Accordion>
</AccordionGroup>

Comportement du modèle :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le fournisseur et le modèle.
- Lorsque l'onboarding commence à partir d'un choix d'authentification de fournisseur, le sélecteur de modèle préfère
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, cette même préférence
  correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur préféré serait vide, le sélecteur revient
  au catalogue complet au lieu de n'afficher aucun modèle.
- L'assistant exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si auth est manquant.

Chemins des identifiants et des profils :

- Profils d'authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement par défaut de l'onboarding conserve les clés API comme valeurs en texte brut dans les profils d'authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage de clé en texte brut.
  Dans la configuration interactive, vous pouvez choisir :
  - référence de variable d'environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - référence de fournisseur configuré (`file` ou `exec`) avec alias du fournisseur + id
- Le mode référence interactif exécute une validation préalable rapide avant l'enregistrement.
  - Références d'environnement : valide le nom de variable + la valeur non vide dans l'environnement actuel de l'onboarding.
  - Références de fournisseur : valide la configuration du fournisseur et résout l'id demandé.
  - Si la validation préalable échoue, l'onboarding affiche l'erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` est uniquement pris en charge avec l'environnement.
  - Définissez la variable d'environnement du fournisseur dans l'environnement du processus d'onboarding.
  - Les indicateurs de clé en ligne (par exemple `--openai-api-key`) exigent que cette variable d'environnement soit définie ; sinon, l'onboarding échoue immédiatement.
  - Pour les fournisseurs personnalisés, le mode `ref` non interactif stocke `models.providers.<id>.apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon, l'onboarding échoue immédiatement.
- Les identifiants d'authentification de la gateway prennent en charge les choix texte brut et SecretRef en configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en texte brut** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : texte brut ou SecretRef.
- Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations existantes en texte brut continuent de fonctionner sans changement.

<Note>
Conseil pour les environnements headless et serveurs : terminez OAuth sur une machine disposant d'un navigateur, puis copiez
le `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
`$OPENCLAW_STATE_DIR/...`) vers l'hôte de la gateway. `credentials/oauth.json`
n'est qu'une source d'import héritée.
</Note>

## Sorties et éléments internes

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (l'onboarding local le définit par défaut sur `"coding"` s'il n'est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (l'onboarding local le définit par défaut sur `per-channel-peer` s'il n'est pas défini ; les valeurs explicites existantes sont conservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d'autorisation de canaux (Slack, Discord, Matrix, Microsoft Teams) lorsque vous activez cette option pendant les invites (les noms sont résolus en ID lorsque c'est possible)
- `skills.install.nodeManager`
  - L'indicateur `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours définir `skills.install.nodeManager: "yarn"` plus tard.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et des `bindings` facultatifs.

Les identifiants WhatsApp sont placés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont fournis sous forme de plugins. Lorsqu'ils sont sélectionnés pendant la configuration, l'assistant
vous invite à installer le plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC de l'assistant de gateway :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et interface utilisateur Control) peuvent afficher les étapes sans réimplémenter la logique d'onboarding.

Comportement de la configuration Signal :

- Télécharge la ressource de version appropriée
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM nécessitent Java 21
- Les builds natifs sont utilisés lorsqu'ils sont disponibles
- Windows utilise WSL2 et suit le flux Linux signal-cli à l'intérieur de WSL

## Documentation associée

- Hub d'onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation de la CLI](/start/wizard-cli-automation)
- Référence de commande : [`openclaw onboard`](/cli/onboard)
