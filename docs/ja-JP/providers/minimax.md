---
read_when:
    - OpenClawでMiniMax modelを使いたい
    - MiniMaxのセットアップ手順が必要
summary: OpenClawでMiniMax modelを使う
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T12:54:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

OpenClawのMiniMax providerは、デフォルトで**MiniMax M2.7**を使用します。

MiniMaxは次の機能も提供します。

- T2A v2によるバンドル済みspeech synthesis
- `MiniMax-VL-01` によるバンドル済みimage understanding
- MiniMax Coding Plan search API経由のバンドル済み `web_search`

Providerの分割:

- `minimax`: API-key text provider。これに加えて、バンドル済みimage generation、image understanding、speech、web searchを提供
- `minimax-portal`: OAuth text provider。これに加えて、バンドル済みimage generationとimage understandingを提供

## Modelラインアップ

- `MiniMax-M2.7`: デフォルトのホスト型reasoning model。
- `MiniMax-M2.7-highspeed`: より高速なM2.7 reasoning tier。
- `image-01`: image generation model（生成とimage-to-image編集）。

## Image generation

MiniMax pluginは、`image_generate` tool向けに `image-01` modelを登録します。サポート内容:

- アスペクト比制御付きの**text-to-image generation**。
- アスペクト比制御付きの**image-to-image editing**（subject reference）。
- 1リクエストあたり最大**9枚の出力画像**。
- 編集リクエストあたり最大**1枚の参照画像**。
- 対応アスペクト比: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`。

MiniMaxをimage generationに使うには、image generation providerとして設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

pluginは、text modelと同じ `MINIMAX_API_KEY` またはOAuth認証を使います。MiniMaxがすでにセットアップ済みなら、追加設定は不要です。

`minimax` と `minimax-portal` はどちらも、同じ
`image-01` modelで `image_generate` を登録します。API-key構成では `MINIMAX_API_KEY` を使い、OAuth構成では
バンドルされた `minimax-portal` 認証経路を代わりに使えます。

onboardingまたはAPI-keyセットアップが明示的な `models.providers.minimax`
エントリーを書き込むとき、OpenClawは `MiniMax-M2.7` と
`MiniMax-M2.7-highspeed` を `input: ["text", "image"]` 付きで具体化します。

組み込みのバンドル済みMiniMax text catalog自体は、その明示的provider configが存在するまではtext-only metadataのままです。image understandingは、plugin所有の `MiniMax-VL-01` media providerを通じて別途公開されます。

## Image understanding

MiniMax pluginは、text
catalogとは別にimage understandingを登録します。

- `minimax`: デフォルトimage modelは `MiniMax-VL-01`
- `minimax-portal`: デフォルトimage modelは `MiniMax-VL-01`

そのため、バンドル済みtext-provider catalogが依然としてtext-onlyのM2.7 chat refを示していても、自動media routingではMiniMax image understandingを使えます。

## Web search

MiniMax pluginは、MiniMax Coding Plan
search APIを通じて `web_search` も登録します。

- Provider id: `minimax`
- 構造化結果: title、URL、snippet、related query
- 推奨env var: `MINIMAX_CODE_PLAN_KEY`
- 受け入れられるenv alias: `MINIMAX_CODING_API_KEY`
- 互換性フォールバック: それがすでにcoding-plan tokenを指している場合の `MINIMAX_API_KEY`
- Region再利用: `plugins.entries.minimax.config.webSearch.region`、次に `MINIMAX_API_HOST`、次にMiniMax provider base URL
- 検索はprovider id `minimax` のままです。OAuth CN/globalセットアップでも、`models.providers.minimax-portal.baseUrl` を通じて間接的にregionを誘導できます

configは `plugins.entries.minimax.config.webSearch.*` の下にあります。
[MiniMax Search](/tools/minimax-search) を参照してください。

## セットアップを選ぶ

### MiniMax OAuth（Coding Plan）- 推奨

**最適な用途:** MiniMax Coding PlanをOAuthで素早くセットアップしたい場合。API key不要。

明示的なregional OAuth選択肢で認証します。

```bash
openclaw onboard --auth-choice minimax-global-oauth
# or
openclaw onboard --auth-choice minimax-cn-oauth
```

選択肢の対応:

- `minimax-global-oauth`: 国際ユーザー向け（`api.minimax.io`）
- `minimax-cn-oauth`: 中国のユーザー向け（`api.minimaxi.com`）

詳細は、OpenClaw repo内のMiniMax plugin package READMEを参照してください。

### MiniMax M2.7（API key）

**最適な用途:** Anthropic互換APIを使うホスト型MiniMax。

CLI経由で設定:

- 対話型onboarding:

```bash
openclaw onboard --auth-choice minimax-global-api
# or
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: 国際ユーザー向け（`api.minimax.io`）
- `minimax-cn-api`: 中国のユーザー向け（`api.minimaxi.com`）

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Anthropic互換streaming経路では、OpenClawは現在、
明示的に `thinking` を自分で設定しない限り、MiniMaxの
thinkingをデフォルトで無効にします。MiniMaxの
streaming endpointは、ネイティブAnthropicのthinking blockではなく、
OpenAI形式のdelta chunk内に `reasoning_content` を出力するため、
暗黙的に有効なままにすると内部reasoningが可視出力へ漏れる可能性があります。

