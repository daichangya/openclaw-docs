---
read_when:
    - Gatewayプロセスの実行またはデバッグ
summary: Gatewayサービス、ライフサイクル、および運用のランブック
title: Gatewayランブック
x-i18n:
    generated_at: "2026-04-25T13:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Gatewayサービスのday-1起動とday-2運用にはこのページを使ってください。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状優先の診断。正確なコマンド手順とログシグネチャ付き。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイド + 完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef契約、ランタイムスナップショットの挙動、移行/再読み込み操作。
  </Card>
  <Card title="シークレットプラン契約" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` のtarget/pathルールとref-only auth-profileの挙動。
  </Card>
</CardGroup>

## 5分でできるローカル起動

<Steps>
  <Step title="Gatewayを起動する">

```bash
openclaw gateway --port 18789
# debug/trace をstdioにも出力
openclaw gateway --port 18789 --verbose
# 選択したポートのlistenerを強制終了してから起動
openclaw gateway --force
```

  </Step>

  <Step title="サービスのヘルスを確認する">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースライン: `Runtime: running`、`Connectivity probe: ok`、および想定どおりの `Capability: ...`。到達性だけでなくread-scope RPCの証拠が必要な場合は `openclaw gateway status --require-rpc` を使ってください。

  </Step>

  <Step title="チャネルの準備状況を検証する">

```bash
openclaw channels status --probe
```

Gatewayに到達できる場合、これはアカウントごとのライブチャネルプローブと任意の監査を実行します。
Gatewayに到達できない場合、CLIはライブプローブ出力の代わりに
設定のみのチャネル要約へフォールバックします。

  </Step>
</Steps>

<Note>
Gateway設定の再読み込みは、アクティブな設定ファイルパスを監視します（profile/stateのデフォルト、または設定されている場合は `OPENCLAW_CONFIG_PATH` から解決されます）。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の読み込みに成功した後は、実行中プロセスがアクティブなインメモリ設定スナップショットを提供し、再読み込みに成功するとそのスナップショットがアトミックに入れ替わります。
</Note>

## ランタイムモデル

- ルーティング、control plane、チャネル接続のための常時稼働プロセス1つ。
- 次を1つの多重化ポートで提供:
  - WebSocket control/RPC
  - HTTP API、OpenAI互換（`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`）
  - Control UIとhooks
- デフォルトのbindモード: `loopback`。
- デフォルトで認証が必要です。共有シークレット構成では
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非loopbackの
  reverse-proxy構成では `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI互換エンドポイント

OpenClawで現在もっとも活用度の高い互換サーフェスは次のとおりです:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- 多くのOpen WebUI、LobeChat、LibreChat連携は、まず `/v1/models` を確認します。
- 多くのRAGおよびメモリパイプラインは `/v1/embeddings` を前提とします。
- エージェントネイティブなクライアントは、ますます `/v1/responses` を好むようになっています。

計画メモ:

- `/v1/models` はagent-firstです。`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みのデフォルトエージェントにマッピングされる安定したエイリアスです。
- バックエンドのprovider/modelを上書きしたい場合は `x-openclaw-model` を使ってください。そうでなければ、選択されたエージェントの通常のmodelおよびembedding設定がそのまま使われます。

これらはすべてメインのGatewayポートで動作し、Gateway HTTP APIの他部分と同じtrusted operator認証境界を使います。

### ポートとbindの優先順位

| 設定         | 解決順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/override → `gateway.bind` → `loopback`                    |

### ホットリロードモード

| `gateway.reload.mode` | 挙動                                       |
| --------------------- | ------------------------------------------ |
| `off`                 | 設定再読み込みなし                         |
| `hot`                 | ホットセーフな変更のみ適用                 |
| `restart`             | 再読み込みが必要な変更では再起動           |
| `hybrid` (default)    | 安全ならホット適用し、必要なら再起動       |

## オペレーター用コマンドセット

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

`gateway status --deep` は追加のサービス検出用です（LaunchDaemons/systemd system
units/schtasks）。より深いRPCヘルスプローブではありません。

## 複数Gateway（同一ホスト）

ほとんどのインストールでは、1台のマシンに1つのGatewayを実行すべきです。1つのGatewayで複数の
エージェントとチャネルをホストできます。

複数Gatewayが必要なのは、意図的に分離したい場合やレスキューボットが必要な場合だけです。

便利な確認コマンド:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は `Other gateway-like services detected (best effort)` を報告し、
  古いlaunchd/systemd/schtasksインストールがまだ残っている場合にクリーンアップのヒントを表示することがあります。
- `gateway probe` は、複数のターゲットが応答すると `multiple reachable gateways` を警告することがあります。
- それが意図した構成なら、Gatewayごとにポート、config/state、workspace rootを分離してください。

インスタンスごとのチェックリスト:

- 一意の `gateway.port`
- 一意の `OPENCLAW_CONFIG_PATH`
- 一意の `OPENCLAW_STATE_DIR`
- 一意の `agents.defaults.workspace`

例:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

詳細なセットアップ: [/gateway/multiple-gateways](/ja-JP/gateway/multiple-gateways)。

## VoiceClawリアルタイムbrainエンドポイント

OpenClawは、VoiceClaw互換のリアルタイムWebSocketエンドポイントを
`/voiceclaw/realtime` で公開します。VoiceClawデスクトップクライアントが、
別のrelayプロセスを経由せずに、リアルタイムのOpenClaw brainと直接通信する必要がある場合に使ってください。

このエンドポイントは、リアルタイム音声にGemini Liveを使い、
OpenClawツールをGemini Liveへ直接公開することでOpenClawをbrainとして呼び出します。
ツール呼び出しは、音声ターンの応答性を保つために即座に `working` 結果を返し、その後OpenClawが
実際のツールを非同期で実行し、結果をlive sessionへ注入します。
Gatewayプロセス環境に `GEMINI_API_KEY` を設定してください。
Gateway認証が有効な場合、デスクトップクライアントは最初の `session.config` メッセージで
Gateway tokenまたはpasswordを送信します。

リアルタイムbrainアクセスは、owner認可されたOpenClaw agentコマンドを実行します。
`gateway.auth.mode: "none"` はloopback専用のテストインスタンスに限定してください。
ローカル以外からのリアルタイムbrain接続にはGateway認証が必要です。

分離されたテストGatewayを使うには、独自のポート、config、stateを持つ別インスタンスを実行します:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

その後、VoiceClawを次のように設定します:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## リモートアクセス

推奨: Tailscale/VPN。
代替: SSHトンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、クライアントはローカルで `ws://127.0.0.1:18789` に接続します。

