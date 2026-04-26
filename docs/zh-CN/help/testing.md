---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每项测试所涵盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-26T00:39:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c235193ed82e20739522cc9571408de804382c38d1b97b22c5aa70153cc23054
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时），以及一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件涵盖什么内容（以及它刻意**不**涵盖的内容）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- 实时测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（预期在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 现在直接针对文件的运行也支持 extension / channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代修复单个失败用例时，优先使用定向运行。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或希望获得更高信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型扫描：`pnpm test:docker:live-models`
  - 现在每个选定模型都会运行一次文本轮次以及一次小型文件读取式探测。元数据声明支持 `image` 输入的模型还会运行一次小型图像轮次。在隔离提供商故障时，可使用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的实时 / E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker 实时模型矩阵任务。
  - 若需定向重跑 CI，可派发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 与 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其定时 / 发布调用工作流中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Docker 中针对 Codex app-server 路径运行一个实时测试通道，使用 `/codex bind` 绑定一个合成的 Slack 私信，执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件均通过原生插件绑定路由，而不是 ACP。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 这是针对消息渠道救援命令表面的可选双重保险检查。它会执行 `/crestodian status`，排队一个持久模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH` 上提供一个伪造的 Claude CLI，验证模糊 planner 回退会转换为带审计的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从一个空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup / model / agent / Discord 插件 + SecretRef 写入，验证配置，并检查审计条目。相同的 Ring 0 设置路径也会在 QA Lab 中通过 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立命令 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot / K2.6，并且助手转录存储了标准化的 `usage.cost`。

提示：当你只需要处理一个失败用例时，优先使用下文描述的 allowlist 环境变量来缩小实时测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实性时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动派发并使用模拟提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可手动派发，其中并行运行模拟 parity gate、实时 Matrix 通道，以及由 Convex 管理的实时 Telegram 通道。`OpenClaw Release Checks` 会在发布审批前运行相同通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认情况下，会使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发度为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整工作进程数，或使用 `--concurrency 1` 切换为旧的串行通道。
  - 任一场景失败时，以非零状态码退出。若你希望生成产物但不以失败退出码结束，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地的 AIMock 支持的提供商服务器，用于实验性 fixture 和协议模拟覆盖，而不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 保持与宿主机上 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - 实时运行会转发适合访客机使用的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便访客机可以通过挂载的工作区写回。
  - 会在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告、摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于面向操作人员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对模拟的 OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行同一条打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 在 Docker 中运行一个针对嵌入式运行时上下文转录的确定性已构建应用冒烟测试。它会验证隐藏的 OpenClaw 运行时上下文被持久化为不可显示的自定义消息，而不会泄漏到可见的用户轮次中；然后植入一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前分支并保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 通道，并将该已安装包作为被测 Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI / 发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道公开为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，在已配置 OpenAI 的情况下启动 Gateway 网关，然后通过配置编辑启用内置 channel / plugins。
  - 验证设置发现流程会让未配置插件的运行时依赖保持缺失状态，第一次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖，而第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知的较旧 npm 基线版本，在运行 `openclaw update --tag <candidate>` 前启用 Telegram，并验证候选版本的更新后 doctor 会修复内置 channel 的运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 访客机中运行原生打包安装更新冒烟测试。每个选定平台会先安装请求的基线包，然后在同一访客机中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪情况，以及一次本地智能体轮次。
  - 在迭代单个访客机时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要产物路径和每条通道状态。
  - 使用宿主机超时包装长时间本地运行，以防 Parallels 传输卡住而耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*`。在认定外层包装器卡住之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动访客机上，Windows 更新可能会在更新后的 doctor / 运行时依赖修复阶段耗时 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这仍然属于健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能在快照恢复、包服务或访客机 Gateway 网关状态上发生冲突。
  - 更新后的验证会运行常规的内置插件表面，因为语音、图像生成和媒体理解等能力门面是通过内置运行时 API 加载的，即使智能体轮次本身只检查简单的文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。
  - 这个 QA 宿主目前仅用于仓库 / 开发环境。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独的插件安装步骤。
  - 预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个以真实 Matrix 插件作为 SUT 传输层的 QA gateway 子进程。
  - 默认使用固定稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试不同镜像时，可使用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地预配一次性用户。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、observed-events 产物，以及合并后的 stdout / stderr 输出日志。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败信息中会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT 机器人令牌，针对真实私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是 Telegram 聊天的数字 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败时，以非零状态码退出。若你希望生成产物但不以失败退出码结束，请使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同机器人，且 SUT 机器人需要公开 Telegram 用户名。
  - 为了稳定地观察机器人之间的通信，请在 `@BotFather` 中为两个机器人都启用 Bot-to-Bot Communication Mode，并确保 driver 机器人可以观察群组中的机器人流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 产物。回复类场景还包含从 driver 发送请求到观察到 SUT 回复的 RTT。

