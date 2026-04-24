---
read_when:
    - Mise à jour des correspondances d’identifiants de modèle d’appareil ou des fichiers NOTICE/licence
    - Modification de la manière dont l’interface Instances affiche les noms des appareils
summary: Comment OpenClaw intègre les identifiants de modèle d’appareil Apple pour obtenir des noms conviviaux dans l’application macOS.
title: Base de données des modèles d’appareils
x-i18n:
    generated_at: "2026-04-24T07:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Base de données des modèles d’appareils (noms conviviaux)

L’application compagnon macOS affiche des noms conviviaux des modèles d’appareils Apple dans l’interface **Instances** en mappant les identifiants de modèle Apple (par ex. `iPad16,6`, `Mac16,6`) vers des noms lisibles par un humain.

Le mapping est intégré sous forme de JSON dans :

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Source des données

Nous intégrons actuellement le mapping depuis le dépôt sous licence MIT :

- `kyle-seongwoo-jun/apple-device-identifiers`

Pour garder des builds déterministes, les fichiers JSON sont épinglés à des commits amont spécifiques (enregistrés dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Mise à jour de la base de données

1. Choisissez les commits amont que vous souhaitez épingler (un pour iOS, un pour macOS).
2. Mettez à jour les hashes de commit dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Retéléchargez les fichiers JSON, épinglés à ces commits :

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Assurez-vous que `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` correspond toujours à l’amont (remplacez-le si la licence amont change).
5. Vérifiez que l’application macOS se construit proprement (sans avertissements) :

```bash
swift build --package-path apps/macos
```

## Lié

- [Nodes](/fr/nodes)
- [Dépannage des Nodes](/fr/nodes/troubleshooting)
