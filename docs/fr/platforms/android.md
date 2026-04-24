---
read_when:
    - Appairer ou reconnecter le nœud Android
    - Déboguer la découverte du gateway Android ou l’authentification
    - Vérifier la parité de l’historique de chat entre les clients
summary: 'Application Android (nœud) : runbook de connexion + surface de commandes Connect/Chat/Voice/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-04-24T07:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Remarque :** L’application Android n’a pas encore été publiée publiquement. Le code source est disponible dans le [dépôt OpenClaw](https://github.com/openclaw/openclaw) sous `apps/android`. Vous pouvez la compiler vous-même avec Java 17 et le SDK Android (`./gradlew :app:assemblePlayDebug`). Voir [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) pour les instructions de build.

## Aperçu de la prise en charge

- Rôle : application compagnon de nœud (Android n’héberge pas le Gateway).
- Gateway requis : oui (exécutez-le sur macOS, Linux ou Windows via WSL2).
- Installation : [Bien démarrer](/fr/start/getting-started) + [Appairage](/fr/channels/pairing).
- Gateway : [Runbook](/fr/gateway) + [Configuration](/fr/gateway/configuration).
  - Protocoles : [Protocole Gateway](/fr/gateway/protocol) (nœuds + plan de contrôle).

## Contrôle système

Le contrôle système (launchd/systemd) vit sur l’hôte Gateway. Voir [Gateway](/fr/gateway).

## Runbook de connexion

Application de nœud Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket du Gateway et utilise l’appairage d’appareil (`role: node`).

Pour Tailscale ou les hôtes publics, Android exige un endpoint sécurisé :

- Préféré : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL Gateway `wss://` avec un vrai endpoint TLS
- Le `ws://` en clair reste pris en charge sur les adresses LAN privées / hôtes `.local`, ainsi que `localhost`, `127.0.0.1` et le pont d’émulateur Android (`10.0.2.2`)

### Prérequis

- Vous pouvez exécuter le Gateway sur la machine « maître ».
- L’appareil/l’émulateur Android peut atteindre le WebSocket du gateway :
  - Même LAN avec mDNS/NSD, **ou**
  - Même tailnet Tailscale en utilisant Wide-Area Bonjour / unicast DNS-SD (voir ci-dessous), **ou**
  - Hôte/port du gateway saisi manuellement (repli)
- L’appairage mobile tailnet/public n’utilise **pas** d’endpoints `ws://` bruts sur IP tailnet. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- Vous pouvez exécuter la CLI (`openclaw`) sur la machine gateway (ou via SSH).

### 1) Démarrer le Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirmez dans les journaux que vous voyez quelque chose comme :

- `listening on ws://0.0.0.0:18789`

Pour l’accès Android distant via Tailscale, préférez Serve/Funnel à une liaison tailnet brute :

```bash
openclaw gateway --tailscale serve
```

Cela donne à Android un endpoint sécurisé `wss://` / `https://`. Une configuration simple `gateway.bind: "tailnet"` ne suffit pas pour un premier appairage Android à distance, sauf si vous terminez aussi TLS séparément.

### 2) Vérifier la découverte (facultatif)

Depuis la machine gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Plus de notes de débogage : [Bonjour](/fr/gateway/bonjour).

Si vous avez aussi configuré un domaine de découverte wide-area, comparez avec :

```bash
openclaw gateway discover --json
```

Cela affiche `local.` plus le domaine wide-area configuré en un seul passage et utilise l’endpoint de service résolu au lieu de simples indications TXT.

#### Découverte tailnet (Vienne ⇄ Londres) via unicast DNS-SD

La découverte Android NSD/mDNS ne traverse pas les réseaux. Si votre nœud Android et le gateway sont sur des réseaux différents mais connectés via Tailscale, utilisez Wide-Area Bonjour / unicast DNS-SD à la place.

La découverte seule ne suffit pas pour l’appairage Android tailnet/public. La route découverte a toujours besoin d’un endpoint sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (exemple `openclaw.internal.`) sur l’hôte gateway et publiez des enregistrements `_openclaw-gw._tcp`.
2. Configurez le DNS fractionné Tailscale pour votre domaine choisi en pointant vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/fr/gateway/bonjour).

### 3) Se connecter depuis Android

Dans l’application Android :

- L’application maintient la connexion au gateway via un **service au premier plan** (notification persistante).
- Ouvrez l’onglet **Connect**.
- Utilisez le mode **Setup Code** ou **Manual**.
- Si la découverte est bloquée, utilisez l’hôte/port manuel dans **Advanced controls**. Pour les hôtes LAN privés, `ws://` fonctionne toujours. Pour les hôtes Tailscale/publics, activez TLS et utilisez un endpoint `wss://` / Tailscale Serve.

