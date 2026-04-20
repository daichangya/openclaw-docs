---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-20T14:50:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a851f7878715118ee89d24285ba031e7cacaa308a1d6c26375ce9a69c97da010
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三个 `Vitest` 测试套件（单元 / 集成、e2e、实时测试），以及一小组 `Docker` 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它有意 _不_ 覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- 实时测试如何发现凭证并选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期在推送前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 `Vitest` 监听循环：`pnpm test:watch`
- 现在直接按文件定位也会路由到扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先先运行有针对性的测试。
- 基于 `Docker` 的 QA 站点：`pnpm qa:lab:up`
- 基于 `Linux VM` 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或者想要更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`

提示：如果你只需要一个失败用例，优先使用下面描述的 allowlist 环境变量来缩小实时测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实环境时，这些命令与主测试套件一起使用：

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认并行运行多个选定场景，并使用隔离的 Gateway 网关工作进程。`qa-channel` 默认并发度为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 回到旧的串行通道。
  - 当任一场景失败时，以非零状态退出。当你希望保留产物但不返回失败退出码时，使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的、基于 AIMock 的提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不是替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 `Multipass Linux VM` 中运行相同的 QA 测试套件。
  - 保持与主机上的 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - 实时运行会转发来宾系统中可用的、受支持的 QA 认证输入：
    基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，这样来宾系统才能通过挂载的工作区回写内容。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要，以及 `Multipass` 日志。
- `pnpm qa:lab:up`
  - 启动基于 `Docker` 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接进行协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 `Docker` 的 Tuwunel homeserver 运行 `Matrix` 实时 QA 通道。
  - 这个 QA 主机当前仅供仓库 / 开发环境使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独安装插件。
  - 配置三个临时 `Matrix` 用户（`driver`、`sut`、`observer`）和一个私有房间，然后启动一个 QA Gateway 网关子进程，并将真实的 `Matrix` 插件作为 SUT 传输层。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试不同镜像时，可用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - `Matrix` 不暴露共享凭证源标志，因为该通道会在本地配置一次性用户。
  - 在 `.artifacts/qa-e2e/...` 下写入 `Matrix QA` 报告、摘要、观测事件产物，以及合并后的 `stdout/stderr` 输出日志。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 `driver` 和 SUT bot token，针对真实私有群组运行 `Telegram` 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数值型 `Telegram chat id`。
  - 支持 `--credential-source convex`，用于共享的池化凭证。默认使用环境变量模式，或者设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 当任一场景失败时，以非零状态退出。当你希望保留产物但不返回失败退出码时，使用 `--allow-failures`。
  - 需要两个不同的 bot 位于同一个私有群组中，并且 SUT bot 需要暴露一个 `Telegram username`。
  - 为了获得稳定的 bot 对 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 `driver bot` 可以观测群组中的 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 `Telegram QA` 报告、摘要和观测消息产物。

实时传输通道共享一个标准契约，这样新传输方式就不会发生漂移：

`qa-channel` 仍然是范围广泛的合成 QA 测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | allowlist 屏蔽 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | reaction 观测 | help 命令 |
| ---- | ------ | -------- | -------------- | -------- | -------- | -------- | -------- | ------------- | --------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 `Telegram` 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从基于 `Convex` 的池中获取独占租约，在该通道运行期间持续发送该租约的心跳，并在关闭时释放租约。

参考 `Convex` 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个密钥：
  - `maintainer` 使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 使用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则是 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列出）必须专门使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 资源耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（仅限维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

`Telegram kind` 的负载结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数值型 `Telegram chat id` 字符串。
- 对于 `kind: "telegram"`，`admin/add` 会校验该结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

将一个渠道添加到基于 Markdown 的 QA 系统中，严格只需要两样东西：

1. 该渠道的传输适配器。
2. 用于验证该渠道契约的场景包。

如果共享的 `qa-lab` 主机可以承载整个流程，就不要新增顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动和清理
- 工作进程并发
- 产物写入
- 报告生成
- 场景执行
- 对旧 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享的 `qa` 根命令下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录内容和规范化后的传输状态
- 如何执行由传输支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入标准是：

1. 继续由 `qa-lab` 持有共享的 `qa` 根命令。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；惰性 CLI 和运行器执行应放在单独的入口点之后。
5. 在带主题的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 对新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续工作。

决策规则非常严格：

- 如果某种行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某种行为依赖于单一渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一种可被多个渠道复用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中添加渠道特定分支。
- 如果某种行为只对某一种传输有意义，就保持该场景是传输特定的，并在场景契约中明确这一点。

新场景的首选通用辅助函数名称是：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

现有场景仍可使用兼容别名，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新的渠道开发应使用通用辅助函数名称。
兼容别名的存在是为了避免一次性强制迁移，而不是作为新场景编写的范式。

## 测试套件（各自在哪里运行）

可以把这些测试套件理解为“真实度逐步提高”（同时波动性 / 成本也逐步提高）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：针对现有分域 `Vitest projects` 的十一个顺序分片运行（`vitest.full-*.config.ts`）
- 文件：位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 的 core / 单元测试清单，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- 项目说明：
  - 不带目标的 `pnpm test` 现在会运行十一个更小的分片配置（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这可以降低高负载机器上的峰值 RSS，并避免 `auto-reply` / 扩展工作拖慢无关测试套件。
  - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片的监听循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会优先通过分域通道路由显式的文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动成本。
  - `pnpm test:changed` 会在 diff 只涉及可路由的源码 / 测试文件时，将已变更的 git 路径展开到同样的分域通道；配置 / setup 修改仍会回退到更宽泛的根项目重跑。
  - `pnpm check:changed` 是常规的智能本地门禁，适合窄范围工作。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs 和 tooling，然后运行对应的 typecheck / lint / test 通道。公共 `Plugin SDK` 和 plugin 契约变更会包含扩展校验，因为扩展依赖这些 core 契约。
  - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会通过 `unit-fast` 通道运行，从而跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有通道中。
  - 部分 `plugin-sdk` 和 `commands` 辅助源码文件在 changed 模式运行时，也会映射到这些轻量通道中的显式同级测试，因此辅助函数修改不必为该目录重跑整套沉重测试。
  - `auto-reply` 现在有三个专用桶：顶层 core 辅助函数、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这样可以让最重的 reply harness 工作不影响廉价的 status / chunk / token 测试。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，要同时保持两级覆盖。
  - 为纯路由 / 规范化边界添加聚焦的辅助函数回归测试。
  - 同时还要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件验证带作用域的 id 和压缩行为仍会流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试不足以替代这些集成路径。
- 池说明：
  - 基础 `Vitest` 配置现在默认使用 `threads`。
  - 共享 `Vitest` 配置还固定了 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
  - 根 UI 通道保留其 `jsdom` setup 和 optimizer，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` 分片都从共享 `Vitest` 配置继承同样的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在默认还会为 `Vitest` 子 `Node` 进程添加 `--no-maglev`，以减少大型本地运行中的 V8 编译抖动。如果你需要对比原生 V8 行为，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 本地快速迭代说明：
  - `pnpm changed:lanes` 会显示某个 diff 触发了哪些架构通道。
  - pre-commit hook 会在 staged 格式化 / lint 之后运行 `pnpm check:changed --staged`，因此纯 core 提交不会承担扩展测试成本，除非它们触及面向扩展的公共契约。
  - `pnpm test:changed` 会在变更路径可清晰映射到更小测试套件时，通过分域通道进行路由。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动缩放现在有意更加保守，并且当主机负载平均值已经较高时也会回退，因此默认情况下多个并发 `Vitest` 运行的破坏性更小。
  - 基础 `Vitest` 配置将项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式重跑仍然正确。
  - 在受支持的主机上，该配置会保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个显式缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 `Vitest` 导入耗时报告以及导入拆解输出。
  - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将路由后的 `test:changed` 与该已提交 diff 的原生根项目路径进行比较，并输出墙钟时间以及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过将已变更文件列表路由到 `scripts/test-projects.mjs` 和根 `Vitest` 配置，来对当前脏工作树进行基准测试。
  - `pnpm test:perf:profile:main` 会为 `Vitest/Vite` 启动和 transform 开销写出主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出运行器 CPU + heap profile。

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 `Vitest threads` 且 `isolate: false`，与仓库其他部分保持一致。
  - 使用自适应 workers（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 表面、节点配对和更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 `Docker` 在主机上启动一个隔离的 `OpenShell Gateway`
  - 从临时本地 `Dockerfile` 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec，验证 OpenClaw 的 `OpenShell` 后端
  - 通过沙箱 fs bridge 验证远程规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 `Docker daemon`
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：当你手动运行更宽泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### 实时测试（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在 _今天_ 是否真的能通过真实凭证工作？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计并非 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小后的子集，而不是“全部”
- 实时运行会读取 `~/.profile` 以获取缺失的 API 密钥。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 仅当你有意让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认更安静：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / `Bonjour` 杂音。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 进行实时测试专用覆盖；测试会在收到速率限制响应时重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会将进度行输出到 stderr，因此即使 `Vitest` 控制台捕获较安静，长时间的提供商调用也能明显看出仍在活动。
  - `vitest.live.config.ts` 禁用了 `Vitest` 控制台拦截，因此提供商 / Gateway 网关进度行会在实时运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用下面的决策表：

