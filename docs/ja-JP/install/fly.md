---
read_when:
    - Fly.io上にOpenClawをデプロイする場合
    - Fly volumes、secrets、初回実行設定をセットアップする場合
summary: 永続ストレージとHTTPSを備えたOpenClawのFly.ioデプロイ手順
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T12:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Fly.ioデプロイ

**目標:** [Fly.io](https://fly.io)のmachine上で、永続ストレージ、自動HTTPS、Discord/channelアクセスを備えたOpenClaw Gatewayを実行すること。

## 必要なもの

- インストール済みの[flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.ioアカウント（free tierで可）
- モデル認証: 使用するモデルプロバイダーのAPIキー
- Channel認証情報: Discord botトークン、Telegramトークンなど

## 初心者向けクイックパス

1. リポジトリをclone → `fly.toml`をカスタマイズ
2. app + volumeを作成 → secretsを設定
3. `fly deploy`でデプロイ
4. SSHで入り設定を作成、またはControl UIを使用

<Steps>
  <Step title="Fly appを作成する">
    ```bash
    # リポジトリをclone
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 新しいFly appを作成（名前は自分のものにする）
    fly apps create my-openclaw

    # 永続volumeを作成（通常は1GBで十分）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tip:** 自分に近いリージョンを選んでください。一般的な選択肢: `lhr`（ロンドン）、`iad`（バージニア）、`sjc`（サンノゼ）。

  </Step>

  <Step title="fly.tomlを設定する">
    app名と要件に合わせて`fly.toml`を編集します。

    **セキュリティ注記:** デフォルト設定ではpublic URLが公開されます。public IPなしの強化構成については、[Private Deployment](#private-deployment-hardened)を参照するか、`fly.private.toml`を使用してください。

    ```toml
    app = "my-openclaw"  # app名
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **主要設定:**

    | 設定 | 理由 |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan` | Flyのproxyがgatewayに到達できるように`0.0.0.0`へbindする |
    | `--allow-unconfigured` | 設定ファイルなしで起動する（後で作成する） |
    | `internal_port = 3000` | Flyのhealth check用に`--port 3000`（または`OPENCLAW_GATEWAY_PORT`）と一致させる必要がある |
    | `memory = "2048mb"` | 512MBでは不足。2GB推奨 |
    | `OPENCLAW_STATE_DIR = "/data"` | volume上に状態を永続化する |

  </Step>

  <Step title="secretsを設定する">
    ```bash
    # 必須: Gatewayトークン（非loopback bind用）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # モデルプロバイダーAPIキー
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 任意: その他のプロバイダー
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channelトークン
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **注記:**

    - 非loopback bind（`--bind lan`）には有効なgateway認証パスが必要です。このFly.io例では`OPENCLAW_GATEWAY_TOKEN`を使用していますが、`gateway.auth.password`や、正しく設定された非loopback `trusted-proxy`デプロイでも要件を満たせます。
    - これらのトークンはパスワードと同様に扱ってください。
    - すべてのAPIキーとトークンは、**設定ファイルより環境変数を推奨**します。これにより、シークレットが`openclaw.json`に入って誤って露出したりログに残ったりするのを防げます。

  </Step>

  <Step title="デプロイする">
    ```bash
    fly deploy
    ```

    初回デプロイではDockerイメージをビルドします（約2〜3分）。以後のデプロイはより高速です。

    デプロイ後に確認します:

    ```bash
    fly status
    fly logs
    ```

    次のような表示が出るはずです:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="設定ファイルを作成する">
    properな設定を作成するため、machineにSSHで入ります:

    ```bash
    fly ssh console
    ```

    設定ディレクトリとファイルを作成します:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **注記:** `OPENCLAW_STATE_DIR=/data`の場合、設定パスは`/data/openclaw.json`です。

    **注記:** Discordトークンは次のいずれかから取得できます:

    - 環境変数: `DISCORD_BOT_TOKEN`（シークレットには推奨）
    - 設定ファイル: `channels.discord.token`

    環境変数を使う場合、設定にトークンを追加する必要はありません。gatewayは自動的に`DISCORD_BOT_TOKEN`を読み取ります。

    適用するため再起動します:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gatewayにアクセスする">
    ### Control UI

    ブラウザーで開きます:

    ```bash
    fly open
    ```

    または`https://my-openclaw.fly.dev/`にアクセスします。

    設定された共有シークレットで認証してください。このガイドでは
    `OPENCLAW_GATEWAY_TOKEN`のgatewayトークンを使用しています。パスワード認証に切り替えた場合は、そのパスワードを使用してください。

    ### ログ

    ```bash
    fly logs              # ライブログ
    fly logs --no-tail    # 最近のログ
    ```

    ### SSHコンソール

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「App is not listening on expected address」

gatewayが`0.0.0.0`ではなく`127.0.0.1`にbindしています。

**修正:** `fly.toml`のprocess commandに`--bind lan`を追加してください。

### Health checks failing / connection refused

Flyが設定ポート上のgatewayに到達できていません。

**修正:** `internal_port`がgatewayポートと一致していることを確認してください（`--port 3000`または`OPENCLAW_GATEWAY_PORT=3000`を設定）。

### OOM / メモリ問題

コンテナが再起動し続ける、またはkillされます。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、または無言の再起動。

**修正:** `fly.toml`でメモリを増やしてください:

```toml
[[vm]]
  memory = "2048mb"
```

または既存machineを更新します:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注記:** 512MBでは不足です。1GBでも動くことはありますが、高負荷時や詳細ログ有効時にはOOMになる可能性があります。**2GBを推奨します。**

### Gateway Lock問題

Gatewayが「already running」エラーで起動を拒否します。

これは、コンテナ再起動後もPID lockファイルがvolume上に残っているときに発生します。

**修正:** lockファイルを削除してください:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

lockファイルは`/data/gateway.*.lock`にあります（サブディレクトリ内ではありません）。

### 設定が読み込まれていない

`--allow-unconfigured`は起動時ガードを回避するだけです。`/data/openclaw.json`を作成したり修復したりはしないため、実際の設定が存在し、通常のlocal gateway起動をしたい場合は`gateway.mode="local"`が含まれていることを確認してください。

設定が存在することを確認します:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH経由で設定を書き込む

`fly ssh console -C`コマンドはシェルのリダイレクトをサポートしません。設定ファイルを書き込むには:

```bash
# echo + teeを使用（ローカルからリモートへパイプ）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# またはsftpを使用
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注記:** ファイルがすでに存在する場合、`fly sftp`は失敗することがあります。先に削除してください:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状態が永続化されない

再起動後に認証プロファイル、channel/provider状態、またはセッションが失われる場合、
state dirがコンテナファイルシステムに書き込まれています。

**修正:** `fly.toml`で`OPENCLAW_STATE_DIR=/data`が設定されていることを確認し、再デプロイしてください。

## 更新

```bash
# 最新変更を取得
git pull

# 再デプロイ
fly deploy

# 正常性を確認
fly status
fly logs
```

### Machineコマンドの更新

完全な再デプロイなしで起動コマンドを変更したい場合:

```bash
# machine IDを取得
fly machines list

# コマンドを更新
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# またはメモリ増加付き
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注記:** `fly deploy`後、machine commandは`fly.toml`の内容にリセットされる場合があります。手動変更を加えた場合は、デプロイ後に再適用してください。

## Private Deployment（強化構成）

デフォルトでは、Flyはpublic IPを割り当てるため、gatewayは`https://your-app.fly.dev`でアクセス可能になります。これは便利ですが、インターネットスキャナー（Shodan、Censysなど）から発見可能であることを意味します。

**公開露出なし**の強化構成にするには、privateテンプレートを使用してください。

### private deploymentを使うべき場面

- **アウトバウンド**の呼び出し/メッセージのみを行う（受信Webhookなし）
- Webhookコールバックには**ngrokまたはTailscale**トンネルを使用する
- gatewayへはブラウザーではなく、**SSH、proxy、またはWireGuard**経由でアクセスする
- デプロイを**インターネットスキャナーから隠したい**

### セットアップ

標準設定の代わりに`fly.private.toml`を使用します:

```bash
# private設定でデプロイ
fly deploy -c fly.private.toml
```

または既存デプロイを変換します:

```bash
# 現在のIPを一覧表示
fly ips list -a my-openclaw

# public IPを解放
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 今後のデプロイでpublic IPが再割り当てされないようprivate設定へ切り替え
# （[http_service]を削除するか、privateテンプレートでデプロイ）
fly deploy -c fly.private.toml

# private専用IPv6を割り当て
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list`には`private`型のIPのみが表示されるはずです:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### private deploymentへのアクセス

public URLがないため、次のいずれかの方法を使用します:

**オプション1: ローカルproxy（最も簡単）**

```bash
# ローカルの3000番ポートをappへ転送
fly proxy 3000:3000 -a my-openclaw

# その後、ブラウザーでhttp://localhost:3000を開く
```

**オプション2: WireGuard VPN**

```bash
# WireGuard設定を作成（初回のみ）
fly wireguard create

# WireGuardクライアントに取り込み、内部IPv6経由でアクセス
# 例: http://[fdaa:x:x:x:x::x]:3000
```

**オプション3: SSHのみ**

```bash
fly ssh console -a my-openclaw
```

### private deploymentでのWebhook

公開露出なしでWebhookコールバック（Twilio、Telnyxなど）が必要な場合:

1. **ngrokトンネル** - ngrokをコンテナ内またはsidecarとして実行する
2. **Tailscale Funnel** - 特定パスをTailscale経由で公開する
3. **アウトバウンド専用** - 一部のプロバイダー（Twilio）はWebhookなしでもアウトバウンド通話が問題なく動作する

ngrokを使ったvoice-call設定例:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrokトンネルはコンテナ内で実行され、Fly app自体を公開せずにpublicなWebhook URLを提供します。転送されたhostヘッダーを受け入れられるように、公開トンネルのホスト名を`webhookSecurity.allowedHosts`に設定してください。

### セキュリティ上の利点

| 項目 | Public | Private |
| ----------------- | ------------ | ---------- |
| インターネットスキャナー | 発見可能 | 隠蔽 |
| 直接攻撃 | 可能 | ブロック |
| Control UIアクセス | ブラウザー | Proxy/VPN |
| Webhook配信 | 直接 | トンネル経由 |

## 注記

- Fly.ioは**x86アーキテクチャ**を使用します（ARMではありません）
- Dockerfileは両方のアーキテクチャと互換性があります
- WhatsApp/Telegramオンボーディングには`fly ssh console`を使用してください
- 永続データは`/data`のvolume上に保存されます
- SignalにはJava + signal-cliが必要です。カスタムイメージを使い、メモリは2GB以上を維持してください。

## コスト

推奨構成（`shared-cpu-2x`、2GB RAM）では:

- 使用量に応じておよそ\$10〜15/月
- free tierに一定の枠が含まれます

詳細は[Fly.io pricing](https://fly.io/docs/about/pricing/)を参照してください。

## 次のステップ

- メッセージングchannelsを設定する: [Channels](/ja-JP/channels)
- Gatewayを設定する: [Gateway configuration](/gateway/configuration)
- OpenClawを最新に保つ: [Updating](/install/updating)
