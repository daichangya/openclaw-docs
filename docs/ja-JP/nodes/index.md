---
read_when:
    - iOS / Android ノードを gateway に pairing する
    - エージェントコンテキストのために node の canvas / camera を使う
    - 新しい node コマンドや CLI ヘルパーを追加する
summary: 'Nodes: pairing、capability、permission、および canvas / camera / screen / device / notifications / system 向けの CLI ヘルパー'
title: Nodes
x-i18n:
    generated_at: "2026-04-05T12:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Nodes

**node** は、Gateway **WebSocket**（オペレーターと同じポート）に `role: "node"` で接続し、`node.invoke` を通じてコマンドサーフェス（たとえば `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）を公開するコンパニオンデバイス（macOS / iOS / Android / ヘッドレス）です。プロトコルの詳細: [Gateway protocol](/gateway/protocol)。

レガシー転送: [Bridge protocol](/gateway/bridge-protocol)（TCP JSONL;
現在のノードに対しては履歴的なものにすぎません）。

macOS は **node mode** でも動作できます。メニューバー app が Gateway の WS サーバーに接続し、そのローカル canvas / camera コマンドを node として公開します（そのため `openclaw nodes …` がこの Mac に対して動作します）。

注意:

- Nodes は **周辺機器**であり、gateway ではありません。gateway service は実行しません。
- Telegram / WhatsApp などのメッセージは **gateway** に届き、nodes には届きません。
- トラブルシューティング runbook: [/nodes/troubleshooting](/nodes/troubleshooting)

## Pairing + status

**WS node は device pairing を使います。** Nodes は `connect` 時にデバイス ID を提示し、Gateway
は `role: node` の device pairing request を作成します。devices CLI（または UI）で承認してください。

クイック CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

node が変更された auth 詳細（role / scopes / public key）で再試行した場合、以前の
保留中 request は置き換えられ、新しい `requestId` が作成されます。承認前に
`openclaw devices list` を再実行してください。

注意:

- `nodes status` は、device pairing role に `node` が含まれていると、その node を **paired** としてマークします。
- device pairing record は、永続的な承認済み role 契約です。token
  rotation はその契約内にとどまります。pairing 承認が付与していない
  別の role へ paired node を昇格させることはできません。
- `node.pair.*`（CLI: `openclaw nodes pending/approve/reject/rename`）は、別の gateway 所有の
  node pairing store です。WS `connect` handshake をゲートしません。
- 承認スコープは、保留中 request の宣言されたコマンドに従います:
  - コマンドなし request: `operator.pairing`
  - `exec` 以外の node コマンド: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Remote node host（system.run）

Gateway が 1 台のマシンで動作し、コマンドを
別のマシンで実行したい場合は、**node host** を使用します。モデルは引き続き **gateway** と対話し、
`host=node` が選ばれると gateway は `exec` 呼び出しを **node host** に転送します。

### 何がどこで動くか

- **Gateway host**: メッセージを受信し、モデルを実行し、tool call をルーティングする。
- **Node host**: node マシン上で `system.run` / `system.which` を実行する。
- **Approvals**: node host 上の `~/.openclaw/exec-approvals.json` によって強制される。

Approval に関する注意:

- Approval に支えられた node 実行は、正確な request context を束縛します。
- 直接の shell / runtime ファイル実行については、OpenClaw は 1 つの具体的なローカル
  ファイルオペランドもベストエフォートで束縛し、そのファイルが実行前に変化した場合は実行を拒否します。
- インタープリター / runtime コマンドに対して、OpenClaw が正確に 1 つの具体的なローカルファイルを特定できない場合、
  Approval に支えられた実行は、完全な runtime カバレッジを装うのではなく拒否されます。より広いインタープリター意味論には、
  sandboxing、別ホスト、または明示的な trusted allowlist / full workflow を使用してください。

### Node host を起動する（フォアグラウンド）

node マシン上で:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH トンネル経由の remote gateway（loopback bind）

Gateway が loopback（`gateway.bind=loopback`、local mode のデフォルト）に bind している場合、
remote node host は直接接続できません。SSH トンネルを作成し、
node host をそのトンネルのローカル側に向けてください。

例（node host -> gateway host）:

```bash
# Terminal A（実行し続ける）: ローカル 18790 -> gateway 127.0.0.1:18789 を転送
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: gateway token を export し、トンネル経由で接続
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意:

