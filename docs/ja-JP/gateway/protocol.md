---
read_when:
    - Gateway WS クライアントの実装または更新
    - プロトコル不一致または接続失敗のデバッグ
    - プロトコル schema/model の再生成
summary: 'Gateway WebSocket プロトコル: handshake、frame、バージョニング'
title: Gateway プロトコル
x-i18n:
    generated_at: "2026-04-22T04:22:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway プロトコル（WebSocket）

Gateway WS プロトコルは、OpenClaw の **単一の control plane + node transport** です。
すべてのクライアント（CLI、web UI、macOS app、iOS/Android node、headless
node）は WebSocket 経由で接続し、handshake 時に **role** + **scope** を
宣言します。

## Transport

- WebSocket、JSON payload を持つ text frame。
- 最初の frame は **必ず** `connect` request でなければなりません。

## Handshake（connect）

Gateway → Client（接続前 challenge）:

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

`server`、`features`、`snapshot`、`policy` はすべて schema
（`src/gateway/protocol/schema/frames.ts`）で必須です。`canvasHostUrl` は任意です。`auth`
は利用可能な場合にネゴシエートされた role/scopes を報告し、Gateway が発行した場合は
`deviceToken` も含みます。

device token が発行されない場合でも、`hello-ok.auth` はネゴシエートされた
permission を報告できます:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

device token が発行される場合、`hello-ok` には次も含まれます:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

trusted bootstrap handoff 中は、`hello-ok.auth` に `deviceTokens` 内の追加の
bounded role エントリが含まれることもあります:

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

組み込みの node/operator bootstrap フローでは、主要な node token は
`scopes: []` のままで、引き渡された operator token は bootstrap
operator allowlist（`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`）に制限されたままです。Bootstrap の scope
チェックは role 接頭辞付きのままです。operator エントリは operator request だけを満たし、
operator 以外の role は引き続き自分自身の role 接頭辞下の scope が必要です。

### Node の例

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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を持つ method には **idempotency key** が必要です（schema を参照）。

## Roles + scopes

### Roles

- `operator` = control plane client（CLI/UI/automation）。
- `node` = capability host（camera/screen/canvas/system.run）。

### Scopes（operator）

