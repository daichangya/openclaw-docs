---
read_when:
    - OpenClaw の OAuth をエンドツーエンドで理解したい
    - トークン無効化 / ログアウトの問題に遭遇した
    - Claude CLI または OAuth の認証フローを使いたい
    - 複数アカウントやプロファイルルーティングを使いたい
summary: 'OpenClaw における OAuth: トークン交換、保存、多重アカウントパターン'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T12:42:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw は、それを提供するプロバイダーに対して、OAuth による「サブスクリプション認証」をサポートしています
（特に **OpenAI Codex (ChatGPT OAuth)**）。Anthropic のサブスクリプションについては、新規
セットアップでは Gateway ホスト上のローカルな **Claude CLI** ログインパスを使うべきですが、
Anthropic は Claude Code の直接利用と OpenClaw による再利用パスを区別しています。
Anthropic の公開されている Claude Code ドキュメントでは、Claude Code の直接利用は
Claude サブスクリプションの制限内に収まるとされています。一方で、Anthropic は
**2026 年 4 月 4 日 午後 12:00 PT / 午後 8:00 BST** に OpenClaw ユーザーへ、OpenClaw は
サードパーティ製ハーネスとして扱われ、そのトラフィックには **Extra Usage** が必要になったと通知しました。
OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。
このページでは、以下を説明します。

Anthropic を本番で使う場合は、API キー認証のほうがより安全で推奨されるパスです。

- OAuth の**トークン交換**の仕組み（PKCE）
- トークンが**どこに保存**されるか（およびその理由）
- **複数アカウント**の扱い方（プロファイル + セッションごとの上書き）

OpenClaw は、独自の OAuth または API キー
フローを含む**プロバイダープラグイン**もサポートしています。次のように実行します。

```bash
openclaw models auth login --provider <id>
```

## トークンシンク（これが存在する理由）

OAuth プロバイダーは、ログイン / リフレッシュフロー中に**新しいリフレッシュトークン**を発行することがよくあります。一部のプロバイダー（または OAuth クライアント）は、同じユーザー / アプリに対して新しいものが発行されると、古いリフレッシュトークンを無効化することがあります。

実際の症状:

- OpenClaw _と_ Claude Code / Codex CLI の両方でログインすると、どちらか一方が後でランダムに「ログアウト」される

これを減らすため、OpenClaw は `auth-profiles.json` を**トークンシンク**として扱います。

- ランタイムは**1 か所**から資格情報を読み取る
- 複数のプロファイルを保持し、決定的にルーティングできる
- Codex CLI のような外部 CLI から資格情報を再利用する場合、OpenClaw は
  それらを出所情報付きでミラーし、自分でリフレッシュトークンをローテーションする代わりに、その外部ソースを再読込する

## 保存場所（トークンの保存先）

シークレットは**エージェントごと**に保存されます。

- 認証プロファイル（OAuth + API キー + 任意の値レベル参照）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー互換ファイル: `~/.openclaw/agents/<agentId>/agent/auth.json`
  （静的な `api_key` エントリーは見つかった時点で除去されます）

レガシーなインポート専用ファイル（引き続きサポートされていますが、メインの保存先ではありません）:

- `~/.openclaw/credentials/oauth.json`（初回使用時に `auth-profiles.json` にインポートされます）

上記のすべては `$OPENCLAW_STATE_DIR`（state dir の上書き）にも対応しています。完全なリファレンス: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

静的なシークレット参照とランタイムスナップショット有効化動作については、[Secrets Management](/gateway/secrets) を参照してください。

## Anthropic レガシートークン互換性

<Warning>
Anthropic の公開されている Claude Code ドキュメントでは、Claude Code の直接利用は
Claude サブスクリプションの制限内に収まるとされています。一方で、Anthropic は
**2026 年 4 月 4 日 午後 12:00 PT / 午後 8:00 BST** に OpenClaw ユーザーへ、**OpenClaw は
サードパーティ製ハーネスとして扱われる**と通知しました。既存の Anthropic トークンプロファイルは
技術的には OpenClaw で引き続き使用可能ですが、Anthropic は OpenClaw 経由のそのパスでは、その
トラフィックに **Extra Usage**（サブスクリプションとは別請求の従量課金）が必要だとしています。

