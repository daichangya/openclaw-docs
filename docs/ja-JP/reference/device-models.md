---
read_when:
    - デバイスモデルidentifierのマッピングやNOTICE/license fileを更新するとき
    - Instances UIでのデバイス名表示方法を変更するとき
summary: OpenClawがmacOS appでAppleデバイスのmodel identifierをわかりやすい名前に変換するため、どのようにvendorしているか。
title: デバイスモデルデータベース
x-i18n:
    generated_at: "2026-04-05T12:54:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2
    source_path: reference/device-models.md
    workflow: 15
---

# デバイスモデルデータベース（わかりやすい名前）

macOS companion appは、Appleのmodel identifier（例: `iPad16,6`, `Mac16,6`）を人間が読める名前へマッピングすることで、**Instances** UIにAppleデバイスのわかりやすいモデル名を表示します。

このマッピングは、次の場所にJSONとしてvendorされています。

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## データソース

現在、このマッピングはMITライセンスのrepositoryからvendorしています。

- `kyle-seongwoo-jun/apple-device-identifiers`

buildを決定的に保つため、JSON filesは特定のupstream commitに固定されています（`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` に記録）。

## データベースの更新

1. 固定したいupstream commitを選びます（iOS用に1つ、macOS用に1つ）。
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` のcommit hashを更新します。
3. それらのcommitに固定してJSON filesを再ダウンロードします。

```bash
IOS_COMMIT="<ios-device-identifiers.json 用の commit sha>"
MAC_COMMIT="<mac-device-identifiers.json 用の commit sha>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` が引き続きupstreamと一致していることを確認します（upstream licenseが変更されていたら置き換えてください）。
5. macOS appがクリーンにbuildできることを確認します（warningなし）。

```bash
swift build --package-path apps/macos
```
