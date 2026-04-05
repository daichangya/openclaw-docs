---
read_when:
    - models CLI（models list/set/scan/aliases/fallbacks）の追加または変更を行う場合
    - モデルのフォールバック動作または選択UXを変更する場合
    - モデルスキャンのプローブ（tools/images）を更新する場合
summary: 'Models CLI: list、set、aliases、fallbacks、scan、status'
title: Models CLI
x-i18n:
    generated_at: "2026-04-05T12:42:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

認証プロファイルのローテーション、クールダウン、およびそれらがフォールバックとどう相互作用するかについては、[/concepts/model-failover](/concepts/model-failover)を参照してください。
プロバイダーの概要と例については、[/concepts/model-providers](/concepts/model-providers)を参照してください。

## モデル選択の仕組み

OpenClawは次の順序でモデルを選択します:

1. **Primary**モデル（`agents.defaults.model.primary`または`agents.defaults.model`）。
2. `agents.defaults.model.fallbacks`内の**Fallbacks**（順番どおり）。
3. **プロバイダー認証のフェイルオーバー**は、次のモデルに移る前にプロバイダー内で発生します。

関連:

- `agents.defaults.models`は、OpenClawが使用できるモデルの許可リスト/カタログです（エイリアスを含む）。
- `agents.defaults.imageModel`は、Primaryモデルが画像を受け付けられない**場合にのみ**使用されます。
- `agents.defaults.pdfModel`は`pdf`ツールで使用されます。省略した場合、このツールは`agents.defaults.imageModel`、次に解決済みのセッション/デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel`は、共有画像生成機能で使用されます。省略した場合でも、`image_generate`は認証済みプロバイダーのデフォルトを推測できます。最初に現在のデフォルトプロバイダーを試し、その後、登録済みの残りの画像生成プロバイダーをprovider-id順に試します。特定のprovider/modelを設定する場合は、そのプロバイダーの認証/APIキーも設定してください。
- `agents.defaults.videoGenerationModel`は、共有動画生成機能で使用されます。画像生成とは異なり、これは現在プロバイダーのデフォルトを推測しません。`qwen/wan2.6-t2v`のような明示的な`provider/model`を設定し、そのプロバイダーの認証/APIキーも設定してください。
- エージェントごとのデフォルトは、`agents.list[].model`とバインディングによって`agents.defaults.model`を上書きできます（[/concepts/multi-agent](/concepts/multi-agent)を参照）。

## クイックモデルポリシー

- Primaryには、利用可能な中で最も強力な最新世代モデルを設定してください。
- フォールバックは、コスト/レイテンシ重視のタスクや、重要度の低いチャットに使用してください。
- ツール対応エージェントや信頼できない入力では、古い/弱いモデル層は避けてください。

## オンボーディング（推奨）

設定を手動編集したくない場合は、オンボーディングを実行してください:

```bash
openclaw onboard
```

これにより、一般的なプロバイダー向けのモデルと認証を設定できます。これには**OpenAI Code (Codex) subscription**（OAuth）と**Anthropic**（APIキーまたはClaude CLI）が含まれます。

## 設定キー（概要）

- `agents.defaults.model.primary`と`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary`と`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary`と`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary`と`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary`と`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + プロバイダーパラメーター）
- `models.providers`（`models.json`に書き込まれるカスタムプロバイダー）

モデル参照は小文字に正規化されます。`z.ai/*`のようなプロバイダーエイリアスは`zai/*`に正規化されます。

OpenCodeを含むプロバイダー設定例は、[/providers/opencode](/providers/opencode)にあります。

## 「Model is not allowed」（および応答が止まる理由）

`agents.defaults.models`が設定されている場合、これは`/model`およびセッションオーバーライドの**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、OpenClawは次を返します:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の応答が生成される**前**に発生するため、メッセージに「応答しなかった」ように感じられることがあります。修正方法は次のいずれかです:

- モデルを`agents.defaults.models`に追加する
- 許可リストをクリアする（`agents.defaults.models`を削除する）
- `/model list`からモデルを選択する

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

再起動せずに現在のセッションのモデルを切り替えられます:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

注記:

- `/model`（および`/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能なプロバイダー）。
- Discordでは、`/model`と`/models`で、プロバイダーとモデルのドロップダウン、およびSubmitステップを含むインタラクティブピッカーが開きます。
- `/model <#>`は、そのピッカーから選択します。
- `/model`は、新しいセッション選択を即座に永続化します。
- エージェントがアイドル状態なら、次回実行時にすぐ新しいモデルが使われます。
- 実行がすでにアクティブな場合、OpenClawはライブ切り替えを保留としてマークし、正常なリトライポイントでのみ新しいモデルに再始動します。
- ツール処理または応答出力がすでに始まっている場合、この保留中の切り替えは、後のリトライ機会または次のユーザーターンまでキューに残ることがあります。
- `/model status`は詳細表示です（認証候補、および設定されている場合はプロバイダーエンドポイントの`baseUrl` + `api`モード）。
- モデル参照は**最初の**`/`で分割して解析されます。`/model <ref>`を入力する際は`provider/model`を使用してください。
- モデルID自体に`/`が含まれる場合（OpenRouterスタイル）、プロバイダープレフィックスを含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClawは次の順序で入力を解決します:
  1. エイリアス一致
  2. その完全一致のプレフィックスなしモデルidに対する、一意の設定済みプロバイダー一致
  3. 設定済みデフォルトプロバイダーへの非推奨フォールバック  
     そのプロバイダーが設定済みデフォルトモデルをもう公開していない場合、OpenClawは古い削除済みプロバイダーデフォルトを表面化しないように、代わりに最初の設定済みprovider/modelへフォールバックします。

