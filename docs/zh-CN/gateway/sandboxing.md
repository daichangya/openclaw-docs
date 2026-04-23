---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: OpenClaw 沙箱隔离的工作方式：模式、作用域、工作区访问和镜像
title: 沙箱隔离
x-i18n:
    generated_at: "2026-04-23T20:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d580b6d6a16053f350b3ab13fca9c1a563736b49c7ed15d4ba0af2a7ad479237
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw 可以让**工具在沙箱后端中运行**，以降低影响范围。  
这项功能是**可选的**，由配置控制（`agents.defaults.sandbox` 或
`agents.list[].sandbox`）。如果关闭沙箱隔离，工具会直接在宿主机上运行。
Gateway 网关本身始终运行在宿主机上；启用后，工具执行会在隔离的沙箱中进行。

这并不是完美的安全边界，但当模型做出愚蠢操作时，它确实能显著限制文件系统
和进程访问。

## 哪些内容会被沙箱隔离

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱浏览器（`agents.defaults.sandbox.browser`）。
  - 默认情况下，当浏览器工具需要时，沙箱浏览器会自动启动（确保 CDP 可达）。
    可通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
  - 默认情况下，沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`），而不是全局 `bridge` 网络。
    可通过 `agents.defaults.sandbox.browser.network` 配置。
  - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 可使用 CIDR 允许列表限制容器边缘的 CDP 入站访问（例如 `172.21.0.1/32`）。
  - noVNC 观察者访问默认受密码保护；OpenClaw 会输出一个短期有效的 token URL，该 URL 会提供一个本地 bootstrap 页面，并使用 URL fragment（而非 query/header 日志）在 noVNC 中打开密码。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱会话显式以宿主机浏览器为目标。
  - 可选允许列表可对 `target: "custom"` 进行门控：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

以下内容不会被沙箱隔离：

- Gateway 网关进程本身。
- 任何被显式允许在沙箱外运行的工具（例如 `tools.elevated`）。
  - **Elevated exec 会绕过沙箱隔离，并使用配置的 escape path（默认是 `gateway`，或者当 exec 目标为 `node` 时使用 `node`）。**
  - 如果关闭了沙箱隔离，`tools.elevated` 不会改变执行方式（本来就在宿主机上运行）。参见 [Elevated Mode](/zh-CN/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱隔离：

- `"off"`：不使用沙箱隔离。
- `"non-main"`：只对**非主**会话启用沙箱隔离（如果你希望普通聊天仍在宿主机运行，这是默认推荐值）。
- `"all"`：所有会话都在沙箱中运行。  
  注意：`"non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是智能体 id。
  群组/频道会话会使用各自独立的 key，因此它们会被视为非主会话，并进入沙箱。

## 作用域

`agents.defaults.sandbox.scope` 控制**会创建多少个容器**：

- `"agent"`（默认）：每个智能体一个容器。
- `"session"`：每个会话一个容器。
- `"shared"`：所有启用沙箱的会话共享一个容器。

## 后端

`agents.defaults.sandbox.backend` 控制**由哪种运行时**提供沙箱：

- `"docker"`（启用沙箱时的默认值）：本地 Docker 支持的沙箱运行时。
- `"ssh"`：通用 SSH 支持的远程沙箱运行时。
- `"openshell"`：OpenShell 支持的沙箱运行时。

SSH 特定配置位于 `agents.defaults.sandbox.ssh` 下。  
OpenShell 特定配置位于 `plugins.entries.openshell.config` 下。

### 如何选择后端

|  | Docker | SSH | OpenShell |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **运行位置** | 本地容器 | 任意可通过 SSH 访问的主机 | OpenShell 管理的沙箱 |
| **设置** | `scripts/sandbox-setup.sh` | SSH key + 目标主机 | 启用 OpenShell 插件 |
| **工作区模型** | bind-mount 或复制 | 远程规范源（一次 seed） | `mirror` 或 `remote` |
| **网络控制** | `docker.network`（默认：none） | 取决于远程主机 | 取决于 OpenShell |
| **浏览器沙箱** | 支持 | 不支持 | 尚不支持 |
| **绑定挂载** | `docker.binds` | 不适用 | 不适用 |
| **最适合** | 本地开发、完整隔离 | 卸载到远程机器 | 具有可选双向同步的托管远程沙箱 |

### Docker 后端

默认关闭沙箱隔离。如果你启用了沙箱隔离但未选择
后端，OpenClaw 会使用 Docker 后端。它通过 Docker daemon socket（`/var/run/docker.sock`）在本地执行工具和沙箱浏览器。
沙箱容器的隔离性由 Docker namespaces 决定。

**Docker-out-of-Docker（DooD）限制**：  
如果你将 OpenClaw Gateway 网关本身部署为 Docker 容器，它会通过宿主机的 Docker socket（DooD）来编排同级沙箱容器。这会引入一个特定的路径映射约束：

