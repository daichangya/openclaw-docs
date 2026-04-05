---
read_when:
    - Ajouter ou modifier la capture caméra sur les nœuds iOS/Android ou sur macOS
    - Étendre les workflows de fichiers temporaires MEDIA accessibles à l'agent
summary: 'Capture caméra (nœuds iOS/Android + application macOS) pour l''usage par l''agent : photos (jpg) et courts clips vidéo (mp4)'
title: Capture caméra
x-i18n:
    generated_at: "2026-04-05T12:47:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Capture caméra (agent)

OpenClaw prend en charge la **capture caméra** pour les workflows d'agent :

- **Nœud iOS** (jumelé via la gateway) : capturer une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.
- **Nœud Android** (jumelé via la gateway) : capturer une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.
- **Application macOS** (nœud via la gateway) : capturer une **photo** (`jpg`) ou un **court clip vidéo** (`mp4`, avec audio facultatif) via `node.invoke`.

Tout accès à la caméra est protégé par des **paramètres contrôlés par l'utilisateur**.

## Nœud iOS

### Paramètre utilisateur (activé par défaut)

- Onglet Réglages iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Par défaut : **activé** (une clé manquante est traitée comme activée).
  - Lorsqu'il est désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Commandes (via `node.invoke` de la gateway)

- `camera.list`
  - Charge utile de réponse :
    - `devices` : tableau de `{ id, name, position, deviceType }`

- `camera.snap`
  - Paramètres :
    - `facing` : `front|back` (par défaut : `front`)
    - `maxWidth` : nombre (facultatif ; valeur par défaut `1600` sur le nœud iOS)
    - `quality` : `0..1` (facultatif ; valeur par défaut `0.9`)
    - `format` : actuellement `jpg`
    - `delayMs` : nombre (facultatif ; valeur par défaut `0`)
    - `deviceId` : chaîne (facultatif ; à partir de `camera.list`)
  - Charge utile de réponse :
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Garde-fou de charge utile : les photos sont recompressées pour maintenir la charge utile base64 en dessous de 5 Mo.

- `camera.clip`
  - Paramètres :
    - `facing` : `front|back` (par défaut : `front`)
    - `durationMs` : nombre (par défaut `3000`, limité à un maximum de `60000`)
    - `includeAudio` : booléen (par défaut `true`)
    - `format` : actuellement `mp4`
    - `deviceId` : chaîne (facultatif ; à partir de `camera.list`)
  - Charge utile de réponse :
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Exigence de premier plan

Comme `canvas.*`, le nœud iOS n'autorise les commandes `camera.*` qu'au **premier plan**. Les invocations en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Assistant CLI (fichiers temporaires + MEDIA)

Le moyen le plus simple d'obtenir des pièces jointes est d'utiliser l'assistant CLI, qui écrit le média décodé dans un fichier temporaire et affiche `MEDIA:<path>`.

Exemples :

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Remarques :

- `nodes camera snap` utilise par défaut **les deux** orientations afin de fournir les deux vues à l'agent.
- Les fichiers de sortie sont temporaires (dans le répertoire temporaire du système d'exploitation), sauf si vous créez votre propre wrapper.

## Nœud Android

### Paramètre utilisateur Android (activé par défaut)

- Feuille Réglages Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Par défaut : **activé** (une clé manquante est traitée comme activée).
  - Lorsqu'il est désactivé : les commandes `camera.*` renvoient `CAMERA_DISABLED`.

### Autorisations

- Android nécessite des autorisations d'exécution :
  - `CAMERA` pour `camera.snap` et `camera.clip`.
  - `RECORD_AUDIO` pour `camera.clip` lorsque `includeAudio=true`.

Si les autorisations sont absentes, l'application affichera une invite lorsque c'est possible ; si elles sont refusées, les requêtes `camera.*` échouent avec une erreur `*_PERMISSION_REQUIRED`.

### Exigence de premier plan sur Android

Comme `canvas.*`, le nœud Android n'autorise les commandes `camera.*` qu'au **premier plan**. Les invocations en arrière-plan renvoient `NODE_BACKGROUND_UNAVAILABLE`.

### Commandes Android (via `node.invoke` de la gateway)

- `camera.list`
  - Charge utile de réponse :
    - `devices` : tableau de `{ id, name, position, deviceType }`

### Garde-fou de charge utile

Les photos sont recompressées pour maintenir la charge utile base64 en dessous de 5 Mo.

## Application macOS

### Paramètre utilisateur (désactivé par défaut)

L'application compagnon macOS expose une case à cocher :

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Par défaut : **désactivé**
  - Lorsqu'il est désactivé : les requêtes caméra renvoient « Camera disabled by user ».

### Assistant CLI (node invoke)

Utilisez la CLI principale `openclaw` pour invoquer des commandes caméra sur le nœud macOS.

Exemples :

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Remarques :

- `openclaw nodes camera snap` utilise `maxWidth=1600` par défaut, sauf remplacement.
- Sur macOS, `camera.snap` attend `delayMs` (2000 ms par défaut) après la phase de préchauffage/stabilisation de l'exposition avant de capturer.
- Les charges utiles photo sont recompressées pour maintenir le base64 en dessous de 5 Mo.

## Sécurité + limites pratiques

- L'accès à la caméra et au microphone déclenche les invites d'autorisation habituelles du système d'exploitation (et nécessite des chaînes d'utilisation dans Info.plist).
- Les clips vidéo sont limités (actuellement `<= 60s`) pour éviter des charges utiles de nœud trop volumineuses (surcharge base64 + limites de message).

## Vidéo d'écran macOS (niveau système)

Pour la vidéo d'_écran_ (et non la caméra), utilisez l'application compagnon macOS :

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Remarques :

- Nécessite l'autorisation macOS **Screen Recording** (TCC).
