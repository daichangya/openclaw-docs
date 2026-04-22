---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-22T23:49:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d1392e0a46c5d142d65852e9d05179cce6bb1cd93df2fb372fdf13de6681a8a
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、live）以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意 _不_ 覆盖什么）
- 常见工作流应运行哪些命令（本地、推送前、调试）
- live 测试如何发现凭证并选择模型 / 提供商
- 如何为真实世界中的模型 / 提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期在推送前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接使用 Vitest 观察循环：`pnpm test:watch`
- 现在直接按文件定位也支持扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在处理单个失败问题时，优先先运行有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 测试通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想获得额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- Live 测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6`
  运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告的是 Moonshot / K2.6，并且助手转录存储了已标准化的 `usage.cost`。

提示：当你只需要一个失败用例时，优先通过下面描述的 allowlist 环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要更接近 qa-lab 真实环境的测试时，这些命令与主测试套件并列存在：

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会使用隔离的 Gateway 网关工作进程并行运行多个所选场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 回到旧的串行通道。
  - 任何场景失败时以非零状态退出。如果你想保留产物但不让退出码失败，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的 AIMock 支持的提供商服务器，用于实验性的夹具和协议 mock 覆盖，但不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一个一次性的 Multipass Linux VM 内运行同一套 QA 测试。
  - 保持与宿主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择参数。
  - live 运行会转发来宾系统可实际使用的受支持 QA 认证输入：
    基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便来宾可通过挂载的工作区写回。
  - 会在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要，以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，使用已配置的 OpenAI 启动 Gateway 网关，然后通过配置编辑启用 Telegram 和 Discord。
  - 验证第一次重启 Gateway 网关时，会按需为每个内置渠道插件安装运行时依赖；第二次重启不会重复安装已激活的依赖。
  - 还会安装一个已知较旧的 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 能修复内置渠道运行时依赖，而无需测试框架侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 宿主当前仅供仓库 / 开发使用。已打包的 OpenClaw 安装不会附带 `qa-lab`，因此也不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独安装插件。
  - 会预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后以真实 Matrix 插件作为 SUT 传输层启动一个 QA Gateway 网关子进程。
  - 默认使用固定的稳定 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如需测试其他镜像，可用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地预配一次性用户。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、observed-events 产物，以及合并后的 stdout / stderr 输出日志。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 用于共享的池化凭证。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任何场景失败时以非零状态退出。如果你想保留产物但不让退出码失败，请使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，并且 SUT bot 需要公开一个 Telegram 用户名。
  - 为了稳定地观察 bot 与 bot 之间的交互，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观察群组中的 bot 流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 产物。

Live 传输通道共享一个标准契约，以避免新传输方式发生漂移：

`qa-channel` 仍然是覆盖面广的合成 QA 测试套件，不属于 live
传输覆盖矩阵的一部分。

| 通道 | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| ---- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从基于 Convex 的池中获取独占租约，在该通道运行期间对租约发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`，用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI`，用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 默认环境变量：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池添加 / 移除 / 列表）必须明确使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

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
- `POST /admin/add`（仅限 maintainer 密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限 maintainer 密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限 maintainer 密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的负载结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat 数字 id 字符串。
- `admin/add` 会为 `kind: "telegram"` 验证该结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

向 Markdown QA 系统中添加一个渠道，必须且只需要两样东西：

1. 该渠道的传输适配器。
2. 一组用于验证渠道契约的场景包。

如果共享的 `qa-lab` 宿主可以负责这条流程，就不要新增顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动和清理
- 工作进程并发
- 产物写入
- 报告生成
- 场景执行
- 与旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载在共享的 `qa` 根命令之下
- 如何为该传输方式配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和标准化后的传输状态
- 如何执行基于传输的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入门槛是：

1. 保持由 `qa-lab` 负责共享的 `qa` 根命令。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道测试框架内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；延迟 CLI 和运行器执行应放在单独的入口点之后。
5. 在带主题的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意的迁移，否则保持现有兼容别名继续可用。

决策规则是严格的：

- 如果某个行为能在 `qa-lab` 中统一表达一次，就放到 `qa-lab` 中。
- 如果某个行为依赖于单一渠道传输方式，就把它保留在该运行器插件或插件测试框架中。
- 如果某个场景需要一个以上渠道都可使用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中添加渠道特定分支。
- 如果某个行为只对一种传输方式有意义，就让该场景保持传输特定性，并在场景契约中明确说明。

新场景推荐使用的通用辅助函数名称为：

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

新的渠道工作应使用通用辅助函数名称。
兼容别名的存在是为了避免一次性迁移，不应作为
新场景编写的范式。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实度逐步增加”（同时不稳定性 / 成本也增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：对现有按范围划分的 Vitest 项目运行十个顺序分片（`vitest.full-*.config.ts`）
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core / 单元测试清单，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
- 项目说明：
  - 无目标的 `pnpm test` 现在会运行 11 个更小的分片配置（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以在负载较高的机器上降低峰值 RSS，并避免 auto-reply / 扩展工作拖慢无关测试套件。
  - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片的 watch 循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会先将显式文件 / 目录目标路由到有范围的测试通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动成本。
  - 当变更的 git 路径只涉及可路由的源码 / 测试文件时，`pnpm test:changed` 会将其展开到相同的有范围测试通道；配置 / setup 修改仍会回退到更广泛的根项目重跑。
  - `pnpm check:changed` 是针对小范围工作的常规智能本地门禁。它会将 diff 分类为 core、core 测试、扩展、扩展测试、应用、文档、发布元数据和工具，并运行对应的 typecheck / lint / 测试通道。公开的插件 SDK 和插件契约变更会包含扩展验证，因为扩展依赖这些 core 契约。仅涉及发布元数据的版本变更会运行有针对性的版本 / 配置 / 根依赖检查，而不是完整测试套件，并带有一个保护机制，拒绝顶层版本字段之外的 package 变更。
  - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试会通过 `unit-fast` 通道运行，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件则继续保留在现有通道中。
  - 选定的 `plugin-sdk` 和 `commands` 辅助源码文件也会将 changed 模式运行映射到这些轻量通道中的显式同级测试，因此辅助函数修改无需为该目录重跑整个重型测试套件。
  - `auto-reply` 现在有三个专用分桶：顶层 core helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这样可以让最重的 reply 测试框架工作不影响便宜的状态 / 分块 / token 测试。
- 嵌入式运行器说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    保持两个层级的覆盖。
  - 为纯路由 / 标准化边界添加有针对性的辅助函数回归测试。
  - 还要保持嵌入式运行器集成测试套件健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件验证带作用域的 id 和压缩行为仍然会流经真实的
    `run.ts` / `compact.ts` 路径；仅有辅助函数测试
    不能充分替代这些集成路径。
- 池说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定设置了 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
  - 根 UI 通道保留其 `jsdom` setup 和优化器，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在默认还会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要与原生 V8 行为进行比较，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代说明：
  - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构通道。
  - pre-commit hook 会在暂存格式化 / lint 之后运行 `pnpm check:changed --staged`，因此仅 core 的提交不会承担扩展测试成本，除非它们触及面向扩展的公开契约。仅发布元数据的提交会保持在有针对性的版本 / 配置 / 根依赖通道上。
  - 当变更路径能够清晰映射到较小测试套件时，`pnpm test:changed` 会通过有范围的测试通道运行。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动扩缩现在有意更保守，并且在宿主机平均负载已经很高时也会回退，因此多个并发 Vitest 运行默认造成的影响更小。
  - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，因此当测试接线发生变化时，changed 模式重跑仍然正确。
  - 配置会在受支持的宿主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入明细输出。
  - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交 diff，将已路由的 `test:changed` 与原生根项目路径进行比较，并输出总耗时以及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会对当前脏工作树进行基准测试，通过 `scripts/test-projects.mjs` 和根 Vitest 配置来路由变更文件列表。
  - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和 transform 开销写入主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写入运行器 CPU + heap profile。

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 运行时默认值：
  - 使用 Vitest `threads` 且设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2，本地：默认 1）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制设置 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 接口、节点配对，以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`test/openshell-sandbox.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH 执行，测试 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥接验证远程规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可工作的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在 _今天_ 配合真实凭证是否真的能工作？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围的子集，而不是“全部”
