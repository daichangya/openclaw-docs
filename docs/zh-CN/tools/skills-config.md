---
read_when:
    - 添加或修改 Skills 配置
    - 调整内置允许列表或安装行为
summary: Skills 配置 schema 和示例
title: Skills 配置
x-i18n:
    generated_at: "2026-04-23T23:05:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

大多数 Skills 加载器/安装配置都位于 `~/.openclaw/openclaw.json` 的
`skills` 下。按智能体划分的 Skills 可见性位于
`agents.defaults.skills` 和 `agents.list[].skills` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun（Gateway 网关运行时仍为 Node；不推荐 bun）
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或纯文本字符串
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

对于内置图像生成/编辑，优先使用 `agents.defaults.imageGenerationModel`
加核心 `image_generate` 工具。`skills.entries.*` 仅用于自定义或
第三方 Skill 工作流。

如果你选择了特定的图像提供商/模型，也请同时配置该提供商的
认证/API 密钥。典型示例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，
`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

示例：

- 原生 Nano Banana Pro 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 智能体 Skills 允许列表

当你希望使用同一台机器/工作区的 Skill 根目录，但为不同智能体提供
不同的可见 Skill 集合时，请使用智能体配置。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承默认值 -> github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

规则：

- `agents.defaults.skills`：为省略
  `agents.list[].skills` 的智能体提供共享基线允许列表。
- 省略 `agents.defaults.skills`，则默认 Skills 不受限制。
- `agents.list[].skills`：该智能体的显式最终 Skill 集合；它不会
  与默认值合并。
- `agents.list[].skills: []`：该智能体不暴露任何 Skills。

## 字段

- 内置 Skill 根目录始终包括 `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：仅针对**内置** Skills 的可选允许列表。设置后，只有
  列表中的内置 Skills 才有资格启用（受管、智能体和工作区 Skills 不受影响）。
- `load.extraDirs`：要扫描的附加 Skill 目录（优先级最低）。
- `load.watch`：监视 Skill 文件夹并刷新 Skills 快照（默认：true）。
- `load.watchDebounceMs`：Skill watcher 事件的去抖动时间（毫秒）（默认：250）。
- `install.preferBrew`：在可用时优先使用 brew 安装器（默认：true）。
- `install.nodeManager`：node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：npm）。
  这仅影响 **Skill 安装**；Gateway 网关运行时仍应为 Node
  （不推荐 Bun 用于 WhatsApp/Telegram）。
  - `openclaw setup --node-manager` 范围更窄，目前仅接受 `npm`、
    `pnpm` 或 `bun`。如果你想使用 Yarn 支持的 Skill 安装，请手动设置 `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：按 Skill 的覆盖。
- `agents.defaults.skills`：可选的默认 Skill 允许列表，供省略
  `agents.list[].skills` 的智能体继承。
- `agents.list[].skills`：可选的按智能体最终 Skill 允许列表；显式
  列表会替换继承的默认值，而不是合并。

按 Skill 的字段：

- `enabled`：设为 `false` 可禁用某个 Skill，即使它已内置/已安装。
- `env`：注入到智能体运行中的环境变量（仅当尚未设置时）。
- `apiKey`：适用于声明了主环境变量的 Skills 的可选便捷字段。
  支持纯文本字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 说明

- `entries` 下的键默认会映射到 Skill 名称。如果某个 Skill 定义了
  `metadata.openclaw.skillKey`，请改用该键。
- 加载优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 内置 Skills →
  `skills.load.extraDirs`。
- 当 watcher 启用时，对 Skills 的更改会在下一次智能体轮次时生效。

### 沙箱隔离 Skills + 环境变量

当某个会话处于**沙箱隔离**状态时，Skill 进程会在已配置的
沙箱后端中运行。该沙箱**不会**继承宿主机的 `process.env`。

请使用以下方式之一：

- Docker 后端使用 `agents.defaults.sandbox.docker.env`（或按智能体的 `agents.list[].sandbox.docker.env`）
- 将环境变量烘焙到你的自定义沙箱镜像或远程沙箱环境中

全局 `env` 以及 `skills.entries.<skill>.env/apiKey` 仅适用于**宿主机**运行。

## 相关内容

- [Skills](/zh-CN/tools/skills)
- [创建 Skills](/zh-CN/tools/creating-skills)
- [Slash Commands](/zh-CN/tools/slash-commands)
