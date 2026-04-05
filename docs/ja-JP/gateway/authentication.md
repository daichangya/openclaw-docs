---
read_when:
    - モデル認証や OAuth の期限切れをデバッグする場合
    - 認証または認証情報ストレージを文書化する場合
summary: 'モデル認証: OAuth、APIキー、Claude CLI の再利用'
title: Authentication
x-i18n:
    generated_at: "2026-04-05T12:43:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentication (Model Providers)

<Note>
このページでは、**モデルプロバイダー**の認証（API キー、OAuth、Claude CLI の再利用）を扱います。**Gateway 接続**の認証（トークン、パスワード、trusted-proxy）については、[Configuration](/gateway/configuration) と [Trusted Proxy Auth](/gateway/trusted-proxy-auth) を参照してください。
</Note>

OpenClaw は、モデルプロバイダー向けに OAuth と API キーをサポートしています。常時稼働する Gateway
ホストでは、通常、API キーがもっとも予測しやすい選択肢です。サブスクリプション/OAuth
フローも、プロバイダーのアカウントモデルに合っていればサポートされます。

完全な OAuth フローとストレージ
レイアウトについては、[/concepts/oauth](/concepts/oauth) を参照してください。
SecretRef ベースの認証（`env`/`file`/`exec` プロバイダー）については、[Secrets Management](/gateway/secrets) を参照してください。
`models status --probe` で使用される認証情報の適格性/理由コードのルールについては、
[Auth Credential Semantics](/ja-JP/auth-credential-semantics) を参照してください。

## 推奨セットアップ（API キー、任意のプロバイダー）

長期間動作する Gateway を実行している場合は、選択した
プロバイダーの API キーから始めてください。
Anthropic については特に、API キー認証が安全な経路です。Claude CLI の再利用は、
サポートされているもう 1 つのサブスクリプション型セットアップ経路です。

1. プロバイダーのコンソールで API キーを作成します。
2. それを **Gateway ホスト**（`openclaw gateway` を実行しているマシン）に配置します。

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway が systemd/launchd 配下で動作している場合は、デーモンが読み取れるように、
   キーを `~/.openclaw/.env` に置くことを推奨します:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

その後、デーモンを再起動する（または Gateway プロセスを再起動する）か、再確認します:

```bash
openclaw models status
openclaw doctor
```

env var を自分で管理したくない場合は、オンボーディングで
デーモン用の API キーを保存できます: `openclaw onboard`。

env の継承（`env.shellEnv`、
`~/.openclaw/.env`、systemd/launchd）の詳細は [Help](/help) を参照してください。

## Anthropic: レガシートークン互換性

Anthropic の setup-token 認証は、OpenClaw で
レガシー/手動経路として引き続き利用可能です。Anthropic の公開 Claude Code ドキュメントでは引き続き
Claude プラン下での Claude Code の端末直接利用が扱われていますが、Anthropic は別途
OpenClaw ユーザーに対し、**OpenClaw** の Claude ログイン経路はサードパーティ
ハーネス利用として扱われ、サブスクリプションとは別請求の **Extra Usage** が必要だと伝えています。

もっとも明確なセットアップ経路としては、Anthropic API キーを使うか、Gateway ホスト上の Claude CLI
へ移行してください。

手動トークン入力（任意のプロバイダー。`auth-profiles.json` に書き込み、設定も更新）:

```bash
openclaw models auth paste-token --provider openrouter
```

静的認証情報では認証プロファイル参照もサポートされます:

- `api_key` 認証情報では `keyRef: { source, provider, id }` を使用できます
- `token` 認証情報では `tokenRef: { source, provider, id }` を使用できます
- OAuth モードのプロファイルは SecretRef 認証情報をサポートしません。`auth.profiles.<id>.mode` が `"oauth"` に設定されている場合、そのプロファイルに対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。

自動化向けチェック（期限切れ/未設定なら終了コード `1`、期限切れ間近なら `2`）:

```bash
openclaw models status --check
```

実際の認証プローブ:

```bash
openclaw models status --probe
```

注意:

- プローブ行は、認証プロファイル、env 認証情報、または `models.json` から取得されることがあります。
- 明示的な `auth.order.<provider>` で保存済みプロファイルが省かれている場合、
  プローブはそのプロファイルを試す代わりに
  `excluded_by_auth_order` を報告します。
