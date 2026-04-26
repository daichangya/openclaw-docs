---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-26T22:39:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4499f5092819a250971610ce3e31191b871cd2a1d2915bb7479f9439cea94dcd
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三个 Vitest 测试套件（单元 / 集成、e2e、live）以及一小组 Docker 运行器。本文档是关于“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意 _不_ 覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（预期在推送前执行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置宽裕的机器上更快地运行本地完整测试套件：`pnpm test:max`
- 直接使用 Vitest 观察模式循环：`pnpm test:watch`
- 现在直接按文件路径定向也支持 extension / channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代修复单个失败用例时，优先先运行有针对性的测试。
- 基于 Docker 的 QA 站点：`pnpm qa:lab:up`
- 基于 Linux VM 的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改了测试或想获得更高信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次外加一个小型的文件读取风格探测。元数据声明支持 `image` 输入的模型还会额外运行一个微型图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 关闭这些额外探测。
  - CI 覆盖：每日执行的 `OpenClaw Scheduled Live And E2E Checks` 和手动执行的 `OpenClaw Release Checks` 都会调用可复用的 live / E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵任务。
  - 对于聚焦型 CI 重跑，可调度 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商 secrets 添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 以及其定时 / 发布调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Codex app-server 路径上运行一个 Docker live 通道，绑定一个合成的 Slack 私信并执行 `/codex bind`，运行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件都是通过原生插件绑定而不是 ACP 路由的。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并且默认执行图像、cron MCP、子智能体和 Guardian 探测。在隔离其他 Codex app-server 故障时，可通过 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 关闭子智能体探测。若要聚焦检查子智能体，请关闭其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该命令会在子智能体探测后退出。
- Crestodian rescue command 冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 针对消息渠道 rescue command 表面的可选加固检查。它会执行 `/crestodian status`，排队一个持久模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在一个无配置容器中运行 Crestodian，并在 `PATH` 中放置一个伪造的 Claude CLI，验证模糊 planner 回退会转换为一条带审计记录的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用 setup / model / agent / Discord 插件 + SecretRef 写入，验证配置，并检查审计条目。相同的 Ring 0 设置路径也在 QA Lab 中通过 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。验证 JSON 报告的是 Moonshot / K2.6，且 assistant transcript 中存储了标准化的 `usage.cost`。

提示：当你只需要一个失败用例时，优先使用下文描述的 allowlist 环境变量来收窄 live 测试范围。

## QA 专用运行器

当你需要 QA-lab 级别的真实性时，这些命令位于主测试套件旁边：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上以及通过手动调度运行，使用 mock 提供商。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，并可通过手动调度运行，其中 mock parity gate、live Matrix 通道和由 Convex 管理的 live Telegram 通道作为并行任务执行。`OpenClaw Release Checks` 会在发布批准前运行同样的通道。

- `pnpm openclaw qa suite`
  - 直接在主机上运行基于仓库的 QA 场景。
  - 默认情况下，会使用隔离的 Gateway 网关工作进程并行运行多个选定场景。`qa-channel` 默认并发数为 4（受所选场景数量限制）。使用 `--concurrency <count>` 可调整工作进程数量，或使用 `--concurrency 1` 以采用较早的串行通道。
  - 当任一场景失败时会以非零状态退出。如果你想保留工件但不希望以失败退出码结束，可使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。`aimock` 会启动一个本地的、由 AIMock 支持的提供商服务器，用于实验性的夹具和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同一个 QA 测试套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - live 运行会转发对 guest 来说实际可用的受支持 QA 认证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，以便 guest 能通过挂载的工作区写回内容。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动基于 Docker 的 QA 站点，用于偏操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前 checkout 构建一个 npm tarball，在 Docker 中全局安装，以非交互方式运行 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件会按需安装运行时依赖，运行 doctor，并针对一个 mock 的 OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装通道。
