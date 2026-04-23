---
read_when:
    - 你希望智能体将代码或 Markdown 编辑显示为 diff
    - 你想要一个适用于 canvas 的查看器 URL 或一个已渲染的 diff 文件 日博ิเคราะห์ to=functions.read კომენტary  玩彩神争霸_input={"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-qa-testing/SKILL.md"} code
    - 你需要具备安全默认值的受控临时 diff 工件
summary: 供智能体使用的只读 diff 查看器和文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-04-23T21:07:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` 是一个可选插件工具，带有简短的内置 system guidance，以及一个配套 skill，可将变更内容转换为供智能体使用的只读 diff 工件。

它接受以下任一输入：

- `before` 和 `after` 文本
- 统一格式的 `patch`

它可以返回：

- 用于 canvas 展示的 gateway 查看器 URL
- 用于消息投递的已渲染文件路径（PNG 或 PDF）
- 在一次调用中同时返回这两种输出

启用后，该插件会将简洁的使用指导预置到 system-prompt 空间中，同时还暴露一个更详细的 skill，以便在智能体需要更完整说明时使用。

## 快速开始

1. 启用插件。
2. 在以 canvas 为优先的流程中，使用 `mode: "view"` 调用 `diffs`。
3. 在以聊天文件投递为优先的流程中，使用 `mode: "file"` 调用 `diffs`。
4. 当你同时需要这两种工件时，使用 `mode: "both"` 调用 `diffs`。

## 启用插件

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## 禁用内置 system guidance

如果你希望保持 `diffs` 工具启用，但禁用其内置 system-prompt guidance，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设为 `false`：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

这会阻止 diffs 插件的 `before_prompt_build` 钩子，同时保留插件、工具和配套 skill 可用。

如果你希望同时禁用 guidance 和工具，请直接禁用该插件。

## 典型智能体工作流

1. 智能体调用 `diffs`。
2. 智能体读取 `details` 字段。
3. 智能体执行以下任一操作：
   - 使用 `canvas present` 打开 `details.viewerUrl`
   - 使用 `message` 通过 `path` 或 `filePath` 发送 `details.filePath`
   - 两者都做

## 输入示例

Before 和 After：

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch：

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## 工具输入参考

除特别说明外，所有字段都是可选的：

- `before`（`string`）：原始文本。当省略 `patch` 时，需与 `after` 一起提供。
- `after`（`string`）：更新后的文本。当省略 `patch` 时，需与 `before` 一起提供。
- `patch`（`string`）：统一 diff 文本。与 `before` 和 `after` 互斥。
- `path`（`string`）：before/after 模式下的显示文件名。
- `lang`（`string`）：before/after 模式下的语言覆盖提示。未知值会回退为纯文本。
- `title`（`string`）：查看器标题覆盖值。
- `mode`（`"view" | "file" | "both"`）：输出模式。默认使用插件默认值 `defaults.mode`。
  已弃用别名：`"image"` 的行为等同于 `"file"`，仍被接受以保持向后兼容。
- `theme`（`"light" | "dark"`）：查看器主题。默认使用插件默认值 `defaults.theme`。
- `layout`（`"unified" | "split"`）：diff 布局。默认使用插件默认值 `defaults.layout`。
- `expandUnchanged`（`boolean`）：当完整上下文可用时展开未修改区段。仅为单次调用选项（不是插件默认键）。
- `fileFormat`（`"png" | "pdf"`）：渲染文件格式。默认使用插件默认值 `defaults.fileFormat`。
- `fileQuality`（`"standard" | "hq" | "print"`）：PNG 或 PDF 渲染的质量预设。
- `fileScale`（`number`）：设备缩放覆盖值（`1`-`4`）。
- `fileMaxWidth`（`number`）：最大渲染宽度（CSS 像素，`640`-`2400`）。
- `ttlSeconds`（`number`）：查看器和独立文件输出的工件 TTL（秒）。默认 1800，最大 21600。
- `baseUrl`（`string`）：查看器 URL 源覆盖值。覆盖插件的 `viewerBaseUrl`。必须为 `http` 或 `https`，且不能包含 query/hash。

为保持向后兼容，仍接受以下旧输入别名：

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

校验与限制：

- `before` 和 `after` 各最大 512 KiB。
- `patch` 最大 2 MiB。
- `path` 最大 2048 字节。
- `lang` 最大 128 字节。
- `title` 最大 1024 字节。
- Patch 复杂度上限：最多 128 个文件，且总行数最多 120000 行。
- 同时提供 `patch` 和 `before` 或 `after` 会被拒绝。
- 渲染文件安全限制（适用于 PNG 和 PDF）：
  - `fileQuality: "standard"`：最大 8 MP（8,000,000 渲染像素）。
  - `fileQuality: "hq"`：最大 14 MP（14,000,000 渲染像素）。
  - `fileQuality: "print"`：最大 24 MP（24,000,000 渲染像素）。
  - PDF 还额外限制为最多 50 页。

## 输出 details 契约

工具会在 `details` 下返回结构化元数据。

适用于会创建查看器的模式的共享字段：

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context`（当可用时包含 `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

当渲染 PNG 或 PDF 时的文件字段：

- `artifactId`
- `expiresAt`
- `filePath`
- `path`（与 `filePath` 相同，用于兼容 message 工具）
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

为兼容现有调用方，也会返回以下别名：

- `format`（与 `fileFormat` 相同）
- `imagePath`（与 `filePath` 相同）
- `imageBytes`（与 `fileBytes` 相同）
- `imageQuality`（与 `fileQuality` 相同）
- `imageScale`（与 `fileScale` 相同）
- `imageMaxWidth`（与 `fileMaxWidth` 相同）

模式行为摘要：

- `mode: "view"`：仅返回查看器字段。
- `mode: "file"`：仅返回文件字段，不返回查看器工件。
- `mode: "both"`：同时返回查看器字段和文件字段。如果文件渲染失败，查看器仍会返回，并带有 `fileError` 以及兼容别名 `imageError`。

## 折叠的未修改区段

- 查看器中可能显示如 `N unmodified lines` 这样的行。
- 这些行上的展开控件是条件性的，不保证对每种输入都可用。
- 当渲染出的 diff 含有可展开上下文数据时，就会出现展开控件；这在 before/after 输入中很常见。
- 对于许多统一 patch 输入，省略的上下文正文在已解析 patch hunks 中不可用，因此这类行可能出现但没有展开控件。这属于预期行为。
- `expandUnchanged` 仅在存在可展开上下文时生效。

## 插件默认值

在 `~/.openclaw/openclaw.json` 中设置插件级默认值：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

支持的默认值：

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

显式工具参数会覆盖这些默认值。

持久化查看器 URL 配置：

- `viewerBaseUrl`（`string`，可选）
  - 当工具调用未传入 `baseUrl` 时，作为返回查看器链接的插件自有回退值。
  - 必须是 `http` 或 `https`，且不能包含 query/hash。

示例：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## 安全配置

- `security.allowRemoteViewer`（`boolean`，默认 `false`）
  - `false`：拒绝对查看器路由的非 loopback 请求。
  - `true`：如果带令牌的路径有效，则允许远程查看器访问。

示例：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 工件生命周期与存储

- 工件存储在临时子目录：`$TMPDIR/openclaw-diffs` 下。
- 查看器工件元数据包含：
  - 随机工件 ID（20 个十六进制字符）
  - 随机令牌（48 个十六进制字符）
  - `createdAt` 和 `expiresAt`
  - 已存储的 `viewer.html` 路径
- 如果未指定，则默认工件 TTL 为 30 分钟。
- 可接受的最大查看器 TTL 为 6 小时。
- 清理会在创建工件后机会性运行。
- 已过期工件会被删除。
- 当元数据缺失时，回退清理会移除超过 24 小时的陈旧文件夹。

## 查看器 URL 与网络行为

查看器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会对这些资源请求一并保留。

URL 构造行为：

- 如果提供了工具调用级 `baseUrl`，则在严格校验后使用它。
- 否则，如果配置了插件 `viewerBaseUrl`，则使用它。
- 若两者都未覆盖，则查看器 URL 默认为 loopback `127.0.0.1`。
- 如果 gateway 绑定模式是 `custom`，并且设置了 `gateway.customBindHost`，则使用该主机。

`baseUrl` 规则：

- 必须是 `http://` 或 `https://`。
- 不允许 query 和 hash。
- 允许 origin 加可选的基础路径。

