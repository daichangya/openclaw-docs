---
read_when:
    - iOS/Android nodeまたはmacOSでcamera captureを追加または変更している
    - エージェントから利用可能なMEDIA一時ファイルworkflowを拡張している
summary: 'エージェント利用向けのcamera capture（iOS/Android node + macOS app）: 写真（jpg）と短い動画クリップ（mp4）'
title: Camera Capture
x-i18n:
    generated_at: "2026-04-05T12:49:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d
    source_path: nodes/camera.md
    workflow: 15
---

# Camera capture（agent）

OpenClawは、エージェントworkflow向けに**camera capture**をサポートしています。

- **iOS node**（Gateway経由でpair）: `node.invoke` を通じて**写真**（`jpg`）または**短い動画クリップ**（`mp4`、任意でaudio付き）を撮影できます。
- **Android node**（Gateway経由でpair）: `node.invoke` を通じて**写真**（`jpg`）または**短い動画クリップ**（`mp4`、任意でaudio付き）を撮影できます。
- **macOS app**（Gateway経由のnode）: `node.invoke` を通じて**写真**（`jpg`）または**短い動画クリップ**（`mp4`、任意でaudio付き）を撮影できます。

すべてのcameraアクセスは**ユーザーが制御する設定**の背後でゲートされています。

## iOS node

### ユーザー設定（デフォルトでオン）

- iOS Settingsタブ → **Camera** → **Allow Camera** (`camera.enabled`)
  - デフォルト: **on**（キーが存在しない場合は有効として扱われます）。
  - オフ時: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### コマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスpayload:
    - `devices`: `{ id, name, position, deviceType }` の配列

- `camera.snap`
  - Params:
    - `facing`: `front|back`（デフォルト: `front`）
    - `maxWidth`: number（任意。iOS nodeでのデフォルトは `1600`）
    - `quality`: `0..1`（任意。デフォルトは `0.9`）
    - `format`: 現在は `jpg`
    - `delayMs`: number（任意。デフォルトは `0`）
    - `deviceId`: string（任意。`camera.list` から取得）
  - レスポンスpayload:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Payload guard: 写真は、base64 payloadが5 MB未満に収まるよう再圧縮されます。

- `camera.clip`
  - Params:
    - `facing`: `front|back`（デフォルト: `front`）
    - `durationMs`: number（デフォルト `3000`、最大 `60000` にclamp）
    - `includeAudio`: boolean（デフォルト `true`）
    - `format`: 現在は `mp4`
    - `deviceId`: string（任意。`camera.list` から取得）
  - レスポンスpayload:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### フォアグラウンド要件

`canvas.*` と同様に、iOS nodeは**foreground**でのみ `camera.*` コマンドを許可します。backgroundからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI helper（一時ファイル + MEDIA）

attachmentを取得する最も簡単な方法はCLI helperを使うことです。これはデコードしたmediaを一時ファイルへ書き出し、`MEDIA:<path>` を出力します。

例:

```bash
openclaw nodes camera snap --node <id>               # デフォルト: front + back の両方（2つのMEDIA行）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意:

- `nodes camera snap` はデフォルトで**両方**の向きを対象にし、エージェントへ両方の視点を渡します。
- 独自のwrapperを作らない限り、出力ファイルは一時ファイルです（OSの一時ディレクトリ内）。

## Android node

### Androidのユーザー設定（デフォルトでオン）

- Android Settingsシート → **Camera** → **Allow Camera** (`camera.enabled`)
  - デフォルト: **on**（キーが存在しない場合は有効として扱われます）。
  - オフ時: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### 権限

- Androidではランタイム権限が必要です。
  - `camera.snap` と `camera.clip` の両方に `CAMERA`。
  - `includeAudio=true` の `camera.clip` には `RECORD_AUDIO`。

権限がない場合、可能であればappがプロンプトを表示します。拒否された場合、`camera.*` リクエストは
`*_PERMISSION_REQUIRED` エラーで失敗します。

### Androidのフォアグラウンド要件

`canvas.*` と同様に、Android nodeは**foreground**でのみ `camera.*` コマンドを許可します。backgroundからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### Androidコマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスpayload:
    - `devices`: `{ id, name, position, deviceType }` の配列

### Payload guard

写真は、base64 payloadが5 MB未満に収まるよう再圧縮されます。

## macOS app

### ユーザー設定（デフォルトでオフ）

macOS companion appにはチェックボックスがあります。

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - デフォルト: **off**
  - オフ時: cameraリクエストは「Camera disabled by user」を返します。

### CLI helper（node invoke）

macOS nodeでcameraコマンドを呼び出すには、メインの `openclaw` CLIを使います。

例:

```bash
openclaw nodes camera list --node <id>            # camera id一覧
openclaw nodes camera snap --node <id>            # MEDIA:<path> を出力
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # MEDIA:<path> を出力
openclaw nodes camera clip --node <id> --duration-ms 3000      # MEDIA:<path> を出力（legacy flag）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注意:

- `openclaw nodes camera snap` は、上書きされない限りデフォルトで `maxWidth=1600` を使います。
- macOSでは、`camera.snap` はwarm-up/exposureが落ち着いた後、撮影前に `delayMs`（デフォルト 2000ms）待機します。
- 写真payloadは、base64が5 MB未満に収まるよう再圧縮されます。

## 安全性と実用上の制限

- cameraとmicrophoneへのアクセスでは、通常のOS権限プロンプトが表示されます（また、Info.plist内のusage stringも必要です）。
- 動画クリップは、node payloadの肥大化（base64のオーバーヘッド + メッセージ制限）を避けるため、上限があります（現在は `<= 60s`）。

## macOS screen video（OSレベル）

_cameraではなく_ screen videoには、macOS companionを使います。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # MEDIA:<path> を出力
```

注意:

- macOSの**Screen Recording**権限（TCC）が必要です。