实时传输通道共享同一个标准契约，因此新增传输协议时不会发生漂移：

`qa-channel` 仍然是广泛的合成 QA 测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | Mention gating | Allowlist block | 顶层回复 | 重启恢复 | 线程后续跟进 | 线程隔离 | 反应观察 | 帮助命令 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取一个独占租约，在通道运行期间对该租约发送心跳，并在关闭时释放该租约。

参考的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

所需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 针对所选角色的一个密钥：
  - `maintainer` 使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 使用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选的追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

在正常运行中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列表）必须明确使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor`，以检查 Convex site URL、broker 密钥、端点前缀、HTTP 超时，以及 admin / list 可达性，同时不打印密钥值。在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` 必须是 Telegram 聊天数字 id 的字符串形式。
- `admin/add` 会对 `kind: "telegram"` 校验该结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

要将一个渠道加入基于 Markdown 的 QA 系统，必须且只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

当共享的 `qa-lab` 宿主可以承载流程时，不要新增顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动与清理
- 工作进程并发
- 产物写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根命令之下
- 如何为该传输协议配置 gateway
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露转录和标准化的传输状态
- 如何执行由传输支持的操作
- 如何处理传输专属的重置或清理

新渠道的最低接入门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根命令的所有者。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输专属机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个竞争性的根命令。  
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。保持 `runtime-api.ts` 轻量；延迟 CLI 和运行器执行应保留在单独的入口点之后。
5. 在按主题划分的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则保持现有兼容别名继续可用。

决策规则非常严格：

- 如果某种行为可以在 `qa-lab` 中统一表达一次，就把它放在 `qa-lab`。
- 如果某种行为依赖单一渠道传输，就将它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，应添加通用辅助函数，而不是在 `suite.ts` 中加入渠道专属分支。
- 如果某种行为只对单一传输有意义，就让场景保持传输专属，并在场景契约中明确说明。

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
兼容别名的存在是为了避免一次性迁移，不应作为新场景编写的范式。

## 测试套件（各自在哪里运行）

