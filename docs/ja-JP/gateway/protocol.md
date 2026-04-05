---
read_when:
    - Gateway WS クライアントを実装または更新する場合
    - プロトコルの不一致や接続失敗をデバッグする場合
    - プロトコルスキーマ / モデルを再生成する場合
summary: 'Gateway WebSocket プロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gateway Protocol
x-i18n:
    generated_at: "2026-04-05T12:46:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway protocol（WebSocket）

Gateway WS プロトコルは、OpenClaw の **単一のコントロールプレーン + ノード転送** です。すべてのクライアント（CLI、web UI、macOS app、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、ハンドシェイク時に自身の **role** と **scope** を宣言します。

## トランスポート

- WebSocket、JSON ペイロードを持つテキストフレーム。
- 最初のフレームは **必ず** `connect` リクエストでなければなりません。

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

デバイストークンが発行される場合、`hello-ok` には次も含まれます:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

信頼された bootstrap handoff 中には、`hello-ok.auth` に追加の
制限付き role エントリーが `deviceTokens` として含まれる場合もあります:

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

組み込みの node/operator bootstrap フローでは、プライマリ node トークンは
`scopes: []` のままで、handoff される operator トークンは bootstrap
operator allowlist（`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`）に制限されたままです。
bootstrap scope チェックは role 接頭辞付きのままで、operator エントリーは
operator リクエストのみを満たし、非 operator role は引き続き自身の
role 接頭辞配下の scope を必要とします。

### ノードの例

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

副作用のあるメソッドには **idempotency key** が必要です（スキーマを参照）。

## Roles + scopes

### Roles

- `operator` = コントロールプレーンクライアント（CLI/UI/automation）。
- `node` = capability host（camera/screen/canvas/system.run）。

### Scopes（operator）

