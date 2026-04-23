---
read_when:
    - 在本地或 CI 中运行测试
    - 为 model/provider 缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每项测试涵盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-23T22:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57fce59b28490a2a1e5d434fe05ef94356d76adf4bf6d7165d03d1a05df9f3bd
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）和一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意 _不_ 覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界中的 model/provider 问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期在推送前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 现在直接指定文件路径也会路由 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代修复单个失败用例时，优先使用定向运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 运行通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或希望获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实的 provider/model 时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只运行一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫测：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一轮文本交互加一个小型文件读取式探测。元数据声明支持 `image` 输入的模型还会运行一个微型图像交互。在隔离 provider 故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 关闭这些额外探测。
  - CI 覆盖：每日运行的 `OpenClaw Scheduled Live And E2E Checks` 以及手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置 `include_live_suites: true`，其中包含按 provider 分片的独立 Docker live 模型矩阵作业。
  - 对于聚焦式 CI 重跑，可分发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号 provider 密钥添加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其定时/发布调用方中。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立命令 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 中报告的是 Moonshot/K2.6，且 assistant transcript 存储了标准化的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要接近 QA lab 真实环境时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动分发使用 mock providers 运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可手动分发，并以并行作业运行 mock parity gate、live Matrix 运行通道和由 Convex 管理的 live Telegram 运行通道。`OpenClaw Release Checks` 会在发布批准前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认会使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数，或使用 `--concurrency 1` 启用旧版串行通道。
  - 任一场景失败时以非零状态退出。如果你希望获得构件而不让退出码失败，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地 AIMock 支持的 provider 服务器，用于实验性的 fixture 和协议 mock 覆盖，但不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同一套 QA 测试套件。
  - 保持与宿主机 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的 provider/model 选择标志。
  - live 运行会转发适合访客环境的受支持 QA 凭证输入：基于环境变量的 provider 密钥、QA live provider 配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便访客环境可通过挂载的工作区回写。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏运维风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对一个 mock OpenAI 端点运行一次本地智能体交互。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同一条打包安装通道。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，在配置 OpenAI 后启动 Gateway 网关，然后通过配置编辑启用内置 channel/plugins。
  - 验证设置发现流程会让未配置插件的运行时依赖保持缺失状态，首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，第二次重启则不会重新安装已激活的依赖。
  - 还会安装一个已知较旧的 npm 基线，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 能修复内置渠道运行时依赖，而无需由测试支架侧执行 postinstall 修复。
- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的 Docker 支持 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 宿主当前仅供 repo/dev 使用。打包后的 OpenClaw 安装不会附带 `qa-lab`，因此也不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独安装插件。
  - 配置三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后启动一个 QA gateway 子进程，将真实的 Matrix 插件作为 SUT 传输层。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如需测试不同镜像，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证源标志，因为该通道会在本地配置一次性用户。
  - 在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、observed-events 构件，以及合并的 stdout/stderr 输出日志。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram chat 的数字 id。
  - 支持 `--credential-source convex` 来使用共享凭证池。默认使用 env 模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时以非零状态退出。如果你希望获得构件而不让退出码失败，请使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，且 SUT bot 需要公开 Telegram 用户名。
  - 为了稳定地观察 bot 到 bot 通信，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 可以观察群组中的 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 构件。回复类场景包含从 driver 发送请求到观察到 SUT 回复的 RTT。

live 传输通道共享一份标准契约，以避免新传输方式发生漂移：

