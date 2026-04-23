---
read_when:
    - 你想安全地更新一个源代码检出副本
    - 你需要理解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-23T22:56:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

安全地更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你是通过 **npm/pnpm/bun** 安装的（全局安装，无 git 元数据），更新会通过 [更新](/zh-CN/install/updating) 中的包管理器流程进行。

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
- `--dry-run`：预览计划中的更新操作（渠道/标签/目标/重启流程），不会写入配置、安装、同步插件或重启。
- `--json`：输出机器可读的 `UpdateRunResult` JSON；如果在更新后插件同步期间检测到 npm 插件产物漂移，还会包含 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1200 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前启用的更新渠道 + git 标签/分支/SHA（对于源代码检出副本），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：输出机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道，并确认更新后是否重启 Gateway 网关（默认会重启）。如果你在没有 git 检出副本的情况下选择 `dev`，它会提供创建检出副本的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1200`）

## 它会执行什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 还会保持安装方式一致：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm 的 `beta` dist-tag，但当 beta 缺失或比当前 stable 版本更旧时，会回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会复用这条相同的更新路径。

对于包管理器安装，`openclaw update` 会在调用包管理器之前先解析目标包版本。如果已安装版本与目标完全一致，且不需要持久化任何更新渠道变更，则命令会在包安装、插件同步、补全刷新或 Gateway 网关重启之前以“已跳过”状态退出。

## Git 检出副本流程

渠道：

- `stable`：检出最新的非 beta 标签，然后执行 build + doctor。
- `beta`：优先检出最新的 `-beta` 标签，但当 beta 缺失或更旧时会回退到最新 stable 标签。
- `dev`：检出 `main`，然后执行 fetch + rebase。

高级流程：

1. 需要干净的工作树（没有未提交的更改）。
2. 切换到选定的渠道（标签或分支）。
3. 获取上游更新（仅 dev）。
4. 仅 dev：在临时工作树中执行预检 lint + TypeScript build；如果最新提交失败，则最多向后回退 10 个提交，以找到最新一个能干净构建的提交。
5. rebase 到选定提交之上（仅 dev）。
6. 使用仓库的包管理器安装依赖。对于 pnpm 检出副本，更新器会按需引导安装 `pnpm`（优先通过 `corepack`，然后回退到临时执行 `npm install pnpm@10`），而不是在 pnpm 工作区内运行 `npm run build`。
7. 执行 build，并构建 Control UI。
8. 运行 `openclaw doctor`，作为最终的“安全更新”检查。
9. 将插件同步到当前渠道（dev 使用内置插件；stable/beta 使用 npm），并更新通过 npm 安装的插件。

如果某个精确固定版本的 npm 插件更新解析到的产物，其完整性与已存储的安装记录不同，`openclaw update` 会中止该插件产物更新，而不是安装它。只有在确认你信任这个新产物之后，才应显式重新安装或更新该插件。

如果 pnpm 引导安装仍然失败，更新器现在会尽早停止，并给出特定于包管理器的错误，而不是尝试在检出副本内运行 `npm run build`。

## `--update` 简写

`openclaw --update` 会被重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 相关

- `openclaw doctor`（在 git 检出副本中会先提供运行 update 的选项）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)
