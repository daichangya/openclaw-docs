---
read_when:
    - CLIからGatewayを実行する場合（開発またはサーバー）
    - Gateway auth、bind mode、接続性をデバッグする場合
    - Bonjour経由でGatewayを検出する場合（ローカル + 広域DNS-SD）
summary: OpenClaw Gateway CLI（`openclaw gateway`）— Gatewayの実行、照会、検出
title: gateway
x-i18n:
    generated_at: "2026-04-05T12:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

GatewayはOpenClawのWebSocketサーバーです（channels、nodes、sessions、hooks）。

このページのサブコマンドは`openclaw gateway …`配下にあります。

関連ドキュメント:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Gatewayを実行する

ローカルGatewayプロセスを実行します:

```bash
openclaw gateway
```

フォアグラウンドalias:

```bash
openclaw gateway run
```

注:

- デフォルトでは、`~/.openclaw/openclaw.json`に`gateway.mode=local`が設定されていない限り、Gatewayは起動を拒否します。アドホック/開発実行には`--allow-unconfigured`を使ってください。
- `openclaw onboard --mode local`と`openclaw setup`は、`gateway.mode=local`を書き込むことが想定されています。ファイルが存在するのに`gateway.mode`が欠けている場合は、それを暗黙にlocal modeとみなすのではなく、壊れているか上書きされたconfigとして扱い、修復してください。
- ファイルが存在し、`gateway.mode`が欠けている場合、Gatewayはそれを疑わしいconfig破損として扱い、勝手に「localと推測」することを拒否します。
- authなしでloopbackを超えてbindすることはブロックされます（安全ガードレール）。
- `SIGUSR1`は、認可されている場合にプロセス内再起動をトリガーします（`commands.restart`はデフォルトで有効です。手動再起動をブロックするには`commands.restart: false`を設定してください。ただしgateway tool/config apply/updateは引き続き許可されます）。
- `SIGINT`/`SIGTERM`ハンドラーはgatewayプロセスを停止しますが、カスタムterminal stateは復元しません。CLIをTUIやraw-mode入力でラップしている場合は、終了前にterminalを復元してください。

### オプション

- `--port <port>`: WebSocketポート（デフォルトはconfig/envから取得。通常は`18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`: listener bind mode。
- `--auth <token|password>`: auth mode上書き。
- `--token <token>`: token上書き（プロセスに対して`OPENCLAW_GATEWAY_TOKEN`も設定）。
- `--password <password>`: password上書き。警告: インラインpasswordはローカルのプロセス一覧に露出する可能性があります。
- `--password-file <path>`: ファイルからgateway passwordを読み込みます。
- `--tailscale <off|serve|funnel>`: Tailscale経由でGatewayを公開します。
- `--tailscale-reset-on-exit`: 終了時にTailscale serve/funnel設定をリセットします。
- `--allow-unconfigured`: config内に`gateway.mode=local`がなくてもgateway起動を許可します。これはアドホック/開発bootstrap専用の起動ガード回避であり、configファイルの書き込みや修復は行いません。
- `--dev`: dev config + workspaceがなければ作成します（`BOOTSTRAP.md`はスキップ）。
- `--reset`: dev config + credentials + sessions + workspaceをリセットします（`--dev`が必要）。
- `--force`: 起動前に、選択したポート上の既存listenerをkillします。
- `--verbose`: 詳細ログ。
- `--cli-backend-logs`: consoleにはCLI backend logsのみ表示します（stdout/stderrも有効化）。
- `--claude-cli-logs`: `--cli-backend-logs`の非推奨alias。
- `--ws-log <auto|full|compact>`: websocketログスタイル（デフォルト`auto`）。
- `--compact`: `--ws-log compact`のalias。
- `--raw-stream`: 生のmodel streamイベントをjsonlに記録します。
- `--raw-stream-path <path>`: 生のstream jsonlパス。

## 実行中のGatewayを照会する

すべての照会コマンドはWebSocket RPCを使います。

出力モード:

- デフォルト: 人間が読みやすい形式（TTYでは色付き）。
- `--json`: 機械可読JSON（スタイル/スピナーなし）。
- `--no-color`（または`NO_COLOR=1`）: 人間向けレイアウトは維持したままANSIを無効化。

共通オプション（対応している場合）:

- `--url <url>`: Gateway WebSocket URL。
- `--token <token>`: Gateway token。
- `--password <password>`: Gateway password。
- `--timeout <ms>`: timeout/budget（コマンドごとに異なります）。
- `--expect-final`: 「final」レスポンスを待機します（agent呼び出し）。

注: `--url`を設定すると、CLIはconfigや環境のcredentialsへフォールバックしません。
`--token`または`--password`を明示的に渡してください。明示的credentialsが欠けている場合はエラーです。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

