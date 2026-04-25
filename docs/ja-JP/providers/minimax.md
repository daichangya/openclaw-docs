---
read_when:
    - OpenClawでMiniMaxモデルを使いたい場合
    - MiniMaxのセットアップガイダンスが必要な場合
summary: OpenClawでMiniMaxモデルを使う
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:57:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

OpenClawのMiniMax providerは、デフォルトで**MiniMax M2.7**を使用します。

MiniMaxはさらに次も提供します。

- T2A v2によるバンドル済み音声合成
- `MiniMax-VL-01`によるバンドル済み画像理解
- `music-2.6`によるバンドル済み音楽生成
- MiniMax Coding Plan search API経由のバンドル済み`web_search`

providerの分割:

| Provider ID      | Auth    | Capabilities                                                    |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | API key | テキスト、画像生成、画像理解、音声、web検索 |
| `minimax-portal` | OAuth   | テキスト、画像生成、画像理解、音声             |

## 組み込みcatalog

| モデル                    | 種類             | 説明                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat（reasoning） | デフォルトのホスト型reasoning model           |
| `MiniMax-M2.7-highspeed` | Chat（reasoning） | より高速なM2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | 画像理解モデル                |
| `image-01`               | 画像生成 | テキストから画像、および画像から画像への編集 |
| `music-2.6`              | 音楽生成 | デフォルトの音楽モデル                      |
| `music-2.5`              | 音楽生成 | 以前の音楽生成tier           |
| `music-2.0`              | 音楽生成 | レガシー音楽生成tier             |
| `MiniMax-Hailuo-2.3`     | 動画生成 | テキストから動画、および画像参照フロー  |

## はじめに

好みのauth方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最適な用途:** OAuth経由でMiniMax Coding Planをすばやくセットアップしたい場合。API keyは不要です。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            これにより`api.minimax.io`に対して認証します。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            これにより`api.minimaxi.com`に対して認証します。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuthセットアップでは`minimax-portal` provider idを使用します。model refは`minimax-portal/MiniMax-M2.7`の形式に従います。
    </Note>

    <Tip>
    MiniMax Coding Planの紹介リンク（10%オフ）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最適な用途:** Anthropic互換APIを使ったホスト型MiniMax。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            これによりbase URLとして`api.minimax.io`が設定されます。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            これによりbase URLとして`api.minimaxi.com`が設定されます。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 設定例

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
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
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

    <Warning>
    Anthropic互換のストリーミング経路では、明示的に`thinking`を設定しない限り、OpenClawはデフォルトでMiniMaxのthinkingを無効にします。MiniMaxのストリーミングendpointは、ネイティブなAnthropic thinking blockではなく、OpenAIスタイルのdelta chunkで`reasoning_content`を出力するため、暗黙に有効のままだと内部reasoningが可視出力へ漏れる可能性があります。
    </Warning>

    <Note>
    API keyセットアップでは`minimax` provider idを使用します。model refは`minimax/MiniMax-M2.7`の形式に従います。
    </Note>

  </Tab>
</Tabs>

## `openclaw configure`で設定する

JSONを編集せずに、対話型設定ウィザードを使ってMiniMaxを設定できます。

<Steps>
  <Step title="ウィザードを起動">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/authを選択">
    メニューから**Model/auth**を選びます。
  </Step>
  <Step title="MiniMaxのauthオプションを選ぶ">
    利用可能なMiniMaxオプションのいずれかを選びます。

    | Auth choice | 説明 |
    | --- | --- |
    | `minimax-global-oauth` | International OAuth（Coding Plan） |
    | `minimax-cn-oauth` | China OAuth（Coding Plan） |
    | `minimax-global-api` | International API key |
    | `minimax-cn-api` | China API key |

  </Step>
  <Step title="デフォルトモデルを選択">
    プロンプトが表示されたら、デフォルトモデルを選択します。
  </Step>
</Steps>

## 機能

### 画像生成

MiniMax pluginは`image_generate`ツール向けに`image-01`モデルを登録します。対応内容:

- アスペクト比制御付きの**テキストから画像生成**
- アスペクト比制御付きの**画像から画像への編集**（subject reference）
- 1回のリクエストで最大**9枚の出力画像**
- 1回の編集リクエストで最大**1枚の参照画像**
- 対応アスペクト比: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

MiniMaxを画像生成に使うには、画像生成providerとして設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

pluginは、テキストモデルと同じ`MINIMAX_API_KEY`またはOAuth authを使います。すでにMiniMaxが設定済みなら追加設定は不要です。

`minimax`と`minimax-portal`の両方が、同じ
`image-01`モデルで`image_generate`を登録します。API keyセットアップは`MINIMAX_API_KEY`を使い、OAuthセットアップでは
代わりにバンドル済みの`minimax-portal` auth経路を使えます。

