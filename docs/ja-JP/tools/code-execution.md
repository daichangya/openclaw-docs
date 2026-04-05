---
read_when:
    - code_execution を有効化または設定したいとき
    - ローカル shell アクセスなしでリモート分析をしたいとき
    - x_search または web_search をリモート Python 分析と組み合わせたいとき
summary: code_execution -- xAI を使ってサンドボックス化されたリモート Python 分析を実行
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T12:58:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` は xAI の Responses API 上で、サンドボックス化されたリモート Python 分析を実行します。
これはローカルの [`exec`](/tools/exec) とは異なります。

- `exec` はあなたのマシンまたはノード上で shell コマンドを実行します
- `code_execution` は xAI のリモート sandbox で Python を実行します

`code_execution` の用途:

- 計算
- 表形式への整理
- 手早い統計処理
- チャート風の分析
- `x_search` または `web_search` が返したデータの分析

ローカルファイル、あなたの shell、あなたのリポジトリ、またはペアリング済み
デバイスが必要な場合は**使わないでください**。その場合は [`exec`](/tools/exec) を使ってください。

## セットアップ

xAI API キーが必要です。次のいずれでも使えます。

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

例:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 使い方

自然に依頼し、分析したい意図を明確にしてください。

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

このツールは内部的には単一の `task` パラメータを受け取るため、エージェントは
分析リクエスト全体とインラインデータを1つのプロンプトで送る必要があります。

## 制限

- これはリモートの xAI 実行であり、ローカルプロセス実行ではありません。
- 永続的なノートブックではなく、一時的な分析として扱うべきです。
- ローカルファイルやワークスペースへのアクセスを前提にしないでください。
- 新しい X データが必要な場合は、まず [`x_search`](/tools/web#x_search) を使ってください。

## 関連項目

- [Web ツール](/tools/web)
- [Exec](/tools/exec)
- [xAI](/ja-JP/providers/xai)
