---
read_when:
    - 你想使用 Podman 而不是 Docker 来运行容器化 Gateway 网关
summary: 在 rootless Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-04-23T20:52:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

在 rootless Podman 容器中运行 OpenClaw Gateway 网关，并由你当前的非 root 用户管理。

推荐的模型是：

- Podman 运行 gateway 容器。
- 你主机上的 `openclaw` CLI 是控制平面。
- 持久化状态默认保存在主机上的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 前置条件

- 以 rootless 模式运行的 **Podman**
- 安装在主机上的 **OpenClaw CLI**
- **可选：** 如果你想使用 Quadlet 托管自动启动，需要 `systemd --user`
- **可选：** 仅当你希望在无头主机上使用 `loginctl enable-linger "$(whoami)"` 实现开机持久化时，才需要 `sudo`

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

  <Step title="从主机 CLI 管理运行中的容器">
    设置 `OPENCLAW_CONTAINER=openclaw`，然后在主机上使用普通的 `openclaw` 命令。
  </Step>
</Steps>

设置详情：

- `./scripts/podman/setup.sh` 默认会在你的 rootless Podman 存储中构建 `openclaw:local`，或者如果你设置了 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，则会使用它们。
- 如果缺失，它会创建 `~/.openclaw/openclaw.json`，并写入 `gateway.mode: "local"`。
- 如果缺失，它会创建 `~/.openclaw/.env`，并写入 `OPENCLAW_GATEWAY_TOKEN`。
- 对于手动启动，辅助脚本只会从 `~/.openclaw/.env` 中读取一小部分与 Podman 相关的 allowlist 键，并将显式运行时环境变量传给容器；它不会把整个 env 文件直接交给 Podman。

Quadlet 托管设置：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是仅限 Linux 的选项，因为它依赖 systemd 用户服务。

你也可以设置 `OPENCLAW_PODMAN_QUADLET=1`。

可选的构建/设置环境变量：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` —— 使用现有/已拉取镜像，而不是构建 `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` —— 在镜像构建期间安装额外的 apt 包
- `OPENCLAW_EXTENSIONS` —— 在构建时预安装插件依赖

容器启动：

```bash
./scripts/run-openclaw-podman.sh launch
```

该脚本会以你当前的 uid/gid 和 `--userns=keep-id` 启动容器，并将你的 OpenClaw 状态通过 bind mount 挂载进容器。

新手引导：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/`，并使用 `~/.openclaw/.env` 中的令牌。

主机 CLI 默认值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

然后以下命令会自动在该容器中运行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # 包括额外服务扫描
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能会让浏览器对 gateway 来说看起来不像本地浏览器。
如果启动后控制 UI 报告 device-auth 错误，请使用
[Podman + Tailscale](#podman--tailscale) 中的 Tailscale 指引。

<a id="podman--tailscale"></a>

## Podman + Tailscale

对于 HTTPS 或远程浏览器访问，请遵循主 Tailscale 文档。

Podman 特定说明：

- 保持 Podman 发布主机为 `127.0.0.1`。
- 优先使用由主机托管的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器 device-auth 上下文不可靠，请使用 Tailscale 访问，而不是临时性的本地隧道变通方案。

请参阅：

- [Tailscale](/zh-CN/gateway/tailscale)
- [控制 UI](/zh-CN/web/control-ui)

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，setup 会在以下位置安装一个 Quadlet 文件：

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

若要在 SSH/无头主机上实现开机持久化，请为你当前用户启用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 配置、环境变量和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **令牌文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 都会将主机状态通过 bind mount 挂载进容器：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

默认情况下，这些都是主机目录，而不是匿名容器状态，因此
`openclaw.json`、每智能体的 `auth-profiles.json`、渠道/提供商状态、
会话以及工作区都能在容器替换后保留。
Podman 设置还会为 `127.0.0.1` 和 `localhost` 在已发布的 gateway 端口上初始化 `gateway.controlUi.allowedOrigins`，以便本地仪表盘能够与容器的非 loopback 绑定配合工作。

手动启动器有用的环境变量：

- `OPENCLAW_PODMAN_CONTAINER` —— 容器名称（默认是 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` —— 要运行的镜像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` —— 映射到容器 `18789` 的主机端口
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` —— 映射到容器 `18790` 的主机端口
- `OPENCLAW_PODMAN_PUBLISH_HOST` —— 已发布端口的主机接口；默认是 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` —— 容器内的 gateway 绑定模式；默认是 `lan`
- `OPENCLAW_PODMAN_USERNS` —— `keep-id`（默认）、`auto` 或 `host`

手动启动器会在确定容器/镜像默认值之前读取 `~/.openclaw/.env`，因此你可以将这些值持久化在那里。

如果你使用了非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请确保在 `./scripts/podman/setup.sh` 和后续的 `./scripts/run-openclaw-podman.sh launch` 命令中都设置相同变量。仓库内的启动器不会在不同 shell 会话之间持久化自定义路径覆盖项。

Quadlet 说明：

- 生成的 Quadlet 服务有意保持固定、加固后的默认形态：发布端口为 `127.0.0.1`，容器内使用 `--bind lan`，以及 `keep-id` 用户命名空间。
- 它固定设置 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它会同时发布 `127.0.0.1:18789:18789`（gateway）和 `127.0.0.1:18790:18790`（bridge）。
- 它会把 `~/.openclaw/.env` 读取为运行时 `EnvironmentFile`，用于如 `OPENCLAW_GATEWAY_TOKEN` 之类的值，但不会消费手动启动器的 Podman 专用覆盖 allowlist。
- 如果你需要自定义发布端口、发布主机或其他容器运行标志，请使用手动启动器，或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 常用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开仪表盘 URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 查看健康/状态：** `openclaw gateway status --deep`（RPC 探测 + 额外服务扫描）

## 故障排除

- **配置或工作区出现 Permission denied（EACCES）：** 容器默认使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 运行。请确保主机上的配置/工作区路径属于你当前用户。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：** 请确保 `~/.openclaw/openclaw.json` 存在，并设置了 `gateway.mode="local"`。如果缺失，`scripts/podman/setup.sh` 会创建它。
- **容器 CLI 命令命中了错误目标：** 请显式使用 `openclaw --container <name> ...`，或在 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 在 `--container` 下失败：** 这是预期行为。请重新构建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务未启动：** 运行 `systemctl --user daemon-reload`，然后执行 `systemctl --user start openclaw.service`。在无头系统上，你还可能需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止 bind mounts：** 保持默认挂载行为不变；当 SELinux 处于 enforcing 或 permissive 模式时，启动器会在 Linux 上自动添加 `:Z`。

## 相关内容

- [Docker](/zh-CN/install/docker)
- [Gateway 网关后台进程](/zh-CN/gateway/background-process)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
