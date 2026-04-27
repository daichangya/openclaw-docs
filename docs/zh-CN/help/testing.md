---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / 实时测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-27T00:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6608c56cde768c589ea0f5633c35a4aef845be0945111dc893e19a6f4f95722
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、实时测试）和一小组 Docker 运行器。本文档是“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意**不**覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- 实时测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期在推送前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置宽裕的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 直接按文件定位现在也支持扩展 / 渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先使用定向运行。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或者想要更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- 实时测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只运行一个实时测试文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型全量扫描：`pnpm test:docker:live-models`
  - 每个被选中的模型现在都会运行一次文本轮次外加一个小型文件读取式探测。元数据声明支持 `image` 输入的模型还会额外运行一个微型图像轮次。在隔离提供商故障时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖范围：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的实时 / E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker 实时模型矩阵任务。
  - 如需聚焦的 CI 重跑，可调度 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 向 `scripts/ci-hydrate-live-auth.sh` 以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其定时 / 发布调用方中添加新的高信号提供商密钥。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Codex app-server 路径上运行一个 Docker 实时测试通道，绑定一个带 `/codex bind` 的合成 Slack 私信，会执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件都是通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并默认执行图像、cron MCP、子智能体和 Guardian 探测。隔离其他 Codex app-server 故障时，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。若要聚焦子智能体检查，请禁用其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该测试会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 这是对消息渠道救援命令表面的可选“双保险”检查。它会执行 `/crestodian status`，排队一个持久化模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH` 上放置一个假的 Claude CLI，验证模糊 planner 回退会转换成带审计记录的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从一个空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup / model / agent / Discord 插件 + SecretRef 写入，验证配置，并核验审计条目。相同的 Ring 0 设置路径也在 QA Lab 中通过 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告的是 Moonshot / K2.6，并且助手转录存储了规范化的 `usage.cost`。

提示：如果你只需要一个失败用例，优先使用下面描述的 allowlist 环境变量来缩小实时测试范围。

## QA 专用运行器

当你需要 QA Lab 级别的真实性时，这些命令与主要测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也可通过手动调度使用 mock 提供商运行。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可手动调度，以 mock parity gate、实时 Matrix 通道和由 Convex 管理的实时 Telegram 通道作为并行任务运行。`OpenClaw Release Checks` 会在发布批准前运行相同的通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认会以隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受选定场景数量限制）。使用 `--concurrency <count>` 调整工作进程数量，或使用 `--concurrency 1` 运行旧式串行通道。
  - 任何场景失败时都会以非零状态退出。若你希望保留产物但不返回失败退出码，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的基于 AIMock 的提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性的 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择参数。
  - 实时运行会转发那些对来宾系统而言可行的、受支持的 QA 认证输入：基于环境变量的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便来宾系统能够通过挂载的工作区回写。
  - 会将常规 QA 报告 + 摘要，以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API key 新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对一个模拟的 OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 运行一个确定性的已构建应用 Docker 冒烟测试，用于嵌入式运行时上下文转录。它会验证隐藏的 OpenClaw 运行时上下文被保存为不可显示的自定义消息，而不是泄漏到可见的用户轮次中；然后注入一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前活动分支，并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用实时 Telegram QA 通道，并将该已安装包作为被测 Gateway 网关。
  - 默认为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证源。对于 CI / 发布自动化，请设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 只会为该通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将该通道作为手动维护者工作流 `NPM Telegram Beta E2E` 暴露。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过编辑配置启用内置渠道 / 插件。
  - 验证 setup 发现流程会让未配置插件的运行时依赖保持未安装状态；第一次配置后的 Gateway 网关启动或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启则不会重新安装已经激活的依赖。
  - 同时还会安装一个已知较旧的 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本在更新后的 doctor 中会修复内置渠道的运行时依赖，而不需要 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾系统中运行原生打包安装更新冒烟测试。每个被选中的平台都会先安装请求的基线包，然后在同一来宾中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪情况，以及一次本地智能体轮次。
  - 在迭代单个来宾时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要产物路径和每个通道的状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 作为实时智能体轮次证明。若要有意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将长时间本地运行包装在主机超时中，以防 Parallels 传输卡死耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*`。在假定外层包装器卡住之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动来宾上，Windows 更新在更新后的 doctor / 运行时依赖修复阶段可能会花费 10 到 15 分钟；如果嵌套的 npm 调试日志仍在推进，这仍属于健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能会在快照恢复、包服务或来宾 Gateway 网关状态上发生冲突。
  - 更新后的验证会运行正常的内置插件表面，因为诸如语音、图像生成和媒体理解等能力 facade 是通过内置运行时 API 加载的，即使智能体轮次本身只检查简单的文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接的协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix 实时 QA 通道。
  - 这个 QA 主机目前仅供仓库 / 开发使用。打包后的 OpenClaw 安装不附带 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器；不需要单独的插件安装步骤。
  - 会预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后以真实的 Matrix 插件作为 SUT 传输层启动一个 QA Gateway 网关子进程。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试其他镜像时，可用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证源标志，因为该通道会在本地预配一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物，以及合并后的 stdout / stderr 输出日志写入 `.artifacts/qa-e2e/...`。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败信息中会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT 机器人令牌，针对一个真实的私有群组运行 Telegram 实时 QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字形式的 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享凭证池。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任何场景失败时都会以非零状态退出。若你希望保留产物但不返回失败退出码，请使用 `--allow-failures`。
  - 需要两个处于同一私有群组中的不同机器人，且 SUT 机器人必须公开 Telegram 用户名。
  - 为了实现稳定的机器人到机器人观测，请在 `@BotFather` 中为两个机器人都启用 Bot-to-Bot Communication Mode，并确保 driver 机器人可以观测群组中的机器人流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复类场景包含从 driver 发送请求到观测到 SUT 回复的 RTT。

