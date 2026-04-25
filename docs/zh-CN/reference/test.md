---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-25T22:52:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f8b33a3a9b7769b7abe34095029b147fe6e18fa24925cf62243ff5c51032eb
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，这样服务器测试就不会与正在运行的实例发生冲突。当之前的 Gateway 网关运行导致端口 18789 仍被占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，此门禁只统计单元覆盖率套件已加载的文件，而不会将每个拆分测试通道中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对相对于 `origin/main` 有变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 仅涉及可路由的源文件 / 测试文件时，会将变更过的 Git 路径展开为有范围限制的 Vitest 测试通道。配置 / setup 变更仍会回退到原生根项目运行，以便在需要时广泛重新运行接线相关修改。
- `pnpm changed:lanes`：显示针对 `origin/main` 的 diff 所触发的架构测试通道。
- `pnpm check:changed`：针对 `origin/main` 的 diff 运行智能变更门禁。它会将核心工作与核心测试通道一起运行，将扩展工作与扩展测试通道一起运行，将纯测试类工作限制为测试类型检查 / 测试本身，将公开的 插件 SDK 或插件契约变更扩展为一次扩展验证流程，并对仅涉及发布元数据的版本号变更保持在定向版本 / 配置 / 根依赖检查范围内。
- `pnpm test`：通过有范围限制的 Vitest 测试通道路由显式的文件 / 目录目标。未指定目标的运行会使用固定的分片组，并展开为叶子配置以便在本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 完整、扩展以及 include-pattern 分片运行会将本地计时数据更新到 `.artifacts/vitest-shard-timings.json`；后续的整配置运行会使用这些计时数据来平衡慢速和快速分片。include-pattern CI 分片会将分片名称追加到计时键名中，这样可以保留筛选后分片的计时信息，而不会替换整配置的计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量测试通道，这些通道仅保留 `test/setup.ts`，而运行时较重的用例仍保留在现有测试通道中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量测试通道中的显式同级测试，因此小型辅助文件修改无需重新运行重量级、依赖运行时的测试套件。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会主导较轻量的顶层 status / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有扩展 / 插件分片。重量级渠道插件、浏览器插件以及 OpenAI 会作为专用分片运行；其他插件组仍保持批量运行。对单个内置插件测试通道，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入明细报告，同时仍对显式文件 / 目录目标使用有范围限制的测试通道路由。
- `pnpm test:perf:imports:changed`：同样进行导入性能分析，但仅针对相对于 `origin/main` 有变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 Git diff，对路由后的 changed 模式路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行完整测试套件中的每个 Vitest 叶子配置，并写入分组时长数据以及每个配置对应的 JSON / 日志产物。Test Performance Agent 会在尝试修复慢测试之前，将其用作基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：对以性能为重点的变更前后进行分组报告比较。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择性启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false`，并采用自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥以及 `LIVE=1`（或特定提供商的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享的实时测试镜像和 Docker E2E 镜像各一次，然后通过加权调度器在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行 Docker 冒烟测试通道。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值也为 10。重量级测试通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认是每个提供商一个重量级测试通道桶，对应 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`。对于更大的主机，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。默认情况下，各测试通道会错开 2 秒启动，以避免本地 Docker daemon 在创建容器时出现风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会先执行 Docker 预检查、清理陈旧的 OpenClaw E2E 容器、每 30 秒输出一次活跃测试通道状态、在兼容测试通道之间共享提供商 CLI 工具缓存、默认对瞬时的实时提供商失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将测试通道计时信息存储到 `.artifacts/docker-tests/lane-timings.json`，以便后续运行按“最长优先”排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印测试通道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出频率，使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 可禁用计时复用。若仅需确定性 / 本地测试通道，请使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`；若仅需实时提供商测试通道，请使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；对应的软件包别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅实时模式会将 main 和 tail 的实时测试通道合并为一个按最长优先排序的池，以便提供商桶可以一起打包 Claude、Codex 和 Gemini 工作。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在首次失败后停止调度新的池化测试通道；每个测试通道都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的实时 / 尾部测试通道使用更严格的单通道上限。CLI 后端 Docker setup 命令拥有单独的超时设置，可通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个测试通道的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- CLI 后端实时 Docker 探测可以作为聚焦测试通道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。它需要一个可用的实时模型密钥（例如在 `~/.profile` 中配置的 OpenAI），会拉取外部 Open WebUI 镜像，而且不像常规单元 / e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的类 Claude 渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试能够反映 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合并 / 门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上偶发失败，请先重跑一次，再判断是否为回归问题；之后可使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准测试

脚本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：以上两个预设的组合

输出内容包括每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、退出码 / signal 分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，这样计时与 profile 捕获就会使用同一个 harness。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在需要容器化的新手引导冒烟测试时才需要它。

在干净的 Linux 容器中执行完整的冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保受维护的 QR 运行时辅助工具可在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
