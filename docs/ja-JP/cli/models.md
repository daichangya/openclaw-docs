---
read_when:
    - デフォルトモデルを変更したい、またはプロバイダーの認証ステータスを確認したいとき
    - 利用可能なモデル/プロバイダーをスキャンし、認証プロファイルをデバッグしたいとき
summary: '`openclaw models`のCLIリファレンス（status/list/set/scan、alias、fallback、auth）'
title: models
x-i18n:
    generated_at: "2026-04-05T12:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、fallback、認証プロファイル）。

関連:

- Providers + models: [Models](/providers/models)
- プロバイダー認証セットアップ: [はじめに](/ja-JP/start/getting-started)

## 一般的なコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`は、解決済みのデフォルト/fallbackに加えて認証の概要を表示します。
プロバイダー使用量スナップショットが利用可能な場合、OAuth/APIキーのステータスセクションには
プロバイダーの使用ウィンドウとクォータスナップショットが含まれます。
現在の使用ウィンドウ対応プロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai。使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。利用できない場合、OpenClawはauth profiles、env、またはconfigに一致するOAuth/APIキー認証情報へフォールバックします。
各設定済みプロバイダープロファイルに対して実際の認証probeを実行するには`--probe`を追加します。
probeは実際のリクエストです（トークンを消費し、レート制限を引き起こす可能性があります）。
設定済みagentのモデル/認証状態を確認するには`--agent <id>`を使用します。省略時は、
設定されていれば`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`を使用し、そうでなければ
設定済みのデフォルトagentを使用します。
Probe行は、auth profiles、env認証情報、または`models.json`から取得される場合があります。

注記:

- `models set <model-or-alias>`は`provider/model`またはaliasを受け付けます。
- モデル参照は**最初の**`/`で分割して解析されます。モデルID自体に`/`が含まれる場合（OpenRouter形式）、プロバイダープレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClawはまず入力をaliasとして解決し、次にその正確なモデルIDに対する一意なconfigured-provider一致として解決し、それでもだめなら非推奨警告付きで設定済みのデフォルトプロバイダーにフォールバックします。
  そのプロバイダーが設定済みのデフォルトモデルをもう公開していない場合、OpenClawは古くなった削除済みプロバイダーデフォルトを表示する代わりに、最初の設定済みprovider/modelへフォールバックします。
- `models status`の認証出力では、秘密としてマスクする代わりに、機密でないプレースホルダーに対して`marker(<value>)`が表示される場合があります（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）。

### `models status`

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/不足、2=期限間近）
- `--probe`（設定済みauth profilesのライブprobe）
- `--probe-provider <name>`（1つのプロバイダーをprobe）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りのprofile id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済みagent id。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`を上書き）

Probeステータスの分類:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

想定されるprobe詳細/理由コード:

- `excluded_by_auth_order`: 保存済みprofileは存在するが、明示的な
  `auth.order.<provider>`に含まれていないため、probeは試行せず除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  profileは存在するが、対象外または解決不能です。
- `no_model`: プロバイダー認証は存在するが、そのプロバイダーに対してprobe可能なモデル候補をOpenClawが解決できませんでした。

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 認証プロファイル

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`は対話型の認証ヘルパーです。選択したプロバイダーに応じて、
プロバイダー認証フロー（OAuth/APIキー）を起動することも、手動トークン貼り付けへ案内することもできます。

`models auth login`はプロバイダーpluginの認証フロー（OAuth/APIキー）を実行します。どのプロバイダーがインストールされているかは`openclaw plugins list`で確認できます。

例:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

注記:

- `login --provider anthropic --method cli --set-default`はローカルのClaude
  CLIログインを再利用し、Anthropicのメインデフォルトモデル経路を正規の
  `claude-cli/claude-*`参照に書き換えます。
- `setup-token`および`paste-token`は、トークン認証メソッドを公開しているプロバイダー向けの汎用トークンコマンドとして引き続き利用できます。
- `setup-token`には対話型TTYが必要で、そのプロバイダーのトークン認証メソッドを実行します（プロバイダーが公開している場合は、その`setup-token`メソッドがデフォルト）。
- `paste-token`は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token`には`--provider`が必要で、トークン値の入力を求め、`--profile-id`を渡さない限り、デフォルトprofile idの`<provider>:manual`へ書き込みます。
- `paste-token --expires-in <duration>`は、`365d`や`12h`のような相対期間から絶対的なトークン有効期限を保存します。
- Anthropic課金に関する注記: Anthropicの公開CLIドキュメントに基づき、Claude Code CLI fallbackはローカルのユーザー管理自動化であれば許可されている可能性が高いと私たちは考えています。ただし、Anthropicのサードパーティーハーネスポリシーには、外部製品でのサブスクリプション裏付け利用に関して十分な曖昧さがあるため、本番環境には推奨しません。Anthropicはさらに、**2026年4月4日 午後12:00 PT / 午後8:00 BST**にOpenClawユーザーへ、**OpenClaw**のClaudeログイン経路はサードパーティーハーネス利用として扱われ、サブスクリプションとは別請求の**Extra Usage**が必要であると通知しました。
- Anthropicの`setup-token` / `paste-token`は、レガシー/手動のOpenClaw経路として再び利用可能です。この経路には**Extra Usage**が必要であるとAnthropicがOpenClawユーザーに通知したことを前提に使用してください。
