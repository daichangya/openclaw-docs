---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/live 测试套件、Docker 运行器，以及各测试覆盖内容
title: 测试
x-i18n:
    generated_at: "2026-04-23T20:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e0486e188407275915672b0f3955fcd52652cad6b11dbe3195644c539f9179e
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三套 Vitest 测试套件（单元/集成、e2e、live）以及一小组
Docker 运行器。本文是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它有意**不**覆盖什么）。
- 常见工作流应运行哪些命令（本地、push 前、调试）。
- live 测试如何发现凭证，以及如何选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

## 快速开始

大多数日常情况：

- 完整门禁（通常要求在 push 前完成）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足机器上更快地运行本地全套测试：`pnpm test:max`
- 直接进入 Vitest watch 循环：`pnpm test:watch`
- 直接按文件定位现在也支持 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先运行有针对性的测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或希望获得更高信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

当你要调试真实提供商/模型时（需要真实凭证）：

- Live 套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选定模型都会运行一个文本轮次 + 一个小型文件读取风格探测。
    元数据声明支持 `image` 输入的模型还会运行一个很小的图像轮次。
    在隔离提供商故障时，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日运行的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的
    `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置
    `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型
    matrix 作业。
  - 若要做有针对性的 CI 重跑，可调度 `OpenClaw Live And E2E Checks (Reusable)`，
    设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 为新的高信号提供商秘密添加支持时，请同时更新 `scripts/ci-hydrate-live-auth.sh` 以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其定时/发布调用方。
- Moonshot/Kimi 成本 smoke：设置 `MOONSHOT_API_KEY` 后，先运行
  `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6`
  运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告的是 Moonshot/K2.6，并且助手转录中存储了规范化后的 `usage.cost`。

提示：当你只需要一个失败用例时，优先通过下面描述的允许列表环境变量来收窄 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实性时，这些命令与主测试套件并列存在：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，
也可通过手动调度以 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main` 分支上每晚运行，
也可手动调度，作为并行作业运行 mock parity gate、live Matrix 通道以及由 Convex 管理的 live Telegram 通道。`OpenClaw Release Checks`
会在批准发布前运行相同通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认会在隔离的 Gateway 网关 worker 中并行运行多个所选场景。
    `qa-channel` 默认并发数为 4（受所选场景数量限制）。
    使用 `--concurrency <count>` 调整 worker
    数量，或使用 `--concurrency 1` 回到旧的串行通道。
  - 任何场景失败时都会以非零状态退出。若你只想保留产物而不希望退出失败，请使用 `--allow-failures`。
  - 支持 `live-frontier`、`mock-openai` 和 `aimock` 提供商模式。
    `aimock` 会启动一个基于本地 AIMock 的提供商服务器，用于实验性的
    fixture 和协议 mock 覆盖，而不会替代具备场景感知的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行相同的 QA 套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - live 运行会向来宾转发受支持且实际可用的 QA 认证输入：
    基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样来宾才能通过挂载的工作区写回。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入
    `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于运维风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装，
    运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，
    验证启用插件时会按需安装运行时依赖，运行 doctor，
    并针对一个 mock 的 OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同样的打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，
    然后通过配置编辑启用内置渠道/插件。
  - 验证 setup discovery 不会提前安装尚未配置插件的运行时依赖，首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，而第二次重启不会重新安装已经激活过的依赖。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 之前先启用 Telegram，并验证候选版本的更新后 doctor 能修复内置渠道运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 该 QA 主机目前仅供仓库/开发使用。打包安装的 OpenClaw 不会附带
    `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；无需单独安装插件。
  - 会创建三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个 QA Gateway 网关子进程，并将真实 Matrix 插件作为 SUT 传输层。
  - 默认使用固定稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。若需测试其他镜像，可用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地创建一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物以及合并后的 stdout/stderr 输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 针对真实私有群组，使用来自环境变量的 driver 和 SUT bot 令牌运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 ID 必须是 Telegram 数字聊天 ID。
  - 支持 `--credential-source convex`，用于共享池化凭证。默认请使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任何场景失败时都会以非零状态退出。若你只想保留产物而不希望退出失败，请使用 `--allow-failures`。
  - 需要两个不同的机器人位于同一个私有群组中，并且 SUT 机器人需暴露 Telegram 用户名。
  - 为了稳定地观察 bot-to-bot 通信，请在 `@BotFather` 中为两个机器人启用 Bot-to-Bot Communication Mode，并确保 driver 机器人可以观察群组内机器人流量。
  - 会将 Telegram QA 报告、摘要以及 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复类场景还会包含从 driver 发送请求到观察到 SUT 回复的 RTT。

Live 传输通道共享一个标准契约，以防新传输层发生漂移：

`qa-channel` 仍然是广义的合成 QA 套件，不属于 live
传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | 允许列表拦截 | 顶层回复 | 重启恢复 | 线程后续 | 线程隔离 | 表情观察 | 帮助命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x |  |
| Telegram | x |  |  |  |  |  |  |  | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，
QA lab 会从 Convex 支持的池中获取独占租约，在通道运行期间持续发送租约 heartbeat，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 针对所选角色的一个 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认 `ci`，否则默认 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅用于本地开发的 loopback `http://` Convex URL。

