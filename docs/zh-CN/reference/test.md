---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 `force` / `coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-21T21:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具集（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，这样服务器测试就不会与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用这个命令。
- `pnpm test:coverage`：通过 V8 覆盖率运行单元测试套件（经由 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，不是针对整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句覆盖率 70%，分支覆盖率 55%。由于 `coverage.all` 为 false，这个门禁衡量的是单元覆盖率测试套件中已加载的文件，而不是把每个拆分测试通道中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源码 / 测试文件时，会将变更的 Git 路径展开为有作用域的 Vitest 测试通道。配置 / 设置变更仍会回退到原生 root projects 运行，以便在需要时对 wiring 变更进行更广泛的重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更门禁。它会将核心改动与核心测试通道一起运行，将扩展改动与扩展测试通道一起运行，将仅测试改动限制为仅测试类型检查 / 测试，并将公开的插件 SDK 或插件契约变更扩展到扩展验证，同时让仅发布元数据的版本变更保留为有针对性的版本 / 配置 / 根依赖检查。
- `pnpm test`：通过有作用域的 Vitest 测试通道路由显式的文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置以进行本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是一个巨大的 root-project 进程。
- 完整运行和扩展分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地时序数据；后续运行会利用这些时序来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略该本地时序产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量通道路由，这些通道只保留 `test/setup.ts`，而运行时负担较重的用例仍保留在原有通道上。
- 选定的 `plugin-sdk` 和 `commands` 辅助源码文件也会将 `pnpm test:changed` 映射到这些轻量通道中的显式同级测试，因此小型辅助文件编辑无需重新运行依赖重运行时的重型测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会主导较轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展 / 插件分片。重量级渠道扩展和 OpenAI 会作为专用分片运行；其他扩展组保持批量处理。对单个内置插件通道使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时仍对显式文件 / 目录目标使用有作用域的通道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对相同的已提交 Git diff，将已路由的 changed 模式路径与原生 root-project 运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax / zai）。需要 API 密钥，并设置 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才会取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元 / e2e 测试套件那样预期具有 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个预置数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实的 stdio bridge 验证路由会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及类 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此这个冒烟测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

在本地进行 PR 合并 / 门禁检查时，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上出现偶发失败，在将其视为回归之前先重跑一次，然后用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279 ms（最小 1114，最大 2431）
- opus 中位数 2454 ms（最小 1224，最大 3170）

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
- `all`：两个预设都包含

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、退出码 / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获使用的是同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture：`test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化的新手引导冒烟测试时才需要它。

在干净的 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

这个脚本会通过伪终端驱动交互式向导，验证 config / workspace / session 文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时中加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
