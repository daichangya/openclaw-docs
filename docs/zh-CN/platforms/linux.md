---
read_when:
    - 寻找 Linux 配套应用状态
    - 规划平台覆盖范围或贡献
    - 在 VPS 或容器上调试 Linux OOM 被杀或退出码 137
summary: Linux 支持 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-04-23T04:54:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Linux 应用

Gateway 网关在 Linux 上得到完全支持。**推荐使用 Node 作为运行时**。
不建议 Gateway 网关使用 Bun（存在 WhatsApp/Telegram 相关 bug）。

原生 Linux 配套应用已在规划中。如果你想帮助构建一个，欢迎贡献。

## 面向初学者的快速路径（VPS）

1. 安装 Node 24（推荐；Node 22 LTS，目前 `22.14+`，出于兼容性仍然可用）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 在你的笔记本电脑上运行：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，并使用已配置的共享密钥进行认证（默认是 token；如果你设置了 `gateway.auth.mode: "password"`，则使用 password）

完整的 Linux 服务器指南：[Linux 服务器](/zh-CN/vps)。VPS 分步示例：[exe.dev](/zh-CN/install/exe-dev)

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

或者：

```
openclaw gateway install
```

或者：

```
openclaw configure
```

在提示时选择 **Gateway 网关服务**。

修复/迁移：

```
openclaw doctor
```

## 系统控制（systemd 用户单元）

默认情况下，OpenClaw 会安装一个 systemd **用户**服务。对于共享服务器或始终在线的服务器，请使用 **系统**服务。`openclaw gateway install` 和 `openclaw onboard --install-daemon` 已经会为你生成当前规范的单元文件；只有在你需要自定义系统/服务管理器设置时，才需要手动编写。完整的服务说明见 [Gateway 网关运行手册](/zh-CN/gateway)。

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

## 内存压力与 OOM 被杀

在 Linux 上，当主机、虚拟机或容器的 cgroup 内存耗尽时，内核会选择一个 OOM 受害者。Gateway 网关可能是一个不理想的受害者，因为它持有长期存在的会话和渠道连接。因此，OpenClaw 会尽可能优先让短暂的子进程在 Gateway 网关之前被杀死。

对于符合条件的 Linux 子进程创建，OpenClaw 会通过一个简短的 `/bin/sh` 包装器启动子进程，该包装器会将子进程自身的 `oom_score_adj` 提高到 `1000`，然后通过 `exec` 执行真实命令。这是一个无需特权的操作，因为子进程只是在提高其自身被 OOM 杀死的概率。

覆盖的子进程入口包括：

- 由 supervisor 管理的命令子进程，
- PTY shell 子进程，
- MCP stdio 服务器子进程，
- 由 OpenClaw 启动的浏览器/Chrome 进程。

该包装器仅适用于 Linux；如果 `/bin/sh` 不可用，则会跳过。
如果子进程环境变量设置了 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、`no` 或 `off`，也会跳过。

要验证某个子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

对于受覆盖的子进程，预期值为 `1000`。Gateway 网关进程应保持其正常分值，通常为 `0`。

这不能替代常规的内存调优。如果 VPS 或容器反复杀死子进程，请提高内存限制、降低并发，或增加更强的资源控制，例如 systemd 的 `MemoryMax=` 或容器级内存限制。