正常运行中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加/删除/列出）需要
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中可使用 `--json` 获取机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 资源耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅 maintainer secret）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅 maintainer secret）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅 maintainer secret）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的载荷形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram 数字聊天 ID 字符串。
- `admin/add` 会对 `kind: "telegram"` 的该形状进行验证，并拒绝格式错误的载荷。

### 向 QA 中添加一个渠道

向 Markdown QA 系统中添加一个渠道只需要且仅需要两样东西：

1. 该渠道的传输适配器。
2. 一组用于验证该渠道契约的场景包。

如果共享的 `qa-lab` 主机能够承载流程，就不要新增一个顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 套件启动与关闭
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 对旧 `qa-channel` 场景的兼容性别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根下
- 如何为该传输配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和规范化后的传输状态
- 如何执行由传输支撑的动作
- 如何处理传输特定的重置或清理

为新渠道设置的最低采纳门槛是：

1. 保持由 `qa-lab` 持有共享的 `qa` 根。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应放在单独入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或适配 Markdown 场景。
6. 对新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意迁移，否则应保持现有兼容性别名继续工作。

决策规则是严格的：

- 如果某个行为能在 `qa-lab` 中表达一次，就放到 `qa-lab` 中。
- 如果某个行为依赖于单一渠道传输，就将其保留在对应运行器插件或插件 harness 中。
- 如果一个场景需要新增的能力可被多个渠道使用，应添加通用辅助工具，而不是在 `suite.ts` 中添加某个渠道专用分支。
- 如果某个行为仅对某一种传输有意义，就保持该场景为传输专用，并在场景契约中明确指出。

新场景推荐使用的通用辅助工具名称为：

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

现有场景仍可使用兼容性别名，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新的渠道工作应使用通用辅助工具名称。
兼容性别名的存在是为了避免一次性强制迁移，而不是为
新场景编写树立模板。

## 测试套件（分别在哪里运行）

