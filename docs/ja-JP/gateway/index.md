---
read_when:
    - Gateway プロセスを実行またはデバッグすること
summary: Gateway サービス、ライフサイクル、運用の Runbook
title: Gateway Runbook
x-i18n:
    generated_at: "2026-04-26T11:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

このページは、Gateway サービスの day-1 起動と day-2 運用に使用してください。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/ja-JP/gateway/troubleshooting">
    症状優先の診断と、正確なコマンド手順およびログシグネチャ。
  </Card>
  <Card title="設定" icon="sliders" href="/ja-JP/gateway/configuration">
    タスク指向のセットアップガイド + 完全な設定リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/ja-JP/gateway/secrets">
    SecretRef の契約、ランタイムスナップショット動作、および migrate/reload 操作。
  </Card>
  <Card title="シークレット計画契約" icon="shield-check" href="/ja-JP/gateway/secrets-plan-contract">
    正確な `secrets apply` の対象/パスルールと、ref-only auth-profile 動作。
  </Card>
</CardGroup>

## 5 分でできるローカル起動

<Steps>
  <Step title="Gateway を起動する">

```bash
openclaw gateway --port 18789
# debug/trace を stdio にミラー出力
openclaw gateway --port 18789 --verbose
# 選択したポートのリスナーを強制終了してから起動
openclaw gateway --force
```

  </Step>

  <Step title="サービスの健全性を確認する">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースライン: `Runtime: running`、`Connectivity probe: ok`、および想定どおりの `Capability: ...`。到達可能性だけでなく、read スコープの RPC 証明が必要な場合は `openclaw gateway status --require-rpc` を使ってください。

  </Step>

  <Step title="チャネルの準備状態を検証する">

```bash
openclaw channels status --probe
```

到達可能な Gateway がある場合、これはアカウントごとのライブチャネルプローブと任意の監査を実行します。
Gateway に到達できない場合、CLI はライブプローブ出力ではなく
config のみのチャネル要約にフォールバックします。

  </Step>
</Steps>

<Note>
Gateway config reload は、アクティブな config ファイルパス（profile/state のデフォルト、または設定されていれば `OPENCLAW_CONFIG_PATH` から解決）を監視します。
デフォルトモードは `gateway.reload.mode="hybrid"` です。
最初の読み込み成功後、実行中プロセスはアクティブなインメモリ config スナップショットを提供し、成功した reload はそのスナップショットをアトミックに入れ替えます。
</Note>

## ランタイムモデル

- ルーティング、コントロールプレーン、チャネル接続のための常時稼働プロセス 1 つ。
- 次を多重化した単一ポート:
  - WebSocket control/RPC
  - HTTP API、OpenAI 互換（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - Control UI と hooks
- デフォルトの bind モード: `loopback`。
- デフォルトで認証が必要です。共有シークレット構成では
  `gateway.auth.token` / `gateway.auth.password`（または
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用し、非 loopback の
  reverse-proxy 構成では `gateway.auth.mode: "trusted-proxy"` を使用できます。

## OpenAI 互換エンドポイント

OpenClaw の最も高レバレッジな互換性サーフェスは現在次のとおりです。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

このセットが重要な理由:

- ほとんどの Open WebUI、LobeChat、LibreChat 統合は最初に `/v1/models` を確認します。
- 多くの RAG および memory パイプラインは `/v1/embeddings` を期待します。
- agent ネイティブのクライアントは、ますます `/v1/responses` を好むようになっています。

計画上の注記:

- `/v1/models` は agent-first です。`openclaw`、`openclaw/default`、`openclaw/<agentId>` を返します。
- `openclaw/default` は、常に設定済みデフォルト agent にマップされる安定したエイリアスです。
- バックエンドの provider/model オーバーライドが必要な場合は `x-openclaw-model` を使ってください。そうでなければ、選択された agent の通常の model と embedding 設定がそのまま使われます。

これらはすべてメイン Gateway ポート上で動作し、Gateway HTTP API の他部分と同じ trusted operator 認証境界を使用します。

