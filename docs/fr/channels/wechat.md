---
read_when:
    - Vous souhaitez connecter OpenClaw à WeChat ou à Weixin
    - Vous installez ou dépannez le Plugin de canal openclaw-weixin
    - Vous devez comprendre comment les Plugins de canal externes s’exécutent à côté du Gateway
summary: Configuration du canal WeChat via le Plugin externe openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw se connecte à WeChat via le Plugin de canal externe
`@tencent-weixin/openclaw-weixin`.

Statut : Plugin externe. Les discussions directes et les médias sont pris en charge. Les discussions de groupe ne sont pas
annoncées par les métadonnées de capacité du Plugin actuel.

## Dénomination

- **WeChat** est le nom affiché à l’utilisateur dans cette documentation.
- **Weixin** est le nom utilisé par le package de Tencent et par l’identifiant du Plugin.
- `openclaw-weixin` est l’identifiant du canal OpenClaw.
- `@tencent-weixin/openclaw-weixin` est le package npm.

Utilisez `openclaw-weixin` dans les commandes CLI et les chemins de configuration.

## Fonctionnement

Le code WeChat ne se trouve pas dans le dépôt core d’OpenClaw. OpenClaw fournit le
contrat générique de Plugin de canal, et le Plugin externe fournit le
runtime spécifique à WeChat :

1. `openclaw plugins install` installe `@tencent-weixin/openclaw-weixin`.
2. Le Gateway détecte le manifeste du Plugin et charge le point d’entrée du Plugin.
3. Le Plugin enregistre l’identifiant de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` lance la connexion par QR code.
5. Le Plugin stocke les identifiants du compte dans le répertoire d’état d’OpenClaw.
6. Lorsque le Gateway démarre, le Plugin lance son moniteur Weixin pour chaque
   compte configuré.
7. Les messages entrants de WeChat sont normalisés via le contrat de canal, routés vers
   l’agent OpenClaw sélectionné, puis renvoyés via le chemin sortant du Plugin.

Cette séparation est importante : le core d’OpenClaw doit rester indépendant des canaux. La connexion WeChat,
les appels à l’API Tencent iLink, le téléversement/téléchargement des médias, les jetons de contexte et la surveillance
des comptes relèvent du Plugin externe.

## Installation

Installation rapide :

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Installation manuelle :

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Redémarrez le Gateway après l’installation :

```bash
openclaw gateway restart
```

## Connexion

Lancez la connexion par QR code sur la même machine que celle qui exécute le Gateway :

```bash
openclaw channels login --channel openclaw-weixin
```

Scannez le QR code avec WeChat sur votre téléphone et confirmez la connexion. Le Plugin enregistre
le jeton du compte localement après un scan réussi.

Pour ajouter un autre compte WeChat, exécutez à nouveau la même commande de connexion. Pour plusieurs
comptes, isolez les sessions de messages directs par compte, canal et expéditeur :

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Contrôle d’accès

Les messages directs utilisent le modèle normal d’appairage et de liste d’autorisation d’OpenClaw pour les Plugins
de canal.

Approuvez les nouveaux expéditeurs :

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Pour le modèle complet de contrôle d’accès, consultez [Appairage](/fr/channels/pairing).

## Compatibilité

Le Plugin vérifie la version d’OpenClaw hôte au démarrage.

| Ligne du Plugin | Version d’OpenClaw      | Tag npm  |
| --------------- | ----------------------- | -------- |
| `2.x`           | `>=2026.3.22`           | `latest` |
| `1.x`           | `>=2026.1.0 <2026.3.22` | `legacy` |

Si le Plugin indique que votre version d’OpenClaw est trop ancienne, mettez soit
OpenClaw à jour, soit installez la ligne legacy du Plugin :

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processus sidecar

Le Plugin WeChat peut exécuter un travail auxiliaire à côté du Gateway pendant qu’il surveille l’API
Tencent iLink. Dans l’issue #68451, ce chemin auxiliaire a révélé un bug dans le nettoyage générique
des Gateway obsolètes d’OpenClaw : un processus enfant pouvait essayer de nettoyer le processus Gateway
parent, provoquant des boucles de redémarrage sous des gestionnaires de processus comme systemd.

Le nettoyage actuel au démarrage d’OpenClaw exclut le processus en cours et ses ancêtres,
donc un processus auxiliaire de canal ne doit pas tuer le Gateway qui l’a lancé. Cette correction est
générique ; ce n’est pas un chemin spécifique à WeChat dans le core.

## Dépannage

Vérifiez l’installation et l’état :

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Si le canal apparaît comme installé mais ne se connecte pas, confirmez que le Plugin est
activé puis redémarrez :

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Si le Gateway redémarre en boucle après l’activation de WeChat, mettez à jour OpenClaw et
le Plugin :

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Désactivation temporaire :

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentation connexe

- Vue d’ensemble des canaux : [Canaux de chat](/fr/channels)
- Appairage : [Appairage](/fr/channels/pairing)
- Routage des canaux : [Routage des canaux](/fr/channels/channel-routing)
- Architecture des Plugins : [Architecture des Plugins](/fr/plugins/architecture)
- SDK des Plugins de canal : [SDK des Plugins de canal](/fr/plugins/sdk-channel-plugins)
- Package externe : [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
