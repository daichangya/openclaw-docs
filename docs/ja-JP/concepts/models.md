---
read_when:
    - モデル CLI の追加または変更（models list/set/scan/aliases/fallbacks）
    - モデルのフォールバック動作または選択 UX を変更する
    - モデルスキャンプローブ（tools/images）の更新
summary: 'Models CLI: list、set、aliases、fallbacks、scan、status'
title: モデル CLI
x-i18n:
    generated_at: "2026-04-25T13:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

[モデルフェイルオーバー](/ja-JP/concepts/model-failover) を参照して、auth profile の
ローテーション、クールダウン、およびそれがフォールバックとどう相互作用するかを確認してください。  
簡単な provider 概要と例: [/concepts/model-providers](/ja-JP/concepts/model-providers)。  
モデル ref は provider と model を選択します。通常、低レベルの
エージェントランタイムは選択しません。たとえば、`openai/gpt-5.5` は
通常の OpenAI provider パス経由でも、Codex app-server ランタイム経由でも実行できます。どちらになるかは
`agents.defaults.embeddedHarness.runtime` に依存します。参照:
[/concepts/agent-runtimes](/ja-JP/concepts/agent-runtimes)。

## モデル選択の仕組み

OpenClaw は次の順序でモデルを選択します。

1. **Primary** モデル（`agents.defaults.model.primary` または `agents.defaults.model`）。
2. `agents.defaults.model.fallbacks` 内の**フォールバック**（順番どおり）。
3. **Provider auth フェイルオーバー** は、次のモデルへ移る前に
   provider 内部で発生します。

関連:

