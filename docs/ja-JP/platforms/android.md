---
read_when:
    - Android node をペアリングまたは再接続する場合
    - Android の Gateway 検出または auth をデバッグする場合
    - クライアント間で chat history の整合性を確認する場合
summary: 'Android app（node）: 接続ランブック + Connect/Chat/Voice/Canvas のコマンドサーフェス'
title: Android App
x-i18n:
    generated_at: "2026-04-05T12:50:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Android App（Node）

> **注:** Android app はまだ一般公開されていません。ソースコードは [OpenClaw repository](https://github.com/openclaw/openclaw) の `apps/android` にあります。Java 17 と Android SDK を使用して自分でビルドできます（`./gradlew :app:assemblePlayDebug`）。ビルド手順については [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) を参照してください。

## サポート状況の概要

- 役割: コンパニオン node app（Android は Gateway をホストしません）
- Gateway 必須: はい（macOS、Linux、または Windows の WSL2 上で実行）
- インストール: [はじめに](/ja-JP/start/getting-started) + [Pairing](/ja-JP/channels/pairing)
- Gateway: [Runbook](/gateway) + [Configuration](/gateway/configuration)
  - プロトコル: [Gateway protocol](/gateway/protocol)（nodes + control plane）

## システム制御

システム制御（launchd/systemd）は Gateway ホスト側にあります。[Gateway](/gateway) を参照してください。

## 接続ランブック

Android node app ⇄（mDNS/NSD + WebSocket）⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、device pairing（`role: node`）を使用します。

Tailscale または公開ホストでは、Android は安全な endpoint を必要とします:

- 推奨: Tailscale Serve / Funnel と `https://<magicdns>` / `wss://<magicdns>`
- 代替: 実際の TLS endpoint を持つその他の `wss://` Gateway URL
- 平文の `ws://` は、private LAN アドレス / `.local` ホスト、および `localhost`、`127.0.0.1`、Android emulator bridge（`10.0.2.2`）では引き続きサポートされます

### 前提条件

- 「master」マシン上で Gateway を実行できること
- Android デバイス / emulator から gateway WebSocket に到達できること:
  - mDNS/NSD を使う同一 LAN、**または**
  - 同一 Tailscale tailnet 上で Wide-Area Bonjour / unicast DNS-SD を使う場合（下記参照）、**または**
  - 手動で gateway host/port を指定する場合（フォールバック）
- tailnet / public のモバイル pairing では、生の tailnet IP `ws://` endpoint は使用しません。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- gateway マシン上で CLI（`openclaw`）を実行できること（または SSH 経由で実行できること）

### 1) Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような表示が出ることを確認します:

- `listening on ws://0.0.0.0:18789`

Tailscale 経由で Android からリモートアクセスする場合は、生の tailnet bind ではなく Serve / Funnel を推奨します:

```bash
openclaw gateway --tailscale serve
```

これにより、Android 向けに安全な `wss://` / `https://` endpoint が提供されます。単なる `gateway.bind: "tailnet"` 設定だけでは、TLS を別途終端しない限り、初回のリモート Android pairing には不十分です。

### 2) 検出を確認する（任意）

gateway マシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

デバッグの詳細: [Bonjour](/gateway/bonjour)

wide-area discovery domain も設定している場合は、次と比較してください:

```bash
openclaw gateway discover --json
```

これにより、`local.` と設定済み wide-area domain が 1 回で表示され、TXT-only のヒントではなく、解決された
service endpoint が使用されます。

#### tailnet（Vienna ⇄ London）検出と unicast DNS-SD

Android の NSD/mDNS 検出はネットワークを越えません。Android node と gateway が別ネットワーク上にあり、Tailscale で接続されている場合は、Wide-Area Bonjour / unicast DNS-SD を使用してください。

検出だけでは tailnet / public の Android pairing には不十分です。検出された経路も引き続き安全な endpoint（`wss://` または Tailscale Serve）を必要とします:

1. gateway ホスト上に DNS-SD zone（例: `openclaw.internal.`）を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. 選択した domain をその DNS サーバーに向ける Tailscale split DNS を設定します。

詳細と CoreDNS 設定例: [Bonjour](/gateway/bonjour)

### 3) Android から接続する

Android app で:

- app は **foreground service**（永続通知）を通じて gateway 接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使用します。
- 検出がブロックされる場合は、**Advanced controls** で手動の host/port を使用します。private LAN ホストでは `ws://` が引き続き使えます。Tailscale / public ホストでは TLS を有効にし、`wss://` / Tailscale Serve endpoint を使用してください。

最初の pairing が成功した後、Android は起動時に自動再接続します:

- 手動 endpoint（有効な場合）、それ以外では
- 最後に検出された gateway（best-effort）

### 4) pairing を承認する（CLI）

gateway マシン上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

pairing の詳細: [Pairing](/ja-JP/channels/pairing)

### 5) node が接続されていることを確認する

- nodes status を使う場合:

  ```bash
  openclaw nodes status
  ```

- Gateway 経由の場合:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + history

Android の Chat タブは、セッション選択（デフォルトは `main`、それ以外に既存セッションも）をサポートします:

- History: `chat.history`（表示正規化済み。インライン directive タグは
  可視テキストから除去され、プレーンテキストの tool-call XML ペイロード
  （`<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`,
  および切り詰められた tool-call ブロックを含む）と、漏れた ASCII / 全角の model 制御 token は除去され、
  `NO_REPLY` / `no_reply` と完全一致する純粋な silent-token assistant 行は省略され、
  大きすぎる行はプレースホルダーに置き換えられることがあります）
- Send: `chat.send`
- Push 更新（best-effort）: `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host（web コンテンツに推奨）

agent がディスク上で編集できる実際の HTML/CSS/JS を node に表示したい場合は、node を Gateway canvas host に向けてください。

注: nodes は Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルト `18789`）から canvas を読み込みます。

1. gateway ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。

2. node をそこへ遷移させます（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（任意）: 両デバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使用します。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`

このサーバーは HTML に live-reload クライアントを注入し、ファイル変更時に再読み込みします。
A2UI host は `http://<gateway-host>:18789/__openclaw__/a2ui/` にあります。

Canvas コマンド（foreground のみ）:

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`（デフォルト scaffold に戻るには `{"url":""}` または `{"url":"/"}` を使用）。`canvas.snapshot` は `{ format, base64 }` を返します（デフォルト `format="jpeg"`）。
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset`（レガシー alias: `canvas.a2ui.pushJSONL`）

Camera コマンド（foreground のみ、permission 制御あり）:

- `camera.snap`（jpg）
- `camera.clip`（mp4）

パラメーターと CLI ヘルパーについては [Camera node](/nodes/camera) を参照してください。

### 8) Voice + 拡張された Android コマンドサーフェス

- Voice: Android は Voice タブで単一の mic on/off フローを使用し、transcript 取得と `talk.speak` 再生を行います。ローカルのシステム TTS は `talk.speak` が利用できない場合にのみ使用されます。app が foreground を離れると Voice は停止します。
- Voice wake / talk-mode の切り替えは、現在 Android の UX / runtime から削除されています。
- 追加の Android コマンドファミリー（利用可否はデバイス + permission に依存）:
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`（下記の [Notification forwarding](#notification-forwarding) を参照）
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant エントリーポイント

Android は、システム assistant トリガー（Google
Assistant）から OpenClaw を起動することをサポートしています。設定されている場合、ホームボタン長押しまたは「Hey Google, ask
OpenClaw...」で app が開き、プロンプトが chat composer に渡されます。

これは app manifest で宣言された Android **App Actions** メタデータを使用します。gateway 側で追加設定は不要です。assistant intent は Android app によって完全に処理され、通常の chat message として転送されます。

<Note>
App Actions の可用性は、デバイス、Google Play Services のバージョン、およびユーザーが OpenClaw をデフォルトの assistant app に設定しているかどうかに依存します。
</Note>

## Notification forwarding

Android はデバイス通知をイベントとして gateway に転送できます。複数の制御項目により、どの通知を、いつ転送するかの範囲を制限できます。

| Key                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | これらの package 名からの通知のみを転送します。設定されている場合、それ以外のすべての package は無視されます。      |
| `notifications.denyPackages`     | string[]       | これらの package 名からの通知は決して転送しません。`allowPackages` の後に適用されます。              |
| `notifications.quietHours.start` | string (HH:mm) | quiet hours ウィンドウの開始時刻（デバイスのローカル時刻）。このウィンドウ中は通知が抑制されます。 |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hours ウィンドウの終了時刻。                                                                        |
| `notifications.rateLimit`        | number         | package ごとの 1 分あたりの最大転送通知数。超過した通知は破棄されます。         |

通知 picker も、転送された通知イベントに対してより安全な動作を使用し、機密性の高いシステム通知が誤って転送されるのを防ぎます。

設定例:

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
Notification forwarding には Android Notification Listener 権限が必要です。app はセットアップ中にこれを求めます。
</Note>
