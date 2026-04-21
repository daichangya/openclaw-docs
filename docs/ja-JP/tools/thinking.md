---
read_when:
    - 思考、fast モード、または verbose ディレクティブの解析やデフォルトの調整
summary: '`/think`、`/fast`、`/verbose`、`/trace` のディレクティブ構文と推論の可視性'
title: 思考レベル
x-i18n:
    generated_at: "2026-04-21T19:21:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# 思考レベル（`/think` ディレクティブ）

## これが行うこと

- 任意の受信本文内で使えるインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大予算）
  - xhigh → 「ultrathink+」（GPT-5.2 + Codex モデルおよび Anthropic Claude Opus 4.7 effort）
  - adaptive → プロバイダー管理の適応型 thinking（Anthropic/Bedrock 上の Claude 4.6 と Anthropic Claude Opus 4.7 でサポート）
  - max → プロバイダーの最大 reasoning（現在は Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- プロバイダーノート:
  - thinking メニューとピッカーはプロバイダープロファイル駆動です。プロバイダー Plugin は、binary の `on` のようなラベルを含め、選択されたモデルに対する正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするプロバイダー/モデルプロファイルに対してのみ提示されます。未サポートのレベルを指定したディレクティブは、そのモデルで有効なオプションとともに拒否されます。
  - 既存の保存済み未サポートレベルは、プロバイダープロファイルのランクによって再マップされます。`adaptive` は非 adaptive モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択されたモデルでサポートされる `off` 以外の最大レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルでは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は adaptive thinking をデフォルトにしません。その API effort のデフォルトは、明示的に思考レベルを設定しない限りプロバイダー側の管理のままです。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を adaptive thinking と `output_config.effort: "xhigh"` にマップします。これは `/think` が thinking ディレクティブであり、`xhigh` が Opus 4.7 の effort 設定であるためです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開しており、同じプロバイダー管理の max effort 経路にマップされます。
  - OpenAI GPT モデルは `/think` をモデル固有の Responses API effort サポート経由でマップします。`/think off` は、対象モデルがそれをサポートする場合にのみ `reasoning.effort: "none"` を送信します。そうでない場合、OpenClaw は未サポート値を送る代わりに、無効化された reasoning ペイロードを省略します。
  - Anthropic 互換ストリーミング経路上の MiniMax（`minimax/*`）は、モデル params または request params で明示的に thinking を設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax のネイティブではない Anthropic ストリーム形式から `reasoning_content` delta が漏れるのを防ぎます。
  - Z.AI（`zai/*`）は binary の thinking（`on`/`off`）のみをサポートします。`off` 以外の任意のレベルは `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` に、`off` 以外の任意のレベルを `thinking: { type: "enabled" }` にマップします。thinking が有効な場合、Moonshot は `tool_choice` として `auto|none` のみを受け付けるため、OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（設定内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定内の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能な場合はプロバイダー宣言のデフォルト、それ以外で reasoning 対応としてマークされた catalog モデルは `low`、それ以外は `off`。

## セッションデフォルトの設定

- **ディレクティブのみ** のメッセージを送信してください（空白は可）。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定されます（デフォルトでは送信者ごと）。`/think:off` またはセッションのアイドルリセットで解除されます。
- 確認返信が送られます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 現在の思考レベルを確認するには、引数なしで `/think`（または `/think:`）を送信してください。

## エージェントごとの適用

- **埋め込み Pi**: 解決されたレベルは、プロセス内の Pi エージェントランタイムに渡されます。

## Fast モード（`/fast`）

