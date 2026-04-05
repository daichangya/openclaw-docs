---
read_when:
    - 複数ファイルにまたがる構造化された編集が必要なとき
    - パッチベースの編集を文書化またはデバッグしたいとき
summary: apply_patch ツールで複数ファイルのパッチを適用する
title: apply_patch ツール
x-i18n:
    generated_at: "2026-04-05T12:57:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca6e702e7ccdf132c71dc6d973f1d435ad6d772e1b620512c8969420cb8f7a
    source_path: tools/apply-patch.md
    workflow: 15
---

# apply_patch ツール

構造化されたパッチ形式を使ってファイル変更を適用します。これは、単一の `edit` 呼び出しでは壊れやすい、複数ファイルまたは複数ハンクにまたがる編集に最適です。

このツールは、1 つ以上のファイル操作を包む単一の `input` 文字列を受け付けます。

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

## パラメーター

- `input`（必須）: `*** Begin Patch` と `*** End Patch` を含む完全なパッチ内容。

## 注意事項

- パッチパスは相対パス（ワークスペースディレクトリー基準）と絶対パスをサポートします。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true`（ワークスペース内に限定）です。`apply_patch` でワークスペースディレクトリー外に書き込みまたは削除したい意図がある場合にのみ、`false` に設定してください。
- ファイル名を変更するには、`*** Update File:` ハンク内で `*** Move to:` を使います。
- 必要な場合、`*** End of File` は EOF のみに対する挿入を示します。
- OpenAI および OpenAI Codex モデルではデフォルトで利用できます。無効化するには `tools.exec.applyPatch.enabled: false` を設定してください。
- 必要に応じて `tools.exec.applyPatch.allowModels` でモデルごとの制限もできます。
- 設定は `tools.exec` 配下にのみあります。

## 例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