- 認証情報が存在しても、その
  プロバイダーに対してプローブ可能なモデル候補を OpenClaw が解決できない場合、プローブは `status: no_model` を報告します。
- レート制限クールダウンはモデル単位の場合があります。ある
  モデルでクールダウン中のプロファイルでも、同じプロバイダー上の兄弟モデルでは引き続き利用可能なことがあります。

オプションの運用スクリプト（systemd/Termux）は次に記載されています:
[Auth monitoring scripts](/help/scripts#auth-monitoring-scripts)

## Anthropic: Claude CLI への移行

Claude CLI がすでに Gateway ホストにインストールされ、そのホストでサインイン済みなら、
既存の Anthropic セットアップを CLI バックエンドに切り替えられます。これは、
そのホスト上のローカル Claude CLI ログインを再利用するための、サポートされた OpenClaw 移行経路です。

前提条件:

- Gateway ホストに `claude` がインストールされていること
- そのホストで Claude CLI が `claude auth login` によりすでにサインイン済みであること

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

これにより、ロールバック用に既存の Anthropic 認証プロファイルは保持されますが、
デフォルトのモデル選択は `claude-cli/...` に変更され、対応する Claude CLI の
許可リストエントリが `agents.defaults.models` に追加されます。

確認:

```bash
openclaw models status
```

オンボーディングのショートカット:

```bash
openclaw onboard --auth-choice anthropic-cli
```

対話型の `openclaw onboard` と `openclaw configure` では、Anthropic について引き続き Claude CLI
が優先されますが、Anthropic の setup-token は再び
レガシー/手動経路として利用可能であり、Extra Usage の課金前提で使う必要があります。

## モデル認証状態の確認

```bash
openclaw models status
openclaw doctor
```

## API キーローテーション動作（Gateway）

一部のプロバイダーでは、API 呼び出しがプロバイダーのレート制限に
達したとき、代替キーでリクエストを再試行できます。

- 優先順:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の上書き）
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google プロバイダーでは、追加のフォールバックとして `GOOGLE_API_KEY` も含まれます。
- 同一のキー一覧は、使用前に重複排除されます。
- OpenClaw は、レート制限エラーに対してのみ次のキーで再試行します（例:
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent
requests`、`ThrottlingException`、`concurrency limit reached`、または
  `workers_ai ... quota limit exceeded`）。
- レート制限以外のエラーでは、代替キーで再試行しません。
- すべてのキーが失敗した場合、最後の試行での最終エラーが返されます。

## どの認証情報を使うかを制御する

### セッションごと（チャットコマンド）

`/model <alias-or-id>@<profileId>` を使って、現在のセッションに特定のプロバイダー認証情報を固定します（プロファイル id の例: `anthropic:default`、`anthropic:work`）。

コンパクトなピッカーには `/model`（または `/model list`）を使い、完全表示には `/model status` を使います（候補 + 次の認証プロファイル。設定されている場合はプロバイダーエンドポイントの詳細も表示）。

### エージェントごと（CLI オーバーライド）

エージェントに明示的な認証プロファイル順序のオーバーライドを設定します（そのエージェントの `auth-profiles.json` に保存）:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

特定のエージェントを対象にするには `--agent <id>` を使います。省略すると、設定済みのデフォルトエージェントが使われます。
順序の問題をデバッグする際、`openclaw models status --probe` は、
省略された保存済みプロファイルを黙ってスキップするのではなく
`excluded_by_auth_order` として表示します。
クールダウンの問題をデバッグする際は、レート制限クールダウンが
プロバイダープロファイル全体ではなく 1 つのモデル id に紐づいていることがある点に注意してください。

## トラブルシューティング

### 「認証情報が見つかりません」

Anthropic プロファイルがない場合は、そのセットアップを **Gateway ホスト** 上の Claude CLI または API
キーに移行してから、再確認してください:

```bash
openclaw models status
```

### トークンの期限切れ/期限切れ間近

どのプロファイルが期限切れ間近かを確認するには `openclaw models status` を実行してください。レガシーの
Anthropic トークンプロファイルがない、または期限切れの場合は、そのセットアップを Claude CLI
または API キーに移行してください。

## Claude CLI の要件

Anthropic の Claude CLI 再利用経路でのみ必要です:

- Claude Code CLI がインストールされていること（`claude` コマンドが使用可能）
