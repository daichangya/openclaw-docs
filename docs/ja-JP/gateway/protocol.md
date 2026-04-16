---
read_when:
    - Gateway WSクライアントの実装または更新
    - プロトコルの不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocketプロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gatewayプロトコル
x-i18n:
    generated_at: "2026-04-16T04:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 683e61ebe993a2d739bc34860060b0e3eda36b5c57267a2bcc03d177ec612fb3
    source_path: gateway/protocol.md
    workflow: 15
---

# Gatewayプロトコル（WebSocket）

Gateway WSプロトコルは、OpenClawの**単一のコントロールプレーン + ノード転送**です。すべてのクライアント（CLI、web UI、macOSアプリ、iOS/Androidノード、ヘッドレスノード）はWebSocket経由で接続し、ハンドシェイク時に自身の**role** + **scope**を宣言します。

## 転送

- WebSocket、JSONペイロードのテキストフレーム。
- 最初のフレームは**必ず**`connect`リクエストでなければなりません。

## ハンドシェイク（connect）

Gateway → Client（接続前チャレンジ）:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`、`features`、`snapshot`、`policy`はすべてスキーマ（`src/gateway/protocol/schema/frames.ts`）で必須です。`auth`と`canvasHostUrl`は任意です。

デバイストークンが発行される場合、`hello-ok`には次も含まれます:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼済みブートストラップのハンドオフ中、`hello-ok.auth`には`deviceTokens`内に追加の制限付きroleエントリが含まれる場合もあります:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

組み込みのnode/operatorブートストラップフローでは、主要なnodeトークンは`scopes: []`のままであり、引き渡されるoperatorトークンはブートストラップoperator allowlist（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に制限されたままです。ブートストラップのscopeチェックはroleプレフィックス付きのままです。operatorエントリはoperatorリクエストのみを満たし、operator以外のroleでも引き続き自身のroleプレフィックス配下のscopeが必要です。

### Nodeの例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## フレーミング

- **リクエスト**: `{type:"req", id, method, params}`
- **レスポンス**: `{type:"res", id, ok, payload|error}`
- **イベント**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を持つメソッドには**idempotency keys**が必要です（スキーマを参照）。

## Roles + scopes

### Roles

- `operator` = コントロールプレーンクライアント（CLI/UI/automation）。
- `node` = capabilityホスト（camera/screen/canvas/system.run）。

### Scopes（operator）

一般的なscope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`を指定した`talk.config`には`operator.talk.secrets`（または`operator.admin`）が必要です。

Plugin登録済みのGateway RPCメソッドは独自のoperator scopeを要求できますが、予約済みのコア管理プレフィックス（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に`operator.admin`に解決されます。

メソッドscopeは最初のゲートにすぎません。`chat.send`経由で到達する一部のスラッシュコマンドには、その上により厳しいコマンドレベルのチェックが適用されます。たとえば、永続的な`/config set`と`/config unset`の書き込みには`operator.admin`が必要です。

`node.pair.approve`にも、ベースのメソッドscopeに加えて追加の承認時scopeチェックがあります:

- コマンドなしのリクエスト: `operator.pairing`
- exec以外のnodeコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または`system.which`を含むリクエスト:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（node）

ノードは接続時にcapabilityクレームを宣言します:

- `caps`: 高レベルのcapabilityカテゴリ。
- `commands`: invoke用のコマンドallowlist。
- `permissions`: 細かなトグル（例: `screen.record`、`camera.capture`）。

Gatewayはこれらを**クレーム**として扱い、サーバー側allowlistを適用します。

## プレゼンス

- `system-presence`は、デバイスIDをキーとしたエントリを返します。
- プレゼンスエントリには`deviceId`、`roles`、`scopes`が含まれるため、UIはそのデバイスが**operator**と**node**の両方として接続している場合でも、デバイスごとに1行で表示できます。

## 一般的なRPCメソッドファミリー

このページは生成された完全ダンプではありませんが、公開WSサーフェスは上記のハンドシェイク/認証の例よりも広範です。現在Gatewayが公開している主要なメソッドファミリーは以下です。

`hello-ok.features.methods`は、`src/gateway/server-methods-list.ts`とロード済みplugin/channelのメソッドエクスポートから構築される保守的なディスカバリー一覧です。これを機能ディスカバリーとして扱ってください。`src/gateway/server-methods/*.ts`に実装されている呼び出し可能なすべてのヘルパーの生成ダンプではありません。

### Systemとidentity

