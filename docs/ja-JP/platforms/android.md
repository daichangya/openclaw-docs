---
read_when:
    - Android nodeのペアリングまたは再接続 аиҳassistant to=multi_tool_use.parallel კომენტary  彩神争霸怎么json  天天中彩票这个ool_uses":[{"recipient_name":"functions.read","parameters":{"path":"/home/runner/work/docs/docs/source/.agents/skills/blacksmith-testbox/SKILL.md"}},{"recipient_name":"functions.read","parameters":{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md"}}]}
    - AndroidのGateway検出または認証のデバッグ
    - クライアント間でのチャット履歴の整合性の検証
summary: 'Androidアプリ（node）: 接続ランブック + Connect/Chat/Voice/Canvasコマンドサーフェス'
title: Androidアプリ
x-i18n:
    generated_at: "2026-04-25T13:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **注:** Androidアプリはまだ一般公開されていません。ソースコードは [OpenClaw repository](https://github.com/openclaw/openclaw) の `apps/android` 配下で公開されています。Java 17とAndroid SDKを使って自分でビルドできます（`./gradlew :app:assemblePlayDebug`）。ビルド手順については [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) を参照してください。

## サポート概要

- 役割: companion nodeアプリ（AndroidはGatewayをホストしません）。
- Gateway必須: はい（macOS、Linux、またはWindows via WSL2で実行してください）。
- インストール: [はじめに](/ja-JP/start/getting-started) + [Pairing](/ja-JP/channels/pairing)。
- Gateway: [ランブック](/ja-JP/gateway) + [Configuration](/ja-JP/gateway/configuration)。
  - プロトコル: [Gatewayプロトコル](/ja-JP/gateway/protocol)（node + control plane）。

## システム制御

システム制御（launchd/systemd）はGatewayホスト側にあります。[Gateway](/ja-JP/gateway) を参照してください。

## 接続ランブック

Android nodeアプリ ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

AndroidはGateway WebSocketへ直接接続し、デバイスペアリング（`role: node`）を使用します。

Tailscaleまたは公開ホストでは、Androidは安全なエンドポイントを必要とします:

- 推奨: Tailscale Serve / Funnel と `https://<magicdns>` / `wss://<magicdns>`
- サポート対象: 実TLSエンドポイントを持つその他の `wss://` Gateway URL
- 平文の `ws://` も、プライベートLANアドレス / `.local` ホスト、および `localhost`、`127.0.0.1`、Androidエミュレーターブリッジ（`10.0.2.2`）では引き続きサポートされます

### 前提条件

- 「master」マシンでGatewayを実行できること。
- Androidデバイス/エミュレーターがGateway WebSocketへ到達できること:
  - mDNS/NSDを使う同一LAN、**または**
  - Wide-Area Bonjour / unicast DNS-SDを使う同一Tailscale tailnet（下記参照）、**または**
  - 手動のGateway host/port（フォールバック）
- tailnet/公開モバイルペアリングでは、生のtailnet IP `ws://` エンドポイントは**使用しません**。代わりにTailscale Serveまたは別の `wss://` URLを使用してください。
- Gatewayマシン上でCLI（`openclaw`）を実行できること（またはSSH経由）。

### 1) Gatewayを起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような表示があることを確認してください:

- `listening on ws://0.0.0.0:18789`

Tailscale経由でAndroidからリモートアクセスする場合は、生のtailnet bindではなくServe/Funnelを推奨します:

```bash
openclaw gateway --tailscale serve
```

これにより、Android向けに安全な `wss://` / `https://` エンドポイントが提供されます。単なる `gateway.bind: "tailnet"` 設定だけでは、TLSを別途終端しない限り、初回のリモートAndroidペアリングには不十分です。

### 2) 検出を確認する（任意）

Gatewayマシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

追加のデバッグメモ: [Bonjour](/ja-JP/gateway/bonjour)。

wide-area discovery domainも設定している場合は、次と比較してください:

```bash
openclaw gateway discover --json
```

これは1回で `local.` と設定済みwide-area domainの両方を表示し、
TXT-onlyヒントではなく解決済みservice endpointを使用します。

#### tailnet（Vienna ⇄ London）検出 via unicast DNS-SD

AndroidのNSD/mDNS検出はネットワークをまたげません。Android nodeとGatewayが別ネットワーク上にあり、Tailscaleで接続されている場合は、代わりにWide-Area Bonjour / unicast DNS-SDを使用してください。

ただし、検出だけではtailnet/公開Androidペアリングには不十分です。検出された経路にも引き続き安全なエンドポイント（`wss://` またはTailscale Serve）が必要です:

1. Gatewayホスト上にDNS-SD zone（例 `openclaw.internal.`）を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. そのDNSサーバーを指すよう、選択したdomainに対してTailscale split DNSを設定します。

詳細とCoreDNS設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3) Androidから接続する

Androidアプリ内で:

- アプリは **foreground service**（常駐通知）を使ってGateway接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使用します。
- 検出がブロックされる場合は、**Advanced controls** で手動のhost/portを使用します。プライベートLANホストでは `ws://` が引き続き使えます。Tailscale/公開ホストではTLSを有効にし、`wss://` / Tailscale Serveエンドポイントを使用してください。

最初のペアリングに成功すると、Androidは起動時に自動再接続します:

- 手動エンドポイント（有効な場合）、それ以外では
- 最後に検出したGateway（best-effort）。

