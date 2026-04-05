---
read_when:
    - メモリ昇格を自動的に実行したい場合
    - dreaming のモードとしきい値を理解したい場合
    - '`MEMORY.md` を汚さずに統合を調整したい場合'
summary: 短期リコールから長期メモリへのバックグラウンド昇格
title: Dreaming（実験的）
x-i18n:
    generated_at: "2026-04-05T12:41:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming（実験的）

Dreaming は `memory-core` におけるバックグラウンドのメモリ統合パスです。

「dreaming」と呼ばれるのは、システムがその日に出てきた内容を見直し、
永続的なコンテキストとして保持する価値があるものを判断するためです。

Dreaming は **実験的**、**オプトイン**、**デフォルトで無効** です。

## dreaming が行うこと

1. `memory_search` のヒットから得られる短期リコールイベントを
   `memory/YYYY-MM-DD.md` に追跡します。
2. 重み付きシグナルでそれらのリコール候補をスコアリングします。
3. 条件を満たした候補のみを `MEMORY.md` に昇格します。

これにより、長期メモリは一度きりの詳細ではなく、永続的で繰り返し現れる
コンテキストに集中できます。

## 昇格シグナル

Dreaming は 4 つのシグナルを組み合わせます:

- **頻度**: 同じ候補がどれだけ頻繁にリコールされたか。
- **関連性**: 取得時のリコールスコアがどれだけ高かったか。
- **クエリの多様性**: どれだけ多くの異なるクエリ意図でその候補が現れたか。
- **新しさ**: 最近のリコールに対する時間的重み付け。

昇格には、1 つのシグナルだけではなく、設定されたすべてのしきい値ゲートを通過する必要があります。

### シグナルの重み

| Signal    | Weight | Description                                      |
| --------- | ------ | ------------------------------------------------ |
| 頻度 | 0.35   | 同じエントリがどれだけ頻繁にリコールされたか            |
| 関連性 | 0.35   | 取得時の平均リコールスコア             |
| 多様性 | 0.15   | それを表面化させた異なるクエリ意図の数 |
| 新しさ   | 0.15   | 時間減衰（14 日の半減期）                |

## 仕組み

1. **リコール追跡** -- すべての `memory_search` ヒットは、
   リコール回数、スコア、クエリハッシュとともに
   `memory/.dreams/short-term-recall.json` に記録されます。
2. **スケジュールされたスコアリング** -- 設定された頻度で候補が
   重み付きシグナルを使ってランク付けされます。すべてのしきい値ゲートが同時に通過する必要があります。
3. **昇格** -- 条件を満たしたエントリは、昇格タイムスタンプ付きで
   `MEMORY.md` に追加されます。
4. **クリーンアップ** -- すでに昇格済みのエントリは今後のサイクルから除外されます。
   ファイルロックにより同時実行を防ぎます。

## モード

`dreaming.mode` は頻度とデフォルトのしきい値を制御します:

| Mode   | Cadence        | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | 無効       | --       | --             | --               |
| `core` | 毎日午前 3 時     | 0.75     | 3              | 2                |
| `rem`  | 6 時間ごと  | 0.85     | 4              | 3                |
| `deep` | 12 時間ごと | 0.80     | 3              | 3                |

## スケジューリングモデル

Dreaming が有効な場合、`memory-core` は繰り返しスケジュールを
自動的に管理します。この機能のために cron ジョブを手動で作成する必要はありません。

次のような明示的なオーバーライドで動作を調整することは可能です:

- `dreaming.frequency`（cron 式）
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## 設定

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

## チャットコマンド

チャットからモードを切り替えたり、状態を確認したりできます:

```
/dreaming core          # core モードに切り替える（毎晩）
/dreaming rem           # rem モードに切り替える（6時間ごと）
/dreaming deep          # deep モードに切り替える（12時間ごと）
/dreaming off           # dreaming を無効化
/dreaming status        # 現在の設定と頻度を表示
/dreaming help          # モードガイドを表示
```

## CLI コマンド

コマンドラインから昇格をプレビューして適用します:

```bash
# 昇格候補をプレビュー
openclaw memory promote

# MEMORY.md に昇格を適用
openclaw memory promote --apply

# プレビュー件数を制限
openclaw memory promote --limit 5

# すでに昇格済みのエントリを含める
openclaw memory promote --include-promoted

# dreaming の状態を確認
openclaw memory status --deep
```

完全なフラグリファレンスについては、[memory CLI](/cli/memory) を参照してください。

## Dreams UI

Dreaming が有効な場合、Gateway のサイドバーに **Dreams** タブが表示され、
メモリ統計（短期件数、長期件数、昇格件数）と次回の
スケジュール済みサイクル時刻が表示されます。

## さらに読む

- [Memory](/concepts/memory)
- [Memory Search](/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory configuration reference](/reference/memory-config)
