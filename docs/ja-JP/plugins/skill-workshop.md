---
read_when:
    - エージェントに修正内容や再利用可能な手順をワークスペースSkillsへ変換させたい場合
    - 手続き的なSkillsメモリを設定している場合
    - '`skill_workshop` ツールの動作をデバッグしている場合'
    - 自動的なSkills作成を有効にするかどうか判断している場合
summary: レビュー、承認、隔離、ホットなSkillsリフレッシュを備えた、再利用可能な手順のワークスペースSkillsとしての実験的キャプチャ
title: Skill Workshop Plugin
x-i18n:
    generated_at: "2026-04-22T04:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill Workshop Plugin

Skill Workshopは**実験的**です。デフォルトでは無効であり、そのキャプチャ
ヒューリスティクスとレビュアープロンプトはリリースごとに変わる可能性があります。自動書き込みは、まず保留モードの出力を確認したうえで、信頼できるワークスペースでのみ使用してください。

Skill Workshopは、ワークスペースSkills向けの手続き的メモリです。これによりエージェントは、再利用可能なワークフロー、ユーザーの修正、苦労して得た修正、繰り返し発生する落とし穴を、次の場所にある `SKILL.md` ファイルへ変換できます:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

これは長期メモリとは異なります:

- **Memory** は、事実、好み、エンティティ、過去のコンテキストを保存します。
- **Skills** は、将来のタスクでエージェントが従うべき再利用可能な手順を保存します。
- **Skill Workshop** は、有用なターンから永続的なワークスペースskillへの橋渡しであり、安全性チェックと任意の承認を備えています。

Skill Workshopは、エージェントが次のような手順を学習したときに役立ちます:

- 外部調達したアニメーションGIFアセットをどう検証するか
- スクリーンショットアセットをどう置き換え、寸法をどう確認するか
- リポジトリ固有のQAシナリオをどう実行するか
- 繰り返し発生するprovider障害をどうデバッグするか
- 古くなったローカルワークフローノートをどう修復するか

これは次の用途には向いていません:

- 「ユーザーは青が好き」のような事実
- 広い自伝的メモリ
- 生のトランスクリプト保存
- シークレット、認証情報、または非公開プロンプトテキスト
- 繰り返されない一度限りの指示

## デフォルト状態

このバンドル済みPluginは**実験的**で、`plugins.entries.skill-workshop` で明示的に有効化しない限り**デフォルトで無効**です。

Plugin manifestは `enabledByDefault: true` を設定していません。Plugin設定スキーマ内の `enabled: true` デフォルトは、Plugin entryがすでに選択され読み込まれた後にのみ適用されます。

実験的とは、次を意味します:

- このPluginは、オプトインのテストやdogfoodingには十分対応している
- 提案保存、レビュアーしきい値、キャプチャヒューリスティクスは進化する可能性がある
- 保留承認が推奨される開始モードである
- 自動適用は、共有環境や敵対的/入力量の多い環境ではなく、信頼できる個人/ワークスペース設定向けである

## 有効化

最小限で安全な設定:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

この設定では:

- `skill_workshop` ツールが利用可能になります
- 明示的な再利用可能修正は保留提案としてキューされます
- しきい値ベースのレビュアーパスはskill更新を提案できます
- 保留提案が適用されるまでskillファイルは書き込まれません

自動書き込みは信頼できるワークスペースでのみ使ってください:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` でも、同じスキャナーと隔離経路を使います。重大な検出結果がある提案は適用しません。

## 設定

| Key                  | Default     | Range / values                              | 意味                                                               |
| -------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `enabled`            | `true`      | boolean                                     | Plugin entry読み込み後にPluginを有効化します。                     |
| `autoCapture`        | `true`      | boolean                                     | 成功したエージェントターン後のキャプチャ/レビューを有効化します。  |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 提案をキューするか、安全な提案を自動で書き込みます。               |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 明示的修正キャプチャ、LLMレビュアー、その両方、またはどちらもなしを選びます。 |
| `reviewInterval`     | `15`        | `1..200`                                    | この成功ターン数ごとにレビュアーを実行します。                     |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | この観測ツール呼び出し数ごとにレビュアーを実行します。             |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 埋め込みレビュアー実行のタイムアウトです。                         |
| `maxPending`         | `50`        | `1..200`                                    | ワークスペースごとに保持する保留/隔離提案の最大数です。           |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 生成されるskill/補助ファイルの最大サイズです。                     |

推奨プロファイル:

```json5
// 保守的: 明示的なツール使用のみ、自動キャプチャなし。
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// レビュー優先: 自動でキャプチャするが、承認を要求する。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// 信頼できる自動化: 安全な提案を即座に書き込む。
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// 低コスト: レビュアーLLM呼び出しなし、明示的な修正フレーズのみ。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## キャプチャ経路

