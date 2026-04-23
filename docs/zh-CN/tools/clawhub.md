---
read_when:
    - 向新用户介绍 ClawHub to=final code omitted
    - 安装、搜索或发布 Skills 或插件 to=final code omitted
    - 解释 ClawHub CLI 标志和同步行为 to=final code omitted
summary: ClawHub 指南：公共注册表、原生 OpenClaw 安装流程，以及 ClawHub CLI 工作流
title: ClawHub
x-i18n:
    generated_at: "2026-04-23T21:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47bcec99e4a807773dc84e1dfd974c87ccca99022a680c31086da26a9a69478b
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub 是 **OpenClaw Skills 和插件**的公共注册表。

- 使用原生 `openclaw` 命令来搜索/安装/更新 Skills，并从
  ClawHub 安装插件。
- 当你需要注册表认证、发布、删除、取消删除或同步工作流时，
  使用独立的 `clawhub` CLI。

网站： [clawhub.ai](https://clawhub.ai)

## 原生 OpenClaw 流程

Skills：

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

插件：

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

裸 npm-safe 插件 spec 也会在尝试 npm 之前先尝试 ClawHub：

```bash
openclaw plugins install openclaw-codex-app-server
```

原生 `openclaw` 命令会安装到你当前活动的工作区，并持久化来源
元数据，这样后续的 `update` 调用就能继续停留在 ClawHub 上。

插件安装会在归档安装运行之前验证已声明的 `pluginApi` 和 `minGatewayVersion`
兼容性，因此不兼容的主机会尽早 fail closed，而不是部分安装该包。

`openclaw plugins install clawhub:...` 只接受可安装的插件家族。
如果某个 ClawHub 包实际上是一个 skill，OpenClaw 会停止，并提示你改用
`openclaw skills install <slug>`。

## ClawHub 是什么

- 一个面向 OpenClaw Skills 和插件的公共注册表。
- 一个带版本管理的 skill bundle 与元数据存储。
- 一个用于搜索、标签和使用信号的发现表面。

## 它如何工作

1. 用户发布一个 skill bundle（文件 + 元数据）。
2. ClawHub 存储该 bundle，解析元数据，并分配一个版本。
3. 注册表为该 skill 建立索引，以供搜索和发现。
4. 用户在 OpenClaw 中浏览、下载并安装 Skills。

## 你可以做什么

- 发布新 Skills，以及现有 Skills 的新版本。
- 按名称、标签或搜索来发现 Skills。
- 下载 skill bundles 并检查其中的文件。
- 举报具有滥用性或不安全的 Skills。
- 如果你是版主，可以隐藏、取消隐藏、删除或封禁。

## 适合谁使用（对新手友好）

如果你想为 OpenClaw 智能体添加新能力，ClawHub 是发现和安装 Skills 的最简单方式。你不需要知道后端如何工作。你可以：

- 用自然语言搜索 Skills。
- 将 skill 安装到你的工作区。
- 之后用一条命令更新 Skills。
- 通过发布自己的 Skills 来备份它们。

## 快速开始（非技术）

1. 搜索你需要的内容：
   - `openclaw skills search "calendar"`
2. 安装一个 skill：
   - `openclaw skills install <skill-slug>`
3. 启动一个新的 OpenClaw 会话，让它加载新的 skill。
4. 如果你想发布或管理注册表认证，还需要安装独立的
   `clawhub` CLI。

## 安装 ClawHub CLI

只有在需要注册表认证工作流（例如发布/同步）时，你才需要它：

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## 它如何融入 OpenClaw

原生 `openclaw skills install` 会安装到当前活动工作区的 `skills/`
目录中。`openclaw plugins install clawhub:...` 会记录一次常规的受管插件安装，并为后续更新记录 ClawHub 来源元数据。

匿名的 ClawHub 插件安装在私有包场景下也会 fail closed。
社区渠道或其他非官方渠道仍然可以安装，但 OpenClaw 会发出警告，
让运维者在启用前审查来源和验证情况。

独立的 `clawhub` CLI 也会将 Skills 安装到当前工作目录下的 `./skills` 中。如果已配置 OpenClaw 工作区，`clawhub`
会回退到该工作区，除非你通过 `--workdir`（或
`CLAWHUB_WORKDIR`）进行覆盖。OpenClaw 会从 `<workspace>/skills`
加载工作区 Skills，并会在**下一次**会话中加载它们。如果你已经在使用
`~/.openclaw/skills` 或内置 Skills，则工作区 Skills 优先。

关于 Skills 如何加载、共享和门控的更多细节，请参见
[Skills](/zh-CN/tools/skills)。

## Skill 系统概览

Skill 是一个带版本管理的文件 bundle，用于教 OpenClaw 如何执行某项
特定任务。每次发布都会创建一个新版本，而注册表会保留
版本历史，以便用户审计变更。

一个典型的 skill 包括：

- 一个 `SKILL.md` 文件，包含主要描述和用法。
- Skill 使用的可选配置、脚本或支持文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来驱动发现能力，并安全地暴露 skill 能力。
注册表还会跟踪使用信号（如 stars 和下载量）以改善
排序和可见性。

## 服务提供什么（功能）

- **公开浏览** Skills 及其 `SKILL.md` 内容。
- **搜索** 由嵌入（向量搜索）驱动，而不仅仅是关键词。
- **版本管理**，支持 semver、changelog 和标签（包括 `latest`）。
- **下载**，每个版本都可下载 zip。
- **Stars 与评论**，用于社区反馈。
- **审核** hooks，用于审批和审计。
- **适合 CLI 的 API**，用于自动化和脚本。

## 安全与审核

ClawHub 默认是开放的。任何人都可以上传 Skills，但要发布，GitHub 账户必须
至少已创建一周。这有助于减缓滥用，而不会阻碍
正常贡献者。

举报与审核：

- 任何已登录用户都可以举报一个 skill。
- 举报原因必须填写，并会被记录。
- 每个用户同时最多可拥有 20 条活动举报。
- 默认情况下，被超过 3 个不同用户举报的 skill 会自动隐藏。
- 版主可以查看隐藏的 Skills、取消隐藏、删除它们，或封禁用户。
- 滥用举报功能可能会导致账户被封禁。

有兴趣成为版主？请在 OpenClaw Discord 中联系
版主或维护者。

## CLI 命令与参数

全局选项（适用于所有命令）：

- `--workdir <dir>`：工作目录（默认：当前目录；会回退到 OpenClaw 工作区）。
- `--dir <dir>`：Skills 目录，相对于 workdir（默认：`skills`）。
- `--site <url>`：站点基础 URL（浏览器登录）。
- `--registry <url>`：注册表 API 基础 URL。
- `--no-input`：禁用提示（非交互）。
- `-V, --cli-version`：打印 CLI 版本。

认证：

- `clawhub login`（浏览器流程）或 `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

选项：

- `--token <token>`：粘贴 API 令牌。
- `--label <label>`：为浏览器登录令牌保存的标签（默认：`CLI token`）。
- `--no-browser`：不打开浏览器（需要 `--token`）。

搜索：

- `clawhub search "query"`
- `--limit <n>`：最大结果数。

安装：

- `clawhub install <slug>`
- `--version <version>`：安装指定版本。
- `--force`：如果文件夹已存在，则覆盖。

更新：

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`：更新到指定版本（仅单个 slug）。
- `--force`：当本地文件与任何已发布版本都不匹配时，强制覆盖。

列出：

- `clawhub list`（读取 `.clawhub/lock.json`）

发布 Skills：

- `clawhub skill publish <path>`
- `--slug <slug>`：Skill slug。
- `--name <name>`：显示名称。
- `--version <version>`：Semver 版本。
- `--changelog <text>`：Changelog 文本（可为空）。
- `--tags <tags>`：逗号分隔标签（默认：`latest`）。

发布插件：

- `clawhub package publish <source>`
- `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref`，或 GitHub URL。
- `--dry-run`：构建精确的发布计划，但不上传任何内容。
- `--json`：为 CI 输出机器可读格式。
- `--source-repo`、`--source-commit`、`--source-ref`：当自动检测不足时使用的可选覆盖项。

删除/取消删除（仅 owner/admin）：

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

同步（扫描本地 Skills + 发布新/更新内容）：

- `clawhub sync`
- `--root <dir...>`：额外扫描根目录。
- `--all`：不提示，直接上传所有内容。
- `--dry-run`：显示将要上传的内容。
- `--bump <type>`：更新时使用 `patch|minor|major`（默认：`patch`）。
- `--changelog <text>`：用于非交互式更新的 changelog。
- `--tags <tags>`：逗号分隔标签（默认：`latest`）。
- `--concurrency <n>`：注册表检查并发数（默认：4）。

## 智能体常用工作流

### 搜索 Skills

```bash
clawhub search "postgres backups"
```

### 下载新 Skills

```bash
clawhub install my-skill-pack
```

### 更新已安装 Skills

```bash
clawhub update --all
```

### 备份你的 Skills（发布或同步）

对于单个 skill 文件夹：

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

若要一次扫描并备份多个 Skills：

```bash
clawhub sync --all
```

### 从 GitHub 发布插件

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

代码插件必须在 `package.json` 中包含必需的 OpenClaw 元数据：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

已发布的包应包含已构建的 JavaScript，并将 `runtimeExtensions`
指向该输出。Git 检出安装在没有已构建文件时仍可回退到 TypeScript 源码，
但已构建的运行时入口可以避免在启动、doctor 和插件加载路径中进行运行时 TypeScript
编译。

## 高级细节（技术）

### 版本管理与标签

- 每次发布都会创建一个新的 **semver** `SkillVersion`。
- 标签（如 `latest`）指向某个版本；移动标签即可实现回滚。
- Changelog 是按版本附加的，在同步或发布更新时允许为空。

### 本地变更与注册表版本

更新会通过内容哈希将本地 skill 内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或在非交互式运行中要求使用 `--force`）。

### 同步扫描与回退根目录

`clawhub sync` 会先扫描你的当前 workdir。如果没有发现 Skills，它会回退到已知旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这样设计是为了在无需额外标志的情况下发现旧版 skill 安装。

### 存储与锁文件

- 已安装的 Skills 会记录在 workdir 下的 `.clawhub/lock.json` 中。
- 认证令牌存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。

### 遥测（安装计数）

当你在已登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小快照来计算安装次数。你可以完全禁用此行为：

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 环境变量

- `CLAWHUB_SITE`：覆盖站点 URL。
- `CLAWHUB_REGISTRY`：覆盖注册表 API URL。
- `CLAWHUB_CONFIG_PATH`：覆盖 CLI 存储令牌/配置的位置。
- `CLAWHUB_WORKDIR`：覆盖默认 workdir。
- `CLAWHUB_DISABLE_TELEMETRY=1`：在 `sync` 时禁用遥测。
