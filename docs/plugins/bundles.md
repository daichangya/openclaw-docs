---
read_when:
    - 你希望安装一个兼容 Codex、Claude 或 Cursor 的套件
    - You need to understand how OpenClaw maps bundle content into native features
    - 你正在调试套件检测或缺失的能力
summary: 将 Codex、Claude 和 Cursor 套件作为 OpenClaw 插件安装并使用
title: 插件套件
x-i18n:
    generated_at: "2026-04-23T20:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw 可以从三个外部生态安装插件：**Codex**、**Claude**
和 **Cursor**。这些被称为**套件**——内容与元数据包，
OpenClaw 会将其映射为原生功能，例如 Skills、hooks 和 MCP 工具。

<Info>
  套件**不同于**原生 OpenClaw 插件。原生插件在进程内运行，
  并且可以注册任意能力。套件则是内容包，具有选择性的功能映射和更窄的信任边界。
</Info>

## 为什么需要套件

许多有用的插件是以 Codex、Claude 或 Cursor 格式发布的。OpenClaw
不会要求作者将它们重写为原生 OpenClaw 插件，而是会检测这些格式，并将其受支持的内容映射到原生功能集中。  
这意味着你可以安装一个 Claude 命令包或一个 Codex Skills 套件，
并立即使用它。

## 安装套件

<Steps>
  <Step title="从目录、归档文件或市场安装">
    ```bash
    # 本地目录
    openclaw plugins install ./my-bundle

    # 归档文件
    openclaw plugins install ./my-bundle.tgz

    # Claude 市场
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件会显示为 `Format: bundle`，子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（Skills、hooks、MCP 工具、LSP 默认值）会在下一次会话中可用。

  </Step>
</Steps>

## OpenClaw 会从套件中映射哪些内容

并非所有套件功能目前都能在 OpenClaw 中运行。以下列出了当前可用的部分，以及已经检测到但尚未接线的部分。

### 当前支持

| 功能 | 映射方式 | 适用范围 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skills 内容 | 套件 Skills 根目录会像普通 OpenClaw Skills 一样加载 | 所有格式 |
| 命令 | `commands/` 和 `.cursor/commands/` 会被视为 Skills 根目录 | Claude、Cursor |
| Hook 包 | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局 | Codex |
| MCP 工具 | 套件 MCP 配置会合并到嵌入式 Pi 设置中；受支持的 stdio 和 HTTP 服务器会被加载 | 所有格式 |
| LSP 服务器 | Claude `.lsp.json` 和 manifest 声明的 `lspServers` 会合并到嵌入式 Pi LSP 默认值中 | Claude |
| 设置 | Claude `settings.json` 会作为嵌入式 Pi 默认值导入 | Claude |

#### Skills 内容

- 套件 Skills 根目录会像普通 OpenClaw Skills 根目录一样加载
- Claude 的 `commands` 根目录会被视为额外的 Skills 根目录
- Cursor 的 `.cursor/commands` 根目录会被视为额外的 Skills 根目录

这意味着 Claude 的 markdown 命令文件可以通过正常的 OpenClaw Skills
加载器工作。Cursor 的命令 markdown 也会通过同一路径工作。

#### Hook 包

- 套件 hook 根目录**仅当**使用普通 OpenClaw hook-pack
  布局时才可工作。目前主要是兼容 Codex 的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### 面向 Pi 的 MCP

- 已启用的套件可以提供 MCP 服务器配置
- OpenClaw 会将套件 MCP 配置合并到生效中的嵌入式 Pi 设置里，作为
  `mcpServers`
- 在嵌入式 Pi 智能体轮次中，OpenClaw 会通过启动 stdio 服务器或连接到 HTTP 服务器，暴露受支持的套件 MCP 工具
- `coding` 和 `messaging` 工具配置文件默认包含套件 MCP 工具；如果你想为某个智能体或 Gateway 网关禁用它们，请使用 `tools.deny: ["bundle-mcp"]`
- 项目本地 Pi 设置仍会在套件默认值之后生效，因此在需要时，工作区设置可以覆盖套件 MCP 条目
- 套件 MCP 工具目录在注册前会进行确定性排序，因此上游 `listTools()` 顺序变化不会导致提示缓存工具块频繁抖动

##### 传输协议

MCP 服务器可以使用 stdio 或 HTTP 传输：

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

**HTTP** 默认通过 `sse` 连接到正在运行的 MCP 服务器，若指定则可使用 `streamable-http`：

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
- URL 凭证（userinfo 和 query params）会从工具
  描述和日志中脱敏
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输的默认 30 秒连接超时

##### 工具命名

OpenClaw 会以 provider 安全名称的形式注册套件 MCP 工具，
格式为 `serverName__toolName`。例如，一个键名为 `"vigil-harbor"` 且暴露
`memory_search` 工具的服务器，会注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会被替换为 `-`
- 服务器名前缀最长为 30 个字符
- 完整工具名最长为 64 个字符
- 空服务器名会回退为 `mcp`
- 清洗后名称冲突时，会使用数字后缀消歧
- 最终暴露的工具顺序会按安全名称确定性排序，以保持重复的 Pi
  轮次缓存稳定
- 配置文件过滤会将同一个套件 MCP 服务器中的所有工具都视为由 `bundle-mcp`
  插件拥有，因此配置文件允许列表和拒绝列表既可以包含
  单独暴露的工具名，也可以包含 `bundle-mcp` 插件键

#### 嵌入式 Pi 设置

- 启用套件后，Claude `settings.json` 会作为默认嵌入式 Pi 设置导入
- OpenClaw 在应用前会清理 shell 覆盖键

被清理的键：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 Pi LSP

- 已启用的 Claude 套件可以提供 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及任何 manifest 声明的 `lspServers` 路径
- 套件 LSP 配置会合并到生效中的嵌入式 Pi LSP 默认值中
- 当前仅支持基于 stdio 的 LSP 服务器可运行；不受支持的
  传输方式仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测但不会执行

这些内容会被识别并显示在诊断中，但 OpenClaw 不会执行它们：

- Claude `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 的内联/应用元数据（能力报告之外的内容）

