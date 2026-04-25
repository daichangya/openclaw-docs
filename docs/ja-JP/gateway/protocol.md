---
read_when:
    - Gateway WSクライアントの実装または更新
    - プロトコル不一致または接続失敗のデバッグ
    - プロトコルスキーマ/モデルの再生成
summary: 'Gateway WebSocketプロトコル: ハンドシェイク、フレーム、バージョニング'
title: Gatewayプロトコル
x-i18n:
    generated_at: "2026-04-25T13:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Gateway WSプロトコルは、OpenClawの **単一のcontrol plane + node transport** です。
すべてのクライアント（CLI、web UI、macOSアプリ、iOS/Android node、headless
node）はWebSocket経由で接続し、ハンドシェイク時に自分の **role** と **scope** を宣言します。

## Transport

- WebSocket、JSON payloadを持つテキストフレーム。
- 最初のフレームは **必ず** `connect` リクエストでなければなりません。
- 接続前のフレームは64 KiBに制限されます。ハンドシェイク成功後、クライアントは
  `hello-ok.policy.maxPayload` と
  `hello-ok.policy.maxBufferedBytes` の制限に従う必要があります。diagnosticsが有効な場合、
  サイズ超過の受信フレームと低速な送信バッファは、Gatewayが対象フレームを閉じるまたは破棄する前に
  `payload.large` イベントを発行します。これらのイベントには、
  サイズ、制限、サーフェス、安全な理由コードが保持されます。メッセージ本文、
  添付内容、生フレーム本文、トークン、cookie、秘密値は保持されません。

## ハンドシェイク（connect）

Gateway → クライアント（接続前challenge）:

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

`server`、`features`、`snapshot`、`policy` はすべてスキーマ
（`src/gateway/protocol/schema/frames.ts`）で必須です。`canvasHostUrl` は任意です。`auth`
は利用可能な場合、ネゴシエートされたrole/scopesを報告し、Gatewayが発行した場合は
`deviceToken` も含みます。

device tokenが発行されない場合でも、`hello-ok.auth` はネゴシエートされた
権限を報告できます:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

device tokenが発行された場合、`hello-ok` には次も含まれます:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

trusted bootstrap handoff中は、`hello-ok.auth` に、追加の制限付きroleエントリが
`deviceTokens` 内に含まれることもあります:

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

組み込みのnode/operator bootstrapフローでは、主要node tokenは
`scopes: []` のままで、handoffされるoperator tokenはbootstrap
operator allowlist（`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`）に制限されたままです。bootstrapのscopeチェックは
引き続きroleプレフィックス単位です。operatorエントリはoperatorリクエストだけを満たし、non-operator
roleは引き続き自分自身のroleプレフィックス配下のscopeが必要です。

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

副作用のあるメソッドには **idempotency key** が必要です（スキーマ参照）。

## Roles + scopes

### Roles

- `operator` = control planeクライアント（CLI/UI/automation）。
- `node` = capability host（camera/screen/canvas/system.run）。

### Scopes（operator）

