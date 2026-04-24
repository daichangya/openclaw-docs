---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商 bug 添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-24T05:03:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b3aa0a785daa5d43dfd2b352cf8c3013c408231c000ff40852bac534211ec54
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时）以及一小组 Docker 运行器。本文档是“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它刻意 _不_ 覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- 实时测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期应在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地全套测试：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 现在直接按文件定位也会路由扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先使用定向运行。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 测试通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次外加一个小型文件读取风格探测。元数据声明支持 `image` 输入的模型也会运行一个极小的图像轮次。隔离提供商故障时，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的实时 / E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker 实时模型矩阵任务。
  - 若要进行聚焦式 CI 重跑，可派发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 与 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其定时 / 发布调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Docker 中针对 Codex app-server 路径运行实时测试通道，使用 `/codex bind` 绑定一个合成 Slack 私信，会执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件都通过原生插件绑定路由，而不是 ACP。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot / K2.6，并且助手转录中存储了归一化后的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来缩小实时测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实环境时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可以通过手动派发使用模拟提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可以通过手动派发并行运行模拟 parity gate、实时 Matrix 测试通道以及由 Convex 管理的实时 Telegram 测试通道。`OpenClaw Release Checks` 会在发布批准前运行相同测试通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会使用隔离的 Gateway 网关 worker 并行运行多个已选场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 启用旧的串行测试通道。
  - 任一场景失败时以非零状态退出。若你想保留制品但不返回失败退出码，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地 AIMock 支持的 provider 服务器，用于实验性夹具与协议模拟覆盖，但不会替代具备场景感知能力的 `mock-openai` 测试通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 与宿主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择参数。
  - 实时运行会转发对来宾机来说可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA 实时 provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须位于仓库根目录之下，以便来宾机能够通过挂载的工作区写回。
  - 会在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告、摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于面向操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出内容构建 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件会按需安装运行时依赖，运行 doctor，并针对模拟的 OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同样的打包安装测试通道。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装已发布的 OpenClaw 包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 测试通道，并将该已安装包作为被测 Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过编辑配置启用内置渠道 / 插件。
  - 验证设置发现流程会让未配置插件的运行时依赖保持缺失状态；首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已经激活的依赖。
  - 还会安装一个已知的较旧 npm 基线，在运行 `openclaw update --tag <candidate>` 前启用 Telegram，并验证候选版本在更新后的 doctor 能修复内置渠道运行时依赖，而无需测试工具侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性、基于 Docker 的 Tuwunel homeserver 运行 Matrix 实时 QA 测试通道。
  - 该 QA 宿主当前仅供仓库 / 开发使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；无需单独安装插件。
  - 会配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个以真实 Matrix 插件作为被测传输层的 QA Gateway 网关子进程。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如果你需要测试不同镜像，请使用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该测试通道会在本地配置一次性用户。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、观测事件制品，以及合并后的 stdout / stderr 输出日志。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和被测 bot token，针对真实私有群组运行 Telegram 实时 QA 测试通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram 聊天的数字 id。
  - 支持 `--credential-source convex` 以使用共享凭证池。默认使用 env 模式，或者设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时以非零状态退出。若你想保留制品但不返回失败退出码，请使用 `--allow-failures`。
  - 需要位于同一私有群组中的两个不同 bot，且被测 bot 必须暴露 Telegram 用户名。
  - 为实现稳定的 bot 对 bot 观测，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观测群组中的 bot 流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和已观测消息制品。回复场景包含从 driver 发送请求到观测到被测回复之间的 RTT。

实时传输测试通道共享一份标准契约，以避免新传输层发生漂移：

`qa-channel` 仍然是更广泛的合成 QA 测试套件，不属于实时传输覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取独占租约，在测试通道运行期间持续发送心跳，并在关闭时释放该租约。

参考的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列表）必须专门使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中，使用 `--json` 获取机器可读输出。

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

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram 聊天数字 id 的字符串。
- `admin/add` 会在 `kind: "telegram"` 时验证此结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

将一个渠道添加到 markdown QA 系统中，严格只需要两样东西：

1. 该渠道的传输适配器。
2. 一组用于验证渠道契约的场景包。

如果共享的 `qa-lab` 宿主能够承载该流程，就不要新增顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动与拆除
- worker 并发
- 制品写入
- 报告生成
- 场景执行
- 对旧 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享 `qa` 根命令下
- Gateway 网关如何为该传输进行配置
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录和归一化后的传输状态
- 如何执行由传输支持的操作
- 如何处理传输专属的重置或清理

新渠道的最低接入门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的拥有者。
2. 在共享 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输专属机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应放在独立入口点之后。
5. 在分主题的 `qa/scenarios/` 目录下编写或改造 markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则应保持现有兼容别名继续可用。

判定规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放在 `qa-lab`。
- 如果某个行为依赖单一渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一个可供多个渠道使用的新能力，应添加通用辅助函数，而不是在 `suite.ts` 中加入渠道专属分支。
- 如果某个行为只对单一传输有意义，就让该场景保持传输专属，并在场景契约中明确说明。

