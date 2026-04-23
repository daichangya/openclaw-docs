---
read_when:
    - 处理 Pi 集成代码或测试
    - 运行 Pi 专用的 lint、typecheck 和实时测试流程
summary: Pi 集成的开发工作流：构建、测试和实时验证
title: Pi 开发工作流
x-i18n:
    generated_at: "2026-04-23T20:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84eb5b7c3256fa5dd2f9719136b16ee435876952888efde0d81f8bfa8a63b1f0
    source_path: pi-dev.md
    workflow: 15
---

本指南总结了一套在 OpenClaw 中处理 Pi 集成的合理工作流。

## 类型检查与 Lint

- 默认本地门禁：`pnpm check`
- 构建门禁：当变更可能影响构建输出、打包或懒加载/模块边界时，运行 `pnpm build`
- 对 Pi 影响较大的变更，完整落地门禁：`pnpm check && pnpm test`

## 运行 Pi 测试

直接用 Vitest 运行 Pi 相关测试集：

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

如需包含实时 provider 验证：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

这覆盖了主要的 Pi 单元测试套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手动测试

推荐流程：

- 以开发模式运行 gateway：
  - `pnpm gateway:dev`
- 直接触发智能体：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：
  - `pnpm tui`

对于工具调用行为，可提示执行 `read` 或 `exec` 动作，以便查看工具流式传输和负载处理。

## 重置为干净状态

状态位于 OpenClaw 状态目录下。默认是 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，则应使用该目录。

如需重置全部内容：

- 配置：`openclaw.json`
- 模型认证配置文件（API key + OAuth）：`agents/<agentId>/agent/auth-profiles.json`
- 仍存放在认证配置文件存储之外的 provider/channel 状态：`credentials/`
- 智能体会话历史：`agents/<agentId>/sessions/`
- 会话索引：`agents/<agentId>/sessions/sessions.json`
- 如果存在旧路径：`sessions/`
- 如果你想要一个空白工作区：`workspace/`

如果你只想重置会话，请删除该智能体的 `agents/<agentId>/sessions/`。如果你想保留认证信息，请保留 `agents/<agentId>/agent/auth-profiles.json` 以及 `credentials/` 下的所有 provider 状态。

## 参考

- [测试](/zh-CN/help/testing)
- [入门指南](/zh-CN/start/getting-started)
