---
read_when:
    - Vous souhaitez comprendre OAuth dans OpenClaw de bout en bout
    - Vous rencontrez des problèmes d’invalidation de jeton / de déconnexion
    - Vous souhaitez des flux d’authentification Claude CLI ou OAuth
    - Vous souhaitez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T07:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw prend en charge « l’authentification par abonnement » via OAuth pour les fournisseurs qui la proposent
(en particulier **OpenAI Codex (OAuth ChatGPT)**). Pour Anthropic, la séparation pratique
est désormais la suivante :

- **Clé API Anthropic** : facturation API Anthropic normale
- **Authentification Anthropic Claude CLI / par abonnement dans OpenClaw** : le personnel d’Anthropic
  nous a indiqué que cet usage est de nouveau autorisé

OAuth OpenAI Codex est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé API reste la voie recommandée la plus sûre.

- comment fonctionne **l’échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend également en charge des **plugins de fournisseur** qui embarquent leurs propres flux OAuth ou par clé API.
Exécutez-les avec :

```bash
openclaw models auth login --provider <id>
```

## Le puits à jetons (pourquoi il existe)

Les fournisseurs OAuth émettent couramment un **nouveau refresh token** lors des flux de connexion/rafraîchissement. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens refresh tokens lorsqu’un nouveau est émis pour le même utilisateur/la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux finit aléatoirement par être « déconnecté »

Pour réduire cela, OpenClaw traite `auth-profiles.json` comme un **puits à jetons** :

- le runtime lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les router de façon déterministe
- lorsque les identifiants sont réutilisés depuis une CLI externe comme Codex CLI, OpenClaw
  les reflète avec leur provenance et relit cette source externe au lieu
  de faire lui-même tourner le refresh token

## Stockage (où vivent les jetons)

Les secrets sont stockés **par agent** :

- Profils d’authentification (OAuth + clés API + éventuelles références au niveau de la valeur) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité hérité : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes)

Fichier hérité d’import uniquement (toujours pris en charge, mais plus le stockage principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` à la première utilisation)

Tout ce qui précède respecte aussi `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les références de secret statiques et le comportement d’activation des instantanés runtime, voir [Gestion des secrets](/fr/gateway/secrets).

## Compatibilité avec les jetons Anthropic hérités

<Warning>
La documentation publique de Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans
les limites d’abonnement Claude, et le personnel d’Anthropic nous a indiqué que l’utilisation de Claude
CLI de type OpenClaw est de nouveau autorisée. OpenClaw traite donc la réutilisation de Claude CLI et
l’usage de `claude -p` comme autorisés pour cette intégration, sauf si Anthropic
publie une nouvelle politique.

Pour la documentation actuelle d’Anthropic sur les offres directes Claude Code, voir [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous souhaitez d’autres options de type abonnement dans OpenClaw, consultez [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding
Plan](/fr/providers/qwen), [MiniMax Coding Plan](/fr/providers/minimax),
et [Z.AI / GLM Coding Plan](/fr/providers/glm).
</Warning>

OpenClaw expose également le setup-token Anthropic comme chemin d’authentification par jeton pris en charge, mais préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Migration Anthropic Claude CLI

OpenClaw prend de nouveau en charge la réutilisation d’Anthropic Claude CLI. Si vous avez déjà une connexion
Claude locale sur l’hôte, l’onboarding/la configuration peut la réutiliser directement.

## Échange OAuth (comment fonctionne la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@mariozechner/pi-ai` et raccordés aux assistants/commandes.

### Anthropic setup-token

Forme du flux :

1. démarrer setup-token Anthropic ou paste-token depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic résultant dans un profil d’authentification
3. la sélection de modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le retour arrière/le contrôle d’ordre

### OpenAI Codex (OAuth ChatGPT)

OAuth OpenAI Codex est explicitement pris en charge pour un usage en dehors de Codex CLI, y compris les flux OpenClaw.

Forme du flux (PKCE) :

1. générer un vérificateur/challenge PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. tenter de capturer le callback sur `http://127.0.0.1:1455/auth/callback`
4. si le callback ne peut pas être lié (ou si vous êtes à distance/en headless), coller l’URL/code de redirection
5. effectuer l’échange sur `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin via l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Rafraîchissement + expiration

Les profils stockent un horodatage `expires`.

Au runtime :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- s’il est expiré → le rafraîchir (sous verrou de fichier) et écraser les identifiants stockés
- exception : les identifiants CLI externes réutilisés restent gérés de l’extérieur ; OpenClaw
  relit le stockage d’authentification de la CLI et ne consomme jamais lui-même le refresh token copié

Le flux de rafraîchissement est automatique ; en général, vous n’avez pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Recommandé : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Ensuite, configurez l’authentification par agent (assistant) et routez les chats vers le bon agent.

### 2) Avancé : plusieurs profils dans un même agent

`auth-profiles.json` prend en charge plusieurs ID de profil pour un même fournisseur.

Choisissez quel profil est utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement par session) :

- `/model Opus@anthropic:work`

Comment voir quels ID de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [/concepts/model-failover](/fr/concepts/model-failover) (règles de rotation + cooldown)
- [/tools/slash-commands](/fr/tools/slash-commands) (surface de commandes)

## Associé

- [Authentication](/fr/gateway/authentication) — vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) — stockage des identifiants et SecretRef
- [Configuration Reference](/fr/gateway/configuration-reference#auth-storage) — clés de configuration d’authentification