实时传输通道共享同一份标准契约，以防新增传输层发生漂移：

`qa-channel` 仍然是广义的合成 QA 测试套件，不属于实时传输覆盖矩阵的一部分。

| 通道 | Canary | Mention gating | Allowlist block | 顶层回复 | 重启恢复 | 线程后续回复 | 线程隔离 | 表情反应观测 | 帮助命令 |
| ---- | ------ | -------------- | --------------- | -------- | -------- | ------------ | -------- | ------------ | -------- |
| Matrix | x | x | x | x | x | x | x | x |  |
| Telegram | x |  |  |  |  |  |  |  | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从一个由 Convex 支持的池中获取独占租约，在通道运行期间对该租约执行心跳，并在关闭时释放该租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 针对所选角色的一个密钥：
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

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列表）必须专门使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行之前使用 `doctor`，以检查 Convex 站点 URL、broker 密钥、端点前缀、HTTP 超时和 admin / list 可达性，同时不会打印密钥值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

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

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- `admin/add` 会对 `kind: "telegram"` 的该结构进行校验，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 用于验证该渠道契约的场景包。

当共享的 `qa-lab` 主机可以拥有整个流程时，不要新增一个顶层 QA 命令根。

`qa-lab` 拥有共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动和拆除
- 工作进程并发
- 产物写入
- 报告生成
- 场景执行
- 对旧 `qa-channel` 场景的兼容别名

运行器插件拥有传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根下
- Gateway 网关如何针对该传输进行配置
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录和规范化的传输状态
- 如何执行基于传输的操作
- 如何处理传输专用的重置或清理

新渠道的最低采用门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的拥有者。
2. 在共享的 `qa-lab` 主机接口上实现该传输运行器。
3. 将传输专用机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；惰性 CLI 和运行器执行应放在单独的入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 对新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意迁移，否则应保持现有兼容别名继续可用。

