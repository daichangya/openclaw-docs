---
read_when:
    - Anda ingin menggunakan model OSS yang di-host Bedrock Mantle dengan OpenClaw
    - Anda memerlukan endpoint kompatibel OpenAI Mantle untuk GPT-OSS, Qwen, Kimi, atau GLM
summary: Gunakan model Amazon Bedrock Mantle (kompatibel OpenAI) dengan OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T09:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw menyertakan provider **Amazon Bedrock Mantle** bawaan yang terhubung ke
endpoint Mantle yang kompatibel OpenAI. Mantle meng-host model open-source dan
pihak ketiga (GPT-OSS, Qwen, Kimi, GLM, dan sejenisnya) melalui permukaan standar
`/v1/chat/completions` yang didukung oleh infrastruktur Bedrock.

| Properti       | Nilai                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------ |
| ID provider    | `amazon-bedrock-mantle`                                                                    |
| API            | `openai-completions` (kompatibel OpenAI) atau `anthropic-messages` (rute Anthropic Messages) |
| Auth           | `AWS_BEARER_TOKEN_BEDROCK` eksplisit atau pembuatan bearer-token rantai kredensial IAM    |
| Region default | `us-east-1` (override dengan `AWS_REGION` atau `AWS_DEFAULT_REGION`)                       |

## Memulai

Pilih metode auth yang Anda sukai dan ikuti langkah penyiapannya.

<Tabs>
  <Tab title="Bearer token eksplisit">
    **Paling cocok untuk:** environment tempat Anda sudah memiliki bearer token Mantle.

    <Steps>
      <Step title="Atur bearer token di host gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Secara opsional atur region (default ke `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifikasi model ditemukan">
        ```bash
        openclaw models list
        ```

        Model yang ditemukan muncul di bawah provider `amazon-bedrock-mantle`. Tidak
        diperlukan config tambahan kecuali Anda ingin mengoverride default.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Kredensial IAM">
    **Paling cocok untuk:** menggunakan kredensial yang kompatibel AWS SDK (shared config, SSO, web identity, instance atau task roles).

    <Steps>
      <Step title="Konfigurasikan kredensial AWS di host gateway">
        Sumber auth apa pun yang kompatibel AWS SDK dapat digunakan:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifikasi model ditemukan">
        ```bash
        openclaw models list
        ```

        OpenClaw menghasilkan bearer token Mantle dari rantai kredensial secara otomatis.
      </Step>
    </Steps>

    <Tip>
    Saat `AWS_BEARER_TOKEN_BEDROCK` tidak diatur, OpenClaw membuat bearer token untuk Anda dari rantai kredensial default AWS, termasuk shared credentials/config profiles, SSO, web identity, dan instance atau task roles.
    </Tip>

  </Tab>
</Tabs>

## Penemuan model otomatis

Saat `AWS_BEARER_TOKEN_BEDROCK` diatur, OpenClaw langsung menggunakannya. Jika tidak,
OpenClaw mencoba membuat bearer token Mantle dari rantai kredensial default
AWS. Lalu OpenClaw menemukan model Mantle yang tersedia dengan melakukan query ke
endpoint `/v1/models` pada region tersebut.

| Perilaku           | Detail                   |
| ------------------ | ------------------------ |
| Cache penemuan     | Hasil di-cache selama 1 jam |
| Refresh token IAM  | Setiap jam               |

<Note>
Bearer token tersebut sama dengan `AWS_BEARER_TOKEN_BEDROCK` yang digunakan oleh provider [Amazon Bedrock](/id/providers/bedrock) standar.
</Note>

### Region yang didukung

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfigurasi manual

Jika Anda lebih memilih config eksplisit daripada penemuan otomatis:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Catatan lanjutan

<AccordionGroup>
  <Accordion title="Dukungan reasoning">
    Dukungan reasoning disimpulkan dari id model yang mengandung pola seperti
    `thinking`, `reasoner`, atau `gpt-oss-120b`. OpenClaw mengatur `reasoning: true`
    secara otomatis untuk model yang cocok selama proses penemuan.
  </Accordion>

  <Accordion title="Endpoint tidak tersedia">
    Jika endpoint Mantle tidak tersedia atau tidak mengembalikan model, provider tersebut
    dilewati secara diam-diam. OpenClaw tidak menghasilkan error; provider lain yang dikonfigurasi
    tetap bekerja seperti biasa.
  </Accordion>

  <Accordion title="Claude Opus 4.7 melalui rute Anthropic Messages">
    Mantle juga mengekspos rute Anthropic Messages yang membawa model Claude melalui jalur streaming terautentikasi bearer yang sama. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) dapat dipanggil melalui rute ini dengan streaming milik provider, sehingga bearer token AWS tidak diperlakukan seperti API key Anthropic.

    Saat Anda mem-pin model Anthropic Messages pada provider Mantle, OpenClaw menggunakan permukaan API `anthropic-messages` alih-alih `openai-completions` untuk model tersebut. Auth tetap berasal dari `AWS_BEARER_TOKEN_BEDROCK` (atau bearer token IAM yang dibuat).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hubungan dengan provider Amazon Bedrock">
    Bedrock Mantle adalah provider yang terpisah dari provider [Amazon Bedrock](/id/providers/bedrock)
    standar. Mantle menggunakan permukaan `/v1` yang kompatibel OpenAI, sedangkan
    provider Bedrock standar menggunakan API Bedrock native.

    Kedua provider berbagi kredensial `AWS_BEARER_TOKEN_BEDROCK` yang sama saat
    tersedia.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/id/providers/bedrock" icon="cloud">
    Provider Bedrock native untuk Anthropic Claude, Titan, dan model lainnya.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, ref model, dan perilaku failover.
  </Card>
  <Card title="OAuth dan auth" href="/id/gateway/authentication" icon="key">
    Detail auth dan aturan penggunaan ulang kredensial.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan cara menyelesaikannya.
  </Card>
</CardGroup>
