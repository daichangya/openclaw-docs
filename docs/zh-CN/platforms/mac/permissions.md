---
read_when:
    - 调试缺失或卡住的 macOS 权限提示
    - 打包或签名 macOS 应用
    - 更改 bundle ID 或应用安装路径
summary: macOS 权限持久化（TCC）和签名要求
title: macOS 权限@endsection to=final code omitted?
x-i18n:
    generated_at: "2026-04-23T20:55:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d7a9e19d6b3d9687b71061e016c5c211cc92d4223560f74e45fe4d245ec3539
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# macOS 权限（TCC）

macOS 的权限授予非常脆弱。TCC 会将权限授予与应用的
代码签名、bundle identifier 以及磁盘路径关联起来。如果其中任何一项发生变化，
macOS 就会把该应用视为新应用，并可能丢失或隐藏权限提示。

## 保持权限稳定的要求

- 相同路径：从固定位置运行应用（对于 OpenClaw，为 `dist/OpenClaw.app`）。
- 相同 bundle identifier：更改 bundle ID 会创建新的权限身份。
- 已签名应用：未签名或临时签名（ad-hoc signed）的构建不会持久保存权限。
- 一致的签名：使用真实的 Apple Development 或 Developer ID 证书，
  以便在重建之间保持签名稳定。

临时签名每次构建都会生成新的身份。macOS 会忘记先前的
授权，并且在清除陈旧条目之前，提示甚至可能完全不再出现。

## 当权限提示消失时的恢复检查清单

1. 退出应用。
2. 在“系统设置 -> 隐私与安全性”中移除该应用条目。
3. 从相同路径重新启动应用，并重新授予权限。
4. 如果提示仍未出现，请使用 `tccutil` 重置 TCC 条目后再试。
5. 某些权限只有在完整重启 macOS 后才会重新出现。

重置示例（请根据需要替换 bundle ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 文件与文件夹权限（Desktop / Documents / Downloads）

macOS 还可能对终端 / 后台进程访问 Desktop、Documents 和 Downloads 进行限制。如果文件读取或目录列出发生卡顿，请为执行文件操作的同一进程上下文授予访问权限（例如 Terminal / iTerm、由 LaunchAgent 启动的应用，或 SSH 进程）。

解决方法：如果你想避免按文件夹授予权限，可将文件移动到 OpenClaw 工作区（`~/.openclaw/workspace`）中。

如果你在测试权限，请始终使用真实证书进行签名。临时签名
仅适用于权限无关紧要的快速本地运行。
