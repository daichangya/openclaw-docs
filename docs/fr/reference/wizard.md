---
read_when:
    - Rechercher une étape ou une option précise de l’onboarding
    - Automatiser l’onboarding avec le mode non interactif
    - Déboguer le comportement de l’onboarding
sidebarTitle: Onboarding Reference
summary: 'Référence complète de l’onboarding CLI : chaque étape, option et champ de configuration'
title: Référence de l’onboarding
x-i18n:
    generated_at: "2026-04-24T07:32:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Voici la référence complète de `openclaw onboard`.
Pour une vue d’ensemble de haut niveau, voir [Onboarding (CLI)](/fr/start/wizard).

## Détails du flux (mode local)

<Steps>
  <Step title="Détection d’une configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez **Conserver / Modifier / Réinitialiser**.
    - Relancer l’onboarding **n’efface rien** sauf si vous choisissez explicitement **Réinitialiser**
      (ou passez `--reset`).
    - `--reset` en CLI cible par défaut `config+creds+sessions` ; utilisez `--reset-scope full`
      pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et demande
      d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` (jamais `rm`) et propose les portées :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)
  </Step>
  <Step title="Modèle/Auth">
    - **Clé API Anthropic** : utilise `ANTHROPIC_API_KEY` si présente ou demande une clé, puis l’enregistre pour l’usage daemon.
    - **Clé API Anthropic** : choix d’assistant Anthropic préféré dans onboarding/configure.
    - **Jeton de setup Anthropic** : toujours disponible dans onboarding/configure, bien qu’OpenClaw préfère désormais la réutilisation de Claude CLI lorsqu’elle est disponible.
    - **Abonnement OpenAI Code (Codex) (OAuth)** : flux navigateur ; collez le `code#state`.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.
    - **Abonnement OpenAI Code (Codex) (pairing d’appareil)** : flux de pairing navigateur avec un code d’appareil de courte durée.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.
    - **Clé API OpenAI** : utilise `OPENAI_API_KEY` si présente ou demande une clé, puis la stocke dans les profils d’authentification.
      - Définit `agents.defaults.model` sur `openai/gpt-5.4` lorsque le modèle n’est pas défini, `openai/*`, ou `openai-codex/*`.
    - **Clé API xAI (Grok)** : demande `XAI_API_KEY` et configure xAI comme fournisseur de modèle.
    - **OpenCode** : demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, à obtenir sur https://opencode.ai/auth) et vous laisse choisir le catalogue Zen ou Go.
    - **Ollama** : propose d’abord **Cloud + Local**, **Cloud only**, ou **Local only**. `Cloud only` demande `OLLAMA_API_KEY` et utilise `https://ollama.com` ; les modes adossés à l’hôte demandent l’URL de base Ollama, découvrent les modèles disponibles, et téléchargent automatiquement le modèle local sélectionné si nécessaire ; `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    - Plus de détails : [Ollama](/fr/providers/ollama)
    - **Clé API** : enregistre la clé pour vous.
    - **Vercel AI Gateway (proxy multi-modèles)** : demande `AI_GATEWAY_API_KEY`.
    - Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway** : demande l’ID de compte, l’ID du Gateway, et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
    - **MiniMax** : la configuration est écrite automatiquement ; la valeur hébergée par défaut est `MiniMax-M2.7`.
      Le setup par clé API utilise `minimax/...`, et le setup OAuth utilise
      `minimax-portal/...`.
    - Plus de détails : [MiniMax](/fr/providers/minimax)
    - **StepFun** : la configuration est écrite automatiquement pour StepFun standard ou Step Plan sur endpoints Chine ou globaux.
    - La version standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    - Plus de détails : [StepFun](/fr/providers/stepfun)
    - **Synthetic (compatible Anthropic)** : demande `SYNTHETIC_API_KEY`.
    - Plus de détails : [Synthetic](/fr/providers/synthetic)
    - **Moonshot (Kimi K2)** : la configuration est écrite automatiquement.
    - **Kimi Coding** : la configuration est écrite automatiquement.
    - Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
    - **Ignorer** : aucune auth configurée pour l’instant.
    - Choisissez un modèle par défaut parmi les options détectées (ou saisissez manuellement fournisseur/modèle). Pour une meilleure qualité et un risque plus faible d’injection de prompt, choisissez le modèle le plus fort de dernière génération disponible dans votre pile fournisseur.
    - L’onboarding exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou s’il manque une auth.
    - Le mode de stockage des clés API utilise par défaut des valeurs auth-profile en clair. Utilisez `--secret-input-mode ref` pour stocker à la place des références adossées à l’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Les profils d’authentification vivent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (clés API + OAuth). `~/.openclaw/credentials/oauth.json` est réservé à l’import hérité.
    - Plus de détails : [/concepts/oauth](/fr/concepts/oauth)
    <Note>
    Astuce headless/serveur : terminez OAuth sur une machine avec navigateur, puis copiez
    le `auth-profiles.json` de cet agent (par exemple
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
    `$OPENCLAW_STATE_DIR/...` correspondant) vers l’hôte gateway. `credentials/oauth.json`
    n’est qu’une source d’import héritée.
    </Note>
  </Step>
  <Step title="Espace de travail">
    - Par défaut `~/.openclaw/workspace` (configurable).
    - Injecte les fichiers d’espace de travail nécessaires au rituel de bootstrap de l’agent.
    - Guide complet de disposition + sauvegarde de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode d’authentification, exposition tailscale.
    - Recommandation d’authentification : conservez **Token** même pour loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode token, le setup interactif propose :
      - **Générer/stocker un jeton en clair** (par défaut)
      - **Utiliser SecretRef** (sur activation)
      - Le quickstart réutilise les SecretRefs existants de `gateway.auth.token` via les fournisseurs `env`, `file`, et `exec` pour le bootstrap du dashboard/de la sonde d’onboarding.
      - Si ce SecretRef est configuré mais ne peut pas être résolu, l’onboarding échoue tôt avec un message de correction clair au lieu de dégrader silencieusement l’auth runtime.
    - En mode mot de passe, le setup interactif prend aussi en charge le stockage en clair ou via SecretRef.
    - Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Exige une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Ne désactivez l’authentification que si vous faites entièrement confiance à tous les processus locaux.
    - Les liaisons non loopback exigent toujours une authentification.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative.
    - [Telegram](/fr/channels/telegram) : jeton de bot.
    - [Discord](/fr/channels/discord) : jeton de bot.
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience webhook.
    - [Mattermost](/fr/channels/mattermost) (plugin) : jeton de bot + URL de base.
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration de compte.
    - [BlueBubbles](/fr/channels/bluebubbles) : **recommandé pour iMessage** ; URL du serveur + mot de passe + webhook.
    - [iMessage](/fr/channels/imessage) : ancien chemin `imsg` CLI + accès DB.
    - Sécurité DM : la valeur par défaut est pairing. Le premier DM envoie un code ; approuvez via `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Recherche web">
    - Choisissez un fournisseur pris en charge comme Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, ou Tavily (ou ignorez cette étape).
    - Les fournisseurs adossés à des API peuvent utiliser des variables d’environnement ou une configuration existante pour un setup rapide ; les fournisseurs sans clé utilisent leurs prérequis spécifiques.
    - Ignorez avec `--skip-search`.
    - Configurez plus tard avec : `openclaw configure --section web`.
  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour du headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux (et Windows via WSL2) : unité utilisateur systemd
      - L’onboarding tente d’activer le lingering via `loginctl enable-linger <user>` afin que le Gateway reste actif après déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - **Sélection du runtime :** Node (recommandé ; requis pour WhatsApp/Telegram). Bun n’est **pas recommandé**.
    - Si l’authentification par token exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas de valeurs de jeton résolues en clair dans les métadonnées d’environnement du service superviseur.
    - Si l’authentification par token exige un jeton et que le SecretRef configuré du jeton est non résolu, l’installation du daemon est bloquée avec une guidance exploitable.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
  </Step>
  <Step title="Vérification d’état">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - Astuce : `openclaw status --deep` ajoute la sonde d’état live du gateway à la sortie de status, y compris les sondes de canal lorsqu’elles sont prises en charge (exige un gateway joignable).
  </Step>
  <Step title="Skills (recommandé)">
    - Lit les Skills disponibles et vérifie les prérequis.
    - Vous laisse choisir un gestionnaire Node : **npm / pnpm** (bun non recommandé).
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Fin">
    - Résumé + prochaines étapes, y compris les apps iOS/Android/macOS pour des fonctionnalités supplémentaires.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’onboarding affiche des instructions de transfert de port SSH pour la Control UI au lieu d’ouvrir un navigateur.