- `health`は、キャッシュ済みまたは新たにプローブされたgateway healthスナップショットを返します。
- `status`は`/status`形式のgatewayサマリーを返します。機密フィールドは、admin scopeを持つoperatorクライアントにのみ含まれます。
- `gateway.identity.get`は、relayおよびpairingフローで使われるgateway device identityを返します。
- `system-presence`は、接続中のoperator/nodeデバイスの現在のプレゼンススナップショットを返します。
- `system-event`はsystem eventを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
- `last-heartbeat`は、最新の永続化されたHeartbeatイベントを返します。
- `set-heartbeats`は、Gateway上のHeartbeat処理を切り替えます。

### Modelsとusage

- `models.list`は、実行時に許可されたモデルカタログを返します。
- `usage.status`は、プロバイダー使用量ウィンドウ/残りクォータのサマリーを返します。
- `usage.cost`は、日付範囲に対する集計済みコスト使用量サマリーを返します。
- `doctor.memory.status`は、アクティブなデフォルトagent workspaceにおけるvector-memory / embeddingの準備状況を返します。
- `sessions.usage`は、セッションごとの使用量サマリーを返します。
- `sessions.usage.timeseries`は、1つのセッションの時系列使用量を返します。
- `sessions.usage.logs`は、1つのセッションの使用量ログエントリを返します。

### Channelsとloginヘルパー

- `channels.status`は、組み込み + バンドル済みchannel/pluginのステータスサマリーを返します。
- `channels.logout`は、そのchannelがlogoutをサポートしている場合に特定のchannel/accountをlogoutします。
- `web.login.start`は、現在のQR対応web channel providerのQR/web loginフローを開始します。
- `web.login.wait`は、そのQR/web loginフローの完了を待ち、成功時にchannelを開始します。
- `push.test`は、登録済みiOS nodeにテストAPNs pushを送信します。
- `voicewake.get`は、保存されているウェイクワードトリガーを返します。
- `voicewake.set`は、ウェイクワードトリガーを更新し、変更をブロードキャストします。

### Messagingとlogs

- `send`は、chat runner外でchannel/account/threadを対象にした送信を行う、直接のアウトバウンド配信RPCです。
- `logs.tail`は、カーソル/制限および最大バイト制御付きで、設定済みgateway file-log tailを返します。

### TalkとTTS

- `talk.config`は、有効なTalk設定ペイロードを返します。`includeSecrets`には`operator.talk.secrets`（または`operator.admin`）が必要です。
- `talk.mode`は、WebChat/Control UIクライアント向けに現在のTalkモード状態を設定/ブロードキャストします。
- `talk.speak`は、アクティブなTalk speech providerを通じて音声合成します。
- `tts.status`は、TTSの有効状態、アクティブなprovider、フォールバックprovider、およびprovider config状態を返します。
- `tts.providers`は、表示可能なTTS provider一覧を返します。
- `tts.enable`と`tts.disable`は、TTS設定状態を切り替えます。
- `tts.setProvider`は、優先TTS providerを更新します。
- `tts.convert`は、単発のtext-to-speech変換を実行します。

### Secrets、config、update、wizard

