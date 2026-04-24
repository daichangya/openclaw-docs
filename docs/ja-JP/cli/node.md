---
read_when:
    - ヘッドレスNodeホストの実行
    - system.run のための非macOS Nodeのペアリング
summary: '`openclaw node` のCLIリファレンス（ヘッドレスNodeホスト）'
title: Node
x-i18n:
    generated_at: "2026-04-24T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

このマシン上でGateway WebSocketに接続し、`system.run` / `system.which` を公開する**ヘッドレスNodeホスト**を実行します。

## なぜNodeホストを使うのですか？

ネットワーク内の**ほかのマシンでコマンドを実行**したいが、そこに完全なmacOSコンパニオンアプリをインストールしたくない場合は、Nodeホストを使用します。

一般的なユースケース:

- リモートのLinux/Windowsマシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- exec をgateway上で**サンドボックス化**したまま、承認済みの実行をほかのホストに委譲する。
- 自動化やCIノード向けの、軽量でヘッドレスな実行ターゲットを提供する。

実行は引き続き**exec approvals**と、Nodeホスト上のエージェントごとの許可リストによって保護されるため、コマンドアクセスを限定的かつ明示的に保てます。

## ブラウザプロキシ（設定不要）

Node上で`browser.enabled`が無効化されていない場合、Nodeホストは自動的にブラウザプロキシを通知します。これにより、追加設定なしでエージェントがそのNode上のブラウザ自動化を利用できます。

デフォルトでは、このプロキシはNodeの通常のブラウザプロファイル面を公開します。`nodeHost.browserProxy.allowProfiles`を設定すると、プロキシは制限付きになります。許可リストにないプロファイルの指定は拒否され、永続プロファイルの作成/削除ルートはプロキシ経由でブロックされます。

必要に応じてNode側で無効化してください:

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

- `--host <host>`: Gateway WebSocketホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocketポート（デフォルト: `18789`）
- `--tls`: gateway接続にTLSを使用
- `--tls-fingerprint <sha256>`: 期待されるTLS証明書フィンガープリント（sha256）
- `--node-id <id>`: Node idを上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Nodeの表示名を上書き

## Nodeホスト用Gateway認証

`openclaw node run`と`openclaw node install`は、config/envからgateway認証を解決します（Nodeコマンドには`--token`/`--password`フラグはありません）:

- 最初に`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`を確認します。
- 次にローカル設定へのフォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Nodeホストは意図的に`gateway.remote.token` / `gateway.remote.password`を継承しません。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定されていて未解決の場合、Node認証の解決はクローズドフェイルします（リモートフォールバックによるマスキングは行われません）。
- `gateway.mode=remote`では、リモートクライアントのフィールド（`gateway.remote.token` / `gateway.remote.password`）も、リモートの優先順位ルールに従って対象になります。
- Nodeホストの認証解決では、`OPENCLAW_GATEWAY_*`環境変数のみを使用します。

信頼できるプライベートネットワーク上の非loopback `ws://` Gatewayに接続するNodeでは、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`を設定してください。これがない場合、Nodeの起動はクローズドフェイルし、`wss://`、SSHトンネル、またはTailscaleの使用を求めます。
これはプロセス環境によるオプトインであり、`openclaw.json`の設定キーではありません。
`openclaw node install`は、これがインストールコマンドの環境に存在する場合、監視対象のNodeサービスに永続化します。

## サービス（バックグラウンド）

ヘッドレスNodeホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocketホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocketポート（デフォルト: `18789`）
- `--tls`: gateway接続にTLSを使用
- `--tls-fingerprint <sha256>`: 期待されるTLS証明書フィンガープリント（sha256）
- `--node-id <id>`: Node idを上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Nodeの表示名を上書き
- `--runtime <runtime>`: サービスランタイム（`node`または`bun`）
- `--force`: すでにインストール済みの場合は再インストール/上書き

サービスの管理:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドのNodeホスト（サービスなし）には`openclaw node run`を使用します。

サービスコマンドは、機械可読な出力のために`--json`を受け付けます。

## ペアリング

最初の接続時に、Gateway上に保留中のデバイスペアリング要求（`role: node`）が作成されます。
次の方法で承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Nodeが変更された認証詳細（role/scopes/public key）でペアリングを再試行すると、以前の保留要求は置き換えられ、新しい`requestId`が作成されます。
承認前に再度`openclaw devices list`を実行してください。

Nodeホストは、Node id、トークン、表示名、およびgateway接続情報を`~/.openclaw/node.json`に保存します。

## Exec approvals

`system.run`はローカルのexec approvalsによって制御されます:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gatewayから編集）

承認済みの非同期Node execについては、OpenClawはプロンプト表示前に正規の`systemRunPlan`を準備します。
後で承認された`system.run`転送では、その保存済みプランが再利用されるため、承認リクエスト作成後にcommand/cwd/sessionフィールドを編集しても、Nodeが実行する内容を変更するのではなく拒否されます。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