- 修改逻辑 / 测试：运行 `pnpm test`（如果改动很多，再运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：加跑 `pnpm test:e2e`
- 调试“我的 bot 宕了” / 提供商特定故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时测试：Android 节点能力扫查

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 `Android` 节点当前**声明的每一条命令**，并断言命令契约行为。
- 范围：
  - 已预置 / 手动 setup（该测试套件不会安装 / 运行 / 配对应用）
  - 针对所选 Android 节点逐命令验证 Gateway 网关 `node.invoke`
- 必需的预先 setup：
  - Android 应用已连接并已与 Gateway 网关配对。
  - 应用保持在前台。
  - 已授予你预期会通过的能力所需的权限 / 捕获同意。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- 完整 Android setup 详情：[Android App](/zh-CN/platforms/android)

## 实时测试：模型冒烟（profile keys）

实时测试分为两层，以便我们隔离故障：

- “直接模型”告诉我们：给定密钥的情况下，提供商 / 模型是否至少能响应。
- “Gateway 网关冒烟”告诉我们：该模型的完整 Gateway 网关 + 智能体管线是否工作正常（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现到的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一个小型补全测试（并在需要时运行定向回归测试）
- 如何启用：
  - `pnpm test:live`（或者如果你直接调用 `Vitest`，则设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或者 `all`，即 `modern` 的别名）来实际运行此测试套件；否则它会跳过，以便让 `pnpm test:live` 继续聚焦于 Gateway 网关冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代 allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或者 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
  - `modern/all` 扫查默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可进行穷尽式现代扫查，或者设置为正数以使用更小的上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- 密钥来源：
  - 默认：profile store 和环境变量回退值
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile store**
- 为什么存在这一层：
  - 将“提供商 API 坏了 / 密钥无效”和“Gateway 网关智能体管线坏了”区分开来
  - 包含小型、隔离的回归测试（示例：OpenAI Responses / Codex Responses 的 reasoning replay + tool-call 流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟（即 “@openclaw” 实际在做什么）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / patch 一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 遍历带密钥的模型并断言：
    - “有意义的”响应（不使用工具）
    - 一次真实工具调用可以正常工作（读取探针）
    - 可选的额外工具探针（exec + read 探针）
    - OpenAI 回归路径（仅 tool-call → 后续跟进）继续可用