### ポートと bind の優先順位

| 設定         | 解決順序                                                      |
| ------------ | ------------------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/override → `gateway.bind` → `loopback`                    |

Gateway の起動では、非 loopback bind に対してローカル
Control UI origin を設定するときにも同じ有効ポートと bind が使われます。たとえば、`--bind lan --port 3000`
では、ランタイム検証が実行される前に `http://localhost:3000` と `http://127.0.0.1:3000` が設定されます。HTTPS プロキシ URL のようなリモートブラウザ origin は、
`gateway.controlUi.allowedOrigins` に明示的に追加してください。

### ホット reload モード

| `gateway.reload.mode` | 動作                                   |
| --------------------- | -------------------------------------- |
| `off`                 | config reload なし                     |
| `hot`                 | ホットセーフな変更のみ適用             |
| `restart`             | reload 必須の変更では再起動            |
| `hybrid`（デフォルト） | 安全な場合はホット適用、必要時は再起動 |

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
unit/schtasks）用であり、より深い RPC ヘルスプローブではありません。

## 複数 Gateway（同一ホスト）

ほとんどのインストールでは、マシンごとに 1 つの Gateway を実行すべきです。1 つの Gateway で複数の
agent とチャネルをホストできます。

複数 Gateway が必要なのは、意図的に分離や rescue bot が欲しい場合だけです。

便利な確認:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

想定される内容:

- `gateway status --deep` は `Other gateway-like services detected (best effort)`
  を報告し、古い launchd/systemd/schtasks インストールがまだ残っている場合はクリーンアップのヒントを表示することがあります。
- `gateway probe` は、複数の対象が応答すると `multiple reachable gateways` を警告することがあります。
- それが意図的な場合は、Gateway ごとにポート、config/state、workspace ルートを分離してください。

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

## VoiceClaw リアルタイム brain エンドポイント

OpenClaw は、VoiceClaw 互換のリアルタイム WebSocket エンドポイントを
`/voiceclaw/realtime` で公開します。VoiceClaw デスクトップクライアントが
別の relay プロセスを経由せず、リアルタイムの OpenClaw brain と直接通信すべき場合に使ってください。

このエンドポイントはリアルタイム音声に Gemini Live を使用し、
OpenClaw ツールを Gemini Live に直接公開することで OpenClaw を
brain として呼び出します。ツール呼び出しは、音声ターンの応答性を保つために
即座の `working` 結果を返し、その後 OpenClaw が実際のツールを非同期に実行し、結果を
ライブセッションに戻して注入します。Gateway プロセス環境に `GEMINI_API_KEY` を設定してください。Gateway 認証が有効な場合、
デスクトップクライアントは最初の `session.config` メッセージで Gateway トークンまたはパスワードを送信します。

リアルタイム brain アクセスでは、オーナー認可された OpenClaw agent コマンドが実行されます。`gateway.auth.mode: "none"` は loopback 専用のテストインスタンスに限定してください。非ローカルの
リアルタイム brain 接続には Gateway 認証が必要です。

分離されたテスト Gateway では、独自のポート、config、
state を持つ別インスタンスを実行してください。

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

その後、VoiceClaw を次のように設定します。

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## リモートアクセス

推奨: Tailscale/VPN。
フォールバック: SSH トンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、クライアントはローカルで `ws://127.0.0.1:18789` に接続します。

<Warning>
SSH トンネルは Gateway 認証を回避しません。共有シークレット認証では、トンネル経由でもクライアントは引き続き
`token`/`password` を送信する必要があります。identity-bearing モードでは、
リクエストは引き続きその認証経路を満たす必要があります。
</Warning>

参照: [Remote Gateway](/ja-JP/gateway/remote)、[認証](/ja-JP/gateway/authentication)、[Tailscale](/ja-JP/gateway/tailscale)。

## 監視とサービスライフサイクル

本番相当の信頼性には supervised 実行を使ってください。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