新场景推荐使用的通用辅助函数名称：

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
兼容别名的存在是为了避免一次性迁移，不应作为新场景编写的范式。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实性逐步提高”（同时不稳定性 / 成本也逐步提高）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集，在并行调度时可能会将多项目分片展开为按项目划分的配置
- 文件：位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的核心 / 单元测试清单，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片和定向测试通道"> - 未定向的 `pnpm test` 会运行十二个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个庞大的原生根项目进程。这可以降低高负载机器上的峰值 RSS，并避免 auto-reply / 扩展工作拖累无关测试套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会优先通过定向测试通道来路由显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免承担完整根项目启动成本。 - 当变更只触及可路由的源文件 / 测试文件时，`pnpm test:changed` 会将变更的 git 路径展开到相同的定向测试通道；配置 / 设置修改仍会回退到更广泛的根项目重跑。 - `pnpm check:changed` 是针对窄范围工作的常规智能本地门禁。它会将 diff 分类为核心、核心测试、扩展、扩展测试、应用、文档、发布元数据和工具，然后运行相应的类型检查 / lint / 测试通道。公共插件 SDK 和插件契约变更会额外包含一次扩展校验，因为扩展依赖这些核心契约。仅涉及发布元数据版本提升的变更会运行有针对性的版本 / 配置 / 根依赖检查，而不是完整测试套件，并带有一个保护机制，用于拒绝顶层 version 字段之外的包变更。 - 来自智能体、命令、插件、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试会走 `unit-fast` 测试通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件则继续留在现有测试通道中。 - 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会在 changed 模式运行中映射到这些轻量测试通道中的显式同级测试，因此对辅助函数的修改可以避免为该目录重跑完整的重型测试套件。 - `auto-reply` 有三个专用分桶：顶层核心辅助函数、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。这样可以让最重的 reply harness 工作不影响廉价的状态 / 分块 / token 测试。
    </Accordion>

      <Accordion title="嵌入式运行器覆盖">
        - 当你修改消息工具发现输入或压缩运行时上下文时，要同时保持两个层级的覆盖。
        - 为纯路由和归一化边界添加聚焦的辅助函数回归测试。
        - 保持嵌入式运行器集成测试套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些测试套件会验证带作用域的 id 和压缩行为仍然会流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试并不足以替代这些集成路径。
      </Accordion>

      <Accordion title="Vitest 池和隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
        - 根 UI 测试通道保留其 `jsdom` 设置和优化器，但也在共享的非隔离运行器上运行。
        - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可对比原生 V8 行为。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构测试通道。
        - pre-commit hook 仅负责格式化。它会重新暂存已格式化文件，不会运行 lint、类型检查或测试。
        - 当你需要智能本地门禁时，在交接或推送前显式运行 `pnpm check:changed`。公共插件 SDK 和插件契约变更会包含一次扩展校验。
        - 当变更路径能够清晰映射到较小测试套件时，`pnpm test:changed` 会通过定向测试通道运行。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同路由行为，只是使用更高的 worker 上限。
        - 本地 worker 自动扩缩容有意保持保守，并会在宿主负载平均值已较高时回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
        - 基础 Vitest 配置会将项目 / 配置文件标记为 `forceRerunTriggers`，从而在测试接线变更时保持 changed 模式重跑的正确性。
        - 配置会在受支持的宿主上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个明确的缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及导入拆解输出。
        - `pnpm test:perf:imports:changed` 会将同样的性能分析视图限定到自 `origin/main` 以来发生变化的文件。
        - 当某个热点测试仍然把大部分时间花在启动导入上时，应将重依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了通过 `vi.mock(...)` 传递它们就深度导入运行时辅助函数。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交 diff，将路由后的 `test:changed` 与原生根项目路径进行比较，并打印总耗时以及 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，把变更文件列表路由后对当前脏工作树进行基准测试。
        - `pnpm test:perf:profile:main` 会写出一个主线程 CPU profile，用于分析 Vitest / Vite 启动与 transform 开销。
        - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出 runner CPU + heap profile。
      </Accordion>
    </AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用单个 worker
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言记录器保持有界，合成 RSS 样本低于压力预算，并且每个会话的队列深度都会回落到零
- 预期：
  - 可安全用于 CI，且不需要密钥
  - 是用于稳定性回归跟进的窄测试通道，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制指定 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 接口、节点配对，以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试涉及更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell Gateway 网关
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远程规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行内容
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制文件或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件实时测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型 _今天_ 是否真的能在真实凭证下正常工作？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和限流行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗限流额度
  - 优先运行缩小范围的子集，而不是“全部”
- 实时运行会读取 `~/.profile`，以补齐缺失的 API 密钥。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，这样单元测试夹具就不会改动你真实的 `~/.openclaw`。
- 只有当你明确需要实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：它会保留 `[live] ...` 进度输出，但抑制额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / Bonjour 杂讯。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 为单次实时运行覆盖；测试会在收到限流响应时重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，长时间的提供商调用也能显示为“仍在活动”。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，这样提供商 / Gateway 网关进度行可以在实时运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这张决策表：

