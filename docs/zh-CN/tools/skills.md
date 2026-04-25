---
read_when:
    - 添加或修改 Skills
    - 更改 Skills 门控或加载规则
summary: Skills：托管版与工作区版、门控规则，以及配置/环境变量连线
title: Skills
x-i18n:
    generated_at: "2026-04-25T22:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22741e7f3ae7117675b73056ae8148f7864dac210df1a63ed19903525df7d823
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的 Skills 文件夹来教会智能体如何使用工具。每个 Skill 都是一个目录，其中包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载**内置 Skills**以及可选的本地覆盖项，并在加载时根据环境、配置和二进制文件是否存在进行过滤。

## 位置与优先级

OpenClaw 会从以下来源加载 Skills：

1. **额外的 Skill 文件夹**：通过 `skills.load.extraDirs` 配置
2. **内置 Skills**：随安装一起提供（`npm` 包或 OpenClaw.app）
3. **托管版/本地 Skills**：`~/.openclaw/skills`
4. **个人智能体 Skills**：`~/.agents/skills`
5. **项目智能体 Skills**：`<workspace>/.agents/skills`
6. **工作区 Skills**：`<workspace>/skills`

如果 Skill 名称冲突，优先级如下：

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 Skills → `skills.load.extraDirs`（最低）

## 按智能体划分的 Skills 与共享 Skills

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **按智能体划分的 Skills** 仅存在于该智能体自己的 `<workspace>/skills` 中。
- **项目智能体 Skills** 位于 `<workspace>/.agents/skills`，会先于常规工作区 `skills/` 文件夹应用到该工作区。
- **个人智能体 Skills** 位于 `~/.agents/skills`，适用于这台机器上的所有工作区。
- **共享 Skills** 位于 `~/.openclaw/skills`（托管版/本地），并且对同一台机器上的**所有智能体**都可见。
- 如果你希望多个智能体共用同一个 Skills 包，也可以通过 `skills.load.extraDirs` 添加**共享文件夹**（最低优先级）。

如果同名 Skill 同时存在于多个位置，则按通常优先级处理：工作区优先，其次是项目智能体 Skills，再其次是个人智能体 Skills，然后是托管版/本地 Skills，再然后是内置 Skills，最后是额外目录。

## 智能体 Skill allowlist

Skill 的**位置**和 Skill 的**可见性**是两个独立的控制项。

- 位置/优先级决定同名 Skill 的哪个副本胜出。
- 智能体 allowlist 决定智能体实际可以使用哪些可见 Skill。

使用 `agents.defaults.skills` 作为共享基线，然后通过 `agents.list[].skills` 为每个智能体覆盖：

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换 defaults
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

规则：

- 如果默认不限制 Skills，请省略 `agents.defaults.skills`。
- 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
- 将 `agents.list[].skills: []` 设为空数组表示没有 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

OpenClaw 会将智能体的有效 Skill 集合应用到提示构建、Skill 斜杠命令发现、沙箱同步和 Skill 快照中。

## 插件 + Skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来附带自己的 Skills（路径相对于插件根目录）。启用插件后，插件 Skills 就会被加载。对于那些工具专用、篇幅又长到不适合放进工具描述里，但又应当在插件安装后始终可用的操作指南，这就是合适的位置；例如，浏览器插件会附带一个 `browser-automation` Skill，用于多步骤浏览器控制。目前，这些目录会合并到与 `skills.load.extraDirs` 相同的低优先级路径中，因此同名的内置、托管版、智能体或工作区 Skill 都会覆盖它们。
你可以通过插件配置项上的 `metadata.openclaw.requires.config` 来对其进行门控。关于发现/配置，请参阅 [Plugins](/zh-CN/tools/plugin)；关于这些 Skills 所教授的工具表面，请参阅 [Tools](/zh-CN/tools)。

## Skill Workshop