可以把这些测试套件理解为“真实性逐步提升”（同时波动性 / 成本也逐步升高）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：非定向运行使用 `vitest.full-*.config.ts` 分片集合，并且为了并行调度，可能会将多项目分片展开为按项目划分的配置
- 文件：核心 / 单元测试清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（gateway 凭证、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和定向通道">

    - 非定向的 `pnpm test` 会运行 12 个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply / extension 工作拖慢无关测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过定向通道处理显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免承担完整根项目启动开销。
    - 当差异只涉及可路由的源码 / 测试文件时，`pnpm test:changed` 会将变更的 git 路径展开到相同的定向通道中；配置 / setup 编辑仍会回退到广泛的根项目重跑。
    - `pnpm check:changed` 是窄范围工作时常规的智能本地门禁。它会将差异分类为 core、core tests、extensions、extension tests、apps、docs、release metadata 和 tooling，然后运行匹配的 typecheck / lint / test 通道。公开 Plugin SDK 和插件契约变更会额外包含一次 extension 校验，因为 extensions 依赖这些核心契约。仅发布元数据的版本提升会运行定向的版本 / 配置 / 根依赖检查，而不是完整测试套件，并带有一个防护，拒绝除顶层版本字段之外的 package 更改。
    - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件则保留在现有通道中。
    - 部分选定的 `plugin-sdk` 和 `commands` 辅助源码文件，也会在 changed 模式运行时映射到这些轻量通道中的显式同级测试，因此辅助函数编辑不需要为该目录重跑完整的重型测试套件。
    - `auto-reply` 为顶层 core 辅助函数、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树提供了专用分桶。CI 还会将 reply 子树进一步拆分为 agent-runner、dispatch 以及 commands / state-routing 分片，这样某一个导入较重的分桶就不会独占整个 Node 收尾阶段。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖范围">

    - 当你修改消息工具发现输入或压缩运行时上下文时，请同时保留两个层级的覆盖。
    - 为纯路由和标准化边界添加聚焦的辅助函数回归测试。
    - 保持嵌入式运行器集成测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件会验证作用域 id 和压缩行为仍然流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试并不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定设置 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` setup 和优化器，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个差异触发了哪些架构通道。
    - pre-commit 钩子仅负责格式化。它会重新暂存格式化后的文件，不会运行 lint、typecheck 或测试。
    - 在交接或推送前，当你需要智能本地门禁时，请显式运行 `pnpm check:changed`。公开 Plugin SDK 和插件契约变更会包含一次 extension 校验。
    - 当变更路径可以清晰映射到更小的测试套件时，`pnpm test:changed` 会通过定向通道进行路由。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
    - 本地 worker 自动缩放有意保持保守；当宿主机负载平均值已经较高时会主动回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
    - 基础 Vitest 配置会将项目 / 配置文件标记为 `forceRerunTriggers`，从而保证测试接线变更时 changed 模式重跑仍然正确。
    - 配置会在受支持宿主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个明确缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆解输出。
    - `pnpm test:perf:imports:changed` 会将相同的性能分析视图限定到自 `origin/main` 以来变更的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。整套配置运行使用配置路径作为键；include-pattern CI 分片会附加分片名称，以便单独跟踪过滤后的分片。
    - 当某个热点测试的大部分时间仍耗费在启动导入上时，请将重型依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了传给 `vi.mock(...)` 就深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将定向的 `test:changed` 与该已提交差异的原生根项目路径进行比较，并输出总耗时以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前未提交工作树的变更文件列表进行路由并做基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动与转换开销写出主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出运行器 CPU + 堆 profile。

  </Accordion>
</AccordionGroup>

### 稳定性（gateway）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway 消息、memory 和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性包持久化辅助函数
  - 断言记录器保持有界、合成 RSS 采样保持在压力预算之下，并且每个会话的队列深度会回落到零
- 预期：
  - CI 安全且无需密钥
  - 这是用于稳定性回归跟进的窄范围通道，不可替代完整 Gateway 网关测试套件

### E2E（gateway 冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 且 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 gateway 端到端行为
  - WebSocket / HTTP 表面、节点配对以及更重的网络交互
- 预期：
  - 会在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell gateway
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证远端规范化的文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 以及可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向非默认 CLI 二进制或包装脚本

### 实时（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件实时测试
- 默认值：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在今天配合真实凭证是否真的可用？”
  - 捕获提供商格式变更、工具调用怪异行为、认证问题和限流行为
- 预期：
  - 按设计并非 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围后的子集，而不是“全部”
- 实时运行会加载 `~/.profile`，以补齐缺失的 API key。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 只有在你有意让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静默 gateway 启动日志 / Bonjour 杂讯。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可通过 `OPENCLAW_LIVE_*_KEY` 进行每次实时运行覆盖；测试会在收到限流响应时重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，长时间的提供商调用也能明显显示仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商 / gateway 进度行在实时运行期间会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway / 探测心跳。

## 我应该运行哪个测试套件？

使用下表进行判断：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果改动很多，再加上 `pnpm test:coverage`）
- 触及 gateway 网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商专属故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时（会触网）测试

关于实时模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex app-server
harness，以及所有媒体提供商实时测试（Deepgram、BytePlus、ComfyUI、图像、
音乐、视频、媒体 harness）——以及实时运行的凭证处理——请参见
[测试 —— 实时测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像中运行与其匹配的 profile-key 实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），会挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认使用较小的冒烟上限，以便完整的 Docker 扫描仍然可行：  
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而  
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、  
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、  
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和  
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想执行更大范围的穷尽扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，然后在后续实时 Docker 通道中复用它。它还会通过 `test:docker:e2e-build` 构建一个共享的 `scripts/e2e/Dockerfile` 镜像，并在运行已构建应用的 E2E 容器冒烟运行器中复用。这个聚合器使用带权重的本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会防止重型实时、npm 安装和多服务通道同时全部启动。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 宿主有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。该运行器默认会执行 Docker 预检，删除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功通道的耗时存储到 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动更长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印带权重的通道清单，而不构建或运行 Docker。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还会仅对所需的 CLI 认证 home 目录执行 bind-mount（如果运行未缩小范围，则挂载所有支持的目录），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改宿主机认证存储：

- 直连模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，更严格的 Droid/OpenCode 覆盖可通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 运行）
- CLI 后端冒烟：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI 实时冒烟：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导 / 渠道 / 智能体冒烟：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，然后运行一次模拟的 OpenAI 智能体轮次。可使用 `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 会话运行时上下文冒烟：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录的持久化，以及对受影响的重复 prompt-rewrite 分支执行 doctor 修复。
- Bun 全局安装冒烟：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 进行安装，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商而不是卡住。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像中复制 `dist/`。
- 安装器 Docker 冒烟：`bash scripts/test-install-sh-docker.sh` 会在 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟默认使用 npm `latest` 作为稳定基线，然后再升级到候选 tarball。非 root 安装器检查会保留独立的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑时复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；如果需要覆盖直接 `npm install -g`，请在本地不设置该环境变量运行脚本。
- 智能体删除共享工作区 CLI 冒烟：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中植入两个共享同一工作区的智能体，运行 `agents delete --json`，并验证 JSON 有效且共享工作区被保留。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制触发提供商 schema 拒绝，并检查原始详情是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已植入的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow / deny 冒烟）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 在隔离的 cron 和一次性 subagent 运行后清理 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟 + `/plugin` 别名 + Claude bundle 重启语义）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
- 插件更新未变更冒烟：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在完成一次新的本地构建后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主机重建，或使用 `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合器会先预打包一次该 tarball，然后将内置渠道检查切分为独立通道，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新通道。直接运行该内置通道时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 在迭代时如需缩小内置插件运行时依赖范围，可禁用无关场景，例如：  
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

如需手动预构建并复用共享的已构建应用镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的测试套件专用镜像覆盖项仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果该镜像尚未存在于本地，脚本会先拉取它。QR 和安装器 Docker 测试保留各自独立的 Dockerfile，因为它们验证的是打包 / 安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会以只读方式 bind-mount 当前检出，并在容器内将其暂存到一个临时工作目录中。这样既能保持运行时镜像精简，又仍然能基于你本地精确的源码 / 配置运行 Vitest。暂存步骤会跳过大型仅限本地的缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，这样 Docker 实时运行就不会花上几分钟去复制机器专属产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器内启动真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 gateway 实时覆盖范围时，也要一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw gateway 容器，针对该 gateway 启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一次真实聊天请求。
第一次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
这个通道需要一个可用的实时模型密钥，而 `OPENCLAW_PROFILE_FILE`（默认值为 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model": "openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意保持确定性，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已植入的 Gateway 网关容器，启动第二个容器来生成 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的 channel + permission 通知。通知检查会直接检查原始 stdio MCP 帧，因此这个冒烟测试验证的是 bridge 实际发出的内容，而不仅仅是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 具有确定性，不需要实时模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP probe 服务器，通过嵌入式 Pi bundle MCP 运行时将该服务器实体化，执行该工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 具有确定性，不需要实时模型密钥。它会启动一个带真实 stdio MCP probe 服务器的已植入 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 单次子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（不在 CI 中运行）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归 / 调试工作流。它未来可能还会再次用于 ACP 线程路由校验，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认值：`~/.openclaw`）会挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认值：`~/.openclaw/workspace`）会挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认值：`~/.profile`）会挂载到 `/home/node/.profile` 并在运行测试前加载
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于只校验从 `OPENCLAW_PROFILE_FILE` 加载的环境变量，使用临时 config / workspace 目录且不挂载外部 CLI 认证目录
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认值：`~/.cache/openclaw/docker-cli-tools`）会挂载到 `/home/node/.npm-global`，用于缓存 Docker 内部的 CLI 安装
- 位于 `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围后的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 也可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表手动覆盖，例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在无需重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储而不是环境变量
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。  
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不依赖真实提供商的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 gateway + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些 CI 安全的测试，行为上类似“智能体可靠性评估”：