可以把这些测试套件理解为“现实性逐步增强”（同时也意味着更高的脆弱性/成本）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行会使用 `vitest.full-*.config.ts` 分片集，并可能将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试中的 core/unit 清单
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 会在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片和作用域通道"> - 未定向的 `pnpm test` 会运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低高负载机器上的 RSS 峰值，并避免 auto-reply/extension 工作拖累无关套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先将显式文件/目录目标路由到带作用域的通道，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 无需承担完整根项目启动成本。 - 当变更只涉及可路由的源码/测试文件时，`pnpm test:changed` 会将 git 变更路径展开到相同的带作用域通道；而配置/设置编辑仍会回退到更广泛的根项目重跑。 - `pnpm check:changed` 是针对窄范围工作的常规智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、发布元数据和工具，然后运行匹配的 typecheck/lint/test 通道。公共 Plugin SDK 和插件契约变更会包含 extension 验证，因为 extensions 依赖这些核心契约。仅发布元数据的版本号变更会运行定向的版本/配置/根依赖检查，而不是完整套件，并带有一个防护机制，用于拒绝除顶层版本字段外的 package 变更。 - 来自 agents、commands、plugins、auto-reply 辅助工具、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍保留在现有通道中。 - 某些 `plugin-sdk` 和 `commands` 辅助源码文件在 changed-mode 运行中也会映射到这些轻量通道中的显式同级测试，因此修改辅助工具时无需为该目录重跑完整重型套件。 - `auto-reply` 有三个专用桶：顶层 core 辅助工具、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这可以让最重的 reply harness 工作避开廉价的 status/chunk/token 测试。
    </Accordion>

      <Accordion title="嵌入式运行器覆盖">
        - 当你修改消息工具发现输入或压缩总结运行时
          上下文时，请同时保持两个层级的覆盖。
        - 为纯路由和规范化边界添加有针对性的辅助工具回归测试。
        - 保持嵌入式运行器集成套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些套件会验证带作用域 ID 和压缩总结行为仍然通过真实的 `run.ts` / `compact.ts` 路径流动；仅有辅助工具测试并不足以替代这些集成路径。
      </Accordion>

      <Accordion title="Vitest 池与隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享 Vitest 配置会固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
        - 根 UI 通道会保留其 `jsdom` 设置和优化器，但也运行在共享的非隔离运行器上。
        - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
          进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
          如需与原生 V8 行为对比，可设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1`。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构通道。
        - pre-commit hook 会在已暂存的格式化/lint 之后运行 `pnpm check:changed --staged`，因此仅 core 的提交不会承担 extension 测试成本，除非它们触及面向 extension 的公共契约。仅发布元数据的提交仍会走定向的版本/配置/根依赖通道。
        - 如果完全相同的已暂存变更集已经通过了同等或更强门禁验证，可使用
          `scripts/committer --fast "<message>" <files...>` 来仅跳过
          changed-scope hook 重跑。已暂存的格式化/lint 仍然会运行。请在交接中说明已完成的门禁。这在某个隔离的 flaky hook 失败被重跑并以带作用域的证据通过后，同样是可接受的。
        - 当变更路径能清晰映射到较小套件时，`pnpm test:changed` 会路由到带作用域的通道。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同路由
          行为，只是使用更高的 worker 上限。
        - 本地 worker 自动扩缩容刻意保持保守，并会在主机负载平均值已经较高时自动回退，因此默认情况下多个并发 Vitest 运行带来的损害更小。
        - 基础 Vitest 配置会将项目/配置文件标记为
          `forceRerunTriggers`，以确保当测试接线发生变化时，changed-mode 重跑仍然正确。
        - 在受支持主机上，配置会保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；如果你希望为直接性能分析指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告，以及
          导入明细输出。
        - `pnpm test:perf:imports:changed` 会将相同的性能分析视图限定到
          自 `origin/main` 以来发生变更的文件。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对某个已提交 diff，将路由后的
          `test:changed` 与原生根项目路径进行比较，并输出墙钟时间以及 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过
          `scripts/test-projects.mjs` 和根 Vitest 配置，将当前脏工作树的变更文件列表进行路由并做性能基准。
        - `pnpm test:perf:profile:main` 会为
          Vitest/Vite 启动和 transform 开销写入主线程 CPU profile。
        - `pnpm test:perf:profile:runner` 会在禁用文件级并行的情况下，为
          单元测试套件写入运行器 CPU+heap profiles。
      </Accordion>
    </AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 启动一个真实的 loopback Gateway 网关，并默认启用诊断
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、memory 和大载荷抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助工具
  - 断言记录器保持有界、合成 RSS 样本保持在压力预算之下，并且每会话队列深度最终回落到零
- 预期：
  - 对 CI 安全，且不需要密钥
  - 这是一个用于稳定性回归跟进的窄通道，而不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 有用的覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制设置 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对，以及更重的网络场景
- 预期：
  - 会在 CI 中运行（当管线启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec，对 OpenClaw 的 OpenShell 后端进行测试
  - 通过沙箱 fs bridge 验证远程权威文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 以及可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 有用的覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：手动运行更广泛 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型今天是否真的能在真实凭证下工作？”
  - 捕获提供商格式变更、工具调用怪癖、认证问题以及速率限制行为
- 预期：
  - 本身并非为 CI 稳定性而设计（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 应优先运行收窄后的子集，而不是“一次跑全部”
- Live 运行会 source `~/.profile` 以拾取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，以避免单元测试 fixture 修改你的真实 `~/.openclaw`。
- 仅当你明确希望 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志/Bonjour 杂音。如果你希望恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置 `*_API_KEYS`，使用逗号/分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 进行每次 live 运行的覆盖；测试在遇到速率限制响应时会重试。
- 进度/heartbeat 输出：
  - Live 套件现在会将进度行输出到 stderr，这样即使 Vitest 控制台捕获较安静，长时间的提供商调用也能明显显示仍在运行。
  - `vitest.live.config.ts` 会禁用 Vitest 的控制台拦截，因此提供商/Gateway 网关的进度行会在 live 运行期间立即流出。
  - 可使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model heartbeat。
  - 可使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探测 heartbeat。

## 我应该运行哪个测试套件？

使用下面的决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动较多，也运行 `pnpm test:coverage`）
- 修改 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## Live：Android 节点能力扫描

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用某个已连接 Android 节点**当前声明的每一个命令**，并断言命令契约行为。
- 范围：
  - 预置/手动设置（该套件不会安装/运行/配对应用）。
  - 针对所选 Android 节点逐命令验证 Gateway 网关 `node.invoke`。
- 必需的预先设置：
  - Android 应用已连接并配对到 Gateway 网关。
  - 应用保持前台运行。
  - 对你预期能够通过的能力，已授予权限/捕获同意。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情： [Android App](/zh-CN/platforms/android)

## Live：模型 smoke（profile keys）

Live 测试分为两层，以便隔离故障：

- “直接模型”告诉我们，在给定密钥下，提供商/模型是否至少能回复。
- “Gateway 网关 smoke”告诉我们，针对该模型的完整 Gateway 网关 + 智能体流水线是否工作正常（会话、历史、工具、沙箱策略等）。

### 第 1 层：直接模型补全（无 Gateway 网关）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你具备凭证的模型
  - 对每个模型运行一个小型补全（以及在需要时的定向回归）
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，是 modern 的别名）才会真正运行该套件；否则它会跳过，以便让 `pnpm test:live` 聚焦于 Gateway 网关 smoke
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern`：运行 modern 允许列表（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是 modern 允许列表的别名
  - 或使用 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号分隔允许列表）
  - modern/all 扫描默认带有一个精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可运行完整 modern 扫描，或设置一个正数以限制为更小的上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔允许列表）
