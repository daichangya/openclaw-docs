---
read_when:
    - メモリ昇格を自動的に実行したい
    - 各 dreaming フェーズの役割を理解したい
    - '`MEMORY.md`を汚さずに統合を調整したい'
summary: Light、Deep、REMフェーズとDream Diaryを備えたバックグラウンドメモリ統合
title: Dreaming（実験的）
x-i18n:
    generated_at: "2026-04-09T01:27:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26476eddb8260e1554098a6adbb069cf7f5e284cf2e09479c6d9d8f8b93280ef
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming（実験的）

Dreamingは、`memory-core`のバックグラウンドメモリ統合システムです。
これによりOpenClawは、プロセスを説明可能かつレビュー可能な状態に保ちながら、
強い短期シグナルを永続的なメモリへ移動できます。

Dreamingは**オプトイン**で、デフォルトでは無効です。

## Dreamingが書き込む内容

Dreamingは2種類の出力を保持します。

- `memory/.dreams/`内の**マシン状態**（リコールストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の`dreams.md`）内の**人が読める出力**と、`memory/dreaming/<phase>/YYYY-MM-DD.md`配下の任意のフェーズレポートファイル。

長期メモリへの昇格は、引き続き`MEMORY.md`にのみ書き込まれます。

## フェーズモデル

Dreamingは、協調して動作する3つのフェーズを使用します。

| フェーズ | 目的 | 永続的な書き込み |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期素材を整理して段階化する | いいえ |
| Deep  | 永続化候補をスコアリングして昇格する | はい（`MEMORY.md`） |
| REM   | テーマと繰り返し現れる考えを振り返る | いいえ |

これらのフェーズは内部実装の詳細であり、ユーザーが別々に設定する
「モード」ではありません。

### Lightフェーズ

Lightフェーズは、最近の日次メモリシグナルとリコールトレースを取り込み、
重複を排除し、候補行を段階化します。

- 利用可能な場合は、短期リコール状態、最近の日次メモリファイル、マスク済みセッショントランスクリプトから読み取ります。
- ストレージにインライン出力が含まれる場合、管理された`## Light Sleep`ブロックを書き込みます。
- 後続のDeepランキングのための強化シグナルを記録します。
- `MEMORY.md`には決して書き込みません。

### Deepフェーズ

Deepフェーズは、何を長期メモリにするかを決定します。

- 重み付きスコアリングとしきい値ゲートを使って候補を順位付けします。
- 通過には`minScore`、`minRecallCount`、`minUniqueQueries`が必要です。
- 書き込む前にライブの日次ファイルからスニペットを再取得するため、古くなったスニペットや削除されたスニペットはスキップされます。
- 昇格したエントリを`MEMORY.md`に追記します。
- `DREAMS.md`に`## Deep Sleep`サマリーを書き込み、必要に応じて`memory/dreaming/deep/YYYY-MM-DD.md`にも書き込みます。

### REMフェーズ

REMフェーズは、パターンと内省的シグナルを抽出します。

- 最近の短期トレースからテーマと内省のサマリーを構築します。
- ストレージにインライン出力が含まれる場合、管理された`## REM Sleep`ブロックを書き込みます。
- Deepランキングで使用されるREM強化シグナルを記録します。
- `MEMORY.md`には決して書き込みません。

## セッショントランスクリプトの取り込み

Dreamingは、マスク済みセッショントランスクリプトをDreamingコーパスに取り込めます。
トランスクリプトが利用可能な場合、それらは日次メモリシグナルやリコールトレースとともに
Lightフェーズに投入されます。個人的な内容や機微な内容は、取り込み前にマスクされます。

## Dream Diary

Dreamingはまた、`DREAMS.md`内に物語形式の**Dream Diary**を保持します。
各フェーズに十分な素材がそろうと、`memory-core`はベストエフォートのバックグラウンド
subagentターン（デフォルトのランタイムモデルを使用）を実行し、短い日記エントリを追記します。

この日記はDreams UIで人が読むためのものであり、昇格ソースではありません。

レビューや復旧作業のために、根拠付きの履歴バックフィルレーンもあります。

- `memory rem-harness --path ... --grounded`は、過去の`YYYY-MM-DD.md`ノートから根拠付きの日記出力をプレビューします。
- `memory rem-backfill --path ...`は、可逆な根拠付き日記エントリを`DREAMS.md`に書き込みます。
- `memory rem-backfill --path ... --stage-short-term`は、根拠付きの永続候補を、通常のDeepフェーズがすでに使っている短期エビデンスストアと同じ場所に段階化します。
- `memory rem-backfill --rollback`と`--rollback-short-term`は、通常の日記エントリやライブ短期リコールに触れずに、それらの段階化されたバックフィル成果物を削除します。

Control UIは同じ日記バックフィル/リセットフローを公開しているため、根拠付き候補が
昇格に値するか判断する前に、Dreamsシーンで結果を確認できます。Sceneには独立した
groundedレーンも表示されるため、どの段階化済み短期エントリが履歴リプレイ由来か、
どの昇格済みアイテムがgrounded主導だったかを確認でき、通常のライブ短期状態には
触れずにgrounded専用の段階化済みエントリだけを消去できます。

## Deepランキングシグナル

Deepランキングは、6つの重み付きベースシグナルに加えてフェーズ強化を使用します。

| シグナル | 重み | 説明 |
| ------------------- | ------ | ------------------------------------------------- |
| 頻度           | 0.24   | そのエントリが蓄積した短期シグナルの数 |
| 関連性           | 0.30   | そのエントリの平均取得品質 |
| クエリ多様性     | 0.15   | それが現れた個別のクエリ/日コンテキスト |
| 新しさ             | 0.15   | 時間減衰付きの鮮度スコア |
| 統合       | 0.10   | 複数日にわたる再出現の強さ |
| 概念的豊かさ | 0.06   | スニペット/パス由来の概念タグ密度 |

LightフェーズとREMフェーズのヒットは、
`memory/.dreams/phase-signals.json`から小さな時間減衰付きブーストを追加します。

## スケジューリング

有効にすると、`memory-core`は完全なDreamingスイープ用のcronジョブを1つ自動管理します。
各スイープは順番にフェーズを実行します: light -> REM -> deep。

デフォルトの実行間隔の動作:

| 設定              | デフォルト     |
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

プレビューまたは手動適用には、CLI昇格を使用します。

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

何も書き込まずに、REMの内省、候補となる真実、Deep昇格の出力をプレビューする:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 主なデフォルト値

すべての設定は`plugins.entries.memory-core.config.dreaming`の下にあります。

| キー         | デフォルト     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細であり、
ユーザー向け設定ではありません。

完全なキー一覧は[メモリ設定リファレンス](/ja-JP/reference/memory-config#dreaming-experimental)
を参照してください。

## Dreams UI

有効にすると、Gatewayの**Dreams**タブには次が表示されます。

- 現在のDreaming有効状態
- フェーズレベルのステータスと管理対象スイープの有無
- 短期、grounded、シグナル、本日昇格済みの件数
- 次回スケジュール実行の時刻
- 段階化された履歴リプレイエントリ用の独立したgrounded Sceneレーン
- `doctor.memory.dreamDiary`に支えられた、展開可能なDream Diaryリーダー

## 関連

- [メモリ](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [memory CLI](/cli/memory)
- [メモリ設定リファレンス](/ja-JP/reference/memory-config)