Après le premier appairage réussi, Android se reconnecte automatiquement au lancement :

- Endpoint manuel (s’il est activé), sinon
- Dernier gateway découvert (au mieux).

### 4) Approuver l’appairage (CLI)

Sur la machine gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails sur l’appairage : [Appairage](/fr/channels/pairing).

### 5) Vérifier que le nœud est connecté

- Via le statut des nœuds :

  ```bash
  openclaw nodes status
  ```

- Via le Gateway :

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historique

L’onglet Chat Android prend en charge la sélection de session (par défaut `main`, plus d’autres sessions existantes) :

- Historique : `chat.history` (normalisé pour l’affichage ; les balises de directive en ligne sont
  supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et
  les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/full-width divulgués
  sont supprimés, les lignes assistant de simple jeton silencieux telles que l’exact `NO_REPLY` /
  `no_reply` sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders)
- Envoi : `chat.send`
- Mises à jour push (au mieux) : `chat.subscribe` → `event:"chat"`

### 7) Canvas + caméra

#### Hôte Canvas Gateway (recommandé pour le contenu web)

Si vous voulez que le nœud affiche du vrai HTML/CSS/JS que l’agent peut modifier sur disque, pointez le nœud vers l’hôte canvas du Gateway.

Remarque : les nœuds chargent canvas depuis le serveur HTTP du Gateway (même port que `gateway.port`, par défaut `18789`).

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte gateway.

2. Naviguez le nœud vers cette URL (LAN) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils sont sur Tailscale, utilisez un nom MagicDNS ou une IP tailnet au lieu de `.local`, par exemple `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de rechargement à chaud dans le HTML et recharge lors des changements de fichiers.
L’hôte A2UI vit à `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Commandes Canvas (premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir à la structure par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (par défaut `format="jpeg"`).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (alias hérité `canvas.a2ui.pushJSONL`)

Commandes caméra (premier plan uniquement ; protégées par permissions) :

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Voir [Nœud caméra](/fr/nodes/camera) pour les paramètres et les helpers CLI.

### 8) Voix + surface de commandes Android étendue

- Voix : Android utilise un flux unique micro on/off dans l’onglet Voice avec capture de transcription et lecture `talk.speak`. Le TTS système local n’est utilisé que lorsque `talk.speak` n’est pas disponible. La voix s’arrête lorsque l’application quitte le premier plan.
- Les bascules voice wake/talk-mode sont actuellement supprimées de l’UX/runtime Android.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil + des permissions) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (voir [Transfert de notifications](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Points d’entrée assistant

Android prend en charge le lancement d’OpenClaw depuis le déclencheur d’assistant système (Google
Assistant). Lorsqu’il est configuré, maintenir le bouton d’accueil ou dire « Hey Google, ask
OpenClaw... » ouvre l’application et transmet l’invite dans le composeur de chat.

Cela utilise les métadonnées Android **App Actions** déclarées dans le manifeste de l’application. Aucune
configuration supplémentaire n’est nécessaire côté gateway — l’intention assistant est
gérée entièrement par l’application Android et transmise comme message de chat normal.

<Note>
La disponibilité d’App Actions dépend de l’appareil, de la version de Google Play Services
et du fait que l’utilisateur a défini OpenClaw comme application d’assistant par défaut.
</Note>

## Transfert de notifications

Android peut transférer les notifications de l’appareil vers le gateway sous forme d’événements. Plusieurs contrôles vous permettent de limiter quelles notifications sont transférées et à quel moment.

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Transférer uniquement les notifications provenant de ces noms de package. Si défini, tous les autres packages sont ignorés. |
| `notifications.denyPackages`     | string[]       | Ne jamais transférer les notifications provenant de ces noms de package. Appliqué après `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Début de la plage d’heures calmes (heure locale de l’appareil). Les notifications sont supprimées pendant cette plage. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la plage d’heures calmes.                                                                  |
| `notifications.rateLimit`        | number         | Nombre maximal de notifications transférées par package et par minute. Les notifications excédentaires sont supprimées. |

Le sélecteur de notifications utilise aussi un comportement plus sûr pour les événements de notification transférés, évitant le transfert accidentel de notifications système sensibles.

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
Le transfert de notifications nécessite la permission Android Notification Listener. L’application la demande pendant la configuration.
</Note>

## Associé

- [Application iOS](/fr/platforms/ios)
- [Nœuds](/fr/nodes)
- [Dépannage du nœud Android](/fr/nodes/troubleshooting)