- `secrets.reload`は、アクティブなSecretRefを再解決し、完全に成功した場合にのみ実行時secret状態を切り替えます。
- `secrets.resolve`は、特定のcommand/targetセットに対するコマンド対象secret割り当てを解決します。
- `config.get`は、現在のconfigスナップショットとハッシュを返します。
- `config.set`は、検証済みconfigペイロードを書き込みます。
- `config.patch`は、部分的なconfig更新をマージします。
- `config.apply`は、完全なconfigペイロードを検証して置き換えます。
- `config.schema`は、Control UIとCLIツールで使われるライブconfig schemaペイロードを返します。schema、`uiHints`、version、生成メタデータを含み、実行時にロード可能な場合はplugin + channel schemaメタデータも含みます。このschemaには、nested object、wildcard、array-item、および一致するフィールドドキュメントが存在する場合の`anyOf` / `oneOf` / `allOf`構成分岐を含め、UIで使われる同じラベルとヘルプテキストから導出されたフィールド`title` / `description`メタデータが含まれます。
- `config.schema.lookup`は、1つのconfig pathに対するpathスコープのlookupペイロードを返します。正規化済みpath、浅いschema node、一致したhint + `hintPath`、およびUI/CLIのドリルダウン用の直下の子サマリーを返します。
  - lookup schema nodeは、ユーザー向けドキュメントと一般的な検証フィールドを保持します: `title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/オブジェクトの制約、および`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`のような真偽値フラグ。
  - 子サマリーは、`key`、正規化済み`path`、`type`、`required`、`hasChildren`、および一致した`hint` / `hintPath`を公開します。
- `update.run`は、Gateway updateフローを実行し、update自体が成功した場合にのみ再起動をスケジュールします。
- `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel`は、オンボーディングウィザードをWS RPCで公開します。

### 既存の主要ファミリー

#### Agentとworkspaceヘルパー

- `agents.list`は、設定済みagentエントリを返します。
- `agents.create`、`agents.update`、`agents.delete`は、agentレコードとworkspace接続を管理します。
- `agents.files.list`、`agents.files.get`、`agents.files.set`は、agent向けに公開されるブートストラップworkspaceファイルを管理します。
- `agent.identity.get`は、agentまたはsessionに対する有効なassistant identityを返します。
- `agent.wait`は、実行の完了を待ち、利用可能であれば終端スナップショットを返します。

#### Session制御

- `sessions.list`は、現在のセッションインデックスを返します。
- `sessions.subscribe`と`sessions.unsubscribe`は、現在のWSクライアントに対するセッション変更イベント購読を切り替えます。
- `sessions.messages.subscribe`と`sessions.messages.unsubscribe`は、1つのセッションに対するtranscript/messageイベント購読を切り替えます。
- `sessions.preview`は、特定のセッションキーに対する制限付きtranscriptプレビューを返します。
- `sessions.resolve`は、セッションターゲットを解決または正規化します。
- `sessions.create`は、新しいセッションエントリを作成します。
- `sessions.send`は、既存のセッションにメッセージを送信します。
- `sessions.steer`は、アクティブなセッション向けの割り込みして方向付けるバリアントです。
- `sessions.abort`は、セッションのアクティブな処理を中止します。
- `sessions.patch`は、セッションメタデータ/オーバーライドを更新します。
- `sessions.reset`、`sessions.delete`、`sessions.compact`は、セッションメンテナンスを実行します。
- `sessions.get`は、保存されている完全なセッション行を返します。
- chat実行では引き続き`chat.history`、`chat.send`、`chat.abort`、`chat.inject`を使います。
- `chat.history`は、UIクライアント向けに表示用に正規化されています。visible textからインラインdirectiveタグが削除され、プレーンテキストのtool-call XMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたtool-callブロックを含む）と、漏れたASCII/全角のmodel control tokenが削除され、完全にsilent-tokenだけのassistant行（完全一致の`NO_REPLY` / `no_reply`など）は省略され、過大な行はプレースホルダーに置き換えられる場合があります。

#### デバイスペアリングとデバイストークン

- `device.pair.list`は、保留中および承認済みのペア済みデバイスを返します。
- `device.pair.approve`、`device.pair.reject`、`device.pair.remove`は、デバイスペアリングレコードを管理します。
- `device.token.rotate`は、承認済みのroleおよびscopeの範囲内でペア済みデバイストークンをローテーションします。
- `device.token.revoke`は、ペア済みデバイストークンを無効化します。

#### Nodeのペアリング、invoke、保留中の作業

- `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.verify`は、nodeのペアリングとブートストラップ検証を扱います。
- `node.list`と`node.describe`は、既知/接続済みのnode状態を返します。
- `node.rename`は、ペア済みnodeラベルを更新します。
- `node.invoke`は、接続済みnodeにコマンドを転送します。
- `node.invoke.result`は、invokeリクエストの結果を返します。
- `node.event`は、node由来のイベントをgatewayに戻します。
- `node.canvas.capability.refresh`は、スコープ付きcanvas-capabilityトークンを更新します。
- `node.pending.pull`と`node.pending.ack`は、接続済みnodeキューAPIです。
- `node.pending.enqueue`と`node.pending.drain`は、オフライン/切断中のnode向けの永続的な保留作業を管理します。

#### 承認ファミリー

- `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve`は、単発のexec承認リクエストと、保留中承認の参照/再生を扱います。
- `exec.approval.waitDecision`は、1件の保留中exec承認を待機し、最終判断を返します（タイムアウト時は`null`）。
- `exec.approvals.get`と`exec.approvals.set`は、gateway exec承認ポリシースナップショットを管理します。
- `exec.approvals.node.get`と`exec.approvals.node.set`は、node relayコマンド経由でnodeローカルのexec承認ポリシーを管理します。
- `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve`は、Plugin定義の承認フローを扱います。

#### その他の主要ファミリー

- automation:
  - `wake`は、即時または次回Heartbeat時のwakeテキスト注入をスケジュールします
  - `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs`
- skills/tools: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`

