---
read_when:
    - Vous voulez trouver des plugins OpenClaw tiers
    - Vous voulez publier ou lister votre propre plugin
summary: 'Plugins OpenClaw maintenus par la communauté : parcourir, installer et proposer le vôtre'
title: Plugins communautaires
x-i18n:
    generated_at: "2026-04-24T07:22:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Les plugins communautaires sont des packages tiers qui étendent OpenClaw avec de nouveaux
canaux, outils, fournisseurs ou autres capacités. Ils sont créés et maintenus
par la communauté, publiés sur [ClawHub](/fr/tools/clawhub) ou npm, et
installables avec une seule commande.

ClawHub est la surface de découverte canonique pour les plugins communautaires. N’ouvrez pas
de PR uniquement de documentation juste pour ajouter votre plugin ici pour la découvrabilité ; publiez-le plutôt sur
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw vérifie d’abord ClawHub puis revient automatiquement à npm.

## Plugins listés

### Apify

Récupérez des données depuis n’importe quel site web avec plus de 20 000 scrapers prêts à l’emploi. Laissez votre agent
extraire des données depuis Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, des sites e-commerce et plus encore — simplement en le demandant.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Pont OpenClaw indépendant pour les conversations Codex App Server. Liez un chat à
un fil Codex, parlez-lui en texte brut, et contrôlez-le avec des commandes natives du chat pour
reprendre, planifier, réviser, sélectionner le modèle, faire de la Compaction, et plus encore.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Intégration de robot d’entreprise en mode Stream. Prend en charge les textes, images et
messages de fichier via n’importe quel client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gestion de contexte sans perte pour OpenClaw. Résumé de conversation
basé sur DAG avec Compaction incrémentale — préserve la fidélité complète du contexte
tout en réduisant l’utilisation de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin officiel qui exporte les traces d’agent vers Opik. Surveillez le comportement de l’agent,
les coûts, les tokens, les erreurs, et plus encore.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Donnez à votre agent OpenClaw un avatar Live2D avec synchronisation labiale en temps réel, expressions
émotionnelles et synthèse vocale. Inclut des outils de création pour la génération d’actifs IA
et un déploiement en un clic vers la marketplace Prometheus. Actuellement en alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connectez OpenClaw à QQ via l’API QQ Bot. Prend en charge les chats privés, les
mentions de groupe, les messages de canal et les médias enrichis, y compris la voix, les images, les vidéos
et les fichiers.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom pour OpenClaw par l’équipe Tencent WeCom. Alimenté par les
connexions persistantes WebSocket WeCom Bot, il prend en charge les messages directs et les discussions de groupe,
les réponses en streaming, la messagerie proactive, le traitement d’images/fichiers, le formatage Markdown,
le contrôle d’accès intégré, ainsi que des Skills de document/réunion/messagerie.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Soumettre votre plugin

Nous accueillons les plugins communautaires qui sont utiles, documentés et sûrs à exploiter.

<Steps>
  <Step title="Publier sur ClawHub ou npm">
    Votre plugin doit être installable via `openclaw plugins install \<package-name\>`.
    Publiez-le sur [ClawHub](/fr/tools/clawhub) (préféré) ou sur npm.
    Voir [Créer des plugins](/fr/plugins/building-plugins) pour le guide complet.

  </Step>

  <Step title="Héberger sur GitHub">
    Le code source doit se trouver dans un dépôt public avec une documentation de configuration et un
    système de suivi des problèmes.

  </Step>

  <Step title="N’utiliser les PR de documentation que pour les changements dans la doc source">
    Vous n’avez pas besoin d’une PR de documentation juste pour rendre votre plugin découvrable. Publiez-le
    sur ClawHub à la place.

    N’ouvrez une PR de documentation que lorsque la documentation source d’OpenClaw a besoin d’un vrai changement
    de contenu, comme corriger les instructions d’installation ou ajouter une documentation
    inter-dépôts qui a sa place dans l’ensemble principal de la documentation.

  </Step>
</Steps>

## Niveau de qualité attendu

| Exigence                    | Pourquoi                                      |
| --------------------------- | --------------------------------------------- |
| Publié sur ClawHub ou npm   | Les utilisateurs doivent pouvoir faire fonctionner `openclaw plugins install` |
| Dépôt GitHub public         | Revue du code, suivi des problèmes, transparence |
| Documentation de configuration et d’usage | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active          | Mises à jour récentes ou gestion réactive des problèmes |

Les wrappers à faible effort, la propriété floue ou les packages non maintenus peuvent être refusés.

## Associé

- [Installer et configurer des plugins](/fr/tools/plugin) — comment installer n’importe quel plugin
- [Créer des plugins](/fr/plugins/building-plugins) — créez le vôtre
- [Manifeste de plugin](/fr/plugins/manifest) — schéma du manifeste
