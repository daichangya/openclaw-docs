---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商 bug 添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-23T07:42:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a92e9d1cd0ff64aabfbc28b42045aa6c63159375ff41695805488b40280e1b43
    source_path: help/testing.md
    workflow: 15
---

# 测试

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）以及一小组 Docker 运行器。

本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它明确 _不_ 覆盖什么）
- 常见工作流（本地、推送前、调试）应运行哪些命令
- live 测试如何发现凭证，以及如何选择模型/提供商
- 如何为真实世界中的模型/提供商问题添加回归测试

## 快速开始

大多数时候：

- 完整门禁（预期在 push 前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置较高的机器上更快地运行本地全套测试：`pnpm test:max`
- 直接进入 Vitest watch 循环：`pnpm test:watch`
- 直接按文件定位现在也会路由 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你正在迭代处理单个失败时，优先先跑有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或想获得额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商/模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的
    `OpenClaw Release Checks` 都会调用可复用的 live/E2E workflow，并设置
    `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型
    matrix 作业。
  - 将新的高信号提供商 secrets 添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    scheduled/release 调用方中。
- Moonshot/Kimi 成本冒烟测试：在设置了 `MOONSHOT_API_KEY` 的情况下，运行
  `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6`
  运行隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告的是 Moonshot/K2.6，并且 assistant transcript 存储了标准化后的
  `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来收窄 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实性时，这些命令与主测试套件配套使用：

