---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商 bug 添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-27T03:46:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2c9539ecc93c605cf1457f9d2a0b1364eb6b814d263eb9e40832cec683ee58b
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（unit/integration、e2e、live）以及一小组 Docker 运行器。本文档是“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意 _不_ 覆盖什么）。
- 常见工作流应运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界中的模型/提供商问题添加回归测试。

## 快速开始

大多数时候：

- 完整门禁（预期在 push 前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在性能充足的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接进入 Vitest watch 循环：`pnpm test:watch`
- 现在可直接按文件定位，也支持 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先先运行有针对性的测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试，或想获得额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你调试真实提供商/模型时（需要真实凭证）：

- Live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次外加一个小型文件读取式探测。元数据声明支持 `image` 输入的模型还会运行一个微型图像轮次。在隔离提供商故障时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E workflow，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 若只想有针对性地在 CI 中重跑，请触发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商 secret 添加到 `scripts/ci-hydrate-live-auth.sh`，以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其定时/发布调用方中。
- 原生 Codex 绑定聊天 smoke：`pnpm test:docker:live-codex-bind`
  - 在 Docker live lane 中针对 Codex app-server 路径运行，绑定一个合成的 Slack 私信并执行 `/codex bind`，随后运行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件是通过原生插件绑定路由，而不是 ACP。
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并且默认执行图像、cron MCP、sub-agent 和 Guardian 探测。在隔离其他 Codex app-server 故障时，可用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用 sub-agent 探测。若只想聚焦 sub-agent 检查，请禁用其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该命令会在 sub-agent 探测后退出。
- Crestodian rescue command smoke：`pnpm test:live:crestodian-rescue-channel`
  - 面向消息渠道 rescue command 表面的可选双保险检查。它会执行 `/crestodian status`，排队一个持久化模型变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian planner Docker smoke：`pnpm test:docker:crestodian-planner`
  - 在一个无配置容器中运行 Crestodian，并在 `PATH` 上提供一个假的 Claude CLI，验证模糊 planner 回退会转换为带审计的类型化配置写入。
- Crestodian first-run Docker smoke：`pnpm test:docker:crestodian-first-run`
  - 从一个空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup/model/agent/Discord 插件 + SecretRef 写入，验证配置，并检查审计条目。相同的 Ring 0 设置路径也在 QA Lab 中由 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本 smoke：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告的是 Moonshot/K2.6，且 assistant transcript 存储了规范化的 `usage.cost`。

提示：如果你只需要一个失败用例，优先通过下文描述的 allowlist 环境变量来缩小 live 测试范围。

## QA 专用运行器

当你需要接近 QA-lab 真实场景时，这些命令与主测试套件并列使用：