- **配置必须使用宿主机路径**：`openclaw.json` 中的 `workspace` 配置必须包含**宿主机的绝对路径**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 网关容器内部路径。当 OpenClaw 请求 Docker daemon 启动沙箱时，daemon 会相对于宿主机操作系统命名空间解析路径，而不是 Gateway 网关容器命名空间。
- **FS Bridge 一致性（相同的卷映射）**：OpenClaw Gateway 网关原生进程也会向 `workspace` 目录写入 heartbeat 和 bridge 文件。由于 Gateway 网关会在其自身容器化环境内部，以完全相同的字符串（宿主机路径）来解析该路径，因此 Gateway 网关部署必须包含一个指向宿主机命名空间的相同卷映射（`-v /home/user/.openclaw:/home/user/.openclaw`）。

如果你只在容器内部做路径映射，而没有保持与宿主机绝对路径一致，OpenClaw 在容器环境中写入 heartbeat 时会原生抛出 `EACCES` 权限错误，因为该完整路径字符串在原生环境中并不存在。

### SSH 后端

当你希望 OpenClaw 将 `exec`、文件工具和媒体读取沙箱化到
任意可通过 SSH 访问的机器上时，请使用 `backend: "ssh"`。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

工作方式：

- OpenClaw 会在 `sandbox.ssh.workspaceRoot` 下为每个作用域创建一个远程根目录。
- 首次创建或重建后第一次使用时，OpenClaw 会将本地工作区一次性 seed 到该远程工作区。
- 之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取以及入站媒体暂存，都会通过 SSH 直接针对远程工作区执行。
- OpenClaw 不会自动将远程更改同步回本地工作区。

认证材料：

- `identityFile`、`certificateFile`、`knownHostsFile`：使用现有本地文件，并通过 OpenSSH 配置传递。
- `identityData`、`certificateData`、`knownHostsData`：使用内联字符串或 SecretRefs。OpenClaw 会通过正常的 secrets 运行时快照解析它们，将它们以 `0600` 权限写入临时文件，并在 SSH 会话结束时删除。
- 如果同一个项目同时设置了 `*File` 和 `*Data`，则该 SSH 会话优先使用 `*Data`。

这是一种**远程规范源**模型。初始 seed 之后，远程 SSH 工作区就成为真正的沙箱状态源。

重要影响：

- 在 seed 步骤之后，如果你在 OpenClaw 外部于宿主机本地做了编辑，这些更改在远程端不可见，除非你重建沙箱。
- `openclaw sandbox recreate` 会删除按作用域创建的远程根目录，并在下次使用时重新从本地 seed。
- SSH 后端不支持浏览器沙箱隔离。
- `sandbox.docker.*` 设置不适用于 SSH 后端。

### OpenShell 后端

如果你希望 OpenClaw 在
OpenShell 管理的远程环境中对工具进行沙箱隔离，请使用 `backend: "openshell"`。完整的设置指南、配置
参考和工作区模式对比，请参见专门的
[OpenShell 页面](/zh-CN/gateway/openshell)。

OpenShell 复用了与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥接，并增加了 OpenShell 特定的生命周期管理
（`sandbox create/get/delete`、`sandbox ssh-config`），以及可选的 `mirror`
工作区模式。

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell 模式：

- `mirror`（默认）：本地工作区保持为规范源。OpenClaw 会在 exec 之前将本地文件同步到 OpenShell，并在 exec 之后将远程工作区同步回来。
- `remote`：创建沙箱后，OpenShell 工作区变为规范源。OpenClaw 会从本地工作区向远程工作区执行一次 seed，之后文件工具和 exec 都直接针对远程沙箱运行，不再把更改同步回本地。

远程传输细节：

- OpenClaw 会通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求沙箱专用 SSH 配置。
- 核心会将该 SSH 配置写入临时文件，打开 SSH 会话，并复用 `backend: "ssh"` 所使用的同一远程文件系统桥。
- 仅在 `mirror` 模式下生命周期不同：exec 之前先将本地同步到远程，exec 之后再同步回来。

当前 OpenShell 限制：

- 尚不支持沙箱浏览器
- OpenShell 后端不支持 `sandbox.docker.binds`
- `sandbox.docker.*` 下的 Docker 特定运行时调节项仍然只适用于 Docker 后端

#### 工作区模式

OpenShell 有两种工作区模型。这是实践中最重要的部分。

##### `mirror`

当你希望**本地工作区保持为规范源**时，请使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 会将本地工作区同步到 OpenShell 沙箱中。
- 在 `exec` 之后，OpenClaw 会将远程工作区同步回本地工作区。
- 文件工具仍通过沙箱桥运行，但在各轮之间，本地工作区仍然是事实来源。

