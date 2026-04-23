---
read_when:
    - 你想使用云端托管沙箱，而不是本地 Docker
    - 你正在设置 OpenShell 插件
    - 你需要在 mirror 和 remote workspace 模式之间做出选择
summary: 将 OpenShell 用作 OpenClaw 智能体的托管沙箱后端
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T07:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f93a8350fd48602bc535ec0480d0ed1665e558b37cc23c820ac90097862abd23
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell 是 OpenClaw 的托管沙箱后端。OpenClaw 不再在本地运行 Docker 容器，而是将沙箱生命周期委托给 `openshell` CLI，由它通过基于 SSH 的命令执行来预配远程环境。

OpenShell 插件复用了与通用 [SSH 后端](/zh-CN/gateway/sandboxing#ssh-backend) 相同的核心 SSH 传输和远程文件系统桥接。它增加了 OpenShell 专用的生命周期管理（`sandbox create/get/delete`、`sandbox ssh-config`）以及可选的 `mirror` 工作区模式。

## 前提条件

- 已安装 `openshell` CLI，并且在 `PATH` 中可用（或通过 `plugins.entries.openshell.config.command` 设置自定义路径）
- 拥有具备沙箱访问权限的 OpenShell 账户
- OpenClaw Gateway 网关正在宿主机上运行

## 快速开始

1. 启用插件并设置沙箱后端：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. 重启 Gateway 网关。在下一次智能体轮次时，OpenClaw 会创建一个 OpenShell 沙箱，并通过它路由工具执行。

3. 验证：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作区模式

这是使用 OpenShell 时最重要的决定。

### `mirror`

当你希望**本地工作区保持为权威版本**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
- 文件工具仍然通过沙箱桥接运行，但在轮次之间，本地工作区仍然是事实来源。

最适合：

- 你会在 OpenClaw 之外于本地编辑文件，并希望这些更改自动在沙箱中可见。
- 你希望 OpenShell 沙箱的行为尽可能接近 Docker 后端。
- 你希望宿主工作区在每次 `exec` 轮次之后反映沙箱中的写入结果。

权衡：每次 `exec` 前后都会增加额外的同步成本。

### `remote`

当你希望**OpenShell 工作区成为权威版本**时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 首次创建沙箱时，OpenClaw 会将本地工作区一次性初始化到远程工作区。
- 此后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 会直接对远程 OpenShell 工作区进行操作。
- OpenClaw **不会**将远程更改同步回本地工作区。
- 提示阶段的媒体读取仍然有效，因为文件和媒体工具会通过沙箱桥接读取。

最适合：

- 沙箱应主要存在于远程侧。
- 你希望降低每轮的同步开销。
- 你不希望宿主本地编辑静默覆盖远程沙箱状态。

重要：如果你在初次初始化之后于宿主机上在 OpenClaw 之外编辑文件，远程沙箱**不会**看到这些更改。请使用 `openclaw sandbox recreate` 重新初始化。

### 如何选择模式

|                          | `mirror`                  | `remote`                 |
| ------------------------ | ------------------------- | ------------------------ |
| **权威工作区**           | 本地宿主                  | 远程 OpenShell           |
| **同步方向**             | 双向（每次 `exec`）       | 一次性初始化             |
| **每轮开销**             | 更高（上传 + 下载）       | 更低（直接远程操作）     |
| **本地编辑是否可见？**   | 是，下一次 `exec` 时可见  | 否，直到 recreate        |
| **最适合**               | 开发工作流                | 长时间运行的智能体、CI   |

## 配置参考

所有 OpenShell 配置都位于 `plugins.entries.openshell.config` 下：

| 键                        | 类型                     | 默认值        | 描述                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作区同步模式                                        |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI 的路径或名称                          |
| `from`                    | `string`                 | `"openclaw"`  | 首次创建时的沙箱来源                                  |
| `gateway`                 | `string`                 | —             | OpenShell Gateway 网关名称（`--gateway`）             |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway 网关端点 URL（`--gateway-endpoint`）|
| `policy`                  | `string`                 | —             | 用于创建沙箱的 OpenShell policy ID                    |
| `providers`               | `string[]`               | `[]`          | 创建沙箱时要附加的 provider 名称                      |
| `gpu`                     | `boolean`                | `false`       | 请求 GPU 资源                                         |
| `autoProviders`           | `boolean`                | `true`        | 创建沙箱时传递 `--auto-providers`                     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙箱内主要的可写工作区                                |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 智能体工作区挂载路径（用于只读访问）                  |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作的超时时间                        |

沙箱级设置（`mode`、`scope`、`workspaceAccess`）与其他后端一样，配置在 `agents.defaults.sandbox` 下。完整矩阵请参见[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 示例

### 最简 remote 设置

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### 启用 GPU 的 mirror 模式

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### 带自定义 Gateway 网关的按智能体 OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## 生命周期管理

OpenShell 沙箱通过常规的沙箱 CLI 进行管理：

```bash
# 列出所有沙箱运行时（Docker + OpenShell）
openclaw sandbox list

# 检查生效的策略
openclaw sandbox explain

# 重建（删除远程工作区，并在下次使用时重新初始化）
openclaw sandbox recreate --all
```

对于 `remote` 模式，**recreate 尤其重要**：它会删除该作用域下的权威远程工作区。下一次使用时，会从本地工作区重新初始化一个全新的远程工作区。

对于 `mirror` 模式，recreate 主要是重置远程执行环境，因为本地工作区仍然是权威版本。

### 何时需要 recreate

在更改以下任一项后，请执行 recreate：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 安全加固

OpenShell 沙箱辅助程序在读取远程工作区文件时，会为工作区根目录使用一个固定的文件描述符，并从该固定 fd 向上遍历祖先，而不是在每次读取时重新解析路径。再加上每次操作时的身份重检，这可以防止在单次轮次中通过符号链接替换或热切换工作区挂载，将读取重定向到预期远程工作区之外。

- 工作区根目录只打开一次并固定；后续读取会复用该 fd。
- 祖先遍历会从固定 fd 出发访问相对条目，因此无法被路径上层目录的替换所重定向。
- 每次读取前都会重检沙箱身份，因此被重建或重新分配的沙箱无法静默地从其他工作区提供文件。

## 当前限制

- OpenShell 后端不支持沙箱浏览器。
- `sandbox.docker.binds` 不适用于 OpenShell。
- `sandbox.docker.*` 下的 Docker 专用运行时参数仅适用于 Docker 后端。

## 工作原理

1. OpenClaw 调用 `openshell sandbox create`（根据配置附带 `--from`、`--gateway`、`--policy`、`--providers`、`--gpu` 标志）。
2. OpenClaw 调用 `openshell sandbox ssh-config <name>` 以获取该沙箱的 SSH 连接详情。
3. 核心会将 SSH 配置写入临时文件，并使用与通用 SSH 后端相同的远程文件系统桥接打开一个 SSH 会话。
4. 在 `mirror` 模式下：先将本地同步到远程，再执行，执行后再同步回来。
5. 在 `remote` 模式下：创建时初始化一次，之后直接操作远程工作区。

## 另请参见

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 模式、作用域和后端对比
- [沙箱 vs 工具策略 vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试被阻止的工具
- [多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖
- [沙箱 CLI](/zh-CN/cli/sandbox) -- `openclaw sandbox` 命令
