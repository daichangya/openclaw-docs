---
read_when:
    - 搜索、安装或更新 Skills 或插件
    - 将 Skills 或插件发布到注册表
    - 配置 `clawhub` CLI 或其环境变量覆盖项
sidebarTitle: ClawHub
summary: ClawHub：面向 OpenClaw Skills 和插件的公开注册表、原生安装流程，以及 `clawhub` CLI
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T06:01:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub 是面向 **OpenClaw Skills 和插件** 的公开注册表。

- 使用原生 `openclaw` 命令来搜索、安装和更新 Skills，以及从 ClawHub 安装插件。
- 使用单独的 `clawhub` CLI 进行注册表认证、发布、删除 / 恢复删除，以及同步工作流。

网站：[clawhub.ai](https://clawhub.ai)

## 快速开始

<Steps>
  <Step title="搜索">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="安装">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="使用">
    启动一个新的 OpenClaw 会话——它会识别新安装的 Skill。
  </Step>
  <Step title="发布（可选）">
    对于需要注册表认证的工作流（发布、同步、管理），请安装单独的 `clawhub` CLI：

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 原生 OpenClaw 流程

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生 `openclaw` 命令会安装到你的当前工作区中，并持久保存源元数据，以便后续的 `update` 调用能够继续使用 ClawHub。

  </Tab>
  <Tab title="插件">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    裸的、符合 npm 安全规范的插件说明符也会在 npm 之前先尝试通过 ClawHub 解析：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    插件安装会在归档安装开始前验证所声明的 `pluginApi` 和 `minGatewayVersion` 兼容性，因此不兼容的宿主会尽早以关闭方式失败，而不是在包部分安装后才失败。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 只接受可安装的插件族。如果某个 ClawHub 包实际上是一个 Skill，OpenClaw 会停止操作，并改为提示你使用 `openclaw skills install <slug>`。

匿名安装 ClawHub 插件时，私有包同样会以关闭方式失败。社区或其他非官方渠道仍然可以安装，但 OpenClaw 会发出警告，以便运营者在启用前审查来源和验证信息。
</Note>

## ClawHub 是什么

- 一个面向 OpenClaw Skills 和插件的公开注册表。
- 一个带版本管理的 Skill 包和元数据存储。
- 一个用于搜索、标签和使用信号的发现入口。

一个典型的 Skill 是一个带版本的文件包，通常包含：

- 一个 `SKILL.md` 文件，内含主要描述和使用方式。
- Skill 所使用的可选配置、脚本或辅助文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来支持发现能力，并安全地公开 Skill 的能力。注册表会追踪使用信号（星标、下载量）以改进排序和可见性。每次发布都会创建一个新的 semver 版本，注册表会保留版本历史，以便用户审计变更。

## 工作区和 Skill 加载

单独的 `clawhub` CLI 也会将 Skills 安装到当前工作目录下的 `./skills` 中。如果已配置 OpenClaw 工作区，`clawhub` 会回退到该工作区，除非你使用 `--workdir`（或 `CLAWHUB_WORKDIR`）覆盖。OpenClaw 会从 `<workspace>/skills` 加载工作区 Skills，并在**下一次**会话中识别它们。

如果你已经在使用 `~/.openclaw/skills` 或内置 Skills，工作区 Skills 会优先生效。关于 Skills 如何加载、共享和受限的更多细节，请参阅 [Skills](/zh-CN/tools/skills)。

## 服务功能

| 功能 | 说明 |
| ------------------ | ---------------------------------------------------------- |
| 公开浏览 | Skills 及其 `SKILL.md` 内容可公开查看。 |
| 搜索 | 由嵌入驱动（向量搜索），而不只是关键词。 |
| 版本管理 | Semver、更新日志和标签（包括 `latest`）。 |
| 下载 | 每个版本提供 Zip。 |
| 星标和评论 | 社区反馈。 |
| 审核 | 审批和审计。 |
| 适合 CLI 的 API | 适用于自动化和脚本编写。 |

## 安全性与审核

ClawHub 默认开放——任何人都可以上传 Skills，但发布者的 GitHub 账号必须**至少注册满一周**。这样可以减缓滥用，同时不阻碍合法贡献者。

<AccordionGroup>
  <Accordion title="举报">
    - 任何已登录用户都可以举报一个 Skill。
    - 举报原因是必填项，并会被记录。
    - 每位用户同时最多可有 20 个有效举报。
    - 收到超过 3 个不同用户举报的 Skill 默认会被自动隐藏。
  </Accordion>
  <Accordion title="审核">
    - 审核员可以查看被隐藏的 Skills、取消隐藏、删除它们，或封禁用户。
    - 滥用举报功能可能导致账号被封禁。
    - 想成为审核员？请在 OpenClaw Discord 中提出，并联系一位审核员或维护者。
  </Accordion>
</AccordionGroup>

## ClawHub CLI

你只在需要注册表认证的工作流（例如发布 / 同步）时才需要它。

### 全局选项

<ParamField path="--workdir <dir>" type="string">
  工作目录。默认：当前目录；回退到 OpenClaw 工作区。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills 目录，相对于 workdir。
</ParamField>
<ParamField path="--site <url>" type="string">
  站点基础 URL（浏览器登录）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  注册表 API 基础 URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  禁用提示（非交互模式）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  打印 CLI 版本。
</ParamField>

### 命令

<AccordionGroup>
  <Accordion title="认证（login / logout / whoami）">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    登录选项：

    - `--token <token>` — 粘贴一个 API 令牌。
    - `--label <label>` — 为浏览器登录令牌存储的标签（默认：`CLI token`）。
    - `--no-browser` — 不打开浏览器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜索">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — 最大结果数。

  </Accordion>
  <Accordion title="安装 / 更新 / 列表">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    选项：

    - `--version <version>` — 安装或更新到指定版本（在 `update` 中仅适用于单个 slug）。
    - `--force` — 如果文件夹已存在，或本地文件与任何已发布版本都不匹配时，执行覆盖。
    - `clawhub list` 会读取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="发布 Skills">
    ```bash
    clawhub skill publish <path>
    ```

    选项：

    - `--slug <slug>` — Skill slug。
    - `--name <name>` — 显示名称。
    - `--version <version>` — semver 版本。
    - `--changelog <text>` — 更新日志文本（可以为空）。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。

  </Accordion>
  <Accordion title="发布插件">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL。

    选项：

    - `--dry-run` — 构建精确的发布计划，但不上传任何内容。
    - `--json` — 为 CI 输出机器可读格式。
    - `--source-repo`、`--source-commit`、`--source-ref` — 当自动检测不足时使用的可选覆盖项。

  </Accordion>
  <Accordion title="删除 / 恢复删除（所有者或管理员）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（扫描本地 + 发布新增或更新项）">
    ```bash
    clawhub sync
    ```

    选项：

    - `--root <dir...>` — 额外的扫描根目录。
    - `--all` — 不提示，直接上传所有内容。
    - `--dry-run` — 显示将要上传的内容。
    - `--bump <type>` — 更新时使用 `patch|minor|major`（默认：`patch`）。
    - `--changelog <text>` — 非交互更新时的更新日志。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。
    - `--concurrency <n>` — 注册表检查并发数（默认：`4`）。

  </Accordion>
</AccordionGroup>

## 常见工作流

<Tabs>
  <Tab title="搜索">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="安装">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="全部更新">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="发布单个 Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多个 Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="从 GitHub 发布插件">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### 插件包元数据

代码插件必须在 `package.json` 中包含所需的 OpenClaw 元数据：

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

已发布的包应当附带**已构建的 JavaScript**，并将 `runtimeExtensions` 指向该输出。Git 检出安装在不存在已构建文件时，仍可回退到 TypeScript 源码，但使用已构建的运行时入口可以避免在启动、Doctor 和插件加载路径中进行运行时 TypeScript 编译。

## 版本管理、锁文件和遥测

<AccordionGroup>
  <Accordion title="版本管理和标签">
    - 每次发布都会创建一个新的 **semver** `SkillVersion`。
    - 标签（如 `latest`）指向某个版本；移动标签可以让你回滚。
    - 更新日志按版本附加，在同步或发布更新时可以为空。
  </Accordion>
  <Accordion title="本地更改与注册表版本">
    更新会使用内容哈希将本地 Skill 内容与注册表版本进行比较。如果本地文件与任何已发布版本都不匹配，CLI 会在覆盖前询问（或者在非交互运行中要求使用 `--force`）。
  </Accordion>
  <Accordion title="同步扫描和回退根目录">
    `clawhub sync` 会先扫描你当前的 workdir。如果未找到任何 Skills，它会回退到已知的旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这是为了在无需额外标志的情况下找到较旧的 Skill 安装。
  </Accordion>
  <Accordion title="存储和锁文件">
    - 已安装的 Skills 会记录在你的 workdir 下的 `.clawhub/lock.json` 中。
    - 认证令牌会存储在 ClawHub CLI 配置文件中（可通过 `CLAWHUB_CONFIG_PATH` 覆盖）。
  </Accordion>
  <Accordion title="遥测（安装计数）">
    当你在登录状态下运行 `clawhub sync` 时，CLI 会发送一个最小化快照以计算安装计数。你可以完全禁用此功能：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

| 环境变量 | 作用 |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE` | 覆盖站点 URL。 |
| `CLAWHUB_REGISTRY` | 覆盖注册表 API URL。 |
| `CLAWHUB_CONFIG_PATH` | 覆盖 CLI 存储令牌 / 配置的位置。 |
| `CLAWHUB_WORKDIR` | 覆盖默认 workdir。 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用 `sync` 的遥测。 |

## 相关内容

- [社区插件](/zh-CN/plugins/community)
- [插件](/zh-CN/tools/plugin)
- [Skills](/zh-CN/tools/skills)
