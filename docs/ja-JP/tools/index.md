---
read_when:
    - OpenClaw が提供するツールを理解したいとき
    - ツールを設定、許可、または拒否する必要があるとき
    - 組み込みツール、Skills、プラグインのどれを使うべきか判断するとき
summary: 'OpenClaw のツールとプラグインの概要: エージェントができることと、それを拡張する方法'
title: ツールとプラグイン
x-i18n:
    generated_at: "2026-04-05T12:59:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# ツールとプラグイン

エージェントがテキスト生成以外で行うすべてのことは、**ツール**を通じて行われます。
ツールは、エージェントがファイルを読み、コマンドを実行し、Web を閲覧し、メッセージを送り、
デバイスとやり取りするための手段です。

## ツール、Skills、プラグイン

OpenClaw には、連携して動作する 3 つの層があります。

<Steps>
  <Step title="ツールはエージェントが呼び出すもの">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、
    `web_search`、`message`）。OpenClaw には**組み込みツール**の一式が含まれており、
    プラグインは追加のツールを登録できます。

    エージェントには、ツールはモデル API に送られる構造化関数定義として見えます。

  </Step>

  <Step title="Skills はいつどのように使うかを教える">
    Skill は、システムプロンプトに注入される markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使うためのコンテキスト、制約、手順ごとのガイダンスを
    エージェントに与えます。Skills はあなたのワークスペース、共有フォルダー、
    またはプラグイン内に存在します。

    [Skills reference](/tools/skills) | [Creating skills](/tools/creating-skills)

  </Step>

  <Step title="プラグインはすべてをひとつにまとめる">
    プラグインは、任意の組み合わせの機能を登録できるパッケージです:
    チャネル、モデルプロバイダー、ツール、Skills、speech、realtime transcription、
    realtime voice、media understanding、image generation、video generation、
    web fetch、web search などです。一部のプラグインは**コア**（
    OpenClaw に同梱）で、他は**外部**（コミュニティが npm で公開）です。

    [Install and configure plugins](/tools/plugin) | [Build your own](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、プラグインをインストールしなくても利用できます。

| Tool                                       | 何をするか                                                           | ページ                                    |
| ------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------- |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する           | [Exec](/tools/exec)                       |
| `code_execution`                           | サンドボックス化されたリモート Python 分析を実行する                 | [Code Execution](/tools/code-execution)   |
| `browser`                                  | Chromium ブラウザーを制御する（移動、クリック、スクリーンショット） | [Browser](/tools/browser)                 |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X の投稿を検索し、ページ内容を取得する                | [Web](/tools/web)                         |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                      |                                           |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                           | [Apply Patch](/tools/apply-patch)         |
| `message`                                  | すべてのチャネルにメッセージを送信する                               | [Agent Send](/tools/agent-send)           |
| `canvas`                                   | ノード Canvas を操作する（present、eval、snapshot）                  |                                           |
| `nodes`                                    | ペアリング済みデバイスを検出し、対象にする                           |                                           |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、gateway を調査、修正、再起動、更新する |                                           |
| `image` / `image_generate`                 | 画像を解析または生成する                                             |                                           |
| `tts`                                      | 単発の text-to-speech 変換                                           | [TTS](/tools/tts)                         |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、状態確認、サブエージェントのオーケストレーション     | [Sub-agents](/tools/subagents)            |
| `session_status`                           | 軽量な `/status` 形式の読み出しとセッション単位のモデル上書き         | [Session Tools](/ja-JP/concepts/session-tool)   |

画像作業では、解析には `image`、生成または編集には `image_generate` を使ってください。`openai/*`、`google/*`、`fal/*`、またはその他の非デフォルト画像プロバイダーを対象にする場合は、まずそのプロバイダーの auth/API キーを設定してください。

`session_status` は sessions グループ内の軽量な status/readback ツールです。
現在のセッションについて `/status` 形式の質問に答え、
必要に応じてセッション単位のモデル上書きを設定できます。`model=default` はその
上書きをクリアします。`/status` と同様に、最新の文字起こし使用量エントリーから、
疎なトークン/キャッシュカウンターやアクティブなランタイムモデルラベルを補完できます。

`gateway` は gateway 操作用の owner-only ランタイムツールです。

- 編集前に 1 つのパス範囲の config サブツリーを確認する `config.schema.lookup`
- 現在の config スナップショット + ハッシュを取得する `config.get`
- 再起動付きで部分的な config 更新を行う `config.patch`
- 完全な config 置換にのみ使う `config.apply`
- 明示的な自己更新 + 再起動を行う `update.run`

部分変更では、`config.schema.lookup` の後に `config.patch` を使うのが望ましいです。
`config.apply` は、設定全体を意図的に置き換える場合にのみ使ってください。
このツールは `tools.exec.ask` や `tools.exec.security` の変更も拒否します。
レガシーな `tools.bash.*` エイリアスは、同じ保護された exec パスに正規化されます。

### プラグイン提供ツール

プラグインは追加のツールを登録できます。例をいくつか挙げます。

- [Lobster](/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [LLM Task](/tools/llm-task) — 構造化出力用の JSON 専用 LLM ステップ
- [Diffs](/tools/diffs) — diff ビューアーおよびレンダラー
- [OpenProse](/ja-JP/prose) — markdown-first のワークフローオーケストレーション

## ツール設定

### 許可リストと拒否リスト

config の `tools.allow` / `tools.deny` を使って、エージェントが呼び出せるツールを制御します。
拒否は常に許可に優先します。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### ツールプロファイル

`tools.profile` は、`allow`/`deny` が適用される前のベース許可リストを設定します。
エージェント単位の上書き: `agents.list[].tools.profile`。

| Profile     | 含まれるもの                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `full`      | 制限なし（未設定と同じ）                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                |
| `minimal`   | `session_status` のみ                                                                                     |

### ツールグループ

許可/拒否リストでは `group:*` の短縮記法を使います。

| Group              | ツール                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution（`bash` は `exec` のエイリアスとして受け付けられます）                     |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | すべての組み込み OpenClaw ツール（プラグインツールは除く）                                                |

`sessions_history` は、境界付きで安全性フィルター済みのリコールビューを返します。これには
thinking タグ、`<relevant-memories>` の足場、
プレーンテキストのツール呼び出し XML
ペイロード（`<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、
格下げされたツール呼び出しの足場、漏れた ASCII/全角のモデル制御
トークン、不正な MiniMax ツール呼び出し XML を assistant テキストから取り除き、その後、
生の文字起こしダンプとして振る舞う代わりに、redaction/truncation と必要に応じた oversized-row プレースホルダーを適用します。

### プロバイダー固有の制限

グローバルデフォルトを変えずに、特定のプロバイダー向けにツールを制限するには
`tools.byProvider` を使います。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