- `pnpm test:docker:session-runtime-context`
  - 运行一个确定性的已构建应用 Docker 冒烟测试，用于嵌入式运行时上下文 transcript。它会验证隐藏的 OpenClaw 运行时上下文会以非展示型自定义消息持久化，而不会泄漏到可见的用户轮次中；随后会植入一个受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前活动分支并保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个已发布的 OpenClaw 软件包，运行已安装软件包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用 live Telegram QA 通道，并将该已安装软件包作为被测 Gateway 网关。
  - 默认为 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`。
  - 与 `pnpm openclaw qa telegram` 使用相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI / 发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，并同时设置 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色 secret。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和一个 Convex 角色 secret，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 可仅为这一通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将这个通道作为手动维护者工作流 `NPM Telegram Beta E2E` 暴露。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建版本，配置 OpenAI 后启动 Gateway 网关，然后通过配置编辑启用内置的渠道 / 插件。
  - 验证 setup 发现流程不会安装未配置插件的运行时依赖；首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知较旧的 npm 基线版本，在运行 `openclaw update --tag <candidate>` 前启用 Telegram，并验证候选版本在更新后的 doctor 中会修复内置渠道的运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels guest 上运行原生打包安装更新冒烟测试。每个选中的平台会先安装请求的基线软件包，然后在同一个 guest 中运行已安装的 `openclaw update` 命令，并验证安装版本、更新状态、网关可用性以及一次本地智能体轮次。
  - 在迭代单个 guest 时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要工件路径和各通道状态。
  - 默认情况下，OpenAI 通道使用 `openai/gpt-5.5` 作为 live 智能体轮次验证模型。若你有意验证其他 OpenAI 模型，可传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 请为长时间本地运行包裹主机超时，以防 Parallels 传输停顿耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*` 下。不要在看到外层包装器似乎卡住时立刻下结论，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - Windows 更新在冷 guest 上可能会花费 10 到 15 分钟执行更新后 doctor / 运行时依赖修复；只要嵌套的 npm 调试日志仍在推进，这仍属于健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能会在快照恢复、软件包分发或 guest Gateway 网关状态上发生冲突。
  - 更新后的验证会运行常规的内置插件表面，因为语音、图像生成和媒体理解等能力外观层即使在智能体轮次本身只检查简单文本响应时，也仍通过内置运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性的、基于 Docker 的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 主机目前仅供仓库 / 开发使用。打包后的 OpenClaw 安装不包含 `qa-lab`，因此不会暴露 `openclaw qa`。
  - 仓库 checkout 会直接加载内置运行器；不需要单独的插件安装步骤。
  - 会预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个 QA Gateway 网关子进程，并使用真实的 Matrix 插件作为 SUT 传输层。
  - 默认使用固定的稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。当你需要测试其他镜像时，可通过 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地预配一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 工件以及合并后的 stdout / stderr 输出日志写入 `.artifacts/qa-e2e/...`。
  - 默认会输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS`（默认 30 分钟）强制执行硬性运行超时。清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限制，失败信息中会包含恢复命令 `docker compose ... down --remove-orphans`。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT bot token，针对一个真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。group id 必须是数字形式的 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享凭证池。默认使用环境变量模式，或者设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 当任一场景失败时会以非零状态退出。如果你想保留工件但不希望以失败退出码结束，可使用 `--allow-failures`。
  - 要求在同一个私有群组中使用两个不同的 bot，并且 SUT bot 必须暴露一个 Telegram 用户名。
  - 为了获得稳定的 bot 对 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观察群组中的 bot 流量。
  - 会将 Telegram QA 报告、摘要以及 observed-messages 工件写入 `.artifacts/qa-e2e/...`。回复类场景会包含从 driver 发送请求到观测到 SUT 回复之间的 RTT。

live 传输通道共享一个标准契约，因此新增传输方式时不会发生漂移：

`qa-channel` 仍然是宽泛的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| 通道 | Canary | 提及门控 | Allowlist 阻止 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观测 | 帮助命令 |
| ---- | ------ | -------- | -------------- | -------- | -------- | -------- | -------- | ------------- | -------- |
| Matrix | x | x | x | x | x | x | x | x | |
| Telegram | x | | | | | | | | x |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从一个由 Convex 支持的池中获取独占租约，在通道运行期间为该租约发送心跳，并在关闭时释放该租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个 secret：
  - `maintainer` 使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 使用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选的追踪 id）
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

在 live 运行前使用 `doctor`，可检查 Convex site URL、broker secrets、endpoint prefix、HTTP 超时以及 admin / list 可达性，同时不会打印 secret 值。在脚本和 CI 工具中可使用 `--json` 获取机器可读输出。

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

Telegram 类型的负载结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- 对于 `kind: "telegram"`，`admin/add` 会验证此结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

向 Markdown QA 系统添加一个渠道，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于验证渠道契约的场景包。

当共享的 `qa-lab` 主机可以承载该流程时，不要添加新的顶层 QA 命令根。

`qa-lab` 负责共享主机机制：

- `openclaw qa` 命令根
- 测试套件启动和拆除
- 工作进程并发
- 工件写入
- 报告生成
- 场景执行
- 对旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载到共享的 `qa` 根命令下
- 如何为该传输配置网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露 transcript 和标准化传输状态
- 如何执行基于传输的操作
- 如何处理传输特定的重置或清理

新渠道的最低采用门槛是：

1. 保持由 `qa-lab` 负责共享的 `qa` 根命令。
2. 在共享的 `qa-lab` 主机接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 轻量；惰性 CLI 和运行器执行应留在独立入口点之后。
5. 在具有主题划分的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助函数。
7. 除非仓库正在执行有意迁移，否则保持现有兼容别名继续可用。

决策规则很严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖于单一渠道传输，就把它保留在该运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都可使用的新能力，应添加通用辅助函数，而不是在 `suite.ts` 中增加渠道特定分支。
- 如果某个行为只对单一传输有意义，就保持该场景是传输特定的，并在场景契约中明确说明。

新场景优先使用的通用辅助函数名称是：

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

现有场景仍可使用的兼容别名包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新的渠道工作应使用通用辅助函数名称。
兼容别名的存在是为了避免一次性强制迁移，而不是作为新场景编写的范式。

## 测试套件（分别在哪里运行）

可以把这些测试套件理解为“真实性逐步提升”（同时不稳定性 / 成本也逐步增加）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：核心 / 单元测试清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`，以及 `vitest.unit.config.ts` 覆盖的白名单 `ui` Node 测试
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

    - 未定向的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是启动一个巨大的原生根项目进程。这可以降低高负载机器上的峰值 RSS，并避免 auto-reply / extension 工作拖慢无关测试套件。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过定向通道处理显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免承担完整根项目启动成本。
    - `pnpm test:changed` 会在差异仅涉及可路由的源文件 / 测试文件时，将变更的 git 路径展开到相同的定向通道；配置 / setup 编辑仍会回退到更宽泛的根项目重跑。
    - `pnpm check:changed` 是针对小范围工作的常规智能本地门禁。它会将差异归类为 core、core tests、extensions、extension tests、apps、docs、发布元数据、live Docker 工具以及工具链，然后运行匹配的类型检查 / lint / 测试通道。公共 Plugin SDK 和插件契约变更会额外包含一次 extension 验证，因为 extensions 依赖这些核心契约。仅涉及发布元数据的版本升级会运行定向的版本 / 配置 / 根依赖检查，而不是完整测试套件，并通过一个保护机制拒绝顶层版本字段之外的 package 变更。
    - live Docker ACP harness 编辑会运行一个聚焦型本地门禁：对 live Docker 认证脚本做 shell 语法检查、执行 live Docker 调度器 dry-run、运行 ACP bind 单元测试以及 ACPX extension 测试。只有当差异仅限于 `scripts["test:docker:live-*"]` 时，才会包含 `package.json` 变更；依赖、导出、版本和其他 package 表面编辑仍会使用更宽泛的保护措施。
    - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有通道中。
    - 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 changed 模式运行映射到这些轻量通道中的显式同级测试，因此辅助函数编辑无需为该目录重跑完整的重型测试套件。
    - `auto-reply` 为顶层 core 辅助函数、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树提供了专用分桶。CI 还会进一步将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，这样导入较重的单个分桶就不会独占整个 Node 收尾阶段。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你修改消息工具发现输入或压缩运行时上下文时，请同时保留两个层级的覆盖。
    - 为纯路由和标准化边界添加聚焦型辅助函数回归测试。
    - 保持嵌入式运行器集成测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件验证带作用域的 id 和压缩行为仍会通过真实的 `run.ts` / `compact.ts` 路径流转；仅辅助函数测试不足以替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定为 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` setup 和优化器，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都继承共享 Vitest 配置中的相同 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可对比原生 V8 行为。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个差异会触发哪些架构通道。
    - pre-commit hook 只负责格式化。它会重新暂存格式化后的文件，不会运行 lint、类型检查或测试。
    - 在交接或 push 前，当你需要智能本地门禁时，请显式运行 `pnpm check:changed`。公共 Plugin SDK 和插件契约变更会额外包含一次 extension 验证。
    - `pnpm test:changed` 会在变更路径能够清晰映射到较小测试套件时，通过定向通道运行。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
    - 本地 worker 自动扩缩容有意保持保守；当主机负载平均值已经较高时会回退，因此默认情况下多个并发 Vitest 运行造成的影响会更小。
    - 基础 Vitest 配置将项目 / 配置文件标记为 `forceRerunTriggers`，这样当测试接线发生变化时，changed 模式重跑仍然正确。
    - 该配置会在受支持主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你希望为直接性能分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入耗时报告以及导入拆解输出。
    - `pnpm test:perf:imports:changed` 会将相同的性能分析视图限定到自 `origin/main` 以来发生变化的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整个配置运行使用配置路径作为键；include-pattern CI 分片会追加分片名，以便单独跟踪被过滤的分片。
    - 当某个热点测试仍把大部分时间花在启动导入上时，应将重型依赖放在一个狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了传给 `vi.mock(...)` 而深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交差异，对比定向的 `test:changed` 与原生根项目路径，并打印墙钟时间和 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会将当前未提交工作树中的变更文件列表路由到 `scripts/test-projects.mjs` 和根 Vitest 配置，从而进行基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动和 transform 开销写出主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出运行器 CPU + 堆 profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 默认启动一个启用了诊断功能的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言记录器保持有界、合成 RSS 样本保持在压力预算之下，且每个会话的队列深度会回落到零
- 预期：
  - 可安全用于 CI，且无需密钥
  - 这是用于稳定性回归跟进的窄通道，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下内置插件的 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 且设置 `isolate: false`，与仓库其他部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - 使用 `OPENCLAW_E2E_WORKERS=<n>` 强制指定 worker 数量（上限为 16）。
  - 使用 `OPENCLAW_E2E_VERBOSE=1` 重新启用详细控制台输出。
- 范围：
  - 多实例网关端到端行为
  - WebSocket / HTTP 表面、节点配对以及更重的网络行为
- 预期：
  - 会在 CI 中运行（当在流水线中启用时）
  - 不需要真实密钥
  - 比单元测试有更多可变因素（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell 网关
  - 从一个临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 运行 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥验证远端规范文件系统行为
- 预期：
  - 仅按需启用；不属于默认的 `pnpm test:e2e` 运行
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，之后会销毁测试网关和沙箱
- 常用覆盖项：
  - 在手动运行更宽泛的 e2e 测试套件时，设置 `OPENCLAW_E2E_OPENSHELL=1` 可启用该测试
  - 设置 `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非默认的 CLI 二进制或包装脚本