- Live 运行会读取 `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并把配置 / 认证材料复制到一个临时测试 home 中，这样单元测试夹具就不会修改你的真实 `~/.openclaw`。
- 仅当你明确需要让 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静默 Gateway 网关启动日志 / Bonjour 噪声。如果你想重新看到完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（提供商特定）：设置 `*_API_KEYS` 为逗号 / 分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 设置每个 live 测试的覆盖值；测试会在收到速率限制响应时重试。
- 进度 / 心跳输出：
  - Live 测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获保持安静，较长时间的提供商调用也会明确显示仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此在 live 运行期间，提供商 / Gateway 网关进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型调用的心跳间隔。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测的心跳间隔。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：加跑 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前声明的**每一条命令**，并断言命令契约行为。
- 范围：
  - 带前置条件 / 手动 setup（该测试套件不会安装 / 运行 / 配对应用）。
  - 针对所选 Android 节点逐条验证 Gateway 网关 `node.invoke`。
- 必需的预先 setup：
  - Android 应用已连接并已与 Gateway 网关配对。
  - 应用保持在前台。
  - 对你期望通过的能力，已授予权限 / 捕获授权。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android setup 详情：[Android App](/zh-CN/platforms/android)

## Live：模型冒烟（profile keys）

Live 测试分为两层，以便我们隔离故障：

- “直接模型”告诉我们：给定密钥时，提供商 / 模型是否至少可以响应。
- “Gateway 网关冒烟”告诉我们：该模型的完整 gateway + 智能体链路是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 对每个模型运行一个小型补全（以及在需要时运行定向回归）
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，即 modern 的别名）才会真正运行该测试套件；否则它会跳过，以便让 `pnpm test:live` 聚焦在 Gateway 网关冒烟上
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行 modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔 allowlist）
  - modern / all 扫描默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可进行完整的 modern 扫描，或设置一个正数以使用更小的上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔 allowlist）
- 密钥来源：
  - 默认：profile 存储和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile 存储**
- 存在原因：
  - 将“提供商 API 坏了 / 密钥无效”与“gateway 智能体链路坏了”区分开来
  - 包含小型、隔离的回归测试（示例：OpenAI Responses / Codex Responses 的推理回放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟（也就是 “@openclaw” 实际在做什么）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建 / 修补一个 `agent:dev:*` 会话（每次运行覆盖模型）
  - 遍历有密钥的模型并断言：
    - 有“有意义”的响应（无工具）
    - 一次真实的工具调用可用（read 探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）仍然可用
- 探测细节（这样你可以快速解释故障）：
  - `read` 探测：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 它并回显该 nonce。
  - `exec+read` 探测：测试会要求智能体通过 `exec` 将 nonce 写入一个临时文件，然后再 `read` 回来。
  - 图像探测：测试会附加一个生成的 PNG（cat + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：modern allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来缩小范围
  - modern / all 的 gateway 扫描默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可进行完整的 modern 扫描，或设置一个正数以使用更小的上限。
- 如何选择提供商（避免 “OpenRouter 全都测”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔 allowlist）
- 工具 + 图像探测在此 live 测试中始终启用：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时，会运行图像探测
  - 流程（高层）：
    - 测试生成一个带有 “CAT” + 随机代码的小型 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析进 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体向模型转发一条多模态用户消息
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：如果你想查看你的机器上可以测试哪些内容（以及确切的 `provider/model` id），运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端冒烟（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体链路，而不触碰你的默认配置。
- 后端特定的冒烟默认值位于所属扩展的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商 / 模型：`claude-cli/claude-sonnet-4-6`
  - 命令 / 参数 / 图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 将图像文件路径作为 CLI 参数传入，而不是注入到提示词中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 禁用默认的 Claude Sonnet -> Opus 同会话连续性探测（当所选模型支持切换目标时，设置为 `1` 可强制启用）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-cli-backend
```

