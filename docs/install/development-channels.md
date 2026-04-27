---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定到某个特定版本、tag 或 SHA
    - 你正在为预发布版本打标签或发布
sidebarTitle: Release Channels
summary: 稳定版、beta 和 dev 渠道：语义、切换、固定版本和打标签
title: 发布渠道
x-i18n:
    generated_at: "2026-04-24T03:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# 开发渠道

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当前可用时使用 npm dist-tag `beta`；如果 beta 缺失或早于
  最新 stable 发布，则更新流程会回退到 `latest`。
- **dev**：`main` 的滚动头部版本（git）。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含
  未完成的功能或破坏性更改。不要将其用于生产 Gateway 网关。

我们通常会先将 stable 构建发布到 **beta**，在那里进行测试，然后执行
显式的提升步骤，将经过验证的构建移到 `latest`，而
不改变版本号。维护者也可以在需要时直接将 stable 发布
发布到 `latest`。对于 npm 安装，dist-tag 是事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置中（`update.channel`），并对齐
安装方式：

- **`stable`**（package 安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（package 安装）：优先使用 npm dist-tag `beta`，但当
  `beta` 缺失或早于当前 stable tag 时会回退到 `latest`。
- **`stable`**（git 安装）：检出最新的 stable git tag。
- **`beta`**（git 安装）：优先使用最新的 beta git tag，但当 beta 缺失或更早时，
  会回退到最新的 stable git tag。
- **`dev`**：确保存在一个 git 检出目录（默认 `~/openclaw`，可通过
  `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，基于上游执行 rebase，构建，并
  从该检出目录安装全局 CLI。

提示：如果你想并行保留 stable + dev，请保留两个克隆，并将你的
Gateway 网关指向 stable 的那个。

## 一次性指定版本或 tag

使用 `--tag` 可在单次
更新中指定特定 dist-tag、版本或 package spec，**而不会**更改你持久化的渠道：

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
- 该 tag 不会被持久化。你下一次运行 `openclaw update` 时，仍会照常使用已配置的
  渠道。
- 降级保护：如果目标版本早于你当前版本，
  OpenClaw 会提示确认（可用 `--yes` 跳过）。
- `--channel beta` 与 `--tag beta` 不同：渠道流程在 beta 缺失或更早时
  可以回退到 stable/latest，而 `--tag beta` 只会在那一次运行中针对原始
  `beta` dist-tag。

## 演练模式

预览 `openclaw update` 将执行什么操作，而不做任何更改：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

演练输出会显示生效渠道、目标版本、计划执行的操作，以及
是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 也会同步插件
来源：

- `dev` 优先使用 git 检出中的内置插件。
- `stable` 和 `beta` 会恢复通过 npm 安装的插件包。
- 在核心更新完成后，会更新通过 npm 安装的插件。

## 检查当前状态

```bash
openclaw update status
```

会显示活动渠道、安装类型（git 或 package）、当前版本，以及
来源（配置、git tag、git branch 或默认值）。

## 打 tag 的最佳实践

- 为你希望 git 检出落到的发布打 tag（stable 使用 `vYYYY.M.D`，
  beta 使用 `vYYYY.M.D-beta.N`）。
- 出于兼容性，也识别 `vYYYY.M.D.beta.N`，但优先使用 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` tag 仍识别为 stable（非 beta）。
- 保持 tag 不可变：绝不要移动或复用一个 tag。
- 对于 npm 安装，npm dist-tag 仍然是事实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或先发到 beta 的 stable 构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

beta 和 dev 构建可能**不**包含 macOS 应用发布。这是正常的：

- 仍然可以发布 git tag 和 npm dist-tag。
- 请在发布说明或更新日志中注明“此 beta 没有 macOS 构建”。

## 相关内容

- [更新](/zh-CN/install/updating)
- [安装器内部机制](/zh-CN/install/installer)
