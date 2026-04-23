---
read_when:
    - 你希望在 OpenClaw 中获得更短的 `exec` 或 `bash` 工具结果
    - 你想启用内置 tokenjuice 插件
    - 你需要了解 tokenjuice 会改变什么，以及哪些内容会保持原样
summary: 使用一个可选的内置插件压缩嘈杂的 exec 和 bash 工具结果
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T21:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: be9f7e13ab609717da4d2603e8a5102444460bf9beb13d1b25252d7cb5cfec09
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` 是一个可选的内置插件，用于在命令已经运行之后压缩嘈杂的 `exec` 和 `bash`
工具结果。

它改变的是返回的 `tool_result`，而不是命令本身。Tokenjuice 不会
重写 shell 输入、重新运行命令，也不会更改退出码。

目前这适用于 Pi 嵌入式运行，其中 tokenjuice 会挂接到嵌入式
`tool_result` 路径，并裁剪回写到会话中的输出。

## 启用插件

快速方式：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效方式：

```bash
openclaw plugins enable tokenjuice
```

OpenClaw 已经内置了该插件。不需要额外执行 `plugins install`
或 `tokenjuice install openclaw`。

如果你更喜欢直接编辑配置：

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## tokenjuice 会改变什么

- 在 `exec` 和 `bash` 结果回写进会话之前，压缩其中嘈杂的输出。
- 保持原始命令执行过程不变。
- 保留精确的文件内容读取以及其他应该保持原样的命令结果。
- 采用选择加入方式：如果你希望所有地方都保留原样输出，请禁用该插件。

## 验证它是否生效

1. 启用插件。
2. 启动一个能够调用 `exec` 的会话。
3. 运行一个嘈杂的命令，例如 `git status`。
4. 检查返回的工具结果是否比原始 shell 输出更短、结构更清晰。

## 禁用插件

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或者：

```bash
openclaw plugins disable tokenjuice
```
