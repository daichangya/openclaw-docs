---
read_when:
    - Fly.ioでのOpenClawのデプロイ
    - Fly volume、secret、初回実行設定のセットアップ
summary: 永続ストレージとHTTPSを備えたOpenClawのFly.ioデプロイ手順
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:32:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Fly.ioデプロイ

**目標:** 永続ストレージ、自動HTTPS、Discord/各種チャンネルアクセスを備えた [Fly.io](https://fly.io) machine上でOpenClaw Gatewayを動かすこと。

## 必要なもの

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) がインストール済み
- Fly.ioアカウント（無料枠でも可）
- model認証: 使用するmodel providerのAPI key
- チャンネル認証情報: Discord bot token、Telegram tokenなど

## 初心者向けクイックパス

1. repoをclone → `fly.toml` をカスタマイズ
2. app + volumeを作成 → secretを設定
3. `fly deploy` でデプロイ
4. SSHで入ってconfigを作成、またはControl UIを使う

<Steps>
  <Step title="Fly appを作成">
    ```bash
    # repoをclone
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 新しいFly appを作成（名前は自分のものを選ぶ）
    fly apps create my-openclaw

    # 永続volumeを作成（通常は1GBで十分）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **ヒント:** 自分に近いregionを選んでください。一般的な選択肢: `lhr`（ロンドン）、`iad`（バージニア）、`sjc`（サンノゼ）。

  </Step>

  <Step title="fly.tomlを設定">
    `fly.toml` をapp名と要件に合わせて編集します。

    **セキュリティ注記:** デフォルト設定は公開URLを公開します。公開IPなしの強化デプロイについては [Private Deployment](#private-deployment-hardened) を参照するか、`fly.private.toml` を使ってください。

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

    | Setting                        | 理由                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | `0.0.0.0` にbindし、Flyのproxyがgatewayへ到達できるようにする               |
    | `--allow-unconfigured`         | config fileなしで起動する（後で作成します）                                 |
    | `internal_port = 3000`         | Flyのhealth check用に `--port 3000`（または `OPENCLAW_GATEWAY_PORT`）と一致させる必要があります |
    | `memory = "2048mb"`            | 512MBでは小さすぎます。2GBを推奨                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | stateをvolume上に永続化します                                               |

  </Step>

  <Step title="secretを設定">
    ```bash
    # 必須: Gateway token（非loopback bind用）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model providerのAPI key
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 任意: 他のprovider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # チャンネルtoken
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **注記:**

    - 非loopback bind（`--bind lan`）には、有効なgateway auth経路が必要です。このFly.io例では `OPENCLAW_GATEWAY_TOKEN` を使っていますが、`gateway.auth.password` または正しく設定された非loopbackの `trusted-proxy` デプロイでも要件を満たせます。
    - これらのtokenはpasswordと同様に扱ってください。
    - すべてのAPI keyとtokenは、**config fileより環境変数を優先**してください。これにより、secretが `openclaw.json` に入り込んで誤って露出またはログ出力されることを防げます。

  </Step>

  <Step title="デプロイ">
    ```bash
    fly deploy
    ```

    初回デプロイではDocker imageをbuildします（約2〜3分）。以後のデプロイはより高速です。

    デプロイ後、次で確認します:

    ```bash
    fly status
    fly logs
    ```

    次のように表示されるはずです:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="config fileを作成">
    適切なconfigを作成するため、machineへSSHで入ります:

    ```bash
    fly ssh console
    ```

    config directoryとfileを作成します:

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
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **注記:** `OPENCLAW_STATE_DIR=/data` を使っている場合、config pathは `/data/openclaw.json` です。

    **注記:** `https://my-openclaw.fly.dev` は実際のFly app originに置き換えてください。Gateway起動時はruntimeの `--bind` と `--port` の値からローカルControl UI originを初期投入するため、configが存在しない初回起動でも進行できますが、Fly経由のbrowserアクセスには、正確なHTTPS originを `gateway.controlUi.allowedOrigins` に列挙する必要があります。

    **注記:** Discord tokenは次のいずれかから取得できます:

    - 環境変数: `DISCORD_BOT_TOKEN`（secretには推奨）
    - config file: `channels.discord.token`

    環境変数を使う場合、configにtokenを追加する必要はありません。gatewayは `DISCORD_BOT_TOKEN` を自動で読み取ります。

    反映のため再起動します:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gatewayへアクセス">
    ### Control UI

    browserで開きます:

    ```bash
    fly open
    ```

    または `https://my-openclaw.fly.dev/` を開きます。

    設定した共有secretで認証します。このガイドでは `OPENCLAW_GATEWAY_TOKEN` のgateway tokenを使っています。password認証に切り替えた場合は、そのpasswordを使ってください。

    ### Logs

    ```bash
    fly logs              # ライブログ
    fly logs --no-tail    # 最近のログ
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## トラブルシューティング

### 「App is not listening on expected address」

gatewayが `0.0.0.0` ではなく `127.0.0.1` にbindしています。

**修正:** `fly.toml` のprocess commandに `--bind lan` を追加してください。

### Health check失敗 / connection refused

Flyが設定されたportでgatewayに到達できません。

**修正:** `internal_port` がgateway portと一致していることを確認してください（`--port 3000` または `OPENCLAW_GATEWAY_PORT=3000` を設定）。

### OOM / メモリ問題

containerが再起動を繰り返す、またはkillされます。兆候: `SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`、または無言の再起動。

**修正:** `fly.toml` のmemoryを増やしてください:

```toml
[[vm]]
  memory = "2048mb"
