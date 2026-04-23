---
read_when:
    - 你希望在 OpenClaw 中让 `exec` 或 `bash` 工具结果更短
    - 你想启用内置的 tokenjuice 插件
    - 你需要了解 tokenjuice 会修改什么，以及它会保留哪些原始内容
summary: 使用一个可选的内置插件压缩嘈杂的 exec 和 bash 工具结果
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-23T23:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff542095eb730f06eadec213289b93e31f1afa179160b7d4e915329f09ad5f1
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` 是一个可选的内置插件，会在命令已经运行完成后压缩嘈杂的 `exec` 和 `bash`
工具结果。

它修改的是返回的 `tool_result`，而不是命令本身。Tokenjuice 不会
重写 shell 输入、重新运行命令，或更改退出码。

目前这适用于 Pi 嵌入式运行，其中 tokenjuice 会 hook 嵌入式
`tool_result` 路径，并裁剪回写到会话中的输出。

## 启用插件

快捷方式：

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

等效方式：

```bash
openclaw plugins enable tokenjuice
```

OpenClaw 已经内置了该插件。无需单独执行 `plugins install`
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

## tokenjuice 会修改什么

- 在将嘈杂的 `exec` 和 `bash` 结果回送到会话之前进行压缩。
- 保持原始命令执行不变。
- 保留精确的文件内容读取，以及 tokenjuice 应保留为原样的其他命令。
- 保持为选择启用：如果你希望所有地方都保留逐字输出，请禁用该插件。

## 验证它是否生效

1. 启用该插件。
2. 启动一个可以调用 `exec` 的会话。
3. 运行一个嘈杂的命令，例如 `git status`。
4. 检查返回的工具结果是否比原始 shell 输出更短且结构更清晰。

## 禁用插件

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

或者：

```bash
openclaw plugins disable tokenjuice
```

## 相关内容

- [Exec 工具](/zh-CN/tools/exec)
- [Thinking levels](/zh-CN/tools/thinking)
- [上下文引擎](/zh-CN/concepts/context-engine)
