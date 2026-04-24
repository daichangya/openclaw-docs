---
read_when:
    - ブラウザからGatewayを操作したい場合
    - SSHトンネルなしでTailnetアクセスを使いたい場合
summary: Gateway用のブラウザベースControl UI（チャット、Node、設定）
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:03:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Control UIは、Gatewayが配信する小さな**Vite + Lit**シングルページアプリです:

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

同じポート上の**Gateway WebSocketに直接**接続します。

## クイックオープン（ローカル）

Gatewayが同じコンピューター上で動作している場合は、次を開きます:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

ページが読み込めない場合は、まずGatewayを起動してください: `openclaw gateway`。

認証はWebSocketハンドシェイク中に次のいずれかで提供されます:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` のときのTailscale Serve IDヘッダー
- `gateway.auth.mode: "trusted-proxy"` のときのtrusted-proxy IDヘッダー

ダッシュボード設定パネルは、現在のブラウザータブセッションと選択したGateway URL用の
tokenを保持しますが、passwordは永続化されません。オンボーディングでは通常、
最初の接続時に共有シークレット認証用のGateway tokenを生成しますが、
`gateway.auth.mode` が `"password"` の場合はpassword認証も機能します。

## デバイスのペアリング（初回接続）

新しいブラウザーまたはデバイスからControl UIに接続すると、Gatewayは
**1回限りのペアリング承認**を要求します。これは、同じTailnet上で
`gateway.auth.allowTailscale: true` の場合でも同様です。これは、不正アクセスを防ぐためのセキュリティ対策です。

**表示内容:** 「disconnected (1008): pairing required」

**デバイスを承認するには:**

```bash
# 保留中のリクエストを一覧表示
openclaw devices list

