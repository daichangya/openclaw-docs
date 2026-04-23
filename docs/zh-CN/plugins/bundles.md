---
read_when:
    - 你想安装一个与 Codex、Claude 或 Cursor 兼容的捆绑包
    - 你需要了解 OpenClaw 如何将捆绑包内容映射到原生功能
    - 你正在调试捆绑包检测或缺失能力问题
summary: 将 Codex、Claude 和 Cursor 捆绑包安装并作为 OpenClaw 插件使用
title: 插件捆绑包
x-i18n:
    generated_at: "2026-04-23T07:25:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# 插件捆绑包

OpenClaw 可以从三个外部生态安装插件：**Codex**、**Claude** 和 **Cursor**。这些被称为 **bundles**——内容与元数据包，OpenClaw 会将其映射为原生功能，例如 skills、hooks 和 MCP 工具。

<Info>
  Bundles **不同于**原生 OpenClaw 插件。原生插件在进程内运行，并且可以注册任意能力。Bundles 是内容包，只支持选择性的功能映射，并且信任边界更窄。
</Info>

## 为什么需要 bundles

许多有用的插件以 Codex、Claude 或 Cursor 格式发布。OpenClaw 不要求作者将它们重写为原生 OpenClaw 插件，而是检测这些格式，并将其受支持的内容映射到原生功能集中。这意味着你可以安装一个 Claude 命令包或一个 Codex skill 捆绑包，并立即使用它。

## 安装 bundle

<Steps>
  <Step title="从目录、归档文件或 marketplace 安装">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
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

    Bundles 会显示为 `Format: bundle`，其子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（skills、hooks、MCP 工具、LSP 默认值）会在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 会从 bundles 中映射哪些内容

目前并不是每种 bundle 功能都能在 OpenClaw 中运行。下面列出当前可用的功能，以及已检测到但尚未接入的功能。

### 当前支持

| Feature | 如何映射 | 适用范围 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill 内容 | bundle skill 根目录会作为普通 OpenClaw skill 根目录加载 | 所有格式 |
| Commands | `commands/` 和 `.cursor/commands/` 被视为 skill 根目录 | Claude、Cursor |
| Hook 包 | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局 | Codex |
| MCP 工具 | bundle MCP 配置会合并到嵌入式 Pi 设置中；支持的 stdio 和 HTTP 服务器会被加载 | 所有格式 |
| LSP 服务器 | Claude `.lsp.json` 和 manifest 声明的 `lspServers` 会合并到嵌入式 Pi LSP 默认值中 | Claude |
| 设置 | Claude `settings.json` 会作为嵌入式 Pi 默认值导入 | Claude |

#### Skill 内容

- bundle skill 根目录会作为普通 OpenClaw skill 根目录加载
- Claude `commands` 根目录会被视为额外的 skill 根目录
- Cursor `.cursor/commands` 根目录会被视为额外的 skill 根目录

这意味着 Claude markdown 命令文件会通过普通 OpenClaw skill 加载器工作。Cursor 命令 markdown 也通过同一路径工作。

#### Hook 包

- bundle hook 根目录**仅在**使用普通 OpenClaw hook 包布局时才有效。当前这主要是 Codex 兼容场景：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 已启用的 bundles 可以提供 MCP 服务器配置
- OpenClaw 会将 bundle MCP 配置合并到实际生效的嵌入式 Pi 设置中，键名为 `mcpServers`
- OpenClaw 会在嵌入式 Pi 智能体轮次中，通过启动 stdio 服务器或连接到 HTTP 服务器来暴露受支持的 bundle MCP 工具
- `coding` 和 `messaging` 工具配置文件默认包含 bundle MCP 工具；如需退出，可为某个智能体或 Gateway 网关使用 `tools.deny: ["bundle-mcp"]`
- 在 bundle 默认值之后，项目本地 Pi 设置仍然会继续生效，因此工作区设置可在需要时覆盖 bundle MCP 条目
- bundle MCP 工具目录会在注册前按确定性顺序排序，因此上游 `listTools()` 顺序变化不会导致 prompt-cache 工具块频繁抖动

##### 传输方式

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

**HTTP** 默认通过 `sse` 连接到一个正在运行的 MCP 服务器；如有请求，也可使用 `streamable-http`：

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
- URL 凭证（userinfo 和查询参数）会从工具描述和日志中脱敏
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输默认 30 秒的连接超时

##### 工具命名

