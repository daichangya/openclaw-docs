---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-24T16:11:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d4f837faddc458509702b2a315d71d35740c01810ca76e40d652df54b09f38e
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）以及少量 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它刻意 _不_ 覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界中的模型/提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期在 push 前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接使用 Vitest 观察模式循环：`pnpm test:watch`
- 直接指定文件现在也支持 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先使用定向运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

在调试真实提供商/模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地仅运行一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次以及一个类似小型文件读取的探测。元数据声明支持 `image` 输入的模型还会运行一个极小的图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖：每日运行的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 若要进行聚焦的 CI 重跑，可触发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其 scheduled/release 调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Docker live 通道中针对 Codex app-server 路径运行，绑定一个带有 `/codex bind` 的合成 Slack 私信，会执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件都通过原生 plugin 绑定路由，而不是 ACP。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot/K2.6，且 assistant transcript 中存储了规范化的 `usage.cost`。

提示：当你只需要一个失败用例时，优先通过下文描述的 allowlist 环境变量来收窄 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实环境时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动触发配合 mock 提供商执行。`QA-Lab - All Lanes` 会在 `main` 上每夜运行，也可通过手动触发，并将 mock parity gate、live Matrix 通道以及由 Convex 管理的 live Telegram 通道作为并行作业运行。`OpenClaw Release Checks` 会在发布批准前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认会以隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 回退到旧的串行通道。
  - 任一场景失败时以非零状态退出。如果你想保留产物但不希望以失败退出码结束，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地 AIMock 支持的 provider 服务器，用于实验性 fixture 和协议 mock 覆盖，而不会替代具备场景感知的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - live 运行会转发那些对 guest 来说可行的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样 guest 才能通过挂载的工作区回写文件。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 基于当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，以非交互方式执行 OpenAI API key 新手引导，默认配置 Telegram，验证启用 plugin 时会按需安装运行时依赖，运行 doctor，并针对一个 mock OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同样的打包安装通道。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后将该已安装包作为 SUT Gateway 网关复用 live Telegram QA 通道。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，再加上 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 以及 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅覆盖该通道共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将该通道暴露为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在 merge 时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建产物，启动已配置 OpenAI 的 Gateway 网关，然后通过编辑配置启用内置的 channel/plugins。
  - 验证设置发现阶段不会预先安装未配置 plugin 的运行时依赖，首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置 plugin 的运行时依赖，第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知较旧的 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本在更新后的 doctor 中能够修复内置渠道运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 该 QA 主机目前仅供 repo/dev 使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；不需要单独安装 plugin。
  - 会创建三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个以真实 Matrix plugin 作为 SUT 传输层的 QA gateway 子进程。
  - 默认使用固定的稳定 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如需测试其他镜像，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享的 credential-source 标志，因为该通道会在本地创建一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物以及合并的 stdout/stderr 输出日志写入 `.artifacts/qa-e2e/...`。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 以使用共享池凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时以非零状态退出。如果你想保留产物但不希望以失败退出码结束，请使用 `--allow-failures`。
  - 需要两个位于同一私有群组中的不同 bot，并且 SUT bot 需要暴露 Telegram 用户名。
  - 为了稳定地观察 bot 对 bot 通信，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观察到群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复场景会包含从 driver 发送请求到观察到 SUT 回复的 RTT。

live 传输通道共享一套标准契约，以避免新传输方式发生漂移：

`qa-channel` 仍然是宽泛的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| 通道 | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | 帮助命令 |
| ---- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | -------- |
| Matrix | x | x | x | x | x | x | x | x |  |
| Telegram | x |  |  |  |  |  |  |  | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取一个独占租约，在通道运行期间为该租约发送心跳，并在关闭时释放该租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 默认环境变量：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选跟踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加/删除/列出）需要专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 帮助命令：

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在脚本和 CI 工具中使用 `--json` 以获得机器可读的输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 已耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat id 的数字字符串。
- `admin/add` 会为 `kind: "telegram"` 校验该结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证该渠道契约的场景包。

当共享的 `qa-lab` 主机能够承载流程时，不要新增一个顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动和拆除
- worker 并发控制
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器 plugins 负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享的 `qa` 根命令下
- 如何为该传输方式配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和规范化的传输状态
- 如何执行由传输方式支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入门槛是：

