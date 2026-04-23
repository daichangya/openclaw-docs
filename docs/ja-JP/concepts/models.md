---
read_when:
    - models CLIの追加または変更（models list/set/scan/aliases/fallbacks）
    - モデルのフォールバック動作または選択UXの変更
    - モデルスキャンのプローブ（tools/images）の更新
summary: 'Models CLI: 一覧、設定、エイリアス、フォールバック、スキャン、ステータス'
title: Models CLI
x-i18n:
    generated_at: "2026-04-23T04:44:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18d915f3f761aaff5efc3bf752f5abddeb625e1a386ab3d701f46fd92244f20e
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

認証プロファイルのローテーション、クールダウン、およびそれらがフォールバックとどのように相互作用するかについては、[/concepts/model-failover](/ja-JP/concepts/model-failover)を参照してください。
プロバイダーの概要と例については、[/concepts/model-providers](/ja-JP/concepts/model-providers)を参照してください。

## モデル選択の仕組み

OpenClawは次の順序でモデルを選択します。

1. **Primary** モデル（`agents.defaults.model.primary` または `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` の **フォールバック**（順番どおり）。
3. **プロバイダー認証のフェイルオーバー** は、次のモデルに移る前にプロバイダー内で発生します。

関連項目:

- `agents.defaults.models` は、OpenClawが使用できるモデルの許可リスト/カタログです（エイリアスを含む）。
- `agents.defaults.imageModel` は、Primaryモデルが画像を受け取れない**場合にのみ**使用されます。
- `agents.defaults.pdfModel` は `pdf` ツールで使用されます。省略した場合、このツールは `agents.defaults.imageModel`、次に解決済みのセッション/デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel` は共有の画像生成機能で使用されます。省略した場合でも、`image_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの画像生成プロバイダーをプロバイダーID順で試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- `agents.defaults.musicGenerationModel` は共有の音楽生成機能で使用されます。省略した場合でも、`music_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの音楽生成プロバイダーをプロバイダーID順で試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- `agents.defaults.videoGenerationModel` は共有の動画生成機能で使用されます。省略した場合でも、`video_generate` は認証済みのプロバイダーデフォルトを推論できます。まず現在のデフォルトプロバイダーを試し、その後、登録済みの残りの動画生成プロバイダーをプロバイダーID順で試します。特定のプロバイダー/モデルを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- エージェントごとのデフォルトは、`agents.list[].model` とバインディングによって `agents.defaults.model` を上書きできます（[/concepts/multi-agent](/ja-JP/concepts/multi-agent)を参照）。

## クイックモデルポリシー

- Primaryには、自分が利用可能な中で最も強力な最新世代モデルを設定してください。
- コスト/レイテンシーに敏感なタスクや、重要度の低いチャットにはフォールバックを使ってください。
- ツール対応エージェントや信頼できない入力では、古い/弱いモデル階層は避けてください。

## オンボーディング（推奨）

設定を手動で編集したくない場合は、オンボーディングを実行してください。

```bash
openclaw onboard
```

一般的なプロバイダー向けのモデル + 認証を設定できます。これには **OpenAI Code (Codex) subscription**（OAuth）と **Anthropic**（APIキーまたはClaude CLI）が含まれます。

## 設定キー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメーター）
- `models.providers`（`models.json` に書き込まれるカスタムプロバイダー）

モデル参照は小文字に正規化されます。`z.ai/*` のようなプロバイダーエイリアスは `zai/*` に正規化されます。

プロバイダー設定の例（OpenCodeを含む）は
[/providers/opencode](/ja-JP/providers/opencode)にあります。

### 許可リストの安全な編集

`agents.defaults.models` を手動で更新する場合は、追加書き込みを使用してください。

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` は、モデル/プロバイダーマップが誤って上書きされるのを防ぎます。`agents.defaults.models`、`models.providers`、または `models.providers.<id>.models` に対する通常のオブジェクト代入は、既存エントリーを削除する場合は拒否されます。追加変更には `--merge` を使い、指定した値を完全な対象値にしたい場合にのみ `--replace` を使ってください。

対話型のプロバイダー設定および `openclaw configure --section model` も、プロバイダー単位の選択を既存の許可リストへマージするため、Codex、Ollama、または別のプロバイダーを追加しても、無関係なモデルエントリーは削除されません。

## 「Model is not allowed」（および返信が止まる理由）

`agents.defaults.models` が設定されている場合、それは `/model` とセッション上書きの**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、OpenClawは次を返します。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の返信が生成される**前**に発生するため、メッセージに「反応しなかった」ように見えることがあります。対処方法は次のいずれかです。

- モデルを `agents.defaults.models` に追加する
- 許可リストをクリアする（`agents.defaults.models` を削除する）
- `/model list` からモデルを選ぶ

許可リスト設定の例:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## チャットでモデルを切り替える（`/model`）

再起動せずに現在のセッションのモデルを切り替えられます。

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

注意:

- `/model`（および `/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能なプロバイダー）。
- Discordでは、`/model` と `/models` で、プロバイダーとモデルのドロップダウン、およびSubmitステップを含む対話型ピッカーが開きます。
- `/models add` はデフォルトで利用可能で、`commands.modelsWrite=false` で無効化できます。
- 有効な場合、`/models add <provider> <modelId>` が最短経路です。`/models add` だけの場合は、対応していればプロバイダー優先のガイド付きフローが始まります。
- `/models add` の後、新しいモデルはゲートウェイを再起動しなくても `/models` と `/model` で利用可能になります。
- `/model <#>` は、そのピッカーから選択します。
- `/model` は新しいセッション選択を即座に永続化します。
- エージェントがアイドル状態なら、次の実行ですぐに新しいモデルを使用します。
- 実行がすでにアクティブな場合、OpenClawはライブ切り替えを保留としてマークし、クリーンなリトライポイントでのみ新しいモデルに再起動します。
- ツールのアクティビティや返信出力がすでに始まっている場合、その保留中の切り替えは、後のリトライ機会または次のユーザーターンまで待機したままになることがあります。
- `/model status` は詳細ビューです（認証候補、および設定されている場合はプロバイダーエンドポイントの `baseUrl` + `api` モード）。
- モデル参照は**最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使用してください。
- モデルID自体に `/` が含まれる場合（OpenRouterスタイル）、プロバイダープレフィックスを含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClawは次の順序で入力を解決します:
  1. エイリアス一致
  2. その正確なプレフィックスなしモデルIDに対する、一意の設定済みプロバイダー一致
  3. 設定済みデフォルトプロバイダーへの非推奨フォールバック
     そのプロバイダーが設定済みデフォルトモデルをもう提供していない場合、OpenClawは古い削除済みプロバイダーデフォルトを表示しないよう、代わりに最初の設定済みプロバイダー/モデルへフォールバックします。

完全なコマンド動作/設定: [Slash commands](/ja-JP/tools/slash-commands)

例:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## CLIコマンド

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`（サブコマンドなし）は `models status` のショートカットです。

### `models list`

デフォルトでは設定済みモデルを表示します。便利なフラグ:

- `--all`: 完全なカタログ
- `--local`: ローカルプロバイダーのみ
- `--provider <name>`: プロバイダーで絞り込み
- `--plain`: 1行に1モデル
- `--json`: 機械可読な出力

`--all` には、認証が設定される前の、バンドルされたプロバイダー所有の静的カタログ行が含まれるため、検出専用ビューでは、対応するプロバイダー認証情報を追加するまで利用できないモデルが表示されることがあります。

### `models status`

解決済みのPrimaryモデル、フォールバック、画像モデル、および設定済みプロバイダーの認証概要を表示します。また、認証ストアで見つかったプロファイルのOAuth有効期限ステータスも表示します（デフォルトでは24時間以内に警告します）。`--plain` は解決済みのPrimaryモデルのみを出力します。
OAuthステータスは常に表示され（`--json` 出力にも含まれます）、設定済みプロバイダーに認証情報がない場合、`models status` は **Missing auth** セクションを表示します。
JSONには `auth.oauth`（警告ウィンドウ + プロファイル）と `auth.providers`（環境変数ベースの認証情報を含む、プロバイダーごとの有効な認証）が含まれます。`auth.oauth` は認証ストアのプロファイル健全性のみを表し、環境変数のみのプロバイダーはそこには表示されません。
自動化には `--check` を使ってください（不足/期限切れで終了コード `1`、期限切れ間近で `2`）。
ライブ認証チェックには `--probe` を使ってください。プローブ行は、認証プロファイル、環境変数認証情報、または `models.json` に由来することがあります。
明示的な `auth.order.<provider>` が保存済みプロファイルを省略している場合、プローブはそのプロファイルを試す代わりに `excluded_by_auth_order` を報告します。認証は存在していても、そのプロバイダー向けにプローブ可能なモデルを解決できない場合、プローブは `status: no_model` を報告します。

認証の選択はプロバイダー/アカウントに依存します。常時稼働のゲートウェイホストでは、通常、APIキーが最も予測しやすく、Claude CLIの再利用や既存のAnthropic OAuth/トークンプロファイルもサポートされます。

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter free models）

`openclaw models scan` は OpenRouter の **free model catalog** を調査し、必要に応じてツールと画像のサポートをモデルに対してプローブできます。

主なフラグ:

- `--no-probe`: ライブプローブをスキップ（メタデータのみ）
- `--min-params <b>`: 最小パラメーターサイズ（10億単位）
- `--max-age-days <days>`: 古いモデルをスキップ
- `--provider <name>`: プロバイダープレフィックスフィルター
- `--max-candidates <n>`: フォールバックリストのサイズ
- `--set-default`: `agents.defaults.model.primary` を最初の選択に設定
- `--set-image`: `agents.defaults.imageModel.primary` を最初の画像選択に設定

プローブには OpenRouter APIキー（認証プロファイルまたは `OPENROUTER_API_KEY` から）が必要です。キーがない場合、候補のみを一覧表示するには `--no-probe` を使ってください。

スキャン結果は次の順でランキングされます。

1. 画像サポート
2. ツールのレイテンシー
3. コンテキストサイズ
4. パラメーター数

入力

- OpenRouter の `/models` 一覧（`:free` でフィルター）
- 認証プロファイルまたは `OPENROUTER_API_KEY` からの OpenRouter APIキーが必要です（[/environment](/ja-JP/help/environment)を参照）
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- プローブ制御: `--timeout`、`--concurrency`

TTYで実行した場合、フォールバックを対話的に選択できます。非対話モードでは、デフォルトを受け入れるために `--yes` を指定してください。

## モデルレジストリ（`models.json`）

`models.providers` 内のカスタムプロバイダーは、エージェントディレクトリ配下の `models.json` に書き込まれます（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）。このファイルは、`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

一致するプロバイダーIDに対するマージモードの優先順位:

- エージェントの `models.json` にすでに存在する空でない `baseUrl` が優先されます。
- エージェントの `models.json` 内の空でない `apiKey` は、そのプロバイダーが現在の設定/認証プロファイルコンテキストでSecretRef管理されていない場合にのみ優先されます。
- SecretRef管理されたプロバイダーの `apiKey` 値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env参照では `ENV_VAR_NAME`、file/exec参照では `secretref-managed`）から更新されます。
- SecretRef管理されたプロバイダーヘッダー値は、ソースマーカー（env参照では `secretref-env:ENV_VAR_NAME`、file/exec参照では `secretref-managed`）から更新されます。
- エージェントの `apiKey`/`baseUrl` が空または存在しない場合は、設定の `models.providers` にフォールバックします。
- その他のプロバイダーフィールドは、設定および正規化されたカタログデータから更新されます。

マーカーの永続化はソースを正とします。OpenClawは、解決済みのランタイムシークレット値ではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。
これは、`openclaw agent` のようなコマンド駆動パスを含め、OpenClawが `models.json` を再生成するたびに適用されます。

## 関連

- [Model Providers](/ja-JP/concepts/model-providers) — プロバイダールーティングと認証
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [Image Generation](/ja-JP/tools/image-generation) — 画像モデル設定
- [Music Generation](/ja-JP/tools/music-generation) — 音楽モデル設定
- [Video Generation](/ja-JP/tools/video-generation) — 動画モデル設定
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
