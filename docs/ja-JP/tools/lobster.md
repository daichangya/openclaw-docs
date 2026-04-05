---
read_when:
    - 明示的な承認付きの決定論的なマルチステップワークフローが必要なとき
    - 以前のステップを再実行せずにワークフローを再開する必要があるとき
summary: 明示的な承認ゲートを備えた、OpenClaw用の型付きワークフローランタイム。
title: Lobster
x-i18n:
    generated_at: "2026-04-05T13:00:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster は、明示的な承認チェックポイントを備えた単一の決定論的な操作として、OpenClaw がマルチステップのツールシーケンスを実行できるようにするワークフローシェルです。

Lobster は、切り離されたバックグラウンド作業の一つ上にあるオーサリング層です。個々のタスクより上位のフローオーケストレーションについては、[Task Flow](/ja-JP/automation/taskflow)（`openclaw tasks flow`）を参照してください。タスクアクティビティ台帳については、[`openclaw tasks`](/ja-JP/automation/tasks) を参照してください。

## フック

あなたのアシスタントは、自分自身を管理するツールを構築できます。ワークフローを依頼すれば、30分後には単一呼び出しで動くCLIとパイプラインが手に入ります。Lobster は欠けていたピースです。決定論的なパイプライン、明示的な承認、そして再開可能な状態を提供します。

## なぜ必要か

現在、複雑なワークフローには多くの往復ツール呼び出しが必要です。各呼び出しはトークンを消費し、LLM がすべてのステップをオーケストレーションしなければなりません。Lobster はそのオーケストレーションを型付きランタイムへ移します。

- **多くの呼び出しではなく1回の呼び出し**: OpenClaw は1回のLobsterツール呼び出しを実行し、構造化された結果を取得します。
- **承認を内蔵**: 副作用（メール送信、コメント投稿など）は、明示的に承認されるまでワークフローを停止します。
- **再開可能**: 停止したワークフローはトークンを返し、すべてを再実行せずに承認して再開できます。

## なぜプレーンなプログラムではなくDSLなのか

Lobster は意図的に小さく設計されています。目標は「新しい言語」ではなく、ファーストクラスの承認と再開トークンを備えた、予測可能でAIフレンドリーなパイプライン仕様です。

- **承認/再開が組み込み**: 通常のプログラムでも人に確認を求めることはできますが、永続的なトークンで _停止して再開する_ ことは、そのランタイムを自分で発明しない限りできません。
- **決定論性 + 監査可能性**: パイプラインはデータなので、ログ、差分、再生、レビューが簡単です。
- **AI向けの制約された表面**: 小さな文法 + JSONパイピングにより「創造的な」コード経路が減り、現実的な検証が可能になります。
- **安全性ポリシーを組み込み**: タイムアウト、出力上限、サンドボックスチェック、allowlistは、各スクリプトではなくランタイムによって強制されます。
- **それでもプログラム可能**: 各ステップは任意のCLIやスクリプトを呼び出せます。JS/TS が必要なら、コードから `.lobster` ファイルを生成できます。

## 仕組み

OpenClaw はローカルの `lobster` CLI を **tool mode** で起動し、stdout からJSONエンベロープを解析します。
パイプラインが承認のために停止した場合、ツールは後で継続できるよう `resumeToken` を返します。

## パターン: 小さなCLI + JSONパイプ + 承認

JSON を話す小さなコマンドを作り、それらをつないで1回のLobster呼び出しにします。（以下のコマンド名は例です。自分のものに置き換えてください。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

パイプラインが承認を要求した場合は、トークンで再開します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI がワークフローをトリガーし、Lobster がステップを実行します。承認ゲートによって、副作用は明示的かつ監査可能なまま保たれます。

例: 入力項目をツール呼び出しへマッピングする:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON専用LLMステップ（llm-task）

**構造化されたLLMステップ** が必要なワークフローでは、任意の
`llm-task` pluginツールを有効にし、Lobsterから呼び出します。これにより、
モデルを使った分類/要約/下書きができつつ、ワークフローの
決定論性を保てます。

ツールを有効化する:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

パイプラインで使う:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

詳細と設定オプションは [LLM Task](/tools/llm-task) を参照してください。

## ワークフローファイル（.lobster）

Lobster は `name`、`args`、`steps`、`env`、`condition`、`approval` フィールドを持つYAML/JSONワークフローファイルを実行できます。OpenClawツール呼び出しでは、`pipeline` にファイルパスを設定します。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

注意:

- `stdin: $step.stdout` と `stdin: $step.json` は前のステップの出力を渡します。
- `condition`（または `when`）で `$step.approved` に基づいてステップを制御できます。