# request IDで承認
openclaw devices approve <requestId>
```

ブラウザーが変更された認証詳細（role/scopes/public
key）で再度ペアリングを試みると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

ブラウザーがすでにペアリング済みで、読み取りアクセスから
書き込み/adminアクセスへ変更した場合、これは暗黙の再接続ではなく
承認アップグレードとして扱われます。OpenClawは古い承認を有効なまま維持し、より広い再接続をブロックし、
新しいスコープセットを明示的に承認するよう求めます。

一度承認されると、そのデバイスは記憶され、`openclaw devices revoke --device <id> --role <role>` で取り消さない限り
再承認は不要です。tokenのローテーションと取り消しについては
[Devices CLI](/ja-JP/cli/devices)を参照してください。

**注意:**

- 直接のローカルloopbackブラウザー接続（`127.0.0.1` / `localhost`）は
  自動承認されます。
- TailnetおよびLANのブラウザー接続は、同じマシンからの接続であっても、
  明示的な承認が必要です。
- 各ブラウザープロファイルは一意のデバイスIDを生成するため、ブラウザーを切り替えたり
  ブラウザーデータを消去したりすると、再ペアリングが必要になります。

## 個人ID（ブラウザーローカル）

Control UIは、共有セッションで送信メッセージの帰属情報として付与される、
ブラウザーごとの個人ID（表示名とアバター）をサポートしています。これはブラウザーストレージに保存され、
現在のブラウザープロファイルにスコープされ、他のデバイスには同期されず、
実際に送信したメッセージ上の通常のtranscript作成者メタデータを除いてサーバー側には永続化されません。サイトデータを消去したり
ブラウザーを切り替えたりすると空にリセットされます。

## ランタイム設定エンドポイント

Control UIは、そのランタイム設定を
`/__openclaw/control-ui-config.json` から取得します。このエンドポイントは
他のHTTPサーフェスと同じGateway認証で保護されています。未認証のブラウザーは取得できず、
取得に成功するには、すでに有効なGateway token/password、Tailscale Serve ID、またはtrusted-proxy IDのいずれかが必要です。

## 言語サポート

Control UIは、初回ロード時にブラウザーのロケールに基づいて自身をローカライズできます。
後で上書きするには、**Overview -> Gateway Access -> Language** を開いてください。この
ロケールピッカーはAppearanceではなく、Gateway Accessカード内にあります。

- サポートされるロケール: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 英語以外の翻訳はブラウザーで遅延ロードされます。
- 選択したロケールはブラウザーストレージに保存され、以後のアクセスで再利用されます。
- 翻訳キーが欠けている場合は英語にフォールバックします。

## 現在できること

- Gateway WS経由でモデルとチャット（`chat.history`, `chat.send`, `chat.abort`, `chat.inject`）
- ブラウザーからWebRTC経由でOpenAI Realtimeに直接接続。Gatewayは
  `talk.realtime.session` で短命のRealtimeクライアントシークレットを発行します。ブラウザーはマイク音声をOpenAIへ直接送信し、
  `openclaw_agent_consult` ツール呼び出しを、より大きく設定済みのOpenClawモデル向けに `chat.send` 経由で中継します。
- Chatでツール呼び出し + ライブツール出力カードをストリーミング（agentイベント）
- Channels: 組み込みおよびバンドル済み/外部Pluginチャンネルのステータス、QRログイン、およびチャンネルごとの設定（`channels.status`, `web.login.*`, `config.patch`）
- Instances: presence一覧 + 更新（`system-presence`）
- Sessions: 一覧 + セッションごとのmodel/thinking/fast/verbose/trace/reasoning上書き（`sessions.list`, `sessions.patch`）
- Dreams: Dreamingステータス、有効/無効トグル、およびDream Diaryリーダー（`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`）
- Cron jobs: 一覧/追加/編集/実行/有効化/無効化 + 実行履歴（`cron.*`）
- Skills: ステータス、有効/無効、インストール、APIキー更新（`skills.*`）
- Nodes: 一覧 + caps（`node.list`）
- Exec approvals: `exec host=gateway/node` 向けのGatewayまたはNode許可リスト + askポリシーの編集（`exec.approvals.*`）
- Config: `~/.openclaw/openclaw.json` の表示/編集（`config.get`, `config.set`）
- Config: バリデーション付き適用 + 再起動（`config.apply`）および最後にアクティブだったセッションのwake
- Config書き込みには、同時編集による上書きを防ぐbase-hashガードが含まれます
- Config書き込み（`config.set`/`config.apply`/`config.patch`）は、送信された設定ペイロード内のrefに対するアクティブなSecretRef解決も事前確認します。未解決のアクティブな送信refは書き込み前に拒否されます
- Configスキーマ + フォームレンダリング（`config.schema` / `config.schema.lookup`。
  フィールド `title` / `description`、一致したUIヒント、即時子要約、
  ネストしたobject/wildcard/array/compositionノード上のdocsメタデータ、
  加えて利用可能な場合はPlugin + チャンネルスキーマも含む）。Raw JSONエディターは、
  スナップショットに安全なraw往復変換がある場合にのみ利用可能です
- スナップショットがrawテキストを安全に往復変換できない場合、Control UIはFormモードを強制し、そのスナップショットではRawモードを無効化します
- Raw JSONエディターの「Reset to saved」は、フラット化されたスナップショットを再レンダリングするのではなく、rawで記述された形状（フォーマット、コメント、`$include` レイアウト）を保持するため、安全にraw往復変換できるスナップショットでは外部編集がリセット後も維持されます
- 構造化されたSecretRefオブジェクト値は、誤ってobjectをstringへ破壊的変換することを防ぐため、フォームのテキスト入力では読み取り専用として表示されます
- Debug: ステータス/health/modelsスナップショット + イベントログ + 手動RPC呼び出し（`status`, `health`, `models.list`）
- Logs: Gatewayファイルログのライブtail。フィルター/エクスポート対応（`logs.tail`）
- Update: パッケージ/git更新 + 再起動（`update.run`）。再起動レポート付き

Cron jobsパネルの注意:

- 分離ジョブでは、配信のデフォルトはannounce summaryです。内部専用実行にしたい場合はnoneへ切り替えられます。
- announceを選択すると、channel/targetフィールドが表示されます。
- Webhookモードは `delivery.mode = "webhook"` を使用し、`delivery.to` に有効なHTTP(S) Webhook URLを設定します。
- main-sessionジョブでは、webhookとnoneの配信モードが利用できます。
- 高度な編集コントロールには、delete-after-run、agent上書きのクリア、cronのexact/staggerオプション、
  agentのmodel/thinking上書き、およびベストエフォート配信トグルが含まれます。
- フォームバリデーションはフィールドレベルのエラー付きでインライン表示されます。無効な値がある間は保存ボタンが無効になります。
- 専用のbearer tokenを送信するには `cron.webhookToken` を設定してください。省略時、Webhookは認証ヘッダーなしで送信されます。
- 非推奨フォールバック: 保存済みのlegacyジョブで `notify: true` のものは、移行されるまで引き続き `cron.webhook` を使用できます。

## チャットの動作

- `chat.send` は**ノンブロッキング**です: 即座に `{ runId, status: "started" }` でackし、レスポンスは `chat` イベント経由でストリーミングされます。
- 同じ `idempotencyKey` で再送すると、実行中は `{ status: "in_flight" }`、完了後は `{ status: "ok" }` を返します。
- `chat.history` のレスポンスは、UI安全性のためサイズ制限があります。transcriptエントリが大きすぎる場合、Gatewayは長いテキストフィールドを切り詰めたり、重いメタデータブロックを省略したり、サイズ超過メッセージをプレースホルダー（`[chat.history omitted: message too large]`）に置き換えたりすることがあります。
- assistant/生成画像は管理対象メディア参照として永続化され、認証済みGatewayメディアURL経由で再配信されるため、再読み込み時にチャット履歴レスポンス内の生のbase64画像ペイロードに依存しません。
- `chat.history` は、表示専用のインラインdirectiveタグを可視assistantテキストから削除します（例: `[[reply_to_*]]` および `[[audio_as_voice]]`）、プレーンテキストのツール呼び出しXMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、および漏出したASCII/全角のモデル制御トークンも削除し、可視テキスト全体が正確なサイレントトークン `NO_REPLY` / `no_reply` のみであるassistantエントリは省略します。
- `chat.inject` はassistantノートをセッションtranscriptに追加し、UI専用更新用の `chat` イベントをブロードキャストします（agent実行なし、チャンネル配信なし）。
- チャットヘッダーのmodelおよびthinkingピッカーは、`sessions.patch` を通じてアクティブセッションを即座にpatchします。これらは1ターン限りの送信オプションではなく、永続的なセッション上書きです。
- Talk modeは、ブラウザー
  WebRTCセッションをサポートする登録済みrealtime voiceプロバイダーを使います。`talk.provider: "openai"` と
  `talk.providers.openai.apiKey` を設定するか、
  Voice Callのrealtimeプロバイダー設定を再利用してください。ブラウザーは標準のOpenAI API keyを受け取りません。受け取るのは
  一時的なRealtimeクライアントシークレットのみです。Google Live realtime voiceは、
  バックエンドVoice CallおよびGoogle Meetブリッジではサポートされていますが、このブラウザー
  WebRTCパスではまだサポートされていません。RealtimeセッションプロンプトはGatewayによって組み立てられます。
  `talk.realtime.session` は呼び出し元提供のinstruction上書きを受け付けません。
- Chat composerでは、Talkコントロールは
  マイク音声入力ボタンの隣にある波形ボタンです。Talkが開始すると、composerステータス行には
  `Connecting Talk...` が表示され、その後音声接続中は `Talk live`、
  realtimeツール呼び出しが `chat.send` 経由で設定済みの
  より大きなモデルへ問い合わせている間は `Asking OpenClaw...` と表示されます。
- 停止:
  - **Stop** をクリック（`chat.abort` を呼び出します）
  - 実行がアクティブな間、通常の追加入力はキューされます。キュー済みメッセージの **Steer** をクリックすると、その追加入力が実行中ターンに注入されます。
  - `/stop` を入力（または `stop`、`stop action`、`stop run`、`stop openclaw`、`please stop` のような単独の中止フレーズ）して帯域外中止
  - `chat.abort` は `{ sessionKey }`（`runId` なし）をサポートし、そのセッションのすべてのアクティブ実行を中止します
- 中止時の部分保持:
  - 実行が中止された場合でも、部分的なassistantテキストはUIに表示されることがあります
  - Gatewayは、バッファされた出力が存在する場合、中止された部分assistantテキストをtranscript履歴へ永続化します
  - 永続化されたエントリには中止メタデータが含まれるため、transcript利用側は中止による部分出力と通常完了出力を区別できます

## ホスト型embed

assistantメッセージは、`[embed ...]`
ショートコードを使ってホストされたWebコンテンツをインライン表示できます。iframeサンドボックスポリシーは
`gateway.controlUi.embedSandbox` で制御されます:

- `strict`: ホスト型embed内でのスクリプト実行を無効化します
- `scripts`: origin分離を維持したままインタラクティブembedを許可します。これが
  デフォルトで、通常は自己完結型のブラウザーゲーム/ウィジェットには十分です
- `trusted`: `allow-scripts` に加えて `allow-same-origin` を付与し、
  より強い権限を意図的に必要とする同一サイト文書向けに使います

例:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

埋め込み文書が本当にsame-origin
動作を必要とする場合にのみ `trusted` を使用してください。ほとんどのagent生成ゲームやインタラクティブcanvasでは、`scripts`
の方が安全な選択です。

絶対外部 `http(s)` embed URLはデフォルトで引き続きブロックされます。意図的に
`[embed url="https://..."]` でサードパーティーページを読み込みたい場合は、
`gateway.controlUi.allowExternalEmbedUrls: true` を設定してください。

## Tailnetアクセス（推奨）

### 統合Tailscale Serve（推奨）

Gatewayをloopbackのままにして、Tailscale ServeにHTTPSでプロキシさせます:

```bash
openclaw gateway --tailscale serve
```

次を開きます:

- `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