CI 会在专用 workflow 中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，也支持手动触发，并使用 mock 提供商。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也支持手动触发，其中 mock parity gate、live Matrix lane 和由 Convex 管理的 live Telegram lane 作为并行作业运行。`OpenClaw Release Checks` 会在发布批准前运行同样的 lanes。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认会以隔离的 Gateway 网关 worker 并行运行多个选中的场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 进入较早的串行 lane。
  - 任一场景失败时以非零状态退出。若你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地由 AIMock 支持的提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` lane。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择参数。
  - live 运行会转发对 guest 来说实际可用的受支持 QA 凭证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样 guest 才能通过挂载的工作区回写内容。
  - 会在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 汇总以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API-key 新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对一个模拟的 OpenAI endpoint 运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装 lane。
- `pnpm test:docker:session-runtime-context`
  - 为嵌入式运行时上下文 transcript 运行一个确定性的内置应用 Docker smoke。它会验证隐藏的 OpenClaw 运行时上下文以非展示的自定义消息形式持久化，而不是泄漏到可见的用户轮次中；随后植入一个受影响的损坏 session JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前分支并保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw package，运行已安装 package 的新手引导，通过已安装的 CLI 配置 Telegram，然后复用 live Telegram QA lane，并将该已安装 package 作为被测 Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色 secret。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色 secret，Docker wrapper 会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为该 lane 覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 也将此 lane 暴露为手动维护者 workflow `NPM Telegram Beta E2E`。它不会在 merge 时运行。该 workflow 使用 `qa-live-shared` environment 和 Convex CI 凭证租约。
- GitHub Actions 还暴露了 `Package Acceptance`，用于对单个候选 package 进行旁路产品证明。它接受受信任 ref、已发布 npm spec、带 SHA-256 的 HTTPS tarball URL，或来自另一个运行的 tarball artifact，上传规范化的 `openclaw-current.tgz` 作为 `package-under-test`，然后运行现有 Docker E2E 调度器，支持 smoke、package、product、full 或自定义 lane 配置。已发布的 npm 候选版本还可以额外运行 Telegram QA workflow。
  - 最新 beta 产品证明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

- 精确 tarball URL 证明需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact 证明会从另一个 Actions 运行中下载 tarball artifact：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，使用已配置好的 OpenAI 启动 Gateway 网关，然后通过编辑配置启用内置 channel/plugins。
  - 验证 setup 发现流程不会安装未配置插件的运行时依赖；首次配置完成后的 Gateway 网关运行或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已经激活的依赖。
  - 还会安装一个已知的较旧 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 能修复内置 channel 运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels guest 上运行原生打包安装更新 smoke。每个选中的平台都会先安装请求的基线 package，然后在同一个 guest 中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪情况以及一次本地智能体轮次。
  - 在迭代单个 guest 时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 可获取汇总 artifact 路径和每个 lane 的状态。
  - OpenAI lane 默认使用 `openai/gpt-5.5` 作为 live 智能体轮次证明。若你有意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 对于较长的本地运行，请用主机超时包装，以避免 Parallels 传输阻塞占用剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套 lane 日志写入 `/tmp/openclaw-parallels-npm-update.*`。
  在假设外层包装器卡住之前，请先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
- Windows 更新在冷启动 guest 上可能会在更新后的 doctor/运行时依赖修复阶段花费 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这就是健康状态。
- 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux smoke lanes 并行运行。它们共享 VM 状态，可能会在快照恢复、package 分发或 guest Gateway 网关状态上发生冲突。
- 更新后的验证会运行正常的内置插件表面，因为像 speech、image generation 和 media understanding 这样的 capability facade，即使在智能体轮次本身只检查简单文本响应时，也会通过内置运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的 Docker 支持 Tuwunel homeserver 运行 Matrix live QA lane。
  - 这个 QA 主机目前仅供仓库/开发环境使用。打包后的 OpenClaw 安装不附带 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；不需要单独安装插件。
  - 预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）和一个私有房间，然后启动一个以真实 Matrix 插件作为 SUT 传输层的 QA Gateway 网关子进程。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试不同镜像时，可用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享的 credential-source 标志，因为该 lane 会在本地预配一次性用户。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Matrix QA 报告、摘要、observed-events artifact，以及合并的 stdout/stderr 输出日志。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败时会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对真实私有群组运行 Telegram live QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必须是 Telegram chat id 的数字值。
  - 支持 `--credential-source convex` 以使用共享凭证池。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用共享租约。
  - 任一场景失败时以非零状态退出。若你想保留产物但不希望退出码失败，请使用 `--allow-failures`。
  - 需要同一个私有群组中的两个不同 bot，并且 SUT bot 需要公开一个 Telegram 用户名。
  - 为了稳定地观察 bot 到 bot 通信，请在 `@BotFather` 中为两个 bot 都启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观察群组中的 bot 流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages artifact。回复场景还包含从 driver 发送请求到观察到 SUT 回复的 RTT。

Live 传输 lanes 共享一个标准契约，这样新传输层就不会发生漂移：

`qa-channel` 仍然是覆盖面较广的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取一个独占租约，在 lane 运行期间为该租约发送 heartbeat，并在关闭时释放该租约。

参考的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色提供一个 secret：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则默认是 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

在正常运行中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池的添加/删除/列出）必须明确使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 运行之前使用 `doctor`，可在不打印 secret 值的情况下检查 Convex 站点 URL、broker secret、endpoint prefix、HTTP 超时，以及 admin/list 可达性。在脚本和 CI 工具中可使用 `--json` 获取机器可读输出。

默认 endpoint 契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

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

Telegram 类型的 payload 结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是 Telegram chat id 的数字字符串。
- `admin/add` 会为 `kind: "telegram"` 验证此结构，并拒绝格式错误的 payload。

### 向 QA 添加一个渠道

向 Markdown QA 系统中添加一个渠道，严格只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

如果共享的 `qa-lab` 主机可以承载该流程，就不要添加新的顶级 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动与关闭
- worker 并发
- artifact 写入
- 报告生成
- 场景执行
- 对旧 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- 如何将 `openclaw qa <runner>` 挂载到共享 `qa` 根下面
- 如何为该传输层配置 Gateway 网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观察出站消息
- 如何暴露 transcript 和规范化后的传输状态
- 如何执行由传输层支撑的动作
- 如何处理传输层特定的重置或清理

新渠道的最低采用门槛是：

1. 保持 `qa-lab` 作为共享 `qa` 根的所有者。
2. 在共享的 `qa-lab` 主机接口上实现传输运行器。
3. 将传输层特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出对应的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应位于独立入口点之后。
5. 在按主题组织的 `qa/scenarios/` 目录下编写或调整 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在进行有意的迁移，否则保持现有兼容别名可用。

决策规则非常严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放在 `qa-lab`。
- 如果某个行为依赖单一渠道传输层，就把它保留在对应的运行器插件或插件 harness 中。
- 如果某个场景需要一种超过一个渠道都能使用的新能力，就添加一个通用辅助函数，而不是在 `suite.ts` 中加入渠道特定分支。
- 如果某个行为只对一种传输层有意义，就让场景保持传输层特定性，并在场景契约中明确说明。

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
兼容别名的存在是为了避免一次性强制迁移，而不是作为新场景编写的范式。

## 测试套件（各自运行在哪里）

可以把这些测试套件理解为“真实度逐步提高”（同时也更容易波动、成本更高）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：核心/unit 清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及由 `vitest.unit.config.ts` 覆盖并列入白名单的 `ui` node 测试
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关凭证、路由、工具、解析、配置）
  - 已知 bug 的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和定向 lanes">

    - 未定向的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是启动一个庞大的原生根项目进程。这样可以降低高负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖累无关的测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先将显式的文件/目录目标路由到定向 lanes，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不必承担完整根项目启动的成本。
    - `pnpm test:changed` 默认会将变更的 git 路径展开为低成本的定向 lanes：直接修改的测试、同级 `*.test.ts` 文件、显式源映射以及本地导入图的依赖项。配置/setup/package 修改不会触发大范围测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对小范围工作常规使用的智能本地检查门禁。它会将 diff 分类到 core、core tests、extensions、extension tests、apps、docs、发布元数据、live Docker 工具链和工具，然后运行相应的类型检查、lint 和 guard 命令。它不会运行 Vitest 测试；如需测试证明，请调用 `pnpm test:changed` 或显式运行 `pnpm test <target>`。仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查，并带有一个 guard，用于拒绝顶层版本字段之外的 package 变更。
    - live Docker ACP harness 的修改会运行聚焦检查：对 live Docker auth 脚本做 shell 语法检查，以及执行一次 live Docker 调度器 dry-run。只有当 diff 仅限于 `scripts["test:docker:live-*"]` 时才会包含 `package.json` 变更；依赖、导出、版本和其他 package 表面修改仍会走更宽泛的 guard。
    - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入 unit 测试，会被路由到 `unit-fast` lane，其中跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件则保留在现有 lanes 中。
    - 一些选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 changed 模式运行映射到这些轻量 lanes 中的显式同级测试，因此辅助函数修改不必为该目录重跑完整的重型测试套件。
    - `auto-reply` 为顶层 core 辅助函数、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树提供了专用分桶。CI 还会进一步将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，这样就不会让某个导入开销很重的分桶独占完整的 Node 尾部时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖范围">

    - 当你修改消息工具发现输入或 compaction 运行时上下文时，要同时保持这两级覆盖。
    - 为纯路由和规范化边界添加有针对性的辅助函数回归测试。
    - 保持嵌入式运行器集成测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件会验证作用域 id 和 compaction 行为仍然会通过真实的 `run.ts` / `compact.ts` 路径流动；仅有辅助函数级别的测试并不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定使用 `isolate: false`，并在根项目、e2e 和 live 配置中采用非隔离运行器。
    - 根 UI lane 保留其 `jsdom` setup 和 optimizer，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为进行比较。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示一个 diff 会触发哪些架构 lanes。
    - pre-commit hook 仅负责格式化。它会重新暂存已格式化文件，不会运行 lint、类型检查或测试。
    - 当你需要智能本地检查门禁时，请在交接或 push 前显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过低成本的定向 lanes 路由。只有当智能体判断 harness、配置、package 或契约修改确实需要更广泛的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是 worker 上限更高。
    - 本地 worker 自动伸缩有意保持保守；当主机负载均值已经较高时会回退，因此默认情况下多个并发 Vitest 运行造成的影响更小。
    - 基础 Vitest 配置将项目/配置文件标记为 `forceRerunTriggers`，因此当测试接线发生变化时，changed 模式重跑仍然是正确的。
    - 该配置会在受支持的主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入细分输出。
    - `pnpm test:perf:imports:changed` 会将相同的性能分析视图限定到自 `origin/main` 以来发生变化的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整个配置运行使用配置路径作为键；包含模式的 CI 分片会附加分片名称，以便单独跟踪经过筛选的分片。
    - 当某个热点测试的大部分时间仍然消耗在启动导入上时，请将重依赖放在狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 这个接缝，而不是为了通过 `vi.mock(...)` 转发它们就深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将经路由的 `test:changed` 与该已提交 diff 的原生根项目路径进行比较，并打印 wall time 以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前未提交工作树中的变更文件列表进行路由，并执行性能基准。
    - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和转换开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 测试套件写入运行器 CPU + heap profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用单个 worker
- 范围：
  - 启动一个默认启用诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway 消息、memory 和大负载 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言 recorder 仍保持有界、合成 RSS 样本低于压力预算，并且每个 session 的队列深度会回落到零
- 预期：
  - 对 CI 安全且无需密钥
  - 是一个用于稳定性回归后续跟进的窄 lane，而不是完整 Gateway 网关测试套件的替代品

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对，以及更重型的网络行为
- 预期：
  - 在 CI 中运行（当 pipeline 启用时）
  - 不需要真实密钥
  - 比 unit 测试涉及更多活动部件（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell Gateway 网关
  - 通过一个临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 来验证 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥验证远端规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 Gateway 网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指向一个非默认 CLI 二进制文件或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认值：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型 _今天_ 配合真实凭证是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题以及速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 占用速率限制
  - 优先运行缩小范围的子集，而不是“全部”
- Live 运行会 source `~/.profile`，以补齐缺失的 API key。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，这样 unit fixture 就不会修改你的真实 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 gateway 启动日志/Bonjour 噪声。如需恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（按提供商区分）：设置逗号/分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 为 live 运行单独覆盖；测试会在遇到速率限制响应时重试。
- 进度/heartbeat 输出：
  - Live 测试套件现在会向 stderr 发出进度行，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能清楚显示仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 的控制台拦截，因此在 live 运行期间，提供商/Gateway 网关进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model heartbeat。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/probe heartbeat。

## 我应该运行哪个测试套件？

使用下面这张决策表：

- 修改逻辑/测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：再加上 `pnpm test:e2e`
- 调试“我的 bot 挂了”/ 提供商特定故障 / 工具调用：运行一个缩小范围的 `pnpm test:live`

## Live（会触网的）测试

关于 live 模型矩阵、CLI 后端 smoke、ACP smoke、Codex app-server harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus、ComfyUI、图像、音乐、视频、媒体 harness）——以及 live 运行的凭证处理——请参阅 [测试 — live suites](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可运行”检查）

这些 Docker 运行器分为两类：

- Live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行与其对应的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录与工作区（如果已挂载，也会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用较小的 smoke 上限，以便完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想进行更大范围的穷举扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包成一个 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。基础镜像仅包含用于 install/update/plugin-dependency lanes 的 Node/Git 运行器；这些 lanes 会挂载预构建的 tarball。功能镜像会将同一个 tarball 安装到 `/app` 中，用于内置应用功能 lanes。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行所选计划。这个聚合运行器使用带权重的本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会阻止高负载的 live、npm-install 和多服务 lanes 同时全部启动。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机具备更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认会执行 Docker preflight、移除陈旧的 OpenClaw E2E 容器、每 30 秒打印一次状态、将成功 lane 的耗时存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动更长的 lanes。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可在不构建或运行 Docker 的情况下打印带权 lane 清单，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lanes、package/镜像需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的 package 门禁，用于回答“这个可安装 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 中解析一个候选 package，将其上传为 `package-under-test`，然后针对这个精确 tarball 运行可复用的 Docker E2E lanes，而不是重新打包所选 ref。`workflow_ref` 选择受信任的 workflow/harness 脚本，而 `package_ref` 则在 `source=ref` 时选择要打包的源 commit/branch/tag；这使得当前的 acceptance 逻辑也能验证较早的受信任提交。各个 profile 按覆盖广度排序：`smoke` 是快速的 install/channel/agent 加 gateway/config；`package` 覆盖 package/update/plugin 契约，也是大多数 Parallels package/update 覆盖的默认原生替代方案；`product` 会再加入 MCP channels、cron/subagent cleanup、OpenAI web search 和 OpenWebUI；`full` 则会运行包含 OpenWebUI 的发布路径 Docker 分块。发布验证会针对目标 ref 运行 `package` profile。
- 容器 smoke 运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

这些 live 模型 Docker 运行器还会只绑定挂载所需的 CLI 凭证 home（若运行未缩小范围，则挂载所有受支持的凭证 home），然后在运行前将其复制到容器 home 中，这样外部 CLI OAuth 就可以刷新 token，而不会修改主机上的凭证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定 smoke：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，如需严格的 Droid/OpenCode 覆盖，可使用 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode`）
- CLI 后端 smoke：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性 smoke：`pnpm qa:otel:smoke` 是一个私有 QA 源码 checkout lane。它有意不属于 package Docker 发布 lanes，因为 npm tarball 不包含 QA Lab。
- Open WebUI live smoke：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY、完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体 smoke：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装已打包的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，然后运行一次模拟的 OpenAI 智能体轮次。可使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换 smoke：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装已打包的 OpenClaw tarball，从 package `stable` 切换到 git `dev`，验证持久化的渠道和插件在更新后仍然可用，然后再切回 package `stable` 并检查更新状态。
- Session 运行时上下文 smoke：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文 transcript 的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装 smoke：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 会返回内置图像提供商而不是卡住。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像中复制 `dist/`。
- Installer Docker smoke：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新 smoke 默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。可在本地使用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上使用 Install Smoke workflow 的 `update_baseline_version` 输入覆盖。非 root 的 installer 检查会保留一个隔离的 npm 缓存，以避免 root 所有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑时复用 root/update/direct-npm 缓存。
- Install Smoke CI 会使用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要覆盖直接 `npm install -g` 时，请在本地运行该脚本且不要设置这个环境变量。
- 智能体删除共享工作区 CLI smoke：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中植入两个智能体和一个工作区，运行 `agents delete --json`，并验证 JSON 有效且工作区保留行为正确。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器、WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照 smoke：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像以及 Chromium 层，以原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、光标提升的可点击元素、iframe 引用和 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升为 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥（已植入的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧 smoke）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile allow/deny smoke）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离的 cron 和一次性 subagent 运行后关闭 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装 smoke、ClawHub 安装/卸载、市场更新，以及 Claude bundle 启用/检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 live ClawHub 区块，或使用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 package。
- 插件更新未变化 smoke：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据 smoke：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用该镜像，在完成一次全新的本地构建后使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过主机重建，或使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合运行器会先预先打包这个 tarball 一次，然后将内置渠道检查分片为独立 lanes，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新 lanes。直接运行内置 lane 时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该 lane 还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor/运行时依赖修复。
- 在迭代时缩小内置插件运行时依赖范围，可禁用不相关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

