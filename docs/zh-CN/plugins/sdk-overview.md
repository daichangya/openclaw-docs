---
read_when:
    - 你需要知道应从哪个 SDK 子路径导入】【：】【“】【analysis to=functions.read 娱乐总代理  天天众json 801  content omitted due to length?
    - 你想要一份关于 OpenClawPluginApi 上所有注册方法的参考文档
    - 你正在查找某个特定的 SDK 导出
sidebarTitle: SDK overview
summary: 导入映射、注册 API 参考和 SDK 架构
title: 插件 SDK 概览
x-i18n:
    generated_at: "2026-04-23T20:57:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: efe676e4907428459ed3e30dd2e1df891eae0f0f1e87b0a850eb45140572a348
    source_path: plugins/sdk-overview.md
    workflow: 15
---

插件 SDK 是插件与 core 之间的类型化契约。本页是关于**该导入什么**以及**你可以注册什么**的参考文档。

<Tip>
  在找操作指南而不是参考文档？

- 第一个插件？从 [Building plugins](/zh-CN/plugins/building-plugins) 开始。
- 渠道插件？参见 [Channel Plugins](/zh-CN/plugins/sdk-channel-plugins)。
- 提供商插件？参见 [Provider Plugins](/zh-CN/plugins/sdk-provider-plugins)。
  </Tip>

## 导入约定

始终从某个特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含模块。这能保持启动快速，
并防止循环依赖问题。对于渠道专用的入口/构建辅助工具，
优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给
更广泛的总表面和共享辅助工具，例如
`buildChannelConfigSchema`。

<Warning>
  不要导入带有提供商或渠道品牌的便捷接缝（例如
  `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。
  内置插件会在它们自己的 `api.ts` /
  `runtime-api.ts` barrel 中组合通用 SDK 子路径；core 使用方要么应使用这些插件本地的
  barrel，要么在需求确实跨渠道时添加一个狭义的通用 SDK 契约。

一小部分内置插件辅助接缝（`plugin-sdk/feishu`、
`plugin-sdk/zalo`、`plugin-sdk/matrix*` 等）仍会出现在
生成的导出映射中。它们仅供内置插件维护使用，并
不推荐作为新的第三方插件导入路径。
</Warning>

## 子路径参考

下面列出最常用的子路径，并按用途分组。完整的 200+
个子路径的生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`；保留的
内置插件辅助子路径也会出现在那里，但除非某个文档页面明确推荐，
否则它们属于实现细节。

### 插件入口

