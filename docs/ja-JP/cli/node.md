---
read_when:
    - ヘッドレスノードホストを実行しているとき
    - '`system.run`のためにmacOS以外のノードをペアリングしているとき'
summary: '`openclaw node`のCLIリファレンス（ヘッドレスノードホスト）'
title: node
x-i18n:
    generated_at: "2026-04-05T12:39:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocketに接続し、このマシン上で
`system.run` / `system.which`を公開する**ヘッドレスノードホスト**を実行します。

## なぜノードホストを使うのか

ノードホストは、ネットワーク内の**他のマシンでコマンドを実行**したいが、
そのマシンに完全なmacOSコンパニオンアプリをインストールしたくない場合に使用します。

よくある使用例:

- リモートのLinux/Windowsマシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- execをGateway上で**サンドボックス化**したまま、承認済みの実行を他のホストへ委譲する。
- 自動化やCIノード向けに、軽量でヘッドレスな実行ターゲットを提供する。

実行は引き続き、ノードホスト上の**exec承認**およびエージェントごとの許可リストで保護されるため、
コマンドアクセスを限定的かつ明示的に維持できます。

## ブラウザープロキシ（ゼロ設定）

ノード上で`browser.enabled`が無効化されていない場合、ノードホストは自動的にブラウザープロキシを公開します。これにより、追加設定なしでエージェントがそのノード上のブラウザー自動化を利用できます。

デフォルトでは、このプロキシはノードの通常のブラウザープロファイルサーフェスを公開します。`nodeHost.browserProxy.allowProfiles`を設定すると、プロキシは制限的になります。
許可リストにないプロファイル指定は拒否され、永続プロファイルの
作成/削除ルートはプロキシ経由でブロックされます。

必要に応じてノード側で無効化してください。

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
- `--tls`: Gateway接続にTLSを使用する
- `--tls-fingerprint <sha256>`: 期待されるTLS証明書フィンガープリント（sha256）
- `--node-id <id>`: ノードIDを上書きする（ペアリングトークンをクリア）
- `--display-name <name>`: ノード表示名を上書きする

## ノードホスト用Gateway認証

`openclaw node run`および`openclaw node install`は、設定/環境変数からGateway認証を解決します（ノードコマンドには`--token`/`--password`フラグはありません）。

- 最初に`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`を確認します。
- 次にローカル設定のフォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、ノードホストは意図的に`gateway.remote.token` / `gateway.remote.password`を継承しません。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示的に設定されていて未解決の場合、ノード認証解決はfail-closedになります（リモートフォールバックによるマスキングなし）。
- `gateway.mode=remote`では、remoteクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）もremote優先順位ルールに従って対象になります。
- ノードホスト認証解決は`OPENCLAW_GATEWAY_*`環境変数のみを尊重します。

## サービス（バックグラウンド）

ヘッドレスノードホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocketホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocketポート（デフォルト: `18789`）
- `--tls`: Gateway接続にTLSを使用する
- `--tls-fingerprint <sha256>`: 期待されるTLS証明書フィンガープリント（sha256）
- `--node-id <id>`: ノードIDを上書きする（ペアリングトークンをクリア）
- `--display-name <name>`: ノード表示名を上書きする
- `--runtime <runtime>`: サービスランタイム（`node`または`bun`）
- `--force`: すでにインストール済みの場合は再インストール/上書きする

サービス管理:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドのノードホスト（サービスなし）には`openclaw node run`を使用してください。

サービスコマンドは、機械可読な出力のために`--json`を受け付けます。

## ペアリング

最初の接続では、Gateway上に保留中のデバイスペアリング要求（`role: node`）が作成されます。
次のコマンドで承認してください。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ノードが変更された認証詳細（role/scopes/public key）でペアリングを再試行すると、
以前の保留要求は置き換えられ、新しい`requestId`が作成されます。
承認前にもう一度`openclaw devices list`を実行してください。

ノードホストは、ノードID、トークン、表示名、Gateway接続情報を
`~/.openclaw/node.json`に保存します。

## Exec承認

`system.run`はローカルのexec承認によって制御されます。

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gatewayから編集）

承認済みの非同期ノードexecでは、OpenClawはプロンプト前に正規の`systemRunPlan`
を準備します。その後の承認済み`system.run`転送では、その保存済み
planを再利用するため、承認要求作成後に`command`/`cwd`/`session`フィールドを編集しても、
ノードが実行する内容を変更するのではなく拒否されます。
