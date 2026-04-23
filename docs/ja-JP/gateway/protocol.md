---
read_when:
    - Gateway WSクライアントの実装または更新
    - プロトコルの不一致や接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocketプロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gatewayプロトコル
x-i18n:
    generated_at: "2026-04-23T04:45:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Gatewayプロトコル（WebSocket）

Gateway WSプロトコルは、OpenClawの**単一のコントロールプレーン + Nodeトランスポート**です。すべてのクライアント（CLI、web UI、macOSアプリ、iOS/Android Node、ヘッドレスNode）はWebSocket経由で接続し、ハンドシェイク時に自分の**role**と**scope**を宣言します。

## トランスポート

- WebSocket。JSONペイロードを持つテキストフレームを使用します。
- 最初のフレームは**必ず**`connect`リクエストでなければなりません。
- 接続前フレームは64 KiBに制限されます。ハンドシェイク成功後、クライアントは`hello-ok.policy.maxPayload`と`hello-ok.policy.maxBufferedBytes`の制限に従う必要があります。診断が有効な場合、サイズ超過の受信フレームや低速な送信バッファは、Gatewayが影響を受けたフレームをクローズまたはドロップする前に`payload.large`イベントを出力します。これらのイベントはサイズ、制限、サーフェス、安全なreason codeを保持します。メッセージ本文、添付ファイル内容、生フレーム本文、トークン、cookie、シークレット値は保持しません。

## ハンドシェイク（connect）

Gateway → クライアント（接続前チャレンジ）:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアント → Gateway:

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

Gateway → クライアント:

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

`server`、`features`、`snapshot`、`policy`はすべてスキーマ（`src/gateway/protocol/schema/frames.ts`）で必須です。`canvasHostUrl`は任意です。`auth`は利用可能な場合にネゴシエート済みのrole/scopesを報告し、Gatewayが発行した場合は`deviceToken`も含みます。

device tokenが発行されない場合でも、`hello-ok.auth`はネゴシエート済み権限を報告できます。

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

device tokenが発行される場合、`hello-ok`には次も含まれます。

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼済みbootstrap handoffの間、`hello-ok.auth`には`deviceTokens`内に追加の範囲制限付きroleエントリが含まれることもあります。

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

組み込みのnode/operator bootstrapフローでは、プライマリNode tokenは`scopes: []`のままで、hand-offされたoperator tokenはbootstrap operator allowlist（`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`）に制限されたままです。bootstrap scopeチェックは引き続きrole接頭辞付きのままです。operatorエントリはoperatorリクエストだけを満たし、operator以外のroleは依然として自分自身のrole接頭辞配下のscopeが必要です。

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用のあるメソッドには**idempotency key**が必要です（スキーマを参照）。

## role + scope

### role

- `operator` = コントロールプレーンクライアント（CLI/UI/automation）。
- `node` = 機能ホスト（camera/screen/canvas/system.run）。

### scope（operator）

