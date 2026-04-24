---
read_when:
    - OpenClawエージェントをGoogle Meet通話に参加させたい場合
    - Google MeetのトランスポートとしてChrome、Chrome Node、またはTwilioを設定している場合
summary: 'Google Meet Plugin: ChromeまたはTwilioを通じて明示的なMeet URLに参加し、リアルタイム音声をデフォルトで使用'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-24T09:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（Plugin）

OpenClaw向けのGoogle Meet参加者サポート。

このPluginは意図的に明示的な設計になっています:

- 明示された `https://meet.google.com/...` URL にのみ参加します。
- デフォルトモードは `realtime` 音声です。
- より深い推論やツールが必要な場合、realtime音声は完全なOpenClawエージェントにコールバックできます。
- 認証は、個人のGoogle OAuthまたはすでにサインイン済みのChromeプロファイルから開始します。
- 自動の同意告知はありません。
- デフォルトのChrome音声バックエンドは `BlackHole 2ch` です。
- Chromeはローカルでも、ペアリング済みNodeホスト上でも実行できます。
- Twilioは、ダイヤルイン番号に加えて、任意のPINまたはDTMFシーケンスを受け付けます。
- CLIコマンドは `googlemeet` です。`meet` は、より広範なエージェントのテレカンファレンスワークフロー用に予約されています。

## クイックスタート

ローカルの音声依存関係をインストールし、realtimeプロバイダーがOpenAIを使えるようにします:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` は `BlackHole 2ch` 仮想オーディオデバイスをインストールします。Homebrewのインストーラーでは、macOSがこのデバイスを認識する前に再起動が必要です:

```bash
sudo reboot
```

再起動後、両方を確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Pluginを有効化します:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

セットアップを確認します:

```bash
openclaw googlemeet setup
```

会議に参加します:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに `google_meet` ツール経由で参加させます:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chromeは、サインイン済みのChromeプロファイルとして参加します。Meetでは、OpenClawが使用するマイク/スピーカーパスとして `BlackHole 2ch` を選択してください。クリーンな双方向音声のためには、別々の仮想デバイスまたはLoopback風のグラフを使用してください。最初のスモークテストには単一のBlackHoleデバイスでも十分ですが、エコーが発生することがあります。

### ローカルGateway + Parallels Chrome

macOS VM内でChromeを所有させるためだけに、そのVM内で完全なOpenClaw GatewayやモデルAPIキーは**不要**です。Gatewayとエージェントはローカルで実行し、VM内ではNodeホストを実行してください。VM上でバンドル済みPluginを一度有効にしておくと、NodeがChromeコマンドを公開するようになります。

どこで何を動かすか:

- Gatewayホスト: OpenClaw Gateway、エージェントワークスペース、モデル/APIキー、realtimeプロバイダー、およびGoogle Meet Plugin設定。
- Parallels macOS VM: OpenClaw CLI/Nodeホスト、Google Chrome、SoX、BlackHole 2ch、およびGoogleにサインイン済みのChromeプロファイル。
- VM内で不要なもの: Gatewayサービス、エージェント設定、OpenAI/GPTキー、またはモデルプロバイダー設定。

VMの依存関係をインストールします:

```bash
brew install blackhole-2ch sox
```

BlackHoleのインストール後、macOSが `BlackHole 2ch` を認識するようにVMを再起動します:

```bash
sudo reboot
```

再起動後、VMがオーディオデバイスとSoXコマンドを認識できることを確認します:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM内でOpenClawをインストールまたは更新し、その後そこでバンドル済みPluginを有効化します:

```bash
openclaw plugins enable google-meet
```

VM内でNodeホストを起動します:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>` がLAN IPで、TLSを使用していない場合、その信頼されたプライベートネットワーク向けに明示的に許可しない限り、Nodeは平文WebSocketを拒否します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

