---
read_when:
    - 首次设置 OpenClaw
    - 查找常见配置模式
    - 导航到特定配置章节
summary: 配置概览：常见任务、快速设置以及完整参考链接
title: 配置
x-i18n:
    generated_at: "2026-04-23T20:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e873bebd26787ef480dc005c45d307645bc7fe8e5c402b9a642a31061935586a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw 会从 `~/.openclaw/openclaw.json` 读取可选的 <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> 配置。
活动配置路径必须是常规文件。带符号链接的 `openclaw.json`
布局不受 OpenClaw 自有写入支持；原子写入可能会替换该路径，而不是保留符号链接。如果你将配置保存在默认状态目录之外，请将 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

如果该文件不存在，OpenClaw 会使用安全默认值。常见的添加配置原因包括：

- 连接渠道并控制谁可以向机器人发送消息
- 设置模型、工具、沙箱隔离或自动化（cron、hooks）
- 调整会话、媒体、网络或 UI

有关所有可用字段，请参阅[完整参考](/zh-CN/gateway/configuration-reference)。

<Tip>
**刚开始接触配置？** 请先使用 `openclaw onboard` 进行交互式设置，或查看[配置示例](/zh-CN/gateway/configuration-examples)指南以获取完整的可复制粘贴配置。
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
    Control UI 会根据实时配置 schema 渲染表单，包括字段
    `title` / `description` 文档元数据，以及在可用时的插件和渠道 schema，同时提供一个 **原始 JSON** 编辑器作为逃生口。对于下钻式
    UI 和其他工具，gateway 还会暴露 `config.schema.lookup`，用于获取单一路径范围内的 schema 节点及其直接子节点摘要。
  </Tab>
  <Tab title="直接编辑">
    直接编辑 `~/.openclaw/openclaw.json`。Gateway 网关会监视该文件并自动应用更改（参见[热重载](#config-hot-reload)）。
  </Tab>
</Tabs>

## 严格验证

<Warning>
OpenClaw 只接受完全匹配 schema 的配置。未知键、格式错误的类型或无效值都会导致 Gateway 网关**拒绝启动**。根级唯一的例外是 `$schema`（字符串），以便编辑器附加 JSON Schema 元数据。
</Warning>

`openclaw config schema` 会打印 Control UI
和验证使用的标准 JSON Schema。`config.schema.lookup` 会获取单个路径范围内的节点及其子节点摘要，以供下钻式工具使用。字段 `title`/`description` 文档元数据
会贯穿嵌套对象、通配符（`*`）、数组项（`[]`）以及 `anyOf`/
`oneOf`/`allOf` 分支。当清单注册表已加载时，运行时插件和渠道 schema 也会合并进来。

当验证失败时：

- Gateway 网关不会启动
- 只有诊断命令可用（`openclaw doctor`、`openclaw logs`、`openclaw health`、`openclaw status`）
- 运行 `openclaw doctor` 查看确切问题
- 运行 `openclaw doctor --fix`（或 `--yes`）应用修复

Gateway 网关会在每次成功启动后保留一份受信任的最近一次可用副本。
如果之后 `openclaw.json` 验证失败（或丢失 `gateway.mode`、体积急剧缩小，或前面意外插入了一行日志），OpenClaw 会将损坏的文件保留为 `.clobbered.*`，恢复最近一次可用副本，并记录恢复原因。下一次智能体轮次还会收到系统事件警告，这样主智能体就不会盲目重写恢复后的配置。当候选配置包含已脱敏的 secret 占位符（例如 `***`）时，不会提升为最近一次可用副本。

## 常见任务

<AccordionGroup>
  <Accordion title="设置渠道（WhatsApp、Telegram、Discord 等）">
    每个渠道在 `channels.<provider>` 下都有自己的配置段。设置步骤请参阅对应的渠道页面：

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

    所有渠道都共享相同的私信策略模式：

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
            fallbacks: ["openai/gpt-5.5"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.5": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` 定义模型目录，并作为 `/model` 的允许列表。
    - 使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 可在不移除现有模型的情况下添加允许列表条目。会移除条目的普通替换会被拒绝，除非你传递 `--replace`。
    - 模型引用使用 `provider/model` 格式（例如 `anthropic/claude-opus-4-6`）。
    - `agents.defaults.imageMaxDimensionPx` 控制 transcript/工具图像缩放下限（默认 `1200`）；对于截图较多的运行，较低值通常会减少视觉 token 使用量。
    - 在聊天中切换模型请参阅[Models CLI](/zh-CN/concepts/models)，有关认证轮换和回退行为请参阅[模型故障转移](/zh-CN/concepts/model-failover)。
    - 对于自定义/自托管 providers，请参阅参考中的[自定义 providers](/zh-CN/gateway/configuration-reference#custom-providers-and-base-urls)。

  </Accordion>

  <Accordion title="控制谁可以向机器人发送消息">
    私信访问通过每个渠道的 `dmPolicy` 控制：

    - `"pairing"`（默认）：未知发送者会收到一次性配对码以供批准
    - `"allowlist"`：只有 `allowFrom`（或已配对允许存储）中的发送者
    - `"open"`：允许所有入站私信（需要 `allowFrom: ["*"]`）
    - `"disabled"`：忽略所有私信

    对于群组，请使用 `groupPolicy` + `groupAllowFrom` 或渠道专用允许列表。

    有关各渠道细节，请参阅[完整参考](/zh-CN/gateway/configuration-reference#dm-and-group-access)。

  </Accordion>

  <Accordion title="设置群聊提及门控">
    群组消息默认**要求提及**。可按智能体配置模式：

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
    - 有关各渠道覆盖和自聊模式，请参阅[完整参考](/zh-CN/gateway/configuration-reference#group-chat-mention-gating)。

  </Accordion>

  <Accordion title="按智能体限制 Skills">
    使用 `agents.defaults.skills` 作为共享基线，然后通过 `agents.list[].skills` 覆盖特定
    智能体：

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // 继承 github, weather
          { id: "docs", skills: ["docs-search"] }, // 替换默认值
          { id: "locked-down", skills: [] }, // 无 Skills
        ],
      },
    }
    ```

    - 省略 `agents.defaults.skills` 表示默认不限制 Skills。
    - 省略 `agents.list[].skills` 表示继承默认值。
    - 设置 `agents.list[].skills: []` 表示不启用 Skills。
    - 请参阅 [Skills](/zh-CN/tools/skills)、[Skills 配置](/zh-CN/tools/skills-config) 以及
      [配置参考](/zh-CN/gateway/configuration-reference#agents-defaults-skills)。

  </Accordion>

  <Accordion title="调整 gateway 渠道健康监控">
    控制 gateway 对看起来陈旧的渠道执行重启的激进程度：

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

    - 将 `gateway.channelHealthCheckMinutes: 0` 设为 0 可全局禁用健康监控重启。
    - `channelStaleEventThresholdMinutes` 应大于或等于检查间隔。
    - 使用 `channels.<provider>.healthMonitor.enabled` 或 `channels.<provider>.accounts.<id>.healthMonitor.enabled` 可针对某个渠道或账户禁用自动重启，而无需禁用全局监控。
    - 有关运维调试请参阅[健康检查](/zh-CN/gateway/health)，所有字段请参阅[完整参考](/zh-CN/gateway/configuration-reference#gateway)。

  </Accordion>

  <Accordion title="配置会话和重置">
    会话控制对话连续性和隔离性：

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
    - 有关范围、身份关联和发送策略，请参阅[会话管理](/zh-CN/concepts/session)。
    - 所有字段请参阅[完整参考](/zh-CN/gateway/configuration-reference#session)。

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

    完整指南请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)，所有选项请参阅[完整参考](/zh-CN/gateway/configuration-reference#agentsdefaultssandbox)。

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

    等效 CLI：

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    其作用是：

    - 允许 gateway 通过外部 relay 发送 `push.test`、唤醒提醒和重连唤醒。
    - 使用由已配对 iOS 应用转发的、基于注册范围的发送授权。gateway 不需要部署范围的 relay token。
    - 将每个基于 relay 的注册绑定到 iOS 应用所配对的 gateway 身份，因此其他 gateway 无法复用已存储的注册。
    - 本地/手动构建的 iOS 版本仍使用直接 APNs。基于 relay 的发送仅适用于通过 relay 注册的官方分发版本。
    - 必须与官方/TestFlight iOS 构建中内置的 relay base URL 匹配，这样注册和发送流量才会到达同一个 relay 部署。

    端到端流程：

    1. 安装一个使用相同 relay base URL 编译的官方/TestFlight iOS 构建。
    2. 在 gateway 上配置 `gateway.push.apns.relay.baseUrl`。
    3. 将 iOS 应用与 gateway 配对，并让 node 会话和 operator 会话都建立连接。
    4. iOS 应用会获取 gateway 身份，使用 App Attest 加应用回执向 relay 注册，然后将基于 relay 的 `push.apns.register` payload 发布到已配对的 gateway。
    5. gateway 会存储 relay handle 和发送授权，然后将它们用于 `push.test`、唤醒提醒和重连唤醒。

    运维说明：

    - 如果你将 iOS 应用切换到另一个 gateway，请重新连接该应用，以便它发布一个绑定到新 gateway 的 relay 注册。
    - 如果你发布了一个指向不同 relay 部署的新 iOS 构建，应用会刷新其缓存的 relay 注册，而不是复用旧的 relay 来源。

    兼容性说明：

    - `OPENCLAW_APNS_RELAY_BASE_URL` 和 `OPENCLAW_APNS_RELAY_TIMEOUT_MS` 仍可作为临时环境变量覆盖使用。
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` 仍然是仅限 loopback 的开发逃生口；不要在配置中持久化 HTTP relay URL。

    关于端到端流程请参阅[iOS 应用](/zh-CN/platforms/ios#relay-backed-push-for-official-builds)，关于 relay 安全模型请参阅[认证与信任流程](/zh-CN/platforms/ios#authentication-and-trust-flow)。

  </Accordion>

  <Accordion title="设置 heartbeat（定期检查）">
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
    - `directPolicy`：`allow`（默认）或 `block`，用于类私信 heartbeat 目标
    - 完整指南请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>

  <Accordion title="配置 cron jobs">
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

    - `sessionRetention`：从 `sessions.json` 中清理已完成的隔离运行会话（默认 `24h`；设为 `false` 可禁用）。
    - `runLog`：按大小和保留行数清理 `cron/runs/<jobId>.jsonl`。
    - 功能概览和 CLI 示例请参阅 [Cron jobs](/zh-CN/automation/cron-jobs)。

  </Accordion>

  <Accordion title="设置 Webhooks（hooks）">
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
    - 将所有 hook/webhook payload 内容都视为不受信任输入。
    - 使用专用的 `hooks.token`；不要复用共享的 Gateway 网关 token。
    - hook 认证仅支持请求头（`Authorization: Bearer ...` 或 `x-openclaw-token`）；查询字符串 token 会被拒绝。
    - `hooks.path` 不能为 `/`；请将 webhook 入口保持在专用子路径下，例如 `/hooks`。
    - 保持不安全内容绕过标志为禁用状态（`hooks.gmail.allowUnsafeExternalContent`、`hooks.mappings[].allowUnsafeExternalContent`），除非你在进行严格限定范围的调试。
    - 如果你启用了 `hooks.allowRequestSessionKey`，还应设置 `hooks.allowedSessionKeyPrefixes` 来限制调用方可选择的会话键。
    - 对于由 hook 驱动的智能体，优先使用强大的现代模型层级和严格的工具策略（例如尽可能只允许消息传递并配合沙箱隔离）。

    所有映射选项和 Gmail 集成请参阅[完整参考](/zh-CN/gateway/configuration-reference#hooks)。

  </Accordion>

  <Accordion title="配置多智能体路由">
    运行多个隔离的智能体，并为其设置独立工作区和会话：

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

    绑定规则和每智能体访问配置请参阅[多智能体](/zh-CN/concepts/multi-agent)和[完整参考](/zh-CN/gateway/configuration-reference#multi-agent-routing)。

  </Accordion>

  <Accordion title="将配置拆分为多个文件（$include）">
    使用 `$include` 组织大型配置：

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
    - **文件数组**：按顺序深度合并（后者优先）
    - **同级键**：在包含项之后合并（覆盖已包含值）
    - **嵌套 includes**：最多支持 10 层
    - **相对路径**：相对于包含它的文件解析
    - **OpenClaw 自有写入**：当一次写入仅修改由单文件 include 支持的一个顶层部分时，
      例如 `plugins: { $include: "./plugins.json5" }`，
      OpenClaw 会更新该包含文件，并保持 `openclaw.json` 不变
    - **不支持的透传写入**：根 include、include 数组以及带有同级覆盖的 includes
      在 OpenClaw 自有写入时会以失败关闭方式终止，而不是
      扁平化配置
    - **错误处理**：对缺失文件、解析错误和循环 include 提供清晰错误

  </Accordion>
</AccordionGroup>

## 配置热重载

Gateway 网关会监视 `~/.openclaw/openclaw.json` 并自动应用更改——大多数设置无需手动重启。

直接编辑文件会在验证通过前被视为不受信任。监视器会等待
编辑器临时写入/重命名抖动稳定下来，读取最终文件，并在外部编辑无效时通过恢复最近一次可用配置来拒绝这些修改。OpenClaw 自有配置写入在写入前也会通过同一 schema 门槛；像删除 `gateway.mode` 或将文件缩小到不足一半这类破坏性覆盖会被拒绝，并保存为 `.rejected.*` 以供检查。

如果你在日志中看到 `Config auto-restored from last-known-good` 或
`config reload restored last-known-good config`，请检查 `openclaw.json` 旁边对应的
`.clobbered.*` 文件，修复被拒绝的 payload，然后运行
`openclaw config validate`。恢复检查清单请参阅 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

### 重载模式

| 模式                   | 行为                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`**（默认）   | 立即热应用安全更改。对关键更改会自动重启。                                               |
| **`hot`**              | 仅热应用安全更改。当需要重启时记录警告——由你自行处理。                                   |
| **`restart`**          | 任何配置更改都会重启 Gateway 网关，无论是否安全。                                         |
| **`off`**              | 禁用文件监视。更改会在下一次手动重启时生效。                                             |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些可以热应用，哪些需要重启

大多数字段都可以无停机热应用。在 `hybrid` 模式下，需要重启的更改会自动处理。

| 类别                | 字段                                                              | 需要重启？ |
| ------------------- | ----------------------------------------------------------------- | ---------- |
| Channels            | `channels.*`、`web`（WhatsApp）——所有内置和插件渠道              | 否         |
| 智能体与模型        | `agent`、`agents`、`models`、`routing`                           | 否         |
| 自动化              | `hooks`、`cron`、`agent.heartbeat`                               | 否         |
| 会话与消息          | `session`、`messages`                                            | 否         |
| 工具与媒体          | `tools`、`browser`、`skills`、`audio`、`talk`                    | 否         |
| UI 与杂项           | `ui`、`logging`、`identity`、`bindings`                          | 否         |
| Gateway 网关服务器  | `gateway.*`（port、bind、auth、Tailscale、TLS、HTTP）            | **是**     |
| 基础设施            | `discovery`、`canvasHost`、`plugins`                             | **是**     |

<Note>
`gateway.reload` 和 `gateway.remote` 是例外——修改它们**不会**触发重启。
</Note>

### 重载规划

当你编辑通过 `$include` 引用的源文件时，OpenClaw 会根据源码编写的布局来规划
重载，而不是根据扁平化后的内存视图。
即使某个顶层部分单独存在于其自己的包含文件中，例如
`plugins: { $include: "./plugins.json5" }`，也能让热重载决策（热应用还是重启）保持可预测。
如果源码布局存在歧义，重载规划会以失败关闭方式终止。

## 配置 RPC（程序化更新）

对于通过 gateway API 写入配置的工具，推荐使用以下流程：

- 使用 `config.schema.lookup` 检查一个子树（浅层 schema 节点 + 子节点
  摘要）
- 使用 `config.get` 获取当前快照和 `hash`
- 使用 `config.patch` 进行部分更新（JSON merge patch：对象合并，`null`
  删除，数组替换）
- 仅当你确实打算替换整个配置时才使用 `config.apply`
- 使用 `update.run` 执行显式自更新并重启

<Note>
控制平面写入（`config.apply`、`config.patch`、`update.run`）会按
每个 `deviceId+clientIp` 进行速率限制：每 60 秒最多 3 次请求。重启请求会合并，然后在重启周期之间强制执行 30 秒冷却时间。
</Note>

部分 patch 示例：

```bash
openclaw gateway call config.get --params '{}'  # 获取 payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` 和 `config.patch` 都接受 `raw`、`baseHash`、`sessionKey`、
`note` 和 `restartDelayMs`。如果配置已存在，这两个方法都要求提供
`baseHash`。

## 环境变量

OpenClaw 会读取父进程中的环境变量，以及：

- 当前工作目录下的 `.env`（如果存在）
- `~/.openclaw/.env`（全局回退）

这两个文件都不会覆盖已有环境变量。你也可以在配置中设置内联环境变量：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell 环境变量导入（可选）">
  如果启用，并且预期键名尚未设置，OpenClaw 会运行你的登录 shell，并且只导入缺失的键名：

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

等效环境变量：`OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="配置值中的环境变量替换">
  你可以在任意配置字符串值中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则：

- 只匹配大写名称：`[A-Z_][A-Z0-9_]*`
- 缺失或为空的变量会在加载时抛出错误
- 使用 `$${VAR}` 转义以输出字面值
- 在 `$include` 文件中同样适用
- 内联替换：`"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef（env、file、exec）">
  对于支持 SecretRef 对象的字段，你可以使用：

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

有关 SecretRef 详情（包括用于 `env`/`file`/`exec` 的 `secrets.providers`），请参阅[Secrets 管理](/zh-CN/gateway/secrets)。
支持的凭证路径列于[SecretRef 凭证范围](/zh-CN/reference/secretref-credential-surface)。
</Accordion>

有关完整优先级和来源，请参阅[环境](/zh-CN/help/environment)。

## 完整参考

如需查看逐字段完整参考，请参阅 **[配置参考](/zh-CN/gateway/configuration-reference)**。

---

_相关内容：[配置示例](/zh-CN/gateway/configuration-examples) · [配置参考](/zh-CN/gateway/configuration-reference) · [Doctor](/zh-CN/gateway/doctor)_