- 通过真实 gateway + Agent loop 执行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍然缺少的内容：

- **决策能力：** 当提示词中列出了 Skills 时，智能体是否会选择正确的 Skill（或避免无关 Skill）？
- **合规性：** 智能体在使用前是否会读取 `SKILL.md` 并遵循所需步骤 / 参数？
- **工作流契约：** 用于断言工具顺序、会话历史延续以及沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取和会话接线。
- 一小组聚焦 Skill 的场景（使用与避免、门控、提示注入）。
- 只有在 CI 安全测试套件就位后，才添加可选的实时评估（显式启用、由环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元通道会刻意跳过这些共享接缝和冒烟文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略强制执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - Auth 流程契约
- **auth-choice** - Auth 选项 / 选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 plugin-sdk 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现逻辑后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归测试（指导）

当你修复了在实时环境中发现的提供商 / 模型问题时：

- 如果可能，添加一个 CI 安全的回归测试（模拟 / stub 提供商，或捕获精确的请求形状转换）
- 如果问题本质上只能在实时环境中出现（限流、认证策略），就让实时测试保持狭窄范围，并通过环境变量显式启用
- 优先定位到能够捕获该缺陷的最小层：
  - 提供商请求转换 / 重放缺陷 → 直连模型测试
  - gateway 会话 / 历史 / 工具管线缺陷 → gateway 实时冒烟测试或 CI 安全的 gateway 模拟测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类推导一个采样目标，然后断言遍历片段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会有意在遇到未分类目标 id 时失败，从而避免新类别被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