- 探针细节（这样你就能快速解释失败原因）：
  - `read` 探针：测试会在工作区中写入一个 nonce 文件，并要求智能体 `read` 该文件并回显 nonce。
  - `exec+read` 探针：测试会要求智能体通过 `exec` 将 nonce 写入临时文件，然后再 `read` 回来。
  - 图像探针：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 如何启用：
  - `pnpm test:live`（或者如果你直接调用 `Vitest`，则设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代 allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或者设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号分隔列表）来缩小范围
  - `modern/all` Gateway 网关扫查默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可进行穷尽式现代扫查，或者设置为正数以使用更小的上限。
- 如何选择提供商（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 工具 + 图像探针在这个实时测试中始终开启：
  - `read` 探针 + `exec+read` 探针（工具压力测试）
  - 当模型声明支持图像输入时，图像探针会运行
  - 流程（高层）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析为 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将一个多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：要查看你机器上可以测试什么（以及准确的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## 实时测试：CLI 后端冒烟（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体管线，同时不触碰你的默认配置。
- 后端特定的默认冒烟配置位于所属扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或者如果你直接调用 `Vitest`，则设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - 命令 / 参数 / 图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传递，而不是注入到提示词中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）控制在设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 禁用默认的 Claude Sonnet -> Opus 同会话连续性探针（当所选模型支持切换目标时，设置为 `1` 可强制开启）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

