---
read_when:
    - OpenClawがどのようなtoolsを提供しているかを理解したい場合
    - toolsを設定、有効化、または拒否する必要がある場合
    - 組み込みtools、Skills、Pluginのどれを使うべきか判断している場合
summary: 'OpenClawのtoolsとPluginの概要: agentにできることと拡張方法'
title: toolsとPlugin
x-i18n:
    generated_at: "2026-04-23T04:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c32414dfa99969372e9b0c846305a1af1ffb18a282e6dfc8a6adabe3fab145a
    source_path: tools/index.md
    workflow: 15
---

# toolsとPlugin

agentがテキスト生成以外に行うことは、すべて**tools**を通じて行われます。
toolsは、agentがファイルを読み、コマンドを実行し、webを閲覧し、メッセージを送り、デバイスとやり取りするための手段です。

## tools、Skills、Plugin

OpenClawには、連携して動作する3つのレイヤーがあります。

<Steps>
  <Step title="toolsはagentが呼び出すもの">
    toolは、agentが呼び出せる型付き関数です（例: `exec`、`browser`、`web_search`、`message`）。OpenClawは一連の**組み込みtools**を提供しており、pluginsは追加のtoolも登録できます。

    agentからは、toolsはモデルAPIに送られる構造化関数定義として見えます。

  </Step>

  <Step title="Skillsはいつ・どのように使うかを教える">
    Skillは、システムpromptに注入されるMarkdownファイル（`SKILL.md`）です。
    Skillsは、toolsを効果的に使うためのコンテキスト、制約、ステップバイステップのガイダンスをagentに与えます。Skillsはworkspace、共有フォルダー、またはplugins内に存在します。

    [Skills reference](/ja-JP/tools/skills) | [Creating skills](/ja-JP/tools/creating-skills)

  </Step>

  <Step title="Pluginはすべてをまとめてパッケージ化する">
    Pluginは、channels、モデルprovider、tools、Skills、speech、リアルタイム文字起こし、リアルタイム音声、media understanding、画像生成、動画生成、web fetch、web searchなど、任意の組み合わせの機能を登録できるパッケージです。一部のpluginsは**core**（OpenClaw同梱）、その他は**external**（コミュニティがnpmで公開）です。

    [Install and configure plugins](/ja-JP/tools/plugin) | [Build your own](/ja-JP/plugins/building-plugins)

  </Step>
</Steps>

## 組み込みtools

これらのtoolsはOpenClawに同梱されており、Pluginをインストールしなくても利用できます。

