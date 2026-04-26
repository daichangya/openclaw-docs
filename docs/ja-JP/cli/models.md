---
read_when:
    - デフォルトモデルを変更したい、または provider の認証状態を確認したい場合
    - 利用可能なモデル/プロバイダをスキャンしたい、または認証プロファイルをデバッグしたい場合
summary: '`openclaw models` の CLI リファレンス（status/list/set/scan、エイリアス、フォールバック、認証）'
title: モデル
x-i18n:
    generated_at: "2026-04-26T11:26:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

モデルの検出、スキャン、設定（デフォルトモデル、フォールバック、認証プロファイル）。

関連:

- provider + モデル: [モデル](/ja-JP/providers/models)
- モデル選択の概念 + `/models` スラッシュコマンド: [モデルの概念](/ja-JP/concepts/models)
- provider 認証のセットアップ: [はじめに](/ja-JP/start/getting-started)

## よく使うコマンド

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` は、解決済みのデフォルト/フォールバックと認証概要を表示します。
provider 使用状況スナップショットが利用可能な場合、OAuth/API キーのステータスセクションには
provider の使用期間ウィンドウとクォータスナップショットが含まれます。
現在の使用期間ウィンドウ対応 provider: Anthropic、GitHub Copilot、Gemini CLI、OpenAI
Codex、MiniMax、Xiaomi、z.ai。使用状況認証は、利用可能な場合は provider 固有のフックから取得されます。
それ以外の場合、OpenClaw は認証プロファイル、環境変数、または config にある一致する OAuth/API キー認証情報にフォールバックします。
`--json` 出力では、`auth.providers` は環境変数/config/store を考慮した provider
概要であり、`auth.oauth` は認証ストア内プロファイルのヘルスのみです。
各設定済み provider プロファイルに対してライブ認証プローブを実行するには `--probe` を追加してください。
プローブは実際のリクエストです（トークンを消費したりレート制限を引き起こしたりする可能性があります）。
設定済みエージェントの model/認証状態を調べるには `--agent <id>` を使用します。省略した場合、
コマンドは `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` が設定されていればそれを使い、そうでなければ
設定済みのデフォルトエージェントを使用します。
プローブ行は、認証プロファイル、環境変数の認証情報、または `models.json` から取得される場合があります。

注記:

- `models set <model-or-alias>` は `provider/model` またはエイリアスを受け付けます。
- `models list` は読み取り専用です。config、認証プロファイル、既存のカタログ
  状態、および provider 所有のカタログ行を読み取りますが、`models.json`
  は書き換えません。
- `models list --all --provider <id>` は、その provider でまだ認証していない場合でも、
  Plugin マニフェストまたはバンドル済み provider カタログメタデータにある provider 所有の静的カタログ行を含めることができます。
  それらの行は、一致する認証が設定されるまでは引き続き利用不可として表示されます。
- `models list` はネイティブのモデルメタデータとランタイム上限を区別して保持します。
  テーブル出力では、有効なランタイム上限がネイティブのコンテキストウィンドウと異なる場合、
  `Ctx` は `contextTokens/contextWindow` を表示します。JSON 行には、provider がその上限を公開している場合に `contextTokens`
  が含まれます。
- `models list --provider <id>` は、`moonshot` や
  `openai-codex` のような provider id でフィルタします。対話型 provider
  ピッカーの表示ラベル（`Moonshot AI` など）は受け付けません。
- モデル参照は**最初の** `/` で分割して解析されます。model ID に `/` が含まれる場合（OpenRouter スタイル）、
  provider 接頭辞を含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- provider を省略した場合、OpenClaw はまず入力をエイリアスとして解決し、次に
  その正確な model id に一致する一意の設定済み provider として解決し、それでもだめなら
  非推奨警告付きで設定済みのデフォルト provider にフォールバックします。
  その provider が設定済みのデフォルト model をもう公開していない場合、OpenClaw は
  古くなった削除済み provider のデフォルトを表示する代わりに、最初の設定済み provider/model にフォールバックします。
- `models status` の認証出力では、シークレットではないプレースホルダーに対して
  シークレットとしてマスクする代わりに `marker(<value>)` が表示されることがあります（例: `OPENAI_API_KEY`、`secretref-managed`、`minimax-oauth`、`oauth:chutes`、`ollama-local`）。

### `models scan`

`models scan` は OpenRouter の公開 `:free` カタログを読み取り、フォールバック用途の候補を順位付けします。
カタログ自体は公開されているため、メタデータのみのスキャンには OpenRouter キーは不要です。

デフォルトでは、OpenClaw はライブのモデル呼び出しでツールおよび画像サポートをプローブしようとします。
OpenRouter キーが設定されていない場合、コマンドはメタデータのみの出力にフォールバックし、
`:free` モデルでもプローブと推論には `OPENROUTER_API_KEY` が必要であることを説明します。

オプション:

- `--no-probe`（メタデータのみ。config/シークレット検索なし）
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`（カタログリクエストおよび各プローブのタイムアウト）
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` と `--set-image` にはライブプローブが必要です。メタデータのみのスキャン
結果は情報提供用であり、config には適用されません。

### `models status`

オプション:

- `--json`
- `--plain`
- `--check`（終了コード 1=期限切れ/欠落、2=期限切れ間近）
- `--probe`（設定済み認証プロファイルのライブプローブ）
- `--probe-provider <name>`（1 つの provider をプローブ）
- `--probe-profile <id>`（繰り返し指定またはカンマ区切りの profile id）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`（設定済みエージェント id。`OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` を上書き）

