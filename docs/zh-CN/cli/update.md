---
read_when:
    - 你想安全地更新源码 checkout
    - 你需要了解 `--update` 的简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源码更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-23T20:45:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f5dcd97c9bc426c8d6ef7979976a27ad90729c692435d5716e09069d7d08266
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你是通过 **npm/pnpm/bun** 安装的（全局安装，没有 git 元数据），
更新会通过 [Updating](/zh-CN/install/updating) 中的包管理器流程进行。

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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；会持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新动作（channel/tag/target/restart 流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括
  在更新后插件同步期间检测到 npm 插件产物漂移时的
  `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1200 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前更新渠道 + git tag/branch/SHA（针对源码 checkout），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你在没有 git checkout 的情况下选择 `dev`，
它会提供创建一个 checkout 的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 还会保持
安装方式同步一致：

- `dev` → 确保存在一个 git checkout（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该 checkout 安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta
  缺失或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会复用同样的更新路径。

对于包管理器安装，`openclaw update` 会在调用包管理器之前解析目标包
版本。如果已安装版本与目标完全匹配，并且无需持久化更新渠道变更，
该命令会在执行包安装、插件同步、补全刷新
或 gateway 重启工作之前直接以 skipped 退出。

## Git checkout 流程

渠道：

- `stable`：checkout 最新的非 beta tag，然后构建 + doctor。
- `beta`：优先使用最新的 `-beta` tag，但当 beta 不存在或更旧时，
  回退到最新 stable tag。
- `dev`：checkout `main`，然后执行 fetch + rebase。

高层流程：

1. 要求工作树干净（没有未提交更改）。
2. 切换到所选渠道（tag 或 branch）。
3. 获取上游更新（仅 dev）。
4. 仅 dev：在临时工作树中执行预检 lint + TypeScript 构建；如果最新提交失败，则最多回退 10 个提交以寻找最新的可干净构建版本。
5. 变基到所选提交上（仅 dev）。
6. 使用仓库的包管理器安装依赖。对于 pnpm checkout，更新器会按需引导 `pnpm`（优先通过 `corepack`，然后回退到临时执行 `npm install pnpm@10`），而不是在 pnpm workspace 中运行 `npm run build`。
7. 构建 + 构建 Control UI。
8. 运行 `openclaw doctor` 作为最终的“安全更新”检查。
9. 将插件同步到当前渠道（dev 使用内置插件；stable/beta 使用 npm），并更新通过 npm 安装的插件。

如果某个精确固定版本的 npm 插件更新解析到的产物，其完整性与已存储的安装记录不同，`openclaw update` 会中止该插件产物更新，而不是安装它。只有在确认你信任该新产物之后，才应显式重新安装或更新该插件。

如果 pnpm 引导仍然失败，更新器现在会尽早停止，并给出包管理器专用错误，而不是尝试在该 checkout 中运行 `npm run build`。

## `--update` 简写

`openclaw --update` 会被重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 另请参见

- `openclaw doctor`（在 git checkout 上会先提供运行 update）
- [Development channels](/zh-CN/install/development-channels)
- [Updating](/zh-CN/install/updating)
- [CLI reference](/zh-CN/cli)