- `openclaw node run` は token または password auth をサポートします。
- 推奨は env 変数です: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- Config fallback は `gateway.auth.token` / `gateway.auth.password` です。
- local mode では、node host は意図的に `gateway.remote.token` / `gateway.remote.password` を無視します。
- remote mode では、`gateway.remote.token` / `gateway.remote.password` は remote precedence rule に従って使用候補になります。
- アクティブな local `gateway.auth.*` SecretRef が設定されていて未解決の場合、node-host auth はフェイルクローズします。
- Node-host auth 解決は `OPENCLAW_GATEWAY_*` env 変数のみを考慮します。

### Node host を起動する（service）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pair + 名前付け

gateway host 上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node が変更された auth 詳細で再試行した場合は、`openclaw devices list`
を再実行し、現在の `requestId` を承認してください。

名前付けの選択肢:

- `openclaw node run` / `openclaw node install` の `--display-name`（node 上の `~/.openclaw/node.json` に永続化されます）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 側の上書き）。

### コマンドを allowlist に追加する

Exec approvals は **node host ごと**です。gateway から allowlist エントリーを追加します。

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Approvals は node host 上の `~/.openclaw/exec-approvals.json` に保存されます。

### exec を node に向ける

デフォルトを設定する（gateway config）:

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

またはセッションごと:

```
/exec host=node security=allowlist node=<id-or-name>
```

設定後は、`host=node` の付いた任意の `exec` call は node host 上で実行されます（
node allowlist / approvals の対象です）。

`host=auto` は暗黙に node を選びませんが、call ごとの明示的な `host=node` request は `auto` から許可されます。セッションで node exec をデフォルトにしたい場合は、`tools.exec.host=node` または `/exec host=node ...` を明示的に設定してください。

関連:

- [Node host CLI](/cli/node)
- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)

## コマンド呼び出し

低レベル（生の RPC）:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

一般的な「エージェントに MEDIA 添付ファイルを与える」ワークフロー向けに、より高レベルなヘルパーもあります。

## スクリーンショット（canvas スナップショット）

node が Canvas（WebView）を表示している場合、`canvas.snapshot` は `{ format, base64 }` を返します。

CLI ヘルパー（一時ファイルに書き込み、`MEDIA:<path>` を出力）:

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas コントロール

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意:

- `canvas present` は URL またはローカルファイルパス（`--target`）を受け付け、位置指定のための任意の `--x/--y/--width/--height` も使えます。
- `canvas eval` は、インライン JS（`--js`）または位置引数を受け付けます。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意:

- A2UI v0.8 JSONL のみサポートされます（v0.9 / createSurface は拒否されます）。

## 写真 + 動画（node camera）

写真（`jpg`）:

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # デフォルト: 両方の向き（2 つの MEDIA 行）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

動画クリップ（`mp4`）:

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意:

- `canvas.*` と `camera.*` では node は **foreground** である必要があります（background call は `NODE_BACKGROUND_UNAVAILABLE` を返します）。
- oversized な base64 payload を避けるため、clip duration には制限があります（現在は `<= 60s`）。
- Android は可能な場合 `CAMERA` / `RECORD_AUDIO` permission を要求します。拒否された permission は `*_PERMISSION_REQUIRED` で失敗します。

## 画面録画（nodes）

サポートされる node は `screen.record`（mp4）を公開します。例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意:

- `screen.record` の可用性は node platform に依存します。
- 画面録画は `<= 60s` に制限されます。
- `--no-audio` は、サポートされる platform でマイク収録を無効にします。
- 複数画面がある場合は `--screen <index>` を使って表示を選択してください。

## 位置情報（nodes）

ノードは、設定で Location が有効になっている場合に `location.get` を公開します。

CLI ヘルパー:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意:

- Location は **デフォルトでオフ** です。
- 「Always」には system permission が必要で、background fetch はベストエフォートです。
- 応答には lat / lon、accuracy（メートル）、timestamp が含まれます。

## SMS（Android nodes）

Android nodes は、ユーザーが **SMS** permission を付与し、デバイスが telephony をサポートしている場合に `sms.send` を公開できます。

低レベル invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意:

- capability が広告される前に、Android デバイス上で permission prompt を受け入れる必要があります。
- telephony のない Wi-Fi 専用デバイスは `sms.send` を広告しません。

## Android device + 個人データコマンド

Android nodes は、対応する capability が有効な場合に追加のコマンドファミリーを広告できます。

利用可能なファミリー:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

invoke の例:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注意:

- Motion コマンドは、利用可能なセンサーによって capability-gated されます。

