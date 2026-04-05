---
read_when:
    - プロバイダーの使用量/クォータ表示を組み込んでいる
    - 使用量追跡の動作や認証要件を説明する必要がある
summary: 使用量追跡の表示箇所と認証情報の要件
title: Usage Tracking
x-i18n:
    generated_at: "2026-04-05T12:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Usage tracking

## 概要

- プロバイダーの使用量/クォータを、それぞれの使用量エンドポイントから直接取得します。
- 推定コストは使用せず、プロバイダーが報告するウィンドウのみを使用します。
- 人間向けのステータス出力は、上流APIが消費済みクォータ、残量クォータ、または生のカウントのみを返す場合でも、`X% left` に正規化されます。
- セッションレベルの `/status` と `session_status` は、ライブのセッションスナップショットの情報が少ない場合、最新のトランスクリプト使用量エントリーへフォールバックできます。このフォールバックは不足しているtoken/cacheカウンターを補い、アクティブなランタイムmodelラベルを復元でき、セッションメタデータがない場合またはそれより小さい場合には、より大きいプロンプト指向の合計を優先します。既存のゼロでないライブ値は引き続き優先されます。

## 表示される場所

- チャット内の `/status`: セッショントークン + 推定コスト（API keyのみ）を含む絵文字付きステータスカード。プロバイダー使用量は、利用可能な場合、**現在のモデルプロバイダー**について正規化された `X% left` ウィンドウとして表示されます。
- チャット内の `/usage off|tokens|full`: 返信ごとの使用量フッター（OAuthではtokensのみ表示）。
- チャット内の `/usage cost`: OpenClawのセッションログから集計したローカルのコスト概要。
- CLI: `openclaw status --usage` はプロバイダーごとの完全な内訳を表示します。
- CLI: `openclaw channels list` は、同じ使用量スナップショットをプロバイダー設定と並べて表示します（スキップするには `--no-usage` を使用）。
- macOSメニューバー: Context配下の「Usage」セクション（利用可能な場合のみ）。

## プロバイダー + 認証情報

- **Anthropic (Claude)**: auth profile内のOAuthトークン。
- **GitHub Copilot**: auth profile内のOAuthトークン。
- **Gemini CLI**: auth profile内のOAuthトークン。
  - JSON使用量は `stats` にフォールバックします。`stats.cached` は `cacheRead` に正規化されます。
- **OpenAI Codex**: auth profile内のOAuthトークン（存在する場合はaccountIdを使用）。
- **MiniMax**: API keyまたはMiniMax OAuth auth profile。OpenClawは
  `minimax`、`minimax-cn`、`minimax-portal` を同じMiniMaxクォータ表示として扱い、保存済みのMiniMax OAuthが存在する場合はそれを優先し、そうでなければ
  `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、または `MINIMAX_API_KEY` にフォールバックします。
  MiniMaxの生の `usage_percent` / `usagePercent` フィールドは**残量**クォータを意味するため、OpenClawは表示前にそれらを反転します。カウントベースのフィールドが存在する場合はそちらが優先されます。
  - coding-planのウィンドウラベルは、存在する場合はプロバイダーのhours/minutesフィールドから取得し、その後、`start_time` / `end_time` の範囲にフォールバックします。
  - coding-planエンドポイントが `model_remains` を返す場合、OpenClawはchat-modelエントリーを優先し、明示的な `window_hours` / `window_minutes` フィールドがないときはタイムスタンプからウィンドウラベルを導出し、プランラベルにmodel名を含めます。
- **Xiaomi MiMo**: env/config/auth store経由のAPI key（`XIAOMI_API_KEY`）。
- **z.ai**: env/config/auth store経由のAPI key。

利用可能なプロバイダー使用量認証を解決できない場合、使用量は非表示になります。プロバイダーはプラグイン固有の使用量認証ロジックを提供できます。そうでない場合、OpenClawはauth profile、環境変数、またはconfigから一致するOAuth/API-key認証情報へフォールバックします。