`qa-channel` 仍然是广覆盖的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| Lane | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| ---- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x | |
| Telegram | x | | | | | | | | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取一个独占租约，在运行通道期间为该租约发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理员命令（池添加/删除/列出）必须专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

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
  - 资源耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` 必须是 Telegram chat id 的数字字符串。
- `admin/add` 会为 `kind: "telegram"` 验证此结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

将一个渠道添加到 markdown QA 系统中，严格只需要两件事：

1. 一个适用于该渠道的传输适配器。
2. 一个用于验证该渠道契约的场景包。

当共享的 `qa-lab` 宿主可以承载流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动与清理
- worker 并发
- 构件写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享 `qa` 根下
- 如何为该传输配置 gateway
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和标准化的传输状态
- 如何执行由传输支持的操作
- 如何处理传输特定的重置或清理

新渠道的最低接入标准是：

1. 保持 `qa-lab` 作为共享 `qa` 根的拥有者。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；惰性 CLI 和运行器执行应放在独立入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改造 markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 保持现有兼容别名继续可用，除非仓库正在进行有意的迁移。

决策规则非常严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖于单一渠道传输，就将它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，应添加通用辅助函数，而不是在 `suite.ts` 中添加渠道专用分支。
- 如果某个行为只对单一传输有意义，就让该场景保持传输专用，并在场景契约中明确说明。

新场景推荐使用的通用辅助函数名称是：

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
兼容别名的存在是为了避免一次性迁移日，而不是作为
新场景编写的范式。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实性逐级提升”（同时波动性/成本也逐级上升）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 下的 core/unit 清单，以及由 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯 unit 测试
  - 进程内 integration 测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定
    <AccordionGroup>
    <Accordion title="项目、分片和定向运行通道"> - 未定向的 `pnpm test` 会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这会在负载较高的机器上降低 RSS 峰值，并避免 auto-reply/extension 工作拖累无关测试套件。 - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。 - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过定向运行通道对显式文件/目录目标进行路由，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动成本。 - 当 diff 仅涉及可路由的源文件/测试文件时，`pnpm test:changed` 会将变更的 git 路径展开到相同的定向运行通道；配置/设置编辑仍会回退到更广泛的根项目重跑。 - `pnpm check:changed` 是窄范围工作的常规智能本地门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、发布元数据和工具，然后运行匹配的 typecheck/lint/test 通道。公共 Plugin SDK 和插件契约变更会包含 extension 验证，因为 extensions 依赖这些 core 契约。仅包含发布元数据版本提升的变更会运行定向 version/config/root-dependency 检查，而不是完整测试套件，并带有一个保护机制，用于拒绝顶层版本字段之外的 package 变更。 - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和类似纯工具区域的轻导入 unit 测试会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍保留在现有通道上。 - 某些选定的 `plugin-sdk` 和 `commands` helper 源文件也会在 changed 模式运行时映射到这些轻量通道中的显式同级测试，因此 helper 编辑无需为该目录重跑完整重型测试套件。 - `auto-reply` 有三个专用桶：顶层 core helpers、顶层 `reply.*` integration 测试，以及 `src/auto-reply/reply/**` 子树。这使最重的 reply harness 工作不会落到廉价的 status/chunk/token 测试上。
    </Accordion>

      <Accordion title="内嵌运行器覆盖">
        - 当你修改消息工具发现输入或压缩运行时上下文时，要同时保留两个层级的覆盖。
        - 为纯路由和标准化边界添加聚焦的 helper 回归测试。
        - 保持内嵌运行器 integration 测试套件健康：
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - 这些测试套件会验证作用域 id 和压缩行为仍会流经真实的 `run.ts` / `compact.ts` 路径；仅有 helper 测试并不能充分替代这些 integration 路径。
      </Accordion>

      <Accordion title="Vitest 池和隔离默认值">
        - 基础 Vitest 配置默认使用 `threads`。
        - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
        - 根 UI 通道保留其 `jsdom` 设置和优化器，但同样运行在共享的非隔离运行器上。
        - 每个 `pnpm test` 分片都会从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
        - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可对比原生 V8 行为。
      </Accordion>

      <Accordion title="快速本地迭代">
        - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构运行通道。
        - pre-commit hook 会在已暂存的格式化/lint 之后运行 `pnpm check:changed --staged`，因此纯 core 提交不会承担 extension 测试成本，除非它们触及面向 extension 的公共契约。仅发布元数据提交会保留在定向的 version/config/root-dependency 通道上。
        - 如果完全相同的已暂存变更集已经通过同等或更强的门禁验证，可使用 `scripts/committer --fast "<message>" <files...>` 仅跳过 changed-scope hook 重跑。已暂存格式化/lint 仍会运行。请在交接中说明已完成的门禁。这同样适用于某个孤立的 hook 波动失败在重跑后已通过且有范围化证明的情况。
        - `pnpm test:changed` 会在变更路径能够清晰映射到更小测试套件时通过定向运行通道进行路由。
        - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
        - 本地 worker 自动缩放刻意采取保守策略，当宿主负载平均值已较高时会回退，因此默认情况下多个并发 Vitest 运行造成的影响会更小。
        - 基础 Vitest 配置会将项目/配置文件标记为 `forceRerunTriggers`，因此当测试接线发生变化时，changed 模式重跑仍然正确。
        - 该配置会在受支持宿主上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；如果你希望为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。
      </Accordion>

      <Accordion title="性能调试">
        - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆分输出。
        - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来发生变更的文件。
        - 当某个热点测试的大部分时间仍消耗在启动导入上时，应将重依赖保留在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是仅为了透传给 `vi.mock(...)` 就深度导入运行时 helper。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会对该已提交 diff 上路由后的 `test:changed` 与原生根项目路径进行基准比较，并打印 wall time 和 macOS 最大 RSS。
        - `pnpm test:perf:changed:bench -- --worktree` 会通过将变更文件列表路由到 `scripts/test-projects.mjs` 和根 Vitest 配置，对当前脏工作树进行基准测试。
        - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和转换开销写入主线程 CPU profile。
        - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 测试套件写入运行器 CPU + heap profiles。
      </Accordion>
    </AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway 消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helper
  - 断言记录器保持有界、合成 RSS 采样保持在压力预算之下，并且每个会话的队列深度会回落到零
- 预期：
  - 对 CI 安全且无需密钥
  - 用于稳定性回归跟进的窄通道，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下内置插件的 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads`，并设置 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 有用的覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 接口、节点配对以及更重的网络行为
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比 unit 测试涉及更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范化文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和一个可工作的 Docker 守护进程
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙箱
- 有用的覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认的 CLI 二进制文件或包装脚本

### Live（真实 provider + 真实 model）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下内置插件的 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个 provider/model 用真实凭证在 _今天_ 是否真的可用？”
  - 捕获 provider 格式变更、工具调用怪异行为、认证问题和速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实 provider 策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围的子集，而不是“一切都跑”
- live 运行会读取 `~/.profile` 来获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将 config/auth 材料复制到临时测试 home 中，这样 unit fixture 就不会修改你真实的 `~/.openclaw`。
- 仅当你明确需要让 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 gateway 引导日志/Bonjour 杂音。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（provider 专用）：设置 `*_API_KEYS`，使用逗号/分号格式，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 进行每个 live 运行的单独覆盖；测试会在收到速率限制响应时重试。
- 进度/心跳输出：
  - live 测试套件现在会将进度行输出到 stderr，这样即使 Vitest 控制台捕获较安静，长时间的 provider 调用也能明显显示仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此 provider/gateway 进度行会在 live 运行期间立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model 心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/probe 心跳。

## 我应该运行哪个测试套件？

使用这张决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动很多，也运行 `pnpm test:coverage`）
- 涉及 gateway 网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了” / provider 专用故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## Live：Android 节点能力扫测

- 测试：`src/gateway/android-node.capabilities.live.test.ts`
- 脚本：`pnpm android:test:integration`
- 目标：调用已连接 Android 节点当前**声明的每一条命令**，并断言命令契约行为。
- 范围：
  - 带有前置条件的手动设置（该测试套件不会安装/运行/配对应用）。
  - 针对所选 Android 节点逐命令验证 gateway `node.invoke`。
- 必需的预设置：
  - Android 应用已连接并与 gateway 配对。
  - 应用保持在前台。
  - 对于你期望通过的能力，相关权限/捕获同意已授予。
- 可选目标覆盖项：
  - `OPENCLAW_ANDROID_NODE_ID` 或 `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- 完整 Android 设置详情：[Android App](/zh-CN/platforms/android)

## Live：model 冒烟测试（profile keys）

live 测试分为两层，以便我们隔离故障：

- “Direct model” 告诉我们 provider/model 在给定密钥下是否至少能响应。
- “Gateway smoke” 告诉我们该 model 的完整 gateway + 智能体管道是否可用（会话、历史记录、工具、沙箱策略等）。

### 第 1 层：Direct model completion（无 gateway）

- 测试：`src/agents/models.profiles.live.test.ts`
- 目标：
  - 枚举已发现的模型
  - 使用 `getApiKeyForModel` 选择你拥有凭证的模型
  - 为每个模型运行一次小型 completion（并在需要时运行定向回归）
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 设置 `OPENCLAW_LIVE_MODELS=modern`（或 `all`，它是 modern 的别名）后才会真正运行此测试套件；否则它会跳过，以便让 `pnpm test:live` 聚焦于 Gateway 网关冒烟测试
- 如何选择模型：
  - `OPENCLAW_LIVE_MODELS=modern` 运行现代 allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` 是现代 allowlist 的别名
  - 或 `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（逗号分隔的 allowlist）
  - modern/all 扫测默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_MAX_MODELS=0` 可执行完整的 modern 扫测，或设置正数以使用更小上限。
- 如何选择提供商：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（逗号分隔的 allowlist）
- 密钥来源：
  - 默认：profile store 和环境变量回退值
  - 设置 `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制**仅使用 profile store**
- 存在原因：
  - 将“provider API 坏了 / 密钥无效”与“gateway 智能体管道坏了”分离开来
  - 承载小而隔离的回归测试（例如：OpenAI Responses/Codex Responses 推理重放 + 工具调用流程）

### 第 2 层：Gateway 网关 + dev 智能体冒烟测试（即 “@openclaw” 实际在做什么）

- 测试：`src/gateway/gateway-models.profiles.live.test.ts`
- 目标：
  - 启动一个进程内 gateway
  - 创建/修补一个 `agent:dev:*` 会话（每次运行按模型覆盖）
  - 迭代有密钥的模型并断言：
    - “有意义”的响应（无工具）
    - 一次真实工具调用可用（读取探测）
    - 可选的额外工具探测（exec+read 探测）
    - OpenAI 回归路径（仅工具调用 → 后续跟进）仍然可用
- 探测细节（这样你能快速解释失败）：
  - `read` 探测：测试会在工作区写入一个 nonce 文件，并要求智能体 `read` 该文件并回显 nonce。
  - `exec+read` 探测：测试会要求智能体通过 `exec` 将 nonce 写入一个临时文件，然后再 `read` 读回。
  - image 探测：测试会附加一个生成的 PNG（猫 + 随机代码），并期望模型返回 `cat <CODE>`。
  - 实现参考：`src/gateway/gateway-models.profiles.live.test.ts` 和 `src/gateway/live-image-probe.ts`。
- 启用方式：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
- 如何选择模型：
  - 默认：现代 allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` 是现代 allowlist 的别名
  - 或设置 `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（或逗号列表）以缩小范围
  - modern/all Gateway 网关扫测默认使用精心挑选的高信号上限；设置 `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` 可执行完整的 modern 扫测，或设置正数以使用更小上限。
- 如何选择提供商（避免“OpenRouter 全都测”）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（逗号分隔的 allowlist）
- 在这个 live 测试中，工具 + 图像探测始终开启：
  - `read` 探测 + `exec+read` 探测（工具压力测试）
  - 当模型声明支持图像输入时，会运行 image 探测
  - 流程（高层）：
    - 测试会生成一个带有 “CAT” + 随机代码的小 PNG（`src/gateway/live-image-probe.ts`）
    - 通过 `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 发送
    - Gateway 网关会将附件解析到 `images[]`（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 内嵌智能体将多模态用户消息转发给模型
    - 断言：回复包含 `cat` + 该代码（OCR 容错：允许轻微错误）

提示：如需查看你的机器上可以测试什么（以及确切的 `provider/model` id），请运行：

```bash
openclaw models list
openclaw models list --json
```

## Live：CLI 后端冒烟测试（Claude、Codex、Gemini 或其他本地 CLI）

- 测试：`src/gateway/gateway-cli-backend.live.test.ts`
- 目标：在不触碰默认配置的情况下，使用本地 CLI 后端验证 Gateway 网关 + 智能体管道。
- 后端专用的冒烟测试默认值位于所属 extension 的 `cli-backend.ts` 定义中。
- 启用：
  - `pnpm test:live`（或在直接调用 Vitest 时设置 `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 默认值：
  - 默认 provider/model：`claude-cli/claude-sonnet-4-6`
  - command/args/image 行为来自所属 CLI 后端插件元数据。
- 覆盖项（可选）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 用于发送真实图像附件（路径会注入到提示中）。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` 用于通过 CLI 参数传递图像文件路径，而不是注入到提示中。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（或 `"list"`）用于控制在设置 `IMAGE_ARG` 时如何传递图像参数。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` 用于发送第二轮并验证恢复流程。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` 用于禁用默认的 Claude Sonnet -> Opus 同会话连续性探测（当所选模型支持切换目标时，设置为 `1` 可强制启用）。

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

单 provider Docker 配方：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

说明：

- Docker 运行器位于 `scripts/test-live-cli-backend-docker.sh`。
- 它会在仓库 Docker 镜像中以非 root 的 `node` 用户身份运行 live CLI-backend 冒烟测试。
- 它会从所属 extension 中解析 CLI 冒烟测试元数据，然后将匹配的 Linux CLI 包（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）安装到缓存的可写前缀 `OPENCLAW_DOCKER_CLI_TOOLS_DIR` 中（默认值：`~/.cache/openclaw/docker-cli-tools`）。
- `pnpm test:docker:live-cli-backend:claude-subscription` 需要便携式 Claude Code 订阅 OAuth，可通过 `~/.claude/.credentials.json` 中的 `claudeAiOauth.subscriptionType` 或来自 `claude setup-token` 的 `CLAUDE_CODE_OAUTH_TOKEN` 提供。它会先在 Docker 中验证直接 `claude -p`，然后在不保留 Anthropic API 密钥环境变量的情况下运行两轮 Gateway 网关 CLI-backend 交互。这个订阅通道默认禁用 Claude MCP/tool 和 image 探测，因为 Claude 目前会将第三方应用使用路由到额外用量计费，而不是普通订阅计划限制。
- live CLI-backend 冒烟测试现在会为 Claude、Codex 和 Gemini 执行相同的端到端流程：文本轮次、图像分类轮次，然后通过 gateway CLI 验证 MCP `cron` 工具调用。
- Claude 的默认冒烟测试还会将会话从 Sonnet 修补为 Opus，并验证恢复后的会话仍记得较早的备注。

## Live：ACP 绑定冒烟测试（`/acp spawn ... --bind here`）

- 测试：`src/gateway/gateway-acp-bind.live.test.ts`
- 目标：使用 live ACP 智能体验证真实 ACP 会话绑定流程：
  - 发送 `/acp spawn <agent> --bind here`
  - 就地绑定一个合成的消息渠道会话
  - 在同一会话上发送正常的后续消息
  - 验证该后续消息落入已绑定的 ACP 会话 transcript 中
- 启用：
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 默认值：
  - Docker 中的 ACP 智能体：`claude,codex,gemini`
  - 直接运行 `pnpm test:live ...` 时的 ACP 智能体：`claude`
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
  - 该通道使用 gateway `chat.send` 接口，并带有仅管理员可用的合成 originating-route 字段，因此测试可以附加消息渠道上下文，而无需假装进行外部投递。
  - 当未设置 `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` 时，测试会为所选 ACP harness 智能体使用内嵌 `acpx` 插件的内置智能体注册表。

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
- 默认情况下，它会按顺序针对所有受支持的 live CLI 智能体运行 ACP 绑定冒烟测试：`claude`、`codex`，然后是 `gemini`。
- 使用 `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` 或 `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` 可缩小矩阵范围。
- 它会读取 `~/.profile`，将匹配的 CLI 认证材料暂存到容器中，将 `acpx` 安装到一个可写 npm 前缀中，然后在缺失时安装所请求的 live CLI（`@anthropic-ai/claude-code`、`@openai/codex` 或 `@google/gemini-cli`）。
- 在 Docker 内部，运行器会设置 `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`，这样 acpx 能让从已读取 profile 获取的 provider 环境变量继续对其子 harness CLI 可用。

## Live：Codex app-server harness 冒烟测试

- 目标：通过正常 gateway
  `agent` 方法验证由插件拥有的 Codex harness：
  - 加载内置 `codex` 插件
  - 选择 `OPENCLAW_AGENT_RUNTIME=codex`
  - 向 `openai/gpt-5.5` 发送第一轮 gateway 智能体请求，并强制使用 Codex harness
  - 向同一个 OpenClaw 会话发送第二轮请求，并验证 app-server 线程可以恢复
  - 通过同一个 gateway 命令路径运行 `/codex status` 和 `/codex models`
  - 可选地运行两个经 Guardian 审核的提权 shell 探测：一个应被批准的无害命令，以及一个应被拒绝的伪造密钥上传，从而让智能体反问用户
- 测试：`src/gateway/gateway-codex-harness.live.test.ts`
- 启用：`OPENCLAW_LIVE_CODEX_HARNESS=1`
- 默认模型：`openai/gpt-5.5`
- 可选 image 探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 可选 MCP/tool 探测：`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 可选 Guardian 探测：`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- 该冒烟测试会设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，因此损坏的 Codex harness 不能通过静默回退到 Pi 而侥幸通过。
- 认证：来自 shell/profile 的 `OPENAI_API_KEY`，加上可选复制的
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
- 它会读取已挂载的 `~/.profile`，传递 `OPENAI_API_KEY`，在存在时复制 Codex CLI 认证文件，将 `@openai/codex` 安装到一个可写的挂载 npm 前缀中，暂存源代码树，然后只运行 Codex-harness live 测试。
- Docker 默认启用 image、MCP/tool 和 Guardian 探测。当你需要更窄的调试运行时，可设置
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` 或
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`。
- Docker 还会导出 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`，与 live
  测试配置保持一致，因此旧别名或 Pi 回退无法掩盖 Codex harness
  回归问题。

### 推荐的 live 配方

范围窄、显式的 allowlist 最快且最不易波动：

- 单模型，direct（无 gateway）：
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 单模型，Gateway 网关冒烟测试：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 跨多个 provider 的工具调用：
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 聚焦（Gemini API key + Antigravity）：
  - Gemini（API key）：`OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）：`OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

说明：

- `google/...` 使用 Gemini API（API key）。
- `google-antigravity/...` 使用 Antigravity OAuth bridge（Cloud Code Assist 风格的智能体端点）。
- `google-gemini-cli/...` 使用你机器上的本地 Gemini CLI（单独的认证 + 工具行为差异）。
- Gemini API 与 Gemini CLI：
  - API：OpenClaw 通过 HTTP 调用 Google 托管的 Gemini API（API key / profile 认证）；这通常就是大多数用户所说的 “Gemini”。
  - CLI：OpenClaw 会调用本地 `gemini` 二进制；它有自己的认证方式，并且行为可能不同（流式传输/工具支持/版本偏差）。

## Live：model 矩阵（我们覆盖什么）

没有固定的“CI model 列表”（live 是按需启用的），但以下是在拥有密钥的开发机器上建议定期覆盖的**推荐**模型。

### 现代冒烟测试集（工具调用 + 图像）

这是我们期望持续保持可用的“常见模型”运行集合：

- OpenAI（非 Codex）：`openai/gpt-5.5`（可选：`openai/gpt-5.4-mini`）
- OpenAI Codex OAuth：`openai/gpt-5.5`（`openai-codex/gpt-*` 仍是旧版别名）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）：`google/gemini-3.1-pro-preview` 和 `google/gemini-3-flash-preview`（避免较旧的 Gemini 2.x 模型）
- Google（Antigravity）：`google-antigravity/claude-opus-4-6-thinking` 和 `google-antigravity/gemini-3-flash`
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

运行带工具 + 图像的 Gateway 网关冒烟测试：
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### 基线：工具调用（Read + 可选 Exec）

每个 provider 家族至少选一个：

- OpenAI：`openai/gpt-5.5`（或 `openai/gpt-5.4-mini`）
- Anthropic：`anthropic/claude-opus-4-6`（或 `anthropic/claude-sonnet-4-6`）
- Google：`google/gemini-3-flash-preview`（或 `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）：`zai/glm-4.7`
- MiniMax：`minimax/MiniMax-M2.7`

可选的额外覆盖（有更好，没有也行）：

- xAI：`xai/grok-4`（或最新可用版本）
- Mistral：`mistral/`…（选择一个你已启用、支持工具的模型）
- Cerebras：`cerebras/`…（如果你有访问权限）
- LM Studio：`lmstudio/`…（本地；工具调用取决于 API 模式）

### Vision：图像发送（附件 → 多模态消息）

在 `OPENCLAW_LIVE_GATEWAY_MODELS` 中至少包含一个支持图像的模型（Claude/Gemini/OpenAI 的支持视觉的变体等），以触发 image 探测。

### 聚合器 / 替代 Gateway 网关

如果你启用了相关密钥，我们也支持通过以下方式测试：

- OpenRouter：`openrouter/...`（数百个模型；使用 `openclaw models scan` 查找支持工具 + 图像的候选）
- OpenCode：`opencode/...` 用于 Zen，`opencode-go/...` 用于 Go（通过 `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 认证）

如果你有凭证/配置，还可以将更多 provider 纳入 live 矩阵：

- 内置：`openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- 通过 `models.providers`（自定义端点）：`minimax`（云/API），以及任何兼容 OpenAI/Anthropic 的代理（LM Studio、vLLM、LiteLLM 等）

提示：不要试图在文档中硬编码“所有模型”。权威列表应以你机器上 `discoverModels(...)` 返回的结果 + 可用密钥为准。

## 凭证（切勿提交）

live 测试发现凭证的方式与 CLI 相同。实际含义如下：

- 如果 CLI 可用，live 测试应能找到同样的密钥。
- 如果 live 测试提示 “no creds”，请像调试 `openclaw models list` / 模型选择那样进行调试。

- 每个智能体的认证 profile：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（这就是 live 测试中 “profile keys” 的含义）
- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 旧版状态目录：`~/.openclaw/credentials/`（存在时会复制到已暂存的 live home 中，但它不是主 profile-key 存储）
- 本地 live 运行默认会将当前活动配置、每个智能体的 `auth-profiles.json` 文件、旧版 `credentials/` 以及受支持的外部 CLI 认证目录复制到一个临时测试 home 中；已暂存的 live home 会跳过 `workspace/` 和 `sandboxes/`，并移除 `agents.*.workspace` / `agentDir` 路径覆盖，以便探测不会触及你真实宿主上的工作区。

如果你想依赖环境变量密钥（例如在你的 `~/.profile` 中导出的密钥），请在运行本地测试前先执行 `source ~/.profile`，或使用下面的 Docker 运行器（它们可以将 `~/.profile` 挂载到容器中）。

## Deepgram live（音频转录）

- 测试：`extensions/deepgram/audio.live.test.ts`
- 启用：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus（国际版） coding plan live

- 测试：`extensions/byteplus/live.test.ts`
- 启用：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 可选模型覆盖：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- 测试：`extensions/comfy/comfy.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 范围：
  - 覆盖内置 comfy 图像、视频和 `music_generate` 路径
  - 若未配置 `models.providers.comfy.<capability>`，则跳过对应能力
  - 在修改 comfy workflow 提交、轮询、下载或插件注册之后很有用

## 图像生成 live

- 测试：`test/image-generation.runtime.live.test.ts`
- 命令：`pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness：`pnpm test:live:media image`
- 范围：
  - 枚举每个已注册的图像生成 provider 插件
  - 在探测前从你的登录 shell（`~/.profile`）加载缺失的 provider 环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的 auth profile，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用 auth/profile/model 的 provider
  - 通过共享运行时能力运行标准图像生成变体：
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 当前覆盖的内置 provider：
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- 可选缩小范围：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile store 认证并忽略仅环境变量提供的覆盖项

## 音乐生成 live

- 测试：`extensions/music-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media music`
- 范围：
  - 覆盖共享的内置音乐生成 provider 路径
  - 当前覆盖 Google 和 MiniMax
  - 在探测前从你的登录 shell（`~/.profile`）加载 provider 环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的 auth profile，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用 auth/profile/model 的 provider
  - 在可用时运行两个已声明的运行时模式：
    - 使用仅提示词输入的 `generate`
    - 当 provider 声明 `capabilities.edit.enabled` 时运行 `edit`
  - 当前共享通道覆盖：
    - `google`：`generate`、`edit`
    - `minimax`：`generate`
    - `comfy`：单独的 Comfy live 文件，不在这个共享扫测中
- 可选缩小范围：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile store 认证并忽略仅环境变量提供的覆盖项

## 视频生成 live

- 测试：`extensions/video-generation-providers.live.test.ts`
- 启用：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness：`pnpm test:live:media video`
- 范围：
  - 覆盖共享的内置视频生成 provider 路径
  - 默认使用对发布安全的冒烟测试路径：非 FAL provider、每个 provider 一次 text-to-video 请求、时长一秒的龙虾提示词，以及来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每个 provider 操作上限（默认 `180000`）
  - 默认跳过 FAL，因为 provider 侧队列延迟可能主导发布时间；传入 `--video-providers fal` 或 `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` 可显式运行它
  - 在探测前从你的登录 shell（`~/.profile`）加载 provider 环境变量
  - 默认优先使用 live/env API 密钥，而不是已存储的 auth profile，因此 `auth-profiles.json` 中过期的测试密钥不会掩盖真实 shell 凭证
  - 跳过没有可用 auth/profile/model 的 provider
  - 默认仅运行 `generate`
  - 设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 后，还会在可用时运行已声明的变换模式：
    - 当 provider 声明 `capabilities.imageToVideo.enabled`，且所选 provider/model 在共享扫测中接受基于 buffer 的本地图像输入时，运行 `imageToVideo`
    - 当 provider 声明 `capabilities.videoToVideo.enabled`，且所选 provider/model 在共享扫测中接受基于 buffer 的本地视频输入时，运行 `videoToVideo`
  - 当前在共享扫测中已声明但被跳过的 `imageToVideo` provider：
    - `vydra`，因为内置 `veo3` 仅支持文本，而内置 `kling` 需要远程图像 URL
  - provider 专用的 Vydra 覆盖：
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - 该文件会运行 `veo3` text-to-video，以及一个默认使用远程图像 URL fixture 的 `kling` 通道
  - 当前 `videoToVideo` live 覆盖：
    - 仅 `runway`，且所选模型为 `runway/gen4_aleph` 时
  - 当前在共享扫测中已声明但被跳过的 `videoToVideo` provider：
    - `alibaba`、`qwen`、`xai`，因为这些路径当前需要远程 `http(s)` / MP4 参考 URL
    - `google`，因为当前共享 Gemini/Veo 通道使用基于本地 buffer 的输入，而共享扫测不接受该路径
    - `openai`，因为当前共享通道缺乏组织专用的视频修补/重混访问保证
- 可选缩小范围：
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` 可在默认扫测中包含所有 provider，包括 FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` 可为激进的冒烟测试运行降低每个 provider 的操作上限
- 可选认证行为：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 可强制使用 profile store 认证并忽略仅环境变量提供的覆盖项

## 媒体 live harness

- 命令：`pnpm test:live:media`
- 目的：
  - 通过一个原生于仓库的统一入口运行共享的图像、音乐和视频 live 测试套件
  - 自动从 `~/.profile` 加载缺失的 provider 环境变量
  - 默认自动将每个测试套件缩小到当前具有可用认证的 provider
  - 复用 `scripts/test-live.mjs`，因此心跳和安静模式行为保持一致
- 示例：
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live-model 运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行与之匹配的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（若已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用较小的冒烟测试上限，以保持完整 Docker 扫测的可行性：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确希望执行更大的完整扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，然后在两个 live Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在验证已构建应用的 E2E 容器冒烟测试运行器中复用它。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的 integration 路径。

live-model Docker 运行器还会仅绑定挂载所需的 CLI 认证 home（如果运行未缩小范围，则挂载所有受支持的认证 home），然后在运行前将它们复制到容器 home 中，以便外部 CLI OAuth 可以刷新令牌而不修改宿主认证存储：

- Direct model：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，默认再配置 Telegram，验证启用插件时会按需安装其运行时依赖，运行 doctor，并执行一次 mock OpenAI 智能体轮次。可使用 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主重建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前代码树，在隔离的 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回的是内置图像 provider，而不是挂起。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。update 冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。非 root 安装器检查会保持一个隔离的 npm 缓存，以防 root 所有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑时复用 root/update/direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要覆盖直接 `npm install -g` 时，请在本地运行该脚本且不要设置此环境变量。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会让一个 mock OpenAI 服务器经过 Gateway 网关运行，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制 provider schema 拒绝并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（预置 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 内嵌 Pi profile allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 独立 cron 和一次性 subagent 运行后的 stdio MCP 子进程清理）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试 + `/plugin` 别名 + Claude-bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在刚完成本地构建后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主重建，或通过 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。
- 在迭代时，可通过禁用无关场景来缩小内置插件运行时依赖测试范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享的 built-app 镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，套件专用的镜像覆盖项（如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`）仍然具有更高优先级。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未存在于本地，脚本会将其拉取。QR 和安装器 Docker 测试保留它们自己的 Dockerfile，因为它们验证的是打包/安装行为，而不是共享的 built-app 运行时。

live-model Docker 运行器还会将当前检出以只读方式绑定挂载，并在容器内暂存到临时工作目录中。这样可以在保持运行时镜像精简的同时，仍使用你本地确切的源代码/配置运行 Vitest。暂存步骤会跳过大型的本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker live 运行不会花费数分钟复制机器专用构件。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，以便 gateway live 探测不会在容器中启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要在该 Docker 通道中缩小或排除 gateway live 覆盖范围时，也请一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw gateway 容器，针对该 gateway 启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一条真实聊天请求。
首次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
该通道需要一个可用的 live model 密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意保持确定性，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个预置 Gateway 网关容器，再启动第二个容器来运行 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该冒烟测试验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露了什么。
`test:docker:pi-bundle-mcp-tools` 具有确定性，不需要 live model 密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，通过内嵌 Pi bundle MCP 运行时实例化该服务器，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 具有确定性，不需要 live model 密钥。它会启动一个带有真实 stdio MCP 探测服务器的预置 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子进程轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。它未来可能再次用于 ACP 线程路由验证，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于验证仅来自 `OPENCLAW_PROFILE_FILE` 的环境变量，使用临时 config/workspace 目录且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小 provider 范围的运行只会挂载根据 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或逗号列表手动覆盖，例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重建时复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile store（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 gateway 为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定版本的 Open WebUI 镜像标签

## 文档完整性检查

修改文档后运行文档检查：`pnpm check:docs`。
当你还需要页面内标题检查时，运行完整的 Mintlify anchor 验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是在没有真实 provider 的情况下进行的“真实管道”回归测试：

- Gateway 网关工具调用（mock OpenAI、真实 gateway + 智能体循环）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全、行为类似“智能体可靠性评估”的测试：

- 通过真实 gateway + 智能体循环进行 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍然缺少：

- **决策能力：** 当提示中列出 Skills 时，智能体是否会选择正确的 skill（或避开不相关的 skill）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循必需的步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 使用 mock provider 的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦于 skill 的场景（使用 vs 避免、门控、提示注入）。
- 仅在对 CI 安全的测试套件就位之后，才添加可选的 live 评估（按需启用、由环境变量控制）。

## 契约测试（插件和渠道形态）

契约测试用于验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组关于形态和行为的断言。默认的 `pnpm test` unit 通道会刻意跳过这些共享接缝和冒烟测试文件；当你修改共享渠道或 provider 接口时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形态（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略强制执行

### provider 状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形态

### provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - provider 运行时
- **shape** - 插件形态/接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径之后
- 添加或修改渠道或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指导）

当你修复一个在 live 中发现的 provider/model 问题时：

- 如果可能，添加一个对 CI 安全的回归测试（mock/stub provider，或捕获精确的请求形态转换）
- 如果问题天然只能通过 live 复现（速率限制、认证策略），则让 live 测试保持范围窄，并通过环境变量按需启用
- 优先瞄准能捕获该缺陷的最小层级：
  - provider 请求转换/重放缺陷 → direct model 测试
  - gateway 会话/历史记录/工具管道缺陷 → gateway live 冒烟测试或对 CI 安全的 gateway mock 测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言会拒绝 traversal-segment exec id。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时故意失败，以确保新类别不会被静默跳过。
