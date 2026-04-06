---
read_when:
    - Vous voulez comprendre OAuth de bout en bout dans OpenClaw
    - Vous rencontrez des problèmes d’invalidation de jetons / de déconnexion
    - Vous voulez des flux d’authentification Claude CLI ou OAuth
    - Vous voulez plusieurs comptes ou un routage par profil
summary: 'OAuth dans OpenClaw : échange de jetons, stockage et modèles multi-comptes'
title: OAuth
x-i18n:
    generated_at: "2026-04-06T03:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 402e20dfeb6ae87a90cba5824a56a7ba3b964f3716508ea5cc48a47e5affdd73
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw prend en charge la « subscription auth » via OAuth pour les fournisseurs qui la proposent
(notamment **OpenAI Codex (ChatGPT OAuth)**). Pour Anthropic, la distinction pratique
est désormais la suivante :

- **Clé API Anthropic** : facturation API Anthropic normale
- **Subscription auth Anthropic dans OpenClaw** : Anthropic a informé les utilisateurs
  d’OpenClaw le **4 avril 2026 à 12:00 PM PT / 8:00 PM BST** que cela
  nécessite désormais **Extra Usage**

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation dans des outils externes comme
OpenClaw. Cette page explique :

Pour Anthropic en production, l’authentification par clé API est la voie recommandée la plus sûre.

- comment fonctionne l’**échange de jetons** OAuth (PKCE)
- où les jetons sont **stockés** (et pourquoi)
- comment gérer **plusieurs comptes** (profils + remplacements par session)

OpenClaw prend également en charge des **plugins de fournisseur** qui livrent leurs propres flux OAuth ou à clé API.
Exécutez-les via :

```bash
openclaw models auth login --provider <id>
```

## Le puits à jetons (pourquoi il existe)

Les fournisseurs OAuth émettent souvent un **nouveau jeton d’actualisation** pendant les flux de connexion/d’actualisation. Certains fournisseurs (ou clients OAuth) peuvent invalider les anciens jetons d’actualisation lorsqu’un nouveau est émis pour le même utilisateur/la même application.

Symptôme pratique :

- vous vous connectez via OpenClaw _et_ via Claude Code / Codex CLI → l’un des deux finit aléatoirement par être « déconnecté »

Pour réduire ce problème, OpenClaw traite `auth-profiles.json` comme un **puits à jetons** :

- l’exécution lit les identifiants depuis **un seul endroit**
- nous pouvons conserver plusieurs profils et les router de manière déterministe
- lorsque les identifiants sont réutilisés depuis une CLI externe comme Codex CLI, OpenClaw
  les reflète avec leur provenance et relit cette source externe au lieu
  de faire lui-même tourner le jeton d’actualisation

## Stockage (où les jetons sont stockés)

Les secrets sont stockés **par agent** :

- Profils d’authentification (OAuth + clés API + références facultatives au niveau des valeurs) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Fichier de compatibilité historique : `~/.openclaw/agents/<agentId>/agent/auth.json`
  (les entrées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes)

Fichier historique d’import uniquement (toujours pris en charge, mais pas le stockage principal) :

- `~/.openclaw/credentials/oauth.json` (importé dans `auth-profiles.json` lors de la première utilisation)

