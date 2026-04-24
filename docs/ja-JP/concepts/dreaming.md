---
read_when:
    - 記憶の昇格を自動的に実行したい
    - 各Dreamingフェーズが何をするのかを理解したい
    - '`MEMORY.md`を汚さずに統合を調整したい'
summary: Dream Diaryを備えた、light、deep、REMフェーズによるバックグラウンドの記憶統合
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T08:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreamingは`memory-core`におけるバックグラウンドの記憶統合システムです。  
これによりOpenClawは、強い短期シグナルを耐久性のある記憶へ移しつつ、  
そのプロセスを説明可能かつレビュー可能な状態に保てます。

Dreamingは**オプトイン**で、デフォルトでは無効です。

## Dreamingが書き込むもの

Dreamingは2種類の出力を保持します。

- `memory/.dreams/`内の**マシン状態**（recallストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の`dreams.md`）内の**人間が読める出力**と、`memory/dreaming/<phase>/YYYY-MM-DD.md`配下の任意のフェーズレポートファイル。

長期記憶への昇格は引き続き`MEMORY.md`にのみ書き込まれます。

## フェーズモデル

Dreamingは3つの協調フェーズを使用します。

| フェーズ | 目的 | 永続的な書き込み |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期素材を整理してステージングする | いいえ |
| Deep  | 永続候補をスコアリングして昇格させる | はい（`MEMORY.md`） |
| REM   | テーマや繰り返し現れるアイデアを振り返る | いいえ |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する  
「モード」ではありません。

### Lightフェーズ

Lightフェーズは最近の日次メモリシグナルとrecallトレースを取り込み、重複排除し、  
候補行をステージングします。

- 利用可能な場合、短期recall状態、最近の日次メモリファイル、伏せ字化されたセッショントランスクリプトから読み取ります。
- ストレージにインライン出力が含まれる場合、管理された`## Light Sleep`ブロックを書き込みます。
- 後のDeepランキングのための強化シグナルを記録します。
- `MEMORY.md`には決して書き込みません。

### Deepフェーズ

Deepフェーズは、何が長期記憶になるかを決定します。

- 重み付きスコアリングとしきい値ゲートを使って候補をランク付けします。
- `minScore`、`minRecallCount`、`minUniqueQueries`の通過が必要です。
- 書き込み前にライブの日次ファイルからスニペットを再取得するため、古くなったスニペットや削除されたスニペットはスキップされます。
- 昇格したエントリを`MEMORY.md`に追記します。
- `DREAMS.md`に`## Deep Sleep`サマリーを書き込み、必要に応じて`memory/dreaming/deep/YYYY-MM-DD.md`にも書き込みます。

### REMフェーズ

REMフェーズはパターンと内省的シグナルを抽出します。

- 最近の短期トレースからテーマと振り返りのサマリーを構築します。
- ストレージにインライン出力が含まれる場合、管理された`## REM Sleep`ブロックを書き込みます。
- Deepランキングで使われるREM強化シグナルを記録します。
- `MEMORY.md`には決して書き込みません。

## セッショントランスクリプトの取り込み

Dreamingは、伏せ字化されたセッショントランスクリプトをdreamingコーパスに取り込めます。  
トランスクリプトが利用可能な場合、それらは日次メモリシグナルやrecallトレースとともにLightフェーズへ投入されます。  
個人情報や機微な内容は取り込み前に伏せ字化されます。

## Dream Diary

Dreamingは`DREAMS.md`に物語形式の**Dream Diary**も保持します。  
各フェーズに十分な素材がそろうと、`memory-core`はベストエフォートでバックグラウンドの  
サブエージェントターン（デフォルトのランタイムモデルを使用）を実行し、短い日記エントリを追記します。

この日記はDreams UIで人間が読むためのものであり、昇格ソースではありません。  
Dreamingによって生成された日記/レポート成果物は、短期昇格の対象外です。  
`MEMORY.md`へ昇格できるのは、根拠のあるメモリスニペットのみです。

レビューや復旧作業のために、根拠付きの履歴バックフィルレーンもあります。

- `memory rem-harness --path ... --grounded`は、履歴の`YYYY-MM-DD.md`ノートから根拠付き日記出力をプレビューします。
- `memory rem-backfill --path ...`は、元に戻せる根拠付き日記エントリを`DREAMS.md`に書き込みます。
- `memory rem-backfill --path ... --stage-short-term`は、通常のDeepフェーズがすでに使用しているのと同じ短期エビデンスストアに、根拠付きの耐久候補をステージングします。
- `memory rem-backfill --rollback`および`--rollback-short-term`は、通常の日記エントリやライブ短期recallには触れずに、それらのステージ済みバックフィル成果物を削除します。

Control UIは同じ日記バックフィル/リセットフローを公開しているため、  
根拠付き候補が昇格に値するかを判断する前に、Dreamsシーンで結果を確認できます。  
また、Sceneには独立した根拠付きレーンも表示されるため、どのステージ済み短期エントリが  
履歴リプレイ由来なのか、どの昇格済み項目が根拠主導だったのかを確認でき、  
通常のライブ短期状態には触れずに、根拠付き専用のステージ済みエントリだけをクリアできます。

## Deepランキングシグナル

Deepランキングは、6つの重み付きベースシグナルにフェーズ強化を加えて使用します。

| シグナル | 重み | 説明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度 | 0.24 | エントリが蓄積した短期シグナルの数 |
| 関連性 | 0.30 | エントリの平均取得品質 |
| クエリ多様性 | 0.15 | そのエントリが現れた異なるクエリ/日コンテキスト |
| 新しさ | 0.15 | 時間減衰付きの鮮度スコア |
| 統合 | 0.10 | 複数日にわたる再出現の強さ |
| 概念の豊かさ | 0.06 | スニペット/パス由来の概念タグ密度 |

LightおよびREMフェーズのヒットは、  
`memory/.dreams/phase-signals.json`から小さな時間減衰付きブーストを加えます。

## スケジューリング

有効にすると、`memory-core`は完全なDreamingスイープ用のCronジョブを1つ自動管理します。  
各スイープでは、フェーズをlight -> REM -> deepの順で実行します。

デフォルトの実行間隔の挙動:

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

プレビューまたは手動適用にはCLI昇格を使用します。

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手動の`memory promote`は、CLIフラグで上書きしない限り、  
デフォルトでDeepフェーズのしきい値を使用します。

特定の候補が昇格する理由、または昇格しない理由を説明する:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

何も書き込まずにREMの振り返り、候補の真実、Deep昇格出力をプレビューする:

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

フェーズポリシー、しきい値、ストレージの挙動は内部実装の詳細であり、  
ユーザー向け設定ではありません。

完全なキー一覧については、[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming)を参照してください。

## Dreams UI

有効にすると、Gatewayの**Dreams**タブには次が表示されます。

- 現在のDreaming有効状態
- フェーズレベルの状態と管理スイープの有無
- 短期、根拠付き、シグナル、本日昇格済みの件数
- 次回スケジュール実行時刻
- ステージ済み履歴リプレイエントリ用の独立した根拠付きSceneレーン
- `doctor.memory.dreamDiary`を基盤とする展開可能なDream Diaryリーダー

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [memory CLI](/ja-JP/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
