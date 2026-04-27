---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 设置 Fly 卷、密钥和首次运行配置
summary: OpenClaw 在 Fly.io 上部署的分步指南，包含持久化存储和 HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T00:39:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Fly.io 部署

**目标：** 让 OpenClaw Gateway 网关运行在 [Fly.io](https://fly.io) 的机器上，并具备持久化存储、自动 HTTPS，以及 Discord/渠道访问能力。

## 你需要准备

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账号（免费层即可）
- 模型凭证：你所选模型提供商的 API 密钥
- 渠道凭证：Discord 机器人令牌、Telegram 令牌等

## 面向初学者的快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用 + 卷 → 设置密钥
3. 使用 `fly deploy` 部署
4. SSH 登录后创建配置，或使用 Control UI

<Steps>
  <Step title="创建 Fly 应用">
    ```bash
    # 克隆仓库
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 创建一个新的 Fly 应用（自己选择名称）
    fly apps create my-openclaw

    # 创建一个持久卷（通常 1GB 就够）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **提示：** 选择离你较近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml`，使其与你的应用名称和需求匹配。

    **安全说明：** 默认配置会暴露一个公开 URL。如需无公网 IP 的加固部署，请参见 [私有部署](#private-deployment-hardened)，或使用 `fly.private.toml`。

    ```toml
    app = "my-openclaw"  # 你的应用名称
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

    **关键设置：**

    | 设置                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 绑定到 `0.0.0.0`，这样 Fly 的代理才能访问 Gateway 网关                      |
    | `--allow-unconfigured`         | 允许在没有配置文件的情况下启动（你稍后再创建）                              |
    | `internal_port = 3000`         | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）一致，以满足 Fly 健康检查 |
    | `memory = "2048mb"`            | 512MB 太小；建议使用 2GB                                                    |
    | `OPENCLAW_STATE_DIR = "/data"` | 将状态持久化到卷上                                                          |

  </Step>

  <Step title="设置密钥">
    ```bash
    # 必需：Gateway 网关令牌（用于非 loopback 绑定）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 模型提供商 API 密钥
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 可选：其他提供商
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # 渠道令牌
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **说明：**

    - 非 loopback 绑定（`--bind lan`）要求存在有效的 Gateway 网关认证路径。这个 Fly.io 示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或配置正确的非 loopback `trusted-proxy` 部署也能满足该要求。
    - 请像对待密码一样保护这些令牌。
    - 对所有 API 密钥和令牌，**优先使用环境变量而不是配置文件**。这样可以避免密钥出现在 `openclaw.json` 中，从而减少意外暴露或被记录到日志中的风险。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    首次部署会构建 Docker 镜像（约 2–3 分钟）。后续部署会更快。

    部署后，进行验证：

    ```bash
    fly status
    fly logs
    ```

    你应该看到：

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="创建配置文件">
    通过 SSH 进入机器来创建正式配置：

    ```bash
    fly ssh console
    ```

    创建配置目录和文件：

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

    **注意：** 设置 `OPENCLAW_STATE_DIR=/data` 后，配置路径就是 `/data/openclaw.json`。

    **注意：** 请将 `https://my-openclaw.fly.dev` 替换为你真实的 Fly 应用来源地址。Gateway 网关启动时会根据运行时的 `--bind` 和 `--port` 值预填充本地 Control UI 来源，因此首次启动可以在配置尚不存在时继续进行；但通过 Fly 在浏览器中访问时，仍然需要在 `gateway.controlUi.allowedOrigins` 中列出准确的 HTTPS 来源。

    **注意：** Discord 令牌可以来自以下任一位置：

    - 环境变量：`DISCORD_BOT_TOKEN`（推荐用于密钥）
    - 配置文件：`channels.discord.token`

    如果使用环境变量，则无需把令牌加入配置。Gateway 网关会自动读取 `DISCORD_BOT_TOKEN`。

    重启以应用配置：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="访问 Gateway 网关">
    ### Control UI

    在浏览器中打开：

    ```bash
    fly open
    ```

    或访问 `https://my-openclaw.fly.dev/`

    使用你配置的共享密钥进行认证。本指南使用的是来自 `OPENCLAW_GATEWAY_TOKEN` 的 Gateway 网关令牌；如果你改用了密码认证，请改用对应密码。

    ### 日志

    ```bash
    fly logs              # 实时日志
    fly logs --no-tail    # 最近日志
    ```

    ### SSH 控制台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 故障排除

### “App is not listening on expected address”

Gateway 网关绑定到了 `127.0.0.1`，而不是 `0.0.0.0`。

**修复方法：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / connection refused

Fly 无法通过配置的端口访问 Gateway 网关。

**修复方法：** 确保 `internal_port` 与 Gateway 网关端口一致（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器持续重启或被杀掉。常见迹象包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或无提示重启。

**修复方法：** 增加 `fly.toml` 中的内存：

```toml
[[vm]]
  memory = "2048mb"
```

或者更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能可用，但在有负载或日志较多时仍可能 OOM。**推荐使用 2GB。**

### Gateway 网关锁文件问题

Gateway 网关启动时报 “already running” 错误并拒绝启动。

这通常发生在容器重启后，PID 锁文件仍保留在卷中。

**修复方法：** 删除锁文件：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 未读取配置

`--allow-unconfigured` 只会跳过启动保护，不会创建或修复 `/data/openclaw.json`，因此请确保你的正式配置文件已存在，并且在你希望以普通本地 Gateway 网关方式启动时，包含 `gateway.mode="local"`。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 命令不支持 shell 重定向。要写入配置文件：

```bash
# 使用 echo + tee（从本地管道传到远程）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意：** 如果目标文件已存在，`fly sftp` 可能会失败。请先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果你在重启后丢失了 auth 配置、渠道/提供商状态或会话，说明状态目录被写到了容器文件系统中。

**修复方法：** 确保在 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，然后重新部署。

## 更新

```bash
# 拉取最新更改
git pull

# 重新部署
fly deploy

# 检查健康状态
fly status
fly logs
```

### 更新机器命令

如果你需要在不完整重新部署的情况下修改启动命令：

```bash
# 获取机器 ID
fly machines list

# 更新命令
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或同时增加内存
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注意：** 执行 `fly deploy` 后，机器命令可能会重置为 `fly.toml` 中的内容。如果你做了手动更改，请在部署后重新应用。

## 私有部署（加固）

默认情况下，Fly 会分配公网 IP，这会让你的 Gateway 网关可通过 `https://your-app.fly.dev` 访问。这很方便，但也意味着你的部署可被互联网扫描器（Shodan、Censys 等）发现。

如果你需要**完全不对公网暴露**的加固部署，请使用私有模板。

### 何时使用私有部署

- 你只会发起**出站**调用/消息（没有入站 webhook）
- 你使用 **ngrok 或 Tailscale** 隧道处理 webhook 回调
- 你通过 **SSH、代理或 WireGuard** 访问 Gateway 网关，而不是浏览器
- 你希望部署**不被互联网扫描器发现**

### 设置

使用 `fly.private.toml` 代替标准配置：

```bash
# 使用私有配置部署
fly deploy -c fly.private.toml
```

或者将现有部署转换为私有部署：

```bash
# 列出当前 IP
fly ips list -a my-openclaw

# 释放公网 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切换到私有配置，避免后续部署再次分配公网 IP
# （删除 [http_service] 或使用私有模板部署）
fly deploy -c fly.private.toml

# 分配仅私有的 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

完成后，`fly ips list` 应只显示 `private` 类型的 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公开 URL，请使用以下方法之一：

**选项 1：本地代理（最简单）**

```bash
# 将本地 3000 端口转发到应用
fly proxy 3000:3000 -a my-openclaw

# 然后在浏览器中打开 http://localhost:3000
```

**选项 2：WireGuard VPN**

```bash
# 创建 WireGuard 配置（一次性）
fly wireguard create

# 导入到 WireGuard 客户端，然后通过内部 IPv6 访问
# 示例：http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅 SSH**

```bash
fly ssh console -a my-openclaw
```

### 使用私有部署处理 webhook

如果你需要 webhook 回调（Twilio、Telnyx 等），但又不想对公网暴露：

1. **ngrok 隧道** - 在容器内运行 ngrok，或作为 sidecar 运行
2. **Tailscale Funnel** - 通过 Tailscale 暴露特定路径
3. **仅出站** - 某些提供商（如 Twilio）即使没有 webhook 也能正常处理出站呼叫

使用 ngrok 的语音通话配置示例：

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

ngrok 隧道在容器内运行，可提供一个公开的 webhook URL，而无需暴露 Fly 应用本身。请将 `webhookSecurity.allowedHosts` 设置为公开隧道的主机名，这样转发过来的 Host 头才会被接受。

### 安全收益

| 方面             | 公开部署 | 私有部署     |
| ---------------- | -------- | ------------ |
| 互联网扫描器发现 | 可发现   | 隐藏         |
| 直接攻击         | 可能     | 被阻止       |
| Control UI 访问  | 浏览器   | 代理 / VPN   |
| webhook 投递     | 直接     | 通过隧道     |

## 说明

- Fly.io 使用 **x86 架构**（不是 ARM）
- Dockerfile 同时兼容这两种架构
- 对于 WhatsApp/Telegram 新手引导，请使用 `fly ssh console`
- 持久化数据存放在卷上的 `/data`
- Signal 需要 Java + `signal-cli`；请使用自定义镜像，并将内存保持在 2GB 以上。

## 费用

使用推荐配置（`shared-cpu-2x`，2GB RAM）时：

- 约 $10–15/月，具体取决于使用情况
- 免费层包含一定额度

详情请参见 [Fly.io 定价](https://fly.io/docs/about/pricing/)。

## 下一步

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 保持 OpenClaw 为最新版本：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Hetzner](/zh-CN/install/hetzner)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)