session logsからusage-costの要約を取得します。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

オプション:

- `--days <days>`: 含める日数（デフォルト`30`）。

### `gateway status`

`gateway status`は、Gateway service（launchd/systemd/schtasks）と任意のRPC probeを表示します。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

オプション:

- `--url <url>`: 明示的なprobe targetを追加します。設定済みremote + localhostも引き続きprobeされます。
- `--token <token>`: probe用token auth。
- `--password <password>`: probe用password auth。
- `--timeout <ms>`: probe timeout（デフォルト`10000`）。
- `--no-probe`: RPC probeをスキップします（serviceのみの表示）。
- `--deep`: systemレベルserviceもスキャンします。
- `--require-rpc`: RPC probeが失敗したら非ゼロで終了します。`--no-probe`とは併用できません。

注:

- `gateway status`は、ローカルCLI configが欠落または無効でも、診断のために引き続き利用可能です。
- `gateway status`は、可能な場合probe authのために設定済みauth SecretRefを解決します。
- 必須auth SecretRefがこのコマンドパスで未解決の場合、`gateway status --json`は、probe接続/authが失敗したときに`rpc.authWarning`を報告します。`--token`/`--password`を明示的に渡すか、先にsecret sourceを解決してください。
- probeが成功した場合、誤検知を避けるため未解決auth-ref警告は抑制されます。
- scriptやautomationで、listenerが存在するだけでは不十分でGateway RPC自体の健全性が必要な場合は、`--require-rpc`を使ってください。
- `--deep`は、追加のlaunchd/systemd/schtasksインストールをベストエフォートでスキャンします。複数のgateway風serviceが検出された場合、人間向け出力にはcleanupヒントが表示され、ほとんどのセットアップでは1台のマシンにつき1つのgatewayを実行するべきだと警告されます。
- 人間向け出力には、profileやstate-dirのずれの診断に役立つよう、解決されたファイルログパスとCLI対serviceのconfigパス/妥当性スナップショットが含まれます。
- Linux systemdインストールでは、service auth driftチェックはunit内の`Environment=`と`EnvironmentFile=`の両方の値を読み取ります（`%h`、引用付きパス、複数ファイル、任意の`-`ファイルを含む）。
- driftチェックは、マージされたruntime env（service command env優先、次にprocess envフォールバック）を使って`gateway.auth.token` SecretRefを解決します。
- token authが実効的に有効でない場合（明示的な`gateway.auth.mode`が`password`/`none`/`trusted-proxy`、またはmode未設定でpasswordが優先されうる上に勝てるtoken候補がない場合）、token-driftチェックはconfig token解決をスキップします。

### `gateway probe`

`gateway probe`は「すべてをデバッグする」コマンドです。常に次をprobeします。

- 設定済みのremote gateway（設定されている場合）、および
- localhost（loopback）**remoteが設定されていても**。

`--url`を渡した場合、その明示的targetは両方より先に追加されます。人間向け出力では
targetに次のラベルが付きます。

- `URL (explicit)`
- `Remote (configured)` または `Remote (configured, inactive)`
- `Local loopback`

複数のgatewayに到達できる場合は、すべて表示されます。分離されたprofile/port（たとえばrescue bot）を使う場合、複数gatewayはサポートされますが、ほとんどのインストールでは依然として単一gatewayを実行します。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解釈:

- `Reachable: yes`は、少なくとも1つのtargetがWebSocket接続を受け入れたことを意味します。
- `RPC: ok`は、詳細RPC呼び出し（`health`/`status`/`system-presence`/`config.get`）も成功したことを意味します。
- `RPC: limited - missing scope: operator.read`は、接続は成功したが詳細RPCがscope制限されていることを意味します。これは完全な失敗ではなく**degraded**な到達性として報告されます。
- 終了コードが非ゼロになるのは、probeしたtargetのどれにも到達できなかった場合だけです。

JSONの注記（`--json`）:

- トップレベル:
  - `ok`: 少なくとも1つのtargetに到達可能。
  - `degraded`: 少なくとも1つのtargetでscope制限された詳細RPCがあった。
  - `primaryTargetId`: アクティブな勝者として扱うべき最良のtarget。この順序です: 明示的URL、SSH tunnel、設定済みremote、次にlocal loopback。
  - `warnings[]`: `code`、`message`、および任意の`targetIds`を持つベストエフォートの警告レコード。
  - `network`: 現在のconfigとホストネットワークから導出されたlocal loopback/tailnet URLヒント。
  - `discovery.timeoutMs`と`discovery.count`: このprobeパスで使われた実際のdiscovery budget/result count。
- targetごと（`targets[].connect`）:
  - `ok`: 接続後の到達性 + degraded分類。
  - `rpcOk`: 完全な詳細RPC成功。
  - `scopeLimited`: 詳細RPCが`operator.read` scope不足で失敗。

