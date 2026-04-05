---
read_when:
    - ツール出力によるコンテキスト増大を抑えたい場合
    - Anthropicのプロンプトキャッシュ最適化を理解したい場合
summary: 古いツール結果を削減して、コンテキストを軽く保ち、キャッシュ効率を高める方法
title: Session Pruning
x-i18n:
    generated_at: "2026-04-05T12:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Session Pruning

Session pruningは、各LLM呼び出しの前にコンテキストから**古いツール結果**を削減します。これにより、
通常の会話テキストは書き換えずに、蓄積したツール出力（実行結果、ファイル読み取り、
検索結果）によるコンテキスト肥大化を抑えます。

<Info>
pruningはメモリ内でのみ行われ、ディスク上のセッショントランスクリプトは変更しません。
完全な履歴は常に保持されます。
</Info>

## なぜ重要か

長いセッションでは、コンテキストウィンドウを膨らませるツール出力が蓄積します。これにより
コストが増え、必要以上に早く [compaction](/concepts/compaction) が必要になることがあります。

pruningは、特に**Anthropic prompt caching**にとって価値があります。キャッシュTTLが
切れた後、次のリクエストでは完全なプロンプトが再キャッシュされます。pruningは
キャッシュ書き込みサイズを減らし、コストを直接下げます。

## 仕組み

1. キャッシュTTLが切れるのを待ちます（デフォルトは5分）。
2. 通常のpruningのために古いツール結果を見つけます（会話テキストはそのまま残します）。
3. 大きすぎる結果を**ソフトトリム**します -- 先頭と末尾を残し、`...` を挿入します。
4. 残りを**ハードクリア**します -- プレースホルダーに置き換えます。
5. TTLをリセットし、後続のリクエストで新しいキャッシュを再利用します。

## レガシー画像クリーンアップ

OpenClawは、履歴内に生の画像ブロックを保存していた古いレガシーセッション向けに、
別個の冪等なクリーンアップも実行します。

- **直近の3つの完了済みターン**はバイト単位でそのまま保持されるため、
  直後のフォローアップに対するプロンプトキャッシュ接頭辞の安定性が保たれます。
- `user` または `toolResult` の履歴内にある、すでに処理済みの古い画像ブロックは、
  `[image data removed - already processed by model]` に置き換えられる場合があります。
- これは通常のキャッシュTTL pruningとは別です。後続ターンで画像ペイロードが繰り返し
  プロンプトキャッシュを無効化するのを防ぐために存在します。

## 賢いデフォルト

OpenClawは、Anthropicプロファイルに対して自動的にpruningを有効にします。

| プロファイルタイプ                                      | pruning有効 | Heartbeat |
| ------------------------------------------------------- | ----------- | --------- |
| Anthropic OAuth/token認証（Claude CLI再利用を含む）     | はい        | 1時間     |
| API key                                                 | はい        | 30分      |

明示的な値を設定した場合、OpenClawはそれを上書きしません。

## 有効化または無効化

Anthropic以外のプロバイダーでは、pruningはデフォルトで無効です。有効にするには:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

無効にするには、`mode: "off"` を設定します。

## pruningとcompactionの違い

|            | Pruning              | Compaction              |
| ---------- | -------------------- | ----------------------- |
| **何をするか** | ツール結果を削減する      | 会話を要約する            |
| **保存されるか** | いいえ（リクエストごと） | はい（トランスクリプト内） |
| **対象範囲**   | ツール結果のみ         | 会話全体                |

両者は相互補完の関係にあり、pruningは
compactionサイクルの合間にツール出力を軽量に保ちます。

## さらに読む

- [Compaction](/concepts/compaction) -- 要約ベースのコンテキスト削減
- [Gateway Configuration](/gateway/configuration) -- pruning設定項目の全一覧
  （`contextPruning.*`）