适用场景：

- 你会在 OpenClaw 外部本地编辑文件，并希望这些更改自动出现在沙箱中
- 你希望 OpenShell 沙箱尽可能像 Docker 后端那样工作
- 你希望宿主机工作区在每次 exec 之后反映沙箱写入结果

代价：

- exec 前后会产生额外同步成本

##### `remote`

当你希望**OpenShell 工作区成为规范源**时，请使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 当沙箱首次创建时，OpenClaw 会将本地工作区一次性 seed 到远程工作区。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 都会直接针对远程 OpenShell 工作区运行。
- OpenClaw **不会** 在 exec 之后将远程更改同步回本地工作区。
- 提示阶段的媒体读取仍然有效，因为文件和媒体工具是通过沙箱桥进行读取，而不是假定存在本地主机路径。
- 传输方式是通过 `openshell sandbox ssh-config` 返回的 OpenShell 沙箱 SSH 连接。

重要影响：

- 如果你在 seed 步骤之后，于宿主机上在 OpenClaw 之外编辑文件，远程沙箱**不会**自动看到这些更改。
- 如果沙箱被重建，远程工作区会再次从本地工作区 seed。
- 当使用 `scope: "agent"` 或 `scope: "shared"` 时，该远程工作区会在对应作用域内共享。

适用场景：

- 沙箱应该主要驻留在远程 OpenShell 一侧
- 你希望降低每轮同步开销
- 你不希望宿主机本地编辑静默覆盖远程沙箱状态

如果你把沙箱视为临时执行环境，请选择 `mirror`。  
如果你把沙箱视为真实工作区，请选择 `remote`。

#### OpenShell 生命周期

OpenShell 沙箱仍通过正常的沙箱生命周期进行管理：

- `openclaw sandbox list` 会同时显示 OpenShell 运行时和 Docker 运行时
- `openclaw sandbox recreate` 会删除当前运行时，并让 OpenClaw 在下次使用时重新创建它
- prune 逻辑同样具有后端感知能力

对于 `remote` 模式，recreate 特别重要：

- recreate 会删除该作用域的规范远程工作区
- 下次使用时会从本地工作区 seed 一个新的远程工作区

对于 `mirror` 模式，recreate 主要是重置远程执行环境，
因为本地工作区本来就是规范源。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱可以看到什么**：

- `"none"`（默认）：工具看到的是位于 `~/.openclaw/sandboxes` 下的沙箱工作区。
- `"ro"`：将智能体工作区以只读方式挂载到 `/agent`（会禁用 `write`/`edit`/`apply_patch`）。
- `"rw"`：将智能体工作区以读写方式挂载到 `/workspace`。

使用 OpenShell 后端时：

- `mirror` 模式仍将本地工作区视为 exec 轮次之间的规范源
- `remote` 模式则在初始 seed 之后将远程 OpenShell 工作区视为规范源
- `workspaceAccess: "ro"` 和 `"none"` 仍会以相同方式限制写入行为

入站媒体会被复制到当前活动的沙箱工作区（`media/inbound/*`）。  
Skills 说明：`read` 工具以沙箱根目录为基准。当 `workspaceAccess: "none"` 时，
OpenClaw 会将符合条件的 Skills 镜像到沙箱工作区（`.../skills`）中，
以便读取。使用 `"rw"` 时，工作区中的 Skills 可从
`/workspace/skills` 读取。

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 会将额外的宿主机目录挂载到容器中。  
格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局绑定和按智能体绑定会**合并**（而不是替换）。在 `scope: "shared"` 下，会忽略按智能体绑定。

`agents.defaults.sandbox.browser.binds` 仅将额外的宿主机目录挂载到**沙箱浏览器**容器中。

- 当设置了该项（包括设置为空数组 `[]`）时，它会替换浏览器容器中的 `agents.defaults.sandbox.docker.binds`。
- 当省略时，浏览器容器会回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

示例（只读源码 + 额外数据目录）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

安全说明：

