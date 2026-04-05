---
read_when:
    - Vous devez vous connecter à des sites pour l'automatisation du navigateur
    - Vous voulez publier des mises à jour sur X/Twitter
summary: Connexions manuelles pour l'automatisation du navigateur + publication sur X/Twitter
title: Connexion au navigateur
x-i18n:
    generated_at: "2026-04-05T12:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Connexion au navigateur + publication sur X/Twitter

## Connexion manuelle (recommandée)

Lorsqu'un site nécessite une connexion, **connectez-vous manuellement** dans le profil de navigateur **hôte** (le navigateur openclaw).

Ne donnez **pas** vos identifiants au modèle. Les connexions automatisées déclenchent souvent des défenses anti-bot et peuvent verrouiller le compte.

Retour à la documentation principale du navigateur : [Browser](/tools/browser).

## Quel profil Chrome est utilisé ?

OpenClaw contrôle un **profil Chrome dédié** (nommé `openclaw`, avec une interface teintée d'orange). Il est distinct de votre profil de navigateur quotidien.

Pour les appels d'outil de navigateur de l'agent :

- Choix par défaut : l'agent doit utiliser son navigateur `openclaw` isolé.
- Utilisez `profile="user"` uniquement lorsque des sessions déjà connectées sont importantes et que l'utilisateur est devant l'ordinateur pour cliquer/approuver toute invite de rattachement.
- Si vous avez plusieurs profils de navigateur utilisateur, spécifiez explicitement le profil au lieu de deviner.

Deux façons simples d'y accéder :

1. **Demandez à l'agent d'ouvrir le navigateur**, puis connectez-vous vous-même.
2. **Ouvrez-le via la CLI** :

```bash
openclaw browser start
openclaw browser open https://x.com
```

Si vous avez plusieurs profils, passez `--browser-profile <name>` (la valeur par défaut est `openclaw`).

## X/Twitter : flux recommandé

- **Lecture/recherche/fils :** utilisez le navigateur **hôte** (connexion manuelle).
- **Publier des mises à jour :** utilisez le navigateur **hôte** (connexion manuelle).

## Sandboxing + accès au navigateur hôte

Les sessions de navigateur sandboxées sont **plus susceptibles** de déclencher une détection de bot. Pour X/Twitter (et d'autres sites stricts), préférez le navigateur **hôte**.

Si l'agent est sandboxé, l'outil de navigateur cible par défaut le sandbox. Pour autoriser le contrôle de l'hôte :

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

Ciblez ensuite le navigateur hôte :

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Ou désactivez le sandboxing pour l'agent qui publie des mises à jour.
