---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modeli
    - Potrzebujesz procesu `openclaw models auth login-github-copilot`
summary: Zaloguj się do GitHub Copilot z OpenClaw za pomocą device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:56:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot to asystent kodowania AI od GitHub. Zapewnia dostęp do modeli
Copilot dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako
dostawcy modeli na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego procesu logowania urządzenia, aby uzyskać token GitHub, a następnie wymienić go na
    tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka,
    ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Zostaniesz poproszony o odwiedzenie adresu URL i wprowadzenie jednorazowego kodu. Pozostaw
        terminal otwarty do czasu zakończenia procesu.
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Lub w konfiguracji:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego pomostu. OpenClaw komunikuje się z
    punktem końcowym `/v1` proxy i używa listy modeli skonfigurowanej w tym miejscu.

    <Note>
    Wybierz tę opcję, jeśli już używasz Copilot Proxy w VS Code lub chcesz kierować ruch
    przez niego. Musisz włączyć Plugin i utrzymywać działające rozszerzenie VS Code.
    </Note>

  </Tab>
</Tabs>

## Opcjonalne flagi

| Flaga           | Opis                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pomija monit o potwierdzenie                        |
| `--set-default` | Ustawia także zalecany domyślny model dostawcy      |

```bash
# Pomiń potwierdzenie
openclaw models auth login-github-copilot --yes

# Zaloguj się i ustaw model domyślny w jednym kroku
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Proces logowania urządzenia wymaga interaktywnego TTY. Uruchom go bezpośrednio w
    terminalu, a nie w nieinteraktywnym skrypcie ani potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie
    odrzucony, spróbuj innego identyfikatora (na przykład `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Wybór transportu">
    Identyfikatory modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT,
    serii o oraz Gemini zachowują transport OpenAI Responses. OpenClaw
    wybiera właściwy transport na podstawie odwołania do modelu.
  </Accordion>

  <Accordion title="Zgodność żądań">
    OpenClaw wysyła nagłówki żądań w stylu Copilot IDE w transportach Copilot,
    w tym wbudowane Compaction, tury wyników narzędzi i kolejne tury z obrazami. Nie
    włącza kontynuacji Responses na poziomie dostawcy dla Copilot, chyba że
    takie zachowanie zostało zweryfikowane względem API Copilot.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje uwierzytelnianie Copilot ze zmiennych środowiskowych w następującej
    kolejności priorytetu:

    | Priorytet | Zmienna               | Uwagi                                  |
    | --------- | --------------------- | -------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2         | `GH_TOKEN`            | Token GitHub CLI (zapasowy)            |
    | 3         | `GITHUB_TOKEN`        | Standardowy token GitHub (najniższy)   |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Proces logowania urządzenia (`openclaw models auth login-github-copilot`) przechowuje
    swój token w magazynie profili uwierzytelniania i ma pierwszeństwo przed wszystkimi
    zmiennymi środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenu">
    Logowanie przechowuje token GitHub w magazynie profili uwierzytelniania i wymienia go
    na token API Copilot podczas działania OpenClaw. Nie musisz zarządzać
    tokenem ręcznie.
  </Accordion>
</AccordionGroup>

<Warning>
Wymaga interaktywnego TTY. Uruchom polecenie logowania bezpośrednio w terminalu, a nie
wewnątrz bezgłowego skryptu ani zadania CI.
</Warning>

## Embeddingi wyszukiwania pamięci

GitHub Copilot może również służyć jako dostawca embeddingów dla
[wyszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
jesteś zalogowany, OpenClaw może używać go do embeddingów bez osobnego klucza API.

### Automatyczne wykrywanie

Gdy `memorySearch.provider` ma wartość `"auto"` (domyślnie), najpierw próbowany jest GitHub Copilot
z priorytetem 15 — po lokalnych embeddingach, ale przed OpenAI i innymi płatnymi
dostawcami. Jeśli dostępny jest token GitHub, OpenClaw wykrywa dostępne
modele embeddingów z API Copilot i automatycznie wybiera najlepszy.

### Jawna konfiguracja

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcjonalnie: zastąp model wykryty automatycznie
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Jak to działa

1. OpenClaw rozwiązuje Twój token GitHub (ze zmiennych środowiskowych lub profilu uwierzytelniania).
2. Wymienia go na krótkotrwały token API Copilot.
3. Odpytuje punkt końcowy Copilot `/models`, aby wykryć dostępne modele embeddingów.
4. Wybiera najlepszy model (preferuje `text-embedding-3-small`).
5. Wysyła żądania embeddingów do punktu końcowego Copilot `/embeddings`.

Dostępność modeli zależy od Twojego planu GitHub. Jeśli żadne modele embeddingów nie są
dostępne, OpenClaw pomija Copilot i próbuje następnego dostawcy.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