Tout ce qui précède respecte également `$OPENCLAW_STATE_DIR` (remplacement du répertoire d’état). Référence complète : [/gateway/configuration](/fr/gateway/configuration-reference#auth-storage)

Pour les références statiques vers des secrets et le comportement d’activation par instantané d’exécution, voir [Gestion des secrets](/fr/gateway/secrets).

## Compatibilité historique des jetons Anthropic

<Warning>
La documentation publique de Claude Code d’Anthropic indique que l’utilisation directe de Claude Code reste dans les limites
de l’abonnement Claude. Séparément, Anthropic a indiqué aux utilisateurs d’OpenClaw le
**4 avril 2026 à 12:00 PM PT / 8:00 PM BST** qu’**OpenClaw compte comme un
outil tiers**. Les profils de jetons Anthropic existants restent techniquement
utilisables dans OpenClaw, mais Anthropic indique désormais que le chemin OpenClaw nécessite **Extra
Usage** (paiement à l’usage facturé séparément de l’abonnement) pour ce
trafic.

Pour la documentation actuelle d’Anthropic sur les offres directes Claude Code, voir [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
et [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si vous voulez d’autres options de type abonnement dans OpenClaw, voir [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding
Plan](/fr/providers/qwen), [MiniMax Coding Plan](/fr/providers/minimax),
et [Z.AI / GLM Coding Plan](/fr/providers/glm).
</Warning>

OpenClaw expose maintenant de nouveau le setup-token Anthropic comme chemin historique/manuel.
L’avis de facturation Anthropic spécifique à OpenClaw s’applique toujours à ce chemin, donc
utilisez-le en considérant qu’Anthropic exige **Extra Usage** pour le
trafic de connexion Claude piloté par OpenClaw.

## Migration Anthropic Claude CLI

Anthropic ne propose plus de chemin pris en charge de migration locale depuis Claude CLI dans
OpenClaw. Utilisez des clés API Anthropic pour le trafic Anthropic, ou conservez l’authentification
historique basée sur des jetons uniquement là où elle est déjà configurée et en considérant
qu’Anthropic traite ce chemin OpenClaw comme **Extra Usage**.

## Échange OAuth (comment fonctionne la connexion)

Les flux de connexion interactifs d’OpenClaw sont implémentés dans `@mariozechner/pi-ai` et connectés aux assistants/commandes.

### Setup-token Anthropic

Forme du flux :

1. démarrer le setup-token Anthropic ou coller un jeton depuis OpenClaw
2. OpenClaw stocke l’identifiant Anthropic obtenu dans un profil d’authentification
3. la sélection du modèle reste sur `anthropic/...`
4. les profils d’authentification Anthropic existants restent disponibles pour le rollback/le contrôle de l’ordre

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth est explicitement pris en charge pour une utilisation en dehors de Codex CLI, y compris dans les flux de travail OpenClaw.

Forme du flux (PKCE) :

1. générer le vérificateur/challenge PKCE + un `state` aléatoire
2. ouvrir `https://auth.openai.com/oauth/authorize?...`
3. essayer de capturer le callback sur `http://127.0.0.1:1455/auth/callback`
4. si le callback ne peut pas se lier (ou si vous êtes à distance/sans interface), coller l’URL ou le code de redirection
5. échanger sur `https://auth.openai.com/oauth/token`
6. extraire `accountId` du jeton d’accès et stocker `{ access, refresh, expires, accountId }`

Le chemin de l’assistant est `openclaw onboard` → choix d’authentification `openai-codex`.

## Actualisation + expiration

Les profils stockent un horodatage `expires`.

À l’exécution :

- si `expires` est dans le futur → utiliser le jeton d’accès stocké
- s’il a expiré → actualiser (sous verrouillage de fichier) et écraser les identifiants stockés
- exception : les identifiants réutilisés d’une CLI externe restent gérés en externe ; OpenClaw
  relit le stockage d’authentification de la CLI et n’utilise jamais lui-même le jeton d’actualisation copié

Le flux d’actualisation est automatique ; vous n’avez généralement pas besoin de gérer les jetons manuellement.

## Plusieurs comptes (profils) + routage

Deux modèles :

### 1) Préféré : agents séparés

Si vous voulez que « personnel » et « travail » n’interagissent jamais, utilisez des agents isolés (sessions + identifiants + espace de travail séparés) :

```bash
openclaw agents add work
openclaw agents add personal
```

Configurez ensuite l’authentification par agent (assistant) et routez les discussions vers le bon agent.

### 2) Avancé : plusieurs profils dans un même agent

`auth-profiles.json` prend en charge plusieurs identifiants de profil pour le même fournisseur.

Choisissez le profil utilisé :

- globalement via l’ordre de configuration (`auth.order`)
- par session via `/model ...@<profileId>`

Exemple (remplacement de session) :

- `/model Opus@anthropic:work`

Comment voir quels identifiants de profil existent :

- `openclaw channels list --json` (affiche `auth[]`)

Documentation associée :

- [/concepts/model-failover](/fr/concepts/model-failover) (règles de rotation + de cooldown)
- [/tools/slash-commands](/fr/tools/slash-commands) (surface de commande)

## Lié

- [Authentification](/fr/gateway/authentication) — vue d’ensemble de l’authentification des fournisseurs de modèles
- [Secrets](/fr/gateway/secrets) — stockage des identifiants et SecretRef
- [Référence de configuration](/fr/gateway/configuration-reference#auth-storage) — clés de configuration de l’authentification
