---
read_when:
    - Chcesz katalogu OpenCode Go
    - Potrzebujesz referencji modeli runtime dla modeli hostowanych przez Go
summary: Użyj katalogu OpenCode Go ze współdzieloną konfiguracją OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go to katalog Go w ramach [OpenCode](/pl/providers/opencode).
Używa tego samego `OPENCODE_API_KEY` co katalog Zen, ale zachowuje identyfikator
providera runtime `opencode-go`, aby routing upstream per model pozostał poprawny.

| Właściwość       | Wartość                       |
| ---------------- | ----------------------------- |
| Provider runtime | `opencode-go`                 |
| Auth             | `OPENCODE_API_KEY`            |
| Konfiguracja nadrzędna | [OpenCode](/pl/providers/opencode) |

## Wbudowany katalog

OpenClaw pobiera większość wierszy katalogu Go z dołączonego rejestru modeli Pi i
uzupełnia bieżące wiersze upstream, dopóki rejestr nie nadrobi zaległości. Uruchom
`openclaw models list --provider opencode-go`, aby zobaczyć bieżącą listę modeli.

Provider zawiera:

| Referencja modelu               | Nazwa                 |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3x limits) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

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
    OpenClaw automatycznie obsługuje routing per model, gdy referencja modelu używa
    `opencode-go/...`. Nie jest wymagana dodatkowa konfiguracja providera.
  </Accordion>

  <Accordion title="Konwencja referencji runtime">
    Referencje runtime pozostają jawne: `opencode/...` dla Zen, `opencode-go/...` dla Go.
    Dzięki temu routing upstream per model pozostaje poprawny w obu katalogach.
  </Accordion>

  <Accordion title="Współdzielone poświadczenia">
    To samo `OPENCODE_API_KEY` jest używane zarówno przez katalog Zen, jak i Go. Wprowadzenie
    klucza podczas konfiguracji zapisuje poświadczenia dla obu providerów runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Zobacz [OpenCode](/pl/providers/opencode), aby poznać wspólny przegląd onboardingu oraz pełną
dokumentację katalogów Zen + Go.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenCode (nadrzędny)" href="/pl/providers/opencode" icon="server">
    Wspólny onboarding, przegląd katalogu i uwagi zaawansowane.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
</CardGroup>