- 密钥来源：
  - 默认：profile store 和环境变量回退
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile store**
- 该层存在的原因：
  - 将“提供商 API 挂了 / 密钥无效”与“Gateway 网关智能体流水线挂了”分离开
  - 容纳小而隔离的回归用例（例如：OpenAI Responses/Codex Responses 的推理回放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体 smoke（也就是 `@openclaw` 实际会做的事）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 Gateway 网关
  - 创建/修补一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 遍历带密钥的模型，并断言：
    - 存在“有意义”的回复（无工具）
    - 一个真实工具调用可用（read 探测）
    - 可选的额外工具探测可用（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续）保持正常
- 探测细节（这样你可以快速解释故障）：
  - `read` 探测：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 它并回显 nonce。
  - `exec+read` 探测：测试会要求智能体通过 `exec` 将 nonce 写入临时文件，然后再 `read` 回来。
  - image 探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：modern 允许列表（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是 modern 允许列表的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）来收窄范围
  - modern/all Gateway 网关扫描默认带有一个精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可运行完整 modern 扫描，或设置一个正数以限制为更小的上限。
- 如何选择提供商（避免“OpenRouter 全家桶”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔允许列表）
- 该 live 测试始终启用工具 + 图像探测：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时会运行图像探测
  - 流程（高层）：
    - 测试生成一个带有 “CAT” + 随机代码的小 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关会将附件解析到 `images[]` 中（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 嵌入式智能体将多模态用户消息转发给模型
    - 断言：回复中包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：若要查看你机器上可以测试什么（以及精确的 `provider/model` ID），请运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端 smoke（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：在不触碰默认配置的情况下，使用本地 CLI 后端验证 Gateway 网关 + 智能体流水线。
