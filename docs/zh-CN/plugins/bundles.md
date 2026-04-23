---
read_when:
    - 你想安装一个兼容 Codex、Claude 或 Cursor 的套装
    - 你需要了解 OpenClaw 如何将套装内容映射到原生功能
    - 你正在调试套装检测或缺失的能力
summary: 将 Codex、Claude 和 Cursor 套装作为 OpenClaw plugin 安装并使用
title: Plugin 套装
x-i18n:
    generated_at: "2026-04-23T07:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c9e48738e059c302157dd8733178109cf34840f32a3d7b5b767ac019fbc581b
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin 套装

OpenClaw 可以从三个外部生态安装 plugin：**Codex**、**Claude**、
和 **Cursor**。这些被称为 **套装** —— 即内容与元数据包，OpenClaw
会将其映射为原生功能，例如 skills、hooks 和 MCP 工具。

<Info>
  套装**不**等同于原生 OpenClaw plugin。原生 plugin 在进程内运行，
  可以注册任意能力。套装是内容包，只支持选择性的功能映射，并且
  具有更窄的信任边界。
</Info>

## 为什么会有套装

许多有用的 plugin 是以 Codex、Claude 或 Cursor 格式发布的。OpenClaw
不会要求作者将它们重写为原生 OpenClaw plugin，而是会检测这些格式，
并将其中受支持的内容映射到原生功能集中。这意味着你可以安装 Claude
命令包或 Codex skill 套装，并立即使用它。

## 安装套装

<Steps>
  <Step title="从目录、归档文件或 marketplace 安装">
    ```bash
    # 本地目录
    openclaw plugins install ./my-bundle

    # 归档文件
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套装会显示为 `Format: bundle`，其子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    已映射的功能（skills、hooks、MCP 工具、LSP 默认值）会在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 会从套装中映射什么

并不是套装中的每项功能当前都能在 OpenClaw 中运行。下面说明了哪些功能
当前可用，哪些功能虽能被检测到但尚未接线。

### 当前支持

| 功能 | 映射方式 | 适用范围 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill 内容 | 套装 skill 根目录会像普通 OpenClaw Skills 一样加载 | 所有格式 |
| 命令 | `commands/` 和 `.cursor/commands/` 被视为 skill 根目录 | Claude、Cursor |
| Hook 包 | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局 | Codex |
| MCP 工具 | 套装 MCP 配置会合并到内置 Pi 设置中；支持的 stdio 和 HTTP 服务器会被加载 | 所有格式 |
| LSP 服务器 | Claude `.lsp.json` 和清单中声明的 `lspServers` 会合并到内置 Pi 的 LSP 默认值中 | Claude |
| 设置 | Claude `settings.json` 会作为内置 Pi 默认值导入 | Claude |

#### Skill 内容

- 套装 skill 根目录会像普通 OpenClaw skill 根目录一样加载
- Claude `commands` 根目录会被视为附加的 skill 根目录
- Cursor `.cursor/commands` 根目录会被视为附加的 skill 根目录

这意味着 Claude Markdown 命令文件会通过普通的 OpenClaw skill
加载器运行。Cursor 命令 Markdown 也通过同一路径运行。

#### Hook 包

- 只有当套装 hook 根目录使用普通的 OpenClaw hook-pack
  布局时，套装 hook 根目录才会工作。当前这主要是兼容 Codex 的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### 用于 Pi 的 MCP

- 已启用的套装可以提供 MCP 服务器配置
- OpenClaw 会将套装 MCP 配置合并到生效的内置 Pi 设置中，键名为
  `mcpServers`
- OpenClaw 会在内置 Pi 智能体回合期间公开受支持的套装 MCP 工具，方式是
  启动 stdio 服务器或连接到 HTTP 服务器
- `coding` 和 `messaging` 工具配置默认包含套装 MCP 工具；可使用 `tools.deny: ["bundle-mcp"]` 为某个智能体或 Gateway 网关选择退出
- 项目本地 Pi 设置仍会在套装默认值之后生效，因此在需要时，
  工作区设置可以覆盖套装 MCP 条目
- 套装 MCP 工具目录在注册前会按确定性顺序排序，因此上游
  `listTools()` 顺序变化不会扰动 prompt-cache 工具块

##### 传输协议

MCP 服务器可以使用 stdio 或 HTTP 传输协议：

**Stdio** 会启动一个子进程：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** 会连接到一个正在运行的 MCP 服务器，默认使用 `sse`，如有请求则使用 `streamable-http`：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` 可设置为 `"streamable-http"` 或 `"sse"`；省略时，OpenClaw 使用 `sse`
- 仅允许 `http:` 和 `https:` URL scheme
- `headers` 的值支持 `${ENV_VAR}` 插值
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝
- URL 凭证（userinfo 和查询参数）会从工具
  描述和日志中脱敏