一般的な scope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` で `includeSecrets: true` を使うには `operator.talk.secrets`
（または `operator.admin`）が必要です。

プラグイン登録された Gateway RPC メソッドは独自の operator scope を要求できますが、
予約された core admin 接頭辞（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は常に `operator.admin` に解決されます。

メソッドの scope は最初のゲートにすぎません。`chat.send` 経由で到達する
一部のスラッシュコマンドでは、その上により厳しいコマンドレベルのチェックが適用されます。
たとえば、永続的な `/config set` と `/config unset` の書き込みには
`operator.admin` が必要です。

`node.pair.approve` には、ベースメソッドの scope に加えて
承認時の追加 scope チェックもあります:

- コマンドなしのリクエスト: `operator.pairing`
- exec 以外の node コマンドを含むリクエスト: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（node）

ノードは接続時に capability クレームを宣言します:

- `caps`: 高レベルの capability カテゴリー。
- `commands`: invoke 用のコマンド allowlist。
- `permissions`: 詳細なトグル（例: `screen.record`, `camera.capture`）。

Gateway はこれらを **クレーム** として扱い、サーバー側の allowlist を適用します。

## プレゼンス

- `system-presence` は、デバイス ID をキーとするエントリーを返します。
- プレゼンスエントリーには `deviceId`, `roles`, `scopes` が含まれ、UI は
  同一デバイスが **operator** と **node** の両方として接続している場合でも
  1 行で表示できます。

## 一般的な RPC メソッドファミリー

このページは生成された完全ダンプではありませんが、公開 WS サーフェスは
上記のハンドシェイク / auth 例より広範です。以下は、現在 Gateway が公開している
主なメソッドファミリーです。

`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` と読み込まれた plugin/channel メソッド export から構築される
保守的な検出リストです。これは機能検出として扱ってください。
`src/gateway/server-methods/*.ts` に実装されたすべての呼び出し可能ヘルパーの
生成済みダンプではありません。

### システムと identity

- `health` は、キャッシュ済みまたは新たにプローブした gateway health スナップショットを返します。
- `status` は `/status` 形式の gateway サマリーを返します。機密フィールドは
  admin scope を持つ operator クライアントにのみ含まれます。
- `gateway.identity.get` は、relay と pairing フローで使用される
  gateway device identity を返します。
- `system-presence` は、接続中の operator/node デバイスの現在のプレゼンススナップショットを返します。
- `system-event` はシステムイベントを追加し、プレゼンスコンテキストを更新 / 配信できます。
- `last-heartbeat` は最新の永続化された heartbeat イベントを返します。
- `set-heartbeats` は gateway 上の heartbeat 処理を切り替えます。

### モデルと使用量

- `models.list` は、実行時に許可されたモデルカタログを返します。
- `usage.status` は、プロバイダー使用量ウィンドウ / 残りクォータのサマリーを返します。
- `usage.cost` は、日付範囲に対する集計済みコスト使用量サマリーを返します。
- `doctor.memory.status` は、アクティブなデフォルトエージェント workspace の
  vector-memory / embedding 準備状況を返します。
- `sessions.usage` は、セッションごとの使用量サマリーを返します。
- `sessions.usage.timeseries` は、1 つのセッションの timeseries 使用量を返します。
- `sessions.usage.logs` は、1 つのセッションの使用量ログエントリーを返します。

### チャネルとログインヘルパー

- `channels.status` は、組み込み + bundled channel/plugin の status サマリーを返します。
- `channels.logout` は、そのチャネルが logout をサポートしている場合に
  特定の channel/account をログアウトします。
- `web.login.start` は、現在の QR 対応 web チャネルプロバイダーの
  QR/web ログインフローを開始します。
- `web.login.wait` は、その QR/web ログインフローの完了を待ち、
  成功時にチャネルを開始します。
- `push.test` は、登録済み iOS node にテスト APNs push を送信します。
- `voicewake.get` は、保存済みの wake-word trigger を返します。
- `voicewake.set` は、wake-word trigger を更新し、その変更を配信します。

### メッセージングとログ

- `send` は、chat runner 外で channel/account/thread 対象の送信を行う
  直接の outbound-delivery RPC です。
- `logs.tail` は、設定された gateway file-log の tail を
  cursor/limit と max-byte 制御付きで返します。

### Talk と TTS

- `talk.config` は、有効な Talk config ペイロードを返します。
  `includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
- `talk.mode` は、WebChat/Control UI クライアント向けの
  現在の Talk mode 状態を設定 / 配信します。
- `talk.speak` は、アクティブな Talk speech プロバイダー経由で音声を合成します。
- `tts.status` は、TTS の有効状態、アクティブプロバイダー、フォールバックプロバイダー、
  プロバイダー config 状態を返します。
- `tts.providers` は、可視の TTS プロバイダー inventory を返します。
- `tts.enable` と `tts.disable` は、TTS prefs 状態を切り替えます。
- `tts.setProvider` は、優先 TTS プロバイダーを更新します。
- `tts.convert` は、単発の text-to-speech 変換を実行します。

### Secrets、config、update、wizard

- `secrets.reload` は、アクティブな SecretRef を再解決し、
  完全成功時のみ実行時 secret 状態を切り替えます。
- `secrets.resolve` は、特定の command/target セットに対する
  command-target secret 割り当てを解決します。
- `config.get` は、現在の config スナップショットと hash を返します。
- `config.set` は、検証済みの config ペイロードを書き込みます。
- `config.patch` は、部分的な config 更新をマージします。
- `config.apply` は、完全な config ペイロードを検証して置き換えます。
- `config.schema` は、Control UI と CLI ツールで使用されるライブ config schema ペイロードを返します:
  schema、`uiHints`、version、生成メタデータ、および実行時に読み込める場合は
  plugin + channel schema メタデータも含まれます。schema には、UI で使用されるものと同じ
  ラベルおよびヘルプテキストから派生したフィールド `title` / `description`
  メタデータが含まれます。これには、一致するフィールドドキュメントが存在する場合の
  ネストしたオブジェクト、ワイルドカード、配列アイテム、
  `anyOf` / `oneOf` / `allOf` 合成ブランチも含まれます。
- `config.schema.lookup` は、1 つの config path に対する path スコープ付き
  lookup ペイロードを返します: 正規化された path、浅い schema ノード、
  一致した hint + `hintPath`、および UI/CLI ドリルダウン用の
  直下の子要約。
  - lookup schema ノードは、ユーザー向けドキュメントと一般的な検証フィールドを保持します:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    数値 / 文字列 / 配列 / オブジェクトの境界、および
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` のようなブールフラグ。
  - 子要約は、`key`, 正規化された `path`, `type`, `required`,
    `hasChildren`、および一致した `hint` / `hintPath` を公開します。
- `update.run` は、gateway update フローを実行し、
  update 自体が成功した場合のみ再起動をスケジュールします。
- `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel` は、
  WS RPC 経由でオンボーディングウィザードを公開します。

### 既存の主要ファミリー

#### エージェントと workspace ヘルパー

- `agents.list` は、設定済みエージェントエントリーを返します。
- `agents.create`, `agents.update`, `agents.delete` は、エージェントレコードと
  workspace 配線を管理します。
- `agents.files.list`, `agents.files.get`, `agents.files.set` は、
  エージェント向けに公開される bootstrap workspace ファイルを管理します。
- `agent.identity.get` は、エージェントまたはセッションの有効な
  アシスタント identity を返します。
- `agent.wait` は、実行の完了を待ち、可能な場合は終端スナップショットを返します。

#### セッション制御

- `sessions.list` は、現在のセッション index を返します。
- `sessions.subscribe` と `sessions.unsubscribe` は、
  現在の WS クライアントに対するセッション変更イベント購読を切り替えます。
- `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、
  1 つのセッションに対する transcript/message イベント購読を切り替えます。
- `sessions.preview` は、特定の session key に対する制限付き transcript preview を返します。
- `sessions.resolve` は、セッションターゲットを解決または正規化します。
- `sessions.create` は、新しいセッションエントリーを作成します。
- `sessions.send` は、既存のセッションにメッセージを送信します。
- `sessions.steer` は、アクティブなセッション向けの interrupt-and-steer バリアントです。
- `sessions.abort` は、セッションのアクティブな作業を中断します。
- `sessions.patch` は、セッションのメタデータ / オーバーライドを更新します。
- `sessions.reset`, `sessions.delete`, `sessions.compact` は、
  セッションの保守を行います。
- `sessions.get` は、完全な保存済みセッション行を返します。
- chat 実行では引き続き `chat.history`, `chat.send`, `chat.abort`, `chat.inject` を使います。
- `chat.history` は UI クライアント向けに表示正規化されています:
  インライン directive タグは可視テキストから除去され、
  プレーンテキストのツールコール XML ペイロード
  （`<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`,
  および切り詰められたツールコールブロックを含む）と、
  漏れ出した ASCII / 全角のモデル制御トークンは除去され、
  `NO_REPLY` / `no_reply` と完全一致する純粋な silent-token assistant 行は省略され、
  大きすぎる行はプレースホルダーに置き換えられることがあります。

#### デバイス pairing とデバイストークン

- `device.pair.list` は、保留中および承認済みの paired device を返します。
- `device.pair.approve`, `device.pair.reject`, `device.pair.remove` は、
  device-pairing レコードを管理します。
- `device.token.rotate` は、paired device token を承認済み role と
  scope の範囲内でローテーションします。
- `device.token.revoke` は、paired device token を失効させます。

#### ノード pairing、invoke、保留中作業

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject`, `node.pair.verify` は、node pairing と bootstrap
  検証を扱います。
- `node.list` と `node.describe` は、既知 / 接続中の node 状態を返します。
- `node.rename` は、paired node ラベルを更新します。
- `node.invoke` は、接続中 node にコマンドを転送します。
- `node.invoke.result` は、invoke リクエストの結果を返します。
- `node.event` は、node 由来イベントを gateway に戻します。
- `node.canvas.capability.refresh` は、スコープ付き canvas-capability token を更新します。
- `node.pending.pull` と `node.pending.ack` は、接続中 node のキュー API です。
- `node.pending.enqueue` と `node.pending.drain` は、
  オフライン / 切断された node 向けの永続的な保留作業を管理します。

#### 承認ファミリー

- `exec.approval.request` と `exec.approval.resolve` は、
  one-shot exec 承認リクエストを扱います。
- `exec.approval.waitDecision` は、1 件の保留中 exec 承認を待ち、
  最終判断（またはタイムアウト時は `null`）を返します。
- `exec.approvals.get` と `exec.approvals.set` は、
  gateway exec 承認ポリシースナップショットを管理します。
- `exec.approvals.node.get` と `exec.approvals.node.set` は、
  node relay コマンド経由で node ローカルの exec 承認ポリシーを管理します。
- `plugin.approval.request`, `plugin.approval.waitDecision`,
  `plugin.approval.resolve` は、プラグイン定義の承認フローを扱います。

#### その他の主要ファミリー

- automation:
  - `wake` は、即時または次回 heartbeat での wake text 注入をスケジュールします
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### 一般的なイベントファミリー

- `chat`: `chat.inject` やその他 transcript 専用 chat イベントなどの
  UI chat 更新。
- `session.message` と `session.tool`: 購読中セッションの
  transcript/event-stream 更新。
- `sessions.changed`: セッション index またはメタデータが変更された。
- `presence`: システムプレゼンススナップショット更新。
- `tick`: 定期的な keepalive / liveness イベント。
- `health`: gateway health スナップショット更新。
- `heartbeat`: heartbeat イベントストリーム更新。
- `cron`: cron 実行 / ジョブ変更イベント。
- `shutdown`: gateway シャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: node pairing ライフサイクル。
- `node.invoke.request`: node invoke リクエスト配信。
- `device.pair.requested` / `device.pair.resolved`: paired-device ライフサイクル。
- `voicewake.changed`: wake-word trigger config が変更された。
- `exec.approval.requested` / `exec.approval.resolved`: exec 承認ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 承認ライフサイクル。

### ノードヘルパーメソッド

- ノードは、auto-allow チェック用に現在の skill executable 一覧を取得するため
  `skills.bins` を呼び出せます。

### operator ヘルパーメソッド

- operator は `tools.catalog`（`operator.read`）を呼び出して、エージェント向けの
  実行時ツールカタログを取得できます。レスポンスにはグループ化されたツールと
  provenance メタデータが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` のときのプラグイン所有者
  - `optional`: プラグインツールが optional かどうか
- operator は `tools.effective`（`operator.read`）を呼び出して、
  セッションの実行時に有効なツール inventory を取得できます。
  - `sessionKey` は必須です。
  - gateway は、呼び出し元が指定した auth や delivery context を受け入れる代わりに、
    信頼できる実行時コンテキストをサーバー側でセッションから導出します。
  - レスポンスはセッションスコープで、現在アクティブな会話が今すぐ使用できるもの
    （core、plugin、channel ツールを含む）を反映します。
- operator は `skills.status`（`operator.read`）を呼び出して、
  エージェント向けの可視 skill inventory を取得できます。
  - `agentId` は任意です。省略するとデフォルトエージェント workspace を読み取ります。
  - レスポンスには、raw secret 値を公開せずに、eligibility、欠けている要件、
    config チェック、サニタイズ済み install オプションが含まれます。
- operator は `skills.search` と `skills.detail`（`operator.read`）を呼び出して、
  ClawHub 検出メタデータを取得できます。
- operator は `skills.install`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    デフォルトエージェント workspace の `skills/` ディレクトリーに
    skill フォルダーをインストールします。
  - Gateway installer モード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    は、gateway host 上で宣言済み `metadata.openclaw.install` アクションを実行します。
- operator は `skills.update`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モードでは、1 つの追跡中 slug またはデフォルトエージェント workspace にある
    すべての追跡中 ClawHub install を更新します。
  - Config モードでは、`enabled`,
    `apiKey`, `env` などの `skills.entries.<skillKey>` 値にパッチを適用します。

## Exec 承認

- exec リクエストに承認が必要な場合、gateway は `exec.approval.requested` を配信します。
- operator クライアントは `exec.approval.resolve` を呼び出して解決します
  （`operator.approvals` scope が必要です）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`
  （正規化された `argv` / `cwd` / `rawCommand` / セッションメタデータ）が
  含まれていなければなりません。`systemRunPlan` がないリクエストは拒否されます。
- 承認後、転送された `node.invoke system.run` 呼び出しは、その正規化済み
  `systemRunPlan` を、信頼できるコマンド / cwd / セッションコンテキストとして再利用します。
- 呼び出し元が prepare と最終承認済み `system.run` 転送の間で
  `command`, `rawCommand`, `cwd`, `agentId`, `sessionKey` を変更した場合、
  gateway は変更されたペイロードを信頼する代わりに、その実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、outbound delivery を要求するため
  `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します:
  解決できない、または internal-only の delivery target は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部配信可能な route を解決できない場合
  （たとえば internal/webchat セッションや曖昧なマルチチャネル config）に、
  session-only 実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、
  サーバーは不一致を拒否します。
- schema + model は TypeBox 定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- shared-secret Gateway auth は、設定された auth mode に応じて
  `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  （`gateway.auth.allowTailscale: true`）や non-loopback の
  `gateway.auth.mode: "trusted-proxy"` のような identity を持つ mode は、
  `connect.params.auth.*` ではなくリクエストヘッダーから connect auth チェックを満たします。
- private-ingress の `gateway.auth.mode: "none"` は、
  shared-secret connect auth を完全にスキップします。この mode を
  公開 / 非信頼 ingress に公開しないでください。
- pairing 後、Gateway は接続 role + scope にスコープされた **device token** を発行します。
  これは `hello-ok.auth.deviceToken` で返され、クライアントは
  将来の接続のためにこれを永続化する必要があります。
- クライアントは、成功した connect のたびに
  プライマリ `hello-ok.auth.deviceToken` を永続化する必要があります。
- その **保存済み** device token で再接続する場合、
  そのトークンに対する承認済み scope セットも再利用する必要があります。
  これにより、すでに付与された read / probe / status アクセスが維持され、
  再接続時に暗黙の admin-only scope へと静かに縮退するのを防げます。
- 通常の connect auth の優先順位は、明示的な shared token/password が先、
  次に明示的な `deviceToken`、次に保存済み per-device token、
  最後に bootstrap token です。
- 追加の `hello-ok.auth.deviceTokens` エントリーは bootstrap handoff token です。
  `wss://` や loopback/local pairing のような
  信頼されたトランスポートで bootstrap auth を使った接続時にのみ、これらを永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元が要求した scope セットが引き続き権威になります。
  キャッシュされた scope は、クライアントが保存済み per-device token を
  再利用している場合にのみ再利用されます。
- device token は `device.token.rotate` と
  `device.token.revoke` でローテーション / 失効できます
  （`operator.pairing` scope が必要です）。
- トークンの発行 / ローテーションは、そのデバイスの pairing エントリーに記録された
  承認済み role セットの範囲内に制限されたままです。
  トークンをローテーションしても、pairing 承認が一度も許可していない
  role にデバイスを拡張することはできません。
- paired-device token セッションでは、呼び出し元が `operator.admin` も
  持っていない限り、デバイス管理は自己スコープです:
  非 admin 呼び出し元は自分 **自身** のデバイスエントリーのみ
  remove / revoke / rotate できます。
- `device.token.rotate` は、要求された operator scope セットが
  呼び出し元の現在のセッション scope に合っているかも確認します。
  非 admin 呼び出し元は、自分が現在保持しているより広い operator scope セットへ
  トークンをローテーションできません。
- auth 失敗には `error.details.code` と復旧ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - 信頼されたクライアントは、キャッシュ済み per-device token で
    1 回だけ制限付きリトライを試みることができます。
  - そのリトライが失敗した場合、クライアントは自動再接続ループを停止し、
    operator アクションガイダンスを表示する必要があります。

## デバイス identity + pairing

- ノードは、キーペアの fingerprint から導出した安定した
  device identity（`device.id`）を含める必要があります。
- Gateway は、device + role ごとにトークンを発行します。
- 新しい device ID には、ローカル自動承認が有効でない限り
  pairing 承認が必要です。
- pairing 自動承認は、直接の local loopback 接続を中心に設計されています。
- OpenClaw には、信頼された shared-secret ヘルパーフロー向けの、
  狭く制限された backend/container-local self-connect パスもあります。
- 同一ホストの tailnet または LAN 接続でも、pairing 上は引き続き
  remote として扱われ、承認が必要です。
- すべての WS クライアントは、`connect` 中に `device` identity を含める必要があります
  （operator + node）。
  Control UI がこれを省略できるのは次の mode のみです:
  - localhost 専用の insecure HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - 成功した `gateway.auth.mode: "trusted-proxy"` operator Control UI auth。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避用、重大なセキュリティ低下）。
- すべての接続は、サーバー提供の `connect.challenge` nonce に署名しなければなりません。

### デバイス auth 移行診断

接続前チャレンジ署名以前の動作をまだ使っているレガシークライアント向けに、
`connect` は現在、安定した `error.details.reason` とともに
`error.details.code` 配下に `DEVICE_AUTH_*` 詳細コードを返します。

一般的な移行失敗:

| メッセージ                     | details.code                     | details.reason           | 意味                                            |
| --------------------------- | -------------------------------- | ------------------------ | ----------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送信した）。     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い / 誤った nonce で署名した。            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しない。       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名タイムスタンプが許容 skew の範囲外。          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵 fingerprint と一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵形式 / 正規化に失敗した。                      |

移行先の目標:

- 常に `connect.challenge` を待つ。
- サーバー nonce を含む v2 ペイロードに署名する。
- 同じ nonce を `connect.params.device.nonce` で送信する。
- 推奨される署名ペイロードは `v3` で、device/client/role/scopes/token/nonce フィールドに加えて
  `platform` と `deviceFamily` を束縛します。
- 互換性のためレガシー `v2` 署名も引き続き受け入れられますが、
  再接続時のコマンドポリシーは paired-device メタデータの pinning によって引き続き制御されます。

## TLS + pinning

- WS 接続では TLS がサポートされます。
- クライアントは、Gateway 証明書 fingerprint を任意で pin できます
  （`gateway.tls` config と
  `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは、**完全な gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals など）を公開します。正確なサーフェスは
`src/gateway/protocol/schema.ts` 内の TypeBox schema で定義されています。