| 子路径 | 关键导出 |
| ------ | -------- |
| `plugin-sdk/plugin-entry` | `definePluginEntry` |
| `plugin-sdk/core` | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema` |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

<AccordionGroup>
  <Accordion title="渠道子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具、allowlist 提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门禁辅助工具、默认账户回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 id 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 狭义账户列表/账户操作辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 渠道配置 schema 类型 |
    | `plugin-sdk/telegram-command-config` | 带内置契约回退的 Telegram 自定义命令规范化/校验辅助工具 |
    | `plugin-sdk/command-gating` | 狭义命令授权门禁辅助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期/完成辅助工具 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + envelope 构建辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录与分发辅助工具 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助工具 |
    | `plugin-sdk/outbound-runtime` | 出站 identity、发送委托和负载规划辅助工具 |
    | `plugin-sdk/poll-runtime` | 狭义 poll 规范化辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版智能体媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享渠道状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 狭义渠道配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | 渠道配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享渠道插件前导导出 |
    | `plugin-sdk/allowlist-config-edit` | Allowlist 配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享群组访问决策辅助工具 |
    | `plugin-sdk/direct-dm` | 共享私信认证/守卫辅助工具 |
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、交付和旧版交互式回复辅助工具。参见 [Message Presentation](/zh-CN/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站防抖、提及匹配、提及策略辅助工具及 envelope 辅助工具的兼容性 barrel |
    | `plugin-sdk/channel-mention-gating` | 不包含更广泛入站运行时表面的狭义提及策略辅助工具 |
    | `plugin-sdk/channel-location` | 渠道位置上下文和格式化辅助工具 |
    | `plugin-sdk/channel-logging` | 用于入站丢弃和 typing/ack 失败的渠道日志辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | 渠道消息操作辅助工具，以及为插件兼容性保留的已弃用原生 schema 辅助工具 |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/channel-contract` | 渠道契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/reaction 接线 |
    | `plugin-sdk/channel-secret-runtime` | 狭义 secret 契约辅助工具，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及 secret target 类型 |
  </Accordion>

  <Accordion title="提供商子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 经过整理的本地/自托管提供商设置辅助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦于 OpenAI 兼容自托管提供商设置的辅助工具 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + watchdog 常量 |
    | `plugin-sdk/provider-auth-runtime` | 提供商插件的运行时 API key 解析辅助工具 |
    | `plugin-sdk/provider-auth-api-key` | API key 新手引导/profile 写入辅助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth auth-result 构建器 |
    | `plugin-sdk/provider-auth-login` | 提供商插件的共享交互式登录辅助工具 |
    | `plugin-sdk/provider-env-vars` | 提供商认证环境变量查找辅助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共享 replay-policy 构建器、provider-endpoint 辅助工具，以及诸如 `normalizeNativeXaiModelId` 之类的模型 id 规范化辅助工具 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供商 HTTP/端点能力辅助工具，包括音频转写 multipart form 辅助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 狭义 web-fetch 配置/选择契约辅助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch 提供商注册/缓存辅助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 适用于不需要插件启用接线的提供商的狭义 web-search 配置/凭证辅助工具 |
    | `plugin-sdk/provider-web-search-contract` | 狭义 web-search 配置/凭证契约辅助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及作用域凭证 setter/getter |
    | `plugin-sdk/provider-web-search` | Web-search 提供商注册/缓存/运行时辅助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理 + 诊断，以及诸如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 之类的 xAI 兼容辅助工具 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 流包装器类型，以及共享的 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供商传输辅助工具，例如受保护 fetch、传输消息变换以及可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 新手引导配置补丁辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地 singleton/map/cache 辅助工具 |
  </Accordion>

  <Accordion title="认证与安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表辅助工具、发送者授权辅助工具 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Approver 解析和同聊天 action-auth 辅助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec approval profile/filter 辅助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生 approval 能力/交付适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享 approval gateway 解析辅助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 面向热渠道入口点的轻量原生 approval 适配器加载辅助工具 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的 approval handler 运行时辅助工具；当狭义 adapter/gateway 接缝已足够时，应优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生 approval 目标 + 账户绑定辅助工具 |
    | `plugin-sdk/approval-reply-runtime` | Exec/plugin approval 回复负载辅助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令认证 + 原生会话目标辅助工具 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助工具 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令表面辅助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 面向渠道/插件 secret 表面的狭义 secret 契约收集辅助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用于 secret-contract/配置解析的狭义 `coerceSecretRef` 和 SecretRef 类型辅助工具 |
    | `plugin-sdk/security-runtime` | 共享信任、私信门控、外部内容和 secret 收集辅助工具 |
    | `plugin-sdk/ssrf-policy` | 主机 allowlist 和私有网络 SSRF 策略辅助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不引入广泛 infra 运行时表面的狭义 pinned-dispatcher 辅助工具 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、受 SSRF 防护的 fetch，以及 SSRF 策略辅助工具 |
    | `plugin-sdk/secret-input` | Secret 输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时与存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志/备份/插件安装辅助工具 |
    | `plugin-sdk/runtime-env` | 狭义运行时环境、logger、超时、重试和退避辅助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用渠道运行时上下文注册与查找辅助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享插件命令/hook/http/交互式辅助工具 |
    | `plugin-sdk/hook-runtime` | 共享 webhook/内部 hook 管线辅助工具 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入/绑定辅助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程 exec 辅助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待和版本辅助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 客户端和渠道状态补丁辅助工具 |
    | `plugin-sdk/config-runtime` | 配置加载/写入辅助工具，以及插件配置查找辅助工具 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名/描述规范化及重复/冲突检查，即使内置 Telegram 契约表面不可用时也适用 |
    | `plugin-sdk/text-autolink-runtime` | 不引入广泛 text-runtime barrel 的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | Exec/plugin approval 辅助工具、approval 能力构建器、认证/profile 辅助工具、原生路由/运行时辅助工具 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助工具、分块、分发、heartbeat、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 狭义回复分发/完成辅助工具 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助工具，例如 `buildHistoryContext`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 狭义文本/Markdown 分块辅助工具 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径 + updated-at 辅助工具 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助工具 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享渠道/账户状态摘要辅助工具、运行时状态默认值和问题元数据辅助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助工具 |
    | `plugin-sdk/request-url` | 从 fetch/request 类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带计时功能的命令运行器，并返回标准化 stdout/stderr 结果 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助工具 |
    | `plugin-sdk/logging-core` | 子系统 logger 和脱敏辅助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式辅助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助工具 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助工具 |
    | `plugin-sdk/persistent-dedupe` | 基于磁盘的去重缓存辅助工具 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和 reply-dispatch 辅助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不引入生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 狭义智能体运行时配置 schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助工具 |
    | `plugin-sdk/device-bootstrap` | 设备 bootstrap 和配对 token 辅助工具 |
    | `plugin-sdk/extension-shared` | 共享被动渠道、状态和环境代理辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供商回复辅助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/build/serialize 辅助工具 |
    | `plugin-sdk/agent-harness` | 面向可信插件的实验性低层智能体 harness 表面：harness 类型、活动运行 steer/abort 辅助工具、OpenClaw 工具桥接辅助工具，以及尝试结果工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端点检测辅助工具 |
    | `plugin-sdk/infra-runtime` | 系统事件/heartbeat 辅助工具 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装过的 fetch、代理和 pinned lookup 辅助工具 |
    | `plugin-sdk/runtime-fetch` | 不引入 proxy/guarded-fetch 的 dispatcher-aware 运行时 fetch |
    | `plugin-sdk/response-limit-runtime` | 不引入广泛 media 运行时表面的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 不引入广泛配置写入/维护导入的会话存储读取辅助工具 |
    | `plugin-sdk/context-visibility-runtime` | 不引入广泛配置/安全导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不引入 markdown/logging 的狭义原语 record/string 强制转换与规范化辅助工具 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | 智能体目录/identity/workspace 辅助工具 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力与测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具，以及媒体负载构建器 |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助工具、候选选择和缺失模型提示消息 |
    | `plugin-sdk/media-understanding` | 媒体理解提供商类型，以及面向提供商的图像/音频辅助导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志辅助工具，例如去除 assistant 可见文本、Markdown 渲染/分块/表格辅助工具、脱敏辅助工具、directive-tag 辅助工具，以及安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | Speech 提供商类型，以及面向提供商的 directive、注册表和校验辅助工具 |
    | `plugin-sdk/speech-core` | 共享 speech 提供商类型、注册表、directive 和规范化辅助工具 |
    | `plugin-sdk/realtime-transcription` | 实时转写提供商类型、注册表辅助工具和共享 WebSocket 会话辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音提供商类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成提供商类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、认证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成提供商/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助工具、提供商查找和 model-ref 解析 |
    | `plugin-sdk/video-generation` | 视频生成提供商/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助工具、提供商查找和 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 面向插件 SDK 使用方重新导出的 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`、`shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 内置 memory-core 辅助表面，用于 manager/config/file/CLI 辅助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | Memory 索引/搜索运行时门面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding 契约、注册表访问、本地提供商，以及通用批处理/远程辅助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage 引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host 多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | Memory host 查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret 辅助工具 |
    | `plugin-sdk/memory-core-host-events` | Memory host 事件日志辅助工具 |
    | `plugin-sdk/memory-core-host-status` | Memory host 状态辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host core 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host 文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 面向供应商中立的 memory host core 运行时辅助工具别名 |
    | `plugin-sdk/memory-host-events` | 面向供应商中立的 memory host 事件日志辅助工具别名 |
    | `plugin-sdk/memory-host-files` | 面向供应商中立的 memory host 文件/运行时辅助工具别名 |
    | `plugin-sdk/memory-host-markdown` | 供 memory 相邻插件使用的共享托管 Markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 面向搜索管理器访问的活动 memory 运行时门面 |
    | `plugin-sdk/memory-host-status` | 面向供应商中立的 memory host 状态辅助工具别名 |
    | `plugin-sdk/memory-lancedb` | 内置 memory-lancedb 辅助表面 |
  </Accordion>

  <Accordion title="保留的内置辅助子路径">
    | 家族 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 内置 browser 插件支持辅助工具（`browser-support` 仍是兼容性 barrel） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 内置 Matrix 辅助/运行时表面 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 内置 LINE 辅助/运行时表面 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 内置 IRC 辅助表面 |
    | 渠道专用辅助工具 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 内置渠道兼容/辅助接缝 |
    | 认证/插件专用辅助工具 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 内置功能/插件辅助接缝；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 注册 API

