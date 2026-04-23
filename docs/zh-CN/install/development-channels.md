---
read_when:
    - 你想在 stable/beta/dev 之间切换
    - 你想固定某个特定版本、标签或 SHA
    - 你正在为预发布版本打标签或发布】【。final
sidebarTitle: Release Channels
summary: 稳定版、beta 和 dev 渠道：语义、切换、固定和标签
title: 发布渠道
x-i18n:
    generated_at: "2026-04-23T20:51:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70e8f57fb68143ded6bb58967925ec3d222df5728792353e974292daf442e0c
    source_path: install/development-channels.md
    workflow: 15
---

# 开发渠道

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。推荐大多数用户使用。
- **beta**：当其为当前版本时使用 npm dist-tag `beta`；如果 beta 缺失或版本低于
  最新稳定版，则更新流程会回退到 `latest`。
- **dev**：`main` 分支的移动头（git）。npm dist-tag：`dev`（发布时）。
  `main` 分支用于实验和活跃开发。它可能包含
  未完成的功能或破坏性更改。不要将其用于生产 Gateway 网关。

我们通常会先将稳定版构建发布到 **beta**，在那里进行测试，然后执行一个
显式晋升步骤，将已验证的构建移动到 `latest`，而**不**
更改版本号。维护者也可以在需要时直接将稳定版发布到 `latest`。
对于 npm 安装，dist-tag 是事实来源。

## 切换渠道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 会将你的选择持久化到配置中（`update.channel`），并对齐
安装方式：

- **`stable`**（package 安装）：通过 npm dist-tag `latest` 更新。
- **`beta`**（package 安装）：优先使用 npm dist-tag `beta`，但如果
  `beta` 缺失或版本低于当前稳定标签，则回退到 `latest`。
- **`stable`**（git 安装）：检出最新稳定 git 标签。
- **`beta`**（git 安装）：优先使用最新 beta git 标签，但如果 beta 缺失或版本较旧，则回退到
  最新稳定 git 标签。
- **`dev`**：确保存在一个 git 检出（默认 `~/openclaw`，可通过
  `OPENCLAW_GIT_DIR` 覆盖），切换到 `main`，对上游执行 rebase，构建，并
  从该检出安装全局 CLI。

提示：如果你想并行保留 stable + dev，请维护两个克隆，并让你的
gateway 指向 stable 那个。

## 一次性指定版本或标签

使用 `--tag` 可以在**不**更改持久化渠道的情况下，为单次
更新指定特定的 dist-tag、版本或包规范：

```bash
# 安装特定版本
openclaw update --tag 2026.4.1-beta.1

# 从 beta dist-tag 安装（一次性，不会持久化）
openclaw update --tag beta

# 从 GitHub main 分支安装（npm tarball）
openclaw update --tag main

# 安装特定 npm 包规范
openclaw update --tag openclaw@2026.4.1-beta.1
```

说明：

- `--tag` **仅适用于** package（npm）安装。Git 安装会忽略它。
- 该标签不会被持久化。你下一次运行 `openclaw update` 时，仍会照常使用你配置的
  渠道。
- 降级保护：如果目标版本低于当前版本，
  OpenClaw 会提示确认（可用 `--yes` 跳过）。
- `--channel beta` 与 `--tag beta` 不同：渠道流程可以在 beta 缺失或较旧时回退
  到 stable/latest，而 `--tag beta` 只是在本次运行中直接指定
  原始 `beta` dist-tag。

## 试运行

预览 `openclaw update` 将执行的操作，而不实际更改任何内容：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

试运行会显示生效的渠道、目标版本、计划执行的操作，以及
是否需要降级确认。

## 插件和渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 还会同步插件
来源：

- `dev` 优先使用来自 git 检出的内置插件。
- `stable` 和 `beta` 会恢复通过 npm 安装的插件包。
- 核心更新完成后，还会更新通过 npm 安装的插件。

## 检查当前状态

```bash
openclaw update status
```

显示当前激活渠道、安装类型（git 或 package）、当前版本，以及
来源（配置、git 标签、git 分支或默认值）。

## 标签最佳实践

- 为你希望 git 检出落到的发布打标签（稳定版使用 `vYYYY.M.D`，
  beta 使用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 出于兼容性也能识别，但优先推荐 `-beta.N`。
- 旧版 `vYYYY.M.D-<patch>` 标签仍会被识别为稳定版（非 beta）。
- 保持标签不可变：永远不要移动或复用某个标签。
- 对于 npm 安装，npm dist-tag 仍然是事实来源：
  - `latest` -> stable
  - `beta` -> 候选构建或 beta-first 稳定构建
  - `dev` -> main 快照（可选）

## macOS 应用可用性

Beta 和 dev 构建**可能不会**包含 macOS 应用发布。这是正常的：

- Git 标签和 npm dist-tag 仍然可以发布。
- 请在发布说明或变更日志中注明“此 beta 不包含 macOS 构建”。
