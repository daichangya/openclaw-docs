---
read_when:
    - デフォルトの model を変更したい場合、または provider の認証状態を確認したい場合
    - 利用可能な model/provider をスキャンしたい場合、または auth profile をデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: Models
x-i18n:
    generated_at: "2026-04-25T13:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

model の検出、スキャン、設定（デフォルト model、フォールバック、auth profile）。

関連:

- provider + model: [Models](/ja-JP/providers/models)
- model 選択の概念 + `/models` スラッシュコマンド: [Models concept](/ja-JP/concepts/models)
- provider auth のセットアップ: [はじめに](/ja-JP/start/getting-started)

## よく使うコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決済みのデフォルト/フォールバックに加えて auth の概要を表示します。
provider 使用状況のスナップショットが利用可能な場合、OAuth/API キーのステータスセクションには
provider の使用ウィンドウとクォータのスナップショットが含まれます。
現在、使用ウィンドウ対応の provider は Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai です。使用 auth は、利用可能な場合は provider 固有のフックから取得され、
それ以外の場合は OpenClaw が auth profile、env、config の一致する OAuth/API キー資格情報に
フォールバックします。
`--json` 出力では、`auth.providers` は env/config/store を認識する provider
概要であり、`auth.oauth` は auth-store の profile 健全性のみです。
設定済みの各 provider profile に対してライブ auth プローブを実行するには `--probe` を追加してください。
プローブは実際のリクエストです（トークンを消費したり、rate limit を引き起こしたりする可能性があります）。
設定済み agent の model/auth 状態を確認するには `--agent <id>` を使います。省略した場合、
このコマンドは `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` が設定されていればそれを使い、
そうでなければ設定済みのデフォルト agent を使います。
プローブ行は auth profile、env 資格情報、または `models.json` から取得されることがあります。

注意:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。config、auth profile、既存の catalog
  状態、および provider 所有の catalog 行を読み取りますが、`models.json` を
  書き換えることはありません。
- `models list --all` は、その provider でまだ認証していなくても、バンドル済みの provider 所有静的 catalog 行を含めます。それらの行は、一致する auth が設定されるまでは引き続き利用不可として表示されます。
- `models list` では、ネイティブ model メタデータとランタイム上限が区別されます。テーブル出力では、有効なランタイム上限がネイティブ context window と異なる場合、`Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、provider がその上限を公開している場合に `contextTokens` が含まれます。
- `models list --provider <id>` は `moonshot` や
  `openai-codex` のような provider id でフィルタリングします。`Moonshot AI` のような対話型 provider
  picker の表示ラベルは受け付けません。
- model ref は**最初の** `/` で分割して解析されます。model ID 自体に `/` が含まれる場合（OpenRouter スタイル）、provider 接頭辞を含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- provider を省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次にその正確な model id に対する一意な設定済み provider 一致として解決し、それでもなければ非推奨警告付きで設定済みデフォルト provider にフォールバックします。
  その provider が設定済みのデフォルト model を公開しなくなっている場合、OpenClaw は古くなった削除済み provider のデフォルトを表示する代わりに、最初の設定済み provider/model にフォールバックします。
- `models status` の auth 出力では、秘密としてマスクする代わりに、秘密ではないプレースホルダーに対して `marker(<value>)` が表示されることがあります（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）。

### `models scan`

`models scan` は OpenRouter の公開 `:free` catalog を読み取り、
フォールバック用途の候補を順位付けします。catalog 自体は公開されているため、
メタデータのみのスキャンに OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブ model 呼び出しでツールと画像サポートをプローブしようとします。
OpenRouter キーが設定されていない場合、このコマンドはメタデータのみの出力にフォールバックし、
`:free` model でもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe`（メタデータのみ。config/secrets の参照なし）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（catalog リクエストおよび各プローブのタイムアウト）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` と `--set-image` はライブプローブが必要です。メタデータのみのスキャン
結果は情報提供用であり、config には適用されません。

### `models status`

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限切れ間近）
- `--probe`（設定済み auth profile のライブプローブ）
- `--probe-provider <name>`（1 つの provider をプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りの profile id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済み agent id。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き）

プローブステータスの分類:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

想定されるプローブ詳細/理由コード:

- `excluded_by_auth_order`: 保存済み profile は存在しますが、明示的な
  `auth.order.<provider>` でそれが省略されているため、プローブは
  試行する代わりに除外を報告します。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  profile は存在しますが、対象外または解決不能です。
- `no_model`: provider auth は存在しますが、その provider に対して
  プローブ可能な model 候補を OpenClaw が解決できませんでした。

## エイリアス + フォールバック

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## auth profile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` は対話型 auth ヘルパーです。選択した provider に応じて、
provider auth フロー（OAuth/API キー）を起動することも、手動トークン貼り付けへ案内することもできます。

`models auth login` は provider Plugin の auth フロー（OAuth/API キー）を実行します。どの provider がインストールされているかは
`openclaw plugins list` で確認してください。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
```

注意:

- `setup-token` と `paste-token` は、トークン auth メソッドを公開する provider 向けの汎用トークンコマンドとして引き続き利用できます。
- `setup-token` には対話型 TTY が必要で、provider の token-auth
  メソッドを実行します（その provider が公開している場合、デフォルトではその provider の `setup-token` メソッドを使います）。
- `paste-token` は、他所で生成した、または自動化から取得したトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要で、トークン値の入力を求め、
  `--profile-id` を渡さない限りデフォルト profile id `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` のような相対期間から絶対トークン有効期限を保存します。
- Anthropic に関する注意: Anthropic スタッフから、OpenClaw スタイルの Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携において Claude CLI の再利用と `claude -p` 利用を認可済みとして扱います。
- Anthropic の `setup-token` / `paste-token` は引き続きサポートされる OpenClaw トークン経路として利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [model 選択](/ja-JP/concepts/model-providers)
- [model フェイルオーバー](/ja-JP/concepts/model-failover)