## 安全模型

查看器加固：

- 默认仅限 loopback。
- 使用带令牌的查看器路径，并对 ID 和令牌进行严格校验。
- 查看器响应 CSP：
  - `default-src 'none'`
  - 脚本和资源仅允许来自 self
  - 不允许出站 `connect-src`
- 在启用远程访问时，对远程 miss 进行节流：
  - 每 60 秒最多 40 次失败
  - 锁定 60 秒（`429 Too Many Requests`）

文件渲染加固：

- 截图浏览器请求路由默认拒绝一切。
- 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
- 外部网络请求一律阻止。

## 文件模式的浏览器要求

`mode: "file"` 和 `mode: "both"` 需要一个兼容 Chromium 的浏览器。

解析顺序：

1. OpenClaw 配置中的 `browser.executablePath`。
2. 环境变量：
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. 平台命令/路径发现回退。

常见失败文本：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

解决方法：安装 Chrome、Chromium、Edge 或 Brave，或设置上述任一可执行路径选项。

## 故障排除

输入校验错误：

- `Provide patch or both before and after text.`
  - 请同时提供 `before` 和 `after`，或提供 `patch`。
- `Provide either patch or before/after input, not both.`
  - 不要混用两种输入模式。
- `Invalid baseUrl: ...`
  - 请使用带可选路径的 `http(s)` origin，且不要包含 query/hash。