`register(api)` 回调会收到一个 `OpenClawPluginApi` 对象，其中包含以下
方法：

### 能力注册

| 方法 | 注册内容 |
| ---- | -------- |
| `api.registerProvider(...)` | 文本推理（LLM） |
| `api.registerAgentHarness(...)` | 实验性的低层智能体执行器 |
| `api.registerCliBackend(...)` | 本地 CLI 推理后端 |
| `api.registerChannel(...)` | 消息渠道 |
| `api.registerSpeechProvider(...)` | Text-to-speech / STT 合成 |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转写 |
| `api.registerRealtimeVoiceProvider(...)` | 双工实时语音会话 |
| `api.registerMediaUnderstandingProvider(...)` | 图像/音频/视频分析 |
| `api.registerImageGenerationProvider(...)` | 图像生成 |
| `api.registerMusicGenerationProvider(...)` | 音乐生成 |
| `api.registerVideoGenerationProvider(...)` | 视频生成 |
| `api.registerWebFetchProvider(...)` | Web 获取 / 抓取提供商 |
| `api.registerWebSearchProvider(...)` | Web 搜索 |

### 工具与命令

| 方法 | 注册内容 |
| ---- | -------- |
| `api.registerTool(tool, opts?)` | 智能体工具（必选或 `{ optional: true }`） |
| `api.registerCommand(def)` | 自定义命令（绕过 LLM） |