## Lobsterをインストールする

OpenClaw Gateway を実行する **同じホスト** にLobster CLIをインストールし（[Lobster repo](https://github.com/openclaw/lobster) を参照）、`lobster` が `PATH` 上にあることを確認してください。

## ツールを有効化する

Lobster は **任意の** pluginツールです（デフォルトでは有効ではありません）。

推奨設定（加算的で安全）:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

またはエージェント単位で:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

制限的なallowlistモードで実行する意図がない限り、`tools.allow: ["lobster"]` の使用は避けてください。

注意: allowlistは任意plugin向けのオプトインです。allowlistに
`lobster` のようなpluginツールしか含まれていない場合、
OpenClaw はコアツールを有効のまま維持します。コア
ツールも制限したい場合は、allowlistに必要なコアツールまたはグループも含めてください。

## 例: メール仕分け

Lobsterなし:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobsterあり:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSONエンベロープを返します（省略版）:

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

ユーザーが承認 → 再開:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

1つのワークフロー。決定論的。安全。

## ツールパラメーター

### `run`

tool modeでパイプラインを実行します。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

引数付きでワークフローファイルを実行する:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

承認後に停止したワークフローを継続します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 任意入力

- `cwd`: パイプライン用の相対作業ディレクトリ（現在のプロセス作業ディレクトリ内に収まっている必要があります）。
- `timeoutMs`: この時間を超えた場合にサブプロセスを終了します（デフォルト: 20000）。
- `maxStdoutBytes`: stdout がこのサイズを超えた場合にサブプロセスを終了します（デフォルト: 512000）。
- `argsJson`: `lobster run --args-json` に渡されるJSON文字列（ワークフローファイルのみ）。

## 出力エンベロープ

Lobster は次の3つの状態のいずれかを持つJSONエンベロープを返します。

- `ok` → 正常終了
- `needs_approval` → 一時停止。再開には `requiresApproval.resumeToken` が必要
- `cancelled` → 明示的に拒否またはキャンセルされた

このツールは、エンベロープを `content`（整形済みJSON）と `details`（生オブジェクト）の両方で公開します。

## 承認

`requiresApproval` が存在する場合、プロンプトを確認して判断します。

- `approve: true` → 再開し、副作用を継続
- `approve: false` → キャンセルしてワークフローを終了

`approve --preview-from-stdin --limit N` を使うと、カスタム `jq`/heredoc の糊付けなしで、承認要求にJSONプレビューを添付できます。現在、再開トークンはコンパクトです。Lobster はワークフロー再開状態を自身のstate dir配下に保存し、小さなトークンキーを返します。

## OpenProse

OpenProse はLobsterと相性が良いです。`/prose` を使ってマルチエージェント準備をオーケストレーションし、その後Lobsterパイプラインを実行して決定論的な承認を行います。ProseプログラムでLobsterが必要な場合は、`tools.subagents.tools` でsub-agent向けに `lobster` ツールを許可してください。[OpenProse](/ja-JP/prose) を参照してください。

## 安全性

- **ローカルサブプロセスのみ** — plugin自体からネットワーク呼び出しは行いません。
- **シークレットなし** — Lobster はOAuthを管理しません。代わりに、それを管理するOpenClawツールを呼び出します。
- **サンドボックス対応** — ツールコンテキストがサンドボックス化されている場合は無効です。
- **堅牢化済み** — `PATH` 上の固定実行可能名（`lobster`）を使い、タイムアウトと出力上限を強制します。

## トラブルシューティング

- **`lobster subprocess timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割してください。
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を増やすか、出力量を減らしてください。
- **`lobster returned invalid JSON`** → パイプラインがtool modeで実行され、JSONだけを出力することを確認してください。
- **`lobster failed (code …)`** → 同じパイプラインをターミナルで実行し、stderr を確認してください。

## さらに学ぶ

- [Plugins](/tools/plugin)
- [Plugin tool authoring](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティワークフロー

公開例の1つとして、個人、パートナー、共有の3つのMarkdown vaultを管理する「second brain」CLI + Lobsterパイプラインがあります。このCLIは、統計、inbox一覧、古い項目のスキャンについてJSONを出力し、Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` のようなワークフローへ連結します。各ワークフローには承認ゲートがあります。AIは利用可能なときに判断（分類）を担当し、利用できないときは決定論的なルールにフォールバックします。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [Automation & Tasks](/ja-JP/automation) — Lobsterワークフローのスケジューリング
- [Automation Overview](/ja-JP/automation) — すべての自動化メカニズム
- [Tools Overview](/tools) — 利用可能なすべてのエージェントツール
