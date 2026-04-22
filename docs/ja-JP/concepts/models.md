---
read_when:
    - Models CLI（`models list` / `set` / `scan` / `aliases` / `fallbacks`）の追加または変更
    - モデルのフォールバック動作または選択UXの変更
    - モデルスキャンプローブ（tools/images）の更新
summary: 'Models CLI: 一覧、設定、エイリアス、フォールバック、スキャン、ステータス'
title: Models CLI
x-i18n:
    generated_at: "2026-04-22T04:22:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# Models CLI

認証プロファイルのローテーション、クールダウン、およびそれらがフォールバックとどう連携するかについては[/concepts/model-failover](/ja-JP/concepts/model-failover)を参照してください。
providerの概要と例については[/concepts/model-providers](/ja-JP/concepts/model-providers)を参照してください。

## モデル選択の仕組み

OpenClawは次の順序でモデルを選択します。

1. **Primary**モデル（`agents.defaults.model.primary`または`agents.defaults.model`）。
2. `agents.defaults.model.fallbacks`内の**フォールバック**（順番どおり）。
3. **provider認証フェイルオーバー**は、次のモデルへ進む前にprovider内部で発生します。

関連項目:

- `agents.defaults.models`は、OpenClawが使用できるモデルの許可リスト/カタログです（エイリアスを含む）。
- `agents.defaults.imageModel`は、Primaryモデルが画像を受け取れない**場合にのみ**使用されます。
- `agents.defaults.pdfModel`は`pdf`ツールで使用されます。省略した場合、このツールは`agents.defaults.imageModel`、その後に解決済みのセッション/デフォルトモデルへフォールバックします。
- `agents.defaults.imageGenerationModel`は、共通の画像生成機能サーフェスで使用されます。省略した場合でも、`image_generate`は認証付きproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、登録済みの残りの画像生成providerをprovider-id順で試します。特定のprovider/modelを設定する場合は、そのproviderのauth/API keyも設定してください。
- `agents.defaults.musicGenerationModel`は、共通の音楽生成機能サーフェスで使用されます。省略した場合でも、`music_generate`は認証付きproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、登録済みの残りの音楽生成providerをprovider-id順で試します。特定のprovider/modelを設定する場合は、そのproviderのauth/API keyも設定してください。
- `agents.defaults.videoGenerationModel`は、共通の動画生成機能サーフェスで使用されます。省略した場合でも、`video_generate`は認証付きproviderのデフォルトを推論できます。まず現在のデフォルトproviderを試し、その後、登録済みの残りの動画生成providerをprovider-id順で試します。特定のprovider/modelを設定する場合は、そのproviderのauth/API keyも設定してください。
- エージェントごとのデフォルトは、`agents.list[].model`とバインディングにより`agents.defaults.model`を上書きできます（[/concepts/multi-agent](/ja-JP/concepts/multi-agent)を参照）。

## クイックモデルポリシー

- Primaryには、利用可能な中で最も強力な最新世代モデルを設定してください。
- コスト/レイテンシ重視のタスクや重要度の低いチャットにはフォールバックを使ってください。
- ツール対応エージェントや信頼できない入力を扱う場合は、古い/弱いモデル階層を避けてください。

## オンボーディング（推奨）

設定を手作業で編集したくない場合は、オンボーディングを実行してください。

```bash
openclaw onboard
```

一般的なprovider向けに、モデルとauthをセットアップできます。これには**OpenAI Code (Codex) subscription**（OAuth）および**Anthropic**（API keyまたはClaude CLI）が含まれます。

## 設定キー（概要）