プローブステータス分類:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

想定されるプローブ詳細/理由コード:

- `excluded_by_auth_order`: 保存済みプロファイルは存在するが、明示的な
  `auth.order.<provider>` がそれを含めていないため、試行する代わりに
  除外として報告されます。
- `missing_credential`、`invalid_expires`、`expired`、`unresolved_ref`:
  プロファイルは存在するが、適格または解決可能ではありません。
- `no_model`: provider 認証は存在するが、その provider に対してプローブ可能な
  model 候補を OpenClaw が解決できませんでした。

## エイリアス + フォールバック

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

`models auth add` は対話型の認証ヘルパーです。選択した provider に応じて、
provider 認証フロー（OAuth/API キー）を起動することも、手動トークン貼り付けに案内することもできます。

`models auth login` は provider Plugin の認証フロー（OAuth/API キー）を実行します。
インストールされている provider を確認するには `openclaw plugins list` を使用してください。
特定の設定済みエージェントストアに認証結果を書き込むには
`openclaw models auth --agent <id> <subcommand>` を使用します。親の `--agent` フラグは
`add`、`login`、`setup-token`、`paste-token`、`login-github-copilot` で有効です。

例:

```bash
openclaw models auth login --provider openai-codex --set-default
```

注記:

- `setup-token` と `paste-token` は、トークン認証方式を公開している provider 向けの
  汎用トークンコマンドとして引き続き利用できます。
- `setup-token` は対話型 TTY を必要とし、provider のトークン認証
  メソッドを実行します（provider が公開している場合は、その provider の `setup-token`
  メソッドがデフォルトになります）。
- `paste-token` は、別の場所または自動化から生成されたトークン文字列を受け付けます。
- `paste-token` には `--provider` が必要で、トークン値の入力を求め、
  `--profile-id` を渡さない限り、デフォルトのプロファイル id `<provider>:manual` に書き込みます。
- `paste-token --expires-in <duration>` は、`365d` や `12h` のような相対期間から
  絶対的なトークン有効期限を保存します。
- Anthropic に関する注記: Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合において Claude CLI の再利用と `claude -p` の使用を承認済みとして扱います。
- Anthropic の `setup-token` / `paste-token` はサポート対象の OpenClaw トークン経路として引き続き利用できますが、利用可能な場合、OpenClaw は現在 Claude CLI の再利用と `claude -p` を優先します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [モデル選択](/ja-JP/concepts/model-providers)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
