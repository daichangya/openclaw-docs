---
read_when:
    - メモリ昇格を自動実行したい場合
    - 各Dreamingフェーズが何をするのかを理解したい場合
    - '`MEMORY.md` を汚さずに統合を調整したい場合'
summary: 軽度、深度、REMフェーズに加えてDream Diaryを備えたバックグラウンドメモリ統合
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreamingは `memory-core` にあるバックグラウンドのメモリ統合システムです。
これによりOpenClawは、説明可能かつレビュー可能な形で、
強い短期シグナルを永続メモリへ移せるようになります。

Dreamingは**オプトイン**で、デフォルトでは無効です。

## Dreamingが書き込むもの

Dreamingは2種類の出力を保持します:

- `memory/.dreams/` 内の**マシン状態**（recallストア、フェーズシグナル、取り込みチェックポイント、ロック）。
- `DREAMS.md`（または既存の `dreams.md`）内の**人間が読める出力**と、任意のフェーズレポートファイル `memory/dreaming/<phase>/YYYY-MM-DD.md`。

長期昇格は引き続き `MEMORY.md` にのみ書き込みます。

## フェーズモデル

Dreamingは3つの協調フェーズを使います:

| Phase | 目的                                      | 永続書き込み      |
| ----- | ----------------------------------------- | ----------------- |
| Light | 最近の短期マテリアルを整理してステージングする | なし              |
| Deep  | 永続候補をスコアリングして昇格させる         | あり（`MEMORY.md`） |
| REM   | テーマや繰り返し現れる考えを振り返る         | なし              |

これらのフェーズは内部実装の詳細であり、ユーザーが個別に設定する
「モード」ではありません。

### Light phase

Light phaseは、最近のデイリーメモリシグナルとrecallトレースを取り込み、
重複排除し、候補行をステージングします。

- 利用可能な場合は、短期recall状態、最近のデイリーメモリファイル、伏せ字化されたセッショントランスクリプトを読み取ります。
- ストレージにインライン出力が含まれる場合、管理された `## Light Sleep` ブロックを書き込みます。
- 後続のDeepランキング用に強化シグナルを記録します。
- `MEMORY.md` には決して書き込みません。

### Deep phase

Deep phaseは、何を長期メモリにするかを決定します。

- 重み付きスコアリングとしきい値ゲートを使って候補を順位付けします。
- 通過には `minScore`, `minRecallCount`, `minUniqueQueries` が必要です。
- 書き込み前にライブのデイリーファイルからスニペットを再取得するため、古くなった/削除済みスニペットはスキップされます。
- 昇格したエントリを `MEMORY.md` に追記します。
- `DREAMS.md` に `## Deep Sleep` サマリーを書き込み、必要に応じて `memory/dreaming/deep/YYYY-MM-DD.md` にも書き込みます。

### REM phase

REM phaseは、パターンと内省シグナルを抽出します。

- 最近の短期トレースからテーマと振り返りのサマリーを構築します。
- ストレージにインライン出力が含まれる場合、管理された `## REM Sleep` ブロックを書き込みます。
- Deepランキングで使われるREM強化シグナルを記録します。
- `MEMORY.md` には決して書き込みません。

## セッショントランスクリプトの取り込み

Dreamingは、伏せ字化されたセッショントランスクリプトをDreamingコーパスに取り込めます。トランスクリプトが利用可能な場合、それらはデイリーメモリシグナルやrecallトレースとともにLight phaseに投入されます。個人的な内容や機微な内容は、取り込み前に伏せ字化されます。

## Dream Diary

Dreamingは `DREAMS.md` に物語形式の**Dream Diary**も保持します。
各フェーズに十分なマテリアルがそろうと、`memory-core` はベストエフォートのバックグラウンドサブエージェントターン（デフォルトのランタイムモデルを使用）を実行し、短い日記エントリを追記します。

この日記はDreams UIで人が読むためのものであり、昇格元ではありません。
Dreaming生成の日記/レポートアーティファクトは短期昇格から除外されます。
`MEMORY.md` へ昇格対象になれるのは、根拠のあるメモリスニペットだけです。

レビューおよび復旧作業向けに、根拠付きの履歴バックフィル経路もあります:

- `memory rem-harness --path ... --grounded` は、履歴の `YYYY-MM-DD.md` ノートから根拠付きの日記出力をプレビューします。
- `memory rem-backfill --path ...` は、取り消し可能な根拠付き日記エントリを `DREAMS.md` に書き込みます。
- `memory rem-backfill --path ... --stage-short-term` は、通常のDeep phaseがすでに使っているのと同じ短期エビデンスストアに、根拠付きの永続候補をステージングします。
- `memory rem-backfill --rollback` と `--rollback-short-term` は、通常の日記エントリやライブ短期recallには触れずに、それらのステージ済みバックフィルアーティファクトを削除します。