- `agents.defaults.model.primary`と`agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary`と`agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary`と`agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary`と`agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary`と`agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + エイリアス + providerパラメーター）
- `models.providers`（`models.json`に書き込まれるカスタムprovider）

モデル参照は小文字に正規化されます。`z.ai/*`のようなproviderエイリアスは`zai/*`に正規化されます。

provider設定の例（OpenCodeを含む）は[/providers/opencode](/ja-JP/providers/opencode)にあります。

## 「Model is not allowed」（および返信が止まる理由）

`agents.defaults.models`が設定されている場合、それは`/model`およびセッション上書きに対する**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、OpenClawは次を返します。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の返信が生成される**前**に発生するため、「応答しなかった」ように感じられることがあります。修正方法は次のいずれかです。

- モデルを`agents.defaults.models`に追加する
- 許可リストをクリアする（`agents.defaults.models`を削除する）
- `/model list`からモデルを選ぶ

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

## チャット内でのモデル切り替え（`/model`）

再起動せずに現在のセッションのモデルを切り替えられます。

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

注意:

- `/model`（および`/model list`）は、コンパクトな番号付きピッカーです（モデルファミリー + 利用可能なprovider）。
- Discordでは、`/model`と`/models`で、providerとモデルのドロップダウン、およびSubmitステップを備えたインタラクティブピッカーが開きます。
- `/model <#>`はそのピッカーから選択します。
- `/model`は、新しいセッション選択を即座に永続化します。
- エージェントがアイドル状態なら、次の実行ですぐに新しいモデルが使われます。
- 実行がすでにアクティブな場合、OpenClawはライブ切り替えを保留としてマークし、適切な再試行ポイントでのみ新しいモデルに再起動します。
- ツール処理や返信出力がすでに始まっている場合、その保留中の切り替えは後の再試行機会または次のユーザーターンまで待機することがあります。
- `/model status`は詳細表示です（auth候補、および設定されている場合はproviderエンドポイントの`baseUrl` + `api`モード）。
- モデル参照は**最初の**`/`で分割して解析されます。`/model <ref>`を入力する際は`provider/model`を使用してください。
- モデルID自体に`/`が含まれる場合（OpenRouter形式など）は、providerプレフィックスを含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
- providerを省略した場合、OpenClawは次の順序で入力を解決します。
  1. エイリアス一致
  2. その完全なプレフィックスなしモデルidに対する、一意のconfigured-provider一致
  3. configured default providerへの非推奨フォールバック  
     そのproviderが設定済みのデフォルトモデルをもう公開していない場合、OpenClawは、古い削除済みproviderデフォルトを見せないよう、代わりに最初に設定されたprovider/modelへフォールバックします。

完全なコマンド動作/設定: [Slash commands](/ja-JP/tools/slash-commands)。

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
- `--local`: ローカルproviderのみ
- `--provider <name>`: providerで絞り込み
- `--plain`: 1行に1モデル
- `--json`: 機械可読な出力

`--all`には、authが設定される前でも、bundledなprovider所有の静的カタログ行が含まれるため、ディスカバリー専用ビューで、対応するprovider認証情報を追加するまで利用できないモデルが表示されることがあります。

### `models status`

解決済みのPrimaryモデル、フォールバック、画像モデル、および設定済みproviderのauth概要を表示します。また、authストア内で見つかったプロファイルのOAuth有効期限ステータスも表示します（デフォルトでは24時間以内に警告）。`--plain`は解決済みのPrimaryモデルのみを出力します。
OAuthステータスは常に表示され（`--json`出力にも含まれます）、設定済みproviderに認証情報がない場合、`models status`は**Missing auth**セクションを出力します。
JSONには`auth.oauth`（警告ウィンドウ + プロファイル）と`auth.providers`（envベースの認証情報を含む、providerごとの実効auth）が含まれます。`auth.oauth`はauthストア内プロファイルの健全性のみであり、envのみのproviderはそこには表示されません。
自動化には`--check`を使用してください（missing/expiredなら終了コード`1`、期限切れ間近なら`2`）。
ライブauthチェックには`--probe`を使用してください。probe行はauthプロファイル、env認証情報、または`models.json`から来る場合があります。
明示的な`auth.order.<provider>`が保存済みプロファイルを省略している場合、probeはそれを試す代わりに`excluded_by_auth_order`を報告します。authが存在しても、そのproviderに対してprobe可能なモデルを解決できない場合、probeは`status: no_model`を報告します。

authの選択はprovider/アカウント依存です。常時稼働のGatewayホストでは、通常はAPI keyが最も予測しやすい選択です。Claude CLIの再利用や、既存のAnthropic OAuth/tokenプロファイルもサポートされています。

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter freeモデル）

`openclaw models scan`はOpenRouterの**free model catalog**を調べ、必要に応じてモデルのtools対応と画像対応をprobeできます。

主なフラグ:

- `--no-probe`: ライブprobeをスキップ（メタデータのみ）
- `--min-params <b>`: 最小パラメーターサイズ（十億単位）
- `--max-age-days <days>`: 古いモデルをスキップ
- `--provider <name>`: providerプレフィックスで絞り込み
- `--max-candidates <n>`: フォールバックリストのサイズ
- `--set-default`: `agents.defaults.model.primary`を最初の選択に設定
- `--set-image`: `agents.defaults.imageModel.primary`を最初の画像選択に設定

probeにはOpenRouter API key（authプロファイルまたは`OPENROUTER_API_KEY`から）が必要です。キーがない場合は、候補一覧のみを表示するために`--no-probe`を使用してください。

スキャン結果は次の順序でランク付けされます。

1. 画像対応
2. ツールレイテンシ
3. コンテキストサイズ
4. パラメーター数

入力

- OpenRouterの`/models`一覧（`:free`でフィルタ）
- authプロファイルまたは`OPENROUTER_API_KEY`からのOpenRouter API keyが必要（[/environment](/ja-JP/help/environment)を参照）
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- probe制御: `--timeout`、`--concurrency`

TTYで実行すると、対話的にフォールバックを選択できます。非対話モードでは、デフォルトを受け入れるために`--yes`を渡してください。

## Models registry（`models.json`）

`models.providers`内のカスタムproviderは、agentディレクトリ配下の`models.json`に書き込まれます（デフォルトは`~/.openclaw/agents/<agentId>/agent/models.json`）。このファイルは、`models.mode`が`replace`に設定されていない限り、デフォルトでマージされます。

一致するprovider IDに対するマージモードの優先順位:

- agentの`models.json`にすでに存在する空でない`baseUrl`が優先されます。
- agentの`models.json`内の空でない`apiKey`は、そのproviderが現在のconfig/auth-profileコンテキストでSecretRef管理されていない場合にのみ優先されます。
- SecretRef管理されたproviderの`apiKey`値は、解決済みシークレットを永続化する代わりに、ソースマーカー（env参照なら`ENV_VAR_NAME`、file/exec参照なら`secretref-managed`）から更新されます。
- SecretRef管理されたprovider header値は、ソースマーカー（env参照なら`secretref-env:ENV_VAR_NAME`、file/exec参照なら`secretref-managed`）から更新されます。
- agentの`apiKey`/`baseUrl`が空または欠けている場合は、configの`models.providers`へフォールバックします。
- その他のproviderフィールドは、configおよび正規化済みカタログデータから更新されます。

マーカーの永続化はソースを正とします。OpenClawは、解決済みランタイムシークレット値ではなく、アクティブなソースconfigスナップショット（解決前）からマーカーを書き込みます。
これは、`openclaw agent`のようなコマンド駆動パスを含め、OpenClawが`models.json`を再生成するたびに適用されます。

## 関連

- [Model Providers](/ja-JP/concepts/model-providers) — providerルーティングとauth
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [Image Generation](/ja-JP/tools/image-generation) — 画像モデル設定
- [Music Generation](/ja-JP/tools/music-generation) — 音楽モデル設定
- [Video Generation](/ja-JP/tools/video-generation) — 動画モデル設定
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