单提供商 Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像内，以非 root 的 `node` 用户运行 live CLI 后端冒烟测试。
- 它会从所属扩展解析 CLI 冒烟元数据，然后将对应的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到一个可缓存的可写前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（默认：`~/.cache/openclaw/docker-cli-tools`）中。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中证明直接 `claude -p` 可用，然后在不保留 Anthropic API 密钥环境变量的情况下运行两轮 Gateway 网关 CLI 后端测试。这个订阅通道默认禁用 Claude MCP / 工具和图像探测，因为 Claude 当前会将第三方应用使用路由到额外用量计费，而不是正常的订阅套餐限制。
- 现在，live CLI 后端冒烟测试会对 Claude、Codex 和 Gemini 走同样的端到端流程：文本轮次、图像分类轮次，然后是通过 gateway CLI 验证的 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补为 Opus，并验证恢复后的会话仍记得先前的备注。

## Live：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用 live ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 原地绑定一个合成的消息渠道会话
  - 在同一会话上发送一条普通后续消息
  - 验证该后续消息出现在已绑定 ACP 会话转录中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接 `pnpm test:live ...` 的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 说明：
  - 该通道使用 gateway `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而无需假装消息来自外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件的内建智能体注册表来选择 ACP 测试智能体。

示例：

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker 配方：

```bash
pnpm test:docker:live-acp-bind
```

单智能体 Docker 配方：

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-acp-bind-docker.sh`。
- 默认情况下，它会按顺序针对所有受支持的 live CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可以缩小矩阵范围。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，把 `acpx` 安装到一个可写 npm 前缀中，并在缺失时安装所请求的 live CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 acpx 能将来自已读取 profile 的提供商环境变量继续提供给子测试 CLI。

