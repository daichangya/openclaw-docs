---
read_when:
    - 查找 Linux 配套应用状态
    - 规划平台覆盖范围或贡献方案
    - 调试 VPS 或容器上的 Linux OOM kill 或 exit 137
summary: Linux 支持 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-04-24T03:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway 网关在 Linux 上受到完全支持。**推荐使用 Node 作为运行时**。
不建议 Gateway 网关使用 Bun（会有 WhatsApp / Telegram 问题）。

原生 Linux 配套应用已在规划中。如果你想帮助构建一个，欢迎贡献。

## 面向初学者的快速路径（VPS）

1. 安装 Node 24（推荐；Node 22 LTS，目前 `22.14+` 也仍可兼容使用）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 在你的笔记本上运行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，并使用已配置的共享密钥进行认证（默认是令牌；如果你设置了 `gateway.auth.mode: "password"`，则使用密码）

完整 Linux 服务器指南： [Linux 服务器](/zh-CN/vps)。分步 VPS 示例： [exe.dev](/zh-CN/install/exe-dev)

## 安装

- [入门指南](/zh-CN/start/getting-started)
- [安装与更新](/zh-CN/install/updating)
- 可选流程：[Bun（实验性）](/zh-CN/install/bun)、[Nix](/zh-CN/install/nix)、[Docker](/zh-CN/install/docker)

## Gateway 网关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [配置](/zh-CN/gateway/configuration)

## Gateway 网关服务安装（CLI）

使用以下任一方式：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

在提示时选择 **Gateway service**。

修复 / 迁移：

```
openclaw doctor
```

## 系统控制（systemd 用户单元）

OpenClaw 默认安装 systemd **用户**服务。对于共享或常驻服务器，请使用 **系统**服务。`openclaw gateway install` 和 `openclaw onboard --install-daemon` 已经会为你生成当前规范的 unit；只有在你需要自定义系统 / 服务管理器设置时，才需要手动编写。完整服务指引位于 [Gateway 网关运行手册](/zh-CN/gateway)。

最小配置：

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
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

启用它：

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力与 OOM kill

在 Linux 上，当宿主机、VM 或容器 cgroup 内存耗尽时，内核会选择一个 OOM 受害者。Gateway 网关可能是一个不理想的受害者，因为它持有长期会话和渠道连接。因此，OpenClaw 会在可能的情况下优先让瞬时子进程在 Gateway 网关之前被杀掉。

对于符合条件的 Linux 子进程启动路径，OpenClaw 会通过一个简短的 `/bin/sh` 包装器来启动子进程，该包装器会先将子进程自己的 `oom_score_adj` 提高到 `1000`，然后再 `exec` 真正的命令。这是一个非特权操作，因为子进程只是提高了自己被 OOM kill 的可能性。

覆盖的子进程界面包括：

- 由 supervisor 管理的命令子进程，
- PTY shell 子进程，
- MCP stdio 服务器子进程，
- 由 OpenClaw 启动的浏览器 / Chrome 进程。

该包装器仅适用于 Linux，并且在 `/bin/sh` 不可用时会跳过。如果子进程环境设置了 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、`no` 或 `off`，也会跳过。

要验证某个子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

对于受覆盖的子进程，预期值是 `1000`。Gateway 网关进程应保持其正常分数，通常是 `0`。

这并不能替代常规的内存调优。如果某个 VPS 或容器反复杀掉子进程，请增加内存限制、降低并发度，或添加更强的资源控制，例如 systemd `MemoryMax=` 或容器级内存限制。

## 相关内容

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [Raspberry Pi](/zh-CN/install/raspberry-pi)