NodeをLaunchAgentとしてインストールする場合も、同じ環境変数を使用します:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` はプロセス環境であり、`openclaw.json` の設定ではありません。`openclaw node install` は、インストールコマンド時にこれが存在すると、LaunchAgent環境へ保存します。

GatewayホストからNodeを承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

GatewayがNodeを認識し、`googlemeet.chrome` を公開していることを確認します:

```bash
openclaw nodes status
```

Gatewayホストで、そのNode経由にMeetをルーティングします:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

これで、Gatewayホストから通常どおり参加できます:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

または、エージェントに `google_meet` ツールを `transport: "chrome-node"` 付きで使わせます。

`chromeNode.node` を省略した場合、OpenClawが自動選択するのは、接続中のNodeで `googlemeet.chrome` を公開しているものがちょうど1つだけのときに限られます。対応可能なNodeが複数接続されている場合は、`chromeNode.node` にNode ID、表示名、またはリモートIPを設定してください。

よくある障害確認:

- `No connected Google Meet-capable node`: VM内で `openclaw node run` を起動し、ペアリングを承認し、VM内で `openclaw plugins enable google-meet` を実行済みであることを確認してください。また、Gatewayホストが `gateway.nodes.allowCommands: ["googlemeet.chrome"]` でそのNodeコマンドを許可していることも確認してください。
- `BlackHole 2ch audio device not found on the node`: VM内で `blackhole-2ch` をインストールし、VMを再起動してください。
- Chromeは開くが参加できない: VM内でChromeにサインインし、そのプロファイルでMeet URLへ手動参加できることを確認してください。
- 音声がない: Meetで、マイク/スピーカーをOpenClawが使用する仮想オーディオデバイス経路にルーティングしてください。クリーンな双方向音声のためには、別々の仮想デバイスまたはLoopback風ルーティングを使用してください。

## インストールに関する注記

Chromeのrealtimeデフォルトでは、2つの外部ツールを使用します:

- `sox`: コマンドライン音声ユーティリティ。Pluginは、デフォルトの8 kHz G.711 mu-law音声ブリッジのために、その `rec` および `play` コマンドを使用します。
- `blackhole-2ch`: macOS仮想オーディオドライバー。Chrome/Meetがルーティングできる `BlackHole 2ch` オーディオデバイスを作成します。

OpenClawは、どちらのパッケージもバンドルも再配布もしません。ドキュメントでは、ユーザーがこれらをHomebrew経由のホスト依存関係としてインストールするよう案内しています。SoXのライセンスは `LGPL-2.0-only AND GPL-2.0-only`、BlackHoleはGPL-3.0です。OpenClawとともにBlackHoleをバンドルしたインストーラーまたはアプライアンスを構築する場合は、BlackHoleの上流ライセンス条項を確認するか、Existential Audioから別ライセンスを取得してください。

## トランスポート

### Chrome

ChromeトランスポートはGoogle ChromeでMeet URLを開き、サインイン済みのChromeプロファイルとして参加します。macOSでは、Pluginは起動前に `BlackHole 2ch` を確認します。設定されている場合は、Chromeを開く前にオーディオブリッジのヘルスコマンドと起動コマンドも実行します。Chrome/音声がGatewayホスト上にある場合は `chrome` を使用し、Chrome/音声がParallels macOS VMのようなペアリング済みNode上にある場合は `chrome-node` を使用してください。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chromeのマイクおよびスピーカー音声を、ローカルのOpenClaw音声ブリッジ経由にルーティングします。`BlackHole 2ch` がインストールされていない場合、音声経路なしで黙って参加するのではなく、参加はセットアップエラーで失敗します。

### Twilio

Twilioトランスポートは、Voice Call Pluginに委譲される厳密なダイヤルプランです。Meetページを解析して電話番号を取得することはありません。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

会議でカスタムシーケンスが必要な場合は `--dtmf-sequence` を使用します:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuthと事前確認

Google Meet Media APIアクセスでは、まず個人のOAuthクライアントを使用します。`oauth.clientId` と、必要に応じて `oauth.clientSecret` を設定してから、次を実行します:

```bash
openclaw googlemeet auth login --json
```

このコマンドは、リフレッシュトークンを含む `oauth` 設定ブロックを出力します。PKCE、`http://localhost:8085/oauth2callback` でのlocalhostコールバック、および `--manual` による手動コピー&ペーストフローを使用します。

以下の環境変数はフォールバックとして受け付けられます:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` または `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` または `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` または `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` または `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` または
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` または `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` または `GOOGLE_MEET_PREVIEW_ACK`

`spaces.get` を通じて、Meet URL、コード、または `spaces/{id}` を解決します:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

メディア処理の前に事前確認を実行します:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Cloudプロジェクト、OAuthプリンシパル、および会議参加者がMeet media APIs向けGoogle Workspace Developer Preview Programに登録済みであることを確認した後にのみ、`preview.enrollmentAcknowledged: true` を設定してください。