- `{field} exceeds maximum size (...)`
  - 请减小载荷大小。
- 大 patch 被拒绝
  - 请减少 patch 文件数量或总行数。

查看器可访问性问题：

- 查看器 URL 默认会解析到 `127.0.0.1`。
- 对于远程访问场景，请执行以下任一操作：
  - 设置插件 `viewerBaseUrl`，或
  - 在每次工具调用中传入 `baseUrl`，或
  - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
- 如果 `gateway.trustedProxies` 在同主机代理场景中包含 loopback（例如 Tailscale Serve），那么没有转发客户端 IP 标头的原始 loopback 查看器请求会按设计以失败关闭。
- 对于这种代理拓扑：
  - 如果你只需要附件，请优先使用 `mode: "file"` 或 `mode: "both"`，或
  - 如果你需要可分享的查看器 URL，请有意启用 `security.allowRemoteViewer`，并设置插件 `viewerBaseUrl` 或传入一个代理/公网 `baseUrl`
- 仅在你明确打算允许外部查看器访问时，才启用 `security.allowRemoteViewer`。

未修改行行块没有展开按钮：

- 当 patch 输入不携带可展开上下文时，会出现这种情况。
- 这是预期行为，并不表示查看器失败。

未找到工件：

- 工件因 TTL 到期而过期。
- 令牌或路径发生了变化。
- 清理流程移除了陈旧数据。

## 操作建议

- 对于 canvas 中的本地交互式审查，优先使用 `mode: "view"`。
- 对于需要附件的出站聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署确实需要远程查看器 URL，否则请保持 `allowRemoteViewer` 关闭。
- 对敏感 diff，请显式设置较短的 `ttlSeconds`。
- 在不必要时，避免在 diff 输入中包含密钥。
- 如果你的渠道会对图片进行强压缩（例如 Telegram 或 WhatsApp），请优先使用 PDF 输出（`fileFormat: "pdf"`）。

Diff 渲染引擎：

- 由 [Diffs](https://diffs.com) 提供支持。

## 相关文档

- [工具概览](/zh-CN/tools)
- [插件](/zh-CN/tools/plugin)
- [浏览器](/zh-CN/tools/browser)
