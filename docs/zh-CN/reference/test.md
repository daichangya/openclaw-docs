---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest）以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-26T03:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 116cca51d259ca68c2547eac6f271b7ce7df20a995b9405022e06b7615bcfc6d
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的遗留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，这样服务端测试就不会与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 `18789` 仍被占用时，使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是“已加载文件”的单元覆盖率门禁，不是整个仓库的“所有文件”覆盖率。阈值为：行 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁衡量的是单元覆盖率套件加载到的文件，而不是把每个拆分测试 lane 中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对相对于 `origin/main` 发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 仅涉及可路由的源文件 / 测试文件时，将已变更的 git 路径展开为有作用域的 Vitest lanes。配置 / setup 变更仍会回退到原生根项目运行，因此当接线层面的修改有需要时，会更广泛地重新运行测试。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lanes。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能 changed gate。它会对核心代码使用核心测试 lanes，对扩展使用扩展测试 lanes，对纯测试改动仅运行测试 typecheck / 测试，把公开插件 SDK 或插件契约变更扩展为一次扩展验证，并将仅涉及发布元数据的版本提升限制在定向的版本 / 配置 / 根依赖检查中。
- `pnpm test`：通过有作用域的 Vitest lanes 路由显式的文件 / 目录目标。未指定目标的运行会使用固定的分片组，并展开为叶子配置以便本地并行执行；扩展组始终展开为按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 完整测试、扩展测试和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地耗时数据；后续整套配置运行会使用这些耗时数据来平衡慢分片和快分片。include-pattern 的 CI 分片会将分片名称附加到耗时键上，从而在不替换整套配置耗时数据的前提下，保留筛选分片的耗时。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量 lanes，这些 lanes 仅保留 `test/setup.ts`，而运行时较重的用例仍留在原有 lanes 中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量 lanes 中的显式同级测试，因此小型辅助函数改动可以避免重新运行那些依赖重运行时的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导更轻量的 top-level status / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展 / 插件分片。重量级渠道插件、浏览器插件以及 OpenAI 会作为专用分片运行；其他插件组仍保持批处理。对某个内置插件 lane，使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 的导入耗时和导入明细报告，同时仍对显式文件 / 目录目标使用有作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：同样进行导入分析，但仅针对相对于 `origin/main` 发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对同一已提交 git diff 下，“已路由的 changed 模式路径”与“原生根项目运行”进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：对当前 worktree 的改动集合进行基准对比，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + 堆 profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组耗时数据以及每个配置对应的 JSON / 日志产物。Test Performance Agent 会在尝试修复慢测试之前，将其作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：比较一次以性能为重点的变更前后的分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax / zai）。需要 API keys，并设置 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享的 live-test 镜像和 Docker E2E 镜像各一次，然后通过加权调度器在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行 Docker smoke lanes。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认是 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认也是 10。重型 lane 上限默认值为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 设为每个提供商一个重型 lane。对于更大的主机，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。默认情况下，各 lane 启动会错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会对 Docker 做预检、清理陈旧的 OpenClaw E2E 容器、每 30 秒输出一次活跃 lane 状态、在兼容 lanes 之间共享提供商 CLI 工具缓存、默认对瞬时的 live-provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane 耗时存储在 `.artifacts/docker-tests/lane-timings.json` 中，以便后续运行按“最长优先”排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出间隔，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。对仅本地 / 确定性 lanes，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`；对仅 live-provider lanes，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；对应的包别名分别是 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅 live 模式会把主 live lanes 和尾部 live lanes 合并为一个按最长优先排序的池，以便提供商 bucket 能将 Claude、Codex 和 Gemini 的工作混合打包。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在首次失败后停止调度新的池化 lanes；每个 lane 还有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live / tail lanes 使用更严格的单 lane 上限。CLI 后端 Docker 设置命令有单独的超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个 lane 的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个基于 Chromium 的 source E2E 容器，启动原始 CDP 和隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照是否包含链接 URL、由光标提升的可点击元素、iframe 引用和 frame 元数据。
- CLI 后端 live Docker 探测可以作为聚焦 lane 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型密钥（例如在 `~/.profile` 中配置的 OpenAI），会拉取外部 Open WebUI 镜像，并且不像常规单元 / e2e 测试套件那样预期具有 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个预置数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证路由会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio 桥接传输的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试反映的是桥接实际发出的内容。

## 本地 PR gate

对于本地 PR 合并 / gate 检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现 flaky，先重跑一次，再将其视为回归，然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，可使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

## CLI 启动基准

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
- `all`：同时包含这两个预设

输出包括每条命令的 `sampleCount`、avg、p50、p95、min / max、exit-code / signal 分布以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，这样计时与 profile 采集会使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在运行容器化的新手引导 smoke 测试时才需要。

在一个干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置 / workspace / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke（Docker）

确保维护中的 QR 运行时辅助工具能够在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [Testing live](/zh-CN/help/testing-live)
