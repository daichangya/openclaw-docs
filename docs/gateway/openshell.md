---
read_when:
    - 你想使用云托管沙箱，而不是本地 Docker
    - 你正在设置 OpenShell 插件
    - 你需要在镜像模式和远程工作区模式之间做出选择
summary: 使用 OpenShell 作为 OpenClaw 智能体的托管沙箱后端
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T22:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47954cd27b4c7ef9d4268597c2846960b39b99fd03ece5dddb5055e9282366a0
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell 是 OpenClaw 的托管沙箱后端。OpenClaw 不再在本地运行 Docker
容器，而是将沙箱生命周期委托给 `openshell` CLI，由它预配远程环境并通过基于 SSH 的命令执行进行管理。

OpenShell 插件复用了与通用 [SSH 后端](/zh-CN/gateway/sandboxing#ssh-backend) 相同的核心 SSH 传输和远程文件系统桥接。它增加了 OpenShell 专属的生命周期管理（`sandbox create/get/delete`、`sandbox ssh-config`）以及可选的 `mirror` 工作区模式。

## 前置条件

- 已安装 `openshell` CLI，并可通过 `PATH` 访问（或通过
  `plugins.entries.openshell.config.command` 设置自定义路径）
- 拥有具备沙箱访问权限的 OpenShell 账户
- 主机上正在运行 OpenClaw Gateway 网关

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

2. 重启 Gateway 网关。在下一轮智能体执行时，OpenClaw 会创建一个 OpenShell
   沙箱，并通过它路由工具执行。

3. 验证：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作区模式

这是使用 OpenShell 时最重要的决策。

### `mirror`

当你希望**本地工作区保持为规范来源**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
- 文件工具仍通过沙箱桥接运行，但在各轮之间，本地工作区仍然是事实来源。

最适合：

- 你会在 OpenClaw 之外本地编辑文件，并希望这些更改自动在沙箱中可见。
- 你希望 OpenShell 沙箱的行为尽可能接近 Docker 后端。
- 你希望主机工作区在每次 exec 轮次后反映沙箱写入结果。

代价：每次 exec 前后都会产生额外的同步开销。

### `remote`

当你希望**OpenShell 工作区成为规范来源**时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 当沙箱首次创建时，OpenClaw 会从本地工作区向远程工作区进行一次初始化填充。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 会直接对远程 OpenShell 工作区操作。
- OpenClaw **不会** 将远程更改同步回本地工作区。
- 提示词阶段的媒体读取仍然可用，因为文件和媒体工具会通过沙箱桥接读取。

最适合：

- 沙箱应主要存在于远程侧。
- 你希望降低每轮同步开销。
- 你不希望主机本地编辑悄悄覆盖远程沙箱状态。

重要：如果你在初次填充之后于主机上、在 OpenClaw 之外编辑文件，
远程沙箱**不会**看到这些变化。请使用
`openclaw sandbox recreate` 重新填充。

### 选择模式

|                          | `mirror`                  | `remote`                  |
| ------------------------ | ------------------------- | ------------------------- |
| **规范工作区**           | 本地主机                  | 远程 OpenShell            |
| **同步方向**             | 双向（每次 exec）         | 一次性填充                |
| **每轮开销**             | 更高（上传 + 下载）       | 更低（直接远程操作）      |
| **本地编辑是否可见？**   | 是，在下一次 exec 时可见  | 否，直到 recreate         |
| **最适合**               | 开发工作流                | 长时间运行的智能体、CI    |

## 配置参考

所有 OpenShell 配置都位于 `plugins.entries.openshell.config` 下：

| 键                        | 类型                     | 默认值        | 描述                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作区同步模式                                        |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI 的路径或名称                          |
| `from`                    | `string`                 | `"openclaw"`  | 首次创建时的沙箱来源                                  |
| `gateway`                 | `string`                 | —             | OpenShell Gateway 网关名称（`--gateway`）             |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway 网关端点 URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | 用于创建沙箱的 OpenShell policy ID                    |
| `providers`               | `string[]`               | `[]`          | 创建沙箱时附加的提供商名称                            |
| `gpu`                     | `boolean`                | `false`       | 请求 GPU 资源                                         |
| `autoProviders`           | `boolean`                | `true`        | 创建沙箱时传递 `--auto-providers`                     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙箱内主要的可写工作区                                |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 智能体工作区挂载路径（用于只读访问）                  |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作的超时时间                        |

沙箱级设置（`mode`、`scope`、`workspaceAccess`）与其他后端一样，配置在
`agents.defaults.sandbox` 下。完整矩阵请参见
[沙箱隔离](/zh-CN/gateway/sandboxing)。

## 示例

### 最小 remote 设置

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

### 带 GPU 的 mirror 模式

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

OpenShell 沙箱通过常规沙箱 CLI 进行管理：

```bash
# 列出所有沙箱运行时（Docker + OpenShell）
openclaw sandbox list

# 检查生效策略
openclaw sandbox explain

# 重建（删除远程工作区，并在下次使用时重新填充）
openclaw sandbox recreate --all
```

对于 `remote` 模式，**recreate 特别重要**：它会删除该作用域下的规范远程工作区。下次使用时，会从本地工作区重新填充出一个新的远程工作区。

对于 `mirror` 模式，recreate 主要用于重置远程执行环境，因为本地工作区仍是规范来源。

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

OpenShell 会固定工作区根目录 fd，并在每次读取前重新检查沙箱身份，因此符号链接替换或重新挂载的工作区都无法将读取重定向到预期远程工作区之外的位置。

## 当前限制

- OpenShell 后端不支持沙箱浏览器。
- `sandbox.docker.binds` 不适用于 OpenShell。
- `sandbox.docker.*` 下的 Docker 专属运行时参数仅适用于 Docker
  后端。

## 工作原理

1. OpenClaw 调用 `openshell sandbox create`（根据配置传入 `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` 标志）。
2. OpenClaw 调用 `openshell sandbox ssh-config <name>` 获取该沙箱的 SSH 连接详情。
3. 核心将 SSH 配置写入临时文件，并使用与通用 SSH 后端相同的远程文件系统桥接打开 SSH 会话。
4. 在 `mirror` 模式下：exec 前将本地同步到远程，运行后再同步回来。
5. 在 `remote` 模式下：创建时只填充一次，之后直接操作远程工作区。

## 相关内容

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 模式、作用域和后端对比
- [沙箱 vs 工具策略 vs 提权](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试被阻止的工具
- [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖
- [沙箱 CLI](/zh-CN/cli/sandbox) -- `openclaw sandbox` 命令
