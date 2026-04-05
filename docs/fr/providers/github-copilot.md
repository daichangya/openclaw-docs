---
read_when:
    - Vous voulez utiliser GitHub Copilot comme fournisseur de modèles
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
summary: Se connecter à GitHub Copilot depuis OpenClaw avec le flux device
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T12:51:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## Qu’est-ce que GitHub Copilot ?

GitHub Copilot est l’assistant de codage IA de GitHub. Il fournit l’accès aux
modèles Copilot pour votre compte et votre forfait GitHub. OpenClaw peut utiliser Copilot comme
fournisseur de modèles de deux façons différentes.

## Deux façons d’utiliser Copilot dans OpenClaw

### 1) Fournisseur GitHub Copilot intégré (`github-copilot`)

Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub, puis l’échanger contre
des jetons d’API Copilot lorsque OpenClaw s’exécute. C’est le chemin **par défaut** et le plus simple
car il ne nécessite pas VS Code.

### 2) Plugin Copilot Proxy (`copilot-proxy`)

Utilisez l’extension VS Code **Copilot Proxy** comme passerelle locale. OpenClaw communique avec
le point de terminaison `/v1` du proxy et utilise la liste de modèles que vous y configurez. Choisissez
cette option si vous exécutez déjà Copilot Proxy dans VS Code ou si vous devez passer par lui.
Vous devez activer le plugin et garder l’extension VS Code en cours d’exécution.

Utilisez GitHub Copilot comme fournisseur de modèles (`github-copilot`). La commande de connexion exécute
le flux device GitHub, enregistre un profil d’authentification et met à jour votre configuration pour utiliser ce
profil.

## Configuration CLI

```bash
openclaw models auth login-github-copilot
```

Une invite vous demandera de visiter une URL et de saisir un code à usage unique. Gardez le terminal
ouvert jusqu’à la fin.

### Drapeaux facultatifs

```bash
openclaw models auth login-github-copilot --yes
```

Pour appliquer également le modèle par défaut recommandé par le fournisseur en une seule étape, utilisez plutôt
la commande générique d’authentification :

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## Définir un modèle par défaut

```bash
openclaw models set github-copilot/gpt-4o
```

### Extrait de configuration

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Remarques

- Nécessite un TTY interactif ; exécutez-la directement dans un terminal.
- La disponibilité des modèles Copilot dépend de votre forfait ; si un modèle est rejeté, essayez
  un autre ID (par exemple `github-copilot/gpt-4.1`).
- Les ID de modèle Claude utilisent automatiquement le transport Anthropic Messages ; les modèles GPT, séries o
  et Gemini conservent le transport OpenAI Responses.
- La connexion stocke un jeton GitHub dans le magasin de profils d’authentification et l’échange contre un
  jeton d’API Copilot lorsque OpenClaw s’exécute.
