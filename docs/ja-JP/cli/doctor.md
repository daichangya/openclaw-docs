---
read_when:
    - 接続または認証の問題があり、ガイド付きの修正を求めている場合
    - 更新後に簡易確認を行いたい場合
summary: '`openclaw doctor` の CLI リファレンス（ヘルスチェック + ガイド付き修復）'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Gateway とチャネルのヘルスチェック + クイック修復。

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
- `--repair`: プロンプトなしで推奨される修復を適用
- `--fix`: `--repair` の別名
- `--force`: 必要に応じてカスタムサービス config の上書きを含む強力な修復を適用
- `--non-interactive`: プロンプトなしで実行。安全な移行のみ
- `--generate-gateway-token`: Gateway トークンを生成して設定
- `--deep`: 追加の Gateway インストールをシステムサービスからスキャン

注記:

- 対話型プロンプト（キーチェーン/OAuth 修復など）は、stdin が TTY であり、かつ `--non-interactive` が**設定されていない**場合にのみ実行されます。ヘッドレス実行（Cron、Telegram、ターミナルなし）ではプロンプトはスキップされます。
- パフォーマンス: 非対話型の `doctor` 実行では、ヘッドレスのヘルスチェックを高速に保つため、先行的な Plugin 読み込みをスキップします。対話型セッションでは、チェックに Plugin の寄与が必要な場合に限り、引き続き Plugin を完全に読み込みます。
- `--fix`（`--repair` の別名）は `~/.openclaw/openclaw.json.bak` にバックアップを書き込み、未知の config キーを削除し、削除ごとに一覧表示します。
- 状態整合性チェックでは、セッションディレクトリ内の孤立した transcript ファイルを検出し、安全に容量を回収するため `.deleted.<timestamp>` としてアーカイブできます。
- Doctor は `~/.openclaw/cron/jobs.json`（または `cron.store`）もスキャンしてレガシーな Cron ジョブ形式を検出し、スケジューラがランタイムで自動正規化する前にその場で書き換えることができます。
- Doctor は、パッケージ化されたグローバルインストールへ書き込まずに、欠落しているバンドル済み Plugin ランタイム依存関係を修復します。root 所有の npm インストールまたは強化された systemd ユニットでは、`/var/lib/openclaw/plugin-runtime-deps` のような書き込み可能ディレクトリに `OPENCLAW_PLUGIN_STAGE_DIR` を設定してください。
- 別の supervisor が Gateway のライフサイクルを管理している場合は、`OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。Doctor は引き続き Gateway/サービスのヘルスを報告し、サービス以外の修復を適用しますが、サービスのインストール/起動/再起動/ブートストラップおよびレガシーサービスのクリーンアップはスキップします。
- Doctor は、レガシーなフラット Talk config（`talk.voiceId`、`talk.modelId` など）を `talk.provider` + `talk.providers.<provider>` に自動移行します。
- 差分がオブジェクトキー順序だけの場合、`doctor --fix` の繰り返し実行では Talk 正規化を報告/適用しなくなりました。
- Doctor にはメモリ検索の準備状態チェックが含まれており、埋め込み認証情報が不足している場合は `openclaw configure --section model` を推奨できます。
- サンドボックスモードが有効なのに Docker が利用できない場合、doctor は高シグナルな警告と対処法（`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`）を報告します。
- `gateway.auth.token`/`gateway.auth.password` が SecretRef 管理で、現在のコマンドパスから利用できない場合、doctor は読み取り専用の警告を報告し、平文のフォールバック認証情報は書き込みません。
- 修復パスでチャネル SecretRef の検査に失敗した場合、doctor は途中終了せず続行し、代わりに警告を報告します。
- Telegram の `allowFrom` ユーザー名自動解決（`doctor --fix`）には、現在のコマンドパスで解決可能な Telegram トークンが必要です。トークン検査が利用できない場合、doctor は警告を報告し、その回の自動解決をスキップします。

## macOS: `launchctl` 環境変数オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（または `...PASSWORD`）を実行している場合、その値が config ファイルを上書きし、持続的な「unauthorized」エラーの原因になることがあります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway doctor](/ja-JP/gateway/doctor)