<Warning>
SSHトンネルはGateway認証を回避しません。共有シークレット認証では、クライアントは
トンネル経由でも `token`/`password` を送信する必要があります。アイデンティティを伴うモードでは、
リクエストは引き続きその認証パスを満たさなければなりません。
</Warning>

参照: [Remote Gateway](/ja-JP/gateway/remote), [Authentication](/ja-JP/gateway/authentication), [Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番相当の信頼性には、監視付き実行を使ってください。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgentラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付きprofile）です。`openclaw doctor` はサービス設定のドリフトを監査し、修復します。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も永続化するには、lingeringを有効にします:

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

ネイティブWindowsの管理付き起動は、`OpenClaw Gateway`
（または名前付きprofileでは `OpenClaw Gateway (<profile>)`）という名前のScheduled Taskを使います。
Scheduled Taskの作成が拒否された場合、OpenClawはstate directory内の `gateway.cmd` を指す
ユーザーごとのStartup-folderランチャーへフォールバックします。

  </Tab>

  <Tab title="Linux (system service)">

複数ユーザー/常時稼働ホストにはsystem unitを使ってください。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unitと同じservice本体を使いますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整してください。

  </Tab>
</Tabs>

## dev profileクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離されたstate/configとベースGatewayポート `19001` が含まれます。

## プロトコルクイックリファレンス（オペレータービュー）

- 最初のクライアントフレームは `connect` でなければなりません。
- Gatewayは `hello-ok` スナップショット（`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべてのhelper routeの自動生成ダンプではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、pairing/approvalのライフサイクルイベント、`shutdown` が含まれます。

エージェント実行は2段階です:

1. 即時のaccepted ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間に `agent` イベントがストリーミングされます。

完全なプロトコル文書: [Gateway Protocol](/ja-JP/gateway/protocol)。

## 運用チェック

### Liveness

- WSを開いて `connect` を送信します。
- スナップショット付きの `hello-ok` 応答を期待します。

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップ回復

イベントは再送されません。シーケンスギャップがある場合は、続行前に状態（`health`, `system-presence`）を更新してください。

## よくある障害シグネチャ

| シグネチャ                                                     | 想定される問題                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効なGateway認証パスなしでの非loopback bind                                    |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 設定がremote modeになっている、または破損した設定からlocal-mode stampが欠落している |
| `unauthorized` during connect                                  | クライアントとGateway間の認証不一致                                             |

完全な診断手順については、[Gateway Troubleshooting](/ja-JP/gateway/troubleshooting) を使ってください。

## 安全性の保証

- Gatewayプロトコルクライアントは、Gatewayが利用不可のときに即座に失敗します（暗黙の直接チャネルフォールバックはありません）。
- 無効なfirst frameまたは `connect` 以外のfirst frameは拒否され、接続が閉じられます。
- 正常終了時は、ソケットが閉じる前に `shutdown` イベントが送出されます。

---

関連:

- [Troubleshooting](/ja-JP/gateway/troubleshooting)
- [Background Process](/ja-JP/gateway/background-process)
- [Configuration](/ja-JP/gateway/configuration)
- [Health](/ja-JP/gateway/health)
- [Doctor](/ja-JP/gateway/doctor)
- [Authentication](/ja-JP/gateway/authentication)

## 関連

- [Configuration](/ja-JP/gateway/configuration)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
- [Remote access](/ja-JP/gateway/remote)
- [Secrets management](/ja-JP/gateway/secrets)
