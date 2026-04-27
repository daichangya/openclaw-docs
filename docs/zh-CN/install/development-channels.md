---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定到特定版本、标签或 SHA
    - 你正在为预发布版本打标签或发布
sidebarTitle: Release Channels
summary: 稳定版、beta 和开发版渠道：语义、切换、固定版本和标签管理
title: 发布渠道
x-i18n:
    generated_at: "2026-04-27T06:04:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 15
---

# 开发渠道

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当前可用时使用 npm dist-tag `beta`；如果 beta 缺失或比最新稳定版更旧，更新流程会回退到 `latest`。
- **dev**：`main` 的移动头部（git）。npm dist-tag：`dev`（发布时）。`main` 分支用于实验和活跃开发。它可能包含未完成的功能或破坏性变更。不要将其用于生产 Gateway 网关。

我们通常会先将稳定版本发布到 **beta**，在该渠道完成测试后，再执行一个显式的提升步骤，将已验证的构建移动到 `latest`，而不更改版本号。维护者也可以在需要时直接将稳定版本发布到 `latest`。对于 npm 安装，dist-tag 是唯一真实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置中（`update.channel`），并对齐安装方式：

- **`stable`**（package 安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（package 安装）：优先使用 npm dist-tag `beta`，但当 `beta` 缺失或比当前稳定标签更旧时，会回退到 `latest`。
- **`stable`**（git 安装）：检出最新的稳定 git 标签。
- **`beta`**（git 安装）：优先使用最新的 beta git 标签，但当 beta 缺失或更旧时，会回退到最新的稳定 git 标签。
- **`dev`**：确保存在一个 git 检出（默认 `~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，基于上游执行 rebase，构建，并从该检出安装全局 CLI。

<Tip>
如果你想同时保留 stable 和 dev，请保留两个克隆，并让你的 Gateway 网关 指向 stable 那个。
</Tip>

## 一次性指定版本或标签

使用 `--tag` 可以在**不**更改持久化渠道的情况下，为单次更新指定特定 dist-tag、版本或 package spec：

```bash
# 安装特定版本
openclaw update --tag 2026.4.1-beta.1

# 从 beta dist-tag 安装（一次性，不会持久化）
openclaw update --tag beta

# 从 GitHub main 分支安装（npm tarball）
openclaw update --tag main

# 安装特定 npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

说明：

- `--tag` **仅适用于** package（npm）安装。git 安装会忽略它。
- 该标签不会被持久化。你的下一次 `openclaw update` 仍会像往常一样使用已配置的渠道。
- 降级保护：如果目标版本早于你当前的版本，OpenClaw 会提示你确认（可使用 `--yes` 跳过）。
- `--channel beta` 与 `--tag beta` 不同：渠道流程会在 beta 缺失或更旧时回退到 stable/latest，而 `--tag beta` 仅在该次运行中直接指定原始 `beta` dist-tag。

## Dry run

在不进行实际更改的情况下预览 `openclaw update` 将执行什么操作：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run 会显示生效渠道、目标版本、计划执行的操作，以及是否需要降级确认。

## 插件与渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件来源：

- `dev` 优先使用 git 检出中的内置插件。
- `stable` 和 `beta` 会恢复通过 npm 安装的插件包。
- 通过 npm 安装的插件会在核心更新完成后更新。

## 检查当前状态

```bash
openclaw update status
```

显示当前启用的渠道、安装类型（git 或 package）、当前版本以及来源（配置、git 标签、git 分支或默认值）。

## 标签最佳实践

- 为你希望 git 检出最终落到的版本打标签（稳定版使用 `vYYYY.M.D`，beta 使用 `vYYYY.M.D-beta.N`）。
- 出于兼容性考虑，也识别 `vYYYY.M.D.beta.N`，但建议优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍会被识别为稳定版（非 beta）。
- 保持标签不可变：绝不要移动或复用某个标签。
- 对于 npm 安装，dist-tag 仍然是唯一真实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或 beta 优先的稳定构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

beta 和 dev 构建**可能不**包含 macOS 应用发布。这是正常的：

- git 标签和 npm dist-tag 仍然可以发布。
- 请在发布说明或变更日志中注明“此 beta 没有 macOS 构建”。

## 相关

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
