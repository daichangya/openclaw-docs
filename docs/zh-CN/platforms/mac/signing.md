---
read_when:
    - 构建或签名 mac 调试构建时
summary: 由打包脚本生成的 macOS 调试构建签名步骤
title: macOS 签名
x-i18n:
    generated_at: "2026-04-23T20:55:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 562f4a9541473eaf9bc9d1a01cb1a1a0e4bde48418ee2cece455614596f99dc6
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac 签名（调试构建）

此应用通常通过 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 构建，该脚本现在会：

- 设置一个稳定的调试 bundle 标识符：`ai.openclaw.mac.debug`
- 使用该 bundle id 写入 Info.plist（可通过 `BUNDLE_ID=...` 覆盖）
- 调用 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 对主二进制和应用 bundle 进行签名，这样 macOS 会将每次重建视为同一个已签名 bundle，并保留 TCC 权限（通知、辅助功能、屏幕录制、麦克风、语音）。若要稳定保留权限，请使用真实签名身份；ad-hoc 仅在显式选择启用时使用，且较为脆弱（请参见 [macOS permissions](/zh-CN/platforms/mac/permissions)）。
- 默认使用 `CODESIGN_TIMESTAMP=auto`；它会为 Developer ID 签名启用受信任时间戳。设置 `CODESIGN_TIMESTAMP=off` 可跳过时间戳（适用于离线调试构建）。
- 将构建元数据注入 Info.plist：`OpenClawBuildTimestamp`（UTC）和 `OpenClawGitCommit`（短哈希），以便 About 面板显示构建、git 以及调试/发布渠道。
- **打包默认使用 Node 24**：脚本会运行 TS 构建和 Control UI 构建。Node 22 LTS（当前为 `22.14+`）仍然出于兼容性而受支持。
- 从环境变量读取 `SIGN_IDENTITY`。将 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 证书）添加到你的 shell rc 中，这样就会始终使用你的证书进行签名。ad-hoc 签名需要通过 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 显式选择启用（不推荐用于权限测试）。
- 在签名后运行 Team ID 审计；如果应用 bundle 内任何 Mach-O 由不同的 Team ID 签名，则会失败。设置 `SKIP_TEAM_ID_CHECK=1` 可绕过。

## 用法

```bash
# from repo root
scripts/package-mac-app.sh               # 自动选择身份；如果找不到则报错
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 真实证书
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc（权限不会保留）
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 显式 ad-hoc（同样有上述限制）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 仅开发用的 Sparkle Team ID 不匹配变通方案
```

### Ad-hoc 签名说明

当使用 `SIGN_IDENTITY="-"`（ad-hoc）进行签名时，脚本会自动禁用 **Hardened Runtime**（`--options runtime`）。这是为了防止应用在尝试加载 Team ID 不同的嵌入式框架（如 Sparkle）时发生崩溃。Ad-hoc 签名也会破坏 TCC 权限持久化；恢复步骤请参见 [macOS permissions](/zh-CN/platforms/mac/permissions)。

## 用于 About 的构建元数据

`package-mac-app.sh` 会为 bundle 写入以下信息：

- `OpenClawBuildTimestamp`：打包时的 ISO8601 UTC 时间
- `OpenClawGitCommit`：短 git 哈希（不可用时为 `unknown`）

About 标签页会读取这些键，以显示版本、构建日期、git 提交以及是否为调试构建（通过 `#if DEBUG`）。代码更改后，请重新运行打包脚本以刷新这些值。

## 原因

TCC 权限与 bundle 标识符 _以及_ 代码签名绑定。带有变化 UUID 的未签名调试构建会导致 macOS 在每次重建后忘记已授予权限。对二进制进行签名（默认是 ad-hoc），并保持固定的 bundle id/路径（`dist/OpenClaw.app`），可以在构建之间保留这些授权，与 VibeTunnel 的做法一致。