オンボーディングまたはAPI keyセットアップが明示的な`models.providers.minimax`
entryを書き込む場合、OpenClawは`MiniMax-M2.7`と
`MiniMax-M2.7-highspeed`をテキスト専用chat modelとして具体化します。画像理解は
plugin所有の`MiniMax-VL-01` media providerを通じて別途公開されます。

<Note>
共通ツールパラメーター、provider選択、failover挙動については[Image Generation](/ja-JP/tools/image-generation)を参照してください。
</Note>

### テキスト読み上げ

バンドル済みの`minimax` pluginは、
`messages.tts`向けspeech providerとしてMiniMax T2A v2を登録します。

- デフォルトTTSモデル: `speech-2.8-hd`
- デフォルト音声: `English_expressive_narrator`
- 対応するバンドル済みmodel idには、`speech-2.8-hd`、`speech-2.8-turbo`,
  `speech-2.6-hd`、`speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`が含まれます。
- auth解決順は、`messages.tts.providers.minimax.apiKey`、次に
  `minimax-portal` OAuth/token auth profile、次にToken Plan環境変数
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`)、最後に`MINIMAX_API_KEY`です。
- TTS hostが設定されていない場合、OpenClawは設定済みの
  `minimax-portal` OAuth hostを再利用し、`/anthropic`のようなAnthropic互換パス接尾辞を
  取り除きます。
- 通常の音声添付はMP3のままです。
- FeishuやTelegramのような音声ノート対象では、MiniMax
  MP3は`ffmpeg`で48kHz Opusへトランスコードされます。これは、Feishu/Lark file APIがネイティブ音声メッセージに対して`file_type: "opus"`しか受け付けないためです。
- MiniMax T2Aは小数の`speed`と`vol`を受け付けますが、`pitch`は整数として送信されます。OpenClawはAPIリクエスト前に小数の`pitch`値を切り捨てます。

| 設定                                  | 環境変数                | デフォルト                       | 説明                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host。            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model id。                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 音声出力に使うvoice id。 |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 再生速度、`0.5..2.0`。      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量、`(0, 10]`。               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数のpitch shift、`-12..12`。  |

### 音楽生成

バンドル済みの`minimax` pluginは、共有
`music_generate`ツールを通じて音楽生成も登録します。

- デフォルト音楽モデル: `minimax/music-2.6`
- `minimax/music-2.5`および`minimax/music-2.0`にも対応
- プロンプト制御: `lyrics`, `instrumental`, `durationSeconds`
- 出力形式: `mp3`
- セッションバックend実行は、`action: "status"`を含む共有task/statusフローを通じてdetachされます

MiniMaxをデフォルトの音楽providerとして使うには:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
共通ツールパラメーター、provider選択、failover挙動については[Music Generation](/ja-JP/tools/music-generation)を参照してください。
</Note>

### 動画生成

バンドル済みの`minimax` pluginは、共有
`video_generate`ツールを通じて動画生成も登録します。

- デフォルト動画モデル: `minimax/MiniMax-Hailuo-2.3`
- モード: テキストから動画、および単一画像参照フロー
- `aspectRatio`と`resolution`に対応

MiniMaxをデフォルトの動画providerとして使うには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
共通ツールパラメーター、provider選択、failover挙動については[Video Generation](/ja-JP/tools/video-generation)を参照してください。
</Note>

### 画像理解

MiniMax pluginは、画像理解をテキスト
catalogとは別に登録します。

| Provider ID      | デフォルト画像モデル |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

そのため、バンドル済みのテキストprovider catalogが引き続きテキスト専用のM2.7 chat refだけを表示している場合でも、自動media routingではMiniMax画像理解を利用できます。

### web検索

MiniMax pluginは、MiniMax Coding Plan
search APIを通じて`web_search`も登録します。

- Provider id: `minimax`
- 構造化結果: title、URL、snippet、related query
- 推奨環境変数: `MINIMAX_CODE_PLAN_KEY`
- 受け付ける環境変数alias: `MINIMAX_CODING_API_KEY`
- 互換フォールバック: すでにcoding-plan tokenを指している場合の`MINIMAX_API_KEY`
- リージョン再利用: `plugins.entries.minimax.config.webSearch.region`、次に`MINIMAX_API_HOST`、その後にMiniMax providerのbase URL
- 検索はprovider id `minimax`のままです。OAuth CN/globalセットアップでも、`models.providers.minimax-portal.baseUrl`を通じて間接的にリージョンを誘導できます

設定は`plugins.entries.minimax.config.webSearch.*`配下にあります。

<Note>
web検索の完全な設定と使い方については[MiniMax Search](/ja-JP/tools/minimax-search)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定オプション">
    | オプション | 説明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic`を推奨（Anthropic互換）。OpenAI互換payload用に`https://api.minimax.io/v1`も任意で使用可能 |
    | `models.providers.minimax.api` | `anthropic-messages`を推奨。OpenAI互換payload用に`openai-completions`も任意で使用可能 |
    | `models.providers.minimax.apiKey` | MiniMax API key（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`を定義 |
    | `agents.defaults.models` | allowlistに入れたいモデルへaliasを付ける |
    | `models.mode` | 組み込みと並べてMiniMaxを追加したい場合は`merge`を維持 |
  </Accordion>

  <Accordion title="thinkingのデフォルト">
    `api: "anthropic-messages"`では、thinkingがparams/configにすでに明示設定されていない限り、OpenClawは`thinking: { type: "disabled" }`を注入します。

    これは、MiniMaxのストリーミングendpointがOpenAIスタイルのdelta chunkで`reasoning_content`を出力し、内部reasoningが可視出力へ漏れることを防ぐためです。

  </Accordion>

  <Accordion title="fastモード">
    `/fast on`または`params.fastMode: true`は、Anthropic互換stream path上で`MiniMax-M2.7`を`MiniMax-M2.7-highspeed`へ書き換えます。
  </Accordion>

  <Accordion title="フォールバック例">
    **最適な用途:** 最も強力な最新世代モデルをprimaryに保ちつつ、MiniMax M2.7へfail overする。以下の例では具体的なprimaryとしてOpusを使っています。好みの最新世代primary modelへ置き換えてください。

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

  </Accordion>

  <Accordion title="Coding Planのusage詳細">
    - Coding Planのusage API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（coding plan keyが必要）。
    - OpenClawは、MiniMax coding-plan usageを他providerと同じ`% left`表示へ正規化します。MiniMaxのraw `usage_percent` / `usagePercent`フィールドは消費済みクォータではなく残りクォータなので、OpenClawはそれを反転します。件数ベースフィールドが存在する場合はそちらが優先されます。
    - APIが`model_remains`を返す場合、OpenClawはchat-model entryを優先し、必要に応じて`start_time` / `end_time`からwindow labelを導出し、選択されたmodel名をplan labelに含めるため、coding-plan windowを区別しやすくなります。
    - usage snapshotでは、`minimax`、`minimax-cn`、`minimax-portal`を同じMiniMaxクォータサーフェスとして扱い、Coding Plan key環境変数へフォールバックする前に保存済みMiniMax OAuthを優先します。
  </Accordion>
</AccordionGroup>

## 注記

- model refはauth経路に従います:
  - API keyセットアップ: `minimax/<model>`
  - OAuthセットアップ: `minimax-portal/<model>`
- デフォルトchat model: `MiniMax-M2.7`
- 代替chat model: `MiniMax-M2.7-highspeed`
- オンボーディングと直接API keyセットアップは、両方のM2.7 variantに対してテキスト専用model定義を書き込みます
- 画像理解はplugin所有の`MiniMax-VL-01` media providerを使います
- 正確なコスト追跡が必要な場合は`models.json`内のpricing値を更新してください
- 現在のprovider idを確認するには`openclaw models list`を使い、その後`openclaw models set minimax/MiniMax-M2.7`または`openclaw models set minimax-portal/MiniMax-M2.7`で切り替えてください

<Tip>
MiniMax Coding Planの紹介リンク（10%オフ）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
providerルールについては[Model providers](/ja-JP/concepts/model-providers)を参照してください。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    これは通常、**MiniMax providerが設定されていない**ことを意味します（対応するprovider entryがない、かつMiniMax auth profile/env keyも見つかっていません）。この検出の修正は**2026.1.12**に入っています。次のいずれかで修正してください。

    - **2026.1.12**へアップグレードする（またはソースの`main`から実行する）、その後gatewayを再起動する。
    - `openclaw configure`を実行して、**MiniMax** authオプションを選ぶ、または
    - 対応する`models.providers.minimax`または`models.providers.minimax-portal`ブロックを手動で追加する、または
    - `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、またはMiniMax auth profileを設定し、対応するproviderが注入されるようにする。

    model idは**大文字小文字を区別する**ことに注意してください。

    - API key経路: `minimax/MiniMax-M2.7`または`minimax/MiniMax-M2.7-highspeed`
    - OAuth経路: `minimax-portal/MiniMax-M2.7`または`minimax-portal/MiniMax-M2.7-highspeed`

    その後、次で再確認します。

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
さらにサポートが必要な場合: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover挙動の選び方。
  </Card>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとprovider選択。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    共通の音楽ツールパラメーターとprovider選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとprovider選択。
  </Card>
  <Card title="MiniMax Search" href="/ja-JP/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan経由のweb検索設定。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとFAQ。
  </Card>
</CardGroup>
