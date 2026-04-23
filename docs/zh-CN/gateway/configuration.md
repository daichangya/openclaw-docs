---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 导航到特定配置章节
summary: 配置概览：常见任务、快速开始以及完整参考的链接
title: 配置
x-i18n:
    generated_at: "2026-04-23T07:05:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8130d29e9fbf5104d0a76f26b26186b6aab2b211030b8c8ba0d1131daf890993
    source_path: gateway/configuration.md
    workflow: 15
---

# 配置

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取一个可选的 <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 配置。
当前活动的配置路径必须是一个常规文件。对于 OpenClaw 自有写入操作，不支持
符号链接形式的 `openclaw.json` 布局；原子写入可能会替换该路径，
而不是保留符号链接。如果你将配置保存在默认状态目录之外，请将
`OPENCLAW_CONFIG_PATH` 直接指向真实文件。

如果该文件不存在，OpenClaw 会使用安全默认值。添加配置的常见原因包括：

- 连接渠道并控制谁可以向 bot 发送消息
- 设置模型、工具、沙箱隔离或自动化（cron、hooks）
- 调整会话、媒体、网络或 UI

有关所有可用字段，请参见[完整参考](/zh-CN/gateway/configuration-reference)。

<Tip>
**刚开始接触配置？** 从 `openclaw onboard` 开始进行交互式设置，或查看[配置示例](/zh-CN/gateway/configuration-examples)指南，获取完整的可复制粘贴配置。
</Tip>

## 最小配置

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 编辑配置