OpenClaw 会使用 provider 安全名称来注册 bundle MCP 工具，格式为 `serverName__toolName`。例如，键名为 `"vigil-harbor"` 且暴露 `memory_search` 工具的服务器，会注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会被替换为 `-`
- 服务器前缀最长为 30 个字符
- 完整工具名称最长为 64 个字符
- 为空的服务器名称会回退为 `mcp`
- 发生清洗后名称冲突时，会用数字后缀消歧
- 最终暴露的工具顺序会按安全名称确定性排序，以保持重复 Pi 轮次的缓存稳定
- 配置文件过滤会将单个 bundle MCP 服务器中的所有工具都视为归属于 `bundle-mcp` 插件，因此配置文件 allowlist 和 deny list 可以包含单个暴露的工具名，也可以包含 `bundle-mcp` 插件键

#### 嵌入式 Pi 设置

- 启用 bundle 后，Claude `settings.json` 会作为默认嵌入式 Pi 设置导入
- OpenClaw 会在应用前清洗 shell 覆盖键

清洗的键：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 Pi LSP

- 已启用的 Claude bundles 可以提供 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及 manifest 中声明的所有 `lspServers` 路径
- bundle LSP 配置会合并到实际生效的嵌入式 Pi LSP 默认值中
- 当前只有受支持的、基于 stdio 的 LSP 服务器可以运行；不受支持的传输方式仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测到但不会执行

这些内容会被识别并显示在诊断中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 内联 / app 元数据（能力报告之外的部分）

## Bundle 格式

<AccordionGroup>
  <Accordion title="Codex bundles">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex bundles 使用 skill 根目录和 OpenClaw 风格 hook 包目录（`HOOK.md` + `handler.ts`）时，与 OpenClaw 的契合度最高。

  </Accordion>

  <Accordion title="Claude bundles">
    两种检测模式：

    - **基于 manifest：** `.claude-plugin/plugin.json`
    - **无 manifest：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特有行为：

    - `commands/` 会被视为 skill 内容
    - `settings.json` 会导入到嵌入式 Pi 设置中（shell 覆盖键会被清洗）
    - `.mcp.json` 会向嵌入式 Pi 暴露受支持的 stdio 工具
    - `.lsp.json` 加上 manifest 声明的 `lspServers` 路径，会加载到嵌入式 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测到，但不会执行
    - manifest 中的自定义组件路径是增量的（它们会扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor bundles">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 会被视为 skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测，不执行

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会优先检查原生插件格式：

1. `openclaw.plugin.json` 或带有有效 `openclaw.extensions` 的 `package.json` —— 视为**原生插件**
2. bundle 标记（`.codex-plugin/`、`.claude-plugin/`，或默认 Claude / Cursor 布局）—— 视为 **bundle**

如果某个目录同时包含两者，OpenClaw 会使用原生路径。这可以防止双格式包被部分安装为 bundle。

## 运行时依赖与清理

- 内置插件的运行时依赖会随 OpenClaw 包一起发布在 `dist/*` 下。OpenClaw **不会**在启动时为内置插件运行 `npm install`；发布流水线负责提供完整的内置依赖载荷（参见 [发布](/zh-CN/reference/RELEASING) 中的 postpublish 验证规则）。

## 安全性

与原生插件相比，bundles 的信任边界更窄：

- OpenClaw **不会**在进程内加载任意 bundle 运行时模块
- Skills 和 hook 包路径必须保留在插件根目录内（有边界检查）
- 设置文件会使用相同的边界检查进行读取
- 受支持的 stdio MCP 服务器可以作为子进程启动

这让 bundles 默认更安全，但对于它们实际暴露的功能，你仍应将第三方 bundles 视为可信内容。

## 故障排除

<AccordionGroup>
  <Accordion title="Bundle 已检测到，但能力没有运行">
    运行 `openclaw plugins inspect <id>`。如果某个能力已列出但标记为未接入，那是产品限制——不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件没有出现">
    确保 bundle 已启用，并且 markdown 文件位于已检测到的 `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置没有生效">
    仅支持来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不会将 bundle 设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude hooks 没有执行">
    `hooks/hooks.json` 仅检测，不执行。如果你需要可运行的 hooks，请使用 OpenClaw hook 包布局或提供一个原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装并配置插件](/zh-CN/tools/plugin)
- [构建插件](/zh-CN/plugins/building-plugins) — 创建原生插件
- [插件清单](/zh-CN/plugins/manifest) — 原生 manifest schema