### 基础设施

| 方法 | 注册内容 |
| ---- | -------- |
| `api.registerHook(events, handler, opts?)` | 事件 hook |
| `api.registerHttpRoute(params)` | Gateway 网关 HTTP 端点 |
| `api.registerGatewayMethod(name, handler)` | Gateway 网关 RPC 方法 |
| `api.registerCli(registrar, opts?)` | CLI 子命令 |
| `api.registerService(service)` | 后台服务 |
| `api.registerInteractiveHandler(registration)` | 交互式处理器 |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi 嵌入式运行器扩展工厂 |
| `api.registerMemoryPromptSupplement(builder)` | 增量 memory 相邻提示段 |
| `api.registerMemoryCorpusSupplement(adapter)` | 增量 memory 搜索/读取语料库 |

<Note>
  保留的 core 管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、
  `update.*`）始终保持为 `operator.admin`，即使插件尝试分配更窄的
  gateway method scope 也是如此。对于插件自有的方法，请优先使用插件专用前缀。
</Note>

<Accordion title="何时使用 registerEmbeddedExtensionFactory">
  当插件需要在 OpenClaw 嵌入式运行期间获得 Pi 原生事件时序时，请使用 `api.registerEmbeddedExtensionFactory(...)`
  —— 例如必须在最终 tool-result 消息发出之前完成的异步 `tool_result`
  重写。

