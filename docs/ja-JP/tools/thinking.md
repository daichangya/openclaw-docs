---
read_when:
    - thinking、fast-mode、または verbose ディレクティブの解析やデフォルトを調整しているとき
summary: /think、/fast、/verbose、および推論表示のためのディレクティブ構文
title: Thinking Levels
x-i18n:
    generated_at: "2026-04-05T13:01:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking Levels（`/think` ディレクティブ）

## 何をするか

- 任意の受信本文で使えるインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大バジェット）
  - xhigh → 「ultrathink+」（GPT-5.2 + Codex モデルのみ）
  - adaptive → プロバイダー管理の適応型推論バジェット（Anthropic Claude 4.6 モデルファミリーでサポート）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされます。
  - `highest`、`max` は `high` にマップされます。
- プロバイダーに関する注記:
  - Anthropic Claude 4.6 モデルでは、明示的な thinking レベルが設定されていない場合、デフォルトは `adaptive` です。
  - Anthropic 互換のストリーミング経路における MiniMax（`minimax/*`）では、モデル params またはリクエスト params で明示的に thinking を設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax 独自の Anthropic 非ネイティブストリーム形式から `reasoning_content` delta が漏れるのを防ぎます。
  - Z.AI（`zai/*`）は二値の thinking（`on`/`off`）のみをサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` にマップされます）。
  - Moonshot（`moonshot/*`）では、`/think off` は `thinking: { type: "disabled" }` に、`off` 以外の任意のレベルは `thinking: { type: "enabled" }` にマップされます。thinking が有効なとき、Moonshot は `tool_choice` として `auto|none` しか受け付けないため、OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッション上書き（ディレクティブだけのメッセージを送信して設定）。
3. エージェントごとのデフォルト（config の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（config の `agents.defaults.thinkingDefault`）。
5. フォールバック: Anthropic Claude 4.6 モデルでは `adaptive`、その他の推論対応モデルでは `low`、それ以外では `off`。

## セッションデフォルトを設定する

- **ディレクティブのみ**のメッセージを送信します（空白は許可）。例: `/think:medium` または `/t high`。
- これは現在のセッションに適用されます（デフォルトでは送信者ごと）。`/think:off` またはセッションのアイドルリセットで解除されます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送信すると、現在の thinking レベルを確認できます。

## エージェントごとの適用

- **Embedded Pi**: 解決されたレベルは、インプロセスの Pi エージェントランタイムに渡されます。

## Fast mode（`/fast`）

- レベル: `on|off`。
- ディレクティブのみのメッセージでセッションの fast-mode 上書きを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- モードなしで `/fast`（または `/fast status`）を送信すると、現在有効な fast-mode 状態を確認できます。
- OpenClaw は次の順序で fast mode を解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッション上書き
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast mode は、サポートされる Responses リクエストに `service_tier=priority` を送信することで OpenAI の priority processing にマップされます。
- `openai-codex/*` では、fast mode は Codex Responses に同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証経路で1つの共有 `/fast` トグルを維持します。
- `api.anthropic.com` に送られる OAuth 認証トラフィックを含む、直接の公開 `anthropic/*` リクエストでは、fast mode は Anthropic の service tiers にマップされます: `/fast on` は `service_tier=auto`、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換経路の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデル params は、両方が設定されている場合、fast-mode デフォルトを上書きします。OpenClaw は、Anthropic 以外のプロキシ base URL に対しては引き続き Anthropic service-tier の注入をスキップします。

## Verbose ディレクティブ（`/verbose` または `/v`）

- レベル: `on`（最小） | `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変えずにヒントを返します。
- `/verbose off` は明示的なセッション上書きを保存します。Sessions UI で `inherit` を選ぶと解除できます。
- インラインディレクティブはそのメッセージにのみ適用されます。それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送信すると、現在の verbose レベルを確認できます。
- verbose が on の場合、構造化ツール結果を出力するエージェント（Pi、その他の JSON エージェント）は、各ツール呼び出しをそれぞれ独立したメタデータ専用メッセージとして返し、利用可能であれば `<emoji> <tool-name>: <arg>`（path/command）を先頭に付けます。これらのツール要約は、各ツール開始時にすぐ送信されます（別々のバブルとして表示され、ストリーミング delta ではありません）。
- ツール失敗の要約は通常モードでも表示されたままですが、生のエラー詳細の接尾辞は verbose が `on` または `full` のときにのみ表示されます。
- verbose が `full` のときは、ツール出力も完了後に転送されます（別バブル、長さは安全な範囲で切り詰め）。実行中に `/verbose on|full|off` を切り替えると、それ以降のツールバブルは新しい設定に従います。

## 推論表示（`/reasoning`）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージで、返信内に thinking ブロックを表示するかどうかを切り替えます。
- 有効な場合、推論は `Reasoning:` を先頭に付けた**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信生成中に推論を Telegram の draft bubble にストリーミングし、その後最終回答は推論なしで送信します。
- エイリアス: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送信すると、現在の reasoning レベルを確認できます。
- 解決順序: インラインディレクティブ、次にセッション上書き、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、最後にフォールバック（`off`）。

## 関連

- Elevated mode のドキュメントは [Elevated mode](/tools/elevated) にあります。

## ハートビート

- Heartbeat probe 本文は設定された heartbeat prompt です（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat メッセージ内のインラインディレクティブも通常どおり適用されます（ただし、heartbeat からセッションデフォルトを変更するのは避けてください）。
- Heartbeat 配信はデフォルトで最終ペイロードのみです。別個の `Reasoning:` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web chat UI

- Web chat の thinking セレクターは、ページ読み込み時に inbound session store/config に保存されているセッションレベルを反映します。
- 別のレベルを選ぶと、`sessions.patch` を通じてセッション上書きが即座に書き込まれます。次の送信までは待たず、また一回限りの `thinkingOnce` 上書きでもありません。
- 最初の選択肢は常に `Default (<resolved level>)` で、この解決済みデフォルトはアクティブなセッションモデルに由来します: Anthropic/Bedrock 上の Claude 4.6 では `adaptive`、その他の推論対応モデルでは `low`、それ以外では `off`。
- ピッカーは引き続きプロバイダーを認識します:
  - ほとんどのプロバイダーでは `off | minimal | low | medium | high | adaptive` を表示
  - Z.AI では二値の `off | on` を表示
- `/think:<level>` も引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期されたままです。
