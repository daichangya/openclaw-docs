---
read_when:
    - 你想安全地更新一个源码检出副本
    - 你需要理解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（相对安全的源码更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-04-26T09:50:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
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
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖软件包目标。对于软件包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划中的更新操作（channel/tag/target/restart 流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：输出机器可读的 `UpdateRunResult` JSON；如果在更新后插件同步期间检测到 npm 插件产物漂移，还会包含 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认值为 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前激活的更新渠道 + git tag/branch/SHA（针对源码检出副本），以及是否有可用更新。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：输出机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认值为 3 秒）。

## `update wizard`

交互式流程，用于选择更新渠道并确认更新后是否重启 Gateway 网关
（默认会重启）。如果你在没有 git 检出副本的情况下选择 `dev`，
它会提供创建一个检出副本的选项。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它的作用

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会让
安装方式保持一致：

- `dev` → 确保存在一个 git 检出副本（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该检出副本安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但如果 beta 不存在
  或比当前 stable 发布更旧，则回退到 `latest`。

Gateway 网关核心自动更新器（在配置中启用时）会复用这同一条更新路径。

对于软件包管理器安装，`openclaw update` 会在调用软件包管理器之前
解析目标软件包版本。即使已安装版本已经与目标一致，该命令仍会刷新
全局软件包安装，然后执行插件同步、补全刷新和重启相关工作。这样可以确保
打包的 sidecar 和渠道所属的插件记录与已安装的 OpenClaw
构建保持一致。

## Git 检出副本流程

渠道：

- `stable`：检出最新的非 beta tag，然后执行 build + doctor。
- `beta`：优先选择最新的 `-beta` tag，但如果 beta 不存在或更旧，
  则回退到最新的 stable tag。
- `dev`：检出 `main`，然后执行 fetch + rebase。

高级流程：

1. 需要一个干净的工作区（没有未提交的更改）。
2. 切换到所选渠道（tag 或 branch）。
3. 获取上游更新（仅 dev）。
4. 仅 dev：在临时工作区中执行预检 lint + TypeScript build；如果最新提交失败，则最多回退 10 个提交以找到最新的可干净构建版本。
5. 变基到所选提交（仅 dev）。
6. 使用仓库的软件包管理器安装依赖。对于 pnpm 检出副本，更新器会按需引导安装 `pnpm`（优先通过 `corepack`，然后使用临时的 `npm install pnpm@10` 作为回退），而不是在 pnpm workspace 内运行 `npm run build`。
7. 执行 build + 构建 Control UI。
8. 运行 `openclaw doctor` 作为最终的“安全更新”检查。
9. 将插件同步到当前激活的渠道（dev 使用内置插件；stable/beta 使用 npm），并更新通过 npm 安装的插件。

如果某个精确固定版本的 npm 插件更新解析到的产物，其完整性与已存储的安装记录
不同，`openclaw update` 会中止该插件产物更新，而不是安装它。只有在确认
你信任新产物之后，才应显式重新安装或更新该插件。

更新后插件同步失败会导致更新结果失败，并停止后续的重启相关工作。
修复插件安装/更新错误后，再重新运行
`openclaw update`。

如果 pnpm 引导安装仍然失败，更新器现在会提前停止，并返回一个针对软件包管理器的特定错误，而不是尝试在检出副本中执行 `npm run build`。

## `--update` 简写

`openclaw --update` 会被重写为 `openclaw update`（对 shell 和启动脚本很有用）。

## 相关内容

- `openclaw doctor`（在 git 检出副本上会先提供运行 update 的选项）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI reference](/zh-CN/cli)
