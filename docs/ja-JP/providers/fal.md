---
read_when:
    - OpenClaw で fal の画像生成を使いたいです
    - '`FAL_KEY` 認証フローが必要です'
    - '`image_generate` または `video_generate` の fal デフォルトを使いたいです'
summary: OpenClaw での fal の画像および動画生成セットアップ
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:38:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw には、ホスト型の画像生成と動画生成向けに、バンドルされた `fal` provider が含まれています。

| Property | Value                                                         |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY`（正式。`FAL_API_KEY` もフォールバックとして動作） |
| API      | fal model endpoint                                            |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="デフォルトの画像 model を設定する">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 画像生成

バンドルされた `fal` の画像生成 provider のデフォルトは
`fal/fal-ai/flux/dev` です。

| Capability     | Value                      |
| -------------- | -------------------------- |
| Max images     | リクエストごとに最大 4 枚      |
| Edit mode      | 有効、参照画像は 1 枚         |
| Size overrides | サポートあり                 |
| Aspect ratio   | サポートあり                 |
| Resolution     | サポートあり                 |
| Output format  | `png` または `jpeg`         |

<Warning>
fal の画像編集 endpoint は `aspectRatio` の override を **サポートしていません**。
</Warning>

PNG 出力が必要な場合は `outputFormat: "png"` を使用してください。fal では
OpenClaw 内で明示的な透明背景の制御を宣言していないため、`background:
"transparent"` は fal model では無視される override として報告されます。

fal をデフォルトの画像 provider として使うには:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## 動画生成

バンドルされた `fal` の動画生成 provider のデフォルトは
`fal/fal-ai/minimax/video-01-live` です。

| Capability | Value                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modes      | テキストから動画、単一画像参照、Seedance の参照から動画 |
| Runtime    | 長時間実行ジョブ向けの、キューを使った submit/status/result フロー       |

<AccordionGroup>
  <Accordion title="利用可能な動画 model">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 の設定例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Seedance 2.0 の reference-to-video 設定例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    reference-to-video では、共有 `video_generate` の `images`、`videos`、`audioRefs`
    パラメーターを通じて、最大 9 枚の画像、3 本の動画、3 件の音声参照を受け付けます。
    参照ファイルの合計は最大 12 件です。

  </Accordion>

  <Accordion title="HeyGen video-agent の設定例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
利用可能な fal model の完全な一覧を確認するには `openclaw models list --provider fal` を使ってください。
最近追加された項目も含まれます。
</Tip>

## 関連情報

<CardGroup cols={2}>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像 tool パラメーターと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画 tool パラメーターと provider 選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    画像と動画の model 選択を含む agent のデフォルト設定。
  </Card>
</CardGroup>