### FallbackとしてのMiniMax M2.7（例）

**最適な用途:** 最も強力な最新世代modelをprimaryのままにして、MiniMax M2.7へfail overしたい場合。
以下の例では具体例としてOpusをprimaryに使っています。好みの最新世代primary modelへ置き換えてください。

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## `openclaw configure` で設定する

対話型config wizardを使うと、JSONを編集せずにMiniMaxを設定できます。

1. `openclaw configure` を実行します。
2. **Model/auth** を選択します。
3. **MiniMax** のauth optionを選びます。
4. プロンプトが出たらデフォルトmodelを選びます。

wizard/CLIにおける現在のMiniMax auth選択肢:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## 設定オプション

- `models.providers.minimax.baseUrl`: `https://api.minimax.io/anthropic`（Anthropic互換）を推奨。`https://api.minimax.io/v1` はOpenAI互換payload用の任意設定です。
- `models.providers.minimax.api`: `anthropic-messages` を推奨。`openai-completions` はOpenAI互換payload用の任意設定です。
- `models.providers.minimax.apiKey`: MiniMax API key（`MINIMAX_API_KEY`）。
- `models.providers.minimax.models`: `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` を定義します。
- `agents.defaults.models`: allowlistに載せたいmodelへaliasを付けます。
- `models.mode`: 組み込みmodelにMiniMaxを追加したい場合は `merge` のままにしてください。

## 注意

- Model refはauth経路に従います:
  - API-keyセットアップ: `minimax/<model>`
  - OAuthセットアップ: `minimax-portal/<model>`
- デフォルトchat model: `MiniMax-M2.7`
- 代替chat model: `MiniMax-M2.7-highspeed`
- `api: "anthropic-messages"` では、OpenClawは
  params/config内ですでにthinkingが明示設定されていない限り、
  `thinking: { type: "disabled" }` を注入します。
- `/fast on` または `params.fastMode: true` は、Anthropic互換stream経路で `MiniMax-M2.7` を
  `MiniMax-M2.7-highspeed` へ書き換えます。
- Onboardingと直接のAPI-keyセットアップは、
  両方のM2.7 variantに対して `input: ["text", "image"]` を持つ明示的model定義を書き込みます
- バンドル済みprovider catalogは現在、明示的なMiniMax provider configが存在するまでは、
  chat refをtext-only metadataとして公開します
- Coding Plan usage API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（coding plan keyが必要）。
- OpenClawはMiniMax coding-plan usageを、他のproviderと同じ
  `% left` 表示へ正規化します。MiniMaxの生の `usage_percent` / `usagePercent`
  フィールドは消費済みquotaではなく残量quotaなので、OpenClawはこれを反転します。
  countベースfieldが存在する場合はそちらが優先されます。APIが `model_remains` を返した場合、
  OpenClawはchat-modelエントリーを優先し、必要に応じて
  `start_time` / `end_time` からwindow labelを導出し、coding-plan windowを区別しやすくするため
  選択されたmodel名をplan labelに含めます。
- Usage snapshotは、`minimax`、`minimax-cn`、`minimax-portal` を
  同じMiniMax quota surfaceとして扱い、Coding Plan key env varへフォールバックする前に
  保存済みMiniMax OAuthを優先します。
- 正確なcost追跡が必要なら、`models.json` のpricing値を更新してください。
- MiniMax Coding Planの紹介リンク（10% off）: [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- providerルールは [/concepts/model-providers](/concepts/model-providers) を参照してください。
- 現在のprovider idを確認するには `openclaw models list` を使い、次で切り替えてください:
  `openclaw models set minimax/MiniMax-M2.7` または
  `openclaw models set minimax-portal/MiniMax-M2.7`。

## トラブルシューティング

### "Unknown model: minimax/MiniMax-M2.7"

これは通常、**MiniMax providerが設定されていない**ことを意味します（対応する
provider entryがない、かつ一致するMiniMax auth profile/env keyも見つからない）。
この検出に対する修正は **2026.1.12** に入っています。次のいずれかで修正してください。

- **2026.1.12** へアップグレードし（またはソースの `main` を使い）、その後Gatewayを再起動する。
- `openclaw configure` を実行して **MiniMax** auth optionを選ぶ、または
- 対応する `models.providers.minimax` または
  `models.providers.minimax-portal` ブロックを手動追加する、または
- `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、またはMiniMax auth profileを設定し、
  対応providerが注入できるようにする。

model idは**大文字小文字を区別**することに注意してください。

- API-key経路: `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`
- OAuth経路: `minimax-portal/MiniMax-M2.7` または
  `minimax-portal/MiniMax-M2.7-highspeed`

その後、次で再確認してください。

```bash
openclaw models list
```