完全なコマンド動作/設定: [スラッシュコマンド](/tools/slash-commands)。

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

`openclaw models`（サブコマンドなし）は`models status`のショートカットです。

### `models list`

デフォルトでは設定済みモデルを表示します。便利なフラグ:

- `--all`: 完全なカタログ
- `--local`: ローカルプロバイダーのみ
- `--provider <name>`: プロバイダーで絞り込み
- `--plain`: 1行に1モデル
- `--json`: 機械可読出力

### `models status`

解決済みのPrimaryモデル、Fallbacks、画像モデル、および設定済みプロバイダーの認証概要を表示します。また、認証ストアで見つかったプロファイルのOAuth有効期限状態も表示します（デフォルトでは24時間以内に期限切れになるものを警告）。`--plain`は解決済みのPrimaryモデルのみを出力します。
OAuth状態は常に表示され（`--json`出力にも含まれます）、設定済みプロバイダーに認証情報がない場合、`models status`は**Missing auth**セクションを表示します。
JSONには`auth.oauth`（警告ウィンドウ + プロファイル）および`auth.providers`（プロバイダーごとの有効な認証）が含まれます。
自動化には`--check`を使用してください（不足/期限切れで終了コード`1`、期限切れ間近で`2`）。
ライブ認証チェックには`--probe`を使用してください。プローブ行は、認証プロファイル、環境変数認証情報、または`models.json`から取得されることがあります。
明示的な`auth.order.<provider>`が保存済みプロファイルを省略している場合、プローブはそれを試す代わりに`excluded_by_auth_order`を報告します。認証は存在しても、そのプロバイダーに対してプローブ可能なモデルを解決できない場合、プローブは`status: no_model`を報告します。

認証の選択はプロバイダー/アカウントに依存します。常時稼働のGatewayホストでは、通常APIキーが最も予測しやすく、Claude CLIの再利用や既存のAnthropic OAuth/トークンプロファイルもサポートされます。

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter無料モデル）

`openclaw models scan`はOpenRouterの**無料モデルカタログ**を調べ、任意でモデルのtoolおよび画像サポートをプローブできます。

主なフラグ:

- `--no-probe`: ライブプローブをスキップ（メタデータのみ）
- `--min-params <b>`: 最小パラメーターサイズ（十億単位）
- `--max-age-days <days>`: 古いモデルをスキップ
- `--provider <name>`: プロバイダープレフィックスで絞り込み
- `--max-candidates <n>`: フォールバックリストのサイズ
- `--set-default`: `agents.defaults.model.primary`を最初の選択に設定
- `--set-image`: `agents.defaults.imageModel.primary`を最初の画像選択に設定

プローブにはOpenRouter APIキー（認証プロファイルまたは`OPENROUTER_API_KEY`から）が必要です。キーがない場合は、候補のみを一覧表示するために`--no-probe`を使用してください。

スキャン結果は次の順でランク付けされます:

1. 画像サポート
2. ツールのレイテンシ
3. コンテキストサイズ
4. パラメーター数

入力

- OpenRouterの`/models`リスト（`:free`でフィルター）
- 認証プロファイルまたは`OPENROUTER_API_KEY`からのOpenRouter APIキーが必要です（[/environment](/help/environment)を参照）
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- プローブ制御: `--timeout`、`--concurrency`

TTYで実行すると、対話的にフォールバックを選択できます。非対話モードでは、デフォルトを受け入れるために`--yes`を渡してください。

## モデルレジストリ（`models.json`）

`models.providers`内のカスタムプロバイダーは、エージェントディレクトリ配下の`models.json`に書き込まれます（デフォルト: `~/.openclaw/agents/<agentId>/agent/models.json`）。このファイルは、`models.mode`が`replace`に設定されていない限り、デフォルトでマージされます。

一致するプロバイダーIDに対するマージモードの優先順位:

- エージェントの`models.json`にすでに存在する空でない`baseUrl`が優先されます。
- エージェントの`models.json`内の空でない`apiKey`は、そのプロバイダーが現在のconfig/auth-profileコンテキストでSecretRef管理されていない場合にのみ優先されます。
- SecretRef管理プロバイダーの`apiKey`値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env参照では`ENV_VAR_NAME`、file/exec参照では`secretref-managed`）から更新されます。
- SecretRef管理プロバイダーのヘッダー値は、ソースマーカー（env参照では`secretref-env:ENV_VAR_NAME`、file/exec参照では`secretref-managed`）から更新されます。
- 空または欠落しているエージェントの`apiKey`/`baseUrl`は、configの`models.providers`にフォールバックします。
- その他のプロバイダーフィールドは、configと正規化されたカタログデータから更新されます。

マーカーの永続化はソースが権威です。OpenClawは、解決済みランタイムシークレット値からではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。
これは、`openclaw agent`のようなコマンド駆動パスを含め、OpenClawが`models.json`を再生成するたびに適用されます。

## 関連

- [モデルプロバイダー](/concepts/model-providers) — プロバイダールーティングと認証
- [モデルフェイルオーバー](/concepts/model-failover) — フォールバックチェーン
- [画像生成](/tools/image-generation) — 画像モデル設定
- [設定リファレンス](/gateway/configuration-reference#agent-defaults) — モデル設定キー