```

または既存machineを更新します:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注記:** 512MBでは小さすぎます。1GBでも動作する場合はありますが、負荷時やverbose logging時にOOMになることがあります。**2GB推奨**です。

### Gateway lockの問題

Gatewayが「already running」エラーで起動を拒否します。

これはcontainer再起動時にPID lock fileがvolume上に残ることで発生します。

**修正:** lock fileを削除してください:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

lock fileは `/data/gateway.*.lock` にあります（subdirectory内ではありません）。

### configが読み込まれない

`--allow-unconfigured` は起動ガードを回避するだけです。`/data/openclaw.json` を作成または修復するわけではないため、実際のconfigが存在し、通常のローカルgateway起動を望む場合は `gateway.mode="local"` を含んでいることを確認してください。

configが存在するか確認します:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH経由でconfigを書き込む

`fly ssh console -C` コマンドはshellのリダイレクトをサポートしません。config fileを書き込むには:

```bash
# echo + teeを使う（ローカルからリモートへpipe）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# またはsftpを使う
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注記:** `fly sftp` はfileがすでに存在すると失敗する場合があります。先に削除してください:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### stateが永続化されない

再起動後にauth profile、channel/provider state、またはsessionが失われる場合、
state dirがcontainer filesystemに書き込まれています。

**修正:** `fly.toml` で `OPENCLAW_STATE_DIR=/data` が設定されていることを確認し、再デプロイしてください。

## 更新

```bash
# 最新変更をpull
git pull

# 再デプロイ
fly deploy

# healthを確認
fly status
fly logs
```

### Machine commandの更新

完全な再デプロイなしで起動commandを変更したい場合:

```bash
# machine IDを取得
fly machines list

# commandを更新
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# またはmemory増加つき
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注記:** `fly deploy` 後、machine commandは `fly.toml` に書かれたものへ戻ることがあります。手動変更を加えた場合は、デプロイ後に再適用してください。

## Private Deployment（強化版）

デフォルトでは、Flyは公開IPを割り当てるため、gatewayは `https://your-app.fly.dev` でアクセス可能になります。これは便利ですが、デプロイがインターネットスキャナー（Shodan、Censysなど）に発見可能になることも意味します。

**公開露出なし** の強化デプロイには、private templateを使ってください。

### private deploymentを使うべき場合

- **送信のみ** を行う（受信Webhookなし）
- Webhook callbackには **ngrokまたはTailscale** tunnelを使う
- gatewayへはbrowserではなく **SSH、proxy、またはWireGuard** でアクセスする
- デプロイを**インターネットスキャナーから隠したい**

### セットアップ

標準configの代わりに `fly.private.toml` を使います:

```bash
# private configでデプロイ
fly deploy -c fly.private.toml
```

または既存デプロイを変換します:

```bash
# 現在のIPを一覧
fly ips list -a my-openclaw

# 公開IPを解放
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 今後のdeployで公開IPが再割り当てされないようprivate configへ切り替える
# （[http_service] を削除するか、private templateでdeploy）
fly deploy -c fly.private.toml

# private専用IPv6を割り当て
fly ips allocate-v6 --private -a my-openclaw
```

この後、`fly ips list` には `private` typeのIPだけが表示されるはずです:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### private deploymentへのアクセス

公開URLがないため、次のいずれかの方法を使います:

**Option 1: ローカルproxy（最も簡単）**

```bash
# ローカルport 3000をappへ転送
fly proxy 3000:3000 -a my-openclaw

# その後 browserで http://localhost:3000 を開く
```

**Option 2: WireGuard VPN**

```bash
# WireGuard configを作成（初回のみ）
fly wireguard create

# WireGuard clientへimportし、その後内部IPv6経由でアクセス
# 例: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3: SSHのみ**

```bash
fly ssh console -a my-openclaw
```

### private deploymentでのWebhook

公開露出なしでWebhook callback（Twilio、Telnyxなど）が必要な場合:

1. **ngrok tunnel** - container内またはsidecarとしてngrokを実行
2. **Tailscale Funnel** - 特定pathをTailscale経由で公開
3. **送信専用** - 一部provider（Twilioなど）はWebhookなしでも送信コールで問題なく動作

ngrokを使うvoice-call設定例:

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

ngrok tunnelはcontainer内で実行され、Fly app自体を公開せずに公開Webhook URLを提供します。転送されたhost headerが受け入れられるよう、`webhookSecurity.allowedHosts` を公開tunnel hostnameに設定してください。

### セキュリティ上の利点

| 項目              | Public       | Private     |
| ----------------- | ------------ | ----------- |
| インターネットスキャナー | 発見可能     | 非公開        |
| 直接攻撃            | 可能         | ブロックされる |
| Control UI access | Browser      | Proxy/VPN   |
| Webhook配信        | 直接         | tunnel経由   |

## 注記

- Fly.ioは**x86アーキテクチャ** を使います（ARMではありません）
- Dockerfileは両アーキテクチャに対応しています
- WhatsApp/Telegramのオンボーディングには `fly ssh console` を使ってください
- 永続データはvolume上の `/data` に保存されます
- SignalにはJava + signal-cliが必要です。custom imageを使い、memoryは2GB以上を維持してください。

## コスト

推奨構成（`shared-cpu-2x`、2GB RAM）の場合:

- 使用量に応じて約 $10〜15/月
- 無料枠には一定の利用枠が含まれます

詳細は [Fly.io pricing](https://fly.io/docs/about/pricing/) を参照してください。

## 次のステップ

- メッセージングチャンネルを設定する: [Channels](/ja-JP/channels)
- Gatewayを設定する: [Gateway configuration](/ja-JP/gateway/configuration)
- OpenClawを最新状態に保つ: [Updating](/ja-JP/install/updating)

## 関連

- [Install overview](/ja-JP/install)
- [Hetzner](/ja-JP/install/hetzner)
- [Docker](/ja-JP/install/docker)
- [VPS hosting](/ja-JP/vps)
