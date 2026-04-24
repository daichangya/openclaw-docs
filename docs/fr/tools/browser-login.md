---
read_when:
    - Vous devez vous connecter à des sites pour l’automatisation du navigateur
    - Vous voulez publier des mises à jour sur X/Twitter
summary: connexions manuelles pour l’automatisation du navigateur + publication sur X/Twitter
title: connexion du navigateur
x-i18n:
    generated_at: "2026-04-24T07:34:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# Connexion du navigateur + publication sur X/Twitter

## Connexion manuelle (recommandée)

Lorsqu’un site exige une connexion, **connectez-vous manuellement** dans le profil de navigateur **hôte** (le navigateur openclaw).

Ne donnez **pas** vos identifiants au modèle. Les connexions automatisées déclenchent souvent des défenses anti-bot et peuvent verrouiller le compte.

Retour à la documentation principale du navigateur : [Navigateur](/fr/tools/browser).

## Quel profil Chrome est utilisé ?

OpenClaw contrôle un **profil Chrome dédié** (nommé `openclaw`, interface teintée d’orange). Il est distinct de votre profil de navigateur quotidien.

Pour les appels d’outil navigateur de l’agent :

- Choix par défaut : l’agent doit utiliser son navigateur `openclaw` isolé.
- Utilisez `profile="user"` uniquement lorsque les sessions déjà connectées sont importantes et que l’utilisateur est à l’ordinateur pour cliquer/approuver toute invite d’attachement.
- Si vous avez plusieurs profils de navigateur utilisateur, spécifiez explicitement le profil au lieu de deviner.

Deux façons simples d’y accéder :

1. **Demandez à l’agent d’ouvrir le navigateur** puis connectez-vous vous-même.
2. **Ouvrez-le via la CLI** :

```bash
openclaw browser start
openclaw browser open https://x.com
```

Si vous avez plusieurs profils, passez `--browser-profile <name>` (la valeur par défaut est `openclaw`).

## X/Twitter : flux recommandé

- **Lecture/recherche/fils :** utilisez le navigateur **hôte** (connexion manuelle).
- **Publication de mises à jour :** utilisez le navigateur **hôte** (connexion manuelle).

## Sandboxing + accès au navigateur hôte

Les sessions de navigateur sandboxées sont **plus susceptibles** de déclencher la détection de bot. Pour X/Twitter (et les autres sites stricts), préférez le navigateur **hôte**.

Si l’agent est sandboxé, l’outil navigateur utilise par défaut le sandbox. Pour autoriser le contrôle de l’hôte :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Puis ciblez le navigateur hôte :

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Ou désactivez le sandboxing pour l’agent qui publie des mises à jour.

## Liens associés

- [Navigateur](/fr/tools/browser)
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage du navigateur WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
