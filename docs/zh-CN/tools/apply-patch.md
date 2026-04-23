---
read_when:
    - 你需要在多个文件间进行结构化文件编辑
    - 你想记录或调试基于补丁的编辑
summary: 使用 `apply_patch` 工具应用多文件补丁
title: '`apply_patch` 工具'
x-i18n:
    generated_at: "2026-04-23T21:06:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b76404a9b3a039583c35b99167b63db639f27a1f0daf910973eb6cf05e7d3aab
    source_path: tools/apply-patch.md
    workflow: 15
---

使用结构化补丁格式应用文件更改。这非常适合多文件
或多补丁块编辑，因为单次 `edit` 调用在这种场景下会比较脆弱。

该工具接受一个单独的 `input` 字符串，其中封装一个或多个文件操作：

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## 参数

- `input`（必填）：完整补丁内容，包含 `*** Begin Patch` 和 `*** End Patch`。

## 说明

- 补丁路径支持相对路径（相对于工作区目录）和绝对路径。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（限制在工作区内）。只有在你明确希望 `apply_patch` 写入/删除工作区目录之外的内容时，才将其设置为 `false`。
- 在 `*** Update File:` 补丁块中，可使用 `*** Move to:` 重命名文件。
- 必要时，`*** End of File` 用于标记仅在 EOF 处插入的内容。
- 默认对 OpenAI 和 OpenAI Codex 模型可用。设置
  `tools.exec.applyPatch.enabled: false` 可将其禁用。
- 也可以通过
  `tools.exec.applyPatch.allowModels`
  按模型进行限制。
- 配置只位于 `tools.exec` 下。

## 示例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