可选的实验性 Skill Workshop 插件可以根据智能体工作过程中观察到的可复用流程，创建或更新工作区 Skills。它默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 只会写入 `<workspace>/skills`，会扫描生成的内容，支持“待批准”或“自动安全写入”，会隔离不安全的提议，并在成功写入后刷新 Skill 快照，以便新 Skills 无需重启 Gateway 网关即可生效。

当你希望诸如“下次要验证 GIF 署名”这样的修正，或媒体 QA 检查清单这类来之不易的工作流，变成可持续复用的流程指令时，可以使用它。建议从“待批准”模式开始；只有在受信任的工作区中，并且审查过其提议后，才使用自动写入。完整指南：
[Skill Workshop Plugin](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公共 Skills 注册表。可在 [https://clawhub.ai](https://clawhub.ai) 浏览。使用原生 `openclaw skills` 命令来发现/安装/更新 Skills；如果你需要发布/同步工作流，则使用单独的 `clawhub` CLI。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

常见流程：

- 将一个 Skill 安装到你的工作区：
  - `openclaw skills install <skill-slug>`
- 更新所有已安装的 Skills：
  - `openclaw skills update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

原生 `openclaw skills install` 会安装到当前活动工作区的 `skills/` 目录中。单独的 `clawhub` CLI 也会安装到当前工作目录下的 `./skills` 中（或者回退到已配置的 OpenClaw 工作区）。OpenClaw 会在下一个会话中将其识别为 `<workspace>/skills`。

## 安全说明

- 请将第三方 Skills 视为**不受信任的代码**。启用前请先阅读。
- 对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- 工作区和额外目录的 Skill 发现只接受 Skill 根目录，以及其解析后 realpath 仍位于已配置根目录内部的 `SKILL.md` 文件。
- 由 Gateway 网关驱动的 Skill 依赖安装（`skills.install`、新手引导，以及 Skills 设置 UI）会在执行安装器元数据前运行内置危险代码扫描器。默认情况下，`critical` 发现项会阻止执行，除非调用方显式设置危险覆盖；可疑发现项仍然只会发出警告。
- `openclaw skills install <slug>` 不同：它会将 ClawHub 的 Skill 文件夹下载到工作区中，而不会使用上面提到的安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会在该智能体回合期间将密钥注入到**宿主机**进程中（而不是沙箱中）。请不要让密钥出现在提示和日志里。
- 如需更广泛的威胁模型和检查清单，请参阅 [Security](/zh-CN/gateway/security)。

## 格式（AgentSkills + Pi 兼容）

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

说明：

- 我们遵循 AgentSkills 规范中的布局/意图。
- 嵌入式智能体使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用 Skill 文件夹路径。
- 可选 frontmatter 键：
  - `homepage` — 在 macOS Skills UI 中显示为“Website”的 URL（也可通过 `metadata.openclaw.homepage` 提供）。
  - `user-invocable` — `true|false`（默认：`true`）。当为 `true` 时，该 Skill 会暴露为用户斜杠命令。
  - `disable-model-invocation` — `true|false`（默认：`false`）。当为 `true` 时，该 Skill 会从模型提示中排除（但仍可通过用户调用使用）。
  - `command-dispatch` — `tool`（可选）。设为 `tool` 时，斜杠命令会绕过模型，直接分发给某个工具。
  - `command-tool` — 当设置了 `command-dispatch: tool` 时要调用的工具名称。
  - `command-arg-mode` — `raw`（默认）。用于工具分发时，会将原始参数字符串转发给工具（不做核心解析）。

    工具调用时的参数为：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控规则（加载时过滤器）

OpenClaw 会在加载时使用 `metadata`（单行 JSON）来**过滤 Skills**：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 下的字段：

- `always: true` — 始终包含该 Skill（跳过其他门控）。
- `emoji` — 可选表情符号，供 macOS Skills UI 使用。
- `homepage` — 可选 URL，在 macOS Skills UI 中显示为“Website”。
- `os` — 可选平台列表（`darwin`、`linux`、`win32`）。如果设置，则该 Skill 仅在这些操作系统上可用。
- `requires.bins` — 列表；每一项都必须存在于 `PATH` 中。
- `requires.anyBins` — 列表；其中至少一项必须存在于 `PATH` 中。
- `requires.env` — 列表；环境变量必须存在，**或者**在配置中提供。
- `requires.config` — 必须为 truthy 的 `openclaw.json` 路径列表。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名。
- `install` — 可选安装器规范数组，供 macOS Skills UI 使用（brew/node/go/uv/download）。

如果 `metadata.openclaw` 不存在，旧版 `metadata.clawdbot` 块仍然会被接受，因此旧的已安装 Skills 仍会保留其依赖门控和安装器提示。新的和更新后的 Skills 应使用 `metadata.openclaw`。

关于沙箱隔离的说明：

- `requires.bins` 会在 Skill 加载时于**宿主机**上进行检查。
- 如果某个智能体处于沙箱隔离中，则该二进制文件还必须**存在于容器内部**。
  通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）来安装它。
  `setupCommand` 会在容器创建后运行一次。
  包安装还要求沙箱具有网络出站能力、可写的根文件系统，以及 root 用户。
  例如，`summarize` Skill（`skills/summarize/SKILL.md`）需要 `summarize` CLI
  存在于沙箱容器中，才能在其中运行。

安装器示例：

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

说明：

- 如果列出了多个安装器，Gateway 网关会选择一个**首选**选项（有 `brew` 时优先 `brew`，否则优先 `node`）。
- 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用的构件。
- 安装器规范可以包含 `os: ["darwin"|"linux"|"win32"]`，以按平台过滤选项。
- Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：`npm`；可选值：`npm`/`pnpm`/`yarn`/`bun`）。
  这只影响 **Skill 安装**；Gateway 网关运行时仍应使用 Node
  （不建议对 WhatsApp/Telegram 使用 Bun）。
- 由 Gateway 网关驱动的安装器选择基于偏好，而不只是 `node`：
  当安装规范混合多种类型时，如果启用了 `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先选择 Homebrew，其次是 `uv`，然后是已配置的 node 管理器，最后才是 `go` 或 `download` 等其他回退项。
- 如果所有安装规范都是 `download`，OpenClaw 会展示所有下载选项，而不是折叠为一个首选安装器。
- Go 安装：如果缺少 `go` 且存在 `brew`，Gateway 网关会先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设置为 Homebrew 的 `bin`。
- Download 安装：`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档文件时自动启用）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果不存在 `metadata.openclaw`，则该 Skill 始终可用（除非它在配置中被禁用，或者作为内置 Skill 被 `skills.allowBundled` 阻止）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

可以为内置/托管版 Skills 进行开关控制，并提供环境变量值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

注意：如果 Skill 名称包含连字符，请给键名加引号（JSON5 允许带引号的键名）。

如果你想在 OpenClaw 本身内部使用原生图片生成/编辑功能，请使用核心 `image_generate` 工具并配合 `agents.defaults.imageGenerationModel`，而不是使用内置 Skill。这里的 Skill 示例适用于自定义或第三方工作流。

对于原生图片分析，请将 `image` 工具与 `agents.defaults.imageModel` 搭配使用。
对于原生图片生成/编辑，请将 `image_generate` 与
`agents.defaults.imageGenerationModel` 搭配使用。如果你选择 `openai/*`、`google/*`、`fal/*` 或其他提供商专用图片模型，还需要添加该提供商对应的认证/API 密钥。

默认情况下，配置键与 **Skill 名称** 匹配。如果某个 Skill 定义了
`metadata.openclaw.skillKey`，则应在 `skills.entries` 下使用该键。

规则：

- `enabled: false` 会禁用该 Skill，即使它已内置/已安装。
- `env`：**仅当**该变量尚未在进程中设置时才会注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的 Skills 提供的便捷配置。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。
- `config`：用于自定义每个 Skill 字段的可选对象；自定义键必须放在这里。
- `allowBundled`：仅针对**内置** Skills 的可选 allowlist。如果设置了它，则只有列表中的内置 Skills 才可用（不影响托管版/工作区 Skills）。

## 环境变量注入（每次智能体运行）

当一次智能体运行开始时，OpenClaw 会：

1. 读取 Skill 元数据。
2. 将所有 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到
   `process.env`。
3. 用**可用** Skills 构建系统提示。
4. 在运行结束后恢复原始环境。

这是**限定在该次智能体运行内**的，而不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将相同的可用快照具体化为一个临时 Claude Code 插件，并通过 `--plugin-dir` 传入。随后 Claude Code 就可以使用其原生 Skill 解析器，同时 OpenClaw 仍然负责优先级、按智能体划分的 allowlist、门控规则，以及 `skills.entries.*` 环境变量/API 密钥注入。其他 CLI 后端只使用提示目录。

## 会话快照（性能）

OpenClaw 会在会话开始时对可用 Skills 进行快照，并在同一会话的后续回合中重复使用该列表。对 Skills 或配置的更改会在下一个新会话中生效。

当启用了 Skills 监视器，或者出现新的可用远程节点时，Skills 也可以在会话中途刷新（见下文）。可以将其理解为一种**热重载**：刷新的列表会在下一次智能体回合中生效。

如果该会话的有效智能体 Skill allowlist 发生变化，OpenClaw 会刷新快照，以便可见 Skills 与当前智能体保持一致。

## 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关运行在 Linux 上，但连接了一个**允许 `system.run`** 的 **macOS 节点**（Exec 批准安全级别未设置为 `deny`），那么当该节点上存在所需二进制文件时，OpenClaw 可以将仅限 macOS 的 Skills 视为可用。智能体应通过 `exec` 工具并使用 `host=node` 来执行这些 Skills。

这依赖于节点报告其命令支持情况，以及通过 `system.which` 或 `system.run` 进行二进制探测。离线节点不会使仅远程可用的 Skills 变得可见。如果已连接节点停止响应二进制探测，OpenClaw 会清除其缓存的二进制匹配结果，这样智能体就不会再看到当前无法运行的 Skills。

## Skills 监视器（自动刷新）

默认情况下，OpenClaw 会监视 Skill 文件夹，并在 `SKILL.md` 文件变化时提升 Skills 快照版本。你可以在 `skills.load` 下进行配置：

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Token 影响（Skills 列表）

当有可用 Skills 时，OpenClaw 会通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`，将一个紧凑的 XML 可用 Skills 列表注入到系统提示中。成本是确定性的：

- **基础开销（仅当 ≥1 个 Skill 时）：** 195 个字符。
- **每个 Skill：** 97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

说明：

- XML 转义会将 `& < > " '` 扩展为实体（如 `&amp;`、`&lt;` 等），从而增加长度。
- Token 数量会因模型 tokenizer 而异。一个粗略的 OpenAI 风格估算是约 4 个字符/token，因此**97 个字符 ≈ 24 个 token** 每个 Skill，外加你的实际字段长度。

## 托管版 Skills 生命周期

OpenClaw 会将一组基线 Skills 作为**内置 Skills**随安装一起提供（`npm` 包或 OpenClaw.app）。`~/.openclaw/skills` 用于本地覆盖（例如，在不更改内置副本的情况下固定/修补某个 Skill）。工作区 Skills 由用户拥有，并且在名称冲突时会覆盖这两者。

## 配置参考

完整配置 schema 请参阅 [Skills 配置](/zh-CN/tools/skills-config)。

## 想找更多 Skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。

---

## 相关内容

- [创建 Skills](/zh-CN/tools/creating-skills) — 构建自定义 Skills
- [Skills 配置](/zh-CN/tools/skills-config) — Skill 配置参考
- [斜杠命令](/zh-CN/tools/slash-commands) — 所有可用的斜杠命令
- [Plugins](/zh-CN/tools/plugin) — 插件系统概览