### 一般的なイベントファミリー

- `chat`: `chat.inject`やその他のtranscript専用chatイベントなどのUI chat更新。
- `session.message`と`session.tool`: 購読中セッション向けのtranscript/event-stream更新。
- `sessions.changed`: セッションインデックスまたはメタデータが変更されました。
- `presence`: system presenceスナップショット更新。
- `tick`: 定期的なkeepalive / livenessイベント。
- `health`: gateway healthスナップショット更新。
- `heartbeat`: Heartbeatイベントストリーム更新。
- `cron`: cron実行/ジョブ変更イベント。
- `shutdown`: gatewayシャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: nodeペアリングのライフサイクル。
- `node.invoke.request`: node invokeリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペア済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec承認のライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin承認のライフサイクル。

### Nodeヘルパーメソッド

- ノードは、auto-allowチェック用に現在のskill実行可能ファイル一覧を取得するために`skills.bins`を呼び出せます。

### Operatorヘルパーメソッド

- operatorは、agentの実行時コマンド一覧を取得するために`commands.list`（`operator.read`）を呼び出せます。
  - `agentId`は任意です。省略するとデフォルトagent workspaceを参照します。
  - `scope`は、主要な`name`がどのサーフェスを対象にするかを制御します:
    - `text`は、先頭の`/`を除いた主要なテキストコマンドトークンを返します
    - `native`およびデフォルトの`both`パスは、利用可能な場合にprovider対応のnative名を返します
  - `textAliases`は、`/model`や`/m`のような正確なスラッシュエイリアスを保持します。
  - `nativeName`は、存在する場合にprovider対応のnativeコマンド名を保持します。
  - `provider`は任意で、native命名とnative Pluginコマンドの可用性にのみ影響します。
  - `includeArgs=false`は、レスポンスからシリアライズ済み引数メタデータを省略します。
- operatorは、agentの実行時ツールカタログを取得するために`tools.catalog`（`operator.read`）を呼び出せます。レスポンスには、グループ化されたツールと出所メタデータが含まれます:
  - `source`: `core`または`plugin`
  - `pluginId`: `source="plugin"`の場合のPlugin所有者
  - `optional`: Pluginツールが任意かどうか
- operatorは、セッションの実行時有効ツール一覧を取得するために`tools.effective`（`operator.read`）を呼び出せます。
  - `sessionKey`は必須です。
  - gatewayは、呼び出し元が指定したauthやdeliveryコンテキストを受け入れる代わりに、サーバー側でセッションから信頼できる実行時コンテキストを導出します。
  - レスポンスはセッションスコープであり、core、Plugin、channelツールを含め、現在アクティブな会話で今使えるものを反映します。
- operatorは、agentの表示可能なskill一覧を取得するために`skills.status`（`operator.read`）を呼び出せます。
  - `agentId`は任意です。省略するとデフォルトagent workspaceを参照します。
  - レスポンスには、生のsecret値を公開せずに、適格性、不足要件、configチェック、サニタイズ済みインストールオプションが含まれます。
- operatorは、ClawHubディスカバリーメタデータ向けに`skills.search`と`skills.detail`（`operator.read`）を呼び出せます。
- operatorは、`skills.install`（`operator.admin`）を2つのモードで呼び出せます:
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }`は、skillフォルダーをデフォルトagent workspaceの`skills/`ディレクトリにインストールします。
  - Gateway installerモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`は、gatewayホスト上で宣言済み`metadata.openclaw.install`アクションを実行します。
- operatorは、`skills.update`（`operator.admin`）を2つのモードで呼び出せます:
  - ClawHubモードでは、デフォルトagent workspace内の1つの追跡対象slug、またはすべての追跡対象ClawHubインストールを更新します。
  - Configモードでは、`enabled`、`apiKey`、`env`などの`skills.entries.<skillKey>`値にパッチを適用します。

## Exec承認

- execリクエストに承認が必要な場合、gatewayは`exec.approval.requested`をブロードキャストします。
- operatorクライアントは、`exec.approval.resolve`を呼び出して解決します（`operator.approvals` scopeが必要です）。
- `host=node`の場合、`exec.approval.request`には`systemRunPlan`（正規化された`argv`/`cwd`/`rawCommand`/sessionメタデータ）を含める必要があります。`systemRunPlan`が欠けているリクエストは拒否されます。
- 承認後、転送される`node.invoke system.run`呼び出しは、その正規化された`systemRunPlan`を権威あるコマンド/cwd/sessionコンテキストとして再利用します。
- 呼び出し元がprepareと最終承認済み`system.run`転送の間で`command`、`rawCommand`、`cwd`、`agentId`、または`sessionKey`を変更した場合、gatewayは変更されたペイロードを信用せずに実行を拒否します。