## 設定

一般的なChrome realtimeパスでは、Plugin有効化、BlackHole、SoX、およびOpenAIキーだけが必要です:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Plugin設定は `plugins.entries.google-meet.config` 配下に設定します:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

デフォルト:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node` 用の任意のNode ID/名前/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: 8 kHz G.711 mu-law音声をstdoutへ書き出すSoX `rec` コマンド
- `chrome.audioOutputCommand`: stdinから8 kHz G.711 mu-law音声を読み込むSoX `play` コマンド
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: より深い回答のための `openclaw_agent_consult` を含む、短い話し言葉の応答
- `realtime.introMessage`: realtimeブリッジ接続時の短い音声準備確認。無言で参加したい場合は `""` に設定

任意の上書き:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
  },
}
```

Twilio専用設定:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

## ツール

エージェントは `google_meet` ツールを使用できます:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

ChromeがGatewayホスト上で動作している場合は `transport: "chrome"` を使用してください。ChromeがParallels VMのようなペアリング済みNode上で動作している場合は `transport: "chrome-node"` を使用してください。どちらの場合も、realtimeモデルと `openclaw_agent_consult` はGatewayホスト上で動作するため、モデル認証情報はそこに保持されます。

アクティブセッションを一覧表示したり、セッションIDを調べたりするには `action: "status"` を使用してください。realtimeエージェントに即座に発話させるには、`sessionId` と `message` を指定して `action: "speak"` を使用してください。セッションを終了済みとしてマークするには `action: "leave"` を使用してください。

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## realtimeエージェント相談

Chrome realtimeモードは、ライブ音声ループ向けに最適化されています。realtime音声プロバイダーは会議音声を聞き取り、設定された音声ブリッジを通じて発話します。realtimeモデルがより深い推論、最新情報、または通常のOpenClawツールを必要とする場合、`openclaw_agent_consult` を呼び出せます。

consultツールは、背後で通常のOpenClawエージェントを、最近の会議文字起こしコンテキスト付きで実行し、簡潔な音声応答をrealtime音声セッションへ返します。その後、音声モデルはその応答を会議内で発話できます。

`realtime.toolPolicy` はconsult実行を制御します:

- `safe-read-only`: consultツールを公開し、通常のエージェントを `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, および `memory_get` に制限します。
- `owner`: consultツールを公開し、通常のエージェントに通常のエージェントツールポリシーの使用を許可します。
- `none`: realtime音声モデルにconsultツールを公開しません。

consultセッションキーはMeetセッションごとにスコープされるため、同じ会議中の後続のconsult呼び出しでは、以前のconsultコンテキストを再利用できます。

Chromeが通話に完全参加した後、音声による準備確認を強制するには:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## 注記

Google Meetの公式メディアAPIは受信指向であるため、Meet通話内で発話するには依然として参加者経路が必要です。このPluginはその境界を明確に保ちます: Chromeはブラウザ参加とローカル音声ルーティングを担当し、Twilioは電話ダイヤルイン参加を担当します。

Chrome realtimeモードには次のいずれかが必要です:

- `chrome.audioInputCommand` と `chrome.audioOutputCommand`: OpenClawがrealtimeモデルブリッジを管理し、それらのコマンドと選択したrealtime音声プロバイダーの間で8 kHz G.711 mu-law音声をパイプします。
- `chrome.audioBridgeCommand`: 外部ブリッジコマンドがローカル音声経路全体を管理し、そのデーモンを起動または検証した後に終了する必要があります。

クリーンな双方向音声のためには、Meet出力とMeetマイクを別々の仮想デバイス、またはLoopback風の仮想デバイスグラフ経由でルーティングしてください。単一の共有BlackHoleデバイスでは、他の参加者の音声が通話へエコーバックすることがあります。

`googlemeet speak` は、Chromeセッションのアクティブなrealtime音声ブリッジをトリガーします。`googlemeet leave` はそのブリッジを停止します。Voice Call Plugin経由に委譲されたTwilioセッションでは、`leave` は基盤となる音声通話も切断します。

## 関連

- [Voice Call Plugin](/ja-JP/plugins/voice-call)
- [Talkモード](/ja-JP/nodes/talk)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