Si les ressources de la Control UI sont manquantes, l’onboarding tente de les construire ; le repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Mode non interactif

Utilisez `--non-interactive` pour automatiser ou script-er l’onboarding :

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

Ajoutez `--json` pour un résumé lisible par machine.

SecretRef de jeton Gateway en mode non interactif :

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
`--json` **n’implique pas** le mode non interactif. Utilisez `--non-interactive` (et `--workspace`) pour les scripts.
</Note>

Des exemples de commandes spécifiques aux fournisseurs figurent dans [Automatisation CLI](/fr/start/wizard-cli-automation#provider-specific-examples).
Utilisez cette page de référence pour la sémantique des options et l’ordre des étapes.

### Ajouter un agent (non interactif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC de l’assistant Gateway

Le Gateway expose le flux d’onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Les clients (app macOS, Control UI) peuvent rendre les étapes sans réimplémenter la logique d’onboarding.

## Configuration Signal (`signal-cli`)

L’onboarding peut installer `signal-cli` depuis les releases GitHub :

- Télécharge l’artefact de release approprié.
- Le stocke sous `~/.openclaw/tools/signal-cli/<version>/`.
- Écrit `channels.signal.cliPath` dans votre configuration.

Remarques :

- Les builds JVM nécessitent **Java 21**.
- Les builds natifs sont utilisés lorsqu’ils sont disponibles.
- Windows utilise WSL2 ; l’installation de `signal-cli` suit le flux Linux dans WSL.

## Ce que l’assistant écrit

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si MiniMax est choisi)
- `tools.profile` (l’onboarding local utilise par défaut `"coding"` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (détails de comportement : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation de canaux (Slack/Discord/Matrix/Microsoft Teams) lorsque vous activez cette option pendant les invites (les noms sont résolus en identifiants lorsque c’est possible).
- `skills.install.nodeManager`
  - `setup --node-manager` accepte `npm`, `pnpm`, ou `bun`.
  - La configuration manuelle peut toujours utiliser `yarn` en définissant directement `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et éventuellement `bindings`.

Les identifiants WhatsApp se trouvent sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

Certains canaux sont livrés sous forme de plugins. Lorsque vous en choisissez un pendant le setup, l’onboarding
vous demandera de l’installer (npm ou chemin local) avant qu’il puisse être configuré.

## Documentation associée

- Vue d’ensemble de l’onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Onboarding de l’app macOS : [Onboarding](/fr/start/onboarding)
- Référence de configuration : [Configuration du Gateway](/fr/gateway/configuration)
- Fournisseurs : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord), [Google Chat](/fr/channels/googlechat), [Signal](/fr/channels/signal), [BlueBubbles](/fr/channels/bluebubbles) (iMessage), [iMessage](/fr/channels/imessage) (hérité)
- Skills : [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config)