デフォルトでは、`gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocketのServeリクエストは
Tailscale IDヘッダー（`tailscale-user-login`）で認証できます。OpenClawは、
`x-forwarded-for` アドレスを `tailscale whois` で解決し、
それをヘッダーと照合することでIDを検証し、リクエストが
Tailscaleの `x-forwarded-*` ヘッダー付きでloopbackに到達した場合にのみこれらを受け入れます。
Serveトラフィックでも明示的な共有シークレット認証を必須にしたい場合は
`gateway.auth.allowTailscale: false` を設定してください。その場合は
`gateway.auth.mode: "token"` または
`"password"` を使用します。
この非同期Serve IDパスでは、同一クライアントIP
および認証スコープに対する認証失敗試行は、レート制限書き込み前に直列化されます。
そのため、同じブラウザーからの同時の不正再試行では、
2つの単純な不一致が並行競合する代わりに、2回目のリクエストで `retry later` が表示されることがあります。
tokenなしのServe認証は、Gatewayホストが信頼されていることを前提とします。そのホスト上で
信頼できないローカルコードが動作する可能性がある場合は、
token/password認証を必須にしてください。

### tailnetにbind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

その後、次を開きます:

- `http://<tailscale-ip>:18789/`（または設定済みの `gateway.controlUi.basePath`）