如果设置了特定测试套件的镜像覆盖（如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`），则仍以它们为准。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向一个远程共享镜像时，如果该镜像尚未存在于本地，脚本会将其拉取。QR 和 installer Docker 测试保留各自独立的 Dockerfile，因为它们验证的是 package/install 行为，而不是共享的内置应用运行时。

这些 live 模型 Docker 运行器还会将当前 checkout 以只读方式 bind-mount，并在容器内暂存到一个临时 workdir。这样既能保持运行时镜像精简，又能让 Vitest 针对你精确的本地 source/config 运行。
暂存步骤会跳过大型仅本地缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，这样 Docker live 运行就不会花上数分钟去复制机器特定 artifact。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 gateway live 探测就不会在容器内启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker lane 中的 gateway live 覆盖时，也请一并传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性 smoke：它会启动一个启用了 OpenAI 兼容 HTTP endpoint 的 OpenClaw Gateway 网关容器，针对该网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 完成登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
这个 lane 需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一个小型 JSON payload，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计成确定性的，不需要真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已植入的 Gateway 网关容器，再启动第二个容器来运行 `openclaw mcp serve`，然后验证路由后的会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 传递的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此这个 smoke 验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出的内容。
`test:docker:pi-bundle-mcp-tools` 具有确定性，不需要 live 模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi 内置 MCP 运行时实例化该服务器，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 具有确定性，不需要 live 模型密钥。它会启动一个带真实 stdio MCP 探测服务器的已植入 Gateway 网关，运行一个隔离的 cron 轮次和一个 `/subagents spawn` 一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 纯语言线程 smoke（不在 CI 中运行）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请将该脚本保留用于回归/调试工作流。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，使用临时 config/workspace 目录，且不挂载外部 CLI 凭证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 凭证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小提供商范围的运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或逗号列表（例如 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`）手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，适合不需要重建的重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI smoke 使用的 nonce 检查 prompt
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在修改文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题锚点时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是在不使用真实提供商的情况下进行的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI、真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

