---
read_when:
    - 自動compactionと /compact を理解したい
    - コンテキスト制限に達する長いセッションをデバッグしている
summary: OpenClawがモデルの制限内に収めるために長い会話をどのように要約するか
title: Compaction
x-i18n:
    generated_at: "2026-04-05T12:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

すべてのモデルにはコンテキストウィンドウ、つまり処理できるトークン数の上限があります。
会話がその制限に近づくと、OpenClawは古いメッセージを要約して
チャットを継続できるように**compacts**します。

## 仕組み

1. 古い会話ターンはcompactエントリーに要約されます。
2. 要約はセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClawが履歴をcompactionチャンクに分割するとき、assistantのtool
callは対応する `toolResult` エントリーとペアのまま保持されます。分割位置が
toolブロックの途中に来た場合、OpenClawはそのペアが一緒に保たれ、
現在の未要約の末尾が保持されるように境界を移動します。

会話の完全な履歴はディスク上に残ります。compactionは、次のターンで
モデルが見る内容だけを変更します。

## 自動compaction

自動compactionはデフォルトで有効です。セッションがコンテキスト制限に
近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに
実行されます（この場合、OpenClawはcompactionして再試行します）。典型的な
オーバーフローシグネチャには
`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` があります。

<Info>
compactionの前に、OpenClawは重要なメモを[memory](/concepts/memory)ファイルに保存するよう
エージェントへ自動的にリマインドします。これによりコンテキストの喪失を防ぎます。
</Info>

## 手動compaction

任意のチャットで `/compact` と入力すると、compactionを強制できます。要約を導くための
指示を追加することもできます。

```
/compact API設計の意思決定に集中して
```

## 別のモデルを使う

デフォルトでは、compactionはエージェントのプライマリモデルを使用します。より良い要約のために、
より高性能なモデルを使うこともできます。

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## compaction開始通知

デフォルトでは、compactionは静かに実行されます。compactionが
開始されたときに短い通知を表示するには、`notifyUser` を有効にします。

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

有効にすると、ユーザーには各compaction実行の開始時に短いメッセージ
（たとえば「コンテキストをcompactionしています...」）が表示されます。

## compaction と pruning の違い

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **何をするか**   | 古い会話を要約する            | 古いtool resultを削る            |
| **保存されるか** | はい（セッショントランスクリプト内） | いいえ（メモリ内のみ、リクエストごと） |
| **対象範囲**     | 会話全体                      | tool resultのみ                  |

[Session pruning](/concepts/session-pruning)は、要約せずにtool出力を
削る軽量な補完機能です。

## トラブルシューティング

**compactionの頻度が高すぎますか？** モデルのコンテキストウィンドウが小さいか、
tool出力が大きい可能性があります。
[session pruning](/concepts/session-pruning)を有効にしてみてください。

**compaction後にコンテキストが古く感じますか？** `/compact Focus on <topic>` を使って
要約を導くか、メモが残るように[memory flush](/concepts/memory)を有効にしてください。

**まっさらな状態から始めたいですか？** `/new` はcompactionせずに新しいセッションを開始します。

高度な設定（予約トークン、識別子の保持、カスタムコンテキストエンジン、
OpenAIのサーバーサイドcompaction）については、
[Session Management Deep Dive](/reference/session-management-compaction)を参照してください。

## 関連

- [Session](/concepts/session) — セッション管理とライフサイクル
- [Session Pruning](/concepts/session-pruning) — tool resultの削減
- [Context](/concepts/context) — エージェントターン用のコンテキストがどのように構築されるか
- [Hooks](/ja-JP/automation/hooks) — compactionライフサイクルフック（before_compaction、after_compaction）