`Docker` 配方：

```bash
pnpm test:docker:live-cli-backend
```

单提供商 `Docker` 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- `Docker` 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 `Docker` 镜像中以非 root 的 `node` 用户身份运行实时 CLI 后端冒烟测试。
- 它会从所属扩展中解析 CLI 冒烟元数据，然后将匹配的 `Linux CLI` 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到可缓存的可写前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（默认：`~/.cache/openclaw/docker-cli-tools`）中。
- `pnpm test:docker:live-cli-backend:claude-subscription` 要求通过 `~/.claude/.credentials.json` 中带有 `claudeAiOauth.subscriptionType` 的可移植 Claude Code 订阅 OAuth，或者通过 `claude setup-token` 提供的 `CLAUDE_CODE_OAUTH_TOKEN`。它会先在 `Docker` 中证明直接 `claude -p` 可用，然后在不保留 Anthropic API 密钥环境变量的情况下运行两轮 Gateway 网关 CLI 后端测试。这个订阅通道默认禁用 Claude MCP / 工具和图像探针，因为 Claude 目前会将第三方应用使用量路由到额外用量计费，而不是普通订阅计划额度。
- 实时 CLI 后端冒烟测试现在对 Claude、Codex 和 Gemini 走同一条端到端流程：文本轮次、图像分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet patch 到 Opus，并验证恢复后的会话仍记得更早的一条备注。

## 实时测试：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用实时 ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一个会话上发送一条普通后续消息
  - 验证该后续消息落入绑定的 ACP 会话转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - `Docker` 中的 ACP 智能体：`claude,codex,gemini`
  - 直接 `pnpm test:live ...` 使用的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 说明：
  - 这个通道使用 Gateway 网关 `chat.send` 表面，并带有仅管理员可用的合成 originating-route 字段，这样测试就能附加消息渠道上下文，而不必假装进行外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件的内建智能体注册表来运行所选 ACP harness 智能体。

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

`Docker` 配方：

```bash
pnpm test:docker:live-acp-bind
```

单智能体 `Docker` 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

`Docker` 说明：

- `Docker` 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序对所有受支持的实时 CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可缩小矩阵。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，将 `acpx` 安装到可写 npm 前缀中，然后在缺失时安装所请求的实时 CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 `Docker` 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 `acpx` 保持从已读取 profile 中获得的提供商环境变量可供子 harness CLI 使用。

## 实时测试：Codex app-server harness 冒烟

- 目标：通过常规 Gateway 网关
  `agent` 方法验证由 plugin 拥有的 Codex harness：
  - 加载内置 `codex` plugin
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `codex/gpt-5.4` 发送第一轮 Gateway 网关智能体消息
  - 向同一个 OpenClaw 会话发送第二轮消息，并验证 app-server
    线程能够恢复
  - 通过相同的 Gateway 网关命令
    路径运行 `/codex status` 和 `/codex models`
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`codex/gpt-5.4`
- 可选图像探针：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP / 工具探针：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，这样损坏的 Codex
  harness 就不会因为悄悄回退到 PI 而误通过。
- 认证：来自 shell / profile 的 `OPENAI_API_KEY`，以及可选复制的
  `~/.codex/auth.json` 和 `~/.codex/config.toml`

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

`Docker` 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

`Docker` 说明：

- `Docker` 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会读取挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 `Codex CLI`
  认证文件，将 `@openai/codex` 安装到一个可写的挂载 npm
  前缀中，暂存源码树，然后仅运行 Codex harness 实时测试。