一般的なscope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` で `includeSecrets: true` を使うには `operator.talk.secrets`
（または `operator.admin`）が必要です。

Plugin登録されたGateway RPCメソッドは独自のoperator scopeを要求できますが、
予約済みのcore adminプレフィックス（`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`）は常に `operator.admin` に解決されます。

メソッドscopeは最初のゲートにすぎません。`chat.send` 経由で到達する一部の
slash commandには、その上にさらに厳しいコマンドレベルチェックがあります。たとえば、
永続的な `/config set` と `/config unset` の書き込みには `operator.admin` が必要です。

`node.pair.approve` には、ベースのメソッドscopeに加えて、承認時の追加scopeチェックもあります:

- commandなしリクエスト: `operator.pairing`
- non-exec node commandを伴うリクエスト: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, `system.which` を含むリクエスト:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions（node）

nodeは接続時にcapability claimを宣言します:

- `caps`: 高レベルなcapabilityカテゴリ。
- `commands`: invoke用のcommand allowlist。
- `permissions`: 細かなトグル（例: `screen.record`, `camera.capture`）。

Gatewayはこれらを **claim** として扱い、サーバー側allowlistを適用します。

## Presence

- `system-presence` はdevice identityをキーとするエントリを返します。
- Presenceエントリには `deviceId`、`roles`、`scopes` が含まれるため、UIは
  そのデバイスが **operator** と **node** の両方で接続していても、デバイスごとに1行で表示できます。

## ブロードキャストイベントのスコープ

サーバーからpushされるWebSocketブロードキャストイベントはscopeでゲートされるため、pairing-scopeのみやnode専用のセッションが、受動的にセッション内容を受け取ることはありません。

- **Chat、agent、tool-resultフレーム**（ストリーミングされる `agent` イベントおよびツール呼び出し結果を含む）には、少なくとも `operator.read` が必要です。`operator.read` を持たないセッションは、これらのフレームを完全にスキップします。
- **Plugin定義の `plugin.*` ブロードキャスト** は、Pluginの登録方法に応じて `operator.write` または `operator.admin` にゲートされます。
- **Statusおよびtransportイベント**（`heartbeat`, `presence`, `tick`, connect/disconnectライフサイクルなど）は、transportヘルスをすべての認証済みセッションから観測可能にするため、制限されません。
- **不明なブロードキャストイベントファミリー** は、登録済みハンドラーが明示的に緩和しない限り、デフォルトでscopeゲートされます（fail-closed）。

各クライアント接続はクライアントごとのシーケンス番号を保持するため、異なるクライアントがscopeフィルタされた異なるイベント部分集合を見ていても、そのソケット上ではブロードキャストの単調順序が維持されます。

## 一般的なRPCメソッドファミリー

公開WSサーフェスは、上記のハンドシェイク/認証例よりも広範です。これは
自動生成ダンプではありません。`hello-ok.features.methods` は、
`src/gateway/server-methods-list.ts` とロード済み
plugin/channelメソッドexportから構築された、保守的な検出リストです。これを
機能検出として扱ってください。`src/gateway/server-methods/*.ts` の完全列挙ではありません。

<AccordionGroup>
  <Accordion title="システムとアイデンティティ">
    - `health` は、キャッシュ済みまたは新たにプローブされたGatewayヘルススナップショットを返します。
    - `diagnostics.stability` は、最近の境界付きdiagnostic stability recorderを返します。イベント名、件数、バイトサイズ、メモリ読み取り値、queue/session状態、channel/plugin名、session idのような運用メタデータを保持します。チャットテキスト、Webhook本文、ツール出力、生のリクエストまたはレスポンス本文、トークン、cookie、秘密値は保持しません。operator read scopeが必要です。
    - `status` は `/status` 形式のGateway要約を返します。機微なフィールドはadmin scopeを持つoperatorクライアントにのみ含まれます。
    - `gateway.identity.get` は、relayおよびpairingフローで使われるGateway device identityを返します。
    - `system-presence` は、接続中のoperator/nodeデバイスに対する現在のpresenceスナップショットを返します。
    - `system-event` はシステムイベントを追加し、presenceコンテキストを更新/ブロードキャストできます。
    - `last-heartbeat` は、最新の永続化されたHeartbeatイベントを返します。
    - `set-heartbeats` は、Gateway上のHeartbeat処理を切り替えます。
  </Accordion>

  <Accordion title="モデルと使用状況">
    - `models.list` は、ランタイムで許可されたモデルカタログを返します。
    - `usage.status` は、プロバイダーの使用量ウィンドウ/残りクォータの要約を返します。
    - `usage.cost` は、日付範囲に対する集計済みコスト使用量要約を返します。
    - `doctor.memory.status` は、アクティブなデフォルトagent workspaceに対するvector-memory / embeddingの準備状況を返します。
    - `sessions.usage` は、セッションごとの使用量要約を返します。
    - `sessions.usage.timeseries` は、1セッションのtimeseries使用量を返します。
    - `sessions.usage.logs` は、1セッションの使用量ログエントリを返します。
  </Accordion>

  <Accordion title="チャネルとログインヘルパー">
    - `channels.status` は、組み込み + バンドル済みchannel/pluginのステータス要約を返します。
    - `channels.logout` は、そのchannelがlogoutをサポートしている場合、特定のchannel/accountからlogoutします。
    - `web.login.start` は、現在のQR対応web channel providerに対するQR/webログインフローを開始します。
    - `web.login.wait` は、そのQR/webログインフローの完了を待ち、成功時にchannelを開始します。
    - `push.test` は、登録済みiOS nodeへテストAPNs pushを送信します。
    - `voicewake.get` は、保存済みのwake-wordトリガーを返します。
    - `voicewake.set` は、wake-wordトリガーを更新し、変更をブロードキャストします。
  </Accordion>

  <Accordion title="メッセージングとログ">
    - `send` は、chat runner外でのchannel/account/threadターゲット送信に使う直接の送信RPCです。
    - `logs.tail` は、カーソル/制限および最大バイト制御付きで、設定済みGateway file logのtailを返します。
  </Accordion>

  <Accordion title="TalkとTTS">
    - `talk.config` は、有効なTalk設定payloadを返します。`includeSecrets` には `operator.talk.secrets`（または `operator.admin`）が必要です。
    - `talk.mode` は、WebChat/Control UIクライアント向けの現在のTalk mode状態を設定/ブロードキャストします。
    - `talk.speak` は、アクティブなTalk speech providerを通じて音声合成します。
    - `tts.status` は、TTS有効状態、アクティブprovider、フォールバックprovider、provider設定状態を返します。
    - `tts.providers` は、可視のTTS provider inventoryを返します。
    - `tts.enable` と `tts.disable` は、TTS設定状態を切り替えます。
    - `tts.setProvider` は、優先TTS providerを更新します。
    - `tts.convert` は、ワンショットのtext-to-speech変換を実行します。
  </Accordion>

  <Accordion title="Secrets、config、update、wizard">
    - `secrets.reload` は、アクティブなSecretRefを再解決し、完全成功時にのみランタイムのsecret stateを入れ替えます。
    - `secrets.resolve` は、特定のcommand/targetセットに対するcommand-target secret割り当てを解決します。
    - `config.get` は、現在のconfig snapshotとhashを返します。
    - `config.set` は、検証済みconfig payloadを書き込みます。
    - `config.patch` は、部分的なconfig更新をマージします。
    - `config.apply` は、完全なconfig payloadを検証して置き換えます。
    - `config.schema` は、Control UIとCLI toolingで使われるライブconfig schema payloadを返します: schema、`uiHints`、version、generation metadata、およびランタイムが読み込める場合はplugin + channel schema metadataも含みます。schemaには、UIで使われるラベルとヘルプテキストと同じものから導出された、フィールドの `title` / `description` metadataが含まれます。対応するフィールド文書が存在する場合、ネストしたobject、wildcard、array-item、および `anyOf` / `oneOf` / `allOf` のcomposition branchも含みます。
    - `config.schema.lookup` は、1つのconfig pathに対するpath-scope lookup payloadを返します: 正規化済みpath、浅いschema node、一致したhint + `hintPath`、およびUI/CLI drill-down用の直接のchild summaryです。lookup schema nodeは、ユーザー向けドキュメントと一般的な検証フィールド（`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numeric/string/array/object bounds、および `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` のようなフラグ）を保持します。child summaryは `key`、正規化済み `path`、`type`、`required`、`hasChildren`、および一致した `hint` / `hintPath` を公開します。
    - `update.run` は、Gateway updateフローを実行し、update自体が成功した場合にのみ再起動をスケジュールします。
    - `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel` は、WS RPC経由でオンボーディングウィザードを公開します。
  </Accordion>

  <Accordion title="エージェントとワークスペースのヘルパー">
    - `agents.list` は、設定済みagentエントリを返します。
    - `agents.create`, `agents.update`, `agents.delete` は、agent recordとworkspace wiringを管理します。
    - `agents.files.list`, `agents.files.get`, `agents.files.set` は、agent向けに公開されるbootstrap workspace fileを管理します。
    - `agent.identity.get` は、agentまたはsessionに対する有効なassistant identityを返します。
    - `agent.wait` は、実行完了を待ち、利用可能な場合はterminal snapshotを返します。
  </Accordion>

  <Accordion title="セッション制御">
    - `sessions.list` は、現在のsession indexを返します。
    - `sessions.subscribe` と `sessions.unsubscribe` は、現在のWSクライアントに対するsession change event subscriptionを切り替えます。
    - `sessions.messages.subscribe` と `sessions.messages.unsubscribe` は、1つのsessionに対するtranscript/message event subscriptionを切り替えます。
    - `sessions.preview` は、特定のsession keyに対する境界付きtranscript previewを返します。
    - `sessions.resolve` は、session targetを解決または正規化します。
    - `sessions.create` は、新しいsessionエントリを作成します。
    - `sessions.send` は、既存sessionへメッセージを送信します。
    - `sessions.steer` は、アクティブsessionに対するinterrupt-and-steer版です。
    - `sessions.abort` は、sessionのアクティブな作業を中止します。
    - `sessions.patch` は、session metadata/overrideを更新します。
    - `sessions.reset`, `sessions.delete`, `sessions.compact` は、sessionメンテナンスを実行します。
    - `sessions.get` は、完全な保存済みsession rowを返します。
    - Chat実行では引き続き `chat.history`, `chat.send`, `chat.abort`, `chat.inject` を使います。`chat.history` はUIクライアント向けに表示正規化されています: インラインdirective tagは表示テキストから削除され、プレーンテキストのtool-call XML payload（`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`、および切り詰められたtool-call blockを含む）と、漏れたASCII/全角のmodel control tokenは削除され、正確な `NO_REPLY` / `no_reply` のような純粋なsilent-token assistant rowは省略され、サイズ超過のrowはplaceholderに置き換えられることがあります。
  </Accordion>

  <Accordion title="デバイスペアリングとdevice token">
    - `device.pair.list` は、保留中および承認済みのペア済みデバイスを返します。
    - `device.pair.approve`, `device.pair.reject`, `device.pair.remove` は、device-pairing recordを管理します。
    - `device.token.rotate` は、承認済みのroleおよびscope境界内で、ペア済みdevice tokenをローテーションします。
    - `device.token.revoke` は、ペア済みdevice tokenを失効させます。
  </Accordion>

  <Accordion title="Nodeペアリング、invoke、保留中作業">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.verify` は、Nodeペアリングとbootstrap検証を扱います。
    - `node.list` と `node.describe` は、既知/接続済みNode状態を返します。
    - `node.rename` は、ペア済みNodeラベルを更新します。
    - `node.invoke` は、接続済みNodeへコマンドを転送します。
    - `node.invoke.result` は、invokeリクエストの結果を返します。
    - `node.event` は、Node起点のイベントをGatewayへ戻します。
    - `node.canvas.capability.refresh` は、スコープされたcanvas-capability tokenを更新します。
    - `node.pending.pull` と `node.pending.ack` は、接続済みNode queue APIです。
    - `node.pending.enqueue` と `node.pending.drain` は、オフライン/切断Node向けの永続保留作業を管理します。
  </Accordion>

  <Accordion title="承認ファミリー">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve` は、ワンショットexec承認リクエストと、保留中承認のlookup/replayを扱います。
    - `exec.approval.waitDecision` は、1つの保留中exec承認を待機し、最終決定を返します（タイムアウト時は `null`）。
    - `exec.approvals.get` と `exec.approvals.set` は、Gateway exec承認ポリシーsnapshotを管理します。
    - `exec.approvals.node.get` と `exec.approvals.node.set` は、Node relay command経由でNodeローカルのexec承認ポリシーを管理します。
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve` は、Plugin定義の承認フローを扱います。
  </Accordion>

  <Accordion title="自動化、Skills、ツール">
    - 自動化: `wake` は即時または次のHeartbeatでのwakeテキスト注入をスケジュールします。`cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` は、スケジュール作業を管理します。
    - Skillsとツール: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### 一般的なイベントファミリー

- `chat`: `chat.inject` やその他のtranscript専用chat
  eventのようなUI chat更新。
- `session.message` と `session.tool`: 購読中session向けのtranscript/event-stream更新。
- `sessions.changed`: session indexまたはmetadataが変更されました。
- `presence`: システムpresence snapshot更新。
- `tick`: 定期的なkeepalive / livenessイベント。
- `health`: Gateway health snapshot更新。
- `heartbeat`: Heartbeatイベントストリーム更新。
- `cron`: Cron実行/job変更イベント。
- `shutdown`: Gatewayシャットダウン通知。
- `node.pair.requested` / `node.pair.resolved`: Nodeペアリングのライフサイクル。
- `node.invoke.request`: Node invokeリクエストのブロードキャスト。
- `device.pair.requested` / `device.pair.resolved`: ペア済みデバイスのライフサイクル。
- `voicewake.changed`: wake-word trigger設定が変更されました。
- `exec.approval.requested` / `exec.approval.resolved`: exec承認の
  ライフサイクル。
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin承認の
  ライフサイクル。

### Nodeヘルパーメソッド

- Nodeは、auto-allowチェックのために現在のskill executable一覧を取得する目的で `skills.bins` を呼び出せます。

### operatorヘルパーメソッド

- operatorは、agent向けのランタイム
  command inventoryを取得するために `commands.list`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略するとデフォルトagent workspaceを読み取ります。
  - `scope` は、primary `name` がどのサーフェスを対象にするかを制御します:
    - `text` は、先頭の `/` を除いたprimary text command tokenを返します
    - `native` とデフォルトの `both` パスは、利用可能な場合、provider対応のnative nameを返します
  - `textAliases` は、`/model` や `/m` のような正確なslash aliasを保持します。
  - `nativeName` は、存在する場合にprovider対応のnative command nameを保持します。
  - `provider` は任意で、native namingとnative plugin
    command availabilityにのみ影響します。
  - `includeArgs=false` は、レスポンスからシリアライズ済み引数metadataを省略します。
- operatorは、agent向けのランタイムtool catalogを取得するために `tools.catalog`（`operator.read`）を呼び出せます。レスポンスには、グループ化されたツールとprovenance metadataが含まれます:
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` のときのPlugin所有者
  - `optional`: Pluginツールが任意かどうか
- operatorは、session向けのランタイム有効tool
  inventoryを取得するために `tools.effective`（`operator.read`）を呼び出せます。
  - `sessionKey` は必須です。
  - Gatewayは、呼び出し元が提供するauthやdelivery contextを受け取る代わりに、
    信頼済みランタイムコンテキストをserver-sideでsessionから導出します。
  - レスポンスはsessionスコープで、現在アクティブな会話が実際に使えるものを反映します。
    これにはcore、plugin、channelツールが含まれます。
- operatorは、agent向けに可視な
  skill inventoryを取得するために `skills.status`（`operator.read`）を呼び出せます。
  - `agentId` は任意です。省略するとデフォルトagent workspaceを読み取ります。
  - レスポンスには、適格性、不足要件、configチェック、
    生の秘密値を公開しないsanitized install optionが含まれます。
- operatorは、ClawHub discovery metadataのために `skills.search` と `skills.detail`（`operator.read`）を呼び出せます。
- operatorは、`skills.install`（`operator.admin`）を2つのモードで呼び出せます:
  - ClawHubモード: `{ source: "clawhub", slug, version?, force? }` は、
    skill folderをデフォルトagent workspaceの `skills/` ディレクトリにインストールします。
  - Gateway installerモード: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    は、Gatewayホスト上で宣言済み `metadata.openclaw.install` アクションを実行します。
- operatorは、`skills.update`（`operator.admin`）を2つのモードで呼び出せます:
  - ClawHubモードは、1つの追跡中slugまたはデフォルトagent workspace内の全追跡ClawHubインストールを更新します。
  - Configモードは、`enabled`、
    `apiKey`、`env` のような `skills.entries.<skillKey>` 値をpatchします。

## exec承認

- execリクエストに承認が必要な場合、Gatewayは `exec.approval.requested` をブロードキャストします。
- operatorクライアントは `exec.approval.resolve` を呼び出して解決します（`operator.approvals` scopeが必要）。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規化された `argv`/`cwd`/`rawCommand`/session metadata）が必須です。`systemRunPlan` が欠落したリクエストは拒否されます。
- 承認後、転送される `node.invoke system.run` 呼び出しは、その正規化された
  `systemRunPlan` を、権威あるcommand/cwd/session contextとして再利用します。
- 呼び出し元が、prepareと最終的な承認済み `system.run` 転送の間で `command`、`rawCommand`、`cwd`、`agentId`、または
  `sessionKey` を変更した場合、Gatewayは変更されたpayloadを信頼せずに
  実行を拒否します。

## エージェント配信フォールバック

- `agent` リクエストには、送信配信を要求するための `deliver=true` を含められます。
- `bestEffortDeliver=false` は厳密な挙動を維持します: 未解決または内部専用の配信ターゲットは `INVALID_REQUEST` を返します。
- `bestEffortDeliver=true` は、外部配信可能なルートが解決できない場合（たとえば内部/webchat sessionや曖昧なmulti-channel config）に、session専用実行へのフォールバックを許可します。

## バージョニング

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema/protocol-schemas.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- schema + modelはTypeBox定義から生成されます:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### クライアント定数

`src/gateway/client.ts` の参照クライアントは、これらのデフォルトを使用します。値は
protocol v3全体で安定しており、サードパーティクライアントにとって想定されるベースラインです。

| 定数                                      | デフォルト                                            | ソース                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| リクエストタイムアウト（RPCごと）         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| preauth / connect-challengeタイムアウト   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| 初期reconnectバックオフ                   | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| 最大reconnectバックオフ                   | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| device-token close後のfast-retry clamp    | `250` ms                                              | `src/gateway/client.ts`                                    |
| `terminate()` 前のforce-stop猶予          | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` のデフォルトタイムアウト  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| デフォルトtick間隔（`hello-ok` 前）       | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| tick-timeout close                        | code `4000` when silence exceeds `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

サーバーは、有効な `policy.tickIntervalMs`、`policy.maxPayload`、
`policy.maxBufferedBytes` を `hello-ok` で通知します。クライアントは、接続前デフォルトではなく、
それらの値に従う必要があります。

## Auth

- 共有シークレットGateway認証では、設定された認証モードに応じて
  `connect.params.auth.token` または
  `connect.params.auth.password` を使います。
- Tailscale Serve
  （`gateway.auth.allowTailscale: true`）や非loopbackの
  `gateway.auth.mode: "trusted-proxy"` のようなアイデンティティを伴うモードでは、
  `connect.params.auth.*` ではなくリクエストヘッダーから
  connect認証チェックを満たします。
- private-ingressの `gateway.auth.mode: "none"` は共有シークレットconnect authを
  完全にスキップします。このモードを公開/信頼できないingressに公開してはいけません。
- ペアリング後、Gatewayは接続の
  role + scopes にスコープされた **device token** を発行します。これは `hello-ok.auth.deviceToken` に返され、
  将来のconnectのためにクライアントが永続化すべきです。
- クライアントは、connect成功後に常に主要な `hello-ok.auth.deviceToken` を永続化する必要があります。
- その**保存済み**device tokenで再接続するときは、そのtokenに対して以前承認された
  scope setも再利用する必要があります。これにより、すでに付与済みのread/probe/statusアクセスが保持され、
  再接続時により狭い暗黙のadmin-only scopeへ静かに縮退するのを防げます。
- クライアント側のconnect auth組み立て（`src/gateway/client.ts` の
  `selectConnectAuth`）:
  - `auth.password` は独立しており、設定されていれば常に転送されます。
  - `auth.token` は優先順位で埋められます: 明示的な共有tokenが最優先、次に明示的な `deviceToken`、その次に
    保存済みのデバイスごとのtoken（`deviceId` + `role` でキー付け）。
  - `auth.bootstrapToken` は、上記のいずれでも `auth.token` が解決されなかった場合にのみ送信されます。
    共有tokenまたは解決済みdevice tokenがあると抑制されます。
  - 保存済みdevice tokenのワンショット
    `AUTH_TOKEN_MISMATCH` 再試行でのauto-promotionは、**信頼済みエンドポイントのみ** に制限されます —
    loopback、またはピン留めされた `tlsFingerprint` を持つ `wss://` です。ピン留めなしの公開 `wss://`
    は該当しません。
- 追加の `hello-ok.auth.deviceTokens` エントリはbootstrap handoff tokenです。
  それらは、connectがbootstrap authを
  `wss://` やloopback/local pairingのような信頼済みtransport上で使った場合にのみ永続化してください。
- クライアントが**明示的な** `deviceToken` または明示的な `scopes` を指定した場合、
  その呼び出し元要求のscope setが引き続き権威を持ちます。キャッシュ済みscopeが再利用されるのは、
  クライアントが保存済みのデバイスごとのtokenを再利用している場合だけです。
- device tokenは `device.token.rotate` と
  `device.token.revoke`（`operator.pairing` scopeが必要）でローテーション/失効できます。
- tokenの発行/ローテーションは、そのデバイスのpairing entryに記録された承認済みrole setの範囲内に制限されます。
  tokenをローテーションしても、pairing承認で一度も許可されていないroleへデバイスを拡張することはできません。
- paired-device token sessionでは、呼び出し元が `operator.admin` も持っていない限り、
  device管理はself-scopeです。non-admin呼び出し元は自分自身のdevice entryだけを remove/revoke/rotate できます。
- `device.token.rotate` は、要求されたoperator scope setも
  呼び出し元の現在session scopeに対して検査します。non-admin呼び出し元は、
  すでに保持しているより広いoperator scope setへtokenをローテーションできません。
- 認証失敗には `error.details.code` と回復ヒントが含まれます:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH` に対するクライアント挙動:
  - 信頼済みクライアントは、キャッシュ済みデバイスごとのtokenで1回だけ制限付き再試行を行えます。
  - その再試行が失敗した場合、クライアントは自動reconnect loopを停止し、operator actionガイダンスを表示すべきです。

## デバイスアイデンティティ + ペアリング

- Nodeは、keypair fingerprintから導出された安定したdevice identity（`device.id`）を含める必要があります。
- Gatewayはdevice + roleごとにtokenを発行します。
- local auto-approvalが有効でない限り、新しいdevice IDにはペアリング承認が必要です。
- pairing auto-approvalは、直接のローカルloopback connectを中心にしています。
- OpenClawには、信頼済み共有シークレットhelper flow向けの、狭いbackend/container-local self-connectパスもあります。
- 同一ホストのtailnetやLAN connectも、ペアリング上は引き続きリモートとして扱われ、
  承認が必要です。
- すべてのWSクライアントは、`connect` 中に `device` identityを含めなければなりません（operator + node）。
  Control UIがこれを省略できるのは次のモードだけです:
  - localhost専用の安全でないHTTP互換のための `gateway.controlUi.allowInsecureAuth=true`。
  - `gateway.auth.mode: "trusted-proxy"` によるoperator Control UI認証成功時。
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`（緊急回避用、重大なセキュリティ低下）。
- すべての接続は、サーバー提供の `connect.challenge` nonceに署名しなければなりません。

### デバイス認証移行診断

接続前challenge署名方式をまだ使っているレガシークライアント向けに、`connect` は現在
`error.details.code` 配下に `DEVICE_AUTH_*` 詳細コードを、安定した `error.details.reason` とともに返します。

よくある移行失敗:

| メッセージ                  | details.code                     | details.reason           | 意味                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空文字を送った）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/誤ったnonceで署名した。         |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名payloadがv2 payloadと一致しない。              |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名timestampが許容skew外にある。                  |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` がpublic key fingerprintと一致しない。 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key形式/正規化に失敗した。                  |

移行目標:

- 常に `connect.challenge` を待つ。
- サーバーnonceを含むv2 payloadに署名する。
- 同じnonceを `connect.params.device.nonce` に送る。
- 推奨の署名payloadは `v3` で、device/client/role/scopes/token/nonceフィールドに加えて
  `platform` と `deviceFamily` をバインドします。
- レガシー `v2` 署名も互換性のため引き続き受け入れられますが、paired-device
  metadata pinningが再接続時のcommand policyを引き続き制御します。

## TLS + ピン留め

- WS接続でTLSをサポートします。
- クライアントは任意でGateway証明書フィンガープリントをピン留めできます（`gateway.tls`
  設定、および `gateway.remote.tlsFingerprint` またはCLI `--tls-fingerprint` を参照）。

## スコープ

このプロトコルは **完全なGateway API**（status、channels、models、chat、
agent、sessions、nodes、approvalsなど）を公開します。正確なサーフェスは
`src/gateway/protocol/schema.ts` のTypeBox schemaで定義されています。

## 関連

- [Bridge protocol](/ja-JP/gateway/bridge-protocol)
- [Gateway runbook](/ja-JP/gateway)
