---
read_when:
    - ヘッドレス Node ホストを実行する
    - '`system.run` 用に非 macOS Node をペアリングする'
summary: '`openclaw node` の CLI リファレンス（ヘッドレス Node ホスト）'
title: Node
x-i18n:
    generated_at: "2026-04-26T11:26:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket に接続し、このマシンで
`system.run` / `system.which` を公開する**ヘッドレス Node ホスト**を実行します。

## なぜ Node ホストを使うのか

ネットワーク内の**他のマシンでコマンドを実行**したいが、
そこに完全な macOS コンパニオンアプリをインストールしたくない場合は Node ホストを使います。

一般的なユースケース:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- 実行の**サンドボックス化**は Gateway 側に維持しつつ、承認済みの実行だけを他のホストに委譲する。
- 自動化や CI ノード向けの軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き**exec 承認**と、Node ホスト上のエージェントごとの許可リストによって保護されるため、
コマンドアクセスを限定的かつ明示的に保てます。

## ブラウザプロキシ（設定不要）

Node 上で `browser.enabled` が無効化されていない場合、Node ホストは自動的にブラウザプロキシを公開します。これにより、追加設定なしでその Node 上のブラウザ自動化をエージェントが使用できます。

デフォルトでは、このプロキシは Node の通常のブラウザプロファイル面を公開します。`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限付きになります:
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
- `--node-id <id>`: Node ID を上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Node の表示名を上書き

## Node ホスト用 Gateway 認証

`openclaw node run` と `openclaw node install` は、config/env から Gateway 認証を解決します（Node コマンドに `--token`/`--password` フラグはありません）:

- 最初に `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` を確認します。
- 次にローカル設定へフォールバックします: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定されていて未解決の場合、Node 認証解決は fail closed します（remote フォールバックによるマスキングは行いません）。
- `gateway.mode=remote` では、remote クライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）も remote 優先順位ルールに従って対象になります。
- Node ホスト認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを受け付けます。

信頼されたプライベートネットワーク上の non-loopback `ws://` Gateway に接続する Node では、
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。これがないと、Node の起動は fail closed し、
`wss://`、SSH トンネル、または Tailscale を使用するよう求めます。
これは `openclaw.json` の設定キーではなく、プロセス環境変数によるオプトインです。
`openclaw node install` は、インストールコマンド環境にこれが存在する場合、
監視対象の Node サービスに永続化します。

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
- `--node-id <id>`: Node ID を上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Node の表示名を上書き
- `--runtime <runtime>`: サービスランタイム（`node` または `bun`）
- `--force`: すでにインストール済みの場合は再インストール/上書き

サービスを管理するには:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドの Node ホスト（サービスなし）には `openclaw node run` を使用します。

サービスコマンドは機械可読出力用に `--json` を受け付けます。

Node ホストは、Gateway の再起動やネットワーク切断をプロセス内で再試行します。Gateway がトークン/パスワード/ブートストラップ認証の終端 pause を報告した場合、Node ホストは close 詳細をログに出して非ゼロで終了し、launchd/systemd が新しい設定と認証情報で再起動できるようにします。ペアリング必須の pause は、保留中リクエストを承認できるようフォアグラウンドフローに留まります。

## ペアリング

最初の接続では、Gateway 上に保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。
次のように承認してください:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

厳密に制御された Node ネットワークでは、Gateway 運用者は信頼済み CIDR からの初回 Node ペアリングを自動承認するよう明示的にオプトインできます:

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

これはデフォルトで無効です。これは、要求スコープのない新規の `role: node` ペアリングにのみ適用されます。Operator/browser クライアント、Control UI、WebChat、および role、
scope、metadata、または公開鍵のアップグレードには、引き続き手動承認が必要です。

Node が変更された認証詳細（role/scopes/public key）でペアリングを再試行すると、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前に再度 `openclaw devices list` を実行してください。

Node ホストは、Node ID、トークン、表示名、および Gateway 接続情報を
`~/.openclaw/node.json` に保存します。

## Exec 承認

`system.run` はローカルの exec 承認によって制御されます:

- `~/.openclaw/exec-approvals.json`
- [Exec 承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node exec では、OpenClaw はプロンプト前に正規化された `systemRunPlan`
を準備します。後続の承認済み `system.run` 転送ではその保存済みプランを再利用するため、承認リクエスト作成後に command/cwd/session フィールドを編集しても、Node が実行する内容を変えるのではなく拒否されます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
