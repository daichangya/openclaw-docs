---
read_when:
    - 接続 / 認証の問題があり、ガイド付きの修正を行いたいとき
    - 更新後に健全性確認をしたいとき
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: doctor
x-i18n:
    generated_at: "2026-04-05T12:38:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェック + クイック修復です。

関連:

- トラブルシューティング: [Troubleshooting](/gateway/troubleshooting)
- セキュリティ監査: [Security](/gateway/security)

## 例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## オプション

- `--no-workspace-suggestions`: workspace のメモリ / 検索に関する提案を無効化
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: 推奨される修復をプロンプトなしで適用
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む、強力な修復を適用
- `--non-interactive`: プロンプトなしで実行; 安全な移行のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定
- `--deep`: 追加の gateway インストールを検出するためにシステムサービスをスキャン

注意:

- 対話型プロンプト（キーチェーン / OAuth 修復など）は、stdin が TTY であり、かつ `--non-interactive` が**設定されていない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- `--fix`（`--repair` のエイリアス）は、バックアップを `~/.openclaw/openclaw.json.bak` に書き出し、不明な config キーを削除して、各削除項目を一覧表示します。
- 状態整合性チェックは、現在 sessions ディレクトリ内の孤立した transcript ファイルを検出し、安全に容量を回収するためにそれらを `.deleted.<timestamp>` としてアーカイブできます。
- doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンしてレガシーな cron ジョブ形式を検出し、スケジューラーがランタイムで自動正規化する前にその場で書き換えることができます。
- doctor は、レガシーなフラット Talk 設定（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- 差分がオブジェクトキー順序だけの場合、`doctor --fix` の繰り返し実行では Talk 正規化を報告 / 適用しなくなりました。
- doctor にはメモリ検索準備状況チェックが含まれており、embedding 認証情報がない場合は `openclaw configure --section model` を推奨できます。
- sandbox mode が有効なのに Docker が利用できない場合、doctor は高シグナルな警告と修正方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を報告します。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 管理で、現在のコマンド経路から利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報は書き込みません。
- fix パスでチャネル SecretRef の検査に失敗しても、doctor は途中終了せず、警告を報告して続行します。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンド経路で解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その回の自動解決をスキップします。

## macOS: `launchctl` env 上書き

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行していた場合、その値は config ファイルを上書きし、継続的な「unauthorized」エラーの原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
