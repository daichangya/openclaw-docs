---
read_when:
    - Appairer ou reconnecter le nœud Android
    - Déboguer la découverte ou l’authentification de la gateway sur Android
    - Vérifier la parité de l’historique de chat entre les clients
summary: 'Application Android (nœud) : guide de connexion + surface de commandes Connect/Chat/Voice/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-04-05T12:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Application Android (nœud)

> **Remarque :** l’application Android n’a pas encore été publiée publiquement. Le code source est disponible dans le [dépôt OpenClaw](https://github.com/openclaw/openclaw) sous `apps/android`. Vous pouvez la compiler vous-même avec Java 17 et le SDK Android (`./gradlew :app:assemblePlayDebug`). Voir [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) pour les instructions de build.

## Instantané de prise en charge

- Rôle : application compagnon de nœud (Android n’héberge pas la Gateway).
- Gateway requise : oui (exécutez-la sur macOS, Linux ou Windows via WSL2).
- Installation : [Getting Started](/fr/start/getting-started) + [Pairing](/channels/pairing).
- Gateway : [Runbook](/gateway) + [Configuration](/gateway/configuration).
  - Protocoles : [Gateway protocol](/gateway/protocol) (nœuds + plan de contrôle).

## Contrôle du système

Le contrôle du système (launchd/systemd) se trouve sur l’hôte Gateway. Voir [Gateway](/gateway).

## Guide de connexion

Application de nœud Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket Gateway et utilise le pairing d’appareil (`role: node`).

Pour les hôtes Tailscale ou publics, Android exige un point de terminaison sécurisé :

- Recommandé : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL Gateway `wss://` avec un vrai point de terminaison TLS
- Le `ws://` en clair reste pris en charge sur les adresses LAN privées / hôtes `.local`, ainsi que `localhost`, `127.0.0.1` et le pont d’émulateur Android (`10.0.2.2`)

### Prérequis

- Vous pouvez exécuter la Gateway sur la machine « maître ».
- L’appareil/l’émulateur Android peut atteindre le WebSocket gateway :
  - même LAN avec mDNS/NSD, **ou**
  - même tailnet Tailscale en utilisant Wide-Area Bonjour / unicast DNS-SD (voir ci-dessous), **ou**
  - hôte/port de gateway manuel (solution de repli)
- Le pairing mobile tailnet/public n’utilise **pas** de points de terminaison `ws://` bruts sur IP tailnet. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- Vous pouvez exécuter la CLI (`openclaw`) sur la machine gateway (ou via SSH).

### 1) Démarrer la Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirmez dans les journaux que vous voyez quelque chose comme :

- `listening on ws://0.0.0.0:18789`

Pour l’accès Android distant via Tailscale, préférez Serve/Funnel à un bind tailnet brut :

```bash
openclaw gateway --tailscale serve
```

Cela donne à Android un point de terminaison sécurisé `wss://` / `https://`. Une configuration simple avec `gateway.bind: "tailnet"` ne suffit pas pour un premier pairing Android à distance, sauf si vous terminez aussi TLS séparément.

### 2) Vérifier la découverte (facultatif)

Depuis la machine gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Plus de notes de débogage : [Bonjour](/gateway/bonjour).

Si vous avez aussi configuré un domaine de découverte étendue, comparez avec :

```bash
openclaw gateway discover --json
```

Cette commande affiche `local.` plus le domaine étendu configuré en une seule passe et utilise le
point de terminaison de service résolu au lieu de simples indices TXT.

#### Découverte tailnet (Vienne ⇄ Londres) via DNS-SD en monodiffusion

La découverte Android NSD/mDNS ne traverse pas les réseaux. Si votre nœud Android et la gateway sont sur des réseaux différents mais connectés via Tailscale, utilisez Wide-Area Bonjour / unicast DNS-SD à la place.

La découverte seule ne suffit pas pour le pairing Android via tailnet/public. La route découverte exige toujours un point de terminaison sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (par exemple `openclaw.internal.`) sur l’hôte gateway et publiez les enregistrements `_openclaw-gw._tcp`.
2. Configurez le DNS split Tailscale pour le domaine choisi en pointant vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/gateway/bonjour).

### 3) Se connecter depuis Android

Dans l’application Android :

- L’application maintient sa connexion gateway active via un **service de premier plan** (notification persistante).
- Ouvrez l’onglet **Connect**.
- Utilisez le mode **Setup Code** ou **Manual**.
- Si la découverte est bloquée, utilisez l’hôte/port manuel dans **Advanced controls**. Pour les hôtes LAN privés, `ws://` fonctionne toujours. Pour les hôtes Tailscale/publics, activez TLS et utilisez un point de terminaison `wss://` / Tailscale Serve.