Skill Workshopには3つのキャプチャ経路があります。

### ツール提案

モデルは、再利用可能な手順を見つけたとき、またはユーザーがskillの保存/更新を依頼したときに、直接 `skill_workshop` を呼び出せます。

これは最も明示的な経路で、`autoCapture: false` でも動作します。

### ヒューリスティックキャプチャ

`autoCapture` が有効で、`reviewMode` が `heuristic` または `hybrid` の場合、Pluginは成功ターンをスキャンして、明示的なユーザー修正フレーズを探します:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ヒューリスティックは、最新の一致ユーザー指示から提案を作成します。一般的なワークフローのskill名選択にはトピックヒントを使います:

- アニメーションGIFタスク -> `animated-gif-workflow`
- スクリーンショットまたはアセットタスク -> `screenshot-asset-workflow`
- QAまたはシナリオタスク -> `qa-scenario-workflow`
- GitHub PRタスク -> `github-pr-workflow`
- フォールバック -> `learned-workflows`

ヒューリスティックキャプチャは意図的に狭く設計されています。これは、一般的なトランスクリプト要約ではなく、明確な修正や反復可能なプロセスノート向けです。

### LLMレビュアー

`autoCapture` が有効で、`reviewMode` が `llm` または `hybrid` の場合、しきい値到達後にPluginはコンパクトな埋め込みレビュアーを実行します。

レビュアーには次が渡されます:

- 最近のトランスクリプトテキスト（最後の12,000文字まで）
- 既存のワークスペースSkills最大12件
- 各既存skillから最大2,000文字
- JSON専用の指示

レビュアーにはツールがありません:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

返せるもの:

```json
{ "action": "none" }
```

または1件のskill提案:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

既存skillへの追記もできます:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

または、既存skill内の正確なテキストを置換できます:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

関連するskillがすでに存在する場合は、`append` または `replace` を優先してください。適合する既存skillがない場合にのみ `create` を使ってください。

## 提案ライフサイクル

生成された更新はすべて、次を持つ提案になります:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 任意の `agentId`
- 任意の `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, または `reviewer`
- `status`
- `change`
- 任意の `scanFindings`
- 任意の `quarantineReason`

提案ステータス:

- `pending` - 承認待ち
- `applied` - `<workspace>/skills` に書き込み済み
- `rejected` - operator/modelによって拒否済み
- `quarantined` - 重大なスキャナー検出結果によりブロック済み

状態はGateway状態ディレクトリ内でワークスペースごとに保存されます:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

保留および隔離提案は、skill名と変更ペイロードで重複排除されます。ストアは、最新の保留/隔離提案を `maxPending` まで保持します。

## ツールリファレンス

このPluginは1つのエージェントツールを登録します:

```text
skill_workshop
```

### `status`

アクティブなワークスペースの提案数を状態別に数えます。

```json
{ "action": "status" }
```

結果の形状:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

保留提案を一覧表示します。

```json
{ "action": "list_pending" }
```

別のステータスを一覧表示するには:

```json
{ "action": "list_pending", "status": "applied" }
```

有効な `status` 値:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

隔離提案を一覧表示します。

```json
{ "action": "list_quarantine" }
```

自動キャプチャが何もしていないように見え、ログに
`skill-workshop: quarantined <skill>`
と表示されている場合に使ってください。

### `inspect`

IDで提案を取得します。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

提案を作成します。`approvalPolicy: "pending"` では、デフォルトでキューされます。

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

安全な書き込みを強制するには:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

`approvalPolicy: "auto"` でも保留を強制するには:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

セクションへ追記するには:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

正確なテキストを置換するには:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

保留提案を適用します。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` は隔離提案を拒否します:

```text
quarantined proposal cannot be applied
```

### `reject`

提案を拒否済みとしてマークします。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

既存または提案済みskillディレクトリ内に補助ファイルを書き込みます。

許可されるトップレベル補助ディレクトリ:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

例:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

補助ファイルはワークスペーススコープで、パス検証され、`maxSkillBytes` によるサイズ制限が適用され、スキャンされ、アトミックに書き込まれます。

## Skill書き込み

Skill Workshopが書き込むのは次の配下のみです:

```text
<workspace>/skills/<normalized-skill-name>/
```

skill名は正規化されます:

- 小文字化される
- `[a-z0-9_-]` 以外の連続は `-` になる
- 先頭/末尾の非英数字は削除される
- 最大長は80文字
- 最終名は `[a-z0-9][a-z0-9_-]{1,79}` に一致しなければならない

`create` の場合:

- skillが存在しない場合、Skill Workshopは新しい `SKILL.md` を書き込みます
- すでに存在する場合は、本体を `## Workflow` に追記します

`append` の場合:

- skillが存在する場合、要求されたセクションへ追記します
- 存在しない場合、Skill Workshopは最小限のskillを作成してから追記します

`replace` の場合:

- skillはすでに存在している必要があります
- `oldText` が正確に存在している必要があります
- 最初の完全一致だけが置換されます

すべての書き込みはアトミックで、インメモリのSkillsスナップショットを即座に更新するため、新規または更新されたskillはGateway再起動なしで見えるようになります。

## 安全性モデル

Skill Workshopには、生成された `SKILL.md` 内容と補助ファイルに対する安全性スキャナーがあります。

重大な検出結果は提案を隔離します:

| Rule id                                | 次のような内容をブロックする...                                         |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | エージェントに以前/上位の指示を無視するよう命じる                       |
| `prompt-injection-system`              | システムプロンプト、developer message、または隠し指示に言及する         |
| `prompt-injection-tool`                | ツール権限/承認の回避を促す                                             |
| `shell-pipe-to-shell`                  | `curl`/`wget` を `sh`, `bash`, `zsh` にパイプする内容を含む             |
| `secret-exfiltration`                  | env/process envデータをネットワーク越しに送信しているように見える       |

警告検出結果は保持されますが、それ自体ではブロックしません:

| Rule id              | 次について警告する...             |
| -------------------- | --------------------------------- |
| `destructive-delete` | 広範な `rm -rf` 形式のコマンド    |
| `unsafe-permissions` | `chmod 777` 形式の権限使用        |

隔離された提案:

- `scanFindings` を保持する
- `quarantineReason` を保持する
- `list_quarantine` に表示される
- `apply` では適用できない

隔離提案から復旧するには、安全でない内容を除去した新しい安全な提案を作成してください。ストアJSONを手作業で編集しないでください。

## プロンプトガイダンス

有効時、Skill Workshopは短いプロンプトセクションを注入し、永続的な手続きメモリには `skill_workshop` を使うようエージェントに伝えます。

このガイダンスは次を強調します:

- 事実/好みではなく手順
- ユーザー修正
- 明白ではない成功手順
- 繰り返し発生する落とし穴
- append/replaceによる古い/薄い/誤ったskill修復
- 長いツールループや苦労した修正の後に再利用可能手順を保存すること
- 短い命令形のskillテキスト
- トランスクリプトのダンプは禁止

書き込みモードの文言は `approvalPolicy` によって変わります:

- pendingモード: 提案をキューする。明示的承認後にのみ適用する
- autoモード: 明確に再利用可能な場合、安全なワークスペースskill更新を適用する

## コストとランタイム動作

ヒューリスティックキャプチャはモデルを呼び出しません。

LLMレビューは、アクティブ/デフォルトのエージェントモデル上で埋め込み実行を使います。これはしきい値ベースなので、デフォルトでは毎ターン実行されません。

