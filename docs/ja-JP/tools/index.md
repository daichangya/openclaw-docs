---
read_when:
    - OpenClaw がどのようなツールを提供しているかを理解したいです
    - ツールを設定、有効化、または無効化する必要があります
    - 組み込みツール、Skills、Plugin のどれを使うかを判断しています
summary: 'OpenClaw のツールと Plugin の概要: エージェントにできることと、その拡張方法'
title: ツールと Plugin
x-i18n:
    generated_at: "2026-04-25T14:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

テキストを生成する以外でエージェントが行うすべてのことは、**ツール**を通じて行われます。
ツールは、エージェントがファイルを読み、コマンドを実行し、Web を閲覧し、メッセージを送り、デバイスとやり取りする方法です。

## ツール、Skills、Plugin

OpenClaw には、連携して動作する 3 つのレイヤーがあります。

<Steps>
  <Step title="ツールはエージェントが呼び出すもの">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、`web_search`、`message`）。OpenClaw には一連の**組み込みツール**が付属しており、Plugin は追加のツールを登録できます。

    エージェントには、ツールはモデル API に送られる構造化関数定義として見えます。

  </Step>

  <Step title="Skills はいつどのように使うかを教える">
    Skill は、システムプロンプトに注入される Markdown ファイル（`SKILL.md`）です。
    Skills は、ツールを効果的に使うためのコンテキスト、制約、段階的なガイダンスをエージェントに与えます。Skills はワークスペース、共有フォルダー内に置け、Plugin 内に同梱することもできます。

    [Skills reference](/ja-JP/tools/skills) | [Creating skills](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Plugin はすべてをまとめてパッケージ化する">
    Plugin は、チャネル、モデル provider、ツール、Skills、speech、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web fetch、Web 検索など、任意の組み合わせの機能を登録できるパッケージです。Plugin には、**core**（OpenClaw に同梱）なものと、**external**（コミュニティが npm で公開）なものがあります。

    [Install and configure plugins](/ja-JP/tools/plugin) | [Build your own](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールは OpenClaw に同梱されており、Plugin をインストールしなくても利用できます。

| ツール                                       | できること                                                          | ページ                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | シェルコマンドを実行し、バックグラウンドプロセスを管理する                       | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution`                           | サンドボックス化されたリモート Python 解析を実行する                                  | [Code Execution](/ja-JP/tools/code-execution)                      |
| `browser`                                  | Chromium ブラウザーを操作する（移動、クリック、スクリーンショット）              | [Browser](/ja-JP/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web を検索し、X 投稿を検索し、ページ内容を取得する                    | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch)             |
| `read` / `write` / `edit`                  | ワークスペース内のファイル I/O                                             |                                                              |
| `apply_patch`                              | 複数ハンクのファイルパッチ                                               | [Apply Patch](/ja-JP/tools/apply-patch)                            |
| `message`                                  | すべてのチャネルにまたがってメッセージを送信する                                     | [Agent Send](/ja-JP/tools/agent-send)                              |
| `canvas`                                   | Node Canvas を操作する（present、eval、snapshot）                           |                                                              |
| `nodes`                                    | ペアリング済みデバイスを検出して対象にする                                    |                                                              |
| `cron` / `gateway`                         | スケジュール済みジョブを管理し、gateway を検査、パッチ、再起動、更新する |                                                              |
| `image` / `image_generate`                 | 画像を解析または生成する                                            | [Image Generation](/ja-JP/tools/image-generation)                  |
| `music_generate`                           | 音楽トラックを生成する                                                 | [Music Generation](/ja-JP/tools/music-generation)                  |
| `video_generate`                           | 動画を生成する                                                       | [Video Generation](/ja-JP/tools/video-generation)                  |
| `tts`                                      | ワンショットのテキスト読み上げ変換                                    | [TTS](/ja-JP/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、状態確認、サブエージェントのオーケストレーション               | [Sub-agents](/ja-JP/tools/subagents)                               |
| `session_status`                           | 軽量な `/status` 風の読み出しとセッションごとのモデルオーバーライド       | [Session Tools](/ja-JP/concepts/session-tool)                      |

画像作業では、解析には `image` を、生成または編集には `image_generate` を使用してください。`openai/*`、`google/*`、`fal/*`、またはその他の非デフォルト画像 provider を対象にする場合は、先にその provider の認証/API キーを設定してください。

音楽作業では `music_generate` を使用してください。`google/*`、`minimax/*`、またはその他の非デフォルト音楽 provider を対象にする場合は、先にその provider の認証/API キーを設定してください。

動画作業では `video_generate` を使用してください。`qwen/*` またはその他の非デフォルト動画 provider を対象にする場合は、先にその provider の認証/API キーを設定してください。

ワークフロー駆動の音声生成では、ComfyUI のような Plugin が `music_generate` を登録している場合にそれを使用してください。これは `tts` とは別物で、`tts` はテキスト読み上げです。

`session_status` は sessions グループ内の軽量な status/readback ツールです。
現在のセッションについて `/status` 風の質問に答え、必要に応じてセッションごとのモデルオーバーライドを設定できます。`model=default` でそのオーバーライドを解除します。`/status` と同様に、最新の transcript 使用量エントリから不足しているトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway` は gateway 操作用の owner 専用ランタイムツールです。

- 編集前に 1 つのパススコープ config サブツリーを取得する `config.schema.lookup`
- 現在の config スナップショット + ハッシュを取得する `config.get`
- 再起動付きで部分的な config 更新を行う `config.patch`
- 完全な config 置換のみに使う `config.apply`
- 明示的な自己更新 + 再起動を行う `update.run`

部分変更では、`config.schema.lookup` の後に `config.patch` を優先してください。`config.apply` は、設定全体を意図的に置き換える場合にのみ使ってください。
このツールは `tools.exec.ask` や `tools.exec.security` の変更も拒否します。レガシーな `tools.bash.*` エイリアスは同じ保護された exec パスに正規化されます。

### Plugin 提供ツール

Plugin は追加のツールを登録できます。いくつか例を示します。

- [Diffs](/ja-JP/tools/diffs) — diff ビューアーおよびレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力用の JSON 専用 LLM ステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を持つ型付きワークフローランタイム
- [Music Generation](/ja-JP/tools/music-generation) — ワークフロー駆動 provider を持つ共有 `music_generate` ツール
- [OpenProse](/ja-JP/prose) — Markdown ファーストのワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い `exec` および `bash` ツール結果をコンパクト化する

## ツール設定

### 許可リストと拒否リスト

config 内の `tools.allow` / `tools.deny` を使って、エージェントが呼び出せるツールを制御します。拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw は、明示的な許可リストが呼び出し可能なツール 0 件に解決されると fail closed します。
たとえば `tools.allow: ["query_db"]` は、ロードされた Plugin が実際に `query_db` を登録している場合にのみ機能します。組み込みツール、Plugin、またはバンドル済み MCP ツールのいずれも許可リストに一致しない場合、実行はモデル呼び出し前に停止し、ツール結果を幻覚で埋める可能性のあるテキスト専用実行として継続しません。

### ツールプロファイル

`tools.profile` は、`allow`/`deny` 適用前のベース許可リストを設定します。
エージェントごとのオーバーライド: `agents.list[].tools.profile`。

| プロファイル     | 含まれるもの                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | 制限なし（未設定と同じ）                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` のみ                                                                                                                             |

`coding` と `messaging` のプロファイルは、Plugin キー `bundle-mcp` の下にある設定済み bundle MCP ツールも許可します。プロファイルの通常の組み込みツールは維持したまま、設定済み MCP ツールをすべて隠したい場合は `tools.deny: ["bundle-mcp"]` を追加してください。`minimal` プロファイルには bundle MCP ツールは含まれません。

### ツールグループ

許可/拒否リストでは `group:*` の短縮記法を使います。

| グループ              | ツール                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec、process、code_execution（`bash` は `exec` のエイリアスとして受け付けられる）                                 |
| `group:fs`         | read、write、edit、apply_patch                                                                            |
| `group:sessions`   | sessions_list、sessions_history、sessions_send、sessions_spawn、sessions_yield、subagents、session_status |
| `group:memory`     | memory_search、memory_get                                                                                 |
| `group:web`        | web_search、x_search、web_fetch                                                                           |
| `group:ui`         | browser、canvas                                                                                           |
| `group:automation` | cron、gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image、image_generate、music_generate、video_generate、tts                                                |
| `group:openclaw`   | すべての組み込み OpenClaw ツール（Plugin ツールは除く）                                                       |

`sessions_history` は、境界付きで安全性フィルタ済みのリコールビューを返します。思考タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、格下げされたツール呼び出し足場、漏れた ASCII/全角モデル制御トークン、不正な MiniMax ツール呼び出し XML を assistant テキストから除去し、その後にリダクション/切り詰めを適用し、必要に応じて oversized-row プレースホルダーを使うため、生の transcript ダンプとしては動作しません。

### Provider 固有の制限

`tools.byProvider` を使うと、グローバルデフォルトを変えずに特定の provider 用ツールを制限できます。

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
