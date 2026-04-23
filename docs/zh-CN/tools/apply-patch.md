---
read_when:
    - 你需要在多个文件中进行结构化编辑
    - 你想记录或调试基于补丁的编辑
summary: 使用 apply_patch 工具应用多文件补丁
title: apply_patch 工具
x-i18n:
    generated_at: "2026-04-23T23:04:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

使用结构化补丁格式应用文件更改。这非常适合多文件或多处代码块编辑，因为单次 `edit` 调用在这种情况下会比较脆弱。

该工具接受一个 `input` 字符串参数，其中包裹一个或多个文件操作：

```
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

- `input`（必填）：完整的补丁内容，必须包含 `*** Begin Patch` 和 `*** End Patch`。

## 说明

- 补丁路径支持相对路径（相对于工作区目录）和绝对路径。
- `tools.exec.applyPatch.workspaceOnly` 默认值为 `true`（仅限工作区内）。只有在你明确希望 `apply_patch` 在工作区目录之外写入/删除时，才将其设为 `false`。
- 在 `*** Update File:` 代码块中使用 `*** Move to:` 可重命名文件。
- 必要时，可使用 `*** End of File` 标记仅在 EOF 处插入内容。
- 默认适用于 OpenAI 和 OpenAI Codex 模型。设置
  `tools.exec.applyPatch.enabled: false` 可禁用该功能。
- 也可以通过
  `tools.exec.applyPatch.allowModels`
  按模型进行限制。
- 配置仅位于 `tools.exec` 下。

## 示例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## 相关内容

- [Diffs](/zh-CN/tools/diffs)
- [Exec 工具](/zh-CN/tools/exec)
- [代码执行](/zh-CN/tools/code-execution)