再起動には `openclaw gateway restart` を使ってください。`openclaw gateway stop` と `openclaw gateway start` を連続で使わないでください。macOS では、`gateway stop` は停止前に意図的に LaunchAgent を無効化します。

LaunchAgent ラベルは `ai.openclaw.gateway`（デフォルト）または `ai.openclaw.<profile>`（名前付き profile）です。`openclaw doctor` はサービス config のドリフトを監査および修復します。

  </Tab>

  <Tab title="Linux（systemd user）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後も継続させるには lingering を有効化します。

```bash
sudo loginctl enable-linger <user>
```

カスタムインストールパスが必要な場合の手動 user-unit 例:

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

  <Tab title="Windows（ネイティブ）">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

ネイティブ Windows の管理起動では、`OpenClaw Gateway`
（または名前付き profile では `OpenClaw Gateway (<profile>)`）という Scheduled Task を使用します。Scheduled Task
の作成が拒否された場合、OpenClaw は state ディレクトリ内の `gateway.cmd` を指す
ユーザーごとの Startup-folder ランチャーにフォールバックします。

  </Tab>

  <Tab title="Linux（system service）">

マルチユーザー/常時稼働ホストでは system unit を使用します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

user unit と同じサービス本体を使いますが、
`/etc/systemd/system/openclaw-gateway[-<profile>].service` にインストールし、
`openclaw` バイナリが別の場所にある場合は `ExecStart=` を調整してください。

  </Tab>
</Tabs>

## Dev profile のクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトでは、分離された state/config とベース Gateway ポート `19001` が含まれます。

## プロトコル簡易リファレンス（オペレータービュー）

- 最初のクライアントフレームは `connect` でなければなりません。
- Gateway は `hello-ok` スナップショット（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）を返します。
- `hello-ok.features.methods` / `events` は保守的な検出リストであり、
  呼び出し可能なすべての helper route の自動生成ダンプではありません。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベントには `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、pairing/approval ライフサイクルイベント、`shutdown` が含まれます。

agent 実行は 2 段階です。

1. 即時の accepted ack（`status:"accepted"`）
2. 最終完了レスポンス（`status:"ok"|"error"`）。その間にストリーミング `agent` イベントが入ります。

完全なプロトコルドキュメント: [Gateway Protocol](/ja-JP/gateway/protocol) を参照してください。

## 運用チェック

### Liveness

- WS を開いて `connect` を送信します。
- スナップショット付きの `hello-ok` 応答を期待します。

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップ回復

イベントは再生されません。シーケンスにギャップがある場合は、続行前に state（`health`、`system-presence`）を再取得してください。

## 一般的な障害シグネチャ

| シグネチャ                                                     | 考えられる問題                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 有効な Gateway 認証経路なしでの非 loopback bind                                |
| `another gateway instance is already listening` / `EADDRINUSE` | ポート競合                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | config が remote mode に設定されている、または破損した config で local-mode スタンプが欠落している |
| `unauthorized` during connect                                  | クライアントと Gateway 間の認証不一致                                           |

完全な診断手順については [Gateway Troubleshooting](/ja-JP/gateway/troubleshooting) を使ってください。

## 安全性保証

- Gateway protocol クライアントは、Gateway が利用できない場合に即座に失敗します（暗黙の direct-channel フォールバックなし）。
- 無効な first frame / 非 connect の first frame は拒否され、接続が閉じられます。
- 正常終了時には、ソケットを閉じる前に `shutdown` イベントが送信されます。

---

関連:

- [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [Background Process](/ja-JP/gateway/background-process)
- [設定](/ja-JP/gateway/configuration)
- [ヘルス](/ja-JP/gateway/health)
- [Doctor](/ja-JP/gateway/doctor)
- [認証](/ja-JP/gateway/authentication)

## 関連

- [設定](/ja-JP/gateway/configuration)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)
- [リモートアクセス](/ja-JP/gateway/remote)
- [シークレット管理](/ja-JP/gateway/secrets)