レビュアーは次の通りです:

- 利用可能な場合は、同じ設定済みprovider/modelコンテキストを使う
- そうでなければランタイムのエージェントデフォルトにフォールバックする
- `reviewTimeoutMs` を持つ
- 軽量なブートストラップコンテキストを使う
- ツールを持たない
- 直接は何も書き込まない
- 通常のスキャナーと承認/隔離経路を通る提案しか出力できない

レビュアーが失敗、タイムアウト、または無効なJSONを返した場合、Pluginはwarning/debugメッセージをログに出し、そのレビュー回をスキップします。

## 運用パターン

ユーザーが次のように言ったときはSkill Workshopを使ってください:

- 「次回はXをして」
- 「今後はYを優先して」
- 「必ずZを確認して」
- 「これをワークフローとして保存して」
- 「これには時間がかかった。手順を覚えておいて」
- 「このローカルskillを更新して」

良いskillテキスト:

```markdown
## Workflow

- GIF URLが `image/gif` に解決されることを確認する。
- ファイルに複数フレームがあることを確認する。
- ソースURL、ライセンス、帰属表示を記録する。
- アセットが製品に同梱される場合はローカルコピーを保存する。
- 最終返信前に、そのローカルアセットが対象UIで描画されることを確認する。
```

悪いskillテキスト:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

悪い例を保存すべきでない理由:

- トランスクリプト形状である
- 命令形ではない
- ノイズの多い一度限りの詳細を含んでいる
- 次のエージェントに何をすべきかを伝えていない

## デバッグ

Pluginが読み込まれているか確認するには:

```bash
openclaw plugins list --enabled
```

エージェント/ツールコンテキストから提案数を確認するには:

```json
{ "action": "status" }
```

保留提案を確認するには:

```json
{ "action": "list_pending" }
```

隔離提案を確認するには:

```json
{ "action": "list_quarantine" }
```

よくある症状:

| Symptom                               | Likely cause                                                                        | Check                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool is unavailable                   | Plugin entry is not enabled                                                         | `plugins.entries.skill-workshop.enabled` and `openclaw plugins list` |
| No automatic proposal appears         | `autoCapture: false`, `reviewMode: "off"`, or thresholds not met                    | Config, proposal status, Gateway logs                                |
| Heuristic did not capture             | User wording did not match correction patterns                                      | Use explicit `skill_workshop.suggest` or enable LLM reviewer         |
| Reviewer did not create a proposal    | Reviewer returned `none`, invalid JSON, or timed out                                | Gateway logs, `reviewTimeoutMs`, thresholds                          |
| Proposal is not applied               | `approvalPolicy: "pending"`                                                         | `list_pending`, then `apply`                                         |
| Proposal disappeared from pending     | Duplicate proposal reused, max pending pruning, or was applied/rejected/quarantined | `status`, `list_pending` with status filters, `list_quarantine`      |
| Skill file exists but model misses it | Skill snapshot not refreshed or skill gating excludes it                            | `openclaw skills` status and workspace skill eligibility             |

関連ログ:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QAシナリオ

リポジトリ同梱のQAシナリオ:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

決定的カバレッジを実行するには:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

レビュアーカバレッジを実行するには:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

レビュアーシナリオは意図的に分離されています。これは
`reviewMode: "llm"` を有効化し、埋め込みレビュアーパスを実行するためです。

## Auto Applyを有効にしない方がよい場合

次の場合は `approvalPolicy: "auto"` を避けてください:

- ワークスペースに機微な手順が含まれている
- エージェントが信頼できない入力を扱っている
- Skillsが広いチームで共有されている
- まだプロンプトやスキャナールールを調整中である
- モデルが敵対的なweb/emailコンテンツを頻繁に扱う

まずpendingモードを使ってください。そのワークスペースでエージェントが提案するskillの種類を確認してから、autoモードへ切り替えてください。

## 関連ドキュメント

- [Skills](/ja-JP/tools/skills)
- [Plugins](/ja-JP/tools/plugin)
- [Testing](/ja-JP/reference/test)