- `connectionTimeoutMs` 会覆盖默认的 30 秒连接超时，
  对 stdio 和 HTTP 传输协议都生效

##### 工具命名

OpenClaw 会以提供商安全的名称格式注册套装 MCP 工具：
`serverName__toolName`。例如，键名为 `"vigil-harbor"` 的服务器公开了一个
`memory_search` 工具，它会注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会被替换为 `-`
- 服务器前缀最长为 30 个字符
- 完整工具名最长为 64 个字符
- 空服务器名会回退为 `mcp`
- 发生清洗后重名时，会使用数字后缀消歧
- 最终公开的工具顺序会按安全名称确定性排序，以保持重复的 Pi
  回合在缓存上稳定
- 配置过滤会将来自同一个套装 MCP 服务器的所有工具视为由
  `bundle-mcp` plugin 拥有，因此配置 allowlist 和 deny list 可以包含
  单个公开工具名，也可以包含 `bundle-mcp` plugin 键

#### 内置 Pi 设置

- 启用套装后，Claude `settings.json` 会作为默认内置 Pi 设置导入
- OpenClaw 会在应用前清洗 shell 覆盖键

已清洗的键：

- `shellPath`
- `shellCommandPrefix`

#### 内置 Pi LSP

- 已启用的 Claude 套装可以提供 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及清单中声明的所有 `lspServers` 路径
- 套装 LSP 配置会合并到生效的内置 Pi LSP 默认值中
- 当前只有受支持的基于 stdio 的 LSP 服务器可以运行；不受支持的
  传输协议仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测到但不会执行

这些内容会被识别并显示在诊断信息中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 行内/应用元数据（能力报告之外的部分）

## 套装格式

<AccordionGroup>
  <Accordion title="Codex 套装">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex 套装使用 skill 根目录和 OpenClaw 风格的
    hook-pack 目录（`HOOK.md` + `handler.ts`）时，与 OpenClaw 最契合。

  </Accordion>

  <Accordion title="Claude 套装">
    两种检测模式：

    - **基于清单：** `.claude-plugin/plugin.json`
    - **无清单：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特有行为：

    - `commands/` 被视为 skill 内容
    - `settings.json` 会导入到内置 Pi 设置中（shell 覆盖键会被清洗）
    - `.mcp.json` 会向内置 Pi 公开受支持的 stdio 工具
    - `.lsp.json` 加上清单中声明的 `lspServers` 路径会加载到内置 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测到，但不会执行
    - 清单中的自定义组件路径是增量式的（扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor 套装">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 被视为 skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测，不执行

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生 plugin 格式：

1. `openclaw.plugin.json` 或带有 `openclaw.extensions` 的有效 `package.json` —— 视为**原生 plugin**
2. 套装标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）—— 视为**套装**

如果一个目录同时包含两者，OpenClaw 会使用原生路径。这样可以防止
双格式包被部分地当作套装安装。

## 运行时依赖与清理

- 内置 plugin 的运行时依赖会随 OpenClaw 包一起发布，位于
  `dist/*` 下。OpenClaw **不会**在启动时为内置
  plugin 运行 `npm install`；发布流水线负责提供完整的内置
  依赖负载（参见
  [发布](/zh-CN/reference/RELEASING) 中的 postpublish 校验规则）。
- 启动套装 MCP 服务器的子智能体运行，会在子智能体退出时通过共享的
  运行时清理路径释放这些 MCP 客户端，因此
  子智能体生命周期不会在多个回合之间泄漏 stdio 子进程或长期存活的 MCP
  连接。

## 安全性

与原生 plugin 相比，套装具有更窄的信任边界：

- OpenClaw **不会**在进程内加载任意套装运行时模块
- Skills 和 hook-pack 路径必须保持在 plugin 根目录内（带边界检查）
- 设置文件会使用相同的边界检查进行读取
- 受支持的 stdio MCP 服务器可能会作为子进程启动

这使套装在默认情况下更安全，但对于它们所暴露功能所涉及的第三方
套装内容，你仍应将其视为受信任内容。

## 故障排除

<AccordionGroup>
  <Accordion title="已检测到套装，但能力没有运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力已列出，但标记为
    未接线，那是产品限制——并非安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件没有出现">
    请确认套装已启用，并且 Markdown 文件位于已检测到的
    `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置没有生效">
    当前仅支持来自 `settings.json` 的内置 Pi 设置。OpenClaw 不会
    将套装设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude hooks 没有执行">
    `hooks/hooks.json` 仅检测，不执行。如果你需要可运行的 hooks，请使用
    OpenClaw hook-pack 布局，或提供原生 plugin。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装并配置 Plugins](/zh-CN/tools/plugin)
- [构建 Plugins](/zh-CN/plugins/building-plugins) — 创建原生 plugin
- [Plugin 清单](/zh-CN/plugins/manifest) — 原生清单 schema