- 后端特定的 smoke 默认值位于所属 extension 的 `cli-backend.ts` 定义中。
- 启用方式：
  - `pnpm test:live`（或直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认提供商/模型：`claude-cli/claude-sonnet-4-6`
  - 命令/参数/图像行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`：发送真实图像附件（路径会注入到提示词中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`：将图像文件路径作为 CLI 参数传递，而不是注入提示词。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）：当设置了 `IMAGE_ARG` 时，用于控制图像参数传递方式。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`：发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`：禁用默认的 Claude Sonnet -> Opus 同会话连续性探测（当所选模型支持切换目标时，设置为 `1` 可强制启用）。

示例：

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
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
- 它会在仓库 Docker 镜像中，以非 root 的 `node` 用户运行 live CLI-backend smoke。
- 它会从所属 extension 解析 CLI smoke 元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到一个可缓存的可写前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 中（默认：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要可移植的 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先证明 Docker 中直接 `claude -p` 可用，然后在不保留 Anthropic API 密钥环境变量的情况下，运行两个 Gateway 网关 CLI-backend 轮次。该订阅通道默认禁用 Claude MCP/tool 和图像探测，因为 Claude 目前会将第三方应用使用计入额外使用量计费，而不是正常订阅计划配额。
- Live CLI-backend smoke 现在会对 Claude、Codex 和 Gemini 运行相同的端到端流程：文本轮次、图像分类轮次，然后通过 Gateway 网关 CLI 验证 MCP `cron` 工具调用。
- Claude 的默认 smoke 还会将会话从 Sonnet 切换为 Opus，并验证恢复后的会话仍记得之前的备注。

## Live：ACP 绑定 smoke（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用真实 ACP 智能体验证真实的 ACP conversation-bind 流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 在原地绑定一个合成的 message-channel 会话
  - 在同一会话上发送一个正常的后续消息
  - 验证该后续消息落入绑定的 ACP 会话转录中
- 启用方式：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接 `pnpm test:live ...` 使用的 ACP 智能体：`claude`
  - 合成渠道：Slack 私信风格的会话上下文
  - ACP 后端：`acpx`
- 覆盖项：
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.4`
- 说明：
  - 该通道使用 Gateway 网关 `chat.send` 表面，并带有仅管理员可用的合成 originating-route 字段，这样测试就可以附加 message-channel 上下文，而无需伪装为真实外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会为所选 ACP harness 智能体使用内置 `acpx` 插件的内置智能体注册表。

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
- 默认情况下，它会依次针对所有受支持的 live CLI 智能体运行 ACP 绑定 smoke：`claude`、`codex`，然后 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可收窄矩阵。
- 它会 source `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，将 `acpx` 安装到一个可写 npm 前缀中，然后在缺失时安装所请求的 live CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，以便 acpx 保持从已 source 的 profile 中获得的提供商环境变量对子 harness CLI 可用。

## Live：Codex app-server harness smoke

