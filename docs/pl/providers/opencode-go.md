---
read_when:
    - Chcesz katalog OpenCode Go
    - Potrzebujesz odwołań do modeli środowiska uruchomieniowego dla modeli hostowanych przez Go
summary: Użyj katalogu OpenCode Go ze współdzielonym setup OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go to katalog Go w ramach [OpenCode](/pl/providers/opencode).
Używa tego samego `OPENCODE_API_KEY` co katalog Zen, ale zachowuje identyfikator
dostawcy środowiska uruchomieniowego `opencode-go`, aby routing per model po stronie upstream pozostał poprawny.

| Właściwość                | Wartość                         |
| ------------------------- | ------------------------------- |
| Dostawca środowiska uruchomieniowego | `opencode-go`       |
| Uwierzytelnianie          | `OPENCODE_API_KEY`              |
| Konfiguracja nadrzędna    | [OpenCode](/pl/providers/opencode) |

## Wbudowany katalog

OpenClaw pobiera katalog Go z dołączonego rejestru modeli Pi. Uruchom
`openclaw models list --provider opencode-go`, aby wyświetlić aktualną listę modeli.

Na podstawie dołączonego katalogu Pi dostawca obejmuje:

| Odwołanie modelu          | Nazwa                 |
| ------------------------- | --------------------- |
| `opencode-go/glm-5`       | GLM-5                 |
| `opencode-go/glm-5.1`     | GLM-5.1               |
| `opencode-go/kimi-k2.5`   | Kimi K2.5             |
| `opencode-go/kimi-k2.6`   | Kimi K2.6 (limity 3x) |
| `opencode-go/mimo-v2-omni`| MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro` | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`| MiniMax M2.5          |
| `opencode-go/minimax-m2.7`| MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`| Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`| Qwen3.6 Plus          |

## Pierwsze kroki

<Tabs>
  <Tab title="Interaktywnie">
    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ustaw model Go jako domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Nieinteraktywnie">
    <Steps>
      <Step title="Przekaż klucz bezpośrednio">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Przykład konfiguracji

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie routingu">
    OpenClaw automatycznie obsługuje routing per model, gdy odwołanie modelu używa
    `opencode-go/...`. Nie jest wymagana żadna dodatkowa konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Konwencja odwołań środowiska uruchomieniowego">
    Odwołania środowiska uruchomieniowego pozostają jawne: `opencode/...` dla Zen, `opencode-go/...` dla Go.
    Dzięki temu routing per model po stronie upstream pozostaje poprawny w obu katalogach.
  </Accordion>

  <Accordion title="Współdzielone poświadczenia">
    To samo `OPENCODE_API_KEY` jest używane zarówno przez katalog Zen, jak i Go. Wprowadzenie
    klucza podczas konfiguracji zapisuje poświadczenia dla obu dostawców środowiska uruchomieniowego.
  </Accordion>
</AccordionGroup>

<Tip>
Zobacz [OpenCode](/pl/providers/opencode), aby uzyskać wspólny przegląd onboardingu oraz pełne
odniesienie do katalogów Zen + Go.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenCode (nadrzędny)" href="/pl/providers/opencode" icon="server">
    Wspólny onboarding, przegląd katalogu i zaawansowane uwagi.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
</CardGroup>
