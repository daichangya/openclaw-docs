---
read_when:
    - 完全なエージェントターンを実行せずにツールを呼び出す場合
    - ツールポリシーの強制が必要な自動化を構築する場合
summary: Gateway HTTP エンドポイント経由で単一のツールを直接呼び出す
title: Tools Invoke API
x-i18n:
    generated_at: "2026-04-05T12:45:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

OpenClaw の Gateway は、単一のツールを直接呼び出すためのシンプルな HTTP エンドポイントを公開しています。これは常に有効で、Gateway 認証とツールポリシーを使用します。OpenAI 互換の `/v1/*` サーフェスと同様に、shared-secret bearer 認証は Gateway 全体に対する信頼済みオペレーターアクセスとして扱われます。

- `POST /tools/invoke`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/tools/invoke`

デフォルトの最大ペイロードサイズは 2 MB です。

## 認証

Gateway の認証設定を使用します。

一般的な HTTP 認証パス:

- shared-secret 認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- trusted identity-bearing HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの identity-aware proxy を経由してルーティングし、必要な
  identity ヘッダーをその proxy に注入させます
- private-ingress open 認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注意:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは
  設定済みの非 loopback trusted proxy ソースから来る必要があります。同一ホストの loopback proxy では
  このモードを満たしません。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きの `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全なオペレーターアクセス**のサーフェスとして扱ってください。

- ここでの HTTP bearer 認証は、狭い per-user スコープモデルではありません。
- このエンドポイント用の有効な Gateway token/password は、所有者/オペレーター認証情報として扱う必要があります。
- shared-secret 認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全なオペレーターデフォルトを復元します。
- shared-secret 認証では、このエンドポイントでの直接ツール呼び出しも owner-sender ターンとして扱います。
- trusted identity-bearing HTTP モード（たとえば trusted proxy auth や private ingress 上の `gateway.auth.mode="none"`）では、`x-openclaw-scopes` がある場合はそれを尊重し、ない場合は通常のオペレーターデフォルトスコープセットにフォールバックします。
- このエンドポイントは loopback/tailnet/private ingress のみに置き、パブリックインターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイントでの直接ツール呼び出しを owner-sender ターンとして扱います
- trusted identity-bearing HTTP モード（たとえば trusted proxy auth、または private ingress 上の `gateway.auth.mode="none"`）
  - 何らかの外側の信頼済み identity またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、かつ `operator.admin` を省略した場合にのみ owner セマンティクスを失います

## リクエストボディ

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

フィールド:

- `tool`（文字列、必須）: 呼び出すツール名。
- `action`（文字列、任意）: ツールスキーマが `action` をサポートし、args ペイロードでそれが省略されている場合、args にマッピングされます。
- `args`（オブジェクト、任意）: ツール固有の引数。
- `sessionKey`（文字列、任意）: 対象セッションキー。省略された場合、または `"main"` の場合、Gateway は設定済みのメインセッションキーを使用します（`session.mainKey` とデフォルトエージェント、または global scope の `global` を尊重）。
- `dryRun`（真偽値、任意）: 将来用に予約されています。現在は無視されます。

## ポリシー + ルーティング動作

ツールの可用性は、Gateway エージェントで使われるのと同じポリシーチェーンを通してフィルタリングされます:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループポリシー（セッションキーがグループまたはチャネルにマップされる場合）
- subagent policy（subagent セッションキーで呼び出す場合）

ツールがポリシーで許可されていない場合、エンドポイントは **404** を返します。

重要な境界に関する注意:

- Exec approvals は、この HTTP エンドポイントに対する別個の認可境界ではなく、オペレーター向けガードレールです。Gateway 認証 + ツールポリシーによりここからツールへ到達可能であれば、`/tools/invoke` では呼び出しごとの追加承認プロンプトは出しません。
- 信頼できない呼び出し元と Gateway bearer 認証情報を共有しないでください。信頼境界をまたぐ分離が必要なら、別の Gateway を実行してください（理想的には別の OS ユーザー/ホストも使ってください）。

Gateway HTTP では、セッションポリシーがツールを許可していても、デフォルトでハード deny リストも適用されます:

- `exec` — 直接コマンド実行（RCE サーフェス）
- `spawn` — 任意の子プロセス作成（RCE サーフェス）
- `shell` — シェルコマンド実行（RCE サーフェス）
- `fs_write` — ホスト上の任意ファイル変更
- `fs_delete` — ホスト上の任意ファイル削除
- `fs_move` — ホスト上の任意ファイル移動/リネーム
- `apply_patch` — パッチ適用は任意ファイルを書き換え可能
- `sessions_spawn` — セッションオーケストレーション。リモートでエージェントを spawn することは RCE です
- `sessions_send` — セッション間メッセージ注入
- `cron` — 永続的オートメーション制御プレーン
- `gateway` — Gateway 制御プレーン。HTTP 経由での再設定を防ぎます
- `nodes` — ノードコマンドリレーはペアリングされたホスト上の system.run に到達可能です
- `whatsapp_login` — 端末での QR スキャンが必要な対話型セットアップであり、HTTP ではハングします

この deny リストは `gateway.tools` でカスタマイズできます:

```json5
{
  gateway: {
    tools: {
      // HTTP /tools/invoke 経由でブロックする追加ツール
      deny: ["browser"],
      // デフォルト deny リストからツールを除外
      allow: ["gateway"],
    },
  },
}
```

グループポリシーがコンテキストを解決しやすくするために、任意で次を設定できます:

- `x-openclaw-message-channel: <channel>`（例: `slack`, `telegram`）
- `x-openclaw-account-id: <accountId>`（複数アカウントが存在する場合）

## レスポンス

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（無効なリクエストまたはツール入力エラー）
- `401` → 未認証
- `429` → 認証レート制限中（`Retry-After` 付き）
- `404` → ツールは利用不可（見つからない、または allowlist にない）
- `405` → 許可されていないメソッド
- `500` → `{ ok: false, error: { type, message } }`（予期しないツール実行エラー。メッセージはサニタイズ済み）

## 例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
