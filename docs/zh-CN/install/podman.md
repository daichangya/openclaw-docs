---
read_when:
    - 你希望使用 Podman 而不是 Docker 来运行容器化的 Gateway 网关
summary: 在无 root 的 Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-04-23T06:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

在无 root 的 Podman 容器中运行 OpenClaw Gateway 网关，并由你当前的非 root 用户进行管理。

推荐的模型是：

- Podman 运行 Gateway 网关容器。
- 你主机上的 `openclaw` CLI 是控制平面。
- 持久状态默认存储在主机上的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 前置条件

- 以无 root 模式运行的 **Podman**
- 已在主机上安装 **OpenClaw CLI**
- **可选：** 如果你希望使用 Quadlet 管理自动启动，需要 `systemd --user`
- **可选：** 仅当你希望在无头主机上使用 `loginctl enable-linger "$(whoami)"` 实现开机持久运行时，才需要 `sudo`

## 快速开始

<Steps>
  <Step title="一次性设置">
    在仓库根目录运行 `./scripts/podman/setup.sh`。
  </Step>

  <Step title="启动 Gateway 网关容器">
    使用 `./scripts/run-openclaw-podman.sh launch` 启动容器。
  </Step>

  <Step title="在容器内运行新手引导">
    运行 `./scripts/run-openclaw-podman.sh launch setup`，然后打开 `http://127.0.0.1:18789/`。
  </Step>

  <Step title="从主机 CLI 管理正在运行的容器">
    设置 `OPENCLAW_CONTAINER=openclaw`，然后从主机使用普通的 `openclaw` 命令。
  </Step>
</Steps>

设置详情：

- `./scripts/podman/setup.sh` 默认会在你的无 root Podman 存储中构建 `openclaw:local`，或者如果你设置了 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，则使用它指定的镜像。
- 如果 `~/.openclaw/openclaw.json` 不存在，它会创建该文件，并写入 `gateway.mode: "local"`。
- 如果 `~/.openclaw/.env` 不存在，它会创建该文件，并写入 `OPENCLAW_GATEWAY_TOKEN`。
- 对于手动启动，辅助脚本只会从 `~/.openclaw/.env` 读取一个较小的 Podman 相关键 allowlist，并将显式运行时环境变量传递给容器；它不会把整个 env 文件交给 Podman。

由 Quadlet 管理的设置：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 仅适用于 Linux，因为它依赖 systemd 用户服务。

你也可以设置 `OPENCLAW_PODMAN_QUADLET=1`。

可选的构建/设置环境变量：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` —— 使用已有/已拉取的镜像，而不是构建 `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` —— 在镜像构建期间安装额外的 apt 软件包
- `OPENCLAW_EXTENSIONS` —— 在构建时预安装插件依赖

容器启动：

```bash
./scripts/run-openclaw-podman.sh launch
```

该脚本会以你当前的 uid/gid，使用 `--userns=keep-id` 启动容器，并将你的 OpenClaw 状态目录 bind-mount 到容器中。

新手引导：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/`，并使用 `~/.openclaw/.env` 中的令牌。

主机 CLI 默认值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

这样，下面这些命令就会自动在该容器内运行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能会让浏览器在 Gateway 网关看来不像本地访问。
如果启动后 Control UI 报告设备认证错误，请参阅
[Podman + Tailscale](#podman--tailscale) 中的 Tailscale 指南。

<a id="podman--tailscale"></a>

## Podman + Tailscale

若要使用 HTTPS 或远程浏览器访问，请遵循主要的 Tailscale 文档。

Podman 特别说明：

- 保持 Podman 发布主机为 `127.0.0.1`。
- 优先使用主机管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器设备认证上下文不稳定，请使用 Tailscale 访问，而不是临时性的本地隧道变通方案。

请参见：

- [Tailscale](/zh-CN/gateway/tailscale)
- [Control UI](/zh-CN/web/control-ui)

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，设置程序会在以下位置安装一个 Quadlet 文件：

```bash
~/.config/containers/systemd/openclaw.container
```

常用命令：

- **启动：** `systemctl --user start openclaw.service`
- **停止：** `systemctl --user stop openclaw.service`
- **状态：** `systemctl --user status openclaw.service`
- **日志：** `journalctl --user -u openclaw.service -f`

编辑 Quadlet 文件后：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

若要在 SSH/无头主机上实现开机持久运行，请为你的当前用户启用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 配置、env 和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **令牌文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 会将主机状态 bind-mount 到容器中：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

默认情况下，这些是主机目录，而不是匿名容器状态，因此
`openclaw.json`、每个智能体的 `auth-profiles.json`、渠道/提供商状态、
会话以及工作区在容器替换后仍会保留。
Podman 设置还会为发布的 Gateway 网关端口上的 `127.0.0.1` 和 `localhost` 预填充 `gateway.controlUi.allowedOrigins`，从而让本地仪表板在容器使用非 loopback 绑定时仍能正常工作。

对手动启动器有用的环境变量：

- `OPENCLAW_PODMAN_CONTAINER` —— 容器名称（默认为 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` —— 要运行的镜像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` —— 映射到容器 `18789` 的主机端口
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` —— 映射到容器 `18790` 的主机端口
- `OPENCLAW_PODMAN_PUBLISH_HOST` —— 已发布端口的主机接口；默认为 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` —— 容器内的 Gateway 网关绑定模式；默认为 `lan`
- `OPENCLAW_PODMAN_USERNS` —— `keep-id`（默认）、`auto` 或 `host`

手动启动器在最终确定容器/镜像默认值之前会读取 `~/.openclaw/.env`，因此你可以将这些值持久保存在那里。

如果你使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请对 `./scripts/podman/setup.sh` 和后续的 `./scripts/run-openclaw-podman.sh launch` 命令设置相同的变量。仓库本地启动器不会在不同 shell 之间持久保存自定义路径覆盖值。

Quadlet 说明：

- 生成的 Quadlet 服务有意保持固定且加固的默认形态：发布端口为 `127.0.0.1`、容器内使用 `--bind lan`，以及 `keep-id` 用户命名空间。
- 它固定设置 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它会同时发布 `127.0.0.1:18789:18789`（gateway）和 `127.0.0.1:18790:18790`（bridge）。
- 它将 `~/.openclaw/.env` 作为运行时 `EnvironmentFile` 读取，用于获取 `OPENCLAW_GATEWAY_TOKEN` 等值，但不会使用手动启动器中 Podman 特定覆盖项的 allowlist。
- 如果你需要自定义发布端口、发布主机或其他容器运行标志，请使用手动启动器，或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 常用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **删除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开仪表板 URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 查看健康状态/状态：** `openclaw gateway status --deep`（RPC 探测 + 额外
  服务扫描）

## 故障排除

- **配置或工作区出现权限被拒绝（EACCES）：** 容器默认使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 运行。请确保主机上的配置/工作区路径归你当前用户所有。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：** 请确保 `~/.openclaw/openclaw.json` 存在，并设置了 `gateway.mode="local"`。如果文件不存在，`scripts/podman/setup.sh` 会创建它。
- **容器 CLI 命令命中了错误目标：** 显式使用 `openclaw --container <name> ...`，或在你的 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 配合 `--container` 失败：** 这是预期行为。请重建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务无法启动：** 运行 `systemctl --user daemon-reload`，然后运行 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要执行 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止 bind mount：** 保持默认挂载行为不变；当 Linux 上 SELinux 处于 enforcing 或 permissive 模式时，启动器会自动添加 `:Z`。

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Gateway 后台进程](/zh-CN/gateway/background-process)
- [Gateway 故障排除](/zh-CN/gateway/troubleshooting)