CI 会在专用 workflow 中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，
也可通过手动分发使用 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main` 上
每晚运行，也可手动分发，包含 mock parity gate、live Matrix 通道，以及由
Convex 管理的 live Telegram 通道，作为并行作业运行。`OpenClaw Release Checks`
会在发布审批前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认会并行运行多个选定场景，并使用隔离的 Gateway 网关 worker。
    `qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>`
    调整 worker 数量，或使用 `--concurrency 1` 切换为旧的串行通道。
  - 当任一场景失败时，以非零状态退出。若你想保留产物而不让退出码失败，可使用
    `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个基于本地 AIMock 的提供商服务器，用于实验性的 fixture
    和协议 mock 覆盖，而不是替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 内运行同一套 QA 测试。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - live 运行会转发来宾环境中可行的受支持 QA 认证输入：
    基于环境变量的提供商 keys、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样来宾才能通过挂载的工作区回写内容。
  - 将常规 QA 报告 + 摘要以及 Multipass 日志写入
    `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏运维风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建 npm tarball，在 Docker 中全局安装，运行非交互式
    OpenAI API-key 新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，
    运行 doctor，并针对一个 mocked OpenAI endpoint 运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可用 Discord 运行相同的
    打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建产物，使用已配置的 OpenAI 启动
    Gateway 网关，然后通过配置编辑启用内置 channel/plugin。
  - 验证设置发现阶段会让未配置插件的运行时依赖保持缺失状态，首次配置好的
    Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，
    而第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知的旧 npm 基线，在运行 `openclaw update --tag <candidate>`
    前启用 Telegram，并验证候选版本的更新后 doctor 会修复内置 channel
    运行时依赖，而不依赖测试框架侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 主机目前仅用于 repo/dev。打包后的 OpenClaw 安装包不包含
    `qa-lab`，因此也不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；无需单独安装插件步骤。
  - 配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，
    然后启动一个 QA gateway 子进程，并将真实 Matrix 插件作为 SUT 传输层。
  - 默认使用固定稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。
    当你需要测试不同镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证源标志，因为该通道会在本地配置一次性用户。
  - 将 Matrix QA 报告、摘要、observed-events 产物，以及合并后的 stdout/stderr
    输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot token，针对真实私有群组运行
    Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
    和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必须是数字格式的 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用 env 模式，
    或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 当任一场景失败时，以非零状态退出。若你想保留产物而不让退出码失败，可使用
    `--allow-failures`。
  - 需要两个不同的 bot 位于同一个私有群组中，并且 SUT bot 需要暴露 Telegram 用户名。
  - 为了稳定地观察 bot 到 bot 通信，请在 `@BotFather` 中为两个 bot 都启用
    Bot-to-Bot Communication Mode，并确保 driver bot 能观察到群组中的 bot 流量。
  - 将 Telegram QA 报告、摘要和 observed-messages 产物写入
    `.artifacts/qa-e2e/...`。

live 传输通道共享一份标准契约，以避免新增传输方式时发生漂移：

`qa-channel` 仍然是广义的合成 QA 测试套件，不属于 live
传输覆盖 matrix 的一部分。

| 通道     | Canary | 提及门控 | Allowlist block | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | Reaction 观察 | 帮助命令 |
| -------- | ------ | -------- | --------------- | -------- | -------- | ------------ | -------- | ------------- | -------- |
| Matrix   | x      | x        | x               | x        | x        | x            | x        | x             |          |
| Telegram | x      |          |                 |          |          |              |          |               | x        |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，
QA lab 会从基于 Convex 的池中获取独占租约，在该通道运行期间对租约进行 heartbeat，
并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个 secret：
  - `maintainer` 对应 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 对应 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

在正常运行中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池的添加/移除/列出）必须明确使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

为维护者提供的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中，如需机器可读输出，请使用 `--json`。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅限 maintainer secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限 maintainer secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限 maintainer secret）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字格式的 Telegram chat id 字符串。
- 对于 `kind: "telegram"`，`admin/add` 会验证该结构，并拒绝格式错误的 payload。

### 向 QA 添加一个 channel

向 markdown QA 系统添加一个 channel，严格来说只需要两样东西：

1. 该 channel 的传输适配器。
2. 一个用于验证该 channel 契约的场景包。

当共享的 `qa-lab` 主机可以承载整个流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动与清理
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享的 `qa` 根命令下
- 如何为该传输方式配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和标准化后的传输状态
- 如何执行基于传输的操作
- 如何处理传输特定的重置或清理

新 channel 的最低接入门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根命令的拥有者。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或 channel harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；延迟 CLI 和运行器执行应放在独立入口点之后。
5. 在主题化的 `qa/scenarios/` 目录下编写或改造 markdown 场景。
6. 为新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名可用。

决策规则是严格的：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放在 `qa-lab` 中。
- 如果某个行为依赖单一 channel 传输方式，就将其保留在该运行器插件或插件 harness 中。
- 如果某个场景需要超过一个 channel 都能使用的新能力，就添加通用 helper，而不是在 `suite.ts` 中添加 channel 特定分支。
- 如果某个行为只对单一传输方式有意义，就让该场景保持传输特定性，并在场景契约中明确说明。

新场景推荐使用的通用 helper 名称是：

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

新的 channel 工作应使用通用 helper 名称。
兼容别名的存在是为了避免一次性迁移，不应作为
新场景编写的范式。

## 测试套件（哪些测试在哪里运行）

可以把这些测试套件理解为“真实性逐步提高”（以及不稳定性/成本也逐步提高）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：在现有按范围划分的 Vitest projects 上执行十个顺序分片运行（`vitest.full-*.config.ts`）
- 文件：`vitest.unit.config.ts` 覆盖的 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core/unit 清单，以及白名单中的 `ui` node 测试
- 范围：
  - 纯 unit 测试
  - 进程内 integration 测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实 keys
  - 应该快速且稳定
- Projects 说明：
  - 不带目标的 `pnpm test` 现在会运行十一个更小的分片配置（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是单个庞大的原生 root-project 进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖慢无关测试套件。
  - `pnpm test --watch` 仍然使用原生根级 `vitest.config.ts` project graph，因为多分片 watch 循环并不现实。
  - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会优先将显式文件/目录目标路由到按范围划分的通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 无需承担完整 root project 启动成本。
  - `pnpm test:changed` 会在 diff 仅触及可路由的源码/测试文件时，将变更的 git 路径扩展到同样的按范围通道；配置/设置类改动仍会回退到更广泛的 root-project 重跑。
  - `pnpm check:changed` 是面向窄范围工作的常规智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行匹配的 typecheck/lint/test 通道。公开的 插件 SDK 和插件契约变更会包含 extension 验证，因为 extensions 依赖这些 core 契约。仅包含发布元数据的版本变更会运行有针对性的 version/config/root-dependency 检查，而不是完整测试套件，并带有一项保护措施：若改动超出顶层版本字段，则会被拒绝。
  - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 及类似纯工具区域的轻导入 unit 测试会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件则仍保留在现有通道中。
  - 选定的 `plugin-sdk` 和 `commands` helper 源文件还会在 changed 模式运行时映射到这些轻量通道中的显式同级测试，因此 helper 改动无需为该目录重跑完整的重型测试套件。
  - `auto-reply` 现在有三个专用分桶：顶层 core helpers、顶层 `reply.*` integration 测试，以及 `src/auto-reply/reply/**` 子树。这让最重的 reply harness 工作不再拖累轻量的 status/chunk/token 测试。
- Embedded runner 说明：
  - 当你修改消息工具发现输入或压缩运行时上下文时，
    请同时保留两个层级的覆盖。
  - 为纯路由/标准化边界添加聚焦的 helper 回归测试。
  - 同时也要保证 embedded runner integration 测试套件保持健康：
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - 这些测试套件验证带作用域的 id 和压缩行为仍会流经真实的 `run.ts` / `compact.ts` 路径；仅有 helper 测试并不能充分替代这些 integration 路径。
- Pool 说明：
  - 基础 Vitest 配置现在默认使用 `threads`。
  - 共享 Vitest 配置还固定了 `isolate: false`，并在 root projects、e2e 和 live 配置中使用非隔离运行器。
  - 根级 UI 通道保留其 `jsdom` 设置和优化器，但现在也运行在共享的非隔离运行器上。
  - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
  - 共享的 `scripts/run-vitest.mjs` 启动器现在默认还会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。如果你需要对比原生 V8 行为，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
- 快速本地迭代说明：
  - `pnpm changed:lanes` 会显示某个 diff 触发了哪些架构通道。
  - pre-commit hook 会在已暂存内容完成格式化/lint 后运行 `pnpm check:changed --staged`，因此仅 core 的提交不会承担 extension 测试成本，除非它们触及面向 extension 的公共契约。仅发布元数据提交会保留在有针对性的 version/config/root-dependency 通道中。
  - 如果完全相同的 staged 变更集已经通过了同等或更强的门禁验证，可使用 `scripts/committer --fast "<message>" <files...>` 只跳过 changed-scope hook 的重复运行。staged format/lint 仍会运行。请在交接中说明已完成的门禁。这同样适用于隔离的 flaky hook 失败在重跑后通过并有范围化证明的情况。
  - 当变更路径能够清晰映射到较小测试套件时，`pnpm test:changed` 会通过按范围通道进行路由。
  - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
  - 本地 worker 自动缩放现在刻意更保守；当主机 load average 已经较高时也会回退，因此默认情况下多个并发 Vitest 运行对系统的影响更小。
  - 基础 Vitest 配置将 projects/config 文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式重跑仍保持正确。
  - 在受支持的主机上，该配置会保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
- 性能调试说明：
  - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆解输出。
  - `pnpm test:perf:imports:changed` 会将同样的性能分析视图限定在自 `origin/main` 以来发生变更的文件上。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将路由后的 `test:changed` 与该提交 diff 的原生 root-project 路径进行比较，并打印 wall time 以及 macOS 最大 RSS。
- `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前脏工作树中的变更文件列表进行路由，并据此做基准测试。
  - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和 transform 开销写出主线程 CPU profile。
  - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 测试套件写出 runner CPU+heap profile。

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制为单 worker
- 范围：
  - 启动一个默认启用诊断的真实 local loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway 消息、memory 和大负载 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helper
  - 断言 recorder 保持有界、合成 RSS 样本低于压力预算，并且每个会话的队列深度都能回落到零
- 预期：
  - 对 CI 安全且无需 keys
  - 这是用于稳定性回归跟进的窄通道，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及位于 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 接口、节点配对以及更重的网络交互
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实 keys
  - 比 unit 测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 执行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范化文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛 e2e 测试套件时启用此测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认的 CLI 二进制文件或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在 _今天_ 搭配真实凭证时是否真的可用？”
  - 捕捉提供商格式变化、工具调用怪癖、认证问题以及限流行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 占用限流额度
  - 优先运行收窄后的子集，而不是“全部都跑”
- live 运行会读取 `~/.profile`，以补齐缺失的 API keys。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，这样 unit fixtures 就不会修改你真实的 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：保留 `[live] ...` 进度输出，但会隐藏额外的 `~/.profile` 提示，并静默 gateway 启动日志/Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（提供商特定）：设置逗号/分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 为 live 测试单独覆盖；测试会在收到限流响应时重试。
- 进度/heartbeat 输出：
  - live 测试套件现在会将进度行输出到 stderr，这样即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能明显显示仍在执行。
  - `vitest.live.config.ts` 会禁用 Vitest 的控制台拦截，因此提供商/gateway 进度行会在 live 运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/probe heartbeat。

## 我应该运行哪个测试套件？

使用下面这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动较多，再加上 `pnpm test:coverage`）
- 修改 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了”/ 提供商特定失败 / 工具调用：运行收窄后的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用一个已连接 Android 节点当前**宣告的每个命令**，并断言命令契约行为。
- 范围：
  - 预先准备/手动设置（该测试套件不会安装/运行/配对 app）。
  - 针对所选 Android 节点逐命令验证 gateway `node.invoke`。
- 必需的预设准备：
  - Android app 已连接并与 gateway 完成配对。
  - app 保持前台运行。
  - 对你期望通过的能力授予了权限/捕获同意。
- 可选目标覆盖：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## Live：模型冒烟（profile keys）

live 测试分成两层，以便我们隔离故障：

- “Direct model” 告诉我们，提供商/模型在给定 key 下是否至少能正常响应。
- “Gateway smoke” 告诉我们，针对该模型的完整 gateway + 智能体链路是否正常工作（会话、历史、工具、沙箱策略等）。

### 第 1 层：Direct model completion（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举发现到的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一个小型 completion（并在需要时运行有针对性的回归测试）
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，它是 modern 的别名）后才会真正运行该测试套件；否则它会跳过，以让 `pnpm test:live` 聚焦于 gateway smoke
- 模型选择方式：
  - `OPENCLAW_LIVE_MODELS=modern`：运行现代 allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
  - modern/all 扫描默认有一个精心挑选的高信号数量上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可进行穷尽式 modern 扫描，或设置正数以使用更小的上限。
- 提供商选择方式：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- keys 来源：
  - 默认：profile store 和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制 **仅** 使用 profile store
- 这个测试存在的原因：
  - 将“提供商 API 坏了 / key 无效”和“gateway 智能体链路坏了”区分开
  - 承载小而隔离的回归测试（示例：OpenAI Responses/Codex Responses 的推理重放 + 工具调用流程）

### 第 2 层：Gateway + dev 智能体冒烟（也就是 “@openclaw” 实际做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 gateway
  - 创建/修补一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 遍历带 keys 的模型并断言：
    - “有意义的”响应（不使用工具）
    - 一个真实的工具调用可用（read probe）
    - 可选的额外工具探测（exec+read probe）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）保持可用
- Probe 细节（这样你可以快速解释失败原因）：
  - `read` probe：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 该文件并回显 nonce。
  - `exec+read` probe：测试会要求智能体用 `exec` 将 nonce 写入一个临时文件，然后再用 `read` 读回来。
  - image probe：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 模型选择方式：
  - 默认：现代 allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）以收窄范围
  - modern/all gateway 扫描默认有一个精心挑选的高信号数量上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可进行穷尽式 modern 扫描，或设置正数以使用更小的上限。
- 提供商选择方式（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 工具 + 图像 probes 在这个 live 测试中始终启用：
  - `read` probe + `exec+read` probe（工具压力测试）
  - 当模型宣告支持图像输入时，会运行 image probe
  - 流程（高层概览）：
    - 测试生成一个带有 “CAT” + 随机代码 的小 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` 的 `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关将附件解析到 `images[]` 中（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded 智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：如果你想查看你的机器上可以测试什么（以及精确的 `provider/model` id），运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端冒烟（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：使用本地 CLI 后端验证 Gateway 网关 + 智能体链路，同时不触碰你的默认配置。
- 后端特定的冒烟默认值位于所属 extension 的 `cli-backend.ts` 定义中。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认 provider/model：`claude-cli/claude-sonnet-4-6`
  - command/args/image 行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`：发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`：将图像文件路径作为 CLI 参数传递，而不是通过提示词注入。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）：当设置了 `IMAGE_ARG` 时，控制图像参数的传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`：发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`：禁用默认的 Claude Sonnet -> Opus 同会话连续性 probe（当所选模型支持切换目标时，设置为 `1` 可强制启用）。

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
- 它会在仓库 Docker 镜像中，以非 root 的 `node` 用户身份运行 live CLI 后端冒烟测试。
- 它会从所属 extension 中解析 CLI 冒烟元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到可缓存、可写的前缀目录 `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType`，或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中直接验证 `claude -p`，然后在不保留 Anthropic API-key 环境变量的情况下运行两轮 Gateway 网关 CLI 后端交互。由于 Claude 当前会将第三方 app 使用量路由到额外用量计费，而不是普通订阅套餐额度，因此这个订阅通道默认禁用了 Claude MCP/tool 和 image probes。
- live CLI 后端冒烟测试现在会对 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 gateway CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 切换到 Opus，并验证恢复后的会话仍然记得之前的笔记。

## Live：ACP 绑定冒烟（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用一个 live ACP 智能体验证真实的 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的 message-channel 会话
  - 在同一个会话上发送一次普通后续消息
  - 验证该后续消息会落入已绑定的 ACP 会话 transcript 中
- 启用方式：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接执行 `pnpm test:live ...` 时的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- 说明：
  - 这个通道使用 gateway 的 `chat.send` 接口，并带有仅限管理员使用的合成 originating-route 字段，因此测试可以附加 message-channel 上下文，而无需假装执行外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会使用内置 `acpx` 插件的内建智能体注册表来选择所需的 ACP harness 智能体。

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
- 默认情况下，它会按顺序对所有受支持的 live CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可收窄 matrix。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，在可写的 npm 前缀中安装 `acpx`，然后在缺失时安装所请求的 live CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 acpx 就能让来自已读取 profile 的提供商环境变量继续对其子 harness CLI 可见。

## Live：Codex app-server harness 冒烟测试

- 目标：通过常规 gateway
  `agent` 方法验证由插件拥有的 Codex harness：
  - 加载内置的 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `codex/gpt-5.4` 发送第一轮 gateway 智能体请求
  - 向同一个 OpenClaw 会话发送第二轮请求，并验证 app-server
    线程可以恢复
  - 通过同一条 gateway 命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选地运行两个经过 Guardian 审查的提权 shell probe：一个应被批准的无害命令，
    以及一个应被拒绝的伪造 secret 上传命令，从而让智能体反问确认
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`codex/gpt-5.4`
- 可选图像 probe：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/tool probe：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian probe：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex
  harness 不能通过悄悄回退到 Pi 而蒙混过关。
- 认证：来自 shell/profile 的 `OPENAI_API_KEY`，以及可选复制的
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
  认证文件，将 `@openai/codex` 安装到可写的挂载 npm 前缀中，暂存源代码树，然后只运行 Codex-harness live 测试。
- Docker 默认启用 image、MCP/tool 和 Guardian probes。需要更窄的调试运行时，可设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与 live
  测试配置保持一致，因此 `openai-codex/*` 或 Pi 回退都无法掩盖 Codex harness
  回归问题。

### 推荐的 live 配方

范围窄且明确的 allowlist 最快，也最不容易波动：

- 单模型，direct（无 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，gateway 冒烟：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重点场景（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体 endpoint）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（独立的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这通常就是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制文件；它有自己的认证方式，并且行为可能不同（流式传输/工具支持/版本偏差）。

## Live：模型矩阵（我们覆盖什么）

没有固定的“CI 模型列表”（live 是按需启用的），但以下是**推荐**在拥有 keys 的开发机器上定期覆盖的模型。

### 现代冒烟集（工具调用 + 图像）

这是我们期望始终保持可用的“常用模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.4`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex：`openai-codex/gpt-5.4`
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 gateway 冒烟测试：
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
- Mistral：`mistral/`…（选择一个你已启用的支持工具调用的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：发送图像（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 的支持视觉的变体等），以覆盖 image probe。

### 聚合器 / 替代 Gateway 网关

如果你已启用相关 keys，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选模型）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

如果你有 creds/config，还可以把以下更多提供商加入 live matrix：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义 endpoints）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表始终是你的机器上 `discoverModels(...)` 返回的内容，以及当前可用的 keys。

## 凭证（切勿提交）

live 测试发现凭证的方式与 CLI 相同。实际含义如下：

- 如果 CLI 可用，live 测试通常也应找到相同的 keys。
- 如果 live 测试提示“没有凭证”，就按照你调试 `openclaw models list` / 模型选择时的方式去排查。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（如果存在，会复制到 staged live home 中，但它不是主 profile-key store）
- 默认情况下，live 本地运行会将当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到一个临时测试 home 中；staged live homes 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖，这样 probes 就不会落到你真实主机的工作区中。

如果你想依赖环境变量 keys（例如在 `~/.profile` 中导出的那些），请在本地测试前运行 `source ~/.profile`，或者使用下面的 Docker 运行器（它们可以把 `~/.profile` 挂载进容器）。

## Deepgram live（音频转写）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 的图像、视频和 `music_generate` 路径
  - 若未配置 `models.providers.comfy.<capability>`，则会跳过对应能力
  - 在修改 comfy workflow 提交、轮询、下载或插件注册后很有用

## 图像生成 live

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前，从你的登录 shell（`~/.profile`）加载缺失的提供商环境变量
  - 默认优先使用 live/env API keys，而不是已存储的 auth profiles，因此 `auth-profiles.json` 中陈旧的测试 keys 不会掩盖真实的 shell 凭证
  - 跳过没有可用认证/profile/model 的提供商
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置提供商：
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- 可选收窄方式：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：强制使用 profile-store 认证并忽略仅环境变量的覆盖

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前，从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用 live/env API keys，而不是已存储的 auth profiles，因此 `auth-profiles.json` 中陈旧的测试 keys 不会掩盖真实的 shell 凭证
  - 跳过没有可用认证/profile/model 的提供商
  - 在可用时运行两个已声明的运行时模式：
    - 使用纯 prompt 输入的 `generate`
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：使用单独的 Comfy live 文件，不在这个共享扫描中
- 可选收窄方式：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：强制使用 profile-store 认证并忽略仅环境变量的覆盖

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成提供商路径
  - 默认使用对发布安全的冒烟路径：非 FAL 提供商、每个提供商一个 text-to-video 请求、一个一秒钟的龙虾 prompt，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前，从你的登录 shell（`~/.profile`）加载提供商环境变量
  - 默认优先使用 live/env API keys，而不是已存储的 auth profiles，因此 `auth-profiles.json` 中陈旧的测试 keys 不会掩盖真实的 shell 凭证
  - 跳过没有可用认证/profile/model 的提供商
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，可在可用时额外运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled` 且所选提供商/模型在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled` 且所选提供商/模型在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但被跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置的 `veo3` 仅支持文本，而内置的 `kling` 需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` text-to-video，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` live 覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫描中已声明但被跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径目前要求远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini/Veo 通道使用的是本地 buffer 支持输入，而该路径在共享扫描中不被接受
    - `openai`，因为当前共享通道缺少针对特定组织的视频 inpaint/remix 访问保证
- 可选收窄方式：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`：在默认扫描中包含所有提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`：将每个提供商的操作上限降低，用于激进的冒烟运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：强制使用 profile-store 认证并忽略仅环境变量的覆盖

## 媒体 live harness

- 命令：`pnpm test:live:media`
- 用途：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频 live 测试套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个测试套件收窄到当前具备可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此 heartbeat 和安静模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live-model 运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像内运行与之匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果挂载了 `~/.profile`，还会先读取它）。相应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用较小的冒烟上限，以便完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确想要更大范围的穷尽式扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在执行已构建 app 的 E2E 容器冒烟运行器中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live-model Docker 运行器还会只 bind-mount 所需的 CLI 认证 home（如果运行未收窄，则挂载所有受支持的目录），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就能刷新 token，而不会修改主机上的认证存储：

- Direct models：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/channel/智能体冒烟：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证启用插件时会按需安装其运行时依赖，运行 doctor，并执行一次 mocked OpenAI 智能体轮次。可通过 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换 channel。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个 mocked OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升为 `low`，然后强制让提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已播种的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + embedded Pi profile allow/deny 冒烟）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + stdio MCP 子进程，在隔离的 cron 和一次性 subagent 运行后完成回收）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude-bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更冒烟：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据冒烟：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 在完成一次新的本地构建后跳过主机构建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。
- 在迭代时，可通过禁用无关场景来收窄内置插件运行时依赖测试，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置 suite 特定镜像覆盖（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）时，它们仍然具有更高优先级。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未存在于本地，脚本会先拉取它。QR 和安装器 Docker 测试保留各自独立的 Dockerfile，因为它们验证的是包/安装行为，而不是共享的 built-app 运行时。

live-model Docker 运行器还会以只读方式 bind-mount 当前 checkout，
并将其暂存到容器内的临时 workdir 中。这样可以保持运行时
镜像精简，同时仍能针对你本地精确的源代码/配置运行 Vitest。
暂存步骤会跳过大型仅本地缓存和 app 构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及 app 本地的 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花费数分钟复制
机器特定的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，以便 gateway live probes 不会在
容器内启动真实的 Telegram/Discord 等 channel workers。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要
收窄或排除该 Docker 通道中的 gateway
live 覆盖时，也请一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个
启用了 OpenAI 兼容 HTTP endpoints 的 OpenClaw gateway 容器，
再针对该 gateway 启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 完成登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一次真实的
聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而 Open WebUI 也可能需要完成它自己的冷启动设置。
这个通道需要一个可用的 live 模型 key，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功的运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要真实的
Telegram、Discord 或 iMessage 账号。它会启动一个已播种的 Gateway
容器，再启动第二个容器来运行 `openclaw mcp serve`，然后
验证路由后的会话发现、transcript 读取、附件元数据、
实时事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 传输的 Claude 风格 channel +
权限通知。通知检查会直接检查原始 stdio MCP frames，
因此这个冒烟测试验证的是 bridge 实际发出的内容，
而不仅仅是某个特定 client SDK 恰好暴露出的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型 key。它会构建仓库 Docker 镜像，在容器中启动一个真实的 stdio MCP probe 服务器，
通过 embedded Pi bundle
MCP 运行时将该服务器实例化，执行工具，然后验证 `coding` 和 `messaging` 会保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
key。它会启动一个带有真实 stdio MCP probe 服务器的已播种 Gateway，运行一次
隔离的 cron 轮次和一次 `/subagents spawn` 的一次性子智能体轮次，然后验证
每次运行后 MCP 子进程都会退出。

手动 ACP 自然语言线程冒烟测试（不在 CI 中运行）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 为回归/调试工作流保留此脚本。后续可能还会再次需要它来验证 ACP 线程路由，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`：仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，使用临时配置/工作区目录，且不挂载外部 CLI 认证目录
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的必需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`：收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`：在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1`：复用现有的 `openclaw:local-live` 镜像，用于那些不需要重新构建的重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：确保凭证来自 profile store（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...`：为 Open WebUI 冒烟测试选择 gateway 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...`：覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...`：覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要进行页内标题检查时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是在不依赖真实提供商的情况下进行的“真实链路”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全、行为类似“智能体可靠性评估”的测试：

- 通过真实 gateway + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），当前仍然缺少的部分：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的 skill（或避开无关的 skill）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循必需的步骤/参数？
- **工作流契约：** 用于断言工具顺序、会话历史继承和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取以及会话接线。
- 一小组面向 skill 的场景（使用 vs 避免、门控、提示注入）。
- 只有在对 CI 安全的测试套件到位之后，才考虑可选的 live 评估（按需启用、由环境变量控制）。

## 契约测试（plugin 和 channel 形状）

契约测试用于验证每个已注册的 plugin 和 channel 都符合其
接口契约。它们会遍历所有发现到的插件，并运行一组形状与行为断言。默认的 `pnpm test` unit 通道会刻意
跳过这些共享接缝和冒烟文件；当你修改共享 channel 或 provider 接口时，
请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅 channel 契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### Channel 契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - channel 操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略强制执行

### Provider 状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - channel 状态探测
- **registry** - 插件注册表形状

### Provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改 channel 或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，不需要真实 API keys。

## 添加回归测试（指南）

当你修复了一个在 live 中发现的 provider/model 问题时：

- 如果可能，添加一个对 CI 安全的回归测试（mock/stub provider，或精确捕获请求形状转换）
- 如果它本质上只能在 live 中复现（限流、认证策略），就让 live 测试保持收窄，并通过环境变量按需启用
- 优先定位到能捕捉该 bug 的最小层级：
  - provider 请求转换/重放 bug → direct models 测试
  - gateway 会话/历史/工具链路 bug → gateway live 冒烟测试，或对 CI 安全的 gateway mock 测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言基于遍历段的 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了一个新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时故意失败，这样新类别就无法被悄悄跳过。