这目前是一个内置插件专用接缝：只有内置插件可以注册它，
并且它们必须在
`openclaw.plugin.json` 中声明 `contracts.embeddedExtensionFactories: ["pi"]`。
对于一切不需要这种更底层接缝的情况，请继续使用普通的 OpenClaw 插件 hook。
</Accordion>

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两类顶层元数据：

- `commands`：由 registrar 拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和延迟插件 CLI 注册的解析时命令描述符

如果你希望某个插件命令在普通根 CLI 路径中保持延迟加载，
请提供 `descriptors`，覆盖该 registrar 暴露的每一个顶层命令根。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

仅当你不需要延迟根 CLI 注册时，才单独使用 `commands`。
这种急切兼容路径仍然受支持，但它不会为解析时延迟加载安装
descriptor 支持的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许插件拥有本地
AI CLI 后端（如 `codex-cli`）的默认配置。

- 后端 `id` 会成为模型引用中的提供商前缀，例如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的结构。
- 用户配置仍然优先。OpenClaw 会在运行 CLI 前，将 `agents.defaults.cliBackends.<id>` 合并覆盖到
  插件默认值之上。
- 当某个后端在合并后需要兼容性重写时（例如规范化旧版 flag 结构），请使用 `normalizeConfig`。

### 排他 slot

| 方法 | 注册内容 |
| ---- | -------- |
| `api.registerContextEngine(id, factory)` | 上下文引擎（同一时间只能激活一个）。`assemble()` 回调会收到 `availableTools` 和 `citationsMode`，以便引擎能定制提示附加内容。 |
| `api.registerMemoryCapability(capability)` | 统一 memory 能力 |
| `api.registerMemoryPromptSection(builder)` | Memory 提示段构建器 |
| `api.registerMemoryFlushPlan(resolver)` | Memory flush 计划解析器 |
| `api.registerMemoryRuntime(runtime)` | Memory 运行时适配器 |

### Memory embedding 适配器

| 方法 | 注册内容 |
| ---- | -------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 供活动插件使用的 memory embedding 适配器 |

- `registerMemoryCapability` 是首选的排他型 memory 插件 API。
- `registerMemoryCapability` 还可以暴露 `publicArtifacts.listArtifacts(...)`，
  以便配套插件可以通过
  `openclaw/plugin-sdk/memory-host-core` 消费已导出的 memory 产物，而不是深入某个
  memory 插件的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和
  `registerMemoryRuntime` 是兼容 legacy 的排他型 memory 插件 API。
- `registerMemoryEmbeddingProvider` 允许活动 memory 插件注册一个
  或多个 embedding 适配器 id（例如 `openai`、`gemini` 或某个自定义
  插件定义 id）。
- 像 `agents.defaults.memorySearch.provider` 和
  `agents.defaults.memorySearch.fallback` 这样的用户配置，
  会针对这些已注册的适配器 id 进行解析。

### 事件与生命周期

