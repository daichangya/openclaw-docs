---
read_when:
    - Mettre à jour les correspondances d’identifiants de modèles d’appareils ou les fichiers NOTICE/licence
    - Modifier la façon dont l’interface Instances affiche les noms d’appareils
summary: Comment OpenClaw intègre les identifiants de modèles d’appareils Apple pour afficher des noms conviviaux dans l’app macOS.
title: Base de données des modèles d’appareils
x-i18n:
    generated_at: "2026-04-05T12:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# Base de données des modèles d’appareils (noms conviviaux)

L’application compagnon macOS affiche des noms conviviaux de modèles d’appareils Apple dans l’interface **Instances** en faisant correspondre les identifiants de modèles Apple (par exemple `iPad16,6`, `Mac16,6`) à des noms lisibles par l’humain.

La correspondance est intégrée sous forme de JSON dans :

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Source des données

Nous intégrons actuellement la correspondance depuis le dépôt sous licence MIT :

- `kyle-seongwoo-jun/apple-device-identifiers`

Pour garder des builds déterministes, les fichiers JSON sont épinglés à des commits amont spécifiques (enregistrés dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Mise à jour de la base de données

1. Choisissez les commits amont que vous voulez épingler (un pour iOS, un pour macOS).
2. Mettez à jour les hachages de commit dans `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Téléchargez à nouveau les fichiers JSON, épinglés à ces commits :

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