| tool | 何をするか | ページ |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process` | shellコマンドを実行し、バックグラウンドプロセスを管理する | [Exec](/ja-JP/tools/exec) |
| `code_execution` | sandbox化されたリモートPython解析を実行する | [Code Execution](/ja-JP/tools/code-execution) |
| `browser` | Chromiumブラウザーを操作する（移動、クリック、スクリーンショット） | [Browser](/ja-JP/tools/browser) |
| `web_search` / `x_search` / `web_fetch` | webを検索し、X投稿を検索し、ページ内容を取得する | [Web](/ja-JP/tools/web) |
| `read` / `write` / `edit` | workspace内でファイルI/Oを行う | |
| `apply_patch` | 複数hunkのファイルpatch | [Apply Patch](/ja-JP/tools/apply-patch) |
| `message` | すべてのchannelにまたがってメッセージを送信する | [Agent Send](/ja-JP/tools/agent-send) |
| `canvas` | Node Canvasを操作する（present、eval、snapshot） | |
| `nodes` | ペア済みデバイスを検出して対象指定する | |
| `cron` / `gateway` | スケジュールジョブを管理し、Gatewayを検査、patch、再起動、更新する | |
| `image` / `image_generate` | 画像を解析または生成する | [Image Generation](/ja-JP/tools/image-generation) |
| `music_generate` | 音楽トラックを生成する | [Music Generation](/ja-JP/tools/music-generation) |
| `video_generate` | 動画を生成する | [Video Generation](/ja-JP/tools/video-generation) |
| `tts` | 単発のtext-to-speech変換 | [TTS](/ja-JP/tools/tts) |
| `sessions_*` / `subagents` / `agents_list` | session管理、status、sub-agentオーケストレーション | [Sub-agents](/ja-JP/tools/subagents) |
| `session_status` | 軽量な`/status`形式の読み返しとsessionモデル上書き | [Session Tools](/ja-JP/concepts/session-tool) |

画像作業では、解析には`image`、生成または編集には`image_generate`を使ってください。`openai/*`、`google/*`、`fal/*`、またはその他の非デフォルト画像providerを対象にする場合は、先にそのproviderの認証/APIキーを設定してください。

音楽作業では`music_generate`を使ってください。`google/*`、`minimax/*`、またはその他の非デフォルト音楽providerを対象にする場合は、先にそのproviderの認証/APIキーを設定してください。

動画作業では`video_generate`を使ってください。`qwen/*`またはその他の非デフォルト動画providerを対象にする場合は、先にそのproviderの認証/APIキーを設定してください。

ワークフロー駆動の音声生成には、ComfyUIのようなPluginがそれを登録している場合、`music_generate`を使ってください。これはtext-to-speechである`tts`とは別です。

`session_status`はsessionsグループ内の軽量なstatus/readback toolです。
現在のsessionについて`/status`形式の質問に答え、必要に応じてsessionごとのモデル上書きを設定できます。`model=default`はその上書きをクリアします。`/status`と同様に、最新のtranscript使用量エントリから、疎なtoken/cacheカウンターやアクティブなランタイムモデルラベルを補完できます。

`gateway`は、Gateway操作向けのowner専用ランタイムtoolです。

- 編集前に1つのパススコープ設定サブツリーを確認するための`config.schema.lookup`
- 現在の設定スナップショット + hash用の`config.get`
- 再起動付き部分設定更新用の`config.patch`
- 完全な設定置換専用の`config.apply`
- 明示的な自己更新 + 再起動用の`update.run`

部分変更では、`config.schema.lookup`の後に`config.patch`を使うことを推奨します。`config.apply`は設定全体を意図的に置き換える場合にのみ使ってください。
このtoolは、`tools.exec.ask`または`tools.exec.security`の変更も拒否します。レガシーの`tools.bash.*`エイリアスは、同じ保護されたexecパスに正規化されます。

### Plugin提供tools

pluginsは追加のtoolを登録できます。いくつかの例:

- [Diffs](/ja-JP/tools/diffs) — diffビューアーとレンダラー
- [LLM Task](/ja-JP/tools/llm-task) — 構造化出力用のJSON専用LLMステップ
- [Lobster](/ja-JP/tools/lobster) — 再開可能な承認を持つ型付きワークフローランタイム
- [Music Generation](/ja-JP/tools/music-generation) — ワークフローバックエンドproviderを持つ共有`music_generate` tool
- [OpenProse](/ja-JP/prose) — Markdownファーストのワークフローオーケストレーション
- [Tokenjuice](/ja-JP/tools/tokenjuice) — ノイジーな`exec`および`bash` tool結果をコンパクト化

## tool設定

### allow listとdeny list

設定内の`tools.allow` / `tools.deny`を使って、agentが呼び出せるtoolsを制御します。denyは常にallowより優先されます。

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### tool profile

`tools.profile`は、`allow`/`deny`が適用される前のベースallowlistを設定します。
agentごとの上書き: `agents.list[].tools.profile`。

| profile | 含まれるもの |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full` | 制限なし（未設定と同じ） |
| `coding` | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `minimal` | `session_status`のみ |

`coding`および`messaging` profileは、plugin key `bundle-mcp`配下の設定済みバンドルMCP toolsも許可します。profileが通常の組み込みtoolを維持しつつ、設定済みMCP toolsをすべて隠したい場合は、`tools.deny: ["bundle-mcp"]`を追加してください。
`minimal` profileにはバンドルMCP toolsは含まれません。

### tool group

allow/deny listでは`group:*`短縮記法を使ってください。

| グループ | tools |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime` | exec、process、code_execution（`bash`は`exec`のエイリアスとして受け付けられる） |
| `group:fs` | read、write、edit、apply_patch |
| `group:sessions` | sessions_list、sessions_history、sessions_send、sessions_spawn、sessions_yield、subagents、session_status |
| `group:memory` | memory_search、memory_get |
| `group:web` | web_search、x_search、web_fetch |
| `group:ui` | browser、canvas |
| `group:automation` | cron、gateway |
| `group:messaging` | message |
| `group:nodes` | nodes |
| `group:agents` | agents_list |
| `group:media` | image、image_generate、music_generate、video_generate、tts |
| `group:openclaw` | すべての組み込みOpenClaw tools（plugin toolsは除外） |

`sessions_history`は、範囲制限され安全性フィルタ済みのリコールビューを返します。thinkingタグ、`<relevant-memories>`足場、プレーンテキストのtool-call XMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたtool-callブロックを含む）、格下げされたtool-call足場、漏れたASCII/全角のmodel control token、壊れたMiniMax tool-call XMLをassistantテキストから除去し、その後でredaction/truncationと、必要に応じた過大行プレースホルダーを適用します。生のtranscriptダンプとしては動作しません。

### provider固有の制限

グローバルデフォルトを変更せずに、特定のprovider向けにtoolsを制限するには`tools.byProvider`を使ってください。

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
