---
read_when:
    - 调试 macOS 权限提示缺失或卡住的问题
    - 打包或签名 macOS 应用
    - 更改 bundle ID 或应用安装路径
summary: macOS 权限持久化（TCC）和签名要求
title: macOS 权限
x-i18n:
    generated_at: "2026-04-23T22:59:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887b7517ff45f14ceb624ce08fae74a4d5ff8fb97bac21664d3fa16e2810f202
    source_path: platforms/mac/permissions.md
    workflow: 15
---

macOS 的权限授予非常脆弱。TCC 会将权限授予与应用的代码签名、bundle identifier 以及磁盘路径关联起来。如果其中任何一项发生变化，macOS 就会把该应用视为一个新应用，并可能丢弃提示或不再显示提示。

## 稳定权限的要求

- 路径保持一致：从固定位置运行应用（对于 OpenClaw，是 `dist/OpenClaw.app`）。
- bundle identifier 保持一致：更改 bundle ID 会创建新的权限身份。
- 应用必须已签名：未签名或 ad-hoc 签名的构建不会持久化权限。
- 签名保持一致：使用真实的 Apple Development 或 Developer ID 证书，这样签名在多次重建之间才能保持稳定。

ad-hoc 签名每次构建都会生成新的身份。macOS 会忘记之前授予的权限，而提示甚至可能完全消失，直到清除陈旧条目为止。

## 当提示消失时的恢复检查清单

1. 退出应用。
2. 在“系统设置 -> 隐私与安全性”中移除该应用条目。
3. 从同一路径重新启动应用，并重新授予权限。
4. 如果提示仍未出现，使用 `tccutil` 重置 TCC 条目后再试一次。
5. 某些权限只有在完整重启 macOS 后才会再次出现。

重置示例（请根据需要替换 bundle ID）：

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 文件和文件夹权限（Desktop/Documents/Downloads）

macOS 还可能对终端/后台进程访问 Desktop、Documents 和 Downloads 进行限制。如果文件读取或目录列出卡住，请为执行文件操作的同一进程上下文授予访问权限（例如 Terminal/iTerm、由 LaunchAgent 启动的应用，或 SSH 进程）。

变通办法：如果你想避免按文件夹逐个授予权限，可将文件移动到 OpenClaw 工作区（`~/.openclaw/workspace`）中。

如果你正在测试权限，请始终使用真实证书进行签名。ad-hoc
构建只适用于权限无关紧要的快速本地运行。
