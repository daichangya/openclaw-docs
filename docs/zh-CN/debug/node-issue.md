---
read_when:
    - 调试仅在 Node 环境下运行的开发脚本或 watch 模式故障
    - 排查 OpenClaw 中的 tsx/esbuild 加载器崩溃
summary: Node + tsx 中 “__name is not a function” 崩溃的说明和变通方案
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-04-23T20:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6de878f9c95415f7d55e9e3336129da3e0e07e780cc87565c9f2fddc728834bd
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx “\_\_name is not a function” 崩溃

## 摘要

通过 Node 配合 `tsx` 运行 OpenClaw 时，启动会失败，并报错：

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

这个问题出现在将开发脚本从 Bun 切换到 `tsx` 之后（提交 `2871657e`，2026-01-06）。
相同的运行时路径在 Bun 下是正常工作的。

## 环境

- Node：v25.x（在 v25.3.0 上观察到）
- tsx：4.21.0
- 操作系统：macOS（其他运行 Node 25 的平台上也很可能可复现）

## 复现方法（仅 Node）

```bash
# 在仓库根目录
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 仓库内最小复现

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本检查

- Node 25.3.0：失败
- Node 22.22.0（Homebrew `node@22`）：失败
- Node 24：此处尚未安装；仍需验证

## 说明 / 假设

- `tsx` 使用 esbuild 来转换 TS/ESM。esbuild 的 `keepNames` 会生成一个 `__name` 辅助函数，并用 `__name(...)` 包装函数定义。
- 该崩溃表明运行时 `__name` 存在，但它不是一个函数，这意味着在 Node 25 加载器路径中，该模块的辅助函数缺失或被覆盖了。
- 在其他使用 esbuild 的项目中，也曾报告过类似的 `__name` 辅助函数问题，通常发生在该辅助函数缺失或被重写时。

## 回归历史

- `2871657e`（2026-01-06）：脚本从 Bun 改为 tsx，以使 Bun 变为可选项。
- 在那之前（Bun 路径），`openclaw status` 和 `gateway:watch` 都是正常工作的。

## 变通方案

- 对开发脚本继续使用 Bun（当前的临时回退方案）。
- 使用 `tsgo` 对仓库进行类型检查，然后运行构建产物：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 历史说明：在调试这个 Node/tsx 问题时，这里曾使用 `tsc`，但仓库当前的类型检查流程现在使用 `tsgo`。
- 如果可能，在 TS 加载器中禁用 esbuild 的 keepNames（可避免插入 `__name` 辅助函数）；但 `tsx` 当前并未暴露这个选项。
- 使用 `tsx` 测试 Node LTS（22/24），以确认该问题是否仅限于 Node 25。

## 参考

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 后续步骤

- 在 Node 22/24 上复现，以确认是否是 Node 25 回归。
- 测试 `tsx` 夜间版本，或固定到更早版本（如果已知存在某个回归版本）。
- 如果在 Node LTS 上也能复现，请向上游提交一个最小复现，并附上 `__name` 堆栈跟踪。
