---
read_when:
    - Chcesz używać Volcano Engine lub modeli Doubao z OpenClaw
    - Potrzebujesz konfiguracji klucza API Volcengine
summary: Konfiguracja Volcano Engine (modele Doubao, punkty końcowe ogólne i do kodowania)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T10:08:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Provider Volcengine daje dostęp do modeli Doubao i modeli firm trzecich
hostowanych w Volcano Engine, z oddzielnymi punktami końcowymi dla obciążeń
ogólnych i związanych z kodowaniem.

| Szczegół   | Wartość                                             |
| ---------- | --------------------------------------------------- |
| Providerzy | `volcengine` (ogólny) + `volcengine-plan` (kodowanie) |
| Uwierzytelnianie | `VOLCANO_ENGINE_API_KEY`                     |
| API        | Zgodne z OpenAI                                     |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom interaktywny onboarding:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    To rejestruje zarówno providera ogólnego (`volcengine`), jak i providera do kodowania (`volcengine-plan`) z jednego klucza API.

  </Step>
  <Step title="Ustaw model domyślny">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Dla konfiguracji nieinteraktywnej (CI, skrypty) przekaż klucz bezpośrednio:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providerzy i punkty końcowe

| Provider          | Punkt końcowy                            | Przypadek użycia |
| ----------------- | ---------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`       | Modele ogólne    |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modele do kodowania |

<Note>
Obaj providerzy są konfigurowani z jednego klucza API. Konfiguracja automatycznie rejestruje oba.
</Note>

## Dostępne modele

<Tabs>
  <Tab title="Ogólne (volcengine)">
    | Model ref                                    | Nazwa                           | Wejście     | Kontekst |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Kodowanie (volcengine-plan)">
    | Model ref                                         | Nazwa                    | Wejście | Kontekst |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text    | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text    | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text    | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text    | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text    | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text    | 256,000  |
  </Tab>
</Tabs>

## Uwagi zaawansowane

<AccordionGroup>
  <Accordion title="Model domyślny po onboardingu">
    `openclaw onboard --auth-choice volcengine-api-key` obecnie ustawia
    `volcengine-plan/ark-code-latest` jako model domyślny, jednocześnie rejestrując
    ogólny katalog `volcengine`.
  </Accordion>

  <Accordion title="Zachowanie awaryjne selektora modeli">
    Podczas onboardingu / konfiguracji wyboru modelu opcja uwierzytelniania Volcengine preferuje
    zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są
    jeszcze wczytane, OpenClaw awaryjnie przechodzi do nieprzefiltrowanego katalogu zamiast pokazywać
    pusty selektor ograniczony do providera.
  </Accordion>

  <Accordion title="Zmienne środowiskowe dla procesów daemon">
    Jeśli Gateway działa jako daemon (launchd / systemd), upewnij się, że
    `VOLCANO_ENGINE_API_KEY` jest dostępne dla tego procesu (na przykład w
    `~/.openclaw/.env` lub przez `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Przy uruchamianiu OpenClaw jako usługi działającej w tle zmienne środowiskowe ustawione w
interaktywnej powłoce nie są automatycznie dziedziczone. Zobacz powyższą uwagę o daemonach.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, model refs i zachowania failover.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i providerów.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
  <Card title="FAQ" href="/pl/help/faq" icon="circle-question">
    Często zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
