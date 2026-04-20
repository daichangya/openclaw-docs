---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-20T14:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60eac73850ec1b573113a89b9f9a75079b963a1dcd0f774d96e68b08b29f221d
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当之前的 Gateway 网关运行导致端口 18789 仍被占用时，使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。全局阈值为 70% 的行 / 分支 / 函数 / 语句覆盖率。覆盖率会排除集成度较高的入口点（CLI 连接逻辑、gateway/telegram 桥接、webchat 静态服务器），以便将目标聚焦在适合进行单元测试的逻辑上。
- `pnpm test:coverage:changed`：仅针对自 `origin/main` 以来变更的文件运行单元测试覆盖率。
- `pnpm test:changed`：当 diff 仅涉及可路由的源码 / 测试文件时，会将变更的 git 路径展开为有作用域的 Vitest 测试通道。配置 / 设置变更仍会回退到原生根项目运行，以便在连接逻辑发生修改时进行更广泛的重跑。
- `pnpm changed:lanes`：显示针对 `origin/main` 的 diff 所触发的架构通道。
- `pnpm check:changed`：针对 `origin/main` 的 diff 运行智能变更检查门。它会将核心工作映射到核心测试通道，将扩展工作映射到扩展测试通道，将纯测试工作限制为仅测试类型检查 / 测试，并将公共插件 SDK 或插件契约变更扩展为扩展验证。
- `pnpm test`：将显式的文件 / 目录目标通过有作用域的 Vitest 测试通道进行路由。未指定目标的运行现在会依次执行 11 个分片配置（`vitest.full-core-unit-src.config.ts`、`vitest.full-core-unit-security.config.ts`、`vitest.full-core-unit-ui.config.ts`、`vitest.full-core-unit-support.config.ts`、`vitest.full-core-support-boundary.config.ts`、`vitest.full-core-contracts.config.ts`、`vitest.full-core-bundled.config.ts`、`vitest.full-core-runtime.config.ts`、`vitest.full-agentic.config.ts`、`vitest.full-auto-reply.config.ts`、`vitest.full-extensions.config.ts`），而不是用一个庞大的根项目进程运行。
- 已选定的 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量测试通道进行路由，这些通道仅保留 `test/setup.ts`，而运行时较重的用例仍保留在原有测试通道中。
- 已选定的 `plugin-sdk` 和 `commands` 辅助源码文件现在也会将 `pnpm test:changed` 映射到这些轻量测试通道中的显式同级测试，因此对小型辅助文件的修改无需重新运行较重的运行时支持测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply 测试框架就不会主导较轻的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 运行 `vitest.extensions.config.ts`。
- `pnpm test:extensions`：运行扩展 / 插件测试套件。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时仍对显式文件 / 目录目标使用有作用域的测试通道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 git diff，将已路由的 changed 模式路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：针对当前工作区变更集进行基准测试，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 以及自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥，并设置 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元 / e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带有预置数据的 Gateway 网关容器，以及第二个会启动 `openclaw mcp serve` 的客户端容器，然后通过真实的 stdio 桥接验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映的是桥接实际发出的内容。

## 本地 PR 检查门

对于本地 PR 合入 / 检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在将其视为回归之前请先重跑一次，然后用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“只回复一个单词：ok。不要使用标点或额外文本。”

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
- `all`：同时包含两个预设

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小值 / 最大值、退出码 / 信号分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时与 profile 捕获使用的是同一套测试框架。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已纳入版本控制的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已纳入版本控制的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅在需要容器化新手引导冒烟测试时才需要。

在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
