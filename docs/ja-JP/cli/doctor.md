---
read_when:
    - 接続/認証の問題があり、ガイド付きの修正を行いたい場合
    - 更新後に正常性チェックを行いたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:44:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e185d17d91d1677d0b16152d022b633d012d22d484bd9961820b200d5c4ce5
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

gateway とチャネルのヘルスチェック + クイック修復。

関連:

- トラブルシューティング: [トラブルシューティング](/ja-JP/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/ja-JP/gateway/security)

## 例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## オプション

- `--no-workspace-suggestions`: ワークスペースのメモリ/検索候補を無効化
- `--yes`: プロンプトなしでデフォルトを受け入れる
- `--repair`: プロンプトなしで推奨修復を適用
- `--fix`: `--repair` のエイリアス
- `--force`: 必要に応じてカスタムサービス設定の上書きを含む積極的な修復を適用
- `--non-interactive`: プロンプトなしで実行。安全な移行のみ
- `--generate-gateway-token`: gateway トークンを生成して設定
- `--deep`: 追加の gateway インストールをシステムサービスからスキャン

注意:

- 対話型プロンプト（キーチェーン/OAuth 修正など）は、stdin が TTY で、かつ `--non-interactive` が**設定されていない**場合にのみ実行されます。ヘッドレス実行（cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、積極的な Plugin 読み込みをスキップします。対話型セッションでは、チェックに必要な場合は引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` のエイリアス）はバックアップを `~/.openclaw/openclaw.json.bak` に書き込み、未知の config キーを削除し、削除した各項目を一覧表示します。
- 状態整合性チェックでは、sessions ディレクトリ内の孤立した transcript ファイルを検出できるようになり、安全に領域を回収するためにそれらを `.deleted.<timestamp>` としてアーカイブできます。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンして旧形式の cron ジョブ構造を検出し、スケジューラが実行時に自動正規化する前にその場で書き換えることができます。
- Doctor は、パッケージ化されたグローバルインストールへ書き込まずに、欠落しているバンドル済み Plugin ランタイム依存関係を修復します。root 所有の npm インストールまたは hardened systemd unit の場合は、`OPENCLAW_PLUGIN_STAGE_DIR` を `/var/lib/openclaw/plugin-runtime-deps` のような書き込み可能ディレクトリに設定してください。
- Doctor は旧来のフラットな Talk config（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- 差分がオブジェクトキー順だけの場合、`doctor --fix` の繰り返し実行では Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状態チェックが含まれ、埋め込み資格情報が不足している場合は `openclaw configure --section model` を推奨できます。
- sandbox mode が有効なのに Docker が利用できない場合、doctor は対処方法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）付きの重要な警告を報告します。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 管理で、現在のコマンド経路で利用できない場合、doctor は読み取り専用の警告を報告し、プレーンテキストのフォールバック資格情報は書き込みません。
- チャネル SecretRef の検査が修復経路で失敗した場合、doctor は途中終了せず続行し、代わりに警告を報告します。
- Telegram `allowFrom` ユーザー名の自動解決（`doctor --fix`）には、現在のコマンド経路で解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その実行では自動解決をスキップします。

## macOS: `launchctl` 環境変数オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行している場合、その値が config ファイルを上書きし、継続的な「unauthorized」エラーの原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