决策规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖某一个渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要一个多于一个渠道都可用的新能力，请添加一个通用辅助函数，而不是在 `suite.ts` 中添加渠道专用分支。
- 如果某个行为只对一种传输有意义，就让该场景保持传输专用，并在场景契约中明确说明。

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

新的渠道工作应使用通用辅助函数名称。
兼容别名的存在是为了避免一次性迁移日，而不是为了作为新场景编写的模型。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实性逐级提升”（同时不稳定性 / 成本也逐级上升）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向的运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会把多项目分片展开为按项目划分的配置，以进行并行调度
- 文件：核心 / 单元清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和定向通道">

    - 未定向的 `pnpm test` 会运行 12 个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低高负载机器上的 RSS 峰值，并避免 auto-reply / 扩展工作饿死无关的测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过定向通道来路由显式的文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 无需付出完整根项目启动的成本。
    - `pnpm test:changed` 默认会将变更的 git 路径展开为廉价的定向通道：直接的测试编辑、相邻的 `*.test.ts` 文件、显式源码映射，以及本地导入图依赖项。配置 / setup / package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对小范围工作的常规智能本地检查门禁。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、release metadata、实时 Docker 工具和工具链，然后运行匹配的类型检查、lint 和 guard 命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式的 `pnpm test <target>`。仅包含发布元数据的版本提升会运行定向的版本 / 配置 / 根依赖检查，并带有一个 guard，用于拒绝顶层 version 字段之外的 package 变更。
    - 实时 Docker ACP harness 编辑会运行聚焦检查：对实时 Docker 认证脚本做 shell 语法检查，以及实时 Docker 调度器 dry-run。仅当 diff 限定为 `scripts["test:docker:live-*"]` 时，才会包含 `package.json` 变更；依赖、导出、版本及其他 package 表面编辑仍会使用更广泛的 guard。
    - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件则保留在现有通道上。
    - 某些选定的 `plugin-sdk` 和 `commands` 辅助源码文件，也会将 changed 模式运行映射到这些轻量通道中的显式相邻测试，因此辅助函数编辑可以避免为该目录重新运行完整的重型测试套件。
    - `auto-reply` 拥有专门的分桶，用于顶层 core 辅助函数、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树。CI 还会进一步将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，这样单个导入较重的分桶就不会独占整个 Node 尾部运行时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖范围">

    - 当你修改消息工具发现输入或 compaction 运行时上下文时，要保持这两个层级的覆盖。
    - 为纯路由和规范化边界添加聚焦的辅助函数回归测试。
    - 保持嵌入式运行器集成测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件会验证定向 id 和 compaction 行为仍然流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享的 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和实时配置中使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` setup 和优化器，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都继承共享 Vitest 配置中的相同 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为进行比较。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构通道。
    - pre-commit hook 仅负责格式化。它会重新暂存格式化后的文件，不会运行 lint、类型检查或测试。
    - 当你需要智能本地检查门禁时，在交接或 push 前显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认会通过廉价的定向通道进行路由。只有当智能体判断某个 harness、配置、package 或契约编辑确实需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是工作进程上限更高。
    - 本地工作进程自动扩缩容刻意保持保守，当主机负载平均值已经较高时会自动回退，因此默认情况下多个并发 Vitest 运行的破坏性更小。
    - 基础 Vitest 配置会将项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式重跑仍然正确。
    - 该配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接性能分析指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入明细输出。
    - `pnpm test:perf:imports:changed` 会将相同的分析视图限定为自 `origin/main` 以来变更的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整个配置运行会使用配置路径作为键；包含模式的 CI 分片会追加分片名称，以便单独跟踪过滤后的分片。
    - 当某个热点测试的大部分时间仍耗在启动导入上时，请将重依赖放在狭窄的本地 `*.runtime.ts` 接口之后，并直接 mock 该接口，而不是为了传给 `vi.mock(...)` 就深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将已路由的 `test:changed` 与该已提交 diff 的原生根项目路径进行比较，并打印墙钟时间以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，路由当前脏工作树的变更文件列表进行基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和转换开销写出主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出运行器 CPU + heap profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单工作进程
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的网关消息、内存和大负载 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言 recorder 保持有界、合成 RSS 样本低于压力预算，并且每个会话的队列深度会回落到零
- 预期：
  - 对 CI 安全且无须密钥
  - 这是用于稳定性回归跟进的狭窄通道，不是完整 Gateway 网关测试套件的替代品

### E2E（Gateway 网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应工作进程（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定工作进程数（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 表面、节点配对和更重的网络行为
- 预期：
  - 会在 CI 中运行（当流水线中启用时）
  - 不需要真实密钥
  - 比单元测试涉及更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell 网关
  - 从一个临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec，验证 OpenClaw 的 OpenShell 后端
  - 通过 sandbox fs bridge 验证远端规范文件系统行为
- 预期：
  - 仅在主动启用时运行；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker 守护进程
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认的 CLI 二进制或包装脚本

### 实时测试（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件实时测试
- 默认值：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在今天配合真实凭证时是否真的能工作？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行缩小范围的子集，而不是“一切都跑”
- 实时运行会读取 `~/.profile`，以补齐缺失的 API key。
- 默认情况下，实时运行仍会隔离 `HOME`，并将配置 / 认证材料复制到临时测试 home 中，这样单元测试 fixture 就不会修改你真实的 `~/.openclaw`。
- 只有在你明确需要让实时测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：它保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静默 Gateway 网关启动日志 / Bonjour 噪声。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 设置每次实时运行覆盖项；测试会在收到速率限制响应时重试。
- 进度 / 心跳输出：
  - 实时测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获较安静，长时间的提供商调用也能明显显示为活跃状态。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商 / Gateway 网关进度行会在实时运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再运行 `pnpm test:coverage`）
- 修改 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的机器人挂了” / 提供商专属故障 / 工具调用：运行缩小范围的 `pnpm test:live`

## 实时测试（触及网络）

关于实时模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server harness，以及所有媒体提供商实时测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、音乐、视频、媒体 harness）——以及实时运行的凭证处理——请参阅 [测试——实时测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内运行各自匹配的 profile-key 实时测试文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会读取 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认采用更小的冒烟测试上限，以便完整的 Docker 全量扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确需要更大范围的穷举扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次实时 Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，随后构建 / 复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅作为安装 / 更新 / 插件依赖通道的 Node / Git 运行器；这些通道会挂载预构建的 tarball。功能镜像则会把同一个 tarball 安装到 `/app`，用于已构建应用的功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行选定的计划。这个聚合运行器使用加权的本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位数，而资源上限会阻止重量级的实时、npm 安装和多服务通道同时全部启动。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。该运行器默认会执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功通道的耗时存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动更长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印加权通道清单而不构建或运行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选通道、package / 镜像需求和凭证的 CI 计划。
- 容器冒烟测试运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层的集成路径。

实时模型 Docker 运行器还会仅绑定挂载所需的 CLI 认证 home 目录（如果运行未缩小范围，则挂载全部受支持的目录），然后在运行前将其复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，对 Droid / OpenCode 的严格覆盖可通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 运行）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码检出通道。它刻意不属于 package Docker 发布通道的一部分，因为 npm tarball 不包含 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包后的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，然后运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可跳过主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包后的 OpenClaw tarball，将渠道从 package `stable` 切换到 git `dev`，验证持久化渠道和插件在更新后仍然可用，然后再切回 package `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回内置图像提供商，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 可跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认以 npm `latest` 作为稳定基线，然后升级到候选 tarball。在本地可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或者在 GitHub 上通过 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保持隔离的 npm 缓存，这样 root 所有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要直接 `npm install -g` 覆盖时，在本地运行脚本时不要设置该环境变量。
- Agents 删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中为两个智能体注入一个工作区，运行 `agents delete --json`，并验证 JSON 有效且保留工作区行为正确。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 可复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- Browser CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、由光标提升的可点击元素、iframe 引用和 frame 元数据。
- OpenAI Responses `web_search` 最小 reasoning 回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升为 `low`，然后强制提供商 schema 拒绝，并检查原始细节出现在 Gateway 网关日志中。
- MCP 渠道桥接（预置 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置 allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 在隔离的 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装 / 卸载、市场更新，以及 Claude bundle 启用 / 检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过实时 ClawHub 区块，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 package。
- 插件更新未变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 可复用镜像，使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 可在刚完成本地构建后跳过主机重建，或使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整的 Docker 聚合运行器会先预打包一次该 tarball，然后将内置渠道检查分片为独立通道，其中包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新通道。直接运行内置通道时，使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 可缩小渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 迭代时如果想缩小内置插件运行时依赖范围，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这类测试套件专用镜像覆盖项仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚不存在，该脚本会先拉取它。QR 和安装器 Docker 测试保留各自的 Dockerfile，因为它们验证的是 package / 安装行为，而不是共享的已构建应用运行时。