### 4) ペアリングを承認する（CLI）

Gatewayマシンで:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [Pairing](/ja-JP/channels/pairing)。

任意: Android nodeが常に厳密に管理されたサブネットから接続する場合は、明示的なCIDRまたは正確なIPで、初回node auto-approvalをオプトインできます:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これはデフォルトで無効です。適用対象は、要求されたscopeのない新規 `role: node` ペアリングだけです。operator/browserペアリング、およびrole、scope、metadata、public keyの変更では、引き続き手動承認が必要です。

### 5) nodeが接続されていることを確認する

- nodes status経由:

  ```bash
  openclaw nodes status
  ```

- Gateway経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + 履歴

AndroidのChatタブはセッション選択をサポートしています（デフォルトは `main`、加えて他の既存セッション）:

- 履歴: `chat.history`（表示正規化済み。インラインdirective tagは
  表示テキストから削除され、プレーンテキストのtool-call XML payload（
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`、および
  切り詰められたtool-call blockを含む）と、漏れたASCII/全角のmodel control tokenは
  削除され、正確な `NO_REPLY` /
  `no_reply` のような純粋なsilent-token assistant rowは省略され、
  サイズ超過のrowはplaceholderに置き換えられることがあります）
- 送信: `chat.send`
- 更新のpush（best-effort）: `chat.subscribe` → `event:"chat"`

### 7) Canvas + カメラ

#### Gateway Canvas Host（Webコンテンツ向け推奨）

エージェントがディスク上で編集できる実際のHTML/CSS/JSをnodeに表示したい場合は、nodeをGateway canvas hostへ向けてください。

注: nodeはGateway HTTPサーバー（`gateway.port` と同じポート、デフォルト `18789`）からcanvasを読み込みます。

1. Gatewayホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。

2. nodeをそこへナビゲートします（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（任意）: 両デバイスがTailscale上にある場合は、`.local` の代わりにMagicDNS名またはtailnet IPを使ってください。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーはlive-reloadクライアントをHTMLへ注入し、ファイル変更時に再読み込みします。
A2UI hostは `http://<gateway-host>:18789/__openclaw__/a2ui/` にあります。

Canvasコマンド（foreground時のみ）:

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`（デフォルトscaffoldへ戻るには `{"url":""}` または `{"url":"/"}` を使用）。`canvas.snapshot` は `{ format, base64 }` を返します（デフォルト `format="jpeg"`）。
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` （旧エイリアス `canvas.a2ui.pushJSONL`）

カメラコマンド（foreground時のみ、permissionゲートあり）:

- `camera.snap` (jpg)
- `camera.clip` (mp4)

パラメータとCLIヘルパーについては [Camera node](/ja-JP/nodes/camera) を参照してください。

### 8) Voice + 拡張されたAndroidコマンドサーフェス

- Voice: AndroidはVoiceタブで単一のマイクon/offフローを使用し、transcript captureと `talk.speak` 再生を行います。ローカルのシステムTTSは `talk.speak` が利用できない場合にのみ使われます。アプリがforegroundを離れるとVoiceは停止します。
- Voice wake/talk-modeのトグルは現在AndroidのUX/runtimeから削除されています。
- 追加のAndroidコマンドファミリー（利用可否はデバイス + permissionに依存）:
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`（下記の [Notification forwarding](#notification-forwarding) を参照）
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant entrypoints

Androidは、システムassistantトリガー（Google
Assistant）からのOpenClaw起動をサポートします。設定されている場合、
ホームボタン長押し、または「Hey Google, ask
OpenClaw...」でアプリが開き、プロンプトがchat composerへ渡されます。

これはアプリmanifestで宣言されたAndroid **App Actions** metadataを使います。Gateway側では追加設定は不要です -- assistant intentは完全にAndroidアプリ側で処理され、通常のchat messageとして転送されます。

<Note>
App Actionsの利用可否は、デバイス、Google Play Servicesのバージョン、
およびユーザーがOpenClawをデフォルトassistantアプリに設定しているかどうかに依存します。
</Note>

## Notification forwarding

Androidはデバイス通知をイベントとしてGatewayへ転送できます。どの通知をいつ転送するかをスコープするための、いくつかの制御があります。

| キー                             | 型             | 説明                                                                                           |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | これらのpackage名からの通知だけを転送します。設定されている場合、他のすべてのpackageは無視されます。 |
| `notifications.denyPackages`     | string[]       | これらのpackage名からの通知は決して転送しません。`allowPackages` の後に適用されます。            |
| `notifications.quietHours.start` | string (HH:mm) | quiet hoursウィンドウの開始（ローカルデバイス時刻）。この時間帯は通知が抑制されます。             |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hoursウィンドウの終了。                                                                   |
| `notifications.rateLimit`        | number         | packageごとの1分あたり転送通知最大数。超過した通知は破棄されます。                              |

通知ピッカーも、転送される通知イベントに対してより安全な挙動を使用し、機密性の高いシステム通知の誤転送を防ぎます。

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
Notification forwardingにはAndroid Notification Listener permissionが必要です。アプリはセットアップ中にこれを要求します。
</Note>

## 関連

- [iOS app](/ja-JP/platforms/ios)
- [Nodes](/ja-JP/nodes)
- [Android node troubleshooting](/ja-JP/nodes/troubleshooting)