- 目标：通过常规 Gateway 网关
  `agent` 方法验证插件持有的 Codex harness：
  - 加载内置 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 在强制使用 Codex harness 的情况下，向 `openai/gpt-5.5` 发送第一次 Gateway 网关智能体轮次
  - 向同一 OpenClaw 会话发送第二轮，并验证 app-server
    线程能够恢复
  - 通过同一 Gateway 网关命令
    路径运行 `/codex status` 和 `/codex models`
  - 可选运行两个经过 Guardian 审查的提权 shell 探测：一个应被批准的无害命令，以及一个应被拒绝并要求智能体回问的伪造秘密上传命令
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.5`
- 可选图像探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/tool 探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该 smoke 会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex
  harness 无法通过静默回退到 PI 来“蒙混过关”。
- 认证：来自 shell/profile 的 `OPENAI_API_KEY`，以及可选复制的
  `~/.codex/auth.json` 和 `~/.codex/config.toml`

本地配方：

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker 配方：

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 说明：

- Docker 运行器位于 `scripts/test-live-codex-harness-docker.sh`。
- 它会 source 挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI
  认证文件，将 `@openai/codex` 安装到一个可写、已挂载的 npm
  前缀中，暂存源码树，然后只运行 Codex-harness live 测试。
- Docker 默认启用图像、MCP/tool 和 Guardian 探测。若需更窄范围的调试运行，请设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与 live
  测试配置保持一致，因此旧版别名或 PI 回退无法掩盖 Codex harness
  回归问题。

### 推荐的 live 配方

范围收窄且显式的允许列表最快、也最不容易抖动：

- 单模型，直接模式（无 Gateway 网关）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关 smoke：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个提供商的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的认证 + 工具怪癖）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这通常是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的认证方式，并且行为可能不同（流式传输/工具支持/版本偏差）。

## Live：模型矩阵（我们覆盖什么）

这里没有固定的“CI 模型列表”（live 是按需启用的），但以下是在拥有密钥的开发机器上，**建议**定期覆盖的模型。

### 现代 smoke 集（工具调用 + 图像）

这是我们期望持续可用的“常见模型”运行集：

- OpenAI（非 Codex）：`openai/gpt-5.5`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex OAuth：`openai/gpt-5.5`（`openai-codex/gpt-*` 仍保留为旧版别名）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

使用工具 + 图像运行 Gateway 网关 smoke：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个提供商家族至少选一个：

- OpenAI：`openai/gpt-5.5`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或当前最新可用）
- Mistral：`mistral/`…（选择一个你已启用、支持工具的模型）
- Cerebras：`cerebras/`…（如果你有权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：图像发送（附件 → 多模态消息）

至少在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中包含一个支持图像的模型（Claude/Gemini/OpenAI 支持视觉的变体等），以运行图像探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相应密钥，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选项）
- OpenCode：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`（认证通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

如果你有凭证/配置，也可以将更多提供商纳入 live 矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表始终是你机器上的 `discoverModels(...)` 返回结果，以及当前可用的密钥。

## 凭证（切勿提交）

Live 测试发现凭证的方式与 CLI 完全相同。实际含义是：

- 如果 CLI 能工作，live 测试通常也应能找到相同的密钥。
- 如果 live 测试说“没有凭证”，请按调试 `openclaw models list` / 模型选择的方式来调试。

- 每个智能体的认证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中“profile keys”的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到暂存的 live home 中，但它不是主要的 profile-key 存储）
- 默认情况下，live 本地运行会将当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到临时测试 home 中；暂存的 live home 会跳过 `workspace/` 和 `sandboxes/`，并剥离 `agents.*.workspace` / `agentDir` 路径覆盖项，以确保探测不会落到你的真实主机工作区上。

如果你希望依赖环境变量密钥（例如导出在你的 `~/.profile` 中），请在 `source ~/.profile` 之后再运行本地测试，或者使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载进容器）。

## Deepgram live（音频转录）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI 工作流媒体 live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 运行内置 comfy 图像、视频和 `music_generate` 路径
  - 除非已配置 `models.providers.comfy.<capability>`，否则会跳过各项能力
  - 适用于在修改 comfy 工作流提交、轮询、下载或插件注册后进行验证

## 图像生成 live

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成提供商插件
  - 在探测前，从你的登录 shell（`~/.profile`）中加载缺失的提供商环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的认证配置文件，这样 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实 shell 凭证
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
- 可选收窄：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 认证，并忽略仅来自环境变量的覆盖项

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 运行共享的内置音乐生成提供商路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前，从你的登录 shell（`~/.profile`）中加载提供商环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的认证配置文件，这样 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证/profile/model 的提供商
  - 在可用时，运行两个已声明的运行时模式：
    - `generate`，仅提示词输入
    - 当提供商声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：使用独立的 Comfy live 文件，不属于此共享扫描