## 套件格式

<AccordionGroup>
  <Accordion title="Codex 套件">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    对于 OpenClaw 来说，当 Codex 套件使用 Skills 根目录和 OpenClaw 风格的
    hook-pack 目录（`HOOK.md` + `handler.ts`）时，兼容性最佳。

  </Accordion>

  <Accordion title="Claude 套件">
    两种检测模式：

    - **基于 manifest：** `.claude-plugin/plugin.json`
    - **无 manifest：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特定行为：

    - `commands/` 会被视为 Skills 内容
    - `settings.json` 会导入到嵌入式 Pi 设置中（shell 覆盖键会被清理）
    - `.mcp.json` 会向嵌入式 Pi 暴露受支持的 stdio 工具
    - `.lsp.json` 以及 manifest 声明的 `lspServers` 路径会加载到嵌入式 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测，但不会执行
    - manifest 中的自定义组件路径是追加式的（它们扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor 套件">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 会被视为 Skills 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测，不执行

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生插件格式：

1. `openclaw.plugin.json` 或带有 `openclaw.extensions` 的有效 `package.json` —— 视为**原生插件**
2. 套件标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）—— 视为**套件**

如果一个目录同时包含两者，OpenClaw 会使用原生路径。这样可以防止
双格式包被部分安装为套件。

## 运行时依赖与清理

- 内置插件的运行时依赖会随 OpenClaw 包一起发布在
  `dist/*` 下。OpenClaw **不会** 在启动时为内置
  插件运行 `npm install`；发布流水线负责提供完整的内置
  依赖负载（参见 [发布策略](/zh-CN/reference/RELEASING) 中的 postpublish 校验规则）。

## 安全性

套件的信任边界比原生插件更窄：

- OpenClaw **不会** 在进程内加载任意套件运行时模块
- Skills 和 hook-pack 路径必须保留在插件根目录内（有边界检查）
- 设置文件会使用相同的边界检查读取
- 受支持的 stdio MCP 服务器可能作为子进程启动

这使得套件默认情况下更安全，但对于它们确实暴露出来的功能，你仍应将第三方套件视为需要信任的内容。

## 故障排除

<AccordionGroup>
  <Accordion title="套件已检测到，但能力未运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力被列出，但标记为
    未接线，那是产品限制——并不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件未出现">
    请确保套件已启用，并且 markdown 文件位于已检测到的
    `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    仅支持来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不会
    将套件设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude hooks 未执行">
    `hooks/hooks.json` 仅检测，不执行。如果你需要可运行的 hooks，请使用
    OpenClaw hook-pack 布局，或提供一个原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin)
- [构建插件](/zh-CN/plugins/building-plugins) — 创建原生插件
- [插件清单](/zh-CN/plugins/manifest) — 原生 manifest schema
