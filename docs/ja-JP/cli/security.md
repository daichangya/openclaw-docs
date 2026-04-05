---
read_when:
    - config/state に対して簡単なセキュリティ監査を実行したいとき
    - 安全な「修正」提案（権限、デフォルトの強化）を適用したいとき
summary: '`openclaw security` の CLI リファレンス（一般的なセキュリティ上の落とし穴を監査して修正）'
title: security
x-i18n:
    generated_at: "2026-04-05T12:39:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

セキュリティツール（監査 + 任意の修正）。

関連:

- セキュリティガイド: [Security](/gateway/security)

## 監査

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

この監査は、複数の DM 送信者が main session を共有している場合に警告し、**secure DM mode** を推奨します: `session.dmScope="per-channel-peer"`（マルチアカウントチャネルでは `per-account-channel-peer`）。
これは、協調利用または共有 inbox のハードニング向けです。相互に信頼していない、または敵対的な operator 間で 1 つの Gateway を共有する構成は推奨されません。別々の Gateway（または別々の OS ユーザー/ホスト）で信頼境界を分離してください。
また、config が共有ユーザー ingress の可能性を示唆する場合（たとえば open DM/group policy、設定済みグループターゲット、または wildcard 送信者ルール）は `security.trust_model.multi_user_heuristic` を出力し、OpenClaw のデフォルトが個人アシスタントの trust model であることを再通知します。
意図的に共有ユーザー構成を使う場合、監査ガイダンスでは、すべての session を sandbox 化し、filesystem アクセスを workspace スコープに保ち、個人/プライベートな identity や認証情報をその runtime から外しておくことを推奨します。
また、小さいモデル（`<=300B`）が sandbox なしで使われ、かつ web/browser ツールが有効な場合にも警告します。
webhook ingress については、`hooks.token` が Gateway token を使い回している場合、`hooks.token` が短い場合、`hooks.path="/"` の場合、`hooks.defaultSessionKey` が未設定の場合、`hooks.allowedAgentIds` が無制限の場合、リクエスト `sessionKey` override が有効な場合、および override が有効なのに `hooks.allowedSessionKeyPrefixes` がない場合に警告します。
また、sandbox mode がオフなのに sandbox Docker 設定がある場合、`gateway.nodes.denyCommands` に効果のないパターン風/未知のエントリがある場合（ノードコマンド名の完全一致のみで、shell テキストフィルタではありません）、`gateway.nodes.allowCommands` が危険なノードコマンドを明示的に有効化している場合、グローバル `tools.profile="minimal"` が agent tool profile で上書きされている場合、open groups が sandbox/workspace ガードなしで runtime/filesystem ツールを公開している場合、およびインストール済み extension plugin ツールが緩い tool policy で到達可能な場合にも警告します。
さらに、`gateway.allowRealIpFallback=true`（proxy 設定ミス時の header spoofing リスク）と `discovery.mdns.mode="full"`（mDNS TXT record によるメタデータ漏えい）も警告対象です。
また、sandbox browser が Docker `bridge` network を使っているのに `sandbox.browser.cdpSourceRange` がない場合にも警告します。
さらに、危険な sandbox Docker network mode（`host` や `container:*` namespace join を含む）も検出します。
また、既存の sandbox browser Docker container に hash label の欠落や古さがある場合（たとえば `openclaw.browserConfigEpoch` がない移行前 container）にも警告し、`openclaw sandbox recreate --browser --all` を推奨します。
さらに、npm ベースの plugin/hook install record がバージョン固定されていない、integrity metadata がない、または現在インストールされている package version とずれている場合にも警告します。
チャネル allowlist が安定した ID ではなく、変更可能な名前/メール/タグに依存している場合にも警告します（該当する場合の Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC スコープ）。
また、`gateway.auth.mode="none"` により、共有 secret なしで Gateway HTTP API（`/tools/invoke` と有効な任意の `/v1/*` endpoint）へ到達できる場合にも警告します。
`dangerous`/`dangerously` で始まる設定は、明示的な緊急回避用の operator override です。これらの 1 つを有効にしていること自体は、単独ではセキュリティ脆弱性報告にはなりません。
危険なパラメーターの完全な一覧については、[Security](/gateway/security) の「Insecure or dangerous flags summary」セクションを参照してください。

SecretRef の挙動:

- `security audit` は、対象パスに対してサポート対象の SecretRef を読み取り専用モードで解決します。
- 現在のコマンドパスで SecretRef が利用できない場合でも、監査は継続し、クラッシュする代わりに `secretDiagnostics` を報告します。
- `--token` と `--password` は、そのコマンド実行時の deep-probe 認証だけを上書きします。config や SecretRef mapping は書き換えません。

## JSON 出力

CI/policy チェックには `--json` を使ってください:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` と `--json` を組み合わせた場合、出力には修正アクションと最終レポートの両方が含まれます:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` で変更される内容

`--fix` は、安全で決定的な修正を適用します:

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替える（サポート対象チャネルの account variant を含む）
- WhatsApp の group policy が `allowlist` に切り替わるとき、保存済み `allowFrom` ファイルにその一覧があり、かつ config にまだ `allowFrom` が定義されていない場合は、そこから `groupAllowFrom` を初期投入する
- `logging.redactSensitive` を `"off"` から `"tools"` に設定する
- state/config と一般的な機密ファイルの権限を厳格化する
  （`credentials/*.json`、`auth-profiles.json`、`sessions.json`、session
  `*.jsonl`）
- `openclaw.json` から参照されている config include file も同様に厳格化する
- POSIX ホストでは `chmod`、Windows では `icacls` reset を使う

`--fix` では**変更しない**もの:

- token/password/API key のローテーション
- ツールの無効化（`gateway`、`cron`、`exec` など）
- gateway の bind/auth/network 公開設定の変更
- plugin/Skills の削除または書き換え