一般的な scope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true` を指定した `talk.config` には `operator.talk.secrets`
（または `operator.admin`）が必要です。

plugin 登録された Gateway RPC method は独自の operator scope を要求できますが、
予約済みの core admin 接頭辞（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は常に `operator.admin` に解決されます。

Method scope は最初のゲートにすぎません。`chat.send` 経由で到達する一部の slash command では、
さらに厳しい command レベルのチェックが適用されます。たとえば、永続的な
`/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` にも、基本 method scope に加えて追加の承認時 scope チェックがあります:

- command なし request: `operator.pairing`
- exec 以外の node command を含む request: `operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare`、または `system.which` を含む request:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（node）

Node は接続時に capability claim を宣言します:

- `caps`: 高レベルの capability カテゴリ。
- `commands`: invoke 用の command allowlist。
- `permissions`: 粒度の細かい toggle（例: `screen.record`, `camera.capture`）。

Gateway はこれらを **claim** として扱い、サーバー側 allowlist を適用します。

## Presence

- `system-presence` は device identity をキーとするエントリを返します。
- Presence エントリには `deviceId`、`roles`、`scopes` が含まれるため、UI は
  1 つの device が **operator** と **node** の両方として接続している場合でも 1 行で表示できます。

## Broadcast event scoping

サーバープッシュの WebSocket broadcast event には scope ゲートがあり、pairing-scope のみのセッションや node 専用セッションがセッション内容を受動的に受信しないようになっています。

- **Chat、agent、tool-result frame**（streaming された `agent` event と tool call result を含む）には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらの frame を完全にスキップします。
- **plugin 定義の `plugin.*` broadcast** は、その plugin の登録方法に応じて、`operator.write` または `operator.admin` にゲートされます。
- **Status と transport event**（`heartbeat`、`presence`、`tick`、connect/disconnect lifecycle など）は、transport の健全性をすべての認証済みセッションから観測可能に保つため、制限されません。
- **未知の broadcast event ファミリー** は、登録済み handler が明示的に緩和しない限り、デフォルトで scope ゲートされます（fail-closed）。

各クライアント接続はクライアントごとの独自の sequence 番号を保持するため、異なるクライアントが event stream の異なる scope-filtered 部分集合を見ていても、その socket 上では broadcast の単調な順序が保たれます。

## 一般的な RPC method ファミリー

このページは生成された完全ダンプではありませんが、公開 WS surface は
上記の handshake/auth の例より広範です。以下は、現在 Gateway が公開している主な method ファミリーです。

`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` と読み込まれた plugin/channel method export から構築された
保守的な discovery リストです。これを機能 discovery として扱ってください。
`src/gateway/server-methods/*.ts` に実装されているすべての呼び出し可能 helper の
生成ダンプではありません。

### System と identity

- `health` は、キャッシュされた、または新たに probe された Gateway health snapshot を返します。
- `status` は `/status` 形式の Gateway 要約を返します。機密フィールドは
  admin scope を持つ operator クライアントにのみ含まれます。
- `gateway.identity.get` は relay と
  pairing フローで使用される Gateway device identity を返します。
- `system-presence` は、接続中の
  operator/node device に対する現在の presence snapshot を返します。
- `system-event` は system event を追加し、presence
  context を更新/配信できます。
- `last-heartbeat` は、最後に永続化された Heartbeat event を返します。
- `set-heartbeats` は Gateway 上の Heartbeat 処理を切り替えます。

### Models と usage

- `models.list` は、ランタイムで許可された model catalog を返します。
- `usage.status` は provider usage window/残り quota の要約を返します。
- `usage.cost` は date range に対する集計済み cost usage 要約を返します。
- `doctor.memory.status` は、
  アクティブなデフォルト agent workspace に対する vector-memory / embedding 準備状態を返します。
- `sessions.usage` はセッションごとの usage 要約を返します。
- `sessions.usage.timeseries` は 1 つのセッションに対する timeseries usage を返します。
- `sessions.usage.logs` は 1 つのセッションに対する usage log エントリを返します。

### Channels と login helper

- `channels.status` は、組み込み + バンドル済み channel/plugin の status 要約を返します。
- `channels.logout` は、logout をサポートする channel/account について
  特定の channel/account からログアウトします。
- `web.login.start` は、現在の QR 対応 web
  channel provider に対して QR/web login フローを開始します。
- `web.login.wait` はその QR/web login フローの完了を待ち、成功時に
  channel を開始します。
- `push.test` は、登録済み iOS node にテスト APNs push を送信します。
- `voicewake.get` は保存済み wake-word trigger を返します。
- `voicewake.set` は wake-word trigger を更新し、その変更を配信します。

### Messaging と logs

- `send` は、chat runner の外で channel/account/thread-targeted
  send を行うための直接の外向き配信 RPC です。
- `logs.tail` は、設定済みの Gateway file-log tail を
  cursor/limit と max-byte 制御付きで返します。

### Talk と TTS

- `talk.config` は有効な Talk config payload を返します。`includeSecrets`
  には `operator.talk.secrets`（または `operator.admin`）が必要です。
- `talk.mode` は、WebChat/Control UI
  クライアント向けの現在の Talk mode 状態を設定/配信します。
- `talk.speak` は、アクティブな Talk speech provider を通じて音声合成します。
- `tts.status` は、TTS 有効状態、アクティブ provider、fallback provider、
  および provider config 状態を返します。
- `tts.providers` は、表示可能な TTS provider inventory を返します。
- `tts.enable` と `tts.disable` は TTS prefs 状態を切り替えます。
- `tts.setProvider` は優先 TTS provider を更新します。
- `tts.convert` はワンショットの text-to-speech 変換を実行します。

### Secrets、config、update、および wizard

- `secrets.reload` は、アクティブな SecretRef を再解決し、完全成功時にのみ
  ランタイム secret 状態を切り替えます。
- `secrets.resolve` は、特定の
  command/target セットに対する command-target secret assignment を解決します。
- `config.get` は現在の config snapshot と hash を返します。
- `config.set` は検証済み config payload を書き込みます。
- `config.patch` は部分的な config 更新をマージします。
- `config.apply` は完全な config payload を検証して置き換えます。
- `config.schema` は、Control UI と
  CLI tooling で使われる live config schema payload を返します。schema、`uiHints`、version、
  generation metadata を含み、ランタイムで読み込める場合は plugin + channel schema metadata も含みます。schema
  には、同じ UI で使われるラベルと help text から導出された field の `title` / `description`
  metadata が含まれ、対応する field
  documentation が存在する場合は、ネストされた object、wildcard、array-item、
  `anyOf` / `oneOf` / `allOf` の合成ブランチも含みます。
- `config.schema.lookup` は、1 つの config
  path に対する path-scope lookup payload を返します。正規化された path、浅い schema node、
  一致した hint + `hintPath`、および UI/CLI ドリルダウン用の直接の child summary を含みます。
  - Lookup schema node は、ユーザー向け docs と一般的な検証 field を保持します:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    数値/文字列/配列/object の境界、および
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` のような boolean flag。
  - Child summary は `key`、正規化された `path`、`type`、`required`、
    `hasChildren`、および一致した `hint` / `hintPath` を公開します。
- `update.run` は Gateway update フローを実行し、
  update 自体が成功した場合にのみ再起動をスケジュールします。
- `wizard.start`、`wizard.next`、`wizard.status`、`wizard.cancel` は、
  オンボーディング ウィザードを WS RPC 経由で公開します。

### 既存の主要ファミリー

#### Agent と workspace helper

- `agents.list` は設定済みの agent エントリを返します。
- `agents.create`、`agents.update`、`agents.delete` は agent record と
  workspace wiring を管理します。
- `agents.files.list`、`agents.files.get`、`agents.files.set` は、
  agent に公開される bootstrap workspace file を管理します。
- `agent.identity.get` は、agent または
  session に対する有効な assistant identity を返します。
- `agent.wait` は run の完了を待ち、利用可能な場合は terminal snapshot を返します。

#### Session 制御

- `sessions.list` は現在の session index を返します。
- `sessions.subscribe` と `sessions.unsubscribe` は、現在の WS client に対する session change event
  subscription を切り替えます。
- `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、
  1 つの session に対する transcript/message event subscription を切り替えます。
- `sessions.preview` は、特定の session
  key に対して境界付き transcript preview を返します。
- `sessions.resolve` は session target を解決または正規化します。
- `sessions.create` は新しい session エントリを作成します。
- `sessions.send` は既存の session にメッセージを送信します。
- `sessions.steer` は、アクティブな session に対する interrupt-and-steer バリアントです。
- `sessions.abort` は session に対するアクティブな作業を中断します。
- `sessions.patch` は session metadata/override を更新します。
- `sessions.reset`、`sessions.delete`、`sessions.compact` は session
  メンテナンスを実行します。
- `sessions.get` は完全な保存済み session row を返します。
- chat 実行では引き続き `chat.history`、`chat.send`、`chat.abort`、`chat.inject` を使用します。
- `chat.history` は UI client 向けに表示正規化されています。インライン directive tag は
  可視テキストから削除され、プレーンテキストの tool-call XML payload（
  `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、
  および切り詰められた tool-call block を含む）と、漏れた ASCII/全角の model control token
  は削除され、正確に `NO_REPLY` / `no_reply` である純粋な silent-token assistant row は省略され、
  大きすぎる row は placeholder に置き換えられることがあります。

#### Device pairing と device token

- `device.pair.list` は保留中および承認済みの paired device を返します。
- `device.pair.approve`、`device.pair.reject`、`device.pair.remove` は
  device-pairing record を管理します。
- `device.token.rotate` は、paired device token を承認済みの role
  と scope の範囲内でローテーションします。
- `device.token.revoke` は paired device token を失効させます。

#### Node pairing、invoke、および pending work

- `node.pair.request`、`node.pair.list`、`node.pair.approve`、
  `node.pair.reject`、`node.pair.verify` は node pairing と bootstrap
  verification を扱います。
- `node.list` と `node.describe` は既知/接続済みの node 状態を返します。
- `node.rename` は paired node label を更新します。
- `node.invoke` は command を接続済み node に転送します。
- `node.invoke.result` は invoke request の result を返します。
- `node.event` は node 起点の event を Gateway に戻します。
- `node.canvas.capability.refresh` は scope 付き canvas-capability token を更新します。
- `node.pending.pull` と `node.pending.ack` は接続済み node 用の queue API です。
- `node.pending.enqueue` と `node.pending.drain` は、offline/disconnected node 向けの永続的な pending work
  を管理します。

#### Approval ファミリー

- `exec.approval.request`、`exec.approval.get`、`exec.approval.list`、`exec.approval.resolve` は、
  ワンショットの exec approval request と、保留中 approval の lookup/replay を扱います。
- `exec.approval.waitDecision` は 1 つの保留中 exec approval を待ち、
  最終決定を返します（timeout 時は `null`）。
- `exec.approvals.get` と `exec.approvals.set` は Gateway の exec approval
  policy snapshot を管理します。
- `exec.approvals.node.get` と `exec.approvals.node.set` は、node relay command 経由で node ローカルの exec
  approval policy を管理します。
- `plugin.approval.request`、`plugin.approval.list`、
  `plugin.approval.waitDecision`、`plugin.approval.resolve` は
  plugin 定義の approval flow を扱います。

#### その他の主要ファミリー

- automation:
  - `wake` は即時または次回 Heartbeat 時の wake text injection をスケジュールします
  - `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`、
    `cron.run`、`cron.runs`
- skills/tools: `commands.list`、`skills.*`、`tools.catalog`、`tools.effective`

### 一般的な event ファミリー

- `chat`: `chat.inject` やその他の transcript 専用 chat
  event など、UI chat の更新。
- `session.message` と `session.tool`: subscription 済み session に対する transcript/event-stream 更新。
- `sessions.changed`: session index または metadata が変更されました。
- `presence`: system presence snapshot 更新。
- `tick`: 定期的な keepalive / liveness event。
- `health`: Gateway health snapshot 更新。
- `heartbeat`: Heartbeat event stream 更新。
- `cron`: Cron run/job change event。
- `shutdown`: Gateway shutdown 通知。
- `node.pair.requested` / `node.pair.resolved`: node pairing lifecycle。
- `node.invoke.request`: node invoke request broadcast。
- `device.pair.requested` / `device.pair.resolved`: paired-device lifecycle。
- `voicewake.changed`: wake-word trigger config が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec approval
  lifecycle。
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin approval
  lifecycle。

### Node helper method

- Node は `skills.bins` を呼び出して、auto-allow check 用の現在の skill executable 一覧を取得できます。

### Operator helper method

- Operator は `commands.list`（`operator.read`）を呼び出して、agent のランタイム
  command inventory を取得できます。
  - `agentId` は任意です。省略するとデフォルト agent workspace を読み取ります。
  - `scope` は、primary の `name` がどの surface を対象にするかを制御します:
    - `text` は先頭の `/` を除いた primary text command token を返します
    - `native` とデフォルトの `both` パスは、利用可能な場合に provider-aware の native 名を返します
  - `textAliases` は `/model` と `/m` のような正確な slash alias を保持します。
  - `nativeName` は、存在する場合に provider-aware の native command 名を保持します。
  - `provider` は任意で、native naming と native plugin
    command の利用可否にのみ影響します。
  - `includeArgs=false` は、serialized argument metadata を応答から除外します。
- Operator は `tools.catalog`（`operator.read`）を呼び出して、agent のランタイム tool catalog を取得できます。応答には、グループ化された tool と provenance metadata が含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` のときの plugin owner
  - `optional`: plugin tool が optional かどうか
- Operator は `tools.effective`（`operator.read`）を呼び出して、session に対するランタイム有効 tool
  inventory を取得できます。
  - `sessionKey` は必須です。
  - Gateway は、呼び出し元が指定した auth や delivery context を受け入れる代わりに、
    trusted なランタイムコンテキストを session からサーバー側で導出します。
  - 応答は session スコープであり、core、plugin、channel tool を含め、
    アクティブな会話が今すぐ使えるものを反映します。
- Operator は `skills.status`（`operator.read`）を呼び出して、agent に対して可視な
  skill inventory を取得できます。
  - `agentId` は任意です。省略するとデフォルト agent workspace を読み取ります。
  - 応答には、raw secret 値を公開せずに、適格性、不足している要件、config check、
    およびサニタイズ済み install option が含まれます。
- Operator は ClawHub discovery metadata のために `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- Operator は `skills.install`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モード: `{ source: "clawhub", slug, version?, force? }` は、
    skill フォルダをデフォルト agent workspace の `skills/` ディレクトリにインストールします。
  - Gateway installer モード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    は、Gateway host 上で宣言済みの `metadata.openclaw.install` action を実行します。
- Operator は `skills.update`（`operator.admin`）を 2 つのモードで呼び出せます:
  - ClawHub モードでは、デフォルト agent workspace 内の 1 つの tracked slug、またはすべての tracked ClawHub install を更新します。
  - Config モードでは、`enabled`、
    `apiKey`、`env` などの `skills.entries.<skillKey>` 値を patch します。

## Exec approval

- exec request が approval を必要とする場合、Gateway は `exec.approval.requested` を broadcast します。
- Operator client は `exec.approval.resolve` を呼び出して解決します（`operator.approvals` scope が必要です）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規化された `argv`/`cwd`/`rawCommand`/session metadata）を含める必要があります。`systemRunPlan` がない request は拒否されます。
- approval 後、転送される `node.invoke system.run` 呼び出しは、その正規化された
  `systemRunPlan` を権威ある command/cwd/session context として再利用します。
- 呼び出し元が prepare と最終的な承認済み `system.run` 転送の間で `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gateway は変更された payload を信頼する代わりに、その run を拒否します。

## Agent 配信フォールバック

- `agent` request には、外向き配信を要求するために `deliver=true` を含めることができます。
- `bestEffortDeliver=false` は厳格な動作を維持します。解決不能または内部専用の配信 target は `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部に配信可能な route を解決できない場合（たとえば internal/webchat session や曖昧な multi-channel config）に、session のみの実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- Schema + model は TypeBox 定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` の reference client はこれらのデフォルト値を使用します。これらの値は
protocol v3 全体で安定しており、サードパーティクライアントにとって期待されるベースラインです。

| 定数 | デフォルト | ソース |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Request timeout（RPC ごと）               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth / connect-challenge timeout       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts`（clamp `250`–`10_000`） |
| 初期 reconnect backoff                    | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| 最大 reconnect backoff                    | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| device-token close 後の fast-retry clamp  | `250` ms                                              | `src/gateway/client.ts`                                    |
| `terminate()` 前の force-stop grace       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` のデフォルト timeout      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| デフォルト tick interval（`hello-ok` 前） | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-timeout close                        | 無通信が `tickIntervalMs * 2` を超えると code `4000`  | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`（25 MB）                           | `src/gateway/server-constants.ts`                          |

サーバーは `hello-ok` 内で有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を通知します。クライアントは pre-handshake のデフォルトではなく、
これらの値に従うべきです。

## Auth

- 共有シークレットの Gateway auth は、設定された auth mode に応じて `connect.params.auth.token` または
  `connect.params.auth.password` を使用します。
- Tailscale Serve
  （`gateway.auth.allowTailscale: true`）や non-loopback
  `gateway.auth.mode: "trusted-proxy"` のような identity を伴う mode は、
  `connect.params.auth.*` ではなく request header から connect auth チェックを満たします。
- private-ingress の `gateway.auth.mode: "none"` は共有シークレットの connect auth を
  完全にスキップします。この mode を public/untrusted ingress に公開しないでください。
- pairing 後、Gateway は接続の role + scope にスコープされた **device token** を発行します。これは
  `hello-ok.auth.deviceToken` で返され、今後の接続のためにクライアントが永続化する必要があります。
- クライアントは、接続成功後に常に主要な `hello-ok.auth.deviceToken` を永続化するべきです。
- その **保存済み** device token を使って再接続する場合、その token に対する保存済みの
  承認済み scope セットも再利用するべきです。これにより、すでに付与された read/probe/status アクセスが維持され、
  再接続時により狭い暗黙の admin-only scope へ黙って縮小されるのを防げます。
- クライアント側の connect auth 構成（
  `src/gateway/client.ts` の `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されている場合は常に転送されます。
  - `auth.token` は優先順位で設定されます: まず明示的な shared token、
    次に明示的な `deviceToken`、その後に保存済みの per-device token（
    `deviceId` + `role` でキー付け）です。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    shared token または解決済みの device token がある場合は送信されません。
  - one-shot の
    `AUTH_TOKEN_MISMATCH` retry における保存済み device token の自動昇格は、**trusted endpoint のみ** に制限されます —
    loopback、または pin 済み `tlsFingerprint` を持つ `wss://` です。pinning なしの public `wss://` は対象になりません。
- 追加の `hello-ok.auth.deviceTokens` エントリは bootstrap handoff token です。
  これらは、接続で bootstrap auth を `wss://` または loopback/local pairing のような trusted transport 上で使用した場合にのみ永続化してください。
- クライアントが **明示的な** `deviceToken` または明示的な `scopes` を指定した場合、その
  呼び出し元要求の scope セットが引き続き権威を持ちます。キャッシュ済み scope は、クライアントが保存済みの per-device token を再利用している場合にのみ再利用されます。
- Device token は `device.token.rotate` と
  `device.token.revoke` によりローテーション/失効できます（`operator.pairing` scope が必要です）。
- token の発行/ローテーションは、その device の pairing エントリに記録された承認済み role セットの範囲内に制限されます。token のローテーションによって、pairing 承認で一度も許可されていない role へ device を拡張することはできません。
- paired-device token セッションでは、呼び出し元が `operator.admin` も持っていない限り、
  device 管理は self-scope です。non-admin の呼び出し元は自分 **自身** の device エントリのみを remove/revoke/rotate できます。
- `device.token.rotate` は、要求された operator scope セットも
  呼び出し元の現在のセッション scope と照合します。non-admin の呼び出し元は、現在保持しているものより広い operator scope セットへ token をローテーションできません。
- Auth 失敗には `error.details.code` と回復ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken`（boolean）
  - `error.details.recommendedNextStep`（`retry_with_device_token`、`update_auth_configuration`、`update_auth_credentials`、`wait_then_retry`、`review_auth_configuration`）
- `AUTH_TOKEN_MISMATCH` に対するクライアント動作:
  - trusted クライアントは、キャッシュ済みの per-device token を使って 1 回だけ制限付き retry を試行できます。
  - その retry が失敗した場合、クライアントは自動再接続ループを停止し、operator の対応が必要であることを案内するべきです。

## Device identity + pairing

- Node は、keypair fingerprint から導出された安定した device identity（`device.id`）を含めるべきです。
- Gateway は device + role ごとに token を発行します。
- local auto-approval が有効でない限り、新しい device ID には pairing approval が必要です。
- pairing auto-approval は直接の local loopback 接続を中心に設計されています。
- OpenClaw には、trusted な共有シークレット helper flow 向けの、狭く限定された backend/container-local self-connect パスもあります。
- 同一 host の tailnet または LAN 接続は、pairing 上は引き続き remote として扱われ、承認が必要です。
- すべての WS クライアントは `connect` 中に `device` identity を含める必要があります（operator + node）。
  Control UI がこれを省略できるのは次の mode のみです:
  - localhost 専用の insecure HTTP 互換性のための `gateway.controlUi.allowInsecureAuth=true`。
  - `gateway.auth.mode: "trusted-proxy"` による operator Control UI auth の成功時。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急時用、重大なセキュリティ低下）。
- すべての接続は、サーバー提供の `connect.challenge` nonce に署名しなければなりません。

### Device auth 移行診断

接続前 challenge 以前の署名動作をまだ使っているレガシークライアント向けに、`connect` は現在
`error.details.code` の下で `DEVICE_AUTH_*` 詳細コードを、安定した `error.details.reason` とともに返します。

一般的な移行失敗:

| メッセージ | details.code | details.reason | 意味 |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した、または空で送信しました。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤った nonce で署名しました。 |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名 payload が v2 payload と一致しません。 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名済み timestamp が許容 skew の範囲外です。 |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が public key fingerprint と一致しません。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | public key の形式/正規化に失敗しました。 |

移行先の目標:

- 常に `connect.challenge` を待ちます。
- サーバー nonce を含む v2 payload に署名します。
- 同じ nonce を `connect.params.device.nonce` で送信します。
- 推奨される署名 payload は `v3` で、device/client/role/scopes/token/nonce フィールドに加えて `platform` と `deviceFamily` をバインドします。
- レガシーな `v2` 署名も互換性のため引き続き受け付けられますが、paired-device の
  metadata pinning は再接続時の command policy を引き続き制御します。

## TLS + pinning

- WS 接続では TLS がサポートされます。
- クライアントは任意で Gateway cert fingerprint を pin できます（`gateway.tls`
  config と `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint` を参照）。

## Scope

このプロトコルは **完全な Gateway API**（status、channels、models、chat、
agent、sessions、nodes、approvals など）を公開します。正確な surface は
`src/gateway/protocol/schema.ts` の TypeBox schema で定義されています。