- 修改逻辑 / 测试：运行 `pnpm test`（如果改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：增加运行 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商专属故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时（会触网）测试

关于实时模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex app-server
harness，以及所有媒体提供商实时测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、音乐、视频、媒体 harness）——以及实时运行的凭证处理——请参阅
[测试——实时测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配的 profile-key 实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），会挂载你的本地配置目录和工作区（若已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认使用更小的冒烟上限，以便完整 Docker 扫描仍然切实可行：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想进行更大规模的穷尽扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后在两个实时 Docker 测试通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在执行已构建应用的 E2E 容器冒烟运行器中复用它。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还会只绑定挂载所需的 CLI 认证 home（若运行未缩小范围，则挂载所有受支持的 home），然后在运行前将其复制到容器 home 中，以便外部 CLI OAuth 可以刷新 token，同时不改动宿主认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY、完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导 / 渠道 / 智能体冒烟：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证启用插件会按需安装其运行时依赖，运行 doctor，然后执行一次模拟 OpenAI 智能体轮次。使用 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可跳过宿主重新构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装冒烟：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商，而不是挂起。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 可跳过宿主构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- Installer Docker 冒烟：`bash scripts/test-install-sh-docker.sh` 会在其 root、更新和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟默认使用 npm `latest` 作为稳定基线，然后再升级到候选 tarball。非 root 安装器检查会保持独立的 npm 缓存，这样 root 所有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑时复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；若你需要直接 `npm install -g` 覆盖，请在本地运行该脚本时不要设置此环境变量。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制 provider schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（带种子的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow / deny 冒烟）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更冒烟：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包 OpenClaw 一次，然后将该 tarball 挂载到每个 Linux 安装场景中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 可复用该镜像，使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 可在一次全新的本地构建后跳过宿主重新构建，或使用 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向已有 tarball。
- 迭代时，可以通过禁用无关场景来缩小内置插件运行时依赖测试范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

当设置了测试套件专属镜像覆盖（例如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）时，它们仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果镜像尚未存在于本地，脚本会先拉取它。QR 和 installer Docker 测试仍然保留各自的 Dockerfile，因为它们验证的是包 / 安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会将当前检出内容以只读方式 bind mount，并在容器内部暂存到一个临时工作目录中。这样可以让运行时镜像保持精简，同时仍然针对你精确的本地 source / 配置运行 Vitest。暂存步骤会跳过大型仅限本地缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker 实时运行不会花上几分钟复制机器专属制品。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器内启动真实的 Telegram / Discord / 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 测试通道中的 Gateway 网关实时覆盖时，也要一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，再启动一个固定版本的 Open WebUI 容器并将其指向该 Gateway 网关，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一次真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
这个测试通道要求存在可用的实时模型密钥，而在 Docker 化运行中，`OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是提供该密钥的主要方式。
成功运行会打印一个简短的 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意保持确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个带种子的 Gateway 网关容器，再启动第二个容器来拉起 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要实时模型密钥。它会构建仓库 Docker 镜像，在容器内部启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时实例化该服务器，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要实时模型密钥。它会启动一个带种子的 Gateway 网关，并包含一个真实的 stdio MCP 探测服务器，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归 / 调试工作流。之后在 ACP 线程路由验证中可能还会再次需要它，因此不要删除。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`），挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`），挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`），挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于验证仅从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，此时使用临时配置 / 工作区目录，并且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`），挂载到 `/home/node/.npm-global`，用于 Docker 内部缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的 provider 运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在无需重新构建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择在 Open WebUI 冒烟测试中由 Gateway 网关暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是在不使用真实提供商的情况下进行的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有少量 CI 安全的测试，其行为类似于“智能体可靠性评估”：

- 通过真实 Gateway 网关 + 智能体循环进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍然缺少：

- **决策能力：** 当提示词中列出 Skills 时，智能体是否会选择正确的 Skill（或避开无关 Skill）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循必需的步骤 / 参数？
- **工作流契约：** 用于断言工具顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取以及会话接线。
- 一小组以 Skill 为中心的场景（使用 vs 避免、门控、提示注入）。
- 只有在 CI 安全测试套件落地之后，才添加可选的实时评估（按需启用、受环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有发现的插件，并运行一组关于形状和行为的断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享接缝和冒烟文件；当你修改共享渠道或 provider 接口时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### Provider 状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### Provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择 / 选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - provider 运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改插件 SDK 导出或子路径之后
- 添加或修改渠道或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指导）

当你修复一个在实时环境中发现的 provider / model 问题时：

- 如果可能，添加一个 CI 安全的回归测试（模拟 / stub provider，或者捕获确切的请求形状转换）
- 如果该问题本质上只能在实时环境中复现（限流、认证策略），就让实时测试保持狭窄，并通过环境变量按需启用
- 优先选择能捕获该 bug 的最小层级：
  - provider 请求转换 / 回放 bug → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具流水线 bug → Gateway 网关实时冒烟测试，或 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会有意在遇到未分类目标 id 时失败，以确保新类别不会被悄悄跳过。

## 相关内容

- [实时测试](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