对于 Skills（见 [Skills](/zh-CN/tools/skills)），目前仍缺少：

- **决策能力：** 当 prompt 中列出 Skills 时，智能体是否会选择正确的 Skill（或避开无关的 Skill）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md` 并遵循要求的步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史继承以及沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取和会话接线。
- 一小组聚焦 Skill 的场景（使用 vs 避免、门禁、prompt 注入）。
- 仅在对 CI 安全的测试套件到位后，才添加可选的 live 评估（显式启用、受环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状与行为断言。默认的 `pnpm test` unit lane 会有意跳过这些共享接缝和 smoke 文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

### 命令

- 所有契约测试：`pnpm test:contracts`
- 仅渠道契约测试：`pnpm test:contracts:channels`
- 仅提供商契约测试：`pnpm test:contracts:plugins`

### 渠道契约测试

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员列表 API
- **group-policy** - 群组策略执行

### 提供商 Status 契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选项/选择
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现机制后

契约测试会在 CI 中运行，并且不需要真实 API key。

## 添加回归测试（指南）

当你修复一个在 live 中发现的提供商/模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟/stub 提供商，或捕获精确的请求形状转换）
- 如果它本质上只能在 live 中验证（速率限制、认证策略），则让 live 测试保持窄范围，并通过环境变量显式启用
- 优先定位能捕获该 bug 的最小层级：
  - 提供商请求转换/重放 bug → 直接模型测试
  - Gateway 网关会话/历史/工具流水线 bug → gateway live smoke 或对 CI 安全的 gateway mock 测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中，为每个 SecretRef 类派生一个采样目标，然后断言遍历片段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类目标 id 时故意失败，从而避免静默跳过新的类别。

## 相关内容

- [测试 live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
