---
read_when:
    - 你需要检查原始模型输出中的推理泄漏问题
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：监视模式、原始模型流以及推理泄漏追踪
title: 调试
x-i18n:
    generated_at: "2026-04-23T20:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1a389f149703de9ebd9937772041572d086e77c0d760cb7718a8d42025f5b2c
    source_path: help/debugging.md
    workflow: 15
---

本页介绍用于调试流式输出的辅助工具，尤其适用于某个提供商将推理内容混入普通文本的情况。

## 运行时调试覆盖

在聊天中使用 `/debug` 可设置**仅运行时**的配置覆盖（存于内存，不写磁盘）。
`/debug` 默认禁用；请通过 `commands.debug: true` 启用。
当你需要切换某些冷门设置、又不想编辑 `openclaw.json` 时，这会非常方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖项，并回到磁盘上的配置。

## 会话 trace 输出

如果你想在单个会话中查看由插件拥有的 trace/debug 行，而不打开完整 verbose 模式，请使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于插件诊断，例如 Active Memory 调试摘要。
普通 verbose 状态/工具输出仍请继续使用 `/verbose`，而运行时配置覆盖则继续使用 `/debug`。

## 临时 CLI 调试计时

OpenClaw 将 `src/cli/debug-timing.ts` 保留为一个用于本地排查的小型辅助工具。它有意**不会**默认接入 CLI 启动、命令路由或任何命令。只有在调试某个慢命令时才使用它，然后在合入行为变更之前移除导入和 spans。

当某个命令变慢，而你需要在决定使用 CPU profiler 或修复某个特定子系统之前快速了解各阶段耗时时，请使用它。

### 添加临时 spans

在你正在排查的代码附近添加该辅助工具。例如，在调试
`openclaw models list` 时，位于
`src/commands/models/list.list-command.ts` 的临时补丁可能如下所示：

```ts
// 仅用于临时调试。提交前请移除。
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

指导原则：

- 临时阶段名请使用 `debug:` 前缀。
- 只在怀疑较慢的区段周围添加少量 spans。
- 相比辅助函数名，更推荐使用较宽泛的阶段名，例如 `registry`、`auth_store` 或 `rows`。
- 同步工作使用 `time()`，Promise 使用 `timeAsync()`。
- 保持 stdout 干净。该辅助工具会写入 stderr，因此命令的 JSON 输出仍可被解析。
- 在打开最终修复 PR 前，请移除临时导入和 spans。
- 在解释优化的 issue 或 PR 中，附上计时输出或简短摘要。

### 以可读形式运行

可读模式最适合实时调试：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

来自一次临时 `models list` 排查的示例输出：

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

从这段输出可以得到的结论：

| 阶段 | 时间 | 含义 |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store` | 20.3s | auth-profile 存储加载是最大的开销，应优先排查。 |
| `debug:models:list:ensure_models_json` | 5.0s | 同步 `models.json` 足够昂贵，值得检查是否有缓存或跳过条件。 |
| `debug:models:list:load_model_registry` | 5.9s | 注册表构建和提供商可用性处理也是明显开销。 |
| `debug:models:list:read_registry_models` | 2.4s | 读取所有注册表模型并非零成本，对 `--all` 可能很重要。 |
| 行追加阶段 | 总计 3.2s | 即使只构建五行显示结果也要花几秒，因此值得进一步检查过滤路径。 |
| `debug:models:list:print_model_table` | 0ms | 渲染不是瓶颈。 |

这些结论已足以指导下一版补丁，而无需将计时代码保留在生产路径中。

### 以 JSON 输出运行

当你想保存或比较计时数据时，请使用 JSON 模式：

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderr 的每一行都是一个 JSON 对象：

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 提交前清理

在打开最终 PR 之前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

该命令不应返回任何临时插桩调用点，除非该 PR 明确是在添加一个永久性的诊断界面。对于普通性能修复，请只保留行为变更、测试以及简短的计时证据说明。

对于更深层的 CPU 热点，请使用 Node profiling（`--cpu-prof`）或外部 profiler，而不是添加更多计时包装器。

## Gateway 网关监视模式

为便于快速迭代，请在文件监视器下运行 gateway：

```bash
pnpm gateway:watch
```

它映射到：

```bash
node scripts/watch-node.mjs gateway --force
```

该监视器会在以下构建相关文件变化时重启：`src/` 下的文件、扩展源码文件、
扩展的 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、
`package.json` 以及 `tsdown.config.ts`。扩展元数据变更会重启 gateway，
但不会强制执行 `tsdown` 重建；源码和配置变更仍会先重建 `dist`。

在 `gateway:watch` 后添加任何 gateway CLI 标志，这些标志都会在每次重启时传递下去。现在，在同一仓库/相同标志集上重复运行同一个 watch 命令，会替换旧的 watcher，而不会留下重复的 watcher 父进程。

## dev profile + dev gateway（`--dev`）

使用 dev profile 可隔离状态，并为调试启动一个安全、可丢弃的设置。这里有**两个** `--dev` 标志：

- **全局 `--dev`（profile）：** 将状态隔离到 `~/.openclaw-dev` 下，并将 gateway 默认端口设为 `19001`（由此派生的端口也会相应偏移）。
- **`gateway --dev`：告诉 Gateway 网关在缺失时自动创建默认配置 + 工作区**（并跳过 `BOOTSTRAP.md`）。

推荐流程（dev profile + dev bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请使用 `pnpm openclaw ...` 运行 CLI。

其作用如下：

1. **Profile 隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 端口也会相应偏移）

2. **Dev bootstrap**（`gateway --dev`）
   - 如果缺失，则写入一个最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设为 dev 工作区。
   - 设置 `agent.skipBootstrap=true`（不创建 `BOOTSTRAP.md`）。
   - 如果缺失，则初始化以下工作区文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（protocol droid）。
   - 在 dev 模式下跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

注意：`--dev` 是一个**全局** profile 标志，某些运行器会吞掉它。
如果你需要明确写出，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 会清除配置、凭证、会话和 dev 工作区（使用
`trash` 而不是 `rm`），然后重新创建默认的 dev 设置。

提示：如果已有一个非 dev gateway 正在运行（launchd/systemd），请先停止它：

```bash
openclaw gateway stop
```

## 原始流日志（OpenClaw）

OpenClaw 可以记录**原始助手流**，即在任何过滤/格式化之前的内容。
这是查看推理是否作为普通文本 delta 到达（或作为独立 thinking 块到达）的最佳方式。

通过 CLI 启用：

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始分块日志（pi-mono）

为了在原始 OpenAI 兼容分块被解析成块之前捕获它们，
pi-mono 提供了一个独立的日志记录器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：只有使用 pi-mono 的
> `openai-completions` 提供商的进程才会发出此日志。

## 安全说明

- 原始流日志可能包含完整提示词、工具输出和用户数据。
- 请将日志保留在本地，并在调试后删除。
- 如果你需要分享日志，请先清理密钥和 PII。
