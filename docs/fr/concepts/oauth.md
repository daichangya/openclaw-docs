---
read_when:
    - Vous voulez comprendre OAuth dans OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation de jeton / de déconnexion
    - Vous voulez des flux d’authentification Claude CLI ou OAuth
    - Vous voulez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T12:40:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw prend en charge « l’authentification par abonnement » via OAuth pour les fournisseurs qui la proposent
(notamment **OpenAI Codex (ChatGPT OAuth)**). Pour les abonnements Anthropic, une nouvelle
configuration doit utiliser le chemin de connexion local **Claude CLI** sur l’hôte de la passerelle, mais
Anthropic distingue l’utilisation directe de Claude Code du chemin de réutilisation d’OpenClaw. La documentation publique d’Anthropic sur Claude Code indique que l’utilisation directe de Claude Code reste
dans les limites de l’abonnement Claude. Séparément, Anthropic a informé les utilisateurs d’OpenClaw le **4 avril 2026 à 12:00 PM PT / 8:00 PM BST** qu’OpenClaw est compté comme
un harnais tiers et requiert désormais **Extra Usage** pour ce trafic.
OpenAI Codex OAuth est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé API est la voie recommandée la plus sûre.

- comment fonctionne l’**échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + surcharges par session)

OpenClaw prend également en charge des **plugins de fournisseur** qui livrent leur propre flux OAuth ou API‑key.
Exécutez-les via :

```bash
openclaw models auth login --provider <id>
```

## Le puits à jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau jeton d’actualisation** pendant les flux de connexion/actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau est émis pour le même utilisateur/la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux se retrouve ensuite « déconnecté » de manière aléatoire

Pour réduire cela, OpenClaw traite `auth-profiles.json` comme un **puits à jetons** :

- le runtime lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les router de manière déterministe
- lorsque des identifiants sont réutilisés depuis une CLI externe comme Codex CLI, OpenClaw
  les reflète avec leur provenance et relit cette source externe au lieu
  de faire lui-même tourner le jeton d’actualisation

## Stockage (où vivent les jetons)

Les secrets sont stockés **par agent** :

- Profils d’authentification (OAuth + clés API + refs facultatives au niveau valeur) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes)

Fichier hérité d’import uniquement (toujours pris en charge, mais pas le magasin principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation)

Tout ce qui précède respecte aussi `$OPENCLAW_STATE_DIR` (surcharge du répertoire d’état). Référence complète : [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Pour les refs de secrets statiques et le comportement d’activation des instantanés à l’exécution, voir [Gestion des secrets](/gateway/secrets).

## Compatibilité héritée avec les jetons Anthropic

<Warning>
La documentation publique d’Anthropic sur Claude Code indique que l’utilisation directe de Claude Code reste dans
les limites de l’abonnement Claude. Séparément, Anthropic a indiqué aux utilisateurs d’OpenClaw le
**4 avril 2026 à 12:00 PM PT / 8:00 PM BST** qu’**OpenClaw est compté comme un
harnais tiers**. Les profils de jetons Anthropic existants restent techniquement
utilisables dans OpenClaw, mais Anthropic indique désormais que le chemin OpenClaw nécessite **Extra
Usage** (facturation à l’usage séparée de l’abonnement) pour ce
trafic.

Pour la documentation actuelle d’Anthropic sur les offres directes Claude Code, voir [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, voir [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
et [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw expose désormais de nouveau le setup-token Anthropic comme chemin hérité/manuel.
L’avis de facturation spécifique à OpenClaw d’Anthropic s’applique toujours à ce chemin, donc
utilisez-le en partant du principe qu’Anthropic exige **Extra Usage** pour
le trafic Claude-login piloté par OpenClaw.

## Migration Anthropic Claude CLI

Si Claude CLI est déjà installé et connecté sur l’hôte de la passerelle, vous pouvez
basculer la sélection du modèle Anthropic vers le backend CLI local. C’est un
chemin OpenClaw pris en charge lorsque vous voulez réutiliser une connexion Claude CLI locale sur le
même hôte.

Prérequis :

- le binaire `claude` est installé sur l’hôte de la passerelle
- Claude CLI y est déjà authentifié via `claude auth login`

Commande de migration :

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Raccourci d’onboarding :

```bash
openclaw onboard --auth-choice anthropic-cli
```

Cela conserve les profils d’authentification Anthropic existants pour un rollback, mais réécrit le chemin principal
du modèle par défaut de `anthropic/...` vers `claude-cli/...`, réécrit les fallbacks Anthropic Claude correspondants, et ajoute des entrées de liste d’autorisation `claude-cli/...` correspondantes sous `agents.defaults.models`.

Vérifier :

```bash
openclaw models status
```

## Échange OAuth (comment fonctionne la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@mariozechner/pi-ai` et câblés dans les assistants/commandes.

### Anthropic Claude CLI

Forme du flux :

Chemin Claude CLI :

1. connectez-vous avec `claude auth login` sur l’hôte de la passerelle
2. exécutez `openclaw models auth login --provider anthropic --method cli --set-default`
3. ne stockez aucun nouveau profil d’authentification ; basculez la sélection de modèle vers `claude-cli/...`
4. conservez les profils d’authentification Anthropic existants pour un rollback

La documentation publique d’Anthropic sur Claude Code décrit ce flux direct de
connexion par abonnement Claude pour `claude` lui-même. OpenClaw peut réutiliser cette connexion locale, mais
Anthropic classe séparément le chemin contrôlé par OpenClaw comme usage de harnais tiers à des fins de facturation.

Chemin de l’assistant interactif :

- `openclaw onboard` / `openclaw configure` → choix d’authentification `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation en dehors de la Codex CLI, y compris dans les workflows OpenClaw.

Forme du flux (PKCE) :

1. générer le verifier/challenge PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. essayer de capturer le callback sur `http://127.0.0.1:1455/auth/callback`
4. si le callback ne peut pas se binder (ou si vous êtes à distance/sans interface), coller l’URL ou le code de redirection
5. échanger sur `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

À l’exécution :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- s’il a expiré → actualiser (sous verrou de fichier) et écraser les identifiants stockés
- exception : les identifiants réutilisés d’une CLI externe restent gérés en externe ; OpenClaw
  relit le magasin d’authentification de la CLI et n’utilise jamais lui-même le jeton d’actualisation copié

Le flux d’actualisation est automatique ; en général vous n’avez pas besoin de gérer les jetons manuellement.

## Comptes multiples (profils) + routage

Deux modèles :

### 1) Préféré : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et routez les discussions vers le bon agent.

### 2) Avancé : plusieurs profils dans un seul agent

`auth-profiles.json` prend en charge plusieurs identifiants de profil pour le même fournisseur.

Choisissez quel profil est utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (surcharge de session) :

- `/model Opus@anthropic:work`

Comment voir quels identifiants de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [/concepts/model-failover](/concepts/model-failover) (règles de rotation + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (surface de commandes)

## Lié

- [Authentification](/gateway/authentication) — vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/gateway/secrets) — stockage des identifiants et SecretRef
- [Référence de configuration](/gateway/configuration-reference#auth-storage) — clés de configuration d’authentification
