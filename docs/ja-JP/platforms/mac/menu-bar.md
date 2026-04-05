---
read_when:
    - Mac のメニュー UI やステータスロジックを調整している
summary: メニューバーのステータスロジックと、ユーザーに表示される内容
title: メニューバー
x-i18n:
    generated_at: "2026-04-05T12:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# メニューバーのステータスロジック

## 表示されるもの

- 現在のエージェントの作業状態を、メニューバーアイコンとメニューの最初のステータス行に表示します。
- 作業中は正常性ステータスは非表示になり、すべてのセッションがアイドルになると再表示されます。
- メニュー内の「Nodes」ブロックには、**デバイス**のみが一覧表示されます（`node.list` による paired nodes）。client / presence エントリーは表示されません。
- プロバイダー使用状況のスナップショットが利用可能な場合、Context の下に「Usage」セクションが表示されます。

## 状態モデル

- セッション: イベントは `runId`（実行ごと）と、payload 内の `sessionKey` とともに到着します。「main」セッションはキー `main` です。存在しない場合は、最後に更新されたセッションにフォールバックします。
- 優先順位: 常に main が優先されます。main がアクティブなら、その状態が即座に表示されます。main がアイドルなら、最後にアクティブだった非 main セッションが表示されます。アクティビティの途中で行ったり来たりはしません。現在のセッションがアイドルになるか、main がアクティブになったときにのみ切り替えます。
- アクティビティ種別:
  - `job`: 高レベルのコマンド実行（`state: started|streaming|done|error`）。
  - `tool`: `phase: start|result` と `toolName` および `meta/args`。

## IconState enum（Swift）

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`（デバッグ用上書き）

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- デフォルト → 🛠️

### 視覚的マッピング

- `idle`: 通常のクリッター。
- `workingMain`: glyph 付きバッジ、フル tint、脚の「作業中」アニメーション。
- `workingOther`: glyph 付きバッジ、抑えた tint、スカリーなし。
- `overridden`: アクティビティに関係なく、選択された glyph / tint を使います。

## ステータス行テキスト（メニュー）

- 作業中: `<Session role> · <activity label>`
  - 例: `Main · exec: pnpm test`、`Other · read: apps/macos/Sources/OpenClaw/AppState.swift`。
- アイドル時: 正常性サマリーにフォールバックします。

## イベント取り込み

- ソース: control-channel の `agent` イベント（`ControlChannel.handleAgentEvent`）。
- 解析されるフィールド:
  - `stream: "job"` と `data.state` による開始 / 停止。
  - `stream: "tool"` と `data.phase`、`name`、任意の `meta` / `args`。
- ラベル:
  - `exec`: `args.command` の最初の行。
  - `read` / `write`: 短縮されたパス。
  - `edit`: パスに加え、`meta` / diff 件数から推測した変更種別。
  - フォールバック: tool 名。

## デバッグ用上書き

- Settings ▸ Debug ▸ 「Icon override」ピッカー:
  - `System (auto)`（デフォルト）
  - `Working: main`（tool 種別ごと）
  - `Working: other`（tool 種別ごと）
  - `Idle`
- `@AppStorage("iconOverride")` を通じて保存され、`IconState.overridden` にマッピングされます。

## テストチェックリスト

- main セッションの job を発火させる: アイコンが即座に切り替わり、ステータス行に main ラベルが表示されることを確認する。
- main がアイドル中に非 main セッションの job を発火させる: アイコン / ステータスに非 main が表示され、完了するまで安定していることを確認する。
- 他がアクティブ中に main を開始する: アイコンが即座に main に切り替わることを確認する。
- 高速な tool バースト: バッジが点滅しないことを確認する（tool result に TTL の猶予あり）。
- すべてのセッションがアイドルになると正常性行が再表示されることを確認する。