- 绑定挂载会绕过沙箱文件系统：它们会以你设置的模式（`:ro` 或 `:rw`）暴露宿主机路径。
- OpenClaw 会阻止危险的绑定源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`，以及会暴露这些路径的上级挂载）。
- OpenClaw 还会阻止常见的 home 目录凭证根路径，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- 绑定校验不仅仅是字符串匹配。OpenClaw 会先标准化源路径，然后通过最深层的已存在父路径再次解析，再重新检查阻止路径和允许根路径。
- 这意味着，即使最终叶子节点尚不存在，基于父级符号链接的逃逸也会以失败关闭方式被拦截。例如：如果 `run-link` 指向 `/var/run/...`，那么 `/workspace/run-link/new-file` 仍会解析为 `/var/run/...`。
- 允许的源根路径也会以同样方式标准化，因此即使某条路径在符号链接解析前看起来位于允许列表内部，也仍会因 `outside allowed roots` 而被拒绝。
- 敏感挂载（secrets、SSH key、服务凭证）除非绝对必要，否则应使用 `:ro`。
- 如果你只需要对工作区的读取权限，请搭配 `workspaceAccess: "ro"` 使用；绑定模式仍是独立的。
- 关于绑定挂载如何与工具策略和 elevated exec 交互，请参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。

## 镜像 + 设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

只需构建一次：

```bash
scripts/sandbox-setup.sh
```

注意：默认镜像**不包含** Node。如果某个 Skill 需要 Node（或
其他运行时），你需要自行烘焙一个自定义镜像，或通过
`sandbox.docker.setupCommand` 安装（这要求允许网络出站 + 可写根文件系统 +
root 用户）。

如果你想要一个更实用的沙箱镜像，包含常见工具（例如
`curl`、`jq`、`nodejs`、`python3`、`git`），请构建：

```bash
scripts/sandbox-common-setup.sh
```

然后将 `agents.defaults.sandbox.docker.image` 设置为
`openclaw-sandbox-common:bookworm-slim`。

沙箱浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，Docker 沙箱容器**没有网络访问能力**。  
可通过 `agents.defaults.sandbox.docker.network` 覆盖。

内置沙箱浏览器镜像还对容器化工作负载应用了保守的 Chromium 启动默认值。  
当前容器默认值包括：

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- 当启用 `noSandbox` 时，使用 `--no-sandbox` 和 `--disable-setuid-sandbox`
- 三个图形强化标志（`--disable-3d-apis`、
  `--disable-software-rasterizer`、`--disable-gpu`）是可选的；当容器缺乏 GPU 支持时很有用。
  如果你的工作负载需要 WebGL 或其他 3D/浏览器功能，请设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
- `--disable-extensions` 默认启用，可通过
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 关闭，以支持依赖扩展的流程
- `--renderer-process-limit=2` 由
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 表示保留 Chromium 默认值

如果你需要不同的运行时配置，请使用自定义浏览器镜像并提供
你自己的 entrypoint。对于本地（非容器）Chromium profile，请使用
`browser.extraArgs` 追加额外启动标志。

安全默认值：

- `network: "host"` 会被阻止。
- 默认情况下，`network: "container:<id>"` 也会被阻止（存在 namespace join 绕过风险）。
- 紧急覆盖项：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker 安装和容器化 Gateway 网关的说明在这里：
[Docker](/zh-CN/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可用于初始化沙箱配置。  
设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）即可启用该路径。你也可以
通过 `OPENCLAW_DOCKER_SOCKET` 覆盖 socket 位置。完整设置和环境变量
参考请参见：[Docker](/zh-CN/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 会在沙箱容器创建后**只运行一次**（而不是每次运行都执行）。  
它会在容器内部通过 `sh -lc` 执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 按智能体：`agents.list[].sandbox.docker.setupCommand`

常见陷阱：

- 默认 `docker.network` 是 `"none"`（无出站），因此包安装会失败。
- `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，仅应作为紧急开关使用。
- `readOnlyRoot: true` 会阻止写入；请设置 `readOnlyRoot: false`，或使用自定义镜像。
- 包安装时 `user` 必须是 root（省略 `user`，或设置 `user: "0:0"`）。
- 沙箱 exec **不会**继承宿主机 `process.env`。请使用
  `agents.defaults.sandbox.docker.env`（或自定义镜像）为 Skill 提供 API key。

## 工具策略 + 逃生舱口

工具 allow/deny 策略仍会先于沙箱规则生效。如果某个工具在全局
或按智能体层面被拒绝，启用沙箱也不会把它重新带回来。

`tools.elevated` 是一个显式的逃生舱口，它会让 `exec` 在沙箱外运行（默认使用 `gateway`，或者当 exec 目标为 `node` 时使用 `node`）。  
`/exec` 指令仅对已授权发送者生效，并会按会话持久化；如果你想彻底禁用
`exec`，请使用工具策略 deny（参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查生效中的沙箱模式、工具策略和修复配置键。
- 关于“为什么会被阻止”的心智模型，请参见 [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated)。  
  保持严格锁定。

## 多智能体覆盖

每个智能体都可以覆盖沙箱和工具：
`agents.list[].sandbox` 和 `agents.list[].tools`（以及用于沙箱工具策略的 `agents.list[].tools.sandbox.tools`）。
优先级规则请参见 [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools)。

## 最小启用示例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 相关文档

- [OpenShell](/zh-CN/gateway/openshell) -- 托管沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/zh-CN/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试“为什么会被阻止？”
- [Multi-Agent Sandbox & Tools](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖和优先级
- [安全](/zh-CN/gateway/security)