实时模型 Docker 运行器还会以只读方式绑定挂载当前检出内容，并将其暂存到容器内的临时工作目录中。这样既能保持运行时镜像精简，又能让 Vitest 针对你本地的精确源码 / 配置运行。暂存步骤会跳过大型本地专用缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，这样 Docker 实时运行就不会花上几分钟去复制机器专属产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关实时探测就不会在容器内启动真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关实时覆盖范围时，也请一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw 网关容器，针对该网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
第一次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
这个通道需要一个可用的实时模型 key，而 `OPENCLAW_PROFILE_FILE`（默认为 `~/.profile`）是在 Docker 化运行中提供该 key 的主要方式。
成功运行时会打印一个小型 JSON payload，例如 `{ "ok": true, "model": "openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个预置的 Gateway 网关容器，再启动第二个容器来拉起 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。通知检查会直接查看原始 stdio MCP frame，因此这个冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 具有确定性，不需要实时模型 key。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时将该服务器实体化，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将它们过滤掉。
`test:docker:cron-mcp-cleanup` 具有确定性，不需要实时模型 key。它会启动一个带有真实 stdio MCP 探测服务器的预置 Gateway 网关，运行一个隔离的 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（不在 CI 中运行）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留这个脚本用于回归 / 调试工作流。未来可能还需要它来验证 ACP 线程路由，所以不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前读取
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` 读取的环境变量，使用临时配置 / 工作区目录，且不挂载外部 CLI 认证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内的缓存 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...`，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表进行手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在不需要重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试所使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是“不需要真实提供商”的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，它们表现得像“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 的模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（参见 [Skills](/zh-CN/tools/skills)）目前仍缺少的内容：

- **决策能力：** 当 Skills 在提示词中列出时，智能体是否会选择正确的 Skills（或避开无关的 Skills）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md` 并遵循必需的步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 Skills 的场景（使用 vs 避免、门控、提示注入）。
- 只有在对 CI 安全的测试套件到位之后，才添加可选的实时评估（主动启用、环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元测试通道会刻意跳过这些共享接口和冒烟测试文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息 payload 结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
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

- 修改 `plugin-sdk` 导出或子路径之后
- 添加或修改渠道或提供商插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归测试（指南）

当你修复一个在实时测试中发现的提供商 / 模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟 / stub 提供商，或捕获精确的请求形状转换）
- 如果它本质上只能在实时环境中复现（速率限制、认证策略），就让实时测试保持狭窄，并通过环境变量主动启用
- 优先瞄准能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具流水线缺陷 → Gateway 网关实时冒烟测试或对 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标家族，请更新该测试中的 `classifyTargetClass`。该测试会在目标 id 未分类时故意失败，以确保新类别不会被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
