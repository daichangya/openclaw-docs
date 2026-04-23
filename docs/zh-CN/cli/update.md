---
read_when:
    - 你想相对安全地更新源码检出副本
    - 你需要理解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关 自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-23T06:40:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，无 git 元数据），
更新会通过 [Updating](/zh-CN/install/updating) 中的软件包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 网关 服务。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖软件包目标。对于软件包安装，`main` 映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新操作（渠道/标签/目标/重启流程），但不会写入配置、安装、同步插件或重启。
- `--json`：输出机器可读的 `UpdateRunResult` JSON，包括在更新后插件同步期间检测到 npm 插件产物漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1200 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前活动的更新渠道 + git 标签/分支/SHA（适用于源码检出），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：输出机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你在没有 git 检出的情况下选择 `dev`，它会
提供创建检出的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持安装方式一致：

- `dev` → 确保存在一个 git 检出（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR`` 覆盖），
  更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 不存在或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关 核心自动更新器（在配置中启用时）会复用同一条更新路径。

对于软件包管理器安装，`openclaw update` 会在调用软件包管理器之前解析目标软件包
版本。如果已安装版本与目标完全一致，且不需要持久化更新渠道变更，
命令会在软件包安装、插件同步、补全刷新或 Gateway 网关 重启之前以跳过状态退出。

## Git 检出流程

渠道：

- `stable`：检出最新的非 beta 标签，然后执行构建 + doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 不存在或更旧时，
  回退到最新 stable 标签。
- `dev`：检出 `main`，然后执行 fetch + rebase。

高级流程：

1. 要求工作树干净（没有未提交的更改）。
2. 切换到所选渠道（标签或分支）。
3. 拉取上游（仅 dev）。
4. 仅 dev：在临时工作树中执行预检 lint + TypeScript 构建；如果最新提交失败，则最多回退 10 个提交，以找到最新的可干净构建版本。
5. 变基到所选提交（仅 dev）。
6. 使用仓库的软件包管理器安装依赖。对于 pnpm 检出，更新器会按需引导 `pnpm`（优先通过 `corepack`，然后回退到临时 `npm install pnpm@10`），而不是在 pnpm 工作区内运行 `npm run build`。
7. 构建 + 构建 Control UI。
8. 运行 `openclaw doctor` 作为最终的“安全更新”检查。
9. 将插件同步到当前渠道（dev 使用内置插件；stable/beta 使用 npm），并更新通过 npm 安装的插件。

如果一个精确固定版本的 npm 插件更新解析到的产物，其完整性与已存储的安装记录不同，
`openclaw update` 会中止该插件产物更新，而不是安装它。只有在确认你信任该新产物之后，
才应显式重新安装或更新该插件。

如果 pnpm 引导仍然失败，更新器现在会尽早停止，并报告针对该软件包管理器的特定错误，
而不是尝试在检出中运行 `npm run build`。

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 另请参见

- `openclaw doctor`（在 git 检出上会先提供运行更新）
- [Development channels](/zh-CN/install/development-channels)
- [Updating](/zh-CN/install/updating)
- [CLI reference](/zh-CN/cli)
