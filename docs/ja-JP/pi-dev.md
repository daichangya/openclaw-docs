---
read_when:
    - Pi 統合コードやテストに取り組む場合
    - Pi 固有の lint、typecheck、ライブテストフローを実行する場合
summary: 'Pi 統合向け開発ワークフロー: ビルド、テスト、ライブ検証'
title: Pi Development Workflow
x-i18n:
    generated_at: "2026-04-05T12:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Pi Development Workflow

このガイドでは、OpenClaw で pi 統合に取り組むための妥当なワークフローをまとめています。

## 型チェックと lint

- デフォルトのローカルゲート: `pnpm check`
- ビルドゲート: 変更がビルド出力、パッケージング、または lazy-loading/module 境界に影響し得る場合は `pnpm build`
- Pi 変更が大きい場合の完全な着地ゲート: `pnpm check && pnpm test`

## Pi テストの実行

Pi に焦点を当てたテストセットを Vitest で直接実行します:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

ライブプロバイダー検証も含めるには:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

これにより、主要な Pi ユニットスイートがカバーされます:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手動テスト

推奨フロー:

- dev mode で Gateway を実行:
  - `pnpm gateway:dev`
- エージェントを直接トリガー:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 対話型デバッグには TUI を使用:
  - `pnpm tui`

ツール呼び出しの挙動については、`read` または `exec` アクションを行うよう促すと、ツールストリーミングとペイロード処理を確認できます。

## クリーンスレートリセット

状態は OpenClaw の state directory の下にあります。デフォルトは `~/.openclaw` です。`OPENCLAW_STATE_DIR` が設定されている場合は、代わりにそのディレクトリを使います。

すべてをリセットするには、次を対象にします:

- 設定用の `openclaw.json`
- モデル認証プロファイル（API キー + OAuth）用の `agents/<agentId>/agent/auth-profiles.json`
- 認証プロファイルストア外にまだあるプロバイダー/チャネル状態用の `credentials/`
- エージェントセッション履歴用の `agents/<agentId>/sessions/`
- セッションインデックス用の `agents/<agentId>/sessions/sessions.json`
- レガシーパスが存在する場合の `sessions/`
- 空のワークスペースにしたい場合の `workspace/`

セッションだけをリセットしたい場合は、そのエージェントの `agents/<agentId>/sessions/` を削除します。認証を保持したい場合は、`agents/<agentId>/agent/auth-profiles.json` と、`credentials/` 配下のプロバイダー状態をそのまま残してください。

## 参照

- [Testing](/help/testing)
- [はじめに](/ja-JP/start/getting-started)
