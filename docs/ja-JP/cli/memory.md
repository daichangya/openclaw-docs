---
read_when:
    - セマンティックメモリをインデックス化または検索したいとき
    - メモリの利用可否やインデックス化をデバッグしているとき
    - 想起された短期メモリを `MEMORY.md` に昇格したいとき
summary: '`openclaw memory` の CLI リファレンス（status/index/search/promote）'
title: memory
x-i18n:
    generated_at: "2026-04-05T12:39:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

セマンティックメモリのインデックス化と検索を管理します。
アクティブなメモリプラグインによって提供されます（デフォルト: `memory-core`; 無効化するには `plugins.slots.memory = "none"` を設定）。

関連:

- メモリの概念: [Memory](/concepts/memory)
- プラグイン: [Plugins](/tools/plugin)

## 例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## オプション

`memory status` と `memory index`:

- `--agent <id>`: 単一の agent に限定します。これを指定しない場合、これらのコマンドは設定された各 agent に対して実行されます。agent list が設定されていない場合は、デフォルト agent にフォールバックします。
- `--verbose`: プローブおよびインデックス化中に詳細ログを出力します。

`memory status`:

- `--deep`: ベクトル + 埋め込みの利用可否をプローブします。
- `--index`: ストアが dirty の場合に再インデックス化を実行します（`--deep` を暗黙的に含みます）。
- `--fix`: 古い recall lock を修復し、promotion metadata を正規化します。
- `--json`: JSON 出力を表示します。

`memory index`:

- `--force`: 完全な再インデックス化を強制します。

`memory search`:

- クエリ入力: 位置引数の `[query]` または `--query <text>` のいずれかを渡します。
- 両方が指定された場合は、`--query` が優先されます。
- どちらも指定されていない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一の agent に限定します（デフォルト: デフォルト agent）。
- `--max-results <n>`: 返す結果数を制限します。
- `--min-score <n>`: 低スコアの一致を除外します。
- `--json`: JSON 結果を表示します。

`memory promote`:

短期メモリの昇格をプレビューして適用します。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- `MEMORY.md` に昇格内容を書き込みます（デフォルト: プレビューのみ）。
- `--limit <n>` -- 表示する候補数の上限を設定します。
- `--include-promoted` -- 以前のサイクルですでに昇格済みのエントリも含めます。

完全なオプション:

- `memory/YYYY-MM-DD.md` から短期候補をランク付けします。使用するのは重み付き recall シグナル（`frequency`、`relevance`、`query diversity`、`recency`）です。
- `memory_search` が daily-memory ヒットを返したときに記録された recall event を使用します。
- オプションの自動 dreaming モード: `plugins.entries.memory-core.config.dreaming.mode` が `core`、`deep`、または `rem` の場合、`memory-core` はバックグラウンドで promotion をトリガーする cron job を自動管理します（手動の `openclaw cron add` は不要）。
- `--agent <id>`: 単一の agent に限定します（デフォルト: デフォルト agent）。
- `--limit <n>`: 返す/適用する候補数の上限。
- `--min-score <n>`: 重み付き promotion スコアの最小値。
- `--min-recall-count <n>`: 候補に必要な recall count の最小値。
- `--min-unique-queries <n>`: 候補に必要な異なるクエリ数の最小値。
- `--apply`: 選択した候補を `MEMORY.md` に追記し、promoted としてマークします。
- `--include-promoted`: すでに promoted 済みの候補も出力に含めます。
- `--json`: JSON 出力を表示します。

## Dreaming（実験的）

Dreaming は、メモリに対する夜間の振り返り処理です。システムが日中に想起された内容を見直し、長期的に保持する価値があるものを判断することから、「dreaming」と呼ばれています。

- オプトイン方式で、デフォルトでは無効です。
- `plugins.entries.memory-core.config.dreaming.mode` で有効化します。
- チャットから `/dreaming off|core|rem|deep` でモードを切り替えられます。各モードの動作を見るには `/dreaming`（または `/dreaming options`）を実行してください。
- 有効化すると、`memory-core` は管理対象の cron job を自動的に作成して維持します。
- dreaming を有効のまま自動 promotion を事実上停止したい場合は、`dreaming.limit` を `0` に設定してください。
- ランキングには重み付きシグナルを使用します: recall frequency、retrieval relevance、query diversity、temporal recency（最近の recall は時間とともに減衰します）。
- `MEMORY.md` への promotion は品質しきい値を満たした場合にのみ行われるため、長期メモリは単発の詳細を蓄積するのではなく、高シグナルな状態を保てます。

デフォルトモードのプリセット:

- `core`: 毎日 `0 3 * * *`、`minScore=0.75`、`minRecallCount=3`、`minUniqueQueries=2`
- `deep`: 12 時間ごと（`0 */12 * * *`）、`minScore=0.8`、`minRecallCount=3`、`minUniqueQueries=3`
- `rem`: 6 時間ごと（`0 */6 * * *`）、`minScore=0.85`、`minRecallCount=4`、`minUniqueQueries=3`

例:

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

注記:

- `memory index --verbose` はフェーズごとの詳細（provider、model、source、batch activity）を出力します。
- `memory status` には、`memorySearch.extraPaths` で設定された追加パスも含まれます。
- 実質的にアクティブなメモリのリモート API key フィールドが SecretRef として設定されている場合、このコマンドはアクティブな gateway スナップショットからそれらの値を解決します。gateway が利用できない場合、コマンドは即座に失敗します。
- Gateway バージョン差異に関する注記: このコマンド経路には `secrets.resolve` をサポートする gateway が必要です。古い gateway は unknown-method エラーを返します。
- dreaming の実行頻度はデフォルトで各モードのプリセットスケジュールに従います。`plugins.entries.memory-core.config.dreaming.frequency` を cron 式（例: `0 3 * * *`）として設定することで頻度を上書きし、`timezone`、`limit`、`minScore`、`minRecallCount`、`minUniqueQueries` で微調整できます。