一致する共有シークレットをUI設定に貼り付けてください（
`connect.params.auth.token` または `connect.params.auth.password` として送信されます）。

## 安全でないHTTP

平文HTTP（`http://<lan-ip>` または `http://<tailscale-ip>`）でダッシュボードを開くと、
ブラウザーは**安全でないコンテキスト**で動作し、WebCryptoをブロックします。デフォルトでは、
OpenClawはデバイスIDなしのControl UI接続を**ブロック**します。

文書化された例外:

- `gateway.controlUi.allowInsecureAuth=true` によるlocalhost専用の安全でないHTTP互換性
- `gateway.auth.mode: "trusted-proxy"` を通した正常なoperator Control UI認証
- 非常用の `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**推奨される修正:** HTTPS（Tailscale Serve）を使うか、UIをローカルで開いてください:

- `https://<magicdns>/`（Serve）
- `http://127.0.0.1:18789/`（Gatewayホスト上）

**安全でない認証トグルの動作:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` はローカル互換性トグル専用です:

- 安全でないHTTPコンテキストで、localhostのControl UIセッションが
  デバイスIDなしで続行できるようにします。
- ペアリングチェックは回避しません。
- リモート（非localhost）デバイスID要件を緩和しません。

**非常用のみ:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` はControl UIのデバイスIDチェックを無効化し、
重大なセキュリティ低下をもたらします。緊急使用後は速やかに元へ戻してください。

trusted-proxyに関する注意:

- trusted-proxy認証に成功すると、デバイスIDなしでも
  **operator** Control UIセッションを受け入れられることがあります