- 可选收窄：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 认证，并忽略仅来自环境变量的覆盖项

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 运行共享的内置视频生成提供商路径
  - 默认采用发布安全的 smoke 路径：非 FAL 提供商、每个提供商一个 text-to-video 请求、一秒钟龙虾提示词，以及由 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 控制的每提供商操作上限（默认 `180000`）
  - 默认跳过 FAL，因为提供商侧队列延迟可能主导发布时间；如需显式运行，请传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`
  - 在探测前，从你的登录 shell（`~/.profile`）中加载提供商环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的认证配置文件，这样 `auth-profiles.json` 中陈旧的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用认证/profile/model 的提供商
  - 默认只运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`，可在可用时额外运行已声明的转换模式：
    - 当提供商声明 `capabilities.imageToVideo.enabled`，并且所选提供商/模型在共享扫描中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当提供商声明 `capabilities.videoToVideo.enabled`，并且所选提供商/模型在共享扫描中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫描中已声明但被跳过的 `imageToVideo` 提供商：
    - `vydra`，因为内置 `veo3` 仅支持文本，内置 `kling` 则需要远程图像 URL
  - 提供商特定的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` text-to-video，以及默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` live 覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫描中已声明但被跳过的 `videoToVideo` 提供商：
    - `alibaba`、`qwen`、`xai`，因为这些路径目前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini/Veo 通道使用本地基于 buffer 的输入，而该路径不被共享扫描接受
    - `openai`，因为当前共享通道缺乏对组织特定视频 inpaint/remix 访问权限的保证
- 可选收窄：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 可让默认扫描包含所有提供商，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可降低每个提供商的操作上限，用于激进的 smoke 运行
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 强制使用 profile-store 认证，并忽略仅来自环境变量的覆盖项

## 媒体 live harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个仓库原生入口点运行共享的图像、音乐和视频 live 套件
  - 自动从 `~/.profile` 加载缺失的提供商环境变量
  - 默认自动将每个套件收窄到当前具备可用认证的提供商
  - 复用 `scripts/test-live.mjs`，因此 heartbeat 和 quiet 模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的 “在 Linux 上也能工作” 检查）

这些 Docker 运行器分为两类：

- Live-model 运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自对应的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），同时挂载你的本地配置目录和工作区（若已挂载，也会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的 smoke 上限，以确保完整 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。如果你明确想运行更大、更完整的扫描，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后将其复用于两个 live Docker 通道。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并将其复用于执行已构建应用的 E2E 容器 smoke 运行器。
- 容器 smoke 运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

Live-model Docker 运行器还会仅绑定挂载所需的 CLI 认证 home（如果运行未收窄，则挂载全部受支持的 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定 smoke：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端 smoke：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，全流程脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体 smoke：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，默认再配置 Telegram，验证启用插件会按需安装其运行时依赖，运行 doctor，并执行一次 mock OpenAI 智能体轮次。可通过 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装 smoke：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离的 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 能返回内置图像提供商，而不是卡住。可通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建 Docker 镜像中复制 `dist/`。
- 安装器 Docker smoke：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。非 root 安装器检查会保持隔离的 npm 缓存，以免 root 持有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root/update/direct-npm 缓存。
- Gateway 网关网络（两个容器，WS 认证 + health）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses web_search 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会让一个 mock OpenAI 服务器通过 Gateway 网关运行，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查 Gateway 网关日志中出现原始细节。
- MCP 渠道 bridge（预置 Gateway 网关 + stdio bridge + 原始 Claude notification-frame smoke）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow/deny smoke）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后回收 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装 smoke + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变化 smoke：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重载元数据 smoke：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到各个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用该镜像，在新鲜本地构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。
- 迭代时可通过禁用无关场景来收窄内置插件运行时依赖测试，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

当设置时，像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的套件专用镜像覆盖项仍然优先。如果 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向的是远程共享镜像，而它本地尚不存在，脚本会先拉取它。QR 和安装器 Docker 测试会保留各自的 Dockerfile，因为它们验证的是打包/安装行为，而不是共享的 built-app 运行时。