## Agent deliveryフォールバック

- `agent`リクエストには、アウトバウンド配信を要求するために`deliver=true`を含めることができます。
- `bestEffortDeliver=false`は厳密な動作を維持します。未解決または内部専用のdeliveryターゲットは`INVALID_REQUEST`を返します。
- `bestEffortDeliver=true`は、外部配信可能なルートを解決できない場合（たとえばinternal/webchatセッションや曖昧なマルチchannel設定）に、セッション専用実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION`は`src/gateway/protocol/schema/protocol-schemas.ts`にあります。
- クライアントは`minProtocol` + `maxProtocol`を送信し、サーバーは不一致を拒否します。
- スキーマ + モデルはTypeBox定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts`のリファレンスクライアントは、これらのデフォルト値を使用します。値はprotocol v3全体で安定しており、サードパーティクライアントにとって期待されるベースラインです。

| 定数 | デフォルト | ソース |
| --- | --- | --- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| リクエストタイムアウト（RPCごと） | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| 事前認証 / connect-challengeタイムアウト | `10_000` ms | `src/gateway/handshake-timeouts.ts`（`250`–`10_000`にクランプ） |
| 初期再接続バックオフ | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| 最大再接続バックオフ | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| device-token切断後の高速再試行クランプ | `250` ms | `src/gateway/client.ts` |
| `terminate()`前の強制停止猶予 | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| `stopAndWait()`のデフォルトタイムアウト | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| デフォルトtick間隔（`hello-ok`前） | `30_000` ms | `src/gateway/client.ts` |
| tick-timeout切断 | 無通信が`tickIntervalMs * 2`を超えた場合はコード`4000` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024`（25 MB） | `src/gateway/server-constants.ts` |

サーバーは、有効な`policy.tickIntervalMs`、`policy.maxPayload`、`policy.maxBufferedBytes`を`hello-ok`で通知します。クライアントは、ハンドシェイク前のデフォルト値ではなく、これらの値を尊重する必要があります。

## 認証

- 共有シークレットによるgateway認証は、設定された認証モードに応じて`connect.params.auth.token`または`connect.params.auth.password`を使います。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や非loopbackの`gateway.auth.mode: "trusted-proxy"`のようなidentity付きモードでは、`connect.params.auth.*`ではなくリクエストヘッダーからconnect認証チェックを満たします。
- private-ingressの`gateway.auth.mode: "none"`は共有シークレットのconnect認証を完全にスキップします。このモードを公開/信頼できないingressで公開しないでください。
- ペアリング後、Gatewayは接続のrole + scopesにスコープされた**device token**を発行します。これは`hello-ok.auth.deviceToken`で返され、クライアントは今後の接続のためにこれを永続化する必要があります。
- クライアントは、接続成功時には必ず主要な`hello-ok.auth.deviceToken`を永続化する必要があります。
- その**保存済み**device tokenで再接続する場合は、そのトークンに対して保存済みの承認scopeセットも再利用する必要があります。これにより、すでに許可されているread/probe/statusアクセスが維持され、再接続時により狭い暗黙のadmin専用scopeへと黙って縮小されることを防げます。
- クライアント側のconnect認証組み立て（`src/gateway/client.ts`内の`selectConnectAuth`）:
  - `auth.password`は独立しており、設定されていれば常に転送されます。
  - `auth.token`は優先順で設定されます: まず明示的な共有トークン、次に明示的な`deviceToken`、その次に保存済みのデバイス単位トークン（`deviceId` + `role`をキーとする）。
  - `auth.bootstrapToken`は、上記のどれでも`auth.token`が解決されなかった場合にのみ送信されます。共有トークンまたは解決済みdevice tokenがあれば抑止されます。
  - one-shotの`AUTH_TOKEN_MISMATCH`再試行時の保存済みdevice tokenの自動昇格は、**trusted endpointsのみ**で有効です — loopback、またはピン留めされた`tlsFingerprint`を持つ`wss://`です。ピン留めなしの公開`wss://`は該当しません。
