---
read_when:
    - 你想安装一个与 Codex、Claude 或 Cursor 兼容的套件
    - 你需要了解 OpenClaw 如何将套件内容映射到原生功能
    - 你正在调试套件检测或缺失的能力
summary: 将 Codex、Claude 和 Cursor 套件安装并作为 OpenClaw 插件使用
title: 插件套件
x-i18n:
    generated_at: "2026-04-22T23:49:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fec13cb1f807231c706318f3e81e27b350d5a0266821cb96c8494c45f01de0
    source_path: plugins/bundles.md
    workflow: 15
---

# 插件套件

OpenClaw 可以从三个外部生态系统安装插件：**Codex**、**Claude** 和 **Cursor**。这些被称为 **套件** —— 内容和元数据包，OpenClaw 会将其映射到 Skills、hooks 和 MCP 工具等原生功能中。

<Info>
  套件**不同于**原生 OpenClaw 插件。原生插件在进程内运行，并且可以注册任何能力。套件是内容包，只支持选择性的功能映射，并且信任边界更窄。
</Info>

## 为什么需要套件

许多实用插件以 Codex、Claude 或 Cursor 格式发布。OpenClaw 不要求作者将它们重写为原生 OpenClaw 插件，而是会检测这些格式，并将其中受支持的内容映射到原生功能集中。这意味着你可以安装一个 Claude 命令包或一个 Codex Skills 套件，并立即使用它。

## 安装一个套件

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

    套件会显示为 `Format: bundle`，其子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（Skills、hooks、MCP 工具、LSP 默认值）会在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 会从套件中映射哪些内容

并非套件中的每个功能目前都能在 OpenClaw 中运行。下面列出了当前可用的功能，以及那些已检测到但尚未接线启用的功能。

### 当前支持

| 功能 | 映射方式 | 适用范围 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill 内容 | 套件的 Skill 根目录会作为普通 OpenClaw Skills 加载 | 所有格式 |
| Commands | `commands/` 和 `.cursor/commands/` 会被视为 Skill 根目录 | Claude、Cursor |
| Hook 包 | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局 | Codex |
| MCP 工具 | 套件 MCP 配置会合并到内置 Pi 设置中；支持的 stdio 和 HTTP 服务器会被加载 | 所有格式 |
| LSP 服务器 | Claude 的 `.lsp.json` 和清单中声明的 `lspServers` 会合并到内置 Pi 的 LSP 默认值中 | Claude |
| Settings | Claude 的 `settings.json` 会作为内置 Pi 默认值导入 | Claude |

#### Skill 内容

- 套件的 Skill 根目录会作为普通 OpenClaw Skill 根目录加载
- Claude 的 `commands` 根目录会被视为额外的 Skill 根目录
- Cursor 的 `.cursor/commands` 根目录会被视为额外的 Skill 根目录

这意味着 Claude 的 Markdown 命令文件会通过普通的 OpenClaw Skills 加载器运行。Cursor 的命令 Markdown 文件也会通过同一路径运行。

#### Hook 包

- 只有当套件的 hook 根目录使用普通的 OpenClaw hook 包布局时，才会生效
  。目前主要是与 Codex 兼容的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### 用于 Pi 的 MCP

- 已启用的套件可以提供 MCP 服务器配置
- OpenClaw 会将套件的 MCP 配置合并到生效中的内置 Pi 设置中，键名为
  `mcpServers`
- OpenClaw 会在内置 Pi 智能体轮次中，通过启动 stdio 服务器或连接到 HTTP 服务器，暴露受支持的套件 MCP 工具
- `coding` 和 `messaging` 工具配置默认包含套件 MCP 工具；如需禁用，可为某个智能体或 Gateway 网关使用 `tools.deny: ["bundle-mcp"]`
- 在套件默认值之后，项目级本地 Pi 设置仍然会生效，因此在需要时，工作区设置可以覆盖套件的 MCP 条目
- 在注册之前，套件 MCP 工具目录会按确定性顺序排序，因此上游 `listTools()` 顺序的变化不会导致 prompt-cache 工具块频繁抖动

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

**HTTP** 默认通过 `sse` 连接到正在运行的 MCP 服务器；如有请求，也可以使用 `streamable-http`：

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

