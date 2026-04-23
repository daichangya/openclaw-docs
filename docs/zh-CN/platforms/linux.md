---
read_when:
    - 查找 Linux 配套应用状态
    - 规划平台覆盖或贡献工作
    - 调试 VPS 或容器上的 Linux OOM kill 或 exit 137 问题
summary: Linux 支持情况 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-04-23T20:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d84ba167ea33a748010ce6ee48665fd4ed8ae102f725316806777f68629807df
    source_path: platforms/linux.md
    workflow: 15
---

Gateway 网关在 Linux 上已完全受支持。**Node 是推荐的运行时**。
不推荐将 Bun 用于 Gateway 网关（存在 WhatsApp/Telegram bug）。

原生 Linux 配套应用正在规划中。如果你想参与构建，欢迎贡献。

## 新手快速路径（VPS）

1. 安装 Node 24（推荐；Node 22 LTS，目前 `22.14+`，出于兼容性仍可使用）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 在你的笔记本上运行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，并使用已配置的共享密钥进行身份验证（默认使用令牌；如果你设置了 `gateway.auth.mode: "password"`，则使用密码）

完整 Linux 服务器指南：[Linux Server](/zh-CN/vps)。一步一步的 VPS 示例：[exe.dev](/zh-CN/install/exe-dev)

## 安装

- [入门指南](/zh-CN/start/getting-started)
- [安装与更新](/zh-CN/install/updating)
- 可选流程：[Bun（实验性）](/zh-CN/install/bun)、[Nix](/zh-CN/install/nix)、[Docker](/zh-CN/install/docker)

## Gateway 网关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [配置](/zh-CN/gateway/configuration)

## Gateway 网关服务安装（CLI）

使用以下任一方式：

```text
openclaw onboard --install-daemon
```

或者：

```text
openclaw gateway install
```

或者：

```text
openclaw configure
```

在提示时选择 **Gateway service**。

修复/迁移：

```text
openclaw doctor
```

## 系统控制（systemd 用户单元）

默认情况下，OpenClaw 安装的是 systemd **用户**服务。对于共享或常开服务器，请使用 **系统**服务。`openclaw gateway install` 和
`openclaw onboard --install-daemon` 已经会为你渲染当前规范单元；只有在你需要自定义系统/服务管理器设置时，才需要手动编写。完整服务说明见 [Gateway 网关运行手册](/zh-CN/gateway)。

最小设置：

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：

```text
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

```text
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力和 OOM kill

在 Linux 上，当主机、VM 或容器 cgroup
耗尽内存时，内核会选择一个 OOM 受害者。Gateway 网关可能会成为一个糟糕的受害者，因为它拥有长生命周期的
会话和渠道连接。因此，OpenClaw 会尽可能倾向于让短生命周期的子进程先于 Gateway 网关被杀掉。

对于符合条件的 Linux 子进程启动，OpenClaw 会通过一个简短的
`/bin/sh` 包装器启动子进程，该包装器会先将子进程自己的 `oom_score_adj` 提高到 `1000`，然后再
`exec` 真正的命令。这是一个无特权操作，因为子进程
只是提高了自身被 OOM kill 的概率。

覆盖的子进程表面包括：

- supervisor 管理的命令子进程，
- PTY shell 子进程，
- MCP stdio server 子进程，
- 由 OpenClaw 启动的浏览器/Chrome 进程。

该包装器仅适用于 Linux；当 `/bin/sh` 不可用时会跳过。
如果子进程环境中设置了 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、
`no` 或 `off`，也会跳过。

验证某个子进程的方法：

```bash
cat /proc/<child-pid>/oom_score_adj
```

对于被覆盖的子进程，预期值是 `1000`。Gateway 网关进程应保持其正常分值，通常为 `0`。

这不能替代常规的内存调优。如果某个 VPS 或容器反复杀死子进程，请提高内存限制、降低并发度，或添加更强的资源控制，例如 systemd `MemoryMax=` 或容器级内存限制。
