---
read_when:
    - Chcesz używać hostowanych w Bedrock Mantle modeli OSS z OpenClaw
    - Potrzebujesz zgodnego z OpenAI endpointu Mantle dla GPT-OSS, Qwen, Kimi lub GLM
summary: Używaj modeli Amazon Bedrock Mantle (zgodnych z OpenAI) z OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T10:07:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw zawiera bundlowanego providera **Amazon Bedrock Mantle**, który łączy się z
zgodnym z OpenAI endpointem Mantle. Mantle hostuje modele open source i
zewnętrzne (GPT-OSS, Qwen, Kimi, GLM i podobne) przez standardową
powierzchnię `/v1/chat/completions` opartą na infrastrukturze Bedrock.

| Właściwość      | Wartość                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| ID providera    | `amazon-bedrock-mantle`                                                                     |
| API             | `openai-completions` (zgodne z OpenAI) lub `anthropic-messages` (trasa Anthropic Messages) |
| Auth            | Jawne `AWS_BEARER_TOKEN_BEDROCK` albo generowanie bearer token z łańcucha poświadczeń IAM   |
| Domyślny region | `us-east-1` (nadpisz przez `AWS_REGION` albo `AWS_DEFAULT_REGION`)                          |

## Pierwsze kroki

Wybierz preferowaną metodę auth i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Jawny bearer token">
    **Najlepsze dla:** środowisk, w których masz już bearer token Mantle.

    <Steps>
      <Step title="Ustaw bearer token na hoście Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcjonalnie ustaw region (domyślnie `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Sprawdź, czy modele zostały wykryte">
        ```bash
        openclaw models list
        ```

        Wykryte modele pojawiają się pod providerem `amazon-bedrock-mantle`. Nie
        jest wymagana dodatkowa konfiguracja, chyba że chcesz nadpisać ustawienia domyślne.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Poświadczenia IAM">
    **Najlepsze dla:** używania poświadczeń zgodnych z AWS SDK (współdzielona konfiguracja, SSO, web identity, role instancji lub zadania).

    <Steps>
      <Step title="Skonfiguruj poświadczenia AWS na hoście Gateway">
        Działa dowolne źródło auth zgodne z AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Sprawdź, czy modele zostały wykryte">
        ```bash
        openclaw models list
        ```

        OpenClaw automatycznie generuje bearer token Mantle z łańcucha poświadczeń.
      </Step>
    </Steps>

    <Tip>
    Gdy `AWS_BEARER_TOKEN_BEDROCK` nie jest ustawione, OpenClaw tworzy bearer token za Ciebie z domyślnego łańcucha poświadczeń AWS, w tym ze współdzielonych profili credentials/config, SSO, web identity oraz ról instancji lub zadania.
    </Tip>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

Gdy `AWS_BEARER_TOKEN_BEDROCK` jest ustawione, OpenClaw używa go bezpośrednio. W przeciwnym razie
OpenClaw próbuje wygenerować bearer token Mantle z domyślnego łańcucha
poświadczeń AWS. Następnie wykrywa dostępne modele Mantle, odpytując
regionalny endpoint `/v1/models`.

| Zachowanie         | Szczegóły                 |
| ------------------ | ------------------------- |
| Cache wykrywania   | Wyniki buforowane przez 1 godzinę |
| Odświeżanie tokena IAM | Co godzinę             |

<Note>
Bearer token to ten sam `AWS_BEARER_TOKEN_BEDROCK`, którego używa standardowy provider [Amazon Bedrock](/pl/providers/bedrock).
</Note>

### Obsługiwane regiony

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfiguracja ręczna

Jeśli wolisz jawną konfigurację zamiast automatycznego wykrywania:

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

## Uwagi zaawansowane

<AccordionGroup>
  <Accordion title="Obsługa reasoning">
    Obsługa reasoning jest wnioskowana z ID modeli zawierających wzorce takie jak
    `thinking`, `reasoner` albo `gpt-oss-120b`. OpenClaw ustawia `reasoning: true`
    automatycznie dla pasujących modeli podczas wykrywania.
  </Accordion>

  <Accordion title="Niedostępność endpointu">
    Jeśli endpoint Mantle jest niedostępny albo nie zwraca żadnych modeli, provider jest
    cicho pomijany. OpenClaw nie zgłasza błędu; inne skonfigurowane providery
    nadal działają normalnie.
  </Accordion>

  <Accordion title="Claude Opus 4.7 przez trasę Anthropic Messages">
    Mantle udostępnia także trasę Anthropic Messages, która przenosi modele Claude przez tę samą ścieżkę strumieniowania uwierzytelnianą bearer tokenem. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) można wywoływać przez tę trasę z provider-owned streaming, więc bearer tokeny AWS nie są traktowane jak klucze API Anthropic.

    Gdy przypniesz model Anthropic Messages na providerze Mantle, OpenClaw używa dla tego modelu powierzchni API `anthropic-messages` zamiast `openai-completions`. Auth nadal pochodzi z `AWS_BEARER_TOKEN_BEDROCK` (albo z utworzonego bearer tokena IAM).

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

  <Accordion title="Relacja do providera Amazon Bedrock">
    Bedrock Mantle jest osobnym providerem względem standardowego
    providera [Amazon Bedrock](/pl/providers/bedrock). Mantle używa
    zgodnej z OpenAI powierzchni `/v1`, podczas gdy standardowy provider Bedrock używa
    natywnego API Bedrock.

    Obaj providerzy współdzielą to samo poświadczenie `AWS_BEARER_TOKEN_BEDROCK`, gdy
    jest obecne.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pl/providers/bedrock" icon="cloud">
    Natywny provider Bedrock dla Anthropic Claude, Titan i innych modeli.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowanie failover.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązania.
  </Card>
</CardGroup>