- これはnode-role Control UIセッションには**拡張されません**
- 同一ホストのloopbackリバースプロキシは引き続きtrusted-proxy認証の条件を満たしません。詳細は
  [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照してください

HTTPSセットアップのガイダンスについては[Tailscale](/ja-JP/gateway/tailscale)を参照してください。

## Content Security Policy

Control UIには厳格な `img-src` ポリシーが含まれています: 許可されるのは**同一origin**のアセットと `data:` URLのみです。リモートの `http(s)` およびプロトコル相対画像URLはブラウザーによって拒否され、ネットワークフェッチは実行されません。

実際の意味:

- 相対パス配下で配信されるアバターや画像（例: `/avatars/<id>`）は引き続き表示されます。
- インライン `data:image/...` URLは引き続き表示されます（プロトコル内ペイロードに有用です）。
- チャンネルメタデータが出力するリモートアバターURLは、Control UIのアバターヘルパーで取り除かれ、組み込みロゴ/バッジに置き換えられます。これにより、侵害された、または悪意のあるチャンネルがoperatorブラウザーから任意のリモート画像フェッチを強制することを防ぎます。

この動作を得るために変更する必要はありません。これは常に有効で、設定変更はできません。

## アバタールート認証

Gateway認証が設定されている場合、Control UIのアバターエンドポイントには他のAPIと同じGateway tokenが必要です:

- `GET /avatar/<agentId>` は認証済み呼び出し元にのみアバター画像を返します。`GET /avatar/<agentId>?meta=1` は同じ条件でアバターメタデータを返します。
- どちらのルートへの未認証リクエストも拒否されます（隣接するassistant-mediaルートと同じ挙動）。これにより、他は保護されているホストでアバタールートからagent IDが漏れることを防ぎます。
- Control UI自体は、アバター取得時にGateway tokenをbearerヘッダーとして転送し、認証済みblob URLを使うため、ダッシュボードでも画像は正しく表示されます。

Gateway認証を無効にした場合（共有ホストでは非推奨）、アバタールートもGatewayの他の部分に合わせて未認証になります。

## UIのビルド

Gatewayは `dist/control-ui` から静的ファイルを配信します。次でビルドしてください:

```bash
pnpm ui:build
```

任意の絶対ベース（固定アセットURLが必要な場合）:

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

ローカル開発用（別のdevサーバー）:

```bash
pnpm ui:dev
```

その後、UIをGateway WS URL（例: `ws://127.0.0.1:18789`）に向けてください。

## デバッグ/テスト: devサーバー + リモートGateway

Control UIは静的ファイルで、WebSocketターゲットは設定可能であり、
HTTP originと異なっていても構いません。これは、Vite devサーバーはローカルで動かしつつ、
Gatewayは別の場所で動作させたいときに便利です。

1. UI devサーバーを起動: `pnpm ui:dev`
2. 次のようなURLを開きます:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

任意の1回限りの認証（必要な場合）:

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

注意:

- `gatewayUrl` はロード後にlocalStorageへ保存され、URLから削除されます。
- `token` は可能な限りURLフラグメント（`#token=...`）経由で渡してください。フラグメントはサーバーに送信されないため、リクエストログやRefererへの漏えいを防げます。legacyの `?token=` クエリパラメータも互換性のため1回だけ引き続き取り込まれますが、フォールバックにすぎず、起動直後に削除されます。
- `password` はメモリ内にのみ保持されます。
- `gatewayUrl` が設定されている場合、UIは設定や環境認証情報へフォールバックしません。
  `token`（または `password`）を明示的に指定してください。
  明示的な認証情報がないのはエラーです。
- GatewayがTLSの背後にある場合（Tailscale Serve、HTTPSプロキシなど）は `wss://` を使用してください。
- `gatewayUrl` はクリックジャッキングを防ぐため、トップレベルウィンドウでのみ受け付けられます（埋め込みでは不可）。
- 非loopbackのControl UIデプロイでは、`gateway.controlUi.allowedOrigins`
  を明示的に設定する必要があります（完全なorigin）。これにはリモートdevセットアップも含まれます。
- 厳密に管理されたローカルテスト以外では `gateway.controlUi.allowedOrigins: ["*"]` を使用しないでください。
  これは任意のブラウザーoriginを許可する意味であり、「今使っているホストに一致する」
  という意味ではありません。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Hostヘッダーoriginフォールバックモードを有効にしますが、危険なセキュリティモードです。

例:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

リモートアクセスのセットアップ詳細: [Remote access](/ja-JP/gateway/remote)。

## 関連

- [Dashboard](/ja-JP/web/dashboard) — Gatewayダッシュボード
- [WebChat](/ja-JP/web/webchat) — ブラウザーベースのチャットインターフェース
- [TUI](/ja-JP/web/tui) — TUI
- [Health Checks](/ja-JP/gateway/health) — Gatewayのヘルスモニタリング
