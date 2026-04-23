---
read_when:
    - 你希望通过 Tailscale + CoreDNS 实现广域发现（DNS-SD）
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` 的 CLI 参考（广域发现辅助工具）'
title: DNS
x-i18n:
    generated_at: "2026-04-23T20:43:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5205cd835b7bd6e873b473d40b94fbc764a9ad8a5184111f9866390c6d0c4d53
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

用于广域发现（Tailscale + CoreDNS）的 DNS 辅助工具。目前主要面向 macOS + Homebrew CoreDNS。

相关内容：

- Gateway 网关发现：[设备发现](/zh-CN/gateway/discovery)
- 广域发现配置：[配置](/zh-CN/gateway/configuration)

## 设置

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

用于规划或应用 CoreDNS 设置，以实现单播 DNS-SD 发现。

选项：

- `--domain <domain>`：广域发现域名（例如 `openclaw.internal`）
- `--apply`：安装或更新 CoreDNS 配置并重启服务（需要 `sudo`；仅支持 macOS）

显示内容：

- 已解析的发现域名
- zone 文件路径
- 当前 tailnet IP
- 推荐的 `openclaw.json` 发现配置
- 需要设置的 Tailscale Split DNS nameserver/domain 值

说明：

- 不带 `--apply` 时，该命令仅作为规划辅助工具，并打印推荐设置。
- 如果省略 `--domain`，OpenClaw 会使用配置中的 `discovery.wideArea.domain`。
- `--apply` 当前仅支持 macOS，并要求使用 Homebrew CoreDNS。
- `--apply` 会在需要时初始化 zone 文件，确保存在 CoreDNS import stanza，并重启 `coredns` brew 服务。