<Tabs>
  <Tab title="交互式向导">
    ```bash
    openclaw onboard       # 完整新手引导流程
    openclaw configure     # 配置向导
    ```
  </Tab>
  <Tab title="CLI（单行命令）">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    打开 [http://127.0.0.1:18789](http://127.0.0.1:18789) 并使用 **配置** 标签页。
    Control UI 会根据实时配置 schema 渲染表单，其中包括字段
    `title` / `description` 文档元数据，以及在可用时的插件和渠道 schema，
    同时提供 **Raw JSON** 编辑器作为兜底方案。对于下钻式
    UI 和其他工具，gateway 还会暴露 `config.schema.lookup`，
    用于获取一个按路径限定的 schema 节点及其直接子节点摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格校验

<Warning>
OpenClaw 只接受完全符合 schema 的配置。未知键、类型格式错误或无效值都会导致 Gateway 网关**拒绝启动**。唯一的根级例外是 `$schema`（字符串），这样编辑器就可以附加 JSON Schema 元数据。
</Warning>

Schema 工具说明：

- `openclaw config schema` 会打印与 Control UI
  和配置校验所使用的同一套 JSON Schema。
- 请将该 schema 输出视为 `openclaw.json` 的规范机器可读契约；
  本概览和配置参考只是对其进行总结。
- 字段 `title` 和 `description` 的值会被带入 schema 输出中，
  供编辑器和表单工具使用。
- 嵌套对象、通配符（`*`）和数组项（`[]`）条目会在存在匹配字段文档时，
  继承相同的文档元数据。
- `anyOf` / `oneOf` / `allOf` 组合分支也会继承相同的文档
  元数据，因此联合/交叉变体会保留相同的字段帮助信息。
- `config.schema.lookup` 会返回一个规范化的配置路径及其浅层
  schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界
  以及类似校验字段）、匹配的 UI 提示元数据和直接子节点
  摘要，供下钻式工具使用。
- 当 gateway 能够加载当前 manifest 注册表时，会合并运行时插件/渠道 schema。
- `pnpm config:docs:check` 会检测面向文档的配置基线产物
  与当前 schema 表面之间的漂移。

当校验失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看精确问题
- 运行 `openclaw doctor --fix`（或 `--yes`）以应用修复

Gateway 网关还会在成功启动后保留一份可信的最近一次有效副本。如果
之后 `openclaw.json` 在 OpenClaw 外部被修改并且不再通过校验，启动
和热重载会将损坏文件保留为带时间戳的 `.clobbered.*` 快照，
恢复最近一次有效副本，并记录一条明显的警告，说明恢复原因。
启动读取恢复还会将配置大小大幅缩小、缺少配置元数据以及
缺少 `gateway.mode` 视为严重的破坏特征，前提是最近一次有效
副本中原本有这些字段。
如果某条状态/日志行被意外前置到原本有效的 JSON
配置之前，gateway 启动和 `openclaw doctor --fix` 可以剥离该前缀，
将受污染的文件保留为 `.clobbered.*`，并继续使用恢复后的
JSON。
下一次主智能体回合也会收到一条系统事件警告，告知其
配置已被恢复，不能盲目重写。在通过校验的启动之后，以及接受的热重载之后，
都会更新最近一次有效副本的提升状态，包括
那些其持久化文件哈希仍与已接受写入匹配的 OpenClaw 自有配置写入。
当候选副本包含已脱敏的密钥占位符，
如 `***` 或缩短后的令牌值时，将跳过提升。

## 常见任务

<AccordionGroup>
  <Accordion title="设置一个渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置部分。设置步骤请参见对应渠道页面：

    - [WhatsApp](/zh-CN/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/zh-CN/channels/telegram) — `channels.telegram`
    - [Discord](/zh-CN/channels/discord) — `channels.discord`
    - [Feishu](/zh-CN/channels/feishu) — `channels.feishu`
    - [Google Chat](/zh-CN/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/zh-CN/channels/msteams) — `channels.msteams`
    - [Slack](/zh-CN/channels/slack) — `channels.slack`
    - [Signal](/zh-CN/channels/signal) — `channels.signal`
    - [iMessage](/zh-CN/channels/imessage) — `channels.imessage`
    - [Mattermost](/zh-CN/channels/mattermost) — `channels.mattermost`

    所有渠道共享相同的私信策略模式：

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // 仅用于 allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="选择并配置模型">
    设置主模型和可选回退模型：

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` 定义模型目录，并充当 `/model` 的允许列表。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 可在不移除现有模型的情况下添加允许列表条目。如果普通替换会移除条目，则除非你传入 `--replace`，否则会被拒绝。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制转录/工具图像缩放下采样（默认 `1200`）；在大量截图运行中，较低值通常会减少视觉 token 使用量。
    - 在聊天中切换模型请参见[模型 CLI](/zh-CN/concepts/models)，认证轮换和回退行为请参见[模型故障转移](/zh-CN/concepts/model-failover)。
    - 对于自定义/自托管提供商，请参见参考中的[自定义提供商](/zh-CN/gateway/configuration-reference#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向 bot 发送消息">
    私信访问按渠道通过 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会收到一个一次性配对码，用于批准
    - `"allowlist"`：仅允许 `allowFrom` 中的发送者（或已配对允许存储中的发送者）
    - `"open"`：允许所有入站私信（要求 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或特定渠道的允许列表。

    每个渠道的详细信息请参见[完整参考](/zh-CN/gateway/configuration-reference#dm-and-group-access)。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**要求提及**。按智能体配置模式：

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **元数据提及**：原生 @ 提及（WhatsApp 点按提及、Telegram @bot 等）
    - **文本模式**：`mentionPatterns` 中的安全正则模式
    - 每个渠道的覆盖项和自聊模式请参见[完整参考](/zh-CN/gateway/configuration-reference#group-chat-mention-gating)

  </Accordion>

  <Accordion title="按智能体限制 Skills">
    对共享基线使用 `agents.defaults.skills`，然后通过 `agents.list[].skills` 覆盖特定
    智能体：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // 继承 github、weather
          { id: "docs", skills: ["docs-search"] }, // 替换默认值
          { id: "locked-down", skills: [] }, // 无 Skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills` 表示默认不限制 Skills。
    - 省略 `agents.list[].skills` 表示继承默认值。
    - 设置 `agents.list[].skills: []` 表示没有 Skills。
    - 参见 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 和
      [配置参考](/zh-CN/gateway/configuration-reference#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整 gateway 渠道健康监控">
    控制 gateway 重启看起来已陈旧渠道的激进程度：

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - 设置 `gateway.channelHealthCheckMinutes: 0` 可全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 可在不禁用全局监控的情况下，为单个渠道或账户禁用自动重启。
    - 运维调试请参见[健康检查](/zh-CN/gateway/health)，所有字段请参见[完整参考](/zh-CN/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="配置会话和重置">
    会话控制对话连续性和隔离：

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 推荐用于多用户
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`：`main`（共享）| `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`：线程绑定会话路由的全局默认值（Discord 支持 `/focus`、`/unfocus`、`/agents`、`/session idle` 和 `/session max-age`）。
    - 作用域、身份链接和发送策略请参见[会话管理](/zh-CN/concepts/session)。
    - 所有字段请参见[完整参考](/zh-CN/gateway/configuration-reference#session)。

  </Accordion>

  <Accordion title="启用沙箱隔离">
    在隔离的沙箱运行时中运行智能体会话：

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    先构建镜像：`scripts/sandbox-setup.sh`

    完整指南请参见[沙箱隔离](/zh-CN/gateway/sandboxing)，所有选项请参见[完整参考](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="为官方 iOS 构建启用基于 relay 的推送">
    基于 relay 的推送在 `openclaw.json` 中配置。

    在 gateway 配置中设置：

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 可选。默认值：10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    等价的 CLI：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    这会执行以下操作：

    - 让 gateway 能够通过外部 relay 发送 `push.test`、唤醒提示和重连唤醒。
    - 使用由已配对 iOS 应用转发的、按注册范围限定的发送授权。gateway 不需要部署范围的 relay 令牌。
    - 将每个基于 relay 的注册绑定到 iOS 应用所配对的 gateway 身份，因此其他 gateway 无法复用已存储的注册信息。
    - 让本地/手动 iOS 构建继续使用直接 APNs。基于 relay 的发送仅适用于通过 relay 注册的官方分发构建。
    - 必须与编译进官方/TestFlight iOS 构建中的 relay 基础 URL 一致，这样注册和发送流量才能到达同一个 relay 部署。

    端到端流程：

    1. 安装一个使用相同 relay 基础 URL 编译的官方/TestFlight iOS 构建。
    2. 在 gateway 上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 gateway 配对，并让节点会话和操作员会话都连接。
    4. iOS 应用获取 gateway 身份，结合 App Attest 和应用收据向 relay 注册，然后将基于 relay 的 `push.apns.register` 载荷发布到已配对的 gateway。
    5. gateway 存储 relay 句柄和发送授权，然后将它们用于 `push.test`、唤醒提示和重连唤醒。

    运行说明：

    - 如果你将 iOS 应用切换到其他 gateway，请重新连接应用，以便它发布一个绑定到该 gateway 的新 relay 注册。
    - 如果你发布了一个指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖项使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然是一个仅限 local loopback 的开发逃生舱；不要在配置中持久化 HTTP relay URL。

    端到端流程请参见[iOS 应用](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)，relay 安全模型请参见[认证与信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="设置心跳（定期签到）">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`：时长字符串（`30m`、`2h`）。设置为 `0m` 可禁用。
    - `target`：`last` | `none` | `<channel-id>`（例如 `discord`、`matrix`、`telegram` 或 `whatsapp`）
    - `directPolicy`：私信风格心跳目标使用 `allow`（默认）或 `block`
    - 完整指南请参见[心跳](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="配置 cron 作业">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`：从 `sessions.json` 中清理已完成的隔离运行会话（默认 `24h`；设置为 `false` 可禁用）。
    - `runLog`：按大小和保留行数清理 `cron/runs/<jobId>.jsonl`。
    - 功能概览和 CLI 示例请参见[Cron 作业](/zh-CN/automation/cron-jobs)。

  </Accordion>

  <Accordion title="设置 webhook（hooks）">
    在 Gateway 网关上启用 HTTP webhook 端点：

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    安全说明：
    - 将所有 hook/webhook 载荷内容视为不受信任的输入。
    - 使用专用的 `hooks.token`；不要复用共享 Gateway 网关令牌。
    - Hook 认证仅支持 header（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串中的令牌会被拒绝。
    - `hooks.path` 不能为 `/`；请将 webhook 入口保留在专用子路径下，例如 `/hooks`。
    - 保持不安全内容绕过标志为禁用（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`），除非你正在进行范围严格受控的调试。
    - 如果启用 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 来限制调用方可选的会话键。
    - 对于由 hook 驱动的智能体，优先选择强大的现代模型层级和严格的工具策略（例如尽可能仅允许消息传递并配合沙箱隔离）。

    所有映射选项和 Gmail 集成请参见[完整参考](/zh-CN/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个彼此隔离的智能体，并使用独立工作区和会话：

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    绑定规则和每个智能体的访问配置请参见[多智能体](/zh-CN/concepts/multi-agent) 和[完整参考](/zh-CN/gateway/configuration-reference#multi-agent-routing)。

  </Accordion>

  <Accordion title="将配置拆分为多个文件（$include）">
    使用 `$include` 来组织大型配置：

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **单个文件**：替换所在对象
    - **文件数组**：按顺序深度合并（后者覆盖前者）
    - **同级键**：在 include 之后合并（覆盖引入的值）
    - **嵌套 include**：最多支持 10 层
    - **相对路径**：相对于包含它的文件解析
    - **OpenClaw 自有写入**：当某次写入仅更改一个由单文件 include 支持的顶层部分，
      例如 `plugins: { $include: "./plugins.json5" }`，
      OpenClaw 会更新该被引入文件，并保持 `openclaw.json` 不变
    - **不支持的透传写入**：根级 include、include 数组以及带有同级覆盖的 include，
      对于 OpenClaw 自有写入会以关闭方式失败，
      而不会将配置拍平
    - **错误处理**：对缺失文件、解析错误和循环 include 提供清晰错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改——对于大多数设置，无需手动重启。

直接文件编辑在通过校验前会被视为不受信任。监视器会等待
编辑器临时写入/重命名抖动稳定下来，读取最终文件，并通过恢复最近一次有效配置
来拒绝无效的外部编辑。OpenClaw 自有配置写入在写入前也会经过相同的 schema 门控；
诸如删除 `gateway.mode` 或将文件缩小超过一半之类的破坏性覆盖
会被拒绝，并保存为 `.rejected.*` 以供检查。

如果你在日志中看到 `Config auto-restored from last-known-good` 或
`config reload restored last-known-good config`，请检查
`openclaw.json` 旁边对应的 `.clobbered.*` 文件，修复被拒绝的载荷，然后运行
`openclaw config validate`。恢复检查清单请参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

### 重载模式

| 模式 | 行为 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`**（默认） | 立即热应用安全更改。对于关键更改会自动重启。 |
| **`hot`** | 仅热应用安全更改。当需要重启时记录警告——由你自行处理。 |
| **`restart`** | 对任何配置更改都重启 Gateway 网关，无论是否安全。 |
| **`off`** | 禁用文件监视。更改将在下一次手动重启时生效。 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可热应用，哪些需要重启

大多数字段都可在不停机的情况下热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别 | 字段 | 需要重启？ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels | `channels.*`、`web`（WhatsApp）——所有内置和渠道插件 | 否 |
| 智能体和模型 | `agent`、`agents`、`models`、`routing` | 否 |
| 自动化 | `hooks`、`cron`、`agent.heartbeat` | 否 |
| 会话和消息 | `session`、`messages` | 否 |
| 工具和媒体 | `tools`、`browser`、`skills`、`audio`、`talk` | 否 |
| UI 和其他 | `ui`、`logging`、`identity`、`bindings` | 否 |
| Gateway 网关服务器 | `gateway.*`（port、bind、auth、tailscale、TLS、HTTP） | **是** |
| 基础设施 | `discovery`、`canvasHost`、`plugins` | **是** |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外——更改它们**不会**触发重启。
</Note>

### 重载规划

当你编辑一个通过 `$include` 引用的源文件时，OpenClaw 会根据源作者编写的布局
来规划重载，而不是根据拍平后的内存视图。
即使某个顶层部分单独存在于其自己的 include 文件中，
例如 `plugins: { $include: "./plugins.json5" }`，
这种方式也能让热重载决策（热应用还是重启）保持可预测。

如果某次重载无法被安全规划——例如，因为源布局
将根级 include 与同级覆盖组合在一起——OpenClaw 会以关闭方式失败、记录
原因，并保留当前正在运行的配置不变，这样你就可以修复源布局
而不是静默回退到拍平后的重载。

## 配置 RPC（程序化更新）

<Note>
控制平面写入 RPC（`config.apply`、`config.patch`、`update.run`）按每个 `deviceId+clientIp` 限制为**每 60 秒 3 次请求**。当触发限制时，RPC 会返回 `UNAVAILABLE`，并带有 `retryAfterMs`。
</Note>

安全/默认流程：

- `config.schema.lookup`：检查一个按路径限定的配置子树，返回浅层
  schema 节点、匹配的提示元数据和直接子节点摘要
- `config.get`：获取当前快照 + hash
- `config.patch`：首选的部分更新路径
- `config.apply`：仅用于完整配置替换
- `update.run`：显式自更新 + 重启

当你不是替换整个配置时，优先使用 `config.schema.lookup`
然后 `config.patch`。

<AccordionGroup>
  <Accordion title="config.apply（完整替换）">
    校验并写入完整配置，同时一步重启 Gateway 网关。

    <Warning>
    `config.apply` 会替换**整个配置**。部分更新请使用 `config.patch`，单个键请使用 `openclaw config set`。
    </Warning>

    参数：

    - `raw`（string）— 整个配置的 JSON5 载荷
    - `baseHash`（可选）— 来自 `config.get` 的配置 hash（当配置已存在时必填）
    - `sessionKey`（可选）— 重启后唤醒 ping 使用的会话键
    - `note`（可选）— 重启哨兵的备注
    - `restartDelayMs`（可选）— 重启前延迟（默认 2000）

    当已有重启处于待处理/进行中时，重启请求会被合并；并且两次重启周期之间会应用 30 秒冷却时间。

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch（部分更新）">
    将部分更新合并到现有配置中（JSON merge patch 语义）：

    - 对象递归合并
    - `null` 删除键
    - 数组整体替换

    参数：

    - `raw`（string）— 仅包含要更改键的 JSON5
    - `baseHash`（必填）— 来自 `config.get` 的配置 hash
    - `sessionKey`、`note`、`restartDelayMs` — 与 `config.apply` 相同

    重启行为与 `config.apply` 一致：合并待处理重启，并在两次重启周期之间应用 30 秒冷却时间。

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

OpenClaw 会从父进程读取环境变量，另外还包括：

- 当前工作目录中的 `.env`（如果存在）
- `~/.openclaw/.env`（全局回退）

这两个文件都不会覆盖已存在的环境变量。你也可以在配置中设置内联环境变量：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="导入 shell 环境变量（可选）">
  如果启用，并且预期键名未设置，OpenClaw 会运行你的登录 shell，并且只导入缺失的键：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量等价项：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="配置值中的环境变量替换">
  可在任何配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失/为空的变量会在加载时报错
- 使用 `$${VAR}` 转义为字面输出
- 可在 `$include` 文件中使用
- 内联替换：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef（env、file、exec）">
  对于支持 `SecretRef` 对象的字段，你可以使用：

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

`SecretRef` 详情（包括用于 `env`/`file`/`exec` 的 `secrets.providers`）请参见[密钥管理](/zh-CN/gateway/secrets)。
支持的凭证路径列在 [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface) 中。
</Accordion>

完整优先级和来源请参见[环境](/zh-CN/help/environment)。

## 完整参考

如需逐字段的完整参考，请参见 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关内容：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_