Anthropic の現在の Claude Code 直接利用プランのドキュメントについては、
[Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
および [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
を参照してください。

OpenClaw で他のサブスクリプション型オプションを使いたい場合は、[OpenAI
Codex](/providers/openai)、[Qwen Cloud Coding
Plan](/providers/qwen)、[MiniMax Coding Plan](/providers/minimax)、
および [Z.AI / GLM Coding Plan](/providers/glm) を参照してください。
</Warning>

OpenClaw は現在、Anthropic の setup-token をレガシー / 手動パスとして再度公開しています。
Anthropic の OpenClaw 固有の請求通知はこのパスにも適用されるため、
OpenClaw 駆動の Claude ログイントラフィックには Anthropic が **Extra Usage** を要求するという前提で
使用してください。

## Anthropic Claude CLI への移行

Claude CLI がすでに Gateway ホストにインストールされ、サインイン済みである場合は、
Anthropic モデル選択をローカル CLI バックエンドへ切り替えることができます。これは、
同じホスト上でローカルな Claude CLI ログインを再利用したい場合の、OpenClaw でサポートされたパスです。

前提条件:

- `claude` バイナリが Gateway ホストにインストールされている
- Claude CLI が `claude auth login` ですでにそこで認証済みである

移行コマンド:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

オンボーディングのショートカット:

```bash
openclaw onboard --auth-choice anthropic-cli
```

これにより、既存の Anthropic 認証プロファイルはロールバック用に保持されますが、
メインのデフォルトモデルパスは `anthropic/...` から `claude-cli/...` に書き換えられ、
一致する Anthropic Claude フォールバックも書き換えられ、さらに
`agents.defaults.models` 配下に一致する `claude-cli/...` の許可リストエントリーが追加されます。

確認:

```bash
openclaw models status
```

## OAuth 交換（ログインの仕組み）

OpenClaw の対話型ログインフローは `@mariozechner/pi-ai` に実装されており、ウィザード / コマンドに接続されています。

### Anthropic Claude CLI

フロー形状:

Claude CLI パス:

1. Gateway ホスト上で `claude auth login` を使ってサインインする
2. `openclaw models auth login --provider anthropic --method cli --set-default` を実行する
3. 新しい認証プロファイルは保存せず、モデル選択を `claude-cli/...` に切り替える
4. 既存の Anthropic 認証プロファイルはロールバック用に保持する

Anthropic の公開されている Claude Code ドキュメントでは、この `claude` 自体の
Claude サブスクリプション直接ログインフローが説明されています。OpenClaw はそのローカルログインを再利用できますが、
Anthropic は別途、OpenClaw によって制御されるこのパスを、請求上はサードパーティ製
ハーネス利用として分類しています。

対話型アシスタントパス:

- `openclaw onboard` / `openclaw configure` → 認証選択 `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth は、Codex CLI の外部を含む利用、すなわち OpenClaw ワークフローでの利用が明示的にサポートされています。

フロー形状（PKCE）:

1. PKCE verifier/challenge とランダムな `state` を生成する
2. `https://auth.openai.com/oauth/authorize?...` を開く
3. `http://127.0.0.1:1455/auth/callback` でコールバックを捕捉しようとする
4. コールバックにバインドできない場合（またはリモート / ヘッドレスの場合）、リダイレクト URL / コードを貼り付ける
5. `https://auth.openai.com/oauth/token` で交換する
6. アクセストークンから `accountId` を抽出し、`{ access, refresh, expires, accountId }` を保存する

ウィザードパスは `openclaw onboard` → 認証選択 `openai-codex` です。

## リフレッシュ + 有効期限

プロファイルは `expires` タイムスタンプを保存します。

ランタイムでは:

- `expires` が未来なら → 保存済みアクセストークンを使う
- 期限切れなら → リフレッシュし（ファイルロック下で）、保存済み資格情報を上書きする
- 例外: 再利用される外部 CLI 資格情報は外部管理のままです。OpenClaw は
  CLI の認証ストアを再読込し、コピーしたリフレッシュトークンを自分で消費することはありません

リフレッシュフローは自動です。通常、トークンを手動管理する必要はありません。

## 複数アカウント（プロファイル） + ルーティング

2 つのパターンがあります。

### 1) 推奨: 分離されたエージェント

「個人用」と「仕事用」を絶対に相互作用させたくない場合は、分離されたエージェント
（セッション + 資格情報 + ワークスペースが別々）を使ってください。

```bash
openclaw agents add work
openclaw agents add personal
```

その後、エージェントごとに認証を設定し（ウィザード）、適切なエージェントにチャットをルーティングします。

### 2) 上級: 1 つのエージェント内で複数プロファイル

`auth-profiles.json` は、同じプロバイダーに対する複数のプロファイル ID をサポートしています。

どのプロファイルを使うかの指定方法:

- グローバルには設定順序（`auth.order`）
- セッションごとには `/model ...@<profileId>`

例（セッション上書き）:

- `/model Opus@anthropic:work`

存在するプロファイル ID の確認方法:

- `openclaw channels list --json`（`auth[]` を表示します）

関連ドキュメント:

- [/concepts/model-failover](/concepts/model-failover)（ローテーション + クールダウンルール）
- [/tools/slash-commands](/tools/slash-commands)（コマンドサーフェス）

## 関連

- [Authentication](/gateway/authentication) — モデルプロバイダー認証の概要
- [Secrets](/gateway/secrets) — 資格情報の保存と SecretRef
- [Configuration Reference](/gateway/configuration-reference#auth-storage) — 認証設定キー