Après le premier pairing réussi, Android se reconnecte automatiquement au lancement :

- point de terminaison manuel (si activé), sinon
- dernière gateway découverte (au mieux).

### 4) Approuver le pairing (CLI)

Sur la machine gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails du pairing : [Pairing](/channels/pairing).

### 5) Vérifier que le nœud est connecté

- Via le statut des nœuds :

  ```bash
  openclaw nodes status
  ```

- Via Gateway :

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historique

L’onglet Chat Android prend en charge la sélection de session (par défaut `main`, plus d’autres sessions existantes) :

- Historique : `chat.history` (normalisé pour l’affichage ; les balises de directives inline sont
  supprimées du texte visible, les charges utiles XML d’appels d’outils en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et
  les blocs d’appels d’outils tronqués) ainsi que les jetons de contrôle de modèle ASCII/full-width
  divulgués sont supprimés, les lignes assistant contenant uniquement un jeton silencieux pur comme `NO_REPLY` /
  `no_reply` exact sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders)
- Envoi : `chat.send`
- Mises à jour push (au mieux) : `chat.subscribe` → `event:"chat"`

### 7) Canvas + caméra

#### Hôte Gateway Canvas (recommandé pour le contenu web)

Si vous voulez que le nœud affiche un vrai contenu HTML/CSS/JS que l’agent peut modifier sur disque, faites pointer le nœud vers l’hôte canvas de la Gateway.

Remarque : les nœuds chargent canvas depuis le serveur HTTP Gateway (même port que `gateway.port`, par défaut `18789`).

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte gateway.

2. Naviguez vers celui-ci depuis le nœud (LAN) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils sont sur Tailscale, utilisez un nom MagicDNS ou une IP tailnet au lieu de `.local`, par exemple `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de rechargement en direct dans le HTML et recharge lors des modifications de fichier.
L’hôte A2UI se trouve à `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Commandes Canvas (premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir au scaffold par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (par défaut `format="jpeg"`).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (ancien alias `canvas.a2ui.pushJSONL`)

Commandes caméra (premier plan uniquement ; contrôlées par autorisation) :

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Voir [Camera node](/nodes/camera) pour les paramètres et les assistants CLI.

### 8) Voice + surface de commandes Android étendue

- Voice : Android utilise un flux unique micro activé/désactivé dans l’onglet Voice avec capture de transcription et lecture `talk.speak`. Le TTS système local n’est utilisé que lorsque `talk.speak` n’est pas disponible. Voice s’arrête lorsque l’application quitte le premier plan.
- Les bascules de réveil vocal / mode Talk sont actuellement supprimées de l’UX/runtime Android.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil et des autorisations) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (voir [Notification forwarding](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Points d’entrée assistant

Android prend en charge le lancement d’OpenClaw à partir du déclencheur d’assistant système (Google
Assistant). Lorsqu’il est configuré, maintenir le bouton principal enfoncé ou dire « Hey Google, ask
OpenClaw... » ouvre l’application et transmet le prompt au composeur de chat.

Cela utilise les métadonnées Android **App Actions** déclarées dans le manifeste de l’application. Aucune
configuration supplémentaire n’est nécessaire côté gateway -- l’intention assistant est
gérée entièrement par l’application Android et transmise comme un message de chat normal.

<Note>
La disponibilité d’App Actions dépend de l’appareil, de la version de Google Play Services,
et du fait que l’utilisateur a défini OpenClaw comme application d’assistant par défaut.
</Note>

## Notification forwarding

Android peut transférer les notifications de l’appareil vers la gateway en tant qu’événements. Plusieurs contrôles permettent de limiter quelles notifications sont transférées et à quel moment.

| Clé                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Transférer uniquement les notifications provenant de ces noms de package. Si défini, tous les autres packages sont ignorés. |
| `notifications.denyPackages`     | string[]       | Ne jamais transférer les notifications provenant de ces noms de package. Appliqué après `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Début de la fenêtre d’heures silencieuses (heure locale de l’appareil). Les notifications sont supprimées pendant cette fenêtre. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la fenêtre d’heures silencieuses.                                                          |
| `notifications.rateLimit`        | number         | Nombre maximal de notifications transférées par package et par minute. Les notifications excédentaires sont ignorées. |

Le sélecteur de notifications utilise également un comportement plus sûr pour les événements de notification transférés, afin d’éviter le transfert accidentel de notifications système sensibles.

Exemple de configuration :

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Le transfert de notifications nécessite l’autorisation Android Notification Listener. L’application la demande pendant la configuration.
</Note>