- `Docker` 默认启用图像和 MCP / 工具探针。需要更窄范围的调试运行时，设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`。
- `Docker` 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与实时
  测试配置保持一致，这样 `openai-codex/*` 或 PI 回退就无法掩盖 Codex harness
  回归问题。

### 推荐的实时测试配方

范围窄且明确的 allowlist 速度最快，也最不容易波动：

- 单模型，直接模式（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 聚焦 Google（Gemini API 密钥 + Antigravity）：
  - Gemini（API 密钥）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API 密钥）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（类似 Cloud Code Assist 的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立认证 + 不同的工具行为问题）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥 / profile 认证）；这也是大多数用户理解中的 “Gemini”。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的认证方式，并且可能表现不同（流式传输 / 工具支持 / 版本偏差）。

## 实时测试：模型矩阵（我们覆盖什么）

这里没有固定的“CI 模型列表”（实时测试是按需启用的），但下面这些是建议在有密钥的开发机器上定期覆盖的**推荐**模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望持续保持可用的“常用模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、具备 `tools` 能力的模型）
- Cerebras：`cerebras/`…（如果你有权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：图像发送（附件 → 多模态消息）

至少在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含一个支持图像的模型（Claude / Gemini / OpenAI 支持视觉的变体等），以覆盖图像探针。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

如果你有凭证 / 配置，也可以将以下更多提供商纳入实时测试矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档里硬编码“所有模型”。权威列表始终是你机器上的 `discoverModels(...)` 返回值，加上当前可用的密钥。

## 凭证（切勿提交）

实时测试发现凭证的方式与 CLI 相同。实际含义是：

- 如果 CLI 可用，实时测试通常也应能找到相同的密钥。
- 如果实时测试提示 “no creds”，就像调试 `openclaw models list` / 模型选择一样去排查。

- 每个智能体的认证 profiles：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是实时测试里 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的实时测试 home 中，但它不是主 profile-key store）
- 本地实时运行默认会把当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home 中；暂存的实时测试 home 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖，这样探针就不会落到你真实主机的工作区。

如果你想依赖环境变量密钥（例如已在你的 `~/.profile` 中导出），请在本地测试前运行 `source ~/.profile`，或者使用下面的 `Docker` 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram 实时测试（音频转录）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan 实时测试

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体实时测试

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过每项能力
  - 在修改 comfy 工作流提交、轮询、下载或 plugin 注册后很有用

## 图像生成实时测试

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成 provider plugin
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的 provider 环境变量
  - 默认优先使用实时 / 环境变量 API 密钥，而不是已存储的认证 profiles，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置提供商：
  - `openai`
  - `google`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile store 认证，并忽略仅来自环境变量的覆盖

## 音乐生成实时测试

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享内置音乐生成 provider 路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载 provider 环境变量
  - 默认优先使用实时 / 环境变量 API 密钥，而不是已存储的认证 profiles，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时运行两种已声明的运行时模式：
    - `generate`：仅提示词输入
    - `edit`：当提供商声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy 实时测试文件，不在此共享扫查中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile store 认证，并忽略仅来自环境变量的覆盖

## 视频生成实时测试

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享内置视频生成 provider 路径
  - 默认使用对发布安全的冒烟路径：非 `FAL` 提供商、每个提供商一次文本转视频请求、一秒钟的龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认 `180000`）
  - 默认跳过 `FAL`，因为提供商侧排队延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）加载 provider 环境变量
  - 默认优先使用实时 / 环境变量 API 密钥，而不是已存储的认证 profiles，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，在可用时还会运行已声明的 transform 模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，且所选提供商 / 模型在共享扫查中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，且所选提供商 / 模型在共享扫查中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫查中已声明但被跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置的 `veo3` 仅支持文本，而内置的 `kling` 需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文本转视频，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` 实时覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph`
  - 当前在共享扫查中已声明但被跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享的 Gemini / Veo 通道使用本地、基于 buffer 的输入，而该路径在共享扫查中不被接受
    - `openai`，因为当前共享通道缺少针对组织的 video inpaint / remix 访问保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫查中包含每个提供商，包括 `FAL`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以降低每个提供商的操作上限，用于更激进的冒烟运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile store 认证，并忽略仅来自环境变量的覆盖

## 媒体实时测试 harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频实时测试套件
  - 自动从 `~/.profile` 加载缺失的 provider 环境变量
  - 默认自动将每个测试套件缩小到当前具有可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此心跳和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 `Docker` 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只在仓库 `Docker` 镜像中运行各自对应的 profile-key 实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，还会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- `Docker` 实时运行器默认使用较小的冒烟上限，以便完整 `Docker` 扫查仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确需要更大的穷尽式扫描时，可覆盖这些环境变量。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次实时 `Docker` 镜像，然后在两个实时 `Docker` 通道中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层的集成路径。

实时模型 `Docker` 运行器还会仅 bind-mount 必需的 CLI 认证 home（或者当运行未缩小时挂载所有受支持的认证 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就能刷新 token，而不会修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（带种子数据的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）

实时模型 `Docker` 运行器还会以只读方式 bind-mount 当前检出内容，并
将其暂存到容器内部的临时工作目录中。这样可以保持运行时
镜像精简，同时仍能让 `Vitest` 针对你精确的本地源码 / 配置运行。
暂存步骤会跳过大型本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__` 以及应用本地 `.build` 或
`Gradle` 输出目录，这样 `Docker` 实时运行就不会花上数分钟复制
机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，因此 Gateway 网关实时探针不会在
容器中启动真实的 `Telegram/Discord` 等渠道工作进程。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小范围或从该 `Docker` 通道中排除 Gateway 网关实时覆盖时，
也要一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层的兼容性冒烟测试：它会启动一个
启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
首次运行可能明显更慢，因为 `Docker` 可能需要拉取
Open WebUI 镜像，而且 Open WebUI 可能需要完成自己的冷启动 setup。
这个通道期望有一个可用的实时模型密钥，并且 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 `Docker` 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 被有意设计为确定性的，不需要真实的
`Telegram`、`Discord` 或 `iMessage` 账号。它会启动一个带种子数据的 Gateway 网关
容器，启动第二个容器来运行 `openclaw mcp serve`，然后
通过真实的 stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、
实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知。该通知检查会直接检查原始 stdio MCP 帧，
因此这个冒烟测试验证的是 bridge 实际发出了什么，而不仅仅是某个特定客户端 SDK 恰好暴露了什么。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归 / 调试工作流。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，使用临时配置 / 工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于缓存 `Docker` 内部的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小后的 provider 运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表手动覆盖，例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 在容器内筛选 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用现有的 `openclaw:local-live` 镜像，用于不需要重建的重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 确保凭证来自 profile store（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档修改后运行文档检查：`pnpm check:docs`。
当你还需要页内标题检查时，运行完整的 `Mintlify` anchor 校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在没有真实提供商的情况下验证“真实管线”的回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，并强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实的 Gateway 网关 + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线和配置效果（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍然缺少的内容：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的 skill（或避开无关 skill）？
- **合规性：** 智能体在使用前是否会读取 `SKILL.md`，并遵循要求的步骤 / 参数？
- **工作流契约：** 断言工具调用顺序、会话历史延续，以及沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用 mock providers 的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 skill 的场景（使用 vs 避免、门控、提示注入）。
- 只有在建立好 CI 安全套件之后，才添加可选的实时评估（按需启用、由环境变量门控）。

## 契约测试（plugin 和 channel 形状）

契约测试用于验证每个已注册的 plugin 和 channel 都符合其接口契约。它们会遍历所有已发现的 plugin，并运行一组形状和行为断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享接缝和冒烟文件；当你修改共享 channel 或 provider 表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅 channel 契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础 plugin 形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - plugin 注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择 / 选择逻辑
- **catalog** - 模型目录 API
- **discovery** - plugin 发现
- **loader** - plugin 加载
- **runtime** - provider 运行时
- **shape** - plugin 形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径之后
- 添加或修改 channel 或 provider plugin 之后
- 重构 plugin 注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复一个在实时测试中发现的 provider / model 问题时：

- 如果可能，添加一个 CI 安全的回归测试（mock / stub provider，或捕获精确的请求形状转换）
- 如果它天然只能在实时环境中复现（速率限制、认证策略），就让实时测试保持范围窄，并通过环境变量按需启用
- 优先瞄准能捕获该缺陷的最小层级：
  - provider 请求转换 / replay 缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具管线缺陷 → Gateway 网关实时冒烟测试或 CI 安全的 Gateway 网关 mock 测试
- `SecretRef` 遍历保护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 `SecretRef` 类派生一个采样目标，然后断言会拒绝遍历段 exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` `SecretRef` 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会有意在遇到未分类目标 id 时失败，这样新类别就无法被悄悄跳过。