よくある警告コード:

- `ssh_tunnel_failed`: SSH tunnelセットアップに失敗し、コマンドは直接probeへフォールバックしました。
- `multiple_gateways`: 複数のtargetに到達可能でした。これは、rescue botのように意図的に分離profileを動かしている場合を除き、通常ではありません。
- `auth_secretref_unresolved`: 設定済みauth SecretRefを失敗したtarget用に解決できませんでした。
- `probe_scope_limited`: WebSocket接続は成功しましたが、詳細RPCは`operator.read`不足により制限されました。

#### SSH経由のremote（Mac app同等）

macOS appの「Remote over SSH」modeは、ローカルポートフォワードを使うことで、loopbackのみにbindされている可能性があるremote gatewayを`ws://127.0.0.1:<port>`で到達可能にします。

CLI相当:

```bash
openclaw gateway probe --ssh user@gateway-host
```

オプション:

- `--ssh <target>`: `user@host`または`user@host:port`（portのデフォルトは`22`）。
- `--ssh-identity <path>`: identityファイル。
- `--ssh-auto`: 解決済み
  discovery endpoint（`local.`と、設定されている場合は構成済み広域domain）から、最初に発見されたgateway hostをSSH targetとして選択します。TXTのみの
  ヒントは無視されます。

Config（任意、デフォルトとして使用）:

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低レベルRPCヘルパー。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

オプション:

- `--params <json>`: params用JSON object文字列（デフォルト`{}`）
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

注:

- `--params`は有効なJSONでなければなりません。
- `--expect-final`は主に、中間イベントをstreamした後にfinal payloadを返すagent風RPC向けです。

## Gateway serviceを管理する

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

コマンドオプション:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

注:

- `gateway install`は`--port`、`--runtime`、`--token`、`--force`、`--json`をサポートしています。
- token authにtokenが必要で、`gateway.auth.token`がSecretRef管理されている場合、`gateway install`はそのSecretRefが解決可能であることを検証しますが、解決したtokenをservice環境メタデータに永続化しません。
- token authにtokenが必要で、設定済みtoken SecretRefが未解決の場合、installはフォールバックのプレーンテキストを永続化せず、fail closedします。
- `gateway run`でpassword authを使う場合は、インライン`--password`よりも`OPENCLAW_GATEWAY_PASSWORD`、`--password-file`、またはSecretRef対応の`gateway.auth.password`を推奨します。
- 推測auth modeでは、shellのみの`OPENCLAW_GATEWAY_PASSWORD`はinstall時のtoken要件を緩和しません。管理serviceをインストールする場合は、永続的なconfig（`gateway.auth.password`またはconfig `env`）を使ってください。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定され、`gateway.auth.mode`が未設定の場合、modeを明示的に設定するまでinstallはブロックされます。
- ライフサイクルコマンドはスクリプト用途に`--json`を受け付けます。

## Gatewayを検出する（Bonjour）

`gateway discover`はGateway beacon（`_openclaw-gw._tcp`）をスキャンします。

- マルチキャストDNS-SD: `local.`
- ユニキャストDNS-SD（広域Bonjour）: domain（例: `openclaw.internal.`）を選び、split DNS + DNS serverを設定します。詳細は[/gateway/bonjour](/gateway/bonjour)を参照してください

Bonjour discoveryが有効なGatewayのみ（デフォルトで有効）がbeaconを広告します。

広域discoveryレコードには次のTXTが含まれます:

- `role`（gateway roleヒント）
- `transport`（transportヒント、例: `gateway`）
- `gatewayPort`（WebSocketポート。通常`18789`）
- `sshPort`（任意。これがない場合、clientsはSSH targetのデフォルトを`22`にします）
- `tailnetDns`（利用可能な場合のMagicDNS hostname）
- `gatewayTls` / `gatewayTlsSha256`（TLS有効化 + 証明書フィンガープリント）
- `cliPath`（広域zoneに書き込まれるremote-installヒント）

### `gateway discover`

```bash
openclaw gateway discover
```

オプション:

- `--timeout <ms>`: コマンドごとのtimeout（browse/resolve）。デフォルト`2000`。
- `--json`: 機械可読出力（スタイル/スピナーも無効化）。

例:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

注:

- CLIは、広域domainが有効な場合、`local.`と設定済み広域domainをスキャンします。
- JSON出力の`wsUrl`は、TXTのみの
  ヒント（`lanHost`や`tailnetDns`など）ではなく、解決されたservice endpointから導出されます。
- `local.` mDNSでは、`sshPort`と`cliPath`は
  `discovery.mdns.mode`が`full`の場合のみブロードキャストされます。広域DNS-SDでは引き続き`cliPath`が書き込まれ、`sshPort`
  も同様に任意です。
