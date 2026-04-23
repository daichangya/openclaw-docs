---
read_when:
    - 捕获 macOS 日志或排查私有数据记录问题
    - 调试 Voice Wake / 会话生命周期问题
summary: OpenClaw 日志：滚动 diagnostics 文件日志 + 统一日志隐私标志
title: macOS 日志记录
x-i18n:
    generated_at: "2026-04-23T20:55:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e82cc564f7e33eed7add08d6c7fc70a4bb5309cf2bbedbb09ce0b798fe8155
    source_path: platforms/mac/logging.md
    workflow: 15
---

# 日志记录（macOS）

## 滚动 diagnostics 文件日志（调试面板）

OpenClaw 会通过 swift-log 路由 macOS 应用日志（默认使用 unified logging），并且当你需要持久化捕获时，也可以将本地滚动文件日志写入磁盘。

- 详细程度：**调试面板 → 日志 → 应用日志 → 详细程度**
- 启用：**调试面板 → 日志 → 应用日志 → “写入滚动 diagnostics 日志（JSONL）”**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（会自动轮转；旧文件会依次加上 `.1`、`.2` 等后缀）
- 清除：**调试面板 → 日志 → 应用日志 → “清除”**

说明：

- 此功能**默认关闭**。仅在你主动调试时启用。
- 请将该文件视为敏感信息；在未审查前不要分享。

## macOS 上 unified logging 的私有数据

除非某个子系统显式启用了 `privacy -off`，否则 unified logging 会对大多数载荷进行脱敏。根据 Peter 关于 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）的文章，这由 `/Library/Preferences/Logging/Subsystems/` 下一个以子系统名为键的 plist 控制。只有新的日志条目会应用该标志，因此你应在复现问题之前启用它。

## 为 OpenClaw（`ai.openclaw`）启用

- 先将 plist 写到一个临时文件，再以 root 身份原子性安装：

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 无需重启；`logd` 很快就会注意到该文件，但只有新的日志行才会包含私有载荷。
- 使用现有辅助脚本查看更丰富的输出，例如：`./scripts/clawlog.sh --category WebChat --last 5m`。

## 调试后禁用

- 删除该覆盖项：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可选执行 `sudo log config --reload`，以强制 `logd` 立即移除该覆盖。
- 请记住，这个界面可能包含电话号码和消息正文；只有在你确实主动需要额外细节时，才应保留该 plist。
