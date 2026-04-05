---
read_when:
    - Vous voulez trouver des plugins OpenClaw tiers
    - Vous voulez publier ou référencer votre propre plugin
summary: 'Plugins OpenClaw maintenus par la communauté : parcourir, installer et proposer le vôtre'
title: Plugins communautaires
x-i18n:
    generated_at: "2026-04-05T12:49:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Plugins communautaires

Les plugins communautaires sont des packages tiers qui étendent OpenClaw avec de nouveaux
canaux, outils, fournisseurs ou autres capacités. Ils sont créés et maintenus
par la communauté, publiés sur [ClawHub](/tools/clawhub) ou npm, et
installables avec une seule commande.

ClawHub est la surface de découverte canonique des plugins communautaires. N’ouvrez pas
de PR de documentation uniquement pour ajouter votre plugin ici à des fins de découvrabilité ; publiez-le plutôt sur
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw vérifie d’abord ClawHub puis se rabat automatiquement sur npm.

## Plugins listés

### Codex App Server Bridge

Pont OpenClaw indépendant pour les conversations Codex App Server. Liez un chat à
un fil Codex, parlez-lui en texte simple et contrôlez-le avec des commandes natives au chat pour la reprise, la planification, la revue, la sélection de modèle, la compaction, et plus encore.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Intégration de robot d’entreprise utilisant le mode Stream. Prend en charge le texte, les images et
les messages de fichier via n’importe quel client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management pour OpenClaw. Résumé de conversation basé sur DAG
avec compaction incrémentale — préserve la fidélité complète du contexte
tout en réduisant l’utilisation des jetons.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin officiel qui exporte les traces d’agent vers Opik. Surveillez le comportement de l’agent,
le coût, les jetons, les erreurs, et plus encore.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Connectez OpenClaw à QQ via l’API QQ Bot. Prend en charge les chats privés, les
mentions de groupe, les messages de canal et les médias enrichis, y compris voix, images, vidéos
et fichiers.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom pour OpenClaw par l’équipe Tencent WeCom. Alimenté par
les connexions persistantes WebSocket WeCom Bot, il prend en charge les messages directs et les discussions de groupe,
les réponses en streaming, la messagerie proactive, le traitement d’images/fichiers, le formatage Markdown,
le contrôle d’accès intégré, ainsi que les Skills de document/réunion/messagerie.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Proposer votre plugin

Nous accueillons les plugins communautaires utiles, documentés et sûrs à exploiter.

<Steps>
  <Step title="Publier sur ClawHub ou npm">
    Votre plugin doit être installable via `openclaw plugins install \<package-name\>`.
    Publiez-le sur [ClawHub](/tools/clawhub) (préféré) ou npm.
    Voir [Créer des plugins](/plugins/building-plugins) pour le guide complet.

  </Step>

  <Step title="Héberger sur GitHub">
    Le code source doit se trouver dans un dépôt public avec une documentation d’installation et un
    suivi des problèmes.

  </Step>

  <Step title="Utiliser les PR de documentation uniquement pour les changements dans la doc source">
    Vous n’avez pas besoin d’une PR de documentation juste pour rendre votre plugin découvrable. Publiez-le
    plutôt sur ClawHub.

    Ouvrez une PR de documentation uniquement lorsque la documentation source d’OpenClaw nécessite un véritable
    changement de contenu, par exemple corriger des consignes d’installation ou ajouter une
    documentation inter-dépôts qui a sa place dans l’ensemble principal de la documentation.

  </Step>
</Steps>

## Niveau de qualité attendu

| Exigence                    | Pourquoi                                          |
| --------------------------- | ------------------------------------------------- |
| Publié sur ClawHub ou npm   | Les utilisateurs doivent pouvoir utiliser `openclaw plugins install` |
| Dépôt GitHub public         | Revue du code source, suivi des problèmes, transparence |
| Documentation d’installation et d’usage | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active          | Mises à jour récentes ou gestion réactive des problèmes |

Les wrappers à faible effort, la propriété peu claire ou les packages non maintenus peuvent être refusés.

## Lié

- [Installer et configurer des plugins](/tools/plugin) — comment installer n’importe quel plugin
- [Créer des plugins](/plugins/building-plugins) — créer le vôtre
- [Manifest de plugin](/plugins/manifest) — schéma du manifest