一般的なscope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`を伴う`talk.config`には`operator.talk.secrets`（または`operator.admin`）が必要です。

plugin登録Gateway RPCメソッドは独自のoperator scopeを要求する場合がありますが、予約済みのコアadmin接頭辞（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は常に`operator.admin`に解決されます。

メソッドscopeは最初のゲートにすぎません。`chat.send`経由で到達する一部のスラッシュコマンドでは、さらに厳しいコマンドレベルチェックが適用されます。たとえば、永続的な`/config set`および`/config unset`の書き込みには`operator.admin`が必要です。

`node.pair.approve`にも、ベースメソッドscopeに加えて追加の承認時scopeチェックがあります。

- コマンドなしリクエスト: `operator.pairing`
- 非exec Nodeコマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、`system.which`を含むリクエスト:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions（node）

Nodeは接続時に機能クレームを宣言します。

- `caps`: 高レベルの機能カテゴリ。
- `commands`: invoke用のコマンドallowlist。
- `permissions`: 細かなトグル（例: `screen.record`、`camera.capture`）。

Gatewayはこれらを**クレーム**として扱い、サーバー側allowlistを適用します。

## プレゼンス

- `system-presence`はdevice identityをキーとするエントリを返します。
- プレゼンスエントリには`deviceId`、`roles`、`scopes`が含まれるため、UIは同じデバイスが**operator**と**node**の両方で接続している場合でも1行で表示できます。

## ブロードキャストイベントのscope適用

サーバープッシュのWebSocketブロードキャストイベントにはscopeゲートが適用されるため、pairing-scope専用またはnode専用のセッションが受動的にセッション内容を受け取ることはありません。

- **チャット、agent、tool-resultフレーム**（ストリームされた`agent`イベントやtool call結果を含む）には少なくとも`operator.read`が必要です。`operator.read`を持たないセッションでは、これらのフレームは完全にスキップされます。
- **plugin定義の`plugin.*`ブロードキャスト**は、pluginの登録方法に応じて`operator.write`または`operator.admin`でゲートされます。
- **statusおよびトランスポートイベント**（`heartbeat`、`presence`、`tick`、接続/切断ライフサイクルなど）は無制限のままなので、すべての認証済みセッションからトランスポートの健全性を観測できます。
- **未知のブロードキャストイベントファミリー**は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでscopeゲートされます（fail-closed）。

各クライアント接続はクライアントごとの独自のシーケンス番号を保持するため、異なるクライアントがscopeでフィルタされた異なるイベント部分集合を見ていても、そのソケット上では単調な順序が維持されます。

## 一般的なRPCメソッドファミリー

このページは生成済みの完全ダンプではありませんが、公開WSサーフェスは上記のハンドシェイク/認証例より広範です。以下は、現在Gatewayが公開している主要なメソッドファミリーです。

`hello-ok.features.methods`は、`src/gateway/server-methods-list.ts`と、読み込まれたplugin/channelのメソッドエクスポートから構築された保守的なディスカバリーリストです。これを機能ディスカバリーとして扱ってください。`src/gateway/server-methods/*.ts`に実装されているすべての呼び出し可能ヘルパーの生成済みダンプではありません。

### システムとアイデンティティ

- `health`は、キャッシュされたまたは新たにプローブしたGateway healthスナップショットを返します。
- `diagnostics.stability`は、直近の範囲制限付き診断安定性レコーダーを返します。イベント名、件数、バイトサイズ、メモリ値、キュー/セッション状態、channel/plugin名、session idのような運用メタデータを保持します。チャットテキスト、Webhook本文、tool出力、生のリクエスト本文やレスポンス本文、トークン、cookie、シークレット値は保持しません。`operator.read` scopeが必要です。
- `status`は`/status`形式のGatewayサマリーを返します。機微なフィールドはadmin scopeのoperatorクライアントにのみ含まれます。
- `gateway.identity.get`は、relayおよびpairingフローで使われるGateway device identityを返します。
- `system-presence`は、接続されているoperator/nodeデバイスの現在のプレゼンススナップショットを返します。
- `system-event`はシステムイベントを追加し、プレゼンスコンテキストを更新/ブロードキャストできます。
- `last-heartbeat`は、最新の永続化されたHeartbeatイベントを返します。
- `set-heartbeats`は、Gateway上でのHeartbeat処理を切り替えます。

### モデルと使用状況

- `models.list`は、ランタイムで許可されたモデルカタログを返します。
- `usage.status`は、プロバイダー使用量ウィンドウ/残りクォータのサマリーを返します。
- `usage.cost`は、日付範囲に対する集計済みコスト使用状況サマリーを返します。
- `doctor.memory.status`は、アクティブなデフォルトagent workspaceに対するvector-memory / embeddingの準備状態を返します。
- `sessions.usage`は、セッションごとの使用状況サマリーを返します。
- `sessions.usage.timeseries`は、1つのセッションの時系列使用状況を返します。
- `sessions.usage.logs`は、1つのセッションの使用状況ログエントリを返します。

### channelとログインヘルパー

- `channels.status`は、組み込み + バンドルされたchannel/pluginのstatusサマリーを返します。
- `channels.logout`は、そのchannelがlogoutをサポートしている場合、特定のchannel/accountからログアウトします。
- `web.login.start`は、現在のQR対応web channel providerに対するQR/webログインフローを開始します。
- `web.login.wait`は、そのQR/webログインフローの完了を待ち、成功時にchannelを開始します。
- `push.test`は、登録済みiOS NodeにテストAPNs pushを送信します。
- `voicewake.get`は、保存済みのウェイクワードトリガーを返します。
- `voicewake.set`は、ウェイクワードトリガーを更新し、その変更をブロードキャストします。

### メッセージングとログ

- `send`は、チャットランナー外でのchannel/account/thread指定送信のための直接的なアウトバウンド配送RPCです。
- `logs.tail`は、cursor/limitおよびmax-byte制御付きで設定済みGateway file-log tailを返します。

### TalkとTTS

- `talk.config`は有効なTalk configペイロードを返します。`includeSecrets`には`operator.talk.secrets`（または`operator.admin`）が必要です。
- `talk.mode`は、WebChat/Control UIクライアント向けの現在のTalk mode状態を設定/ブロードキャストします。
- `talk.speak`は、アクティブなTalk speech providerを通じて音声合成します。
- `tts.status`は、TTS有効状態、アクティブprovider、fallback provider、provider config状態を返します。
- `tts.providers`は、可視のTTS providerインベントリを返します。
- `tts.enable`と`tts.disable`は、TTS設定状態を切り替えます。
- `tts.setProvider`は、優先TTS providerを更新します。
- `tts.convert`は、単発のtext-to-speech変換を実行します。

### シークレット、設定、更新、ウィザード

- `secrets.reload`は、アクティブなSecretRefsを再解決し、完全に成功した場合にのみランタイムのシークレット状態を切り替えます。
- `secrets.resolve`は、特定のcommand/targetセットに対するコマンド対象のシークレット割り当てを解決します。
- `config.get`は、現在の設定スナップショットとハッシュを返します。
- `config.set`は、検証済みの設定ペイロードを書き込みます。
- `config.patch`は、部分的な設定更新をマージします。
- `config.apply`は、完全な設定ペイロードを検証して置き換えます。
- `config.schema`は、Control UIとCLIツールで使われるライブ設定スキーマペイロードを返します。内容はschema、`uiHints`、version、生成メタデータで、ランタイムが読み込める場合はplugin + channelのスキーマメタデータも含みます。schemaには、UIで使われるものと同じラベルやヘルプテキストから導出されたフィールド`title` / `description`メタデータが含まれ、対応するフィールドドキュメントが存在する場合は、ネストされたobject、wildcard、array-item、および`anyOf` / `oneOf` / `allOf`構成ブランチも含まれます。
- `config.schema.lookup`は、1つの設定パスに対するパススコープのlookupペイロードを返します。内容は、正規化されたパス、浅いschema node、一致したhint + `hintPath`、およびUI/CLIのドリルダウン用の直接の子サマリーです。
  - Lookup schema nodeは、ユーザー向けドキュメントと一般的な検証フィールドを保持します: `title`、`description`、`type`、`enum`、`const`、`format`、`pattern`、数値/文字列/配列/objectの境界、`additionalProperties`、`deprecated`、`readOnly`、`writeOnly`のようなbooleanフラグ。
  - 子サマリーは、`key`、正規化された`path`、`type`、`required`、`hasChildren`、および一致した`hint` / `hintPath`を公開します。
- `update.run`はGateway updateフローを実行し、更新自体が成功した場合にのみ再起動をスケジュールします。
- `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel`は、WS RPC経由でオンボーディングウィザードを公開します。

### 既存の主要ファミリー

#### Agentとworkspaceのヘルパー

- `agents.list`は、設定済みagentエントリを返します。
- `agents.create`、`agents.update`、`agents.delete`は、agentレコードとworkspace配線を管理します。
- `agents.files.list`、`agents.files.get`、`agents.files.set`は、agent向けに公開されるbootstrap workspaceファイルを管理します。
- `agent.identity.get`は、agentまたはsessionに対する有効なassistant identityを返します。
- `agent.wait`は、実行の完了を待ち、利用可能な場合は終端スナップショットを返します。

#### セッション制御

- `sessions.list`は、現在のsessionインデックスを返します。
- `sessions.subscribe`と`sessions.unsubscribe`は、現在のWSクライアントに対するsession変更イベント購読を切り替えます。
- `sessions.messages.subscribe`と`sessions.messages.unsubscribe`は、1つのsessionに対するtranscript/messageイベント購読を切り替えます。
- `sessions.preview`は、特定のsession keyに対する範囲制限付きtranscriptプレビューを返します。
- `sessions.resolve`は、sessionターゲットを解決または正規化します。
- `sessions.create`は、新しいsessionエントリを作成します。
- `sessions.send`は、既存のsessionにメッセージを送信します。
- `sessions.steer`は、アクティブなsession向けの割り込み + steerバリアントです。
- `sessions.abort`は、sessionに対するアクティブな作業を中断します。
- `sessions.patch`は、sessionメタデータ/オーバーライドを更新します。
- `sessions.reset`、`sessions.delete`、`sessions.compact`は、sessionメンテナンスを実行します。
- `sessions.get`は、保存された完全なsession行を返します。
- チャット実行は引き続き`chat.history`、`chat.send`、`chat.abort`、`chat.inject`を使用します。
- `chat.history`は、UIクライアント向けに表示正規化されています。インラインdirectiveタグは表示テキストから除去され、プレーンテキストのtool-call XMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたtool-callブロックを含む）と、漏れたASCII/全角のmodel control tokenは除去され、正確に`NO_REPLY` / `no_reply`である純粋なsilent-token assistant行は省略され、過大な行はプレースホルダーに置き換えられる場合があります。

#### デバイスのペアリングとdevice token

- `device.pair.list`は、保留中および承認済みのペア済みデバイスを返します。
- `device.pair.approve`、`device.pair.reject`、`device.pair.remove`は、device-pairingレコードを管理します。
- `device.token.rotate`は、承認済みのroleおよびscope境界内でペア済みdevice tokenをローテーションします。
- `device.token.revoke`は、ペア済みdevice tokenを失効させます。

#### Nodeのペアリング、invoke、保留中作業

- `node.pair.request`、`node.pair.list`、`node.pair.approve`、`node.pair.reject`、`node.pair.verify`は、Nodeのペアリングとbootstrap検証を扱います。
- `node.list`と`node.describe`は、既知/接続済みNodeの状態を返します。
- `node.rename`は、ペア済みNodeラベルを更新します。
- `node.invoke`は、接続済みNodeにコマンドを転送します。
- `node.invoke.result`は、invokeリクエストの結果を返します。
- `node.event`は、Node起点のイベントをGatewayへ戻します。
- `node.canvas.capability.refresh`は、スコープ付きcanvas-capability tokenを更新します。
- `node.pending.pull`と`node.pending.ack`は、接続済みNodeキューAPIです。
- `node.pending.enqueue`と`node.pending.drain`は、オフライン/切断中Node向けの永続的な保留作業を管理します。

#### 承認ファミリー

- `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve`は、単発のexec承認リクエストと、保留中承認のlookup/replayを扱います。
- `exec.approval.waitDecision`は、1つの保留中exec承認を待機し、最終決定を返します（タイムアウト時は`null`）。
- `exec.approvals.get`と`exec.approvals.set`は、Gateway exec承認ポリシースナップショットを管理します。
- `exec.approvals.node.get`と`exec.approvals.node.set`は、Node relayコマンド経由でnode-localなexec承認ポリシーを管理します。
- `plugin.approval.request`、`plugin.approval.list`、`plugin.approval.waitDecision`、`plugin.approval.resolve`は、plugin定義の承認フローを扱います。

#### その他の主要ファミリー

- automation:
  - `wake`は、即時または次回Heartbeat時のwakeテキスト注入をスケジュールします
  - `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、`cron.run`、`cron.runs`
- skills/tools: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`

### 一般的なイベントファミリー

- `chat`: `chat.inject`やその他のtranscript専用chatイベントなどのUIチャット更新。
- `session.message`と`session.tool`: 購読中sessionのtranscript/イベントストリーム更新。
- `sessions.changed`: sessionインデックスまたはメタデータが変更されたことを示します。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的なkeepalive / livenessイベント。
- `health`: Gateway healthスナップショット更新。
- `heartbeat`: Heartbeatイベントストリーム更新。
- `cron`: Cron実行/ジョブ変更イベント。
- `shutdown`: Gatewayシャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: Nodeペアリングのライフサイクル。
- `node.invoke.request`: Node invokeリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペア済みデバイスのライフサイクル。
- `voicewake.changed`: ウェイクワードトリガー設定が変更されたことを示します。
- `exec.approval.requested` / `exec.approval.resolved`: exec承認のライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin承認のライフサイクル。

### Nodeヘルパーメソッド

- Nodeは、auto-allowチェック用に現在のskill実行ファイル一覧を取得するため、`skills.bins`を呼び出せます。

### operatorヘルパーメソッド

- operatorは、agent向けのランタイムコマンドインベントリを取得するために`commands.list`（`operator.read`）を呼び出せます。
  - `agentId`は任意です。省略するとデフォルトagent workspaceを読み取ります。
  - `scope`は、主要な`name`がどのサーフェスを対象にするかを制御します:
    - `text`は、先頭の`/`を除いた主要テキストコマンドtokenを返します
    - `native`およびデフォルトの`both`パスは、利用可能な場合にprovider対応のnative名を返します
  - `textAliases`は、`/model`や`/m`のような正確なスラッシュエイリアスを保持します。
  - `nativeName`は、存在する場合にprovider対応のnativeコマンド名を保持します。
  - `provider`は任意で、native名とnative pluginコマンドの可用性にのみ影響します。
  - `includeArgs=false`は、レスポンスからシリアライズ済み引数メタデータを省略します。
- operatorは、agent向けのランタイムtoolカタログを取得するために`tools.catalog`（`operator.read`）を呼び出せます。レスポンスには、グループ化されたtoolと由来メタデータが含まれます:
  - `source`: `core`または`plugin`
  - `pluginId`: `source="plugin"`のときのplugin所有者
  - `optional`: plugin toolが任意かどうか
- operatorは、sessionに対するランタイム有効toolインベントリを取得するために`tools.effective`（`operator.read`）を呼び出せます。
  - `sessionKey`は必須です。
  - Gatewayは、呼び出し元提供の認証や配送コンテキストを受け取る代わりに、信頼できるランタイムコンテキストをsessionからサーバー側で導出します。
  - レスポンスはsessionスコープであり、現在アクティブな会話で使用できるものを反映します。core、plugin、channel toolsを含みます。
- operatorは、agent向けに可視なskillインベントリを取得するために`skills.status`（`operator.read`）を呼び出せます。
  - `agentId`は任意です。省略するとデフォルトagent workspaceを読み取ります。
  - レスポンスには、生のシークレット値を公開せずに、適格性、不足要件、設定チェック、サニタイズ済みインストールオプションが含まれます。
- operatorは、ClawHubディスカバリーメタデータに対して`skills.search`と`skills.detail`（`operator.read`）を呼び出せます。
- operatorは、`skills.install`（`operator.admin`）を2つのモードで呼び出せます:
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }`は、skillフォルダーをデフォルトagent workspaceの`skills/`ディレクトリにインストールします。
  - Gateway installerモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`は、Gatewayホスト上で宣言済み`metadata.openclaw.install`アクションを実行します。
- operatorは、`skills.update`（`operator.admin`）を2つのモードで呼び出せます:
  - ClawHubモードでは、デフォルトagent workspace内の1つの追跡slug、またはすべての追跡済みClawHubインストールを更新します。
  - 設定モードでは、`enabled`、`apiKey`、`env`のような`skills.entries.<skillKey>`値をpatchします。

## exec承認

- execリクエストに承認が必要な場合、Gatewayは`exec.approval.requested`をブロードキャストします。
- operatorクライアントは、`exec.approval.resolve`を呼び出して解決します（`operator.approvals` scopeが必要です）。
- `host=node`の場合、`exec.approval.request`には`systemRunPlan`（正規化された`argv`/`cwd`/`rawCommand`/sessionメタデータ）が含まれている必要があります。`systemRunPlan`が欠けているリクエストは拒否されます。
- 承認後、転送される`node.invoke system.run`呼び出しは、その正規化された`systemRunPlan`を権威あるcommand/cwd/sessionコンテキストとして再利用します。
- 呼び出し元がprepareから最終承認済み`system.run`転送までの間に`command`、`rawCommand`、`cwd`、`agentId`、`sessionKey`を変更した場合、Gatewayは変更されたペイロードを信頼する代わりにその実行を拒否します。

## Agent配送フォールバック

- `agent`リクエストには、アウトバウンド配送を要求するために`deliver=true`を含めることができます。
- `bestEffortDeliver=false`は厳格な動作を維持します。解決不能またはinternal-onlyな配送ターゲットは`INVALID_REQUEST`を返します。
- `bestEffortDeliver=true`は、外部配送可能ルートを解決できない場合（たとえばinternal/webchat sessionや曖昧なマルチchannel設定）に、session専用実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION`は`src/gateway/protocol/schema/protocol-schemas.ts`にあります。
- クライアントは`minProtocol` + `maxProtocol`を送信し、サーバーは不一致を拒否します。
- schema + modelはTypeBox定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts`内のリファレンスクライアントはこれらのデフォルトを使用します。これらの値はprotocol v3全体で安定しており、サードパーティークライアントに期待されるベースラインです。

| 定数 | デフォルト | ソース |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| リクエストタイムアウト（RPCごと） | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| 事前認証 / connect-challengeタイムアウト | `10_000` ms | `src/gateway/handshake-timeouts.ts`（clamp `250`–`10_000`） |
| 初期再接続バックオフ | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| 最大再接続バックオフ | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| device-tokenクローズ後の高速再試行clamp | `250` ms | `src/gateway/client.ts` |
| `terminate()`前のforce-stop猶予 | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| `stopAndWait()`のデフォルトタイムアウト | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| デフォルトtick間隔（`hello-ok`前） | `30_000` ms | `src/gateway/client.ts` |
| tick-timeoutクローズ | 無音が`tickIntervalMs * 2`を超えた場合はcode `4000` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024`（25 MB） | `src/gateway/server-constants.ts` |

サーバーは、有効な`policy.tickIntervalMs`、`policy.maxPayload`、`policy.maxBufferedBytes`を`hello-ok`で通知します。クライアントは、ハンドシェイク前のデフォルト値ではなく、それらの値に従う必要があります。

## 認証

- shared-secret Gateway認証は、設定された認証モードに応じて`connect.params.auth.token`または`connect.params.auth.password`を使用します。
- Tailscale Serve（`gateway.auth.allowTailscale: true`）や非loopbackの`gateway.auth.mode: "trusted-proxy"`のようなidentity-bearingモードでは、`connect.params.auth.*`ではなく、リクエストヘッダーからconnect認証チェックを満たします。
- private-ingressの`gateway.auth.mode: "none"`は、shared-secretのconnect認証を完全にスキップします。このモードを公開/信頼されていないingressで公開しないでください。
- ペアリング後、Gatewayは接続のrole + scopesにスコープされた**device token**を発行します。これは`hello-ok.auth.deviceToken`で返され、クライアントは将来の接続のために永続化する必要があります。
- クライアントは、接続成功後に常に主要な`hello-ok.auth.deviceToken`を永続化する必要があります。
- その**保存済みの**device tokenで再接続する際は、そのtokenに対して保存済みの承認scopeセットも再利用する必要があります。これにより、すでに許可されていたread/probe/statusアクセスが保持され、再接続時により狭い暗黙のadmin-only scopeへ静かに縮小されるのを防ぎます。
- クライアント側のconnect認証組み立て（`src/gateway/client.ts`内の`selectConnectAuth`）:
  - `auth.password`は独立しており、設定されていれば常に転送されます。
  - `auth.token`は優先順位に従って設定されます。最初に明示的なshared token、次に明示的な`deviceToken`、その次に保存済みのデバイスごとtoken（`deviceId` + `role`でキー付け）。
  - `auth.bootstrapToken`は、上記のいずれでも`auth.token`が解決されなかった場合にのみ送信されます。shared tokenまたは解決済みdevice tokenがあれば、それは抑制されます。
  - 1回限りの`AUTH_TOKEN_MISMATCH`再試行での保存済みdevice tokenの自動昇格は、**信頼済みendpointのみ**に制限されます — loopback、または固定された`tlsFingerprint`付きの`wss://`です。pinningなしの公開`wss://`は対象になりません。
- 追加の`hello-ok.auth.deviceTokens`エントリはbootstrap handoff tokenです。`wss://`やloopback/local pairingのような信頼済みトランスポート上でbootstrap認証を使って接続した場合にのみ、それらを永続化してください。
- クライアントが明示的な**`deviceToken`**または明示的な**`scopes`**を指定した場合、その呼び出し元が要求したscopeセットが引き続き権威あるものになります。キャッシュ済みscopeは、クライアントが保存済みのデバイスごとtokenを再利用している場合にのみ再利用されます。
- device tokenは`device.token.rotate`と`device.token.revoke`でローテーション/失効できます（`operator.pairing` scopeが必要です）。
- tokenの発行/ローテーションは、そのデバイスのpairingエントリに記録された承認済みroleセットの範囲内に制限されます。tokenをローテーションしても、pairing承認で一度も許可されていないroleへデバイスを拡張することはできません。
- paired-device tokenセッションでは、呼び出し元が`operator.admin`も持っていない限り、デバイス管理は自己スコープになります。adminでない呼び出し元は、自分**自身の**デバイスエントリのみをremove/revoke/rotateできます。
- `device.token.rotate`は、要求されたoperator scopeセットも呼び出し元の現在のセッションscopeに対してチェックします。adminでない呼び出し元は、現在保持しているより広いoperator scopeセットへtokenをローテーションできません。
- 認証失敗には`error.details.code`と回復ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH`に対するクライアント動作:
  - 信頼済みクライアントは、キャッシュ済みのデバイスごとtokenで1回だけ制限付き再試行を試みてもかまいません。
  - その再試行が失敗した場合、クライアントは自動再接続ループを停止し、operatorアクションのガイダンスを表示する必要があります。

## デバイスアイデンティティ + ペアリング

- Nodeは、キーペアのフィンガープリントから導出された安定したデバイスアイデンティティ（`device.id`）を含める必要があります。
- Gatewayは、デバイス + roleごとにtokenを発行します。
- local auto-approvalが有効でない限り、新しいdevice IDにはペアリング承認が必要です。
- ペアリングのauto-approvalは、直接のlocal loopback接続を中心に設計されています。
- OpenClawには、信頼済みshared-secretヘルパーフロー向けの、限定的なbackend/container-local self-connectパスもあります。
- 同一ホストのtailnetまたはLAN接続は、ペアリング上は依然としてリモートとして扱われ、承認が必要です。
- すべてのWSクライアントは、`connect`中に`device`アイデンティティを含める必要があります（operator + node）。
  Control UIがこれを省略できるのは、次のモードのみです:
  - localhost専用の安全でないHTTP互換性のための`gateway.controlUi.allowInsecureAuth=true`
  - 成功した`gateway.auth.mode: "trusted-proxy"` operator Control UI認証
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急用、重大なセキュリティ低下）
- すべての接続は、サーバーが提供した`connect.challenge` nonceに署名する必要があります。

### デバイス認証移行の診断

以前のchallenge前署名動作をまだ使っているレガシークライアント向けに、`connect`は現在、安定した`error.details.reason`とともに、`error.details.code`配下で`DEVICE_AUTH_*`詳細codeを返します。

一般的な移行失敗:

| メッセージ | details.code | details.reason | 意味 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | クライアントが`device.nonce`を省略した（または空を送信した）。 |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | クライアントが古い/誤ったnonceで署名した。 |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | 署名ペイロードがv2ペイロードと一致しない。 |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 署名済みtimestampが許容スキュー範囲外。 |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id`が公開鍵フィンガープリントと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | 公開鍵の形式/正規化に失敗した。 |

移行先の目標:

- 必ず`connect.challenge`を待つ。
- サーバーnonceを含むv2ペイロードに署名する。
- 同じnonceを`connect.params.device.nonce`で送信する。
- 推奨される署名ペイロードは`v3`で、device/client/role/scopes/token/nonceフィールドに加えて`platform`と`deviceFamily`も束縛します。
- 互換性のためにレガシーの`v2`署名も引き続き受け入れられますが、paired-deviceメタデータのpinningが再接続時のコマンドポリシーを引き続き制御します。

## TLS + pinning

- WS接続ではTLSがサポートされます。
- クライアントは任意でGateway証明書フィンガープリントをpinできます（`gateway.tls`設定、および`gateway.remote.tlsFingerprint`またはCLIの`--tls-fingerprint`を参照）。

## スコープ

このプロトコルは、**完全なGateway API**（status、channels、models、chat、agent、sessions、nodes、approvalsなど）を公開します。正確なサーフェスは`src/gateway/protocol/schema.ts`内のTypeBoxスキーマで定義されています。