- `transport` 可以设置为 `"streamable-http"` 或 `"sse"`；省略时，OpenClaw 使用 `sse`
- 仅允许 `http:` 和 `https:` URL 协议
- `headers` 的值支持 `${ENV_VAR}` 插值
- 如果一个服务器条目同时包含 `command` 和 `url`，则会被拒绝
- URL 凭证（userinfo 和查询参数）会从工具描述和日志中被脱敏
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输协议默认的 30 秒连接超时时间

##### 工具命名

OpenClaw 会使用对提供商安全的名称来注册套件 MCP 工具，格式为
`serverName__toolName`。例如，一个键名为 `"vigil-harbor"` 且暴露了
`memory_search` 工具的服务器，会被注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会被替换为 `-`
- 服务器名前缀最长为 30 个字符
- 完整工具名最长为 64 个字符
- 空的服务器名会回退为 `mcp`
- 冲突的清洗后名称会通过数字后缀进行区分
- 最终暴露的工具顺序会按安全名称确定性排序，以保持重复 Pi 轮次的缓存稳定
- 配置过滤会将来自同一个套件 MCP 服务器的所有工具都视为由 `bundle-mcp` 拥有的插件，因此配置允许列表和拒绝列表可以包含单个暴露的工具名称，也可以包含 `bundle-mcp` 插件键

#### 内置 Pi 设置

- 启用套件时，Claude 的 `settings.json` 会作为默认内置 Pi 设置导入
- OpenClaw 会在应用前清洗 shell 覆盖键

已清洗的键：

- `shellPath`
- `shellCommandPrefix`

#### 内置 Pi LSP

- 已启用的 Claude 套件可以提供 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及清单中声明的任何 `lspServers` 路径
- 套件 LSP 配置会合并到生效中的内置 Pi LSP 默认值中
- 目前只有受支持的基于 stdio 的 LSP 服务器可以运行；不受支持的传输协议仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测到但不会执行

这些内容会被识别并显示在诊断信息中，但 OpenClaw 不会运行它们：

- Claude 的 `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor 的 `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 的内联/应用元数据（能力报告之外的部分）

## 套件格式

<AccordionGroup>
  <Accordion title="Codex 套件">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex 套件使用 Skill 根目录和 OpenClaw 风格的 hook 包目录（`HOOK.md` + `handler.ts`）时，最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude 套件">
    两种检测模式：

    - **基于清单：** `.claude-plugin/plugin.json`
    - **无清单：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特有行为：

    - `commands/` 会被视为 Skill 内容
    - `settings.json` 会导入到内置 Pi 设置中（shell 覆盖键会被清洗）
    - `.mcp.json` 会向内置 Pi 暴露受支持的 stdio 工具
    - `.lsp.json` 加上清单中声明的 `lspServers` 路径会加载到内置 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测到，但不会执行
    - 清单中的自定义组件路径是增量添加的（它们会扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor 套件">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 会被视为 Skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测，不执行

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生插件格式：

1. `openclaw.plugin.json` 或带有 `openclaw.extensions` 的有效 `package.json` —— 视为**原生插件**
2. 套件标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）—— 视为**套件**

如果一个目录同时包含两者，OpenClaw 会使用原生路径。这可以防止双格式包被部分作为套件安装。

## 安全性

与原生插件相比，套件的信任边界更窄：

- OpenClaw **不会**在进程内加载任意套件运行时模块
- Skills 和 hook 包路径必须保留在插件根目录内（带边界检查）
- Settings 文件会使用相同的边界检查来读取
- 受支持的 stdio MCP 服务器可以作为子进程启动

这让套件在默认情况下更安全，但对于第三方套件，你仍应将其视为对其所暴露功能具有可信访问权限的内容。

## 故障排除

<AccordionGroup>
  <Accordion title="套件已检测到，但能力没有运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力被列出，但标记为未接线启用，那是产品限制——并不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件没有显示">
    请确认套件已启用，并且 Markdown 文件位于已检测到的 `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    仅支持来自 `settings.json` 的内置 Pi 设置。OpenClaw 不会将套件设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude hooks 没有执行">
    `hooks/hooks.json` 仅用于检测。如果你需要可运行的 hooks，请使用 OpenClaw hook 包布局，或者提供一个原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin)
- [构建插件](/zh-CN/plugins/building-plugins) —— 创建一个原生插件
- [插件清单](/zh-CN/plugins/manifest) —— 原生清单模式
