---
read_when:
    - Chcesz używać Qwen z OpenClaw
    - Wcześniej używano Qwen OAuth
summary: Używanie Qwen Cloud przez dołączonego providera qwen w OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T10:07:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth został usunięty.** Integracja OAuth darmowego poziomu
(`qwen-portal`), która używała punktów końcowych `portal.qwen.ai`, nie jest już dostępna.
Szczegóły znajdziesz w [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

OpenClaw traktuje teraz Qwen jako pełnoprawnego dołączonego providera o kanonicznym identyfikatorze
`qwen`. Dołączony provider kieruje ruch do punktów końcowych Qwen Cloud / Alibaba DashScope oraz
Coding Plan i zachowuje działanie starszych identyfikatorów `modelstudio` jako
aliasu zgodności.

- Provider: `qwen`
- Preferowana zmienna env: `QWEN_API_KEY`
- Akceptowane także ze względu na zgodność: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Styl API: zgodny z OpenAI

<Tip>
Jeśli chcesz używać `qwen3.6-plus`, preferuj punkt końcowy **Standard (pay-as-you-go)**.
Obsługa Coding Plan może być opóźniona względem publicznego katalogu.
</Tip>

## Pierwsze kroki

Wybierz typ planu i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Coding Plan (subskrypcja)">
    **Najlepsze dla:** dostępu opartego na subskrypcji przez Qwen Coding Plan.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz lub skopiuj klucz API z [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
        Dla punktu końcowego **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Dla punktu końcowego **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Zweryfikuj dostępność modelu">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory `modelstudio-*` w `auth-choice` oraz referencje modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory `qwen-*` w `auth-choice` i referencje modeli `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Najlepsze dla:** dostępu pay-as-you-go przez punkt końcowy Standard Model Studio, w tym modeli takich jak `qwen3.6-plus`, które mogą nie być dostępne w Coding Plan.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz lub skopiuj klucz API z [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
        Dla punktu końcowego **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Dla punktu końcowego **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Zweryfikuj dostępność modelu">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Starsze identyfikatory `modelstudio-*` w `auth-choice` oraz referencje modeli `modelstudio/...` nadal
    działają jako aliasy zgodności, ale nowe przepływy konfiguracji powinny preferować kanoniczne
    identyfikatory `qwen-*` w `auth-choice` i referencje modeli `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Typy planów i punkty końcowe

| Plan                       | Region | Auth choice                | Punkt końcowy                                   |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subskrypcja)  | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subskrypcja)  | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider automatycznie wybiera punkt końcowy na podstawie Twojego `auth-choice`. Wybory kanoniczne
używają rodziny `qwen-*`; `modelstudio-*` pozostaje wyłącznie dla zgodności.
Możesz nadpisać to przez niestandardowe `baseUrl` w konfiguracji.

<Tip>
**Zarządzanie kluczami:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentacja:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Wbudowany katalog

OpenClaw obecnie dostarcza ten dołączony katalog Qwen. Skonfigurowany katalog jest
świadomy punktu końcowego: konfiguracje Coding Plan pomijają modele, o których wiadomo, że działają
tylko na punkcie końcowym Standard.

| Ref modelu                  | Wejście     | Kontekst  | Uwagi                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Model domyślny                                     |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Preferuj punkty końcowe Standard, gdy potrzebujesz tego modelu |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linia Qwen Max                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Thinking włączone                                  |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI przez Alibaba                          |

<Note>
Dostępność może nadal różnić się w zależności od punktu końcowego i planu rozliczeń, nawet jeśli model
jest obecny w dołączonym katalogu.
</Note>

## Dodatki multimodalne

Plugin `qwen` udostępnia także możliwości multimodalne w punktach końcowych **Standard**
DashScope (nie w punktach końcowych Coding Plan):

- **Rozumienie wideo** przez `qwen-vl-max-latest`
- **Generowanie wideo Wan** przez `wan2.6-t2v` (domyślnie), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Aby używać Qwen jako domyślnego providera wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór providera i zachowanie failover.
</Note>

## Zaawansowane

<AccordionGroup>
  <Accordion title="Rozumienie obrazów i wideo">
    Dołączony Plugin Qwen rejestruje rozumienie mediów dla obrazów i wideo
    w punktach końcowych **Standard** DashScope (nie w punktach końcowych Coding Plan).

    | Właściwość      | Wartość               |
    | --------------- | --------------------- |
    | Model           | `qwen-vl-max-latest`  |
    | Obsługiwane wejście | Obrazy, wideo     |

    Rozumienie mediów jest automatycznie rozstrzygane na podstawie skonfigurowanego auth Qwen — nie
    jest potrzebna dodatkowa konfiguracja. Upewnij się, że używasz punktu końcowego
    Standard (pay-as-you-go), aby uzyskać obsługę rozumienia mediów.

  </Accordion>

  <Accordion title="Dostępność Qwen 3.6 Plus">
    `qwen3.6-plus` jest dostępny w punktach końcowych Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Jeśli punkty końcowe Coding Plan zwracają błąd „unsupported model” dla
    `qwen3.6-plus`, przełącz się na Standard (pay-as-you-go) zamiast pary
    punkt końcowy/klucz Coding Plan.

  </Accordion>

  <Accordion title="Plan możliwości">
    Plugin `qwen` jest pozycjonowany jako dom dostawcy dla pełnej powierzchni Qwen
    Cloud, a nie tylko dla modeli coding/text.

    - **Modele text/chat:** dołączone teraz
    - **Wywoływanie narzędzi, output strukturalny, thinking:** dziedziczone z transportu zgodnego z OpenAI
    - **Generowanie obrazów:** planowane na poziomie Pluginu providera
    - **Rozumienie obrazów/wideo:** dołączone teraz na punkcie końcowym Standard
    - **Mowa/audio:** planowane na poziomie Pluginu providera
    - **Embeddingi/reranking pamięci:** planowane przez powierzchnię adaptera embeddingów
    - **Generowanie wideo:** dołączone teraz przez współdzieloną możliwość generowania wideo

  </Accordion>

  <Accordion title="Szczegóły generowania wideo">
    Dla generowania wideo OpenClaw mapuje skonfigurowany region Qwen na pasujący
    host DashScope AIGC przed wysłaniem zadania:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Oznacza to, że zwykłe `models.providers.qwen.baseUrl` wskazujące na hosty
    Coding Plan albo Standard Qwen nadal utrzymuje generowanie wideo na poprawnym
    regionalnym punkcie końcowym wideo DashScope.

    Obecne limity dołączonego generowania wideo Qwen:

    - Do **1** wyjściowego wideo na żądanie
    - Do **1** wejściowego obrazu
    - Do **4** wejściowych wideo
    - Do **10 sekund** czasu trwania
    - Obsługuje `size`, `aspectRatio`, `resolution`, `audio` i `watermark`
    - Tryb obrazu/wideo referencyjnego obecnie wymaga **zdalnych URL `http(s)`**. Lokalne
      ścieżki plików są z góry odrzucane, ponieważ punkt końcowy wideo DashScope nie
      akceptuje przesyłanych lokalnych buforów dla tych referencji.

  </Accordion>

  <Accordion title="Zgodność użycia strumieniowania">
    Natywne punkty końcowe Model Studio ogłaszają zgodność użycia strumieniowania na
    współdzielonym transporcie `openai-completions`. OpenClaw teraz opiera to na możliwościach punktu końcowego,
    więc niestandardowe identyfikatory providerów zgodnych z DashScope wskazujące na
    te same natywne hosty dziedziczą to samo zachowanie użycia strumieniowania zamiast
    wymagać konkretnie wbudowanego identyfikatora providera `qwen`.

    Zgodność natywnego użycia strumieniowania dotyczy zarówno hostów Coding Plan, jak i
    hostów zgodnych ze Standard DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiony punktów końcowych multimodalnych">
    Powierzchnie multimodalne (rozumienie wideo i generowanie wideo Wan) używają
    punktów końcowych **Standard** DashScope, a nie punktów końcowych Coding Plan:

    - Bazowy URL Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - Bazowy URL Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Konfiguracja środowiska i daemon">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `QWEN_API_KEY` jest
    dostępne dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/pl/providers/alibaba" icon="cloud">
    Starszy provider ModelStudio i uwagi dotyczące migracji.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
