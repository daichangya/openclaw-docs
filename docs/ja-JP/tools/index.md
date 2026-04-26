---
read_when:
    - OpenClawがどのようなツールを提供しているかを理解したい場合
    - ツールを設定、許可、または拒否する必要があります
    - 組み込みツール、Skills、Pluginのどれを使うかを判断しているところです
summary: 'OpenClawのツールとPluginの概要: エージェントにできることと、その拡張方法'
title: ツールとPlugin
x-i18n:
    generated_at: "2026-04-26T11:41:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

テキストを生成する以外でエージェントが行うことはすべて**ツール**を通じて行われます。ツールは、エージェントがファイルを読み、コマンドを実行し、Webを閲覧し、メッセージを送信し、デバイスとやり取りするための仕組みです。

## ツール、Skills、Plugin

OpenClawには、連携して動作する3つのレイヤーがあります。

<Steps>
  <Step title="ツールはエージェントが呼び出すもの">
    ツールは、エージェントが呼び出せる型付き関数です（例: `exec`、`browser`、`web_search`、`message`）。OpenClawには**組み込みツール**一式が含まれており、Pluginは追加のツールを登録できます。

    エージェントには、ツールはモデルAPIに送信される構造化関数定義として見えます。

  </Step>

  <Step title="Skillsは、いつどのように使うかをエージェントに教える">
    Skillは、システムプロンプトに注入されるMarkdownファイル（`SKILL.md`）です。
    Skillsは、ツールを効果的に使うためのコンテキスト、制約、およびステップバイステップのガイダンスをエージェントに提供します。Skillsはワークスペース、共有フォルダー内、またはPlugin内に含まれています。

    [Skillsリファレンス](/ja-JP/tools/skills) | [Skillsの作成](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Pluginはすべてをまとめてパッケージ化する">
    Pluginは、チャンネル、モデルプロバイダー、ツール、Skills、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、web fetch、web searchなど、任意の組み合わせのcapabilityを登録できるパッケージです。Pluginには**コア**（OpenClawに同梱）と**外部**（コミュニティがnpmで公開）のものがあります。

    [Pluginのインストールと設定](/ja-JP/tools/plugin) | [独自に構築する](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みツール

これらのツールはOpenClawに同梱されており、Pluginをインストールしなくても利用できます。

| ツール | 役割 | ページ |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process` | シェルコマンドを実行し、バックグラウンドプロセスを管理する | [Exec](/ja-JP/tools/exec), [Exec Approvals](/ja-JP/tools/exec-approvals) |
| `code_execution` | サンドボックス化されたリモートPython分析を実行する | [Code Execution](/ja-JP/tools/code-execution) |
| `browser` | Chromiumブラウザーを操作する（移動、クリック、スクリーンショット） | [Browser](/ja-JP/tools/browser) |
| `web_search` / `x_search` / `web_fetch` | Web検索、X投稿検索、ページ内容取得を行う | [Web](/ja-JP/tools/web), [Web Fetch](/ja-JP/tools/web-fetch) |
| `read` / `write` / `edit` | ワークスペース内のファイルI/O |  |
| `apply_patch` | 複数ハンクのファイルパッチ | [Apply Patch](/ja-JP/tools/apply-patch) |
| `message` | すべてのチャンネルにまたがってメッセージを送信する | [Agent Send](/ja-JP/tools/agent-send) |
| `canvas` | node Canvasを操作する（present、eval、snapshot） |  |
| `nodes` | ペアリング済みデバイスを検出して対象指定する |  |
| `cron` / `gateway` | スケジュール済みジョブを管理し、Gatewayを調査、パッチ、再起動、更新する |  |
| `image` / `image_generate` | 画像を解析または生成する | [Image Generation](/ja-JP/tools/image-generation) |
| `music_generate` | 音楽トラックを生成する | [Music Generation](/ja-JP/tools/music-generation) |
| `video_generate` | 動画を生成する | [Video Generation](/ja-JP/tools/video-generation) |
| `tts` | ワンショットのtext-to-speech変換 | [TTS](/ja-JP/tools/tts) |
| `sessions_*` / `subagents` / `agents_list` | セッション管理、状態確認、サブエージェントオーケストレーション | [Sub-agents](/ja-JP/tools/subagents) |
| `session_status` | 軽量な`/status`風の読み出しとセッションモデル上書き | [Session Tools](/ja-JP/concepts/session-tool) |

画像作業では、解析には`image`を、生成または編集には`image_generate`を使ってください。`openai/*`、`google/*`、`fal/*`、またはその他の非デフォルト画像プロバイダーを対象にする場合は、先にそのプロバイダーの認証/APIキーを設定してください。

音楽作業では、`music_generate`を使ってください。`google/*`、`minimax/*`、またはその他の非デフォルト音楽プロバイダーを対象にする場合は、先にそのプロバイダーの認証/APIキーを設定してください。

動画作業では、`video_generate`を使ってください。`qwen/*`またはその他の非デフォルト動画プロバイダーを対象にする場合は、先にそのプロバイダーの認証/APIキーを設定してください。

ワークフロー駆動の音声生成には、ComfyUIのようなPluginが登録する`music_generate`を使ってください。これは、text-to-speechである`tts`とは別です。

`session_status`はsessionsグループ内の軽量なstatus/readbackツールです。
これは現在のセッションについて`/status`風の質問に答え、必要に応じてセッションごとのモデル上書きを設定できます。`model=default`でその上書きは解除されます。`/status`と同様に、最新のトランスクリプト使用量エントリーから、疎なトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを補完できます。

`gateway`はGateway操作向けのowner-onlyランタイムツールです。

- 編集前に1つのパス範囲のconfigサブツリーを確認する`config.schema.lookup`
- 現在のconfigスナップショット + ハッシュを取得する`config.get`
- 再起動付きの部分config更新を行う`config.patch`
- 完全なconfig置き換え専用の`config.apply`
- 明示的な自己更新 + 再起動を行う`update.run`

部分変更では、`config.schema.lookup`の後に`config.patch`を使うことをおすすめします。
`config.apply`は、設定全体を意図的に置き換える場合にのみ使ってください。
より広いconfigドキュメントについては、[Configuration](/ja-JP/gateway/configuration)と
[Configuration reference](/ja-JP/gateway/configuration-reference)を読んでください。
このツールは`tools.exec.ask`または`tools.exec.security`の変更も拒否します。
レガシーな`tools.bash.*`エイリアスは、同じ保護されたexecパスに正規化されます。

### Plugin提供ツール

Pluginは追加のツールを登録できます。いくつかの例:

- [Diffs](/ja-JP/tools/diffs) — 差分ビューアーおよびレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力向けJSON専用LLMステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を備えた型付きワークフローランタイム
- [Music Generation](/ja-JP/tools/music-generation) — ワークフローバックエンドのプロバイダーを使う共有`music_generate`ツール
- [OpenProse](/ja-JP/prose) — Markdownファーストのワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイズの多い`exec`および`bash`ツール結果をコンパクト化

## ツール設定

### 許可リストと拒否リスト

configの`tools.allow` / `tools.deny`で、エージェントが呼び出せるツールを制御します。拒否は常に許可より優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

明示的な許可リストが呼び出し可能なツールを1つも解決しない場合、OpenClawはクローズドな状態で失敗します。
たとえば、`tools.allow: ["query_db"]`は、読み込まれたPluginが実際に`query_db`を登録している場合にのみ機能します。
組み込みツール、Plugin、またはバンドル済みMCPツールのいずれも許可リストに一致しない場合、実行はモデル呼び出し前に停止し、ツール結果を幻覚で生成しかねないテキスト専用実行として継続されることはありません。

### ツールプロファイル

`tools.profile`は、`allow`/`deny`が適用される前のベース許可リストを設定します。
エージェントごとの上書き: `agents.list[].tools.profile`。

| プロファイル | 含まれるもの |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 制限なし（未設定と同じ） |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `minimal` | `session_status`のみ |

`coding`には軽量なWebツール（`web_search`、`web_fetch`、`x_search`）が含まれますが、完全なブラウザー制御ツールは含まれません。ブラウザー自動化は実際のセッションやログイン済みプロファイルを操作できるため、`tools.alsoAllow: ["browser"]`またはエージェントごとの`agents.list[].tools.alsoAllow: ["browser"]`で明示的に追加してください。

`coding`および`messaging`プロファイルは、Pluginキー`bundle-mcp`の下にある設定済みbundle MCPツールも許可します。通常の組み込みツールは維持したまま、設定済みMCPツールをすべて隠したい場合は、`tools.deny: ["bundle-mcp"]`を追加してください。`minimal`プロファイルにはbundle MCPツールは含まれません。

### ツールグループ

allow/denyリストでは`group:*`短縮記法を使います。

| グループ | ツール |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime` | exec, process, code_execution（`bash`は`exec`のエイリアスとして受け付けられます） |
| `group:fs` | read, write, edit, apply_patch |
| `group:sessions` | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory` | memory_search, memory_get |
| `group:web` | web_search, x_search, web_fetch |
| `group:ui` | browser, canvas |
| `group:automation` | cron, gateway |
| `group:messaging` | message |
| `group:nodes` | nodes |
| `group:agents` | agents_list |
| `group:media` | image, image_generate, music_generate, video_generate, tts |
| `group:openclaw` | すべての組み込みOpenClawツール（Pluginツールは除く） |

`sessions_history`は、制限付きで安全性フィルタリングされた再呼び出しビューを返します。これは、thinkingタグ、`<relevant-memories>`の足場、プレーンテキストのツール呼び出しXMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、ダウングレードされたツール呼び出し足場、漏洩したASCII/全角のモデル制御トークン、およびアシスタントテキスト内の不正なMiniMaxツール呼び出しXMLを取り除いたうえで、rawなトランスクリプトダンプとして動作する代わりに、リダクション/切り詰めと、必要に応じてサイズ超過行プレースホルダーを適用します。

### プロバイダー固有の制限

グローバルデフォルトを変更せずに、特定のプロバイダーに対するツールを制限するには`tools.byProvider`を使います。

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