- `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト/カタログです（alias を含む）。
- `agents.defaults.imageModel` は、primary モデルが画像を受け取れない**場合のみ**使用されます。
- `agents.defaults.pdfModel` は `pdf` ツールで使用されます。省略した場合、このツールは
  `agents.defaults.imageModel`、続いて解決済みのセッション/デフォルト
  モデルへフォールバックします。
- `agents.defaults.imageGenerationModel` は共有画像生成機能で使用されます。省略した場合でも、`image_generate` は auth が設定された provider のデフォルトを推論できます。現在のデフォルト provider を最初に試し、その後、登録済みの残りの画像生成 provider を provider-id 順で試します。特定の provider/model を設定する場合は、その provider の auth/API key も設定してください。
- `agents.defaults.musicGenerationModel` は共有音楽生成機能で使用されます。省略した場合でも、`music_generate` は auth が設定された provider のデフォルトを推論できます。現在のデフォルト provider を最初に試し、その後、登録済みの残りの音楽生成 provider を provider-id 順で試します。特定の provider/model を設定する場合は、その provider の auth/API key も設定してください。
- `agents.defaults.videoGenerationModel` は共有動画生成機能で使用されます。省略した場合でも、`video_generate` は auth が設定された provider のデフォルトを推論できます。現在のデフォルト provider を最初に試し、その後、登録済みの残りの動画生成 provider を provider-id 順で試します。特定の provider/model を設定する場合は、その provider の auth/API key も設定してください。
- エージェントごとのデフォルトは、`agents.list[].model` とバインディングを通じて `agents.defaults.model` を上書きできます（[/concepts/multi-agent](/ja-JP/concepts/multi-agent) を参照）。

## クイックモデルポリシー

- primary には、利用可能な中で最も強力な最新世代モデルを設定してください。
- コスト/レイテンシ重視のタスクや重要度の低いチャットにはフォールバックを使用してください。
- ツール有効エージェントや信頼できない入力に対しては、古い/弱いモデル tier は避けてください。

## オンボーディング（推奨）

設定を手動編集したくない場合は、オンボーディングを実行してください。

```bash
openclaw onboard
```

これにより、一般的な provider 向けの model + auth をセットアップできます。これには **OpenAI Code (Codex)
subscription**（OAuth）および **Anthropic**（API key または Claude CLI）が含まれます。

## 設定キー（概要）

- `agents.defaults.model.primary` と `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` と `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` と `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` と `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` と `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models`（許可リスト + alias + provider params）
- `models.providers`（`models.json` に書き込まれるカスタム provider）

モデル ref は小文字に正規化されます。`z.ai/*` のような provider alias は
`zai/*` に正規化されます。

OpenCode を含む provider 設定例は
[/providers/opencode](/ja-JP/providers/opencode) にあります。

### 安全な許可リスト編集

`agents.defaults.models` を手動更新する場合は、加算的な書き込みを使用してください。

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` は、モデル/provider map を誤った上書きから保護します。  
`agents.defaults.models`、`models.providers`、または
`models.providers.<id>.models` への通常のオブジェクト代入は、
既存エントリを削除する場合は拒否されます。加算的変更には `--merge` を使用し、
指定値を完全な対象値にしたい場合にのみ `--replace` を使用してください。

対話的な provider セットアップと `openclaw configure --section model` でも、
既存の許可リストに provider スコープの選択をマージするため、Codex、
Ollama、または他の provider を追加しても無関係なモデルエントリは失われません。  
configure は、provider auth が再適用されても既存の `agents.defaults.model.primary` を保持します。  
`openclaw models auth login --provider <id> --set-default` や
`openclaw models set <model>` のような明示的なデフォルト設定コマンドは、引き続き `agents.defaults.model.primary` を置き換えます。

## 「Model is not allowed」（そして返信が止まる理由）

`agents.defaults.models` が設定されている場合、それは `/model` と
セッション上書きに対する**許可リスト**になります。ユーザーがその許可リストにないモデルを選択すると、
OpenClaw は次を返します。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の返信が生成される**前**に発生するため、
「返信しなかった」ように感じられることがあります。修正方法は次のいずれかです。

- モデルを `agents.defaults.models` に追加する
- 許可リストをクリアする（`agents.defaults.models` を削除する）
- `/model list` からモデルを選ぶ

許可リスト設定例:

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

- `/model`（および `/model list`）は、コンパクトな番号付き picker です（モデル family + 利用可能な provider）。
- Discord では、`/model` と `/models` は、provider と model のドロップダウンおよび Submit ステップを備えた対話型 picker を開きます。
- `/models add` は非推奨であり、チャットからモデルを登録する代わりに非推奨メッセージを返すようになりました。
- `/model <#>` はその picker から選択します。
- `/model` は新しいセッション選択を即座に永続化します。
- エージェントが idle の場合、次の実行ですぐに新しいモデルが使用されます。
- すでに実行がアクティブな場合、OpenClaw はライブ切り替えを pending としてマークし、クリーンなリトライポイントでのみ新しいモデルへ再起動します。
- ツールアクティビティまたは返信出力がすでに開始している場合、pending 切り替えは、後のリトライ機会または次のユーザーターンまでキューに残ることがあります。
- `/model status` は詳細ビューです（auth 候補と、設定されている場合は provider endpoint の `baseUrl` + `api` mode）。
- モデル ref は**最初の** `/` で分割して解析されます。`/model <ref>` を入力するときは `provider/model` を使用してください。
- モデル ID 自体に `/` が含まれる場合（OpenRouter スタイル）、provider prefix を含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
- provider を省略した場合、OpenClaw は次の順で入力を解決します。
  1. alias 一致
  2. その正確な prefix なし model id に対する、一意な configured-provider 一致
  3. configured default provider への非推奨フォールバック  
     その provider が設定済みデフォルトモデルをもう公開していない場合、OpenClaw
     は、古い削除済み provider デフォルトを見せないように、
     代わりに最初の configured provider/model にフォールバックします。

完全なコマンド動作/設定: [Slash commands](/ja-JP/tools/slash-commands)。

## CLI コマンド

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
- `--local`: ローカル provider のみ
- `--provider <id>`: provider id でフィルター。たとえば `moonshot`。対話型 picker の表示
  ラベルは受け付けられません
- `--plain`: 1 行に 1 モデル
- `--json`: 機械可読出力

`--all` には、auth がまだ設定されていない段階でも、バンドル済みの provider 管理静的カタログ行が含まれます。そのため、発見専用ビューでは、対応する provider 認証情報を追加するまで利用できないモデルも表示できます。

### `models status`

解決済みの primary モデル、フォールバック、image model、および
設定済み provider の auth 概要を表示します。また、auth store 内で見つかった profile の OAuth 失効状態も表示します
（デフォルトでは 24 時間以内に警告）。`--plain` は解決済み primary モデルのみを出力します。  
OAuth ステータスは常に表示され（`--json` 出力にも含まれます）。設定済み
provider に認証情報がない場合、`models status` は **Missing auth** セクションを表示します。  
JSON には `auth.oauth`（警告ウィンドウ + profiles）と `auth.providers`
（env ベース認証情報を含む provider ごとの有効 auth）が含まれます。`auth.oauth`
は auth-store profile の健全性のみです。env-only provider はそこには表示されません。  
自動化には `--check` を使用してください（missing/expired なら exit `1`、expiring なら `2`）。  
ライブ auth チェックには `--probe` を使用してください。probe 行は auth profile、env
認証情報、または `models.json` から取得できます。  
明示的な `auth.order.<provider>` が保存済み profile を省略している場合、probe は
それを試す代わりに `excluded_by_auth_order` を報告します。auth が存在してもその provider に対して probe 可能な model を解決できない場合、probe は `status: no_model` を報告します。

auth の選択は provider/account に依存します。常時稼働の gateway host では、
通常 API key が最も予測可能です。Claude CLI の再利用や既存の Anthropic
OAuth/token profile もサポートされています。

例（Claude CLI）:

```bash
claude auth login
openclaw models status
```

## スキャン（OpenRouter free models）

`openclaw models scan` は OpenRouter の **free model catalog** を調査し、
必要に応じてツールおよび画像サポートについてモデルを probe できます。

主なフラグ:

- `--no-probe`: ライブ probe をスキップ（メタデータのみ）
- `--min-params <b>`: 最小パラメータサイズ（10 億単位）
- `--max-age-days <days>`: 古いモデルをスキップ
- `--provider <name>`: provider prefix フィルター
- `--max-candidates <n>`: フォールバックリストサイズ
- `--set-default`: `agents.defaults.model.primary` を最初の選択に設定
- `--set-image`: `agents.defaults.imageModel.primary` を最初の画像選択に設定

OpenRouter の `/models` カタログは公開されているため、メタデータのみのスキャンでは
キーなしで free 候補を一覧できます。probe と推論には引き続き
OpenRouter API key（auth profile または `OPENROUTER_API_KEY` 由来）が必要です。キーが
利用できない場合、`openclaw models scan` はメタデータのみの出力へフォールバックし、設定は変更しません。メタデータのみモードを明示的に要求するには `--no-probe` を使用してください。

スキャン結果は次の順にランキングされます。

1. 画像サポート
2. ツールレイテンシ
3. コンテキストサイズ
4. パラメータ数

入力

- OpenRouter `/models` 一覧（`:free` フィルター）
- ライブ probe には、auth profile または `OPENROUTER_API_KEY` からの OpenRouter API key が必要です（[/environment](/ja-JP/help/environment) を参照）
- 任意のフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- リクエスト/probe 制御: `--timeout`、`--concurrency`

TTY でライブ probe を実行すると、フォールバックを対話的に選択できます。  
非対話モードでは、デフォルトを受け入れるために `--yes` を渡してください。メタデータのみの結果は
情報提供用です。`--set-default` と `--set-image` はライブ probe を必要とするため、
OpenClaw はキーのない使用不能な OpenRouter モデルを設定しません。

## モデルレジストリ（`models.json`）

`models.providers` 内のカスタム provider は、agent ディレクトリ配下の `models.json` に書き込まれます
（デフォルトは `~/.openclaw/agents/<agentId>/agent/models.json`）。このファイルは、
`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

一致する provider ID に対するマージモードの優先順位:

- agent の `models.json` にすでに存在する空でない `baseUrl` が優先されます。
- agent の `models.json` にある空でない `apiKey` は、その provider が現在の config/auth-profile コンテキストで SecretRef 管理されていない場合にのみ優先されます。
- SecretRef 管理の provider `apiKey` 値は、解決済みシークレットを永続化するのではなく、ソースマーカー（env ref の場合は `ENV_VAR_NAME`、file/exec ref の場合は `secretref-managed`）から更新されます。
- SecretRef 管理の provider header 値は、ソースマーカー（env ref の場合は `secretref-env:ENV_VAR_NAME`、file/exec ref の場合は `secretref-managed`）から更新されます。
- 空または欠落している agent の `apiKey`/`baseUrl` は、config の `models.providers` にフォールバックします。
- その他の provider フィールドは、config と正規化されたカタログデータから更新されます。

マーカーの永続化はソース権威です。OpenClaw は、解決済みのランタイムシークレット値ではなく、アクティブなソース設定スナップショット（解決前）からマーカーを書き込みます。  
これは、`openclaw agent` のようなコマンド駆動の経路を含め、OpenClaw が `models.json` を再生成するたびに適用されます。

## 関連

- [Model Providers](/ja-JP/concepts/model-providers) — provider ルーティングと auth
- [Agent Runtimes](/ja-JP/concepts/agent-runtimes) — PI、Codex、およびその他のエージェントループランタイム
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーン
- [Image Generation](/ja-JP/tools/image-generation) — 画像モデル設定
- [Music Generation](/ja-JP/tools/music-generation) — 音楽モデル設定
- [Video Generation](/ja-JP/tools/video-generation) — 動画モデル設定
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
