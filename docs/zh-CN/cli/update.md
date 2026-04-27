---
read_when:
    - 你想安全地更新源代码检出副本
    - 你需要了解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-27T06:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3089126cb245ed6011fa4829018f67e3a16c983bc7a4dfbe80371ef53e2db47b
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的软件包管理器流程进行。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。对于确实会重启 Gateway 网关的软件包管理器更新，命令只有在验证重启后的服务报告了预期的更新版本后才会成功。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖软件包目标。对于软件包安装，`main` 映射为 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新操作（渠道/标签/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括在更新后插件同步期间检测到 npm 插件工件漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每一步的超时时间（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。

<Warning>
降级需要确认，因为旧版本可能会破坏配置。
</Warning>

## `update status`

显示当前更新渠道 + git 标签/分支/SHA（适用于源代码检出），以及是否有可用更新。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你选择 `dev` 但没有 git 检出，
它会提供创建检出的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道时（`--channel ...`），OpenClaw 也会保持
安装方式一致：

- `dev` → 确保存在 git 检出（默认：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆盖），
  更新该检出，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 不存在
  或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会复用同一更新路径。

对于软件包管理器安装，`openclaw update` 会先解析目标软件包
版本，然后再调用软件包管理器。即使已安装版本
已经与目标一致，该命令仍会刷新全局软件包安装，
随后运行插件同步、补全刷新和重启流程。这样可以保持打包的
sidecar 和渠道拥有的插件记录与已安装的 OpenClaw
构建版本一致。

## Git 检出流程

### 渠道选择

- `stable`：检出最新的非 beta 标签，然后执行构建和 doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 不存在或更旧时回退到最新 stable 标签。
- `dev`：检出 `main`，然后执行 fetch 和 rebase。

### 更新步骤

<Steps>
  <Step title="验证工作树干净">
    要求没有未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="获取上游更新">
    仅适用于 dev。
  </Step>
  <Step title="预检构建（仅 dev）">
    在临时 worktree 中运行 lint 和 TypeScript 构建。如果最新提交失败，则最多回退检查 10 个提交，以找到最新的可正常构建版本。
  </Step>
  <Step title="Rebase">
    Rebase 到所选提交（仅 dev）。
  </Step>
  <Step title="安装依赖">
    使用仓库的软件包管理器。对于 pnpm 检出，更新器会按需引导 `pnpm`（优先通过 `corepack`，然后回退到临时执行 `npm install pnpm@10`），而不是在 pnpm workspace 中运行 `npm run build`。
  </Step>
  <Step title="构建 Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="运行 Doctor">
    `openclaw doctor` 会作为最终的安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到当前渠道。Dev 使用内置插件；stable 和 beta 使用 npm。还会更新通过 npm 安装的插件。
  </Step>
</Steps>

<Warning>
如果某个精确固定版本的 npm 插件更新解析到的工件，其完整性与已存储的安装记录不同，`openclaw update` 会中止该插件工件更新，而不是安装它。只有在确认你信任该新工件之后，才重新安装或显式更新该插件。
</Warning>

<Note>
更新后插件同步失败会使更新结果失败，并停止后续的重启流程。请先修复插件安装或更新错误，然后重新运行 `openclaw update`。

当更新后的 Gateway 网关启动时，已启用的内置插件运行时依赖会在插件激活前完成暂存。由更新触发的重启会在关闭 Gateway 网关之前排空所有正在进行的运行时依赖暂存，因此服务管理器重启不会打断进行中的 npm 安装。

如果 pnpm 引导仍然失败，更新器会尽早停止，并报告软件包管理器特定错误，而不是尝试在检出中运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 相关内容

- `openclaw doctor`（在 git 检出中会先提供运行 update 的选项）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
