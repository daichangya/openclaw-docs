---
read_when:
    - 更新设备型号标识符映射或 NOTICE/许可证文件
    - 更改 Instances UI 显示设备名称的方式
summary: OpenClaw 如何在 macOS 应用中内置 Apple 设备型号标识符，以提供友好名称。
title: 设备型号数据库
x-i18n:
    generated_at: "2026-04-24T03:18:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# 设备型号数据库（友好名称）

macOS 配套应用会在 **Instances** UI 中显示友好的 Apple 设备型号名称，方法是将 Apple 型号标识符（例如 `iPad16,6`、`Mac16,6`）映射为人类可读的名称。

该映射以内置 JSON 的形式存放在：

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 数据来源

我们当前从以下采用 MIT 许可证的仓库内置该映射：

- `kyle-seongwoo-jun/apple-device-identifiers`

为确保构建具有确定性，这些 JSON 文件会固定到特定的上游提交（记录于 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`）。

## 更新数据库

1. 选择你要固定到的上游提交（iOS 一个，macOS 一个）。
2. 更新 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中的提交哈希。
3. 重新下载固定到这些提交的 JSON 文件：

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. 确保 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` 仍与上游一致（如果上游许可证发生变化，请替换它）。
5. 验证 macOS 应用能够顺利构建（无警告）：

```bash
swift build --package-path apps/macos
```

## 相关

- [节点](/zh-CN/nodes)
- [节点故障排除](/zh-CN/nodes/troubleshooting)