1. 保持由 `qa-lab` 作为共享 `qa` 根命令的拥有者。
2. 在共享的 `qa-lab` 主机接口上实现传输运行器。
3. 将传输特定机制保留在运行器 plugin 或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   运行器 plugins 应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；惰性 CLI 和运行器执行应置于独立入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或调整 markdown 场景。
6. 为新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则非常严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放到 `qa-lab`。
- 如果某个行为依赖某一种渠道传输方式，就把它保留在对应的运行器 plugin 或 plugin harness 中。
- 如果某个场景需要一个可被多个渠道复用的新能力，就添加一个通用辅助工具，而不是在 `suite.ts` 中加入渠道特定分支。
- 如果某个行为只对某一种传输方式有意义，就保持该场景为传输特定，并在场景契约中明确这一点。

新场景推荐使用的通用辅助工具名称：

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

新的渠道开发应使用通用辅助工具名称。
兼容别名的存在是为了避免一次性强制迁移，而不是作为新场景编写的范式。

## 测试套件（各自运行在哪里）

可以把这些测试套件理解为“真实度逐级提高”（同时波动性/成本也逐级增加）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目拆分的配置，以便并行调度
- 文件：位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core/unit 清单，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` node 测试
- 范围：
  - 纯 unit 测试
  - 进程内 integration 测试（Gateway 网关认证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片和定向通道"> - 未定向的 `pnpm test` 会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低高负载机器上的 RSS 峰值，并避免 auto-reply/extension 工作拖慢无关测试套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会优先通过定向通道来处理显式的文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动的成本。 - 当变更的 git 路径仅触及可路由的源文件/测试文件时，`pnpm test:changed` 会将这些路径展开到相同的定向通道；而配置/设置改动仍会回退到更宽泛的根项目重跑。 - `pnpm check:changed` 是处理小范围变更时常规的智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行对应的 typecheck/lint/test 通道。公共 Plugin SDK 和 plugin-contract 的变更会额外包含一次 extension 验证，因为 extensions 依赖这些 core 契约。仅包含发布元数据版本号变更时，会运行定向的版本/config/root-dependency 检查，而不是完整测试套件，并带有一个保护机制，用于拒绝顶层 version 字段之外的 package 变更。 - 来自 agents、commands、plugins、auto-reply 辅助工具、`plugin-sdk` 以及类似纯工具区域的轻导入 unit 测试，会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件则保留在现有通道中。 - 某些 `plugin-sdk` 和 `commands` 辅助源码文件在 changed 模式下也会映射到这些轻量通道中的显式同级测试，因此辅助工具改动无需为该目录重跑完整的重型测试套件。 - `auto-reply` 有三个专用桶：顶层 core 辅助工具、顶层 `reply.*` integration 测试，以及 `src/auto-reply/reply/**` 子树。这样可以让最重的 reply harness 工作不影响廉价的状态/chunk/token 测试。
    </Accordion>

      <Accordion title="嵌入式运行器覆盖">
        - 当你修改消息工具发现输入或压缩运行时上下文时，请同时保持两个层级的覆盖。
        - 为纯路由和规范化边界添加聚焦的辅助工具回归测试。
        - 保持嵌入式运行器 integration 测试套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些测试套件会验证带作用域的 id 和压缩行为是否仍然通过真实的 `run.ts` / `compact.ts` 路径流转；仅有辅助工具测试不足以替代这些 integration 路径。
      </Accordion>

      <Accordion title="Vitest 池与隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享 Vitest 配置固定为 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
        - 根 UI 通道保留其 `jsdom` 设置和优化器，但也在共享的非隔离运行器上运行。
        - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大规模本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可对比 stock V8 行为。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 会显示某个 diff 触发了哪些架构通道。
        - pre-commit hook 仅做格式化。它会重新暂存已格式化文件，但不会运行 lint、typecheck 或测试。
        - 当你需要智能本地门禁时，请在交接或 push 前显式运行 `pnpm check:changed`。公共 Plugin SDK 和 plugin-contract 的变更会额外包含一次 extension 验证。
        - 当变更路径可以清晰映射到更小的测试套件时，`pnpm test:changed` 会通过定向通道执行。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
        - 本地 worker 自动扩缩容刻意较为保守，当主机平均负载已经较高时会主动回退，因此默认情况下多个并发 Vitest 运行对系统造成的影响更小。
        - 基础 Vitest 配置会将项目/配置文件标记为 `forceRerunTriggers`，以便在测试接线变更时，changed 模式重跑仍保持正确。
        - 该配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接分析指定一个显式缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆解输出。
        - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来变更的文件。
        - 当某个热点测试的大部分时间仍然消耗在启动导入上时，应将重型依赖保留在一个狭窄的本地 `*.runtime.ts` 接口之后，并直接 mock 该接口，而不是为了通过 `vi.mock(...)` 传递它们就深度导入运行时辅助工具。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交 diff，将定向的 `test:changed` 与原生根项目路径进行对比，并输出总耗时以及 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过将变更文件列表分别路由到 `scripts/test-projects.mjs` 和根 Vitest 配置，对当前未提交工作树进行基准测试。
        - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和转换开销写入主线程 CPU profile。
        - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 测试套件写入运行器 CPU + heap profile。
      </Accordion>
    </AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制只使用一个 worker
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway message、memory 和大负载 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助工具
  - 断言 recorder 保持有界、合成 RSS 样本保持在压力预算之下，并且每个会话的队列深度都会回落到零
- 预期：
  - 对 CI 安全且不需要密钥
  - 这是一个用于稳定性回归跟进的窄通道，而不是完整 Gateway 网关测试套件的替代品

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置 plugin E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 且设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 workers（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线中启用时）
  - 不需要真实密钥
  - 比 unit 测试包含更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell gateway
  - 从一个临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥接验证远端规范化的文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和一个可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 gateway 和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更大范围 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI 二进制文件或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置 plugin live 测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在 _今天_ 配合真实凭证是否真的能工作？”
  - 捕获提供商格式变更、工具调用怪异行为、认证问题以及速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行收窄后的子集，而不是“全部都跑”
- live 运行会读取 `~/.profile`，以获取缺失的 API key。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，这样 unit fixture 就不会修改你真实的 `~/.openclaw`。
- 仅当你确实需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 gateway 启动日志/Bonjour 噪音。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（提供商特定）：设置 `*_API_KEYS`（逗号/分号格式）或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 进行每个 live 运行的覆盖；测试会在遇到速率限制响应时重试。
- 进度/心跳输出：
  - live 测试套件现在会向 stderr 输出进度行，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能明显显示仍在活动中。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此在 live 运行期间，提供商/gateway 进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/探测心跳。

## 我应该运行哪个测试套件？

使用这张决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果改动很多，再加上 `pnpm test:coverage`）
- 触及 gateway 网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## Live（触网）测试

关于 live 模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex app-server
harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、
音乐、视频、媒体 harness）——以及 live 运行的凭证处理——请参见
[测试 — live 测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- Live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像内运行与其匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，还会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用更小的冒烟上限，以便完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确想要进行更大范围的穷尽扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并将其复用于那些验证已构建应用的 E2E 容器冒烟运行器。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live-model Docker 运行器还会仅 bind-mount 所需的 CLI auth home（如果运行未收窄，则会挂载所有受支持的 auth home），然后在运行前将其复制到容器 home 中，这样外部 CLI OAuth 就能刷新 token，而不会修改主机 auth 存储：

- 直连模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- onboarding 向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref onboarding 配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活 plugin 的运行时依赖，并运行一次 mock OpenAI 智能体轮次。可使用 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 会返回内置图像提供商而不是卡住。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认以 npm `latest` 作为稳定基线，再升级到候选 tarball。非 root 安装器检查会保持一个隔离的 npm 缓存，以避免 root 所有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要覆盖直接 `npm install -g` 时，请在本地运行脚本且不要设置该环境变量。
- Gateway 网关网络（两个容器，WS 认证 + health）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个 mock OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制 provider schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（预置 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 内嵌 Pi profile allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 独立 cron 和一次性 subagent 运行后的 stdio MCP 子进程清理）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（安装冒烟测试 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- Plugin 更新无变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置 plugin 运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在完成一次新的本地构建后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机重建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合会先预打包一次该 tarball，然后将内置渠道检查分片到独立通道中；直接运行内置通道时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 收窄渠道矩阵。
- 在迭代时，可通过禁用无关场景来收窄内置 plugin 运行时依赖检查，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的测试套件专用镜像覆盖仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未在本地存在，脚本会先拉取它。QR 和安装器 Docker 测试保留各自的 Dockerfile，因为它们验证的是 package/install 行为，而不是共享的 built-app 运行时。

live-model Docker 运行器还会以只读方式 bind-mount 当前 checkout，并将其暂存到容器内的临时工作目录中。这样既能保持运行时镜像精简，又仍能让 Vitest 针对你本地的精确源码/配置运行。
暂存步骤会跳过大型的本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花上数分钟复制机器特定产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 gateway live 探测就不会在容器内启动
真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要从该 Docker 通道中收窄或排除 gateway live 覆盖时，也请一并传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的
OpenClaw gateway 容器，再针对该 gateway 启动一个固定版本的 Open WebUI 容器，通过
Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过
Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而且 Open WebUI 可能需要完成自身的冷启动设置。
这个通道需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会输出一小段 JSON，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要真实的
Telegram、Discord 或 iMessage 账户。它会启动一个预置的 Gateway 网关
容器，再启动第二个容器来运行 `openclaw mcp serve`，然后
通过真实的 stdio MCP bridge 验证路由后的会话发现、transcript 读取、附件元数据、
live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是
bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP probe 服务器，
通过内嵌 Pi bundle MCP 运行时实例化该服务器，执行该工具，然后验证 `coding` 和 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
密钥。它会启动一个带真实 stdio MCP probe 服务器的预置 Gateway 网关，运行一个
独立的 cron 轮次和一个 `/subagents spawn` 一次性子智能体轮次，然后验证
MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（不在 CI 中运行）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 将此脚本保留用于回归/调试工作流。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）会挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）会挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）会挂载到 `/home/node/.profile`，并在运行测试前被读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于验证仅来自 `OPENCLAW_PROFILE_FILE` 的环境变量，此时会使用临时 config/workspace 目录且不挂载外部 CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）会挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI auth 目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的 provider 运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在无需重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 gateway 为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce-check prompt
- `OPENWEBUI_IMAGE=...` 用于覆盖固定版本的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是在没有真实提供商的情况下进行的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，它们的行为类似“智能体可靠性评估”：

- 通过真实 gateway + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（见 [Skills](/zh-CN/tools/skills)），目前仍然缺少的是：

- **决策**：当 prompt 中列出 Skills 时，智能体是否会选择正确的 skill（或避免无关的 skill）？
- **合规性**：智能体在使用前是否会读取 `SKILL.md` 并遵循要求的步骤/参数？
- **工作流契约**：断言工具调用顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取以及会话接线。
- 一组小型的 skill 聚焦场景（使用 vs 避免、门控、prompt injection）。
- 仅在 CI 安全测试套件落地之后，才添加可选的 live 评估（按需启用、受环境变量门控）。

## 契约测试（plugin 和 channel 结构）

契约测试用于验证每个已注册的 plugin 和 channel 都符合其接口契约。它们会遍历所有已发现的 plugins，并运行一组关于结构和行为的断言。默认的 `pnpm test` unit 通道会有意跳过这些共享接口和冒烟文件；当你修改共享的 channel 或 provider 表面时，请显式运行契约测试命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅 channel 契约测试：`pnpm test:contracts:channels`
- 仅 provider 契约测试：`pnpm test:contracts:plugins`

### Channel 契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本 plugin 结构（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道 action 处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略强制执行

### Provider 状态契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - Plugin 注册表结构

### Provider 契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选择机制
- **catalog** - 模型目录 API
- **discovery** - Plugin 发现
- **loader** - Plugin 加载
- **runtime** - Provider 运行时
- **shape** - Plugin 结构/接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径之后
- 添加或修改 channel 或 provider plugin 之后
- 重构 plugin 注册或发现逻辑之后

契约测试会在 CI 中运行，且不需要真实 API key。

## 添加回归测试（指南）

当你修复一个在 live 中发现的 provider/model 问题时：

- 如果可能，请添加一个对 CI 安全的回归测试（mock/stub provider，或捕获精确的请求结构转换）
- 如果问题本质上只能在 live 中复现（速率限制、认证策略），请保持 live 测试足够收窄，并通过环境变量按需启用
- 优先定位到能够捕获该缺陷的最小层级：
  - provider 请求转换/重放缺陷 → 直连模型测试
  - gateway 会话/历史/工具管线缺陷 → gateway live 冒烟测试或对 CI 安全的 gateway mock 测试
- SecretRef 遍历保护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类推导一个采样目标，然后断言会拒绝 traversal-segment exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在出现未分类 target id 时故意失败，这样新类别就不会被悄悄跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
