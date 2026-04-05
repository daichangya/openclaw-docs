---
read_when:
    - エージェントランタイム、ワークスペースのブートストラップ、またはセッション動作を変更する場合
summary: エージェントランタイム、ワークスペース契約、セッションブートストラップ
title: Agent Runtime
x-i18n:
    generated_at: "2026-04-05T12:40:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Agent Runtime

OpenClaw は単一の埋め込みエージェントランタイムを実行します。

## ワークスペース（必須）

OpenClaw は単一のエージェントワークスペースディレクトリ（`agents.defaults.workspace`）を、ツールおよびコンテキストのためのエージェントの**唯一の**作業ディレクトリ（`cwd`）として使用します。

推奨: `openclaw setup` を使用して、`~/.openclaw/openclaw.json` が存在しない場合は作成し、ワークスペースファイルを初期化します。

完全なワークスペースレイアウトとバックアップガイド: [Agent workspace](/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、メイン以外のセッションはこれを
`agents.defaults.sandbox.workspaceRoot` 配下のセッションごとのワークスペースで上書きできます（[Gateway configuration](/gateway/configuration) を参照）。

## ブートストラップファイル（注入されるもの）

`agents.defaults.workspace` 内で、OpenClaw は次のユーザー編集可能なファイルを想定しています。

- `AGENTS.md` — 操作手順 + 「記憶」
- `SOUL.md` — ペルソナ、境界、トーン
- `TOOLS.md` — ユーザー管理のツールメモ（例: `imsg`、`sag`、慣例）
- `BOOTSTRAP.md` — 初回実行時の一度きりの儀式（完了後に削除されます）
- `IDENTITY.md` — エージェント名 / 雰囲気 / 絵文字
- `USER.md` — ユーザープロフィール + 希望する呼ばれ方

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をエージェントコンテキストに直接注入します。

空のファイルはスキップされます。大きなファイルは、プロンプトを軽量に保つためにマーカー付きで切り詰め・省略されます（完全な内容はファイルを読んでください）。

ファイルが存在しない場合、OpenClaw は単一の「missing file」マーカー行を注入します（また、`openclaw setup` は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md` は**完全に新しいワークスペース**でのみ作成されます（ほかのブートストラップファイルが存在しない場合）。儀式の完了後にこれを削除した場合、以後の再起動時に再作成されることはありません。

ブートストラップファイルの作成を完全に無効にするには（事前投入済みワークスペース向け）、次を設定します。

```json5
{ agent: { skipBootstrap: true } }
```

## 組み込みツール

コアツール（read / exec / edit / write および関連システムツール）は、ツールポリシーに従って常に利用可能です。`apply_patch` は任意で、`tools.exec.applyPatch` によって制御されます。`TOOLS.md` は存在するツールの種類を制御しません。これは、それらを_どのように_使いたいかについてのガイダンスです。

## Skills

OpenClaw は次の場所から Skills を読み込みます（優先順位の高い順）。

- ワークスペース: `<workspace>/skills`
- プロジェクトエージェント Skills: `<workspace>/.agents/skills`
- 個人エージェント Skills: `~/.agents/skills`
- 管理対象 / ローカル: `~/.openclaw/skills`
- バンドル済み（インストールに同梱）
- 追加のスキルフォルダー: `skills.load.extraDirs`

Skills は設定 / 環境変数で制御できます（[Gateway configuration](/gateway/configuration) の `skills` を参照）。

## ランタイム境界

埋め込みエージェントランタイムは Pi エージェントコア（モデル、ツール、プロンプトパイプライン）上に構築されています。セッション管理、検出、ツール配線、チャンネル配信は、そのコアの上にある OpenClaw 所有のレイヤーです。

## セッション

セッショントランスクリプトは、次の場所に JSONL として保存されます。

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は安定しており、OpenClaw によって選択されます。
他のツールのレガシーセッションフォルダーは読み込まれません。

## ストリーミング中のステアリング

キューモードが `steer` の場合、受信メッセージは現在の実行に注入されます。
キューされたステアリングは、**現在のアシスタントターンがツール呼び出しの実行を完了した後**、次の LLM 呼び出しの前に配信されます。ステアリングは現在のアシスタントメッセージに残っているツール呼び出しをもはやスキップしません。代わりに、次のモデル境界でキューされたメッセージを注入します。

キューモードが `followup` または `collect` の場合、受信メッセージは現在のターンが終了するまで保持され、その後キューされたペイロードで新しいエージェントターンが開始されます。モード + デバウンス / 上限の動作については [Queue](/concepts/queue) を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを終了し次第すぐに送信します。これは**デフォルトでオフ**です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は `agents.defaults.blockStreamingBreak`（`text_end` または `message_end`、デフォルトは text_end）で調整します。
ソフトなブロック分割は `agents.defaults.blockStreamingChunk` で制御します（デフォルトは
800〜1200 文字。段落区切りを優先し、次に改行、最後に文を優先します）。
ストリーミングされたチャンクは `agents.defaults.blockStreamingCoalesce` で結合して
単一行のスパムを減らせます（送信前にアイドル時間ベースで結合）。Telegram 以外のチャンネルでは、
ブロック返信を有効にするために明示的な `*.blockStreaming: true` が必要です。
詳細なツールサマリーはツール開始時に出力されます（デバウンスなし）。Control UI は、
利用可能な場合にエージェントイベントを通じてツール出力をストリーミングします。
詳細: [Streaming + chunking](/concepts/streaming)。

## モデル参照

設定内のモデル参照（たとえば `agents.defaults.model` および `agents.defaults.models`）は、**最初の** `/` で分割して解析されます。

- モデルを設定するときは `provider/model` を使用します。
- モデル ID 自体に `/` が含まれる場合（OpenRouter スタイル）、プロバイダー接頭辞を含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw は最初にエイリアスを試し、その後、その正確なモデル ID に対する一意の設定済みプロバイダーマッチを試し、それでも見つからない場合にのみ設定済みのデフォルトプロバイダーにフォールバックします。そのプロバイダーが設定済みのデフォルトモデルを提供しなくなっている場合、OpenClaw は古い削除済みプロバイダーのデフォルトを表示する代わりに、最初に設定された provider/model にフォールバックします。

## 設定（最小限）

最低限、次を設定してください。

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次へ: [Group Chats](/ja-JP/channels/group-messages)_ 🦞