## Live：Codex app-server 测试框架冒烟

- 目标：通过正常的 gateway
  `agent` 方法验证由插件负责的 Codex 测试框架：
  - 加载内置的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `codex/gpt-5.4` 发送第一轮 gateway 智能体请求
  - 向同一个 OpenClaw 会话发送第二轮请求，并验证 app-server
    线程可以恢复
  - 通过同一条 gateway 命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经 Guardian 审核的提权 shell 探测：一个应被批准的
    良性命令，以及一个应被拒绝的伪秘密上传命令，
    从而让智能体回过头来询问
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`codex/gpt-5.4`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP / 工具探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex
  测试框架不会通过悄悄回退到 PI 的方式蒙混过关。
- 认证：来自 shell / profile 的 `OPENAI_API_KEY`，以及可选复制的
  `~/.codex/auth.json` 和 `~/.codex/config.toml`

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会读取挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到可写的已挂载 npm
  前缀中，暂存源码树，然后仅运行 Codex 测试框架 live 测试。
- Docker 默认启用图像、MCP / 工具以及 Guardian 探测。设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`，即可在需要更窄调试
  运行时关闭它们。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与 live
  测试配置保持一致，因此 `openai-codex/*` 或 PI 回退都无法掩盖 Codex 测试框架
  回归问题。

### 推荐的 live 配方

范围窄且显式的 allowlist 最快，也最不容易出错：

- 单模型，直接调用（无 gateway）：
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
- `google-antigravity/...` 使用 Antigravity OAuth 桥接（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API 密钥 / profile 认证）；这也是大多数用户说“Gemini”时指的内容。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的认证方式，行为也可能不同（流式传输 / 工具支持 / 版本偏差）。

## Live：模型矩阵（我们覆盖什么）

没有固定的“CI 模型列表”（live 是按需启用的），但对于在开发机上持有密钥的情况，以下是建议定期覆盖的模型。

### 现代冒烟集合（工具调用 + 图像）

这是我们预期应持续正常工作的“常用模型”运行集合：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 图像运行 Gateway 网关冒烟：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.4`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有则更好）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、具备 “tools” 能力的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：发送图像（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个具备图像能力的模型（Claude / Gemini / OpenAI 具备视觉能力的变体等），以覆盖图像探测。

### 聚合器 / 其他 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式进行测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找具备工具 + 图像能力的候选项）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

如果你有凭证 / 配置，也可以将更多提供商纳入 live 矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云端 / API），以及任何兼容 OpenAI / Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表是你机器上 `discoverModels(...)` 的返回结果，加上当前可用的密钥所共同决定的。

## 凭证（切勿提交）

Live 测试发现凭证的方式与 CLI 相同。实际含义是：

- 如果 CLI 能工作，live 测试也应该能找到相同的密钥。
- 如果某个 live 测试提示“没有凭证”，就用你调试 `openclaw models list` / 模型选择时相同的方法去调试。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的 live home 中，但它不是主 profile-key 存储）
- 本地 live 运行默认会将当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到一个临时测试 home 中；已暂存的 live home 会跳过 `workspace/` 和 `sandboxes/`，并剥离 `agents.*.workspace` / `agentDir` 路径覆盖，这样探测就不会落到你真实宿主机工作区中。

如果你想依赖环境变量密钥（例如在 `~/.profile` 中导出的密钥），请在本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram live（音频转写）

- 测试：`src/media-understanding/providers/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus 编码计划 live

- 测试：`src/agents/byteplus.live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体 live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 除非配置了 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 在修改 comfy 工作流提交、轮询、下载或插件注册之后非常有用

## 图像生成 live

- 测试：`src/image-generation/runtime.live.test.ts`
- 命令：`pnpm test:live src/image-generation/runtime.live.test.ts`
- 测试框架：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前先从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过时的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置提供商：
  - `openai`
  - `google`
  - `xai`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量提供的覆盖值

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前先从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过时的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 在可用时运行两种声明的运行时模式：
    - `generate`：仅提示词输入
    - `edit`：当提供商声明 `capabilities.edit.enabled` 时
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy live 文件，不在这个共享扫描中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量提供的覆盖值

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- 测试框架：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认走对发布安全的冒烟路径：非 FAL 提供商、每个提供商一次文本到视频请求、1 秒龙虾提示词，以及通过 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 控制的每个提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用 live / 环境变量 API 密钥，而不是已存储的认证 profile，因此 `auth-profiles.json` 中过时的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证 / profile / 模型的提供商
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 还会在可用时运行已声明的转换模式：
    - `imageToVideo`：当提供商声明 `capabilities.imageToVideo.enabled`，并且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地图像输入时
    - `videoToVideo`：当提供商声明 `capabilities.videoToVideo.enabled`，并且所选提供商 / 模型在共享扫描中接受基于 buffer 的本地视频输入时
  - 当前在共享扫描中已声明但跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` 文本到视频，以及默认使用远程图像 URL 夹具的 `kling` 通道
  - 当前 `videoToVideo` live 覆盖：
    - 仅 `runway`，前提是所选模型为 `runway/gen4_aleph`
  - 当前在共享扫描中已声明但跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini / Veo 通道使用的是本地基于 buffer 的输入，而共享扫描不接受该路径
    - `openai`，因为当前共享通道缺少对组织特定视频修补 / 混剪访问权限的保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 以在默认扫描中包含每个提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 以降低每个提供商操作上限，用于激进的冒烟运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile 存储认证，并忽略仅环境变量提供的覆盖值

## 媒体 live 测试框架

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频 live 测试套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个测试套件缩小到当前具有可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此心跳和静默模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像中运行各自对应的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟上限，以便完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确想要更大的完整扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools` 和 `test:docker:plugins` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还会仅 bind-mount 所需的 CLI 认证 home（如果运行未缩小范围，则挂载所有受支持的认证 home），然后在运行前将其复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token，而不会修改宿主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server 测试框架冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- MCP 渠道桥接（带种子的 Gateway 网关 + stdio 桥接 + 原始 Claude 通知帧冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow / deny 冒烟）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude 内置包重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像；在完成一次全新的本地构建后，可通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主机重建；或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向一个现有 tarball。
- 在迭代时，可通过禁用无关场景来缩小内置插件运行时依赖测试范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

live 模型 Docker 运行器还会以只读方式 bind-mount 当前检出，并在容器内将其暂存到临时工作目录中。这样既能保持运行时镜像精简，又仍能针对你本地精确的源码 / 配置运行 Vitest。
暂存步骤会跳过大型仅本地缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花上数分钟复制
机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 gateway live 探测就不会在容器内启动
真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小范围或排除 gateway
live 覆盖时，也请一并透传
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个
启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动 setup。
该通道需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是有意保持确定性的，不需要
真实的 Telegram、Discord 或 iMessage 账号。它会启动一个带种子的 Gateway 网关
容器，启动第二个容器来运行 `openclaw mcp serve`，然后
验证经路由的会话发现、转录读取、附件元数据、
live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知，这些都通过真实的 stdio MCP 桥接完成。通知检查
会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是
桥接实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 具有确定性，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，
通过嵌入式 Pi 内置 MCP 运行时实例化该服务器，
执行工具，然后验证 `coding` 和 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归 / 调试工作流。后续可能仍需要它来验证 ACP 线程路由，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，此时会使用临时配置 / 工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于在 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用已有的 `openclaw:local-live` 镜像，以便在无需重建的重跑中使用
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在不依赖真实提供商的情况下进行的“真实链路”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 gateway + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（见 [Skills](/zh-CN/tools/skills)），目前仍缺少：

- **决策能力：** 当提示词中列出了 Skills 时，智能体是否会选择正确的 Skills（或避免无关的 Skills）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循所需步骤 / 参数？
- **工作流契约：** 用于断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 skill 的场景（使用 vs 避免、门禁、提示词注入）。
- 只有在 CI 安全测试套件到位之后，才添加可选的 live 评估（按需启用、由环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其
接口契约。它们会遍历所有已发现的插件，并运行一组
形状和行为断言。默认的 `pnpm test` 单元测试通道会有意
跳过这些共享接缝和冒烟文件；当你修改共享渠道或提供商接口时，
请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基础插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择 / 选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 在修改插件 SDK 导出或子路径之后
- 在添加或修改渠道或提供商插件之后
- 在重构插件注册或发现之后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复在 live 中发现的提供商 / 模型问题时：

- 如果可能，添加一个 CI 安全的回归测试（mock / stub 提供商，或捕获精确的请求形状转换）
- 如果它天然只能在 live 中复现（速率限制、认证策略），就让 live 测试保持范围窄，并通过环境变量按需启用
- 优先针对能捕获该缺陷的最小层级：
  - 提供商请求转换 / 回放缺陷 → 直接模型测试
  - gateway 会话 / 历史 / 工具链路缺陷 → gateway live 冒烟测试或 CI 安全的 gateway mock 测试
- `SecretRef` 遍历保护规则：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 `SecretRef` 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` `SecretRef` 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类的目标 id 时故意失败，这样新的类别就无法被悄悄跳过。
