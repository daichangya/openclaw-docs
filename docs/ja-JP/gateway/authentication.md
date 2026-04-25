---
read_when:
    - model 認証または OAuth の有効期限切れをデバッグする場合
    - 認証または資格情報保存を文書化する場合
summary: 'model 認証: OAuth、API キー、Claude CLI の再利用、Anthropic setup-token'
title: 認証
x-i18n:
    generated_at: "2026-04-25T13:46:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc8dbd0ccb9b167720a03f9e7486c1498d8d9eb500b8174e2a27ea0523285f70
    source_path: gateway/authentication.md
    workflow: 15
---

<Note>
このページは **model provider** の認証（API キー、OAuth、Claude CLI の再利用、Anthropic setup-token）を扱います。**gateway 接続**の認証（token、password、trusted-proxy）については、[Configuration](/ja-JP/gateway/configuration) と [Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照してください。
</Note>

OpenClaw は model provider 向けに OAuth と API キーをサポートしています。常時稼働の gateway
ホストでは、通常 API キーが最も予測しやすい選択肢です。subscription/OAuth
フローも、provider のアカウントモデルに合致する場合はサポートされます。

完全な OAuth フローと保存レイアウトについては [/concepts/oauth](/ja-JP/concepts/oauth) を参照してください。
SecretRef ベースの auth（`env`/`file`/`exec` provider）については、[Secrets Management](/ja-JP/gateway/secrets) を参照してください。
`models status --probe` で使われる資格情報の適格性/理由コードルールについては、
[Auth Credential Semantics](/ja-JP/auth-credential-semantics) を参照してください。

## 推奨セットアップ（API キー、任意の provider）

長期間稼働する gateway を運用する場合は、選択した
provider の API キーから始めてください。
特に Anthropic では、API キー認証が依然として最も予測しやすいサーバー
セットアップですが、OpenClaw は既存のローカル Claude CLI ログインの再利用もサポートしています。

1. provider のコンソールで API キーを作成します。
2. **gateway ホスト**（`openclaw gateway` を実行するマシン）に設定します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd の下で動作する場合は、
   daemon が読み取れるようにキーを `~/.openclaw/.env` に置くことを推奨します。

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後 daemon を再起動し（または Gateway プロセスを再起動し）、再確認します。

```bash
openclaw models status
openclaw doctor
```

環境変数を自分で管理したくない場合は、onboarding で
daemon 用の API キーを保存できます: `openclaw onboard`。

環境変数の継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）の詳細は [Help](/ja-JP/help) を参照してください。

## Anthropic: Claude CLI とトークン互換性

Anthropic setup-token auth は、引き続き OpenClaw でサポートされる token
経路として利用可能です。その後 Anthropic スタッフから、この OpenClaw スタイルの Claude CLI 利用は
再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合において Claude CLI の再利用と `claude -p` 利用を認可済みとして扱います。
ホストで Claude CLI の再利用が可能な場合、現在はそれが推奨経路です。

長期間稼働する gateway ホストでは、Anthropic API キーが依然として最も予測しやすい
セットアップです。同じホスト上の既存の Claude ログインを再利用したい場合は、
onboarding/configure の Anthropic Claude CLI 経路を使ってください。

Claude CLI 再利用の推奨ホストセットアップ:

```bash
# gateway ホストで実行
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

これは 2 段階のセットアップです。

1. gateway ホスト上で Claude Code 自体を Anthropic にログインさせます。
2. OpenClaw に、Anthropic model 選択をローカル `claude-cli`
   backend に切り替え、対応する OpenClaw auth profile を保存するよう指示します。

`claude` が `PATH` にない場合は、まず Claude Code をインストールするか、
`agents.defaults.cliBackends.claude-cli.command` を実際のバイナリパスに設定してください。

手動トークン入力（任意の provider。`auth-profiles.json` に書き込み + config を更新）:

```bash
openclaw models auth paste-token --provider openrouter
```

静的資格情報では auth profile ref もサポートされます。

- `api_key` 資格情報では `keyRef: { source, provider, id }` を使用可能
- `token` 資格情報では `tokenRef: { source, provider, id }` を使用可能
- OAuth モードの profile は SecretRef 資格情報をサポートしません。`auth.profiles.<id>.mode` が `"oauth"` に設定されている場合、その profile に対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。

自動化向けチェック（期限切れ/欠落なら終了コード `1`、期限切れ間近なら `2`）:

```bash
openclaw models status --check
```

ライブ auth プローブ:

```bash
openclaw models status --probe
```

注意:

- プローブ行は auth profile、env 資格情報、または `models.json` から取得されることがあります。
- 明示的な `auth.order.<provider>` に保存済み profile が含まれていない場合、プローブは
  その profile を試す代わりに `excluded_by_auth_order` として報告します。
- auth が存在していても、その provider に対するプローブ可能な model 候補を OpenClaw が解決できない場合、プローブは `status: no_model` を報告します。
- rate-limit のクールダウンは model 単位であることがあります。ある
  model でクールダウン中の profile でも、同じ provider 上の別の model では引き続き利用可能な場合があります。

任意の運用スクリプト（systemd/Termux）については以下で文書化されています:
[Auth monitoring scripts](/ja-JP/help/scripts#auth-monitoring-scripts)

## Anthropic に関する注意

Anthropic の `claude-cli` backend は再びサポートされています。

- Anthropic スタッフから、この OpenClaw 統合経路は再び許可されていると伝えられています。
- そのため OpenClaw は、Anthropic が新しいポリシーを公開しない限り、
  Anthropic をバックエンドとする実行において Claude CLI の再利用と `claude -p` 利用を認可済みとして扱います。
- Anthropic API キーは、長期間稼働する gateway
  ホストと明示的なサーバー側課金制御のために、依然として最も予測しやすい選択肢です。

## model auth 状態を確認する

```bash
openclaw models status
openclaw doctor
```

## API キーローテーション動作（gateway）

一部の provider は、API 呼び出しが provider の rate limit に達したときに、
別のキーでリクエストを再試行することをサポートしています。

- 優先順:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google provider では追加のフォールバックとして `GOOGLE_API_KEY` も含まれます。
- 同一キー一覧は利用前に重複排除されます。
- OpenClaw は、rate-limit エラーに対してのみ次のキーで再試行します（例:
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）。
- rate-limit 以外のエラーでは代替キーによる再試行は行われません。
- すべてのキーが失敗した場合は、最後の試行の最終エラーが返されます。

## どの資格情報を使うかを制御する

### セッションごと（チャットコマンド）

現在のセッションで特定の provider 資格情報を固定するには `/model <alias-or-id>@<profileId>` を使います（profile id の例: `anthropic:default`、`anthropic:work`）。

コンパクトな picker には `/model`（または `/model list`）を使い、完全表示には `/model status` を使ってください（候補 + 次の auth profile、および設定されている場合は provider endpoint 詳細も表示）。

### agent ごと（CLI 上書き）

agent に対する明示的な auth profile 順序上書きを設定します（その agent の `auth-state.json` に保存されます）。

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定の agent を対象にするには `--agent <id>` を使います。省略すると設定済みのデフォルト agent が使われます。
順序の問題をデバッグする際、`openclaw models status --probe` は省略された
保存済み profile を黙ってスキップするのではなく `excluded_by_auth_order` として表示します。
クールダウンの問題をデバッグする際は、rate-limit クールダウンが provider profile 全体ではなく、
1 つの model id に紐付いていることがある点に注意してください。

## トラブルシューティング

### 「No credentials found」

Anthropic profile がない場合は、**gateway ホスト**に Anthropic API キーを設定するか、
Anthropic setup-token 経路をセットアップしてから、再確認してください。

```bash
openclaw models status
```

### トークンが期限切れ/期限切れ間近

どの profile が期限切れになりつつあるかを確認するには `openclaw models status` を実行してください。Anthropic の
token profile がない、または期限切れの場合は、
setup-token でそのセットアップを更新するか、Anthropic API キーへ移行してください。

## 関連

- [Secrets management](/ja-JP/gateway/secrets)
- [Remote access](/ja-JP/gateway/remote)
- [Auth storage](/ja-JP/concepts/oauth)
