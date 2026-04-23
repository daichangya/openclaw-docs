---
read_when:
    - 你想使用云托管沙箱，而不是本地 Docker
    - 你正在设置 OpenShell 插件
    - 你需要在 mirror 和 remote 工作区模式之间进行选择
summary: 将 OpenShell 用作 OpenClaw 智能体的托管沙箱后端
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T20:49:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47989083fa97a6645799fde88e840eec747ebfcf06e0bbddf535f5d78ed7e87d
    source_path: gateway/openshell.md
    workflow: 15
---

OpenShell 是 OpenClaw 的一个托管沙箱后端。OpenClaw 不再在本地运行 Docker
容器，而是将沙箱生命周期委托给 `openshell` CLI，
由它通过基于 SSH 的命令执行来预配远程环境。

OpenShell 插件复用了与通用 [SSH 后端](/zh-CN/gateway/sandboxing#ssh-backend) 相同的核心 SSH 传输和远程文件系统
桥接。它增加了 OpenShell 特有的生命周期管理（`sandbox create/get/delete`、`sandbox ssh-config`）
以及可选的 `mirror` 工作区模式。

## 前置条件

- 已安装 `openshell` CLI 且位于 `PATH` 中（或通过
  `plugins.entries.openshell.config.command` 设置自定义路径）
- 拥有可访问沙箱的 OpenShell 账户
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

2. 重启 Gateway 网关。下一次智能体轮次中，OpenClaw 会创建一个 OpenShell
   沙箱，并通过它路由工具执行。

3. 验证：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作区模式

这是使用 OpenShell 时最重要的决策。

### `mirror`

当你希望**本地
工作区保持为规范来源**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
- 文件工具仍通过沙箱桥接运行，但在每轮之间，本地工作区
  仍然是事实来源。

最适合：

- 你会在 OpenClaw 外部本地编辑文件，并希望这些更改能自动显示在
  沙箱中。
- 你希望 OpenShell 沙箱的行为尽可能像 Docker 后端。
- 你希望主机工作区在每次 exec 轮次后反映沙箱写入。

权衡：每次 exec 前后都会产生额外同步成本。

### `remote`

当你希望**OpenShell 工作区成为规范来源**时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 首次创建沙箱时，OpenClaw 会从
  本地工作区一次性初始化远程工作区。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 都会
  直接作用于远程 OpenShell 工作区。
- OpenClaw **不会**将远程更改同步回本地工作区。
- 提示阶段的媒体读取仍可正常工作，因为文件和媒体工具是通过
  沙箱桥接读取的。

最适合：

- 沙箱应主要存在于远程侧。
- 你希望每轮同步开销更低。
- 你不希望主机本地编辑静默覆盖远程沙箱状态。

重要：如果你在初始种子之后于主机上、OpenClaw 外部编辑文件，
远程沙箱**不会**看到这些更改。请使用
`openclaw sandbox recreate` 重新播种。

### 如何选择模式

|                          | `mirror` | `remote` |
| ------------------------ | -------------------------- | ------------------------- |
| **规范工作区** | 本地主机 | 远程 OpenShell |
| **同步方向** | 双向（每次 exec） | 一次性播种 |
| **每轮开销** | 更高（上传 + 下载） | 更低（直接远程操作） |
| **本地编辑可见？** | 是，在下一次 exec 时可见 | 否，直到 recreate |
| **最适合** | 开发工作流 | 长时间运行的智能体、CI |

## 配置参考

所有 OpenShell 配置都位于 `plugins.entries.openshell.config` 下：

| 键 | 类型 | 默认值 | 描述 |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode` | `"mirror"` 或 `"remote"` | `"mirror"` | 工作区同步模式 |
| `command` | `string` | `"openshell"` | `openshell` CLI 的路径或名称 |
| `from` | `string` | `"openclaw"` | 首次创建时的沙箱来源 |
| `gateway` | `string` | — | OpenShell gateway 名称（`--gateway`） |
| `gatewayEndpoint` | `string` | — | OpenShell gateway 端点 URL（`--gateway-endpoint`） |
| `policy` | `string` | — | 用于创建沙箱的 OpenShell policy ID |
| `providers` | `string[]` | `[]` | 创建沙箱时附加的提供商名称 |
| `gpu` | `boolean` | `false` | 请求 GPU 资源 |
| `autoProviders` | `boolean` | `true` | 在创建沙箱时传递 `--auto-providers` |
| `remoteWorkspaceDir` | `string` | `"/sandbox"` | 沙箱内的主要可写工作区 |
| `remoteAgentWorkspaceDir` | `string` | `"/agent"` | 智能体工作区挂载路径（用于只读访问） |
| `timeoutSeconds` | `number` | `120` | `openshell` CLI 操作的超时时间 |

沙箱级设置（`mode`、`scope`、`workspaceAccess`）与其他后端一样，配置在
`agents.defaults.sandbox` 下。完整矩阵请参见
[Sandboxing](/zh-CN/gateway/sandboxing)。

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

### 使用自定义 gateway 的按智能体 OpenShell

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

# 检查实际生效的策略
openclaw sandbox explain

# 重新创建（删除远程工作区，并在下次使用时重新播种）
openclaw sandbox recreate --all
```

对于 `remote` 模式，**recreate 尤其重要**：它会删除该范围下的规范
远程工作区。下次使用时会从
本地工作区播种一个全新的远程工作区。

对于 `mirror` 模式，recreate 主要用于重置远程执行环境，因为
本地工作区仍然是规范来源。

### 何时执行 recreate

在更改以下任一项后，请执行 recreate：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 安全加固

OpenShell 会固定工作区根 fd，并在每次读取前重新检查沙箱身份，因此符号链接替换或重新挂载的工作区都无法将读取重定向到预期远程工作区之外。

## 当前限制

- OpenShell 后端不支持沙箱浏览器。
- `sandbox.docker.binds` 不适用于 OpenShell。
- `sandbox.docker.*` 下特定于 Docker 的运行时控制项仅适用于 Docker
  后端。

## 工作原理

1. OpenClaw 调用 `openshell sandbox create`（根据配置带上 `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` 标志）。
2. OpenClaw 调用 `openshell sandbox ssh-config <name>` 获取该沙箱的 SSH 连接
   详情。
3. 核心将 SSH 配置写入临时文件，并使用与通用 SSH 后端相同的远程文件系统桥接打开 SSH 会话。
4. 在 `mirror` 模式下：exec 前将本地同步到远程，运行，再在 exec 后同步回本地。
5. 在 `remote` 模式下：创建时只播种一次，之后直接对远程
   工作区进行操作。

## 另请参见

- [Sandboxing](/zh-CN/gateway/sandboxing) -- 模式、范围和后端对比
- [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试被阻止的工具
- [Multi-Agent Sandbox and Tools](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖
- [Sandbox CLI](/zh-CN/cli/sandbox) -- `openclaw sandbox` 命令
