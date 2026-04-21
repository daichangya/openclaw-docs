---
read_when:
    - Vous voulez trouver des Plugins OpenClaw tiers
    - Vous voulez publier ou répertorier votre propre Plugin
summary: 'Plugins OpenClaw maintenus par la communauté : parcourir, installer et soumettre le vôtre'
title: Plugins communautaires
x-i18n:
    generated_at: "2026-04-21T07:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugins communautaires

Les Plugins communautaires sont des paquets tiers qui étendent OpenClaw avec de
nouveaux canaux, outils, fournisseurs ou autres capacités. Ils sont créés et maintenus
par la communauté, publiés sur [ClawHub](/fr/tools/clawhub) ou npm, et
installables avec une seule commande.

ClawHub est la surface de découverte canonique pour les Plugins communautaires. N’ouvrez pas
de PR de documentation uniquement pour ajouter votre Plugin ici à des fins de découvrabilité ;
publiez-le sur ClawHub à la place.

```bash
openclaw plugins install <package-name>
```

OpenClaw vérifie d’abord ClawHub puis revient automatiquement à npm.

## Plugins répertoriés

### Apify

Scrapez des données depuis n’importe quel site web avec plus de 20 000 extracteurs prêts à l’emploi. Laissez votre agent
extraire des données depuis Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, des sites e-commerce et plus encore — simplement en le demandant.

- **npm :** `@apify/apify-openclaw-plugin`
- **dépôt :** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indépendant pour les conversations Codex App Server. Attachez un chat à
un fil Codex, parlez-lui en texte brut et contrôlez-le avec des commandes natives du chat pour
la reprise, la planification, la revue, la sélection de modèle, la Compaction, etc.

- **npm :** `openclaw-codex-app-server`
- **dépôt :** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Intégration de robot d’entreprise utilisant le mode Stream. Prend en charge le texte, les images et
les fichiers via n’importe quel client DingTalk.

- **npm :** `@largezhou/ddingtalk`
- **dépôt :** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de gestion de contexte sans perte pour OpenClaw. Résumé de conversation fondé sur un DAG
avec Compaction incrémentielle — préserve la fidélité complète du contexte
tout en réduisant l’usage des tokens.

- **npm :** `@martian-engineering/lossless-claw`
- **dépôt :** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin officiel qui exporte les traces d’agent vers Opik. Surveillez le comportement de l’agent,
les coûts, les tokens, les erreurs, et plus encore.

- **npm :** `@opik/opik-openclaw`
- **dépôt :** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Donnez à votre agent OpenClaw un avatar Live2D avec synchronisation labiale en temps réel, expressions
émotionnelles et synthèse vocale. Inclut des outils de création pour la génération d’actifs IA
et un déploiement en un clic sur la marketplace Prometheus. Actuellement en alpha.

- **npm :** `@prometheusavatar/openclaw-plugin`
- **dépôt :** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Connectez OpenClaw à QQ via l’API QQ Bot. Prend en charge les chats privés, les
mentions de groupe, les messages de canal et les médias enrichis, y compris la voix, les images, les vidéos
et les fichiers.

- **npm :** `@tencent-connect/openclaw-qqbot`
- **dépôt :** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom pour OpenClaw par l’équipe Tencent WeCom. Alimenté par
les connexions persistantes WebSocket WeCom Bot, il prend en charge
les messages directs et les chats de groupe, les réponses en streaming, la messagerie proactive, le traitement d’images/fichiers, le formatage Markdown,
le contrôle d’accès intégré et des Skills de document/réunion/messagerie.

- **npm :** `@wecom/wecom-openclaw-plugin`
- **dépôt :** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Soumettre votre Plugin

Nous accueillons les Plugins communautaires utiles, documentés et sûrs à exploiter.

<Steps>
  <Step title="Publier sur ClawHub ou npm">
    Votre Plugin doit être installable via `openclaw plugins install \<package-name\>`.
    Publiez-le sur [ClawHub](/fr/tools/clawhub) (préféré) ou npm.
    Voir [Créer des Plugins](/fr/plugins/building-plugins) pour le guide complet.

  </Step>

  <Step title="Héberger sur GitHub">
    Le code source doit se trouver dans un dépôt public avec une documentation d’installation
    et un système de suivi des problèmes.

  </Step>

  <Step title="Utiliser les PR de documentation seulement pour des changements de documentation source">
    Vous n’avez pas besoin d’une PR de documentation juste pour rendre votre Plugin découvrable. Publiez-le
    sur ClawHub à la place.

    Ouvrez une PR de documentation uniquement lorsque la documentation source d’OpenClaw a besoin d’un vrai
    changement de contenu, par exemple corriger la procédure d’installation ou ajouter une
    documentation inter-dépôts qui doit figurer dans l’ensemble principal de la documentation.

  </Step>
</Steps>

## Niveau d’exigence

| Exigence                    | Pourquoi                                      |
| --------------------------- | --------------------------------------------- |
| Publié sur ClawHub ou npm   | Les utilisateurs ont besoin que `openclaw plugins install` fonctionne |
| Dépôt GitHub public         | Revue du code source, suivi des problèmes, transparence |
| Documentation d’installation et d’usage | Les utilisateurs doivent savoir comment le configurer |
| Maintenance active          | Mises à jour récentes ou gestion réactive des problèmes |

Les wrappers à faible effort, les propriétaires peu clairs ou les paquets non maintenus peuvent être refusés.

## Voir aussi

- [Installer et configurer des Plugins](/fr/tools/plugin) — comment installer n’importe quel Plugin
- [Créer des Plugins](/fr/plugins/building-plugins) — créer le vôtre
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma du manifeste