## System コマンド（node host / mac node）

macOS node は `system.run`、`system.notify`、`system.execApprovals.get/set` を公開します。
headless node host は `system.run`、`system.which`、`system.execApprovals.get/set` を公開します。

例:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意:

- `system.run` は payload 内で stdout / stderr / exit code を返します。
- Shell 実行は現在、`host=node` の `exec` tool を通ります。`nodes` は、明示的な node コマンドのための直接 RPC サーフェスのままです。
- `nodes invoke` は `system.run` または `system.run.prepare` を公開しません。これらは exec path のみに残されています。
- exec path は、approval の前に canonical な `systemRunPlan` を準備します。いったん
  approval が付与されると、gateway は後で呼び出し元が編集した command / cwd / session field ではなく、その保存済み plan を転送します。
- `system.notify` は macOS app の notification permission 状態に従います。
- 認識されない node `platform` / `deviceFamily` metadata では、`system.run` と `system.which` を除外した保守的なデフォルト allowlist が使われます。未知の platform で意図的にそれらのコマンドが必要な場合は、`gateway.nodes.allowCommands` で明示的に追加してください。
- `system.run` は `--cwd`、`--env KEY=VAL`、`--command-timeout`、`--needs-screen-recording` をサポートします。
- Shell wrapper（`bash|sh|zsh ... -c/-lc`）では、request スコープの `--env` 値は明示的な allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）に縮小されます。
- allowlist mode での常時許可決定では、既知の dispatch wrapper（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）は wrapper パスではなく内部 executable パスを永続化します。安全に unwrap できない場合、allowlist エントリーは自動では永続化されません。
- allowlist mode の Windows node host では、`cmd.exe /c` 経由の shell-wrapper 実行には approval が必要です（allowlist エントリーだけでは wrapper 形式は自動許可されません）。
- `system.notify` は `--priority <passive|active|timeSensitive>` と `--delivery <system|overlay|auto>` をサポートします。
- Node hosts は `PATH` 上書きを無視し、危険な startup / shell キー（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）を除去します。追加の PATH エントリーが必要な場合は、`--env` で `PATH` を渡すのではなく、node host service 環境を設定するか、標準の場所に tool をインストールしてください。
- macOS node mode では、`system.run` は macOS app 内の exec approvals によって制御されます（Settings → Exec approvals）。
  ask / allowlist / full は headless node host と同じように動作し、拒否された prompt は `SYSTEM_RUN_DENIED` を返します。
- headless node host では、`system.run` は exec approvals（`~/.openclaw/exec-approvals.json`）によって制御されます。

## Exec node binding

複数の node が利用可能な場合、exec を特定の node に bind できます。
これにより、`exec host=node` のデフォルト node が設定されます（agent ごとに上書き可能です）。

グローバルデフォルト:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

エージェントごとの上書き:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

任意の node を許可するには unset します:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Permissions map

Nodes は、`node.list` / `node.describe` に `permissions` map を含めることがあります。permission 名（たとえば `screenRecording`、`accessibility`）をキーとし、boolean 値（`true` = 付与済み）を持ちます。

## Headless node host（クロスプラットフォーム）

OpenClaw は、Gateway
WebSocket に接続して `system.run` / `system.which` を公開する **headless node host**（UI なし）を実行できます。これは Linux / Windows 上や、サーバーと並行して最小構成の node を動かしたい場合に有用です。

起動方法:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意:

- Pairing は引き続き必要です（Gateway が device pairing prompt を表示します）。
- node host は、node id、token、display name、gateway 接続情報を `~/.openclaw/node.json` に保存します。
- Exec approvals は `~/.openclaw/exec-approvals.json`
  を通じてローカルで強制されます（[Exec approvals](/tools/exec-approvals) を参照）。
- macOS では、headless node host はデフォルトで `system.run` をローカル実行します。`system.run` を companion app exec host 経由にルーティングするには
  `OPENCLAW_NODE_EXEC_HOST=app` を設定してください。app host を必須にし、利用不能ならフェイルクローズするには
  `OPENCLAW_NODE_EXEC_FALLBACK=0` も追加してください。
- Gateway WS が TLS を使う場合は `--tls` / `--tls-fingerprint` を追加してください。

## Mac node mode

- macOS メニューバー app は node として Gateway WS サーバーに接続します（そのため `openclaw nodes …` がこの Mac に対して動作します）。
- remote mode では、app は Gateway port 用の SSH トンネルを開き、`localhost` に接続します。
