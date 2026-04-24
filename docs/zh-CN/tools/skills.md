---
read_when:
    - 添加或修改 Skills
    - 更改 Skills 的门控或加载规则
summary: Skills：托管模式与工作区模式、门控规则，以及配置/环境变量接线
title: Skills
x-i18n:
    generated_at: "2026-04-24T23:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 346058f4d85cd66f7b05f6ddd7ee3b8959f05da8645c62ce5531a955eedf7a83
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw 使用与 **[AgentSkills](https://agentskills.io)** 兼容的 skill 文件夹来教会智能体如何使用工具。每个 skill 都是一个目录，包含带有 YAML frontmatter 和说明的 `SKILL.md`。OpenClaw 会加载**内置 skills**以及可选的本地覆盖项，并在加载时根据环境、配置和二进制文件是否存在来进行筛选。

## 位置与优先级

OpenClaw 会从以下来源加载 skills：

1. **额外 skill 文件夹**：通过 `skills.load.extraDirs` 配置
2. **内置 skills**：随安装包一起提供（`npm` 包或 OpenClaw.app）
3. **托管/本地 skills**：`~/.openclaw/skills`
4. **个人 agent skills**：`~/.agents/skills`
5. **项目 agent skills**：`<workspace>/.agents/skills`
6. **工作区 skills**：`<workspace>/skills`

如果 skill 名称冲突，优先级如下：

`<workspace>/skills`（最高）→ `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置 skills → `skills.load.extraDirs`（最低）

## 按 agent 区分的 skills 与共享 skills

在**多智能体**设置中，每个智能体都有自己的工作区。这意味着：

- **按 agent 区分的 skills** 仅存在于该 agent 的 `<workspace>/skills` 中。
- **项目 agent skills** 位于 `<workspace>/.agents/skills`，会在普通工作区 `skills/` 文件夹之前应用到该工作区。
- **个人 agent skills** 位于 `~/.agents/skills`，会应用到该机器上的所有工作区。
- **共享 skills** 位于 `~/.openclaw/skills`（托管/本地），并且同一台机器上的**所有智能体**都可见。
- 如果你想让多个智能体共用同一套 skills，也可以通过 `skills.load.extraDirs` 添加**共享文件夹**（最低优先级）。

如果同一个 skill 名称出现在多个位置，则仍按通常的优先级处理：工作区优先，其次是项目 agent skills、个人 agent skills、托管/本地 skills、内置 skills，最后是额外目录。

## 每个 agent 的 skill 允许列表

Skill 的**位置**和 skill 的**可见性**是两套独立控制。

- 位置/优先级决定同名 skill 中哪一份会胜出。
- Agent 允许列表决定某个 agent 实际上可以使用哪些可见 skills。

对共享基线使用 `agents.defaults.skills`，然后通过 `agents.list[].skills` 为每个 agent 覆盖：

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 skills
    ],
  },
}
```

规则：

- 省略 `agents.defaults.skills` 表示默认不限制 skills。
- 省略 `agents.list[].skills` 表示继承 `agents.defaults.skills`。
- 将 `agents.list[].skills: []` 设为空表示不使用任何 skills。
- 非空的 `agents.list[].skills` 列表就是该 agent 的最终集合；它不会与默认值合并。

OpenClaw 会将生效后的 agent skill 集合应用到提示词构建、skill 斜杠命令发现、沙箱同步以及 skill 快照中。

## 插件 + skills

插件可以通过在 `openclaw.plugin.json` 中列出 `skills` 目录来附带自己的 skills（路径相对于插件根目录）。插件启用时，插件 skills 就会加载。对于那些过长而不适合放在工具描述中、但又应在插件安装后始终可用的工具专用操作指南，这是正确的放置位置；例如，浏览器插件附带了一个 `browser-automation` skill，用于多步骤浏览器控制。目前，这些目录会并入与 `skills.load.extraDirs` 相同的低优先级路径，因此同名的内置、托管、agent 或工作区 skill 都会覆盖它们。
你可以通过插件配置项上的 `metadata.openclaw.requires.config` 对它们进行门控。有关发现/配置，请参见 [Plugins](/zh-CN/tools/plugin)；有关这些 skills 所教授的工具表面，请参见 [Tools](/zh-CN/tools)。

## Skill Workshop

可选且实验性的 Skill Workshop 插件可以根据 agent 工作过程中观察到的可复用流程，创建或更新工作区 skills。它默认禁用，必须通过 `plugins.entries.skill-workshop` 显式启用。

Skill Workshop 只会写入 `<workspace>/skills`，会扫描生成内容，支持“待批准”或“自动安全写入”，会隔离不安全提案，并在成功写入后刷新 skill 快照，以便新 skills 无需重启 Gateway 网关即可变为可用。

当你希望把诸如“下次请验证 GIF 归属”这样的修正，或诸如媒体 QA 检查清单这样的宝贵工作流，沉淀为持久的过程性说明时，就可以使用它。建议从“待批准”开始；只有在受信任的工作区中，并且审查过其提案后，才使用自动写入。完整指南：
[Skill Workshop Plugin](/zh-CN/plugins/skill-workshop)。

## ClawHub（安装 + 同步）

ClawHub 是 OpenClaw 的公共 skills 注册表。可在
[https://clawhub.ai](https://clawhub.ai) 浏览。使用原生 `openclaw skills`
命令来发现/安装/更新 skills；如果你需要发布/同步工作流，则使用独立的 `clawhub` CLI。
完整指南：[ClawHub](/zh-CN/tools/clawhub)。

常见流程：

- 将一个 skill 安装到你的工作区：
  - `openclaw skills install <skill-slug>`
- 更新所有已安装 skills：
  - `openclaw skills update --all`
- 同步（扫描 + 发布更新）：
  - `clawhub sync --all`

原生 `openclaw skills install` 会安装到当前工作区的 `skills/`
目录中。独立的 `clawhub` CLI 也会安装到当前工作目录下的 `./skills` 中（或者回退到已配置的 OpenClaw 工作区）。
OpenClaw 会在下一次会话中将其识别为 `<workspace>/skills`。

## 安全说明

- 将第三方 skills 视为**不受信任的代码**。启用前请先阅读。
- 对于不受信任的输入和高风险工具，优先使用沙箱隔离运行。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
- 工作区和额外目录中的 skill 发现，只接受其解析后的 realpath 仍位于配置根目录内的 skill 根目录和 `SKILL.md` 文件。
- 由 Gateway 网关支持的 skill 依赖安装（`skills.install`、新手引导以及 Skills 设置 UI）在执行安装器元数据之前，会先运行内置的危险代码扫描器。默认情况下，`critical` 级别发现会阻止执行，除非调用方显式设置危险覆盖；可疑发现仍然只会发出警告。
- `openclaw skills install <slug>` 不同：它会将一个 ClawHub skill 文件夹下载到工作区中，不会使用上述安装器元数据路径。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 会将密钥注入该 agent 轮次的**宿主机**进程中（而不是沙箱）。请让密钥远离提示词和日志。
- 更广泛的威胁模型和检查清单，请参见 [Security](/zh-CN/gateway/security)。

## 格式（兼容 AgentSkills + Pi）

`SKILL.md` 至少必须包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

说明：

- 我们遵循 AgentSkills 规范的布局和意图。
- 嵌入式 agent 使用的解析器仅支持**单行** frontmatter 键。
- `metadata` 应为**单行 JSON 对象**。
- 在说明中使用 `{baseDir}` 来引用 skill 文件夹路径。
- 可选的 frontmatter 键：
  - `homepage` — 在 macOS Skills UI 中显示为“Website”的 URL（也可通过 `metadata.openclaw.homepage` 提供）。
  - `user-invocable` — `true|false`（默认：`true`）。为 `true` 时，该 skill 会作为用户斜杠命令暴露。
  - `disable-model-invocation` — `true|false`（默认：`false`）。为 `true` 时，该 skill 会从模型提示词中排除（但仍可通过用户调用使用）。
  - `command-dispatch` — `tool`（可选）。设为 `tool` 时，该斜杠命令会绕过模型并直接分发给某个工具。
  - `command-tool` — 当设置了 `command-dispatch: tool` 时要调用的工具名称。
  - `command-arg-mode` — `raw`（默认）。对于工具分发，会将原始参数字符串原样转发给工具（核心层不做解析）。

    工具会使用以下参数调用：
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。

## 门控（加载时过滤器）

OpenClaw 使用 `metadata`（单行 JSON）在**加载时筛选 skills**：

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

- `always: true` — 始终包含该 skill（跳过其他门控）。
- `emoji` — macOS Skills UI 使用的可选 emoji。
- `homepage` — 在 macOS Skills UI 中显示为“Website”的可选 URL。
- `os` — 可选的平台列表（`darwin`、`linux`、`win32`）。设置后，该 skill 仅在这些操作系统上符合条件。
- `requires.bins` — 列表；其中每一项都必须存在于 `PATH` 中。
- `requires.anyBins` — 列表；其中至少一项必须存在于 `PATH` 中。
- `requires.env` — 列表；环境变量必须存在，**或者**在配置中提供。
- `requires.config` — 必须为真值的 `openclaw.json` 路径列表。
- `primaryEnv` — 与 `skills.entries.<name>.apiKey` 关联的环境变量名。
- `install` — 可选的安装器规范数组，供 macOS Skills UI 使用（brew/node/go/uv/download）。

关于沙箱隔离的说明：

- `requires.bins` 会在 skill 加载时于**宿主机**上检查。
- 如果某个 agent 处于沙箱隔离中，那么该二进制文件也必须**存在于容器内部**。
  请通过 `agents.defaults.sandbox.docker.setupCommand`（或自定义镜像）进行安装。
  `setupCommand` 会在容器创建后运行一次。
  软件包安装还要求沙箱中具备网络出口、可写根文件系统以及 root 用户。
  例如，`summarize` skill（`skills/summarize/SKILL.md`）若要在沙箱容器中运行，就需要容器内存在 `summarize` CLI。

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

- 如果列出了多个安装器，Gateway 网关会选择**一个**首选选项（有 `brew` 时优先 `brew`，否则为 `node`）。
- 如果所有安装器都是 `download`，OpenClaw 会列出每个条目，以便你查看可用工件。
- 安装器规范可包含 `os: ["darwin"|"linux"|"win32"]`，用于按平台筛选选项。
- Node 安装会遵循 `openclaw.json` 中的 `skills.install.nodeManager`（默认：`npm`；可选：`npm/pnpm/yarn/bun`）。
  这只影响**skill 安装**；Gateway 网关运行时仍应使用 Node
  （不建议对 WhatsApp/Telegram 使用 Bun）。
- 由 Gateway 网关支持的安装器选择是基于偏好，而不只是 node：
  当安装规范混合多种类型时，如果启用了 `skills.install.preferBrew` 且存在 `brew`，OpenClaw 会优先 Homebrew，然后是 `uv`，再然后是已配置的 node 管理器，最后才是 `go` 或 `download` 等其他回退项。
- 如果每个安装规范都是 `download`，OpenClaw 会展示所有下载选项，而不是收敛为一个首选安装器。
- Go 安装：如果缺少 `go` 且存在 `brew`，Gateway 网关会先通过 Homebrew 安装 Go，并在可能时将 `GOBIN` 设为 Homebrew 的 `bin`。
- Download 安装：`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（默认：检测到归档文件时自动开启）、`stripComponents`、`targetDir`（默认：`~/.openclaw/tools/<skillKey>`）。

如果不存在 `metadata.openclaw`，则该 skill 始终符合条件（除非在配置中被禁用，或者作为内置 skill 被 `skills.allowBundled` 阻止）。

## 配置覆盖（`~/.openclaw/openclaw.json`）

内置/托管 skills 可以切换启用状态，并可提供环境变量值：

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

注意：如果 skill 名称包含连字符，请给键名加引号（JSON5 允许带引号的键）。

如果你想在 OpenClaw 本身内部使用原生的图片生成/编辑，请使用核心
`image_generate` 工具并配置 `agents.defaults.imageGenerationModel`，而不是使用内置 skill。这里的 skill 示例适用于自定义或第三方工作流。

对于原生图像分析，请使用 `image` 工具并配置 `agents.defaults.imageModel`。
对于原生图片生成/编辑，请使用 `image_generate` 并配置
`agents.defaults.imageGenerationModel`。如果你选择 `openai/*`、`google/*`、
`fal/*` 或其他提供商专用图像模型，还需要添加该提供商对应的认证/API
密钥。

默认情况下，配置键与**skill 名称**匹配。如果某个 skill 定义了
`metadata.openclaw.skillKey`，请在 `skills.entries` 下使用该键。

规则：

- `enabled: false` 会禁用该 skill，即使它是内置/已安装的。
- `env`：**仅当**该变量尚未在进程中设置时才会注入。
- `apiKey`：为声明了 `metadata.openclaw.primaryEnv` 的 skills 提供的便捷写法。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。
- `config`：用于自定义每个 skill 字段的可选对象；自定义键必须放在这里。
- `allowBundled`：仅针对**内置** skills 的可选允许列表。如果设置，则只有列表中的内置 skills 符合条件（不影响托管/工作区 skills）。

## 环境变量注入（每次 agent 运行）

当一次 agent 运行开始时，OpenClaw 会：

1. 读取 skill 元数据。
2. 将任何 `skills.entries.<key>.env` 或 `skills.entries.<key>.apiKey` 应用到
   `process.env`。
3. 使用**符合条件**的 skills 构建系统提示词。
4. 在运行结束后恢复原始环境。

这是**限定在 agent 运行范围内**的，不是全局 shell 环境。

对于内置的 `claude-cli` 后端，OpenClaw 还会将同一份符合条件的快照实体化为临时 Claude Code 插件，并通过 `--plugin-dir` 传入。这样 Claude Code 就可以使用其原生的 skill 解析器，同时 OpenClaw 仍然掌控优先级、每个 agent 的允许列表、门控以及
`skills.entries.*` 环境变量/API 密钥注入。其他 CLI 后端仅使用提示词目录。

## 会话快照（性能）

OpenClaw 会在会话开始时对符合条件的 skills 进行快照，并在同一会话的后续轮次中复用该列表。对 skills 或配置的更改会在下一个新会话中生效。

当启用 skills 监视器时，或者出现新的符合条件的远程节点时，skills 也可以在会话中途刷新（见下文）。你可以把这理解为一种**热重载**：刷新后的列表会在下一次 agent 轮次中生效。

如果该会话的有效 agent skill 允许列表发生变化，OpenClaw 会刷新快照，以便可见 skills 与当前 agent 保持一致。

## 远程 macOS 节点（Linux Gateway 网关）

如果 Gateway 网关运行在 Linux 上，但连接了一个**允许 `system.run` 的 macOS 节点**（Exec approvals 安全设置不是 `deny`），当所需二进制文件存在于该节点上时，OpenClaw 可以将仅限 macOS 的 skills 视为符合条件。智能体应通过 `exec` 工具并设置 `host=node` 来执行这些 skills。

这依赖于节点报告其命令支持情况，以及通过 `system.run` 进行的二进制探测。如果该 macOS 节点之后离线，这些 skills 仍会保持可见；但在节点重新连接之前，调用可能会失败。

## Skills 监视器（自动刷新）

默认情况下，OpenClaw 会监视 skill 文件夹，并在 `SKILL.md` 文件发生变化时更新 skills 快照。可在 `skills.load` 下进行配置：

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

## Token 影响（skills 列表）

当 skills 符合条件时，OpenClaw 会将一个紧凑的可用 skills XML 列表注入系统提示词中（通过 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。其成本是确定性的：

- **基础开销（仅当 ≥1 个 skill 时）：** 195 个字符。
- **每个 skill：** 97 个字符 + XML 转义后的 `<name>`、`<description>` 和 `<location>` 值的长度。

公式（字符数）：

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

说明：

- XML 转义会将 `& < > " '` 扩展为实体（如 `&amp;`、`&lt;` 等），从而增加长度。
- Token 数会因模型分词器而异。粗略按 OpenAI 风格估算，约为每 4 个字符 1 个 token，因此**97 个字符 ≈ 24 个 token**，外加你实际字段的长度。

## 托管 skills 生命周期

OpenClaw 会随安装（`npm` 包或 OpenClaw.app）附带一组基础 skills，作为**内置 skills** 提供。`~/.openclaw/skills` 用于本地覆盖（例如，在不更改内置副本的情况下固定/修补某个 skill）。工作区 skills 由用户拥有，在名称冲突时会覆盖前两者。

## 配置参考

完整配置 schema 请参见 [Skills 配置](/zh-CN/tools/skills-config)。

## 想找更多 skills？

浏览 [https://clawhub.ai](https://clawhub.ai)。

---

## 相关内容

- [创建 Skills](/zh-CN/tools/creating-skills) — 构建自定义 skills
- [Skills 配置](/zh-CN/tools/skills-config) — skill 配置参考
- [Slash Commands](/zh-CN/tools/slash-commands) — 所有可用的斜杠命令
- [Plugins](/zh-CN/tools/plugin) — 插件系统概览