Control UIでも同じ日記バックフィル/リセットフローを公開しているため、根拠付き候補を昇格させるべきか判断する前に、Dreamsシーンで結果を確認できます。Sceneには、どのステージ済み短期エントリが履歴リプレイ由来か、どの昇格項目が根拠主導だったかを確認できる、独立した根拠付きレーンも表示され、通常のライブ短期状態に触れずに、根拠のみのステージ済みエントリだけをクリアできます。

## Deepランキングシグナル

Deepランキングは、6つの重み付きベースシグナルにフェーズ強化を加えて使います:

| Signal              | Weight | 説明                                                |
| ------------------- | ------ | --------------------------------------------------- |
| Frequency           | 0.24   | エントリが蓄積した短期シグナル数                    |
| Relevance           | 0.30   | エントリの平均取得品質                              |
| Query diversity     | 0.15   | そのエントリが現れた異なるクエリ/日コンテキスト数     |
| Recency             | 0.15   | 時間減衰付きの新しさスコア                          |
| Consolidation       | 0.10   | 複数日にわたる再出現の強さ                          |
| Conceptual richness | 0.06   | スニペット/パス由来の概念タグ密度                   |

LightおよびREM phaseのヒットは、
`memory/.dreams/phase-signals.json` からの小さな時間減衰付きブーストを加えます。

## スケジューリング

有効時、`memory-core` は完全なDreamingスイープ用に1つのCronジョブを自動管理します。各スイープは、light -> REM -> deep の順でフェーズを実行します。

デフォルトの実行間隔:

| Setting              | Default     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## クイックスタート

Dreamingを有効化:

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

カスタムスイープ間隔でDreamingを有効化:

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

プレビューまたは手動適用にはCLI昇格を使います:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手動の `memory promote` は、CLIフラグで上書きしない限り、
デフォルトでDeep phaseのしきい値を使います。

特定の候補がなぜ昇格する/しないのかを説明するには:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

REMの振り返り、候補となる事実、Deep昇格出力を、
何も書き込まずにプレビューするには:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 主なデフォルト値

すべての設定は `plugins.entries.memory-core.config.dreaming` 配下にあります。

| Key         | Default     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

フェーズポリシー、しきい値、ストレージ動作は内部実装の詳細であり、
ユーザー向け設定ではありません。

完全なキー一覧は
[Memory configuration reference](/ja-JP/reference/memory-config#dreaming)
を参照してください。

## Dreams UI

有効時、Gatewayの**Dreams**タブには次が表示されます:

- 現在のDreaming有効状態
- フェーズレベルの状態と管理対象スイープの有無
- 短期、根拠付き、シグナル、本日昇格済みの件数
- 次回のスケジュール実行時刻
- ステージ済み履歴リプレイエントリ用の独立した根拠付きSceneレーン
- `doctor.memory.dreamDiary` をバックエンドとする、展開可能なDream Diaryリーダー

## トラブルシューティング

### Dreamingがまったく実行されない（statusでblockedと表示される）

管理されたDreaming CronはデフォルトエージェントのHeartbeatに乗っています。そのエージェントでHeartbeatが発火していない場合、Cronは誰にも消費されないシステムイベントをキューに入れるため、Dreamingは静かに実行されません。その場合、`openclaw memory status` と `/dreaming status` の両方で `blocked` と報告され、どのエージェントのHeartbeatがブロッカーかが示されます。

よくある原因は2つあります:

- 別のエージェントが明示的な `heartbeat:` ブロックを宣言している。`agents.list` のいずれかのエントリに独自の `heartbeat` ブロックがあると、そのエージェントだけがHeartbeatし、デフォルトは他のすべてに適用されなくなるため、デフォルトエージェントが沈黙することがあります。Heartbeat設定を `agents.defaults.heartbeat` に移すか、デフォルトエージェントに明示的な `heartbeat` ブロックを追加してください。参照: [Scope and precedence](/ja-JP/gateway/heartbeat#scope-and-precedence)。
- `heartbeat.every` が `0`、空、または解析不能。Cronがスケジュール対象の間隔を持てず、Heartbeatが実質無効になります。`every` を `30m` のような正の期間に設定してください。参照: [Defaults](/ja-JP/gateway/heartbeat#defaults)。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat)
- [Memory](/ja-JP/concepts/memory)
- [Memory Search](/ja-JP/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory configuration reference](/ja-JP/reference/memory-config)
