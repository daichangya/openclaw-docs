---
read_when:
    - ヘッドレス Node ホストを実行する
    - '`system.run` 用に非 macOS Node をペアリングする'
summary: '`openclaw node` の CLI リファレンス（ヘッドレス Node ホスト）'
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で
`system.run` / `system.which` を公開する**ヘッドレス Node ホスト**を実行します。

## なぜ Node ホストを使うのか？

ネットワーク内の**他のマシンでコマンドを実行**したいが、
そこに完全な macOS companion app をインストールしたくない場合に Node ホストを使用します。

よくある用途:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- exec は gateway 上で**サンドボックス化**したまま、承認済み実行を他のホストに委譲する。
- 自動化や CI ノード向けに、軽量でヘッドレスな実行ターゲットを提供する。

実行は依然として**exec approvals** と、Node ホスト上のエージェントごとの許可リストで保護されるため、
コマンドアクセスをスコープ付きかつ明示的に保てます。

## ブラウザプロキシ（ゼロ設定）

Node 上で `browser.enabled` が無効化されていない場合、Node ホストは自動的にブラウザプロキシを公開します。これにより、
追加設定なしで、その Node 上のブラウザ自動化をエージェントが使用できます。

デフォルトでは、プロキシは Node の通常のブラウザプロファイルサーフェスを公開します。  
`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限的になります:
許可リストにないプロファイル指定は拒否され、永続プロファイルの
作成/削除ルートはプロキシ経由でブロックされます。

必要に応じて Node 側で無効化できます:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 実行（フォアグラウンド）

```bash
openclaw node run --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--tls`: Gateway 接続に TLS を使用
- `--tls-fingerprint <sha256>`: 期待する TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: Node id を上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Node の表示名を上書き

## Node ホスト向け Gateway 認証

`openclaw node run` と `openclaw node install` は config/env から Gateway 認証を解決します（node コマンドには `--token`/`--password` フラグはありません）:

- 最初に `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` を確認します。
- 次にローカル設定のフォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef で明示的に設定されていて未解決の場合、Node 認証解決は fail closed します（remote フォールバックで隠蔽されません）。
- `gateway.mode=remote` では、remote precedence rules に従って remote クライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）も対象になります。
- Node ホストの認証解決は `OPENCLAW_GATEWAY_*` env var のみを尊重します。

信頼できるプライベートネットワーク上の non-loopback `ws://` Gateway に Node を接続する場合は、
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。これがないと、Node の起動は fail closed し、
`wss://`、SSH トンネル、または Tailscale を使うよう求められます。
これは `openclaw.json` の設定キーではなく、プロセス環境変数によるオプトインです。
`openclaw node install` は、これがインストールコマンド環境に存在する場合、
監視対象の Node サービスにそれを永続化します。

## サービス（バックグラウンド）

ヘッドレス Node ホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--tls`: Gateway 接続に TLS を使用
- `--tls-fingerprint <sha256>`: 期待する TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: Node id を上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Node の表示名を上書き
- `--runtime <runtime>`: サービスランタイム（`node` または `bun`）
- `--force`: すでにインストール済みの場合に再インストール/上書き

サービスの管理:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドの Node ホスト（サービスなし）には `openclaw node run` を使用します。

サービスコマンドは、機械可読出力のために `--json` を受け付けます。

## ペアリング

最初の接続で、Gateway 上に保留中のデバイスペアリング要求（`role: node`）が作成されます。
次のコマンドで承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

厳格に管理された Node ネットワークでは、Gateway オペレーターは信頼済み CIDR からの初回 Node ペアリングを
自動承認するよう明示的にオプトインできます:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これはデフォルトでは無効です。これは、要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。
オペレーター/ブラウザクライアント、Control UI、WebChat、および role、
scope、metadata、または公開鍵のアップグレードには、依然として手動承認が必要です。

Node が変更された認証詳細（role/scopes/public key）でペアリングを再試行すると、
以前の保留要求は superseded され、新しい `requestId` が作成されます。
承認前にもう一度 `openclaw devices list` を実行してください。

Node ホストは、その Node id、トークン、表示名、および Gateway 接続情報を
`~/.openclaw/node.json` に保存します。

## Exec approvals

`system.run` はローカルの exec approvals で制御されます:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node exec では、OpenClaw はプロンプト前に正規化された `systemRunPlan`
を準備します。後で承認された `system.run` 転送は、その保存済み
プランを再利用するため、承認リクエスト作成後に command/cwd/session フィールドを編集しても、
Node が実行する内容を変更するのではなく拒否されます。

## 関連

- [CLI reference](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