- 追加の`hello-ok.auth.deviceTokens`エントリは、ブートストラップのハンドオフトークンです。`wss://`やloopback/local pairingのような信頼できる転送でブートストラップ認証を使って接続した場合にのみ永続化してください。
- クライアントが明示的な**`deviceToken`**または明示的な**`scopes`**を指定した場合、その呼び出し元が要求したscopeセットが引き続き権威あるものです。キャッシュ済みscopeは、クライアントが保存済みのデバイス単位トークンを再利用している場合にのみ再利用されます。
- device tokenは、`device.token.rotate`と`device.token.revoke`でローテーション/無効化できます（`operator.pairing` scopeが必要です）。
- トークン発行/ローテーションは、そのデバイスのpairingエントリに記録された承認済みroleセットの範囲内に制限されます。トークンのローテーションによって、そのデバイスをpairing承認で一度も許可されていないroleへ拡張することはできません。
- ペア済みデバイストークンセッションでは、呼び出し元が`operator.admin`も持っていない限り、デバイス管理は自分自身のスコープに限定されます。adminではない呼び出し元は、自分**自身の**デバイスエントリのみをremove/revoke/rotateできます。
- `device.token.rotate`は、要求されたoperator scopeセットも、呼び出し元の現在のセッションscopeに照らしてチェックします。adminではない呼び出し元は、現在保持しているものより広いoperator scopeセットへトークンをローテーションできません。
- 認証失敗には、`error.details.code`に加えて復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH`に対するクライアント動作:
  - 信頼できるクライアントは、キャッシュ済みのデバイス単位トークンで1回だけ制限付き再試行を試みられます。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operatorの対応ガイダンスを表示する必要があります。

## デバイスID + ペアリング

- ノードは、キーペアのフィンガープリントから導出された安定したデバイスID（`device.id`）を含める必要があります。
- Gatewayは、デバイス + roleごとにトークンを発行します。
- 新しいデバイスIDには、ローカル自動承認が有効になっていない限り、ペアリング承認が必要です。
- ペアリング自動承認は、直接のlocal loopback接続を中心にしています。
- OpenClawには、信頼済み共有シークレットのヘルパーフロー向けに、限定的なbackend/container-local self-connectパスもあります。
- 同一ホストのtailnetまたはLAN接続も、ペアリング上は引き続きリモートとして扱われ、承認が必要です。
- すべてのWSクライアントは、`connect`時に`device` IDを含める必要があります（operator + node）。
  Control UIがこれを省略できるのは次のモードのみです:
  - localhost専用の安全でないHTTP互換のための`gateway.controlUi.allowInsecureAuth=true`。
  - `gateway.auth.mode: "trusted-proxy"`によるoperator Control UI認証が成功している場合。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急用、重大なセキュリティ低下）。
- すべての接続は、サーバーが提供する`connect.challenge` nonceに署名する必要があります。

### デバイス認証移行の診断

従来のchallenge前署名動作をまだ使っているレガシークライアント向けに、`connect`は現在、安定した`error.details.reason`とともに`error.details.code`配下で`DEVICE_AUTH_*`詳細コードを返します。

一般的な移行失敗:

| メッセージ | details.code | details.reason | 意味 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | クライアントが`device.nonce`を省略した（または空で送信した）。 |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | クライアントが古い/誤ったnonceで署名した。 |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | 署名ペイロードがv2ペイロードと一致しない。 |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 署名済みタイムスタンプが許容スキュー範囲外。 |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id`が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | 公開鍵形式/正規化に失敗した。 |

移行先の目標:

- 必ず`connect.challenge`を待ちます。
- サーバーnonceを含むv2ペイロードに署名します。
- 同じnonceを`connect.params.device.nonce`で送信します。
- 推奨される署名ペイロードは`v3`で、device/client/role/scopes/token/nonceフィールドに加えて`platform`と`deviceFamily`も束縛します。
- レガシー`v2`署名も互換性のため引き続き受け入れられますが、ペア済みデバイスのメタデータ固定は、再接続時のコマンドポリシーを引き続き制御します。

## TLS + ピン留め

- WS接続でTLSがサポートされます。
- クライアントは任意でgateway証明書フィンガープリントをピン留めできます（`gateway.tls`設定に加えて`gateway.remote.tlsFingerprint`またはCLIの`--tls-fingerprint`を参照）。

## スコープ

このプロトコルは、**完全なgateway API**（status、channels、models、chat、agent、sessions、nodes、approvalsなど）を公開します。正確なサーフェスは、`src/gateway/protocol/schema.ts`内のTypeBoxスキーマで定義されています。
