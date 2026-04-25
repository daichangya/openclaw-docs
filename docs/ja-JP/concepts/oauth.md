---
read_when:
    - OpenClaw の OAuth をエンドツーエンドで理解したい場合
    - トークン無効化 / ログアウトの問題に遭遇した場合
    - Claude CLI または OAuth の auth フローを使いたい場合
    - 複数アカウントまたは profile ルーティングを使いたい場合
summary: 'OpenClaw における OAuth: トークン交換、保存、多重アカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw は、対応する provider に対して OAuth による「subscription auth」をサポートしています
（特に **OpenAI Codex（ChatGPT OAuth）**）。Anthropic については、実用上の区分は現在次のとおりです。

- **Anthropic API key**: 通常の Anthropic API 課金
- **OpenClaw 内での Anthropic Claude CLI / subscription auth**: Anthropic スタッフから
  この利用は再び許可されていると伝えられています

OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。
このページでは次を説明します。

本番運用の Anthropic では、API key auth の方がより安全な推奨経路です。

- OAuth の**トークン交換**がどのように動くか（PKCE）
- トークンが**どこに保存**されるか（およびその理由）
- **複数アカウント**をどう扱うか（profile + セッションごとのオーバーライド）

OpenClaw は、独自の OAuth または API‑key
フローを提供する **provider Plugin** もサポートしています。実行するには:

```bash
openclaw models auth login --provider <id>
```

## token sink（なぜ存在するのか）

OAuth provider は、ログイン/リフレッシュフロー中に**新しい refresh token** を発行することがよくあります。provider（または OAuth client）によっては、同じ user/app に対して新しいものが発行された際に、古い refresh token が無効化されることがあります。

実際の症状:

- OpenClaw _と_ Claude Code / Codex CLI の両方でログインすると、後でどちらか一方がランダムに「ログアウト」状態になる

これを減らすために、OpenClaw は `auth-profiles.json` を **token sink** として扱います。

- ランタイムは **1 か所** から資格情報を読み取ります
- 複数の profile を保持し、決定的にルーティングできます
- 外部 CLI の再利用は provider ごとの扱いです: Codex CLI は空の
  `openai-codex:default` profile を bootstrap できますが、OpenClaw にローカル OAuth profile が存在するようになると、
  ローカル refresh token が正規となります。ほかの統合は引き続き外部管理のままとし、
  その CLI auth store を再読込できます

## 保存場所（トークンはどこに保存されるか）

secret は **agent ごと** に保存されます。

- Auth profile（OAuth + API key + 任意の value-level ref）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリは見つかり次第除去されます）

旧来のインポート専用ファイル（引き続きサポートされますが、メインの保存先ではありません）:

- `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` へインポート）

上記のすべては `$OPENCLAW_STATE_DIR`（state dir 上書き）にも従います。完全なリファレンス: [/gateway/configuration](/ja-JP/gateway/configuration-reference#auth-storage)

静的 secret ref とランタイムスナップショットの有効化動作については、[Secrets Management](/ja-JP/gateway/secrets) を参照してください。

## Anthropic の旧トークン互換性

<Warning>
Anthropic の公開 Claude Code ドキュメントでは、Claude Code の直接利用は
Claude subscription の上限内に収まるとされており、Anthropic スタッフからも OpenClaw スタイルの Claude
CLI 利用は再び許可されていると伝えられています。そのため OpenClaw は、Anthropic
が新しいポリシーを公開しない限り、この統合において Claude CLI の再利用と
`claude -p` 利用を認可済みとして扱います。

Anthropic の現在の direct-Claude-Code プラン文書については、[Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
および [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) を参照してください。

OpenClaw で他の subscription スタイルの選択肢を使いたい場合は、[OpenAI
Codex](/ja-JP/providers/openai)、[Qwen Cloud Coding
Plan](/ja-JP/providers/qwen)、[MiniMax Coding Plan](/ja-JP/providers/minimax)、
および [Z.AI / GLM Coding Plan](/ja-JP/providers/glm) を参照してください。
</Warning>

OpenClaw は、サポートされる token-auth 経路として Anthropic setup-token も公開していますが、現在は利用可能な場合に Claude CLI の再利用と `claude -p` を優先します。

## Anthropic Claude CLI 移行

OpenClaw は Anthropic Claude CLI の再利用を再びサポートしています。ホスト上にすでにローカルの
Claude ログインがある場合、onboarding/configure はそれを直接再利用できます。

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `@mariozechner/pi-ai` に実装されており、各種ウィザード/コマンドに接続されています。

### Anthropic setup-token

フロー形状:

1. OpenClaw から Anthropic setup-token または paste-token を開始
2. OpenClaw が結果の Anthropic 資格情報を auth profile に保存
3. model 選択は `anthropic/...` のまま
4. 既存の Anthropic auth profile はロールバック/順序制御用に引き続き利用可能

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth は、Codex CLI の外部でも、OpenClaw ワークフローを含めて利用が明示的にサポートされています。

フロー形状（PKCE）:

1. PKCE verifier/challenge とランダムな `state` を生成
2. `https://auth.openai.com/oauth/authorize?...` を開く
3. `http://127.0.0.1:1455/auth/callback` でコールバック取得を試みる
4. コールバックを bind できない場合（またはリモート/ヘッドレス環境の場合）、リダイレクト URL/code を貼り付ける
5. `https://auth.openai.com/oauth/token` で交換
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存

ウィザード経路は `openclaw onboard` → auth 選択 `openai-codex` です。

## リフレッシュ + 有効期限

profile には `expires` タイムスタンプが保存されます。

ランタイムでは:

- `expires` が未来なら → 保存済みアクセストークンを使う
- 期限切れなら → リフレッシュし（ファイルロック下で）、保存済み資格情報を上書きする
- 例外: 一部の外部 CLI 資格情報は外部管理のままです。OpenClaw
  はコピーした refresh token を消費する代わりに、それらの CLI auth store を再読込します。
  Codex CLI bootstrap は意図的により限定的です: 空の
  `openai-codex:default` profile を作成し、その後は OpenClaw 所有のリフレッシュによってローカル
  profile を正規に保ちます。

リフレッシュフローは自動で行われるため、通常は手動でトークン管理する必要はありません。

## 複数アカウント（profile）+ ルーティング

パターンは 2 つあります。

### 1) 推奨: agent を分ける

「個人用」と「仕事用」を決して混在させたくない場合は、分離 agent を使ってください（セッション + 資格情報 + ワークスペースを分離）。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、agent ごとに auth を設定し（ウィザード）、チャットを正しい agent にルーティングします。

### 2) 上級者向け: 1 つの agent に複数 profile

`auth-profiles.json` は、同じ provider に対して複数の profile ID をサポートしています。

どの profile を使うかは次で選びます。

- config の順序付けによるグローバル指定（`auth.order`）
- セッションごとの `/model ...@<profileId>`

例（セッション上書き）:

- `/model Opus@anthropic:work`

存在する profile ID を確認する方法:

- `openclaw channels list --json`（`auth[]` を表示）

関連ドキュメント:

- [model フェイルオーバー](/ja-JP/concepts/model-failover)（ローテーション + クールダウンルール）
- [スラッシュコマンド](/ja-JP/tools/slash-commands)（コマンド画面）

## 関連

- [Authentication](/ja-JP/gateway/authentication) — model provider auth の概要
- [Secrets](/ja-JP/gateway/secrets) — 資格情報保存と SecretRef
- [Configuration Reference](/ja-JP/gateway/configuration-reference#auth-storage) — auth config キー