- レベル: `on|off`。
- ディレクティブのみのメッセージでセッションの fast-mode オーバーライドを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- 現在有効な fast-mode 状態を確認するには、モードなしで `/fast`（または `/fast status`）を送信してください。
- OpenClaw は fast mode を次の順序で解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッションオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast mode はサポートされる Responses リクエストで `service_tier=priority` を送信することで OpenAI の priority processing にマップされます。
- `openai-codex/*` では、fast mode は Codex Responses に対して同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証経路で1つの共有 `/fast` トグルを維持します。
- `api.anthropic.com` に送られる OAuth 認証トラフィックを含む、直接の公開 `anthropic/*` リクエストでは、fast mode は Anthropic service tiers にマップされます: `/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換経路の `minimax/*` では、`/fast on`（または `params.fastMode: true`）により `MiniMax-M2.7` は `MiniMax-M2.7-highspeed` に書き換えられます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデル params は、両方が設定されている場合に fast-mode デフォルトを上書きします。OpenClaw は、Anthropic 以外のプロキシ base URL に対しては Anthropic service-tier の注入を引き続きスキップします。

## Verbose ディレクティブ（`/verbose` または `/v`）

- レベル: `on`（minimal）| `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは、状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。解除するには、Sessions UI で `inherit` を選択してください。
- インラインディレクティブはそのメッセージにのみ影響し、それ以外ではセッション/グローバルデフォルトが適用されます。
- 現在の verbose レベルを確認するには、引数なしで `/verbose`（または `/verbose:`）を送信してください。
- verbose が有効な場合、構造化されたツール結果を出力するエージェント（Pi、その他の JSON エージェント）は、各ツール呼び出しを独立したメタデータ専用メッセージとして返し、利用可能なら `<emoji> <tool-name>: <arg>`（path/command）を接頭辞として付けます。これらのツール要約は、各ツールの開始時に送信されます（別バブルであり、ストリーミング delta ではありません）。
- ツール失敗の要約は通常モードでも表示されたままですが、生のエラー詳細の接尾辞は verbose が `on` または `full` の場合にのみ表示されます。
- verbose が `full` の場合、ツール出力も完了後に転送されます（別バブル、かつ安全な長さに切り詰められます）。実行中に `/verbose on|full|off` を切り替えると、その後のツールバブルは新しい設定に従います。

## Plugin trace ディレクティブ（`/trace`）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッションの Plugin trace 出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ影響し、それ以外ではセッション/グローバルデフォルトが適用されます。
- 現在の trace レベルを確認するには、引数なしで `/trace`（または `/trace:`）を送信してください。
- `/trace` は `/verbose` よりも狭い機能です。Active Memory のデバッグ要約のような、Plugin が所有する trace/debug 行のみを公開します。
- trace 行は `/status` に表示されたり、通常のアシスタント返信の後に追跡用診断メッセージとして表示されたりすることがあります。

## Reasoning の可視性（`/reasoning`）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージで、返信内に thinking ブロックを表示するかどうかを切り替えます。
- 有効時、reasoning は `Reasoning:` を接頭辞とする **別メッセージ** として送信されます。
- `stream`（Telegram のみ）: 返信生成中に Telegram のドラフトバブルへ reasoning をストリームし、その後 reasoning なしの最終回答を送信します。
- エイリアス: `/reason`。
- 現在の reasoning レベルを確認するには、引数なしで `/reasoning`（または `/reasoning:`）を送信してください。
- 解決順序: インラインディレクティブ、セッションオーバーライド、エージェントごとのデフォルト（`agents.list[].reasoningDefault`）、フォールバック（`off`）。

## 関連

- Elevated mode のドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat probe 本文は設定された heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、heartbeat からセッションデフォルトを変更するのは避けてください）。
- Heartbeat の配信はデフォルトで最終ペイロードのみです。別個の `Reasoning:` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web chat UI

- Web chat の thinking セレクターは、ページ読み込み時に受信セッションストア/設定からセッションに保存されたレベルを反映します。
- 別のレベルを選ぶと、`sessions.patch` を通じてセッションオーバーライドが即座に書き込まれます。次の送信までは待たず、単発の `thinkingOnce` オーバーライドでもありません。
- 最初のオプションは常に `Default (<resolved level>)` であり、この解決済みデフォルトはアクティブなセッションモデルのプロバイダー thinking プロファイルから取得されます。
- ピッカーは gateway セッション行から返される `thinkingOptions` を使用します。ブラウザー UI は独自のプロバイダー regex リストを保持せず、モデル固有のレベルセットは plugins が管理します。
- `/think:<level>` も引き続き動作し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期された状態を保ちます。

## プロバイダープロファイル

- プロバイダー Plugin は `resolveThinkingProfile(ctx)` を公開して、モデルでサポートされるレベルとデフォルトを定義できます。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることもできます。binary プロバイダーは `{ id: "low", label: "on" }` を使います。
- 公開済みの従来フック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして引き続き残りますが、新しいカスタムレベルセットには `resolveThinkingProfile` を使ってください。
- Gateway 行は `thinkingOptions` と `thinkingDefault` を公開するため、ACP/chat クライアントはランタイム検証で使われるものと同じプロファイルを描画できます。