Live-model Docker 运行器还会以只读方式绑定挂载当前检出，
并在容器内将其暂存到一个临时 workdir 中。这样既能保持运行时
镜像精简，又能让 Vitest 针对你精确的本地源码/配置运行。
暂存步骤会跳过大型仅本地缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，这样 Docker live 运行就不会花费数分钟去复制
机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，以便 Gateway 网关 live 探测不会在容器内部启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要收窄或排除该 Docker 通道中的 Gateway 网关
live 覆盖时，也请同时传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层次的兼容性 smoke：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 完成登录，验证 `/api/models` 暴露出 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而 Open WebUI 也可能需要完成它自己的冷启动设置。
该通道需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一个类似 `{ "ok": true, "model":
"openclaw/default", ... }` 的小 JSON 载荷。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要
真实的 Telegram、Discord 或 iMessage 账户。它会启动一个已预置的 Gateway 网关
容器，再启动第二个容器来运行 `openclaw mcp serve`，然后
验证路由后的会话发现、转录读取、附件元数据、
实时事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 发送的 Claude 风格渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，
因此该 smoke 验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 碰巧暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，
通过嵌入式 Pi bundle MCP 运行时实例化该服务器，执行该工具，然后验证 `coding` 和 `messaging` 会保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
密钥。它会启动一个已预置的 Gateway 网关，并带有真实 stdio MCP 探测服务器，运行一个
隔离的 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证
每次运行后 MCP 子进程都会退出。

手动 ACP 纯语言线程 smoke（不在 CI 中）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留此脚本用于回归/调试工作流。它未来可能还会用于 ACP 线程路由验证，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`），会挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`），会挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`），会挂载到 `/home/node/.profile`，并在运行测试前被 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`：仅验证从 `OPENCLAW_PROFILE_FILE` source 出来的环境变量，使用临时配置/工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`），会挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部安装的 CLI
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...`，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载由 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可手动使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）进行覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`：收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`：在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1`：复用现有的 `openclaw:local-live` 镜像，用于无需重建的重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：确保凭证来自 profile store（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...`：选择 Gateway 网关为 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...`：覆盖 Open WebUI smoke 使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...`：覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后请运行文档检查：`pnpm check:docs`。
若还需要检查页内标题锚点，请运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（对 CI 安全）

这些是在没有真实提供商的情况下进行的“真实流水线”回归：

- Gateway 网关工具调用（mock OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，会写入配置 + 强制认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，它们表现得像“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环运行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线和配置效果（`src/gateway/gateway.test.ts`）。

针对 Skills（参见 [Skills](/zh-CN/tools/skills)）目前仍缺少的部分：

- **决策能力：** 当 Skills 被列在提示词中时，智能体是否会选择正确的 skill（或避免无关 skill）？
- **遵循性：** 智能体在使用前是否会读取 `SKILL.md`，并遵循要求的步骤/参数？
- **工作流契约：** 可断言工具顺序、会话历史继承以及沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 调用顺序、skill 文件读取和会话接线。
- 一个小型的 skill 聚焦场景套件（使用 vs 避免、门控、prompt injection）。
- 只有在对 CI 安全的套件就位之后，才引入可选的 live 评估（按需启用、受环境变量门控）。

## 契约测试（插件与渠道形状）

契约测试会验证每个已注册插件和渠道是否符合其接口契约。它们会遍历所有已发现的插件，并运行一套形状与行为断言。默认的 `pnpm test` 单元通道会有意跳过这些共享接缝和 smoke 文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略强制执行

### 提供商状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/挑选
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现逻辑后

契约测试会在 CI 中运行，且不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复了一个在 live 中发现的提供商/模型问题时：

- 如果可能，请添加一个对 CI 安全的回归测试（mock/stub 提供商，或捕获精确的请求形状转换）
- 如果它天然只能通过 live 发现（速率限制、认证策略），请将 live 测试保持为窄范围，并通过环境变量按需启用
- 优先针对能够捕捉该缺陷的最小层级：
  - 提供商请求转换/重放缺陷 → 直接模型测试
  - Gateway 网关会话/历史/工具流水线缺陷 → Gateway 网关 live smoke 或对 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言带遍历段的 exec ids 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会有意在遇到未分类目标 id 时失败，因此新类别无法被静默跳过。
