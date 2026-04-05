---
read_when:
    - gatewayプロセスを実行またはデバッグしている場合
summary: Gatewayサービス、ライフサイクル、および運用のためのランブック
title: Gatewayランブック
x-i18n:
    generated_at: "2026-04-05T12:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Gatewayランブック

このページは、Gatewayサービスの初日セットアップと日常運用に使用します。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/gateway/troubleshooting">
    症状優先の診断を、正確なコマンド手順とログシグネチャ付きで提供します。
  </Card>
  <Card title="設定" icon="sliders" href="/gateway/configuration">
    タスク指向のセットアップガイドと完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/gateway/secrets">
    SecretRef契約、ランタイムスナップショット動作、および移行/再読み込み操作。
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/gateway/secrets-plan-contract">
    正確な `secrets apply` のtarget/pathルールとref-only auth-profile動作。
  </Card>
</CardGroup>

## 5分でできるローカル起動

<Steps>
  <Step title="Gatewayを起動">

```bash
openclaw gateway --port 18789
# debug/trace は stdio にミラーされます
openclaw gateway --port 18789 --verbose
# 選択したポートのリスナーを強制終了してから起動
openclaw gateway --force
```

  </Step>

  <Step title="サービスのヘルスを確認">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースライン: `Runtime: running` および `RPC probe: ok`。

  </Step>

  <Step title="チャネルの準備状況を検証">

```bash
openclaw channels status --probe
```

Gatewayに到達できる場合、これはアカウントごとのライブチャネルプローブと、任意の監査を実行します。
Gatewayに到達できない場合、CLIはライブプローブ出力の代わりに、設定のみのチャネル要約にフォールバックします。

  </Step>
</Steps>

<Note>
Gatewayの設定再読み込みは、アクティブな設定ファイルパス（profile/stateのデフォルトから解決、または設定されている場合は `OPENCLAW_CONFIG_PATH`）を監視します。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の読み込みに成功した後、実行中プロセスはアクティブなインメモリ設定スナップショットを提供し、再読み込み成功時にはそのスナップショットをアトミックに入れ替えます。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャネル接続のための常時稼働プロセスが1つ。
- 次のための単一の多重化ポート:
  - WebSocket control/RPC
  - HTTP API、OpenAI互換（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - コントロールUIとhooks
- デフォルトのbindモード: `loopback`。
- 認証はデフォルトで必須です。共有シークレット構成では
  `gateway.auth.token` / `gateway.auth.password` （または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非loopbackの
  reverse-proxy構成では `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI互換エンドポイント

OpenClawの現在最も重要な互換インターフェースは次のとおりです:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどのOpen WebUI、LobeChat、LibreChat連携は、最初に `/v1/models` を確認します。
- 多くのRAGおよびメモリパイプラインは `/v1/embeddings` を前提としています。
- エージェントネイティブなクライアントは、ますます `/v1/responses` を好むようになっています。

計画上の注意:

- `/v1/models` はagent-firstです: `openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みのデフォルトエージェントにマップされる安定したエイリアスです。
- バックエンドのprovider/modelを上書きしたい場合は `x-openclaw-model` を使ってください。それ以外では、選択したエージェントの通常のモデルおよびembedding設定が引き続き制御します。

これらはすべてメインのGatewayポートで実行され、Gateway HTTP APIのほかの部分と同じ信頼済みオペレーター認証境界を使用します。

### ポートとbindの優先順位

| 設定         | 解決順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/override → `gateway.bind` → `loopback`                    |

### ホットリロードモード

| `gateway.reload.mode` | 動作                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定再読み込みなし                         |
| `hot`                 | ホットセーフな変更のみ適用                 |
| `restart`             | 再読み込み必須の変更時に再起動             |
| `hybrid` (default)    | 安全な場合はホット適用し、必要時は再起動   |

## オペレーターコマンドセット

```bash
openclaw gateway status
openclaw gateway status --deep   # システムレベルのサービススキャンを追加
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` は追加のサービス検出（LaunchDaemons/systemd system
units/schtasks）用であり、より深いRPCヘルスプローブではありません。

## 複数のGateway（同一ホスト）

ほとんどのインストールでは、マシンごとに1つのgatewayを実行するべきです。単一のgatewayで複数の
agentとchannelをホストできます。

複数のgatewayが必要なのは、意図的に分離やレスキューボットを導入したい場合だけです。

便利な確認:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される動作:

- `gateway status --deep` は `Other gateway-like services detected (best effort)`
  を報告し、古いlaunchd/systemd/schtasksインストールが残っている場合にクリーンアップのヒントを表示することがあります。
- `gateway probe` は、複数のターゲットが応答した場合に `multiple reachable gateways` を警告することがあります。
- それが意図的な場合は、gatewayごとにポート、config/state、workspace rootを分離してください。

詳細なセットアップ: [/gateway/multiple-gateways](/gateway/multiple-gateways)。

## リモートアクセス

推奨: Tailscale/VPN。
代替: SSHトンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、クライアントをローカルの `ws://127.0.0.1:18789` に接続します。

<Warning>
SSHトンネルはgateway認証を回避しません。共有シークレット認証では、クライアントはトンネル経由でも引き続き
`token`/`password` を送信する必要があります。IDベースのモードでは、
リクエストは引き続きその認証経路を満たす必要があります。
</Warning>

参照: [Remote Gateway](/gateway/remote)、[Authentication](/gateway/authentication)、[Tailscale](/gateway/tailscale)。

## 監視とサービスライフサイクル

本番相当の信頼性には、監視付き実行を使用してください。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgentラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きprofile）です。`openclaw doctor` はサービス設定のdriftを監査し、修復します。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も維持するには、lingeringを有効にします:

```bash
sudo loginctl enable-linger <user>
```

カスタムインストールパスが必要な場合の手動user-unit例:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

ネイティブWindowsの管理された起動では、`OpenClaw Gateway`
（または名前付きprofileでは `OpenClaw Gateway (<profile>)`）という名前のScheduled Taskを使用します。Scheduled Task
の作成が拒否された場合、OpenClawはstate directory内の `gateway.cmd` を指すユーザー単位のStartup-folder launcherにフォールバックします。

  </Tab>

  <Tab title="Linux (system service)">

マルチユーザー/常時稼働ホストではsystem unitを使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

service本文はuser unitと同じものを使いますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 配下にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整してください。

  </Tab>
</Tabs>

## 1台のホスト上の複数Gateway

ほとんどの構成では **1つ** のGatewayを実行するべきです。
複数使用するのは、厳密な分離/冗長化（たとえばレスキュープロファイル）の場合だけにしてください。

インスタンスごとのチェックリスト:

- 一意な `gateway.port`
- 一意な `OPENCLAW_CONFIG_PATH`
- 一意な `OPENCLAW_STATE_DIR`
- 一意な `agents.defaults.workspace`

例:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

参照: [Multiple gateways](/gateway/multiple-gateways)。

### dev profileのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離されたstate/configと、ベースとなるgateway port `19001` が含まれます。

## プロトコルのクイックリファレンス（オペレーター視点）

- 最初のクライアントフレームは必ず `connect` でなければなりません。
- Gatewayは `hello-ok` スナップショット（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべてのヘルパールートを生成してダンプしたものではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、pairing/approvalライフサイクルイベント、および `shutdown` が含まれます。

agent実行は2段階です:

1. 即時のaccepted ack（`status:"accepted"`）
2. 最終完了応答（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコルドキュメント: [Gateway Protocol](/gateway/protocol)。

## 運用チェック

### Liveness

- WSを開いて `connect` を送信します。
- `hello-ok` 応答とスナップショットを期待します。

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップ回復

イベントは再配信されません。シーケンスギャップがある場合は、続行前に状態（`health`、`system-presence`）を更新してください。

## よくある障害シグネチャ

| シグネチャ                                                   | 可能性の高い問題                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                  | 有効なgateway認証経路のない非loopback bind                                      |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                   |
| `Gateway start blocked: set gateway.mode=local`              | 設定がremote modeになっている、または損傷した設定からlocal-modeスタンプが失われている |
| `unauthorized` during connect                                | クライアントとgatewayの間の認証不一致                                           |

完全な診断手順については、[Gateway Troubleshooting](/gateway/troubleshooting) を使用してください。

## 安全性の保証

- Gatewayプロトコルクライアントは、Gatewayが利用できない場合に即座に失敗します（暗黙のdirect-channelフォールバックはありません）。
- 無効な最初のフレームや、最初の `connect` 以外のフレームは拒否され、接続が閉じられます。
- 正常終了では、ソケットを閉じる前に `shutdown` イベントを送出します。

---

関連:

- [Troubleshooting](/gateway/troubleshooting)
- [Background Process](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentication](/gateway/authentication)