| 方法 | 作用 |
| ---- | ---- |
| `api.on(hookName, handler, opts?)` | 类型化生命周期 hook |
| `api.onConversationBindingResolved(handler)` | 会话绑定解析回调 |

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终结性决策。一旦任意 handler 设置了它，就会跳过更低优先级的 handler。
- `before_tool_call`：返回 `{ block: false }` 会被视为未作决策（等同于省略 `block`），而不是覆盖前面的决策。
- `before_install`：返回 `{ block: true }` 是终结性决策。一旦任意 handler 设置了它，就会跳过更低优先级的 handler。
- `before_install`：返回 `{ block: false }` 会被视为未作决策（等同于省略 `block`），而不是覆盖前面的决策。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终结性决策。一旦任意 handler 声明已处理分发，就会跳过更低优先级的 handler 以及默认的模型分发路径。
- `message_sending`：返回 `{ cancel: true }` 是终结性决策。一旦任意 handler 设置了它，就会跳过更低优先级的 handler。
- `message_sending`：返回 `{ cancel: false }` 会被视为未作决策（等同于省略 `cancel`），而不是覆盖前面的决策。
- `message_received`：当你需要入站线程/话题路由时，请使用类型化的 `threadId` 字段。将 `metadata` 保留给渠道专用的额外信息。
- `message_sending`：优先使用类型化的 `replyToId` / `threadId` 路由字段，然后再回退到渠道专用的 `metadata`。
- `gateway_start`：对于 gateway 自有的启动状态，请使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()`，而不是依赖内部的 `gateway:startup` hook。

### API 对象字段

| 字段 | 类型 | 描述 |
| ---- | ---- | ---- |
| `api.id` | `string` | 插件 id |
| `api.name` | `string` | 显示名称 |
| `api.version` | `string?` | 插件版本（可选） |
| `api.description` | `string?` | 插件描述（可选） |
| `api.source` | `string` | 插件源码路径 |
| `api.rootDir` | `string?` | 插件根目录（可选） |
| `api.config` | `OpenClawConfig` | 当前配置快照（在可用时为活动中的内存运行时快照） |
| `api.pluginConfig` | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专用配置 |
| `api.runtime` | `PluginRuntime` | [Runtime helpers](/zh-CN/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | 作用域 logger（`debug`、`info`、`warn`、`error`） |
| `api.registrationMode` | `PluginRegistrationMode` | 当前加载模式；`"setup-runtime"` 是完整入口启动前的轻量 setup 窗口 |
| `api.resolvePath(input)` | `(string) => string` | 解析相对于插件根目录的路径 |

## 内部模块约定

在你的插件内部，请使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 供外部使用方使用的公共导出
  runtime-api.ts    # 仅限内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 仅 setup 的轻量入口（可选）
```

<Warning>
  不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>`
  导入你自己的插件。请通过 `./api.ts` 或
  `./runtime-api.ts` 进行内部导入。SDK 路径只应该作为外部契约使用。
</Warning>

以门面方式加载的内置插件公共表面（`api.ts`、`runtime-api.ts`、
`index.ts`、`setup-entry.ts` 以及类似的公共入口文件）会在 OpenClaw 已运行时
优先使用活动运行时配置快照。如果运行时快照尚不存在，
则回退到磁盘上已解析的配置文件。

当某个辅助工具确实属于提供商专用、而尚不适合进入通用 SDK
子路径时，提供商插件可以暴露一个狭义的插件本地契约 barrel。内置示例：

- **Anthropic**：公共 `api.ts` / `contract-api.ts` 接缝，用于 Claude
  beta-header 和 `service_tier` 流辅助工具。
- **`@openclaw/openai-provider`**：`api.ts` 导出 provider 构建器、
  默认模型辅助工具以及 realtime provider 构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出 provider 构建器
  以及 onboarding/config 辅助工具。

<Warning>
  Extension 生产代码也应避免导入 `openclaw/plugin-sdk/<other-plugin>`。
  如果某个辅助工具确实应共享，请将其提升为中立的 SDK 子路径，
  例如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared`，或其他
  面向能力的表面，而不是让两个插件彼此耦合。
</Warning>

## 相关内容

<CardGroup cols={2}>
  <Card title="Entry Points" icon="door-open" href="/zh-CN/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/zh-CN/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="Setup and config" icon="sliders" href="/zh-CN/plugins/sdk-setup">
    打包、manifest 和配置 schema。
  </Card>
  <Card title="Testing" icon="vial" href="/zh-CN/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/zh-CN/plugins/sdk-migration">
    从已弃用表面迁移。
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/zh-CN/plugins/architecture">
    深入架构和能力模型。
  </Card>
</CardGroup>
