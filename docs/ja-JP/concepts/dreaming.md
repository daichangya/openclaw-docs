---
read_when:
    - メモリ昇格を自動的に実行したい
    - 各Dreamingフェーズの役割を理解したい
    - MEMORY.mdを汚さずに統合を調整したい
summary: 軽い睡眠、深い睡眠、REMの各フェーズとDream Diaryを備えたバックグラウンドメモリ統合
title: Dreaming（実験的）
x-i18n:
    generated_at: "2026-04-06T04:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36c4b1e70801d662090dc8ce20608c2f141c23cd7ce53c54e3dcf332c801fd4e
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（実験的）

Dreamingは、`memory-core`のバックグラウンドメモリ統合システムです。
これによりOpenClawは、短期的な強いシグナルを永続的なメモリへ移しつつ、
そのプロセスを説明可能でレビュー可能な状態に保てます。

Dreamingは**オプトイン**で、デフォルトでは無効です。

## Dreamingが書き込む内容

Dreamingは2種類の出力を保持します。

- `memory/.dreams/`内の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の`dreams.md`）内の**人が読める出力**と、`memory/dreaming/<phase>/YYYY-MM-DD.md`配下の任意のフェーズレポートファイル。

長期メモリへの昇格は引き続き`MEMORY.md`にのみ書き込まれます。

## フェーズモデル

Dreamingは、協調して動作する3つのフェーズを使用します。

| フェーズ | 目的 | 永続書き込み |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期メモリ素材を整理してステージングする | なし |
| Deep  | 永続化候補をスコア付けして昇格する | あり（`MEMORY.md`） |
| REM   | テーマや繰り返し現れるアイデアを振り返る | なし |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する「モード」ではありません。

### Light phase

Light phaseは、最近の日次メモリシグナルとリコールトレースを取り込み、
それらを重複排除し、候補行としてステージングします。

- 短期リコール状態と最近の日次メモリファイルから読み取ります。
- ストレージにインライン出力が含まれる場合、管理された`## Light Sleep`ブロックを書き込みます。
- 後でDeep rankingに使う強化シグナルを記録します。
- `MEMORY.md`には決して書き込みません。

### Deep phase

Deep phaseは、何を長期メモリにするかを決定します。

- 重み付きスコアリングとしきい値ゲートを使って候補を順位付けします。
- 通過には`minScore`、`minRecallCount`、`minUniqueQueries`が必要です。
- 書き込み前に生きた日次ファイルからスニペットを再取得するため、古い／削除済みのスニペットはスキップされます。
- 昇格されたエントリを`MEMORY.md`に追記します。
- `DREAMS.md`に`## Deep Sleep`の要約を書き込み、必要に応じて`memory/dreaming/deep/YYYY-MM-DD.md`にも書き込みます。

### REM phase

REM phaseは、パターンと内省的なシグナルを抽出します。

- 最近の短期トレースからテーマと内省の要約を作成します。
- ストレージにインライン出力が含まれる場合、管理された`## REM Sleep`ブロックを書き込みます。
- Deep rankingで使用されるREM強化シグナルを記録します。
- `MEMORY.md`には決して書き込みません。

## Dream Diary

Dreamingは、`DREAMS.md`に物語形式の**Dream Diary**も保持します。
各フェーズに十分な素材がそろうと、`memory-core`はベストエフォートのバックグラウンド
サブエージェントターン（デフォルトのランタイムモデルを使用）を実行し、
短い日記エントリを追記します。

この日記はDreams UIで人が読むためのものであり、昇格元にはなりません。

## Deep rankingシグナル

Deep rankingでは、6つの重み付き基本シグナルにフェーズ強化を加えて使用します。

| シグナル | 重み | 説明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度 | 0.24   | そのエントリが蓄積した短期シグナルの数 |
| 関連性 | 0.30   | そのエントリの平均取得品質 |
| クエリ多様性 | 0.15   | それが現れた個別のクエリ／日コンテキスト |
| 新しさ | 0.15   | 時間減衰する鮮度スコア |
| 統合 | 0.10   | 複数日にわたる再出現の強さ |
| 概念的豊かさ | 0.06   | スニペット／パス由来の概念タグ密度 |

Light phaseとREM phaseのヒットは、
`memory/.dreams/phase-signals.json`から小さな時間減衰ブーストを追加します。

## スケジューリング

有効にすると、`memory-core`は完全なDreamingスイープ用のcronジョブを1つ自動管理します。
各スイープは、light -> REM -> deepの順でフェーズを実行します。

デフォルトの実行間隔の動作:

| 設定 | デフォルト |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## クイックスタート

Dreamingを有効にする:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

カスタムスイープ間隔でDreamingを有効にする:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## スラッシュコマンド

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLIワークフロー

プレビューまたは手動適用にはCLIの昇格を使用します。

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手動の`memory promote`は、CLIフラグで上書きしない限り、デフォルトでdeep-phaseのしきい値を使用します。

特定の候補が昇格する、または昇格しない理由を説明する:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

何も書き込まずに、REMの内省、候補となる真実、deep promotion出力をプレビューする:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 主なデフォルト値

すべての設定は`plugins.entries.memory-core.config.dreaming`配下にあります。

| キー | デフォルト |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細であり、
ユーザー向け設定ではありません。

完全なキー一覧については、
[Memory configuration reference](/ja-JP/reference/memory-config#dreaming-experimental)
を参照してください。

## Dreams UI

有効にすると、Gatewayの**Dreams**タブに次が表示されます。

- 現在のDreaming有効状態
- フェーズレベルの状態と管理スイープの有無
- 短期、長期、当日昇格済みの件数
- 次回予定実行の時刻
- `doctor.memory.dreamDiary`を基盤とする、展開可能なDream Diaryリーダー

## 関連

- [Memory](/ja-JP/concepts/memory)
- [Memory Search](/ja-JP/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory configuration reference](/ja-JP/reference/memory-config)
