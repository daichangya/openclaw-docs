---
read_when:
    - 更新设备型号标识符映射或 NOTICE / 许可证文件
    - 更改 Instances UI 显示设备名称的方式
summary: OpenClaw 如何为 macOS 应用中的友好名称内置 Apple 设备型号标识符。
title: 设备型号数据库
x-i18n:
    generated_at: "2026-04-23T21:03:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86fd45d31a030db44b7ef9da73a3eccbadd5d0f213c0ed45eead9c115c42dc0
    source_path: reference/device-models.md
    workflow: 15
---

# 设备型号数据库（友好名称）

macOS 配套应用会通过将 Apple 型号标识符（例如 `iPad16,6`、`Mac16,6`）映射为人类可读名称，在 **Instances** UI 中显示友好的 Apple 设备型号名称。

该映射以 JSON 形式内置在以下位置：

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 数据来源

我们当前从以下 MIT 许可证仓库内置该映射：

- `kyle-seongwoo-jun/apple-device-identifiers`

为了保持构建的确定性，JSON 文件固定到特定的上游提交（记录在 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` 中）。

## 更新数据库

1. 选择你要固定的上游提交（iOS 一个，macOS 一个）。
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
5. 验证 macOS 应用能够干净构建（无警告）：

```bash
swift build --package-path apps/macos
```
