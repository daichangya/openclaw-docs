---
read_when:
    - 你想为 Gateway 网关使用一台低成本、始终在线的 Linux 主机
    - 你希望获得远程 Control UI 访问，而无需自己运行 VPS
summary: 在 exe.dev 上运行 OpenClaw Gateway 网关（VM + HTTPS 代理）以实现远程访问
title: exe.dev
x-i18n:
    generated_at: "2026-04-27T06:04:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ef0b961a1153357aa32dd061791f5c94ae5008a99a800456d592ffce3a643f2
    source_path: install/exe-dev.md
    workflow: 15
---

目标：让 OpenClaw Gateway 网关运行在 exe.dev VM 上，并可从你的笔记本通过以下地址访问：`https://<vm-name>.exe.xyz`

本页假定你使用 exe.dev 默认的 **exeuntu** 镜像。如果你选择了其他发行版，请相应调整软件包名称。

## 面向新手的快速路径

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填写你的认证密钥 / 令牌
3. 点击 VM 旁边的 “Agent”，等待 Shelley 完成配置
4. 打开 `https://<vm-name>.exe.xyz/`，并使用已配置的共享密钥进行认证（本指南默认使用令牌认证，但如果你切换 `gateway.auth.mode`，密码认证也可以）
5. 使用 `openclaw devices approve <requestId>` 批准所有待处理的设备配对请求

## 你需要准备

- exe.dev 账号
- 通过 `ssh exe.dev` 访问 [exe.dev](https://exe.dev) 虚拟机的权限（可选）

## 使用 Shelley 自动安装

Shelley 是 [exe.dev](https://exe.dev) 的智能体，它可以通过我们的
提示词立即安装 OpenClaw。使用的提示词如下：

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手动安装

## 1）创建 VM

在你的设备上执行：

```bash
ssh exe.dev new
```

然后连接：

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
请保持此 VM **有状态**。OpenClaw 会将 `openclaw.json`、每个智能体的 `auth-profiles.json`、会话以及渠道 / 提供商状态存储在 `~/.openclaw/` 下，并将工作区存储在 `~/.openclaw/workspace/` 下。
</Tip>

## 2）安装前置依赖（在 VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3）安装 OpenClaw

运行 OpenClaw 安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4）配置 nginx，将 OpenClaw 代理到 8000 端口

编辑 `/etc/nginx/sites-enabled/default`，内容如下：

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

请覆盖转发标头，而不是保留客户端提供的链。
OpenClaw 仅信任来自显式配置代理的转发 IP 元数据，
而追加式 `X-Forwarded-For` 链会被视为一种加固风险。

## 5）访问 OpenClaw 并授予权限

访问 `https://<vm-name>.exe.xyz/`（参见新手引导期间的 Control UI 输出）。如果系统提示认证，请粘贴来自
VM 的已配置共享密钥。本指南使用令牌认证，因此请使用 `openclaw config get gateway.auth.token`
获取 `gateway.auth.token`（或使用 `openclaw doctor --generate-gateway-token` 生成一个）。
如果你将 gateway 切换为密码认证，请改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。
使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 批准设备。如有疑问，请直接在浏览器中使用 Shelley！

## 远程访问

远程访问由 [exe.dev](https://exe.dev) 的认证机制处理。默认情况下，
来自 8000 端口的 HTTP 流量会被转发到 `https://<vm-name>.exe.xyz`，
并使用电子邮件认证。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

指南： [Updating](/zh-CN/install/updating)

## 相关内容

- [Remote gateway](/zh-CN/gateway/remote)
- [Install overview](/zh-CN/install)