### live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下内置插件的 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型 _今天_ 是否真的能在真实凭证下工作？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题和速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行收窄后的子集，而不是“全部”
- live 运行会加载 `~/.profile` 以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置 / 认证材料复制到一个临时测试 home 中，这样单元测试夹具就不会修改你真实的 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：会保留 `[live] ...` 进度输出，但会隐藏额外的 `~/.profile` 提示，并静音 Gateway 网关启动日志 / Bonjour 噪音。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置逗号 / 分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 做每次 live 运行覆盖；测试会在遇到速率限制响应时重试。
- 进度 / 心跳输出：
  - live 测试套件现在会将进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也仍能显示为活跃状态。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此提供商 / 网关进度行会在 live 运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这个决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：额外运行 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## live（触网）测试

关于 live 模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、音乐、视频、媒体 harness）——以及 live 运行的凭证处理——请参阅 [Testing — live suites](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可用”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行其对应的 profile-key live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），同时挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认采用较小的冒烟上限，以便完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` 和
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想要进行更大范围的穷举扫描时，可覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建 / 复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅作为 Node / Git 运行器，用于 install / update / plugin-dependency 通道；这些通道会挂载预构建的 tarball。功能镜像则会把同一个 tarball 安装到 `/app` 中，用于已构建应用的功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行选定计划。这个聚合运行器使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会防止重型 live、npm 安装和多服务通道同时全部启动。默认值是 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；仅当 Docker 主机拥有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认会执行 Docker 预检，移除过期的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功通道的计时数据存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些计时数据优先启动更长的通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印加权通道清单，而不构建或运行 Docker；或者使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选通道、package / 镜像需求以及凭证的 CI 计划。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还会仅绑定挂载所需的 CLI 认证 home 目录（如果运行未收窄，则挂载所有受支持的目录），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改宿主机的认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，对 Droid / OpenCode 的严格覆盖可使用 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装已打包的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，并运行一次 mocked OpenAI 智能体轮次。可使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主机重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装已打包的 OpenClaw tarball，将渠道从 package `stable` 切换到 git `dev`，验证持久化的渠道和插件在更新后仍可用，然后再切回 package `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文 transcript 的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商，而不是卡住。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- Installer Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享同一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。非 root 安装器检查会保持隔离的 npm 缓存，以防 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当你需要直接 `npm install -g` 覆盖时，请在本地运行脚本且不要设置该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中植入两个共享同一工作区的智能体，运行 `agents delete --json`，并验证 JSON 合法性及工作区保留行为。可通过 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，以原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、光标提升的可点击元素、iframe 引用和 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个 mocked OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升为 `low`，然后强制提供商 schema 拒绝，并检查原始细节出现在 Gateway 网关日志中。
- MCP 渠道桥接（已植入的 Gateway 网关 + stdio bridge + 原始 Claude notification-frame 冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置文件 allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron / subagent MCP 清理（真实 Gateway 网关 + 在隔离的 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装 / 卸载、marketplace 更新，以及 Claude-bundle 启用 / 检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 live ClawHub 区块，或通过 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认 package。
- 插件更新未变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用该镜像，在完成一次新的本地构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主机重建，或通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向一个现有 tarball。完整 Docker 聚合运行器会预先打包这个 tarball 一次，然后将内置渠道检查切分为独立通道，其中包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新通道。直接运行内置通道时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 收窄渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 收窄更新场景。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 在迭代时收窄内置插件运行时依赖，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置后，诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的套件特定镜像覆盖项仍然优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地尚不存在，脚本会先拉取该镜像。QR 和 installer Docker 测试仍保留各自的 Dockerfile，因为它们验证的是 package / install 行为，而不是共享的已构建应用运行时。

live 模型 Docker 运行器还会以只读方式绑定挂载当前 checkout，并将其暂存到容器内的临时工作目录中。这样可以保持运行时镜像精简，同时仍然让 Vitest 针对你本地精确的源码 / 配置运行。
暂存步骤会跳过大型的本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或 Gradle 输出目录，这样 Docker live 运行就不会花上数分钟复制机器特定的工件。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram / Discord / 等渠道工作进程。
`test:docker:live-models` 仍然运行 `pnpm test:live`，因此当你需要从该 Docker 通道中收窄或排除 Gateway 网关 live 覆盖时，也要一并传递 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw 网关容器，针对该网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而且 Open WebUI 可能需要完成自身的冷启动设置。
该通道要求提供可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`（默认为 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model": "openclaw/default", ... }`。
`test:docker:mcp-channels` 被刻意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账户。它会启动一个已植入的 Gateway 网关容器，启动第二个容器来运行 `openclaw mcp serve`，然后验证路由后的会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 传输的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP frame，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live 模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP probe 服务器，通过嵌入式 Pi 内置 MCP 运行时将该服务器实体化，执行该工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型密钥。它会启动一个已植入的 Gateway 网关和一个真实的 stdio MCP probe 服务器，运行一个隔离的 cron 轮次和一个 `/subagents spawn` 一次性子智能体轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 请保留此脚本用于回归 / 调试工作流。后续在验证 ACP 线程路由时可能还需要它，因此不要删除。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前加载
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证来自 `OPENCLAW_PROFILE_FILE` 的环境变量，使用临时配置 / 工作区目录，且不挂载外部 CLI 认证目录
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄后的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在无需重建时复用现有 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而非环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择在 Open WebUI 冒烟测试中由网关暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试中使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

在修改文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify 锚点校验：`pnpm docs:check-links:anchors`。

## 离线回归测试（CI 安全）

这些是在没有真实提供商的情况下运行的“真实流水线”回归测试：

- Gateway 网关工具调用（mock OpenAI，真实网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入配置 + 认证）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些可安全用于 CI 的测试，其行为类似“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 的 mock 工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

针对 Skills（参见 [Skills](/zh-CN/tools/skills)），目前仍缺少的是：

- **决策能力：** 当 prompt 中列出 Skills 时，智能体是否会选择正确的 Skills（或避开无关的 Skills）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循所需步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用 mock 提供商的场景运行器，用于断言工具调用 + 顺序、Skills 文件读取以及会话接线。
- 一小组以 Skills 为中心的场景（使用 vs 避免、门控、提示注入）。
- 仅在 CI 安全测试套件就位后，才添加可选的 live 评估（按需启用、受环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组关于形状和行为的断言。默认的 `pnpm test` 单元测试通道会有意跳过这些共享接缝和冒烟文件；当你修改共享渠道或提供商表面时，请显式运行契约命令。

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
- **actions** - 渠道 action 处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### 提供商 Status 契约测试

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约测试

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流契约
- **auth-choice** - 认证选项 / 选择
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

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复了在 live 中发现的提供商 / 模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（mock / stub 提供商，或捕获精确的请求形状转换）
- 如果它本质上只能通过 live 测试验证（速率限制、认证策略），就保持 live 测试足够收窄，并通过环境变量按需启用
- 优先瞄准能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - Gateway 网关会话 / 历史 / 工具流水线缺陷 → Gateway 网关 live 冒烟测试或对 CI 安全的 Gateway 网关 mock 测试
- SecretRef 遍历保护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类的目标 id 时有意失败，以确保新类别不会被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)
