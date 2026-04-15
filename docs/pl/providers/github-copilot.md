---
read_when:
    - Chcesz używać GitHub Copilot jako dostawcy modeli
    - Potrzebujesz przepływu `openclaw models auth login-github-copilot`
summary: Zaloguj się do GitHub Copilot z OpenClaw za pomocą przepływu urządzenia
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-15T09:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8258fecff22fb73b057de878462941f6eb86d0c5f775c5eac4840e95ba5eccf
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot to asystent kodowania AI od GitHub. Zapewnia dostęp do modeli Copilot
dla Twojego konta i planu GitHub. OpenClaw może używać Copilot jako dostawcy modeli
na dwa różne sposoby.

## Dwa sposoby używania Copilot w OpenClaw

<Tabs>
  <Tab title="Wbudowany dostawca (github-copilot)">
    Użyj natywnego przepływu logowania urządzenia, aby uzyskać token GitHub, a następnie wymienić go na
    tokeny API Copilot podczas działania OpenClaw. To **domyślna** i najprostsza ścieżka,
    ponieważ nie wymaga VS Code.

    <Steps>
      <Step title="Uruchom polecenie logowania">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Zostaniesz poproszony o odwiedzenie adresu URL i wpisanie jednorazowego kodu. Pozostaw
        terminal otwarty, aż proces się zakończy.
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        Lub w konfiguracji:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Użyj rozszerzenia VS Code **Copilot Proxy** jako lokalnego mostu. OpenClaw komunikuje się z
    endpointem `/v1` proxy i używa listy modeli skonfigurowanej w tym miejscu.

    <Note>
    Wybierz tę opcję, jeśli już używasz Copilot Proxy w VS Code albo musisz kierować ruch
    przez niego. Musisz włączyć Plugin i pozostawić uruchomione rozszerzenie VS Code.
    </Note>

  </Tab>
</Tabs>

## Flagi opcjonalne

| Flaga           | Opis                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Pomiń monit o potwierdzenie                         |
| `--set-default` | Zastosuj także zalecany domyślny model dostawcy     |

```bash
# Pomiń potwierdzenie
openclaw models auth login-github-copilot --yes

# Zaloguj i ustaw model domyślny w jednym kroku
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Wymagany interaktywny TTY">
    Przepływ logowania urządzenia wymaga interaktywnego TTY. Uruchom go bezpośrednio w
    terminalu, a nie w nieinteraktywnym skrypcie ani potoku CI.
  </Accordion>

  <Accordion title="Dostępność modeli zależy od Twojego planu">
    Dostępność modeli Copilot zależy od Twojego planu GitHub. Jeśli model zostanie
    odrzucony, spróbuj użyć innego ID (na przykład `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Wybór transportu">
    ID modeli Claude automatycznie używają transportu Anthropic Messages. Modele GPT,
    o-series i Gemini zachowują transport OpenAI Responses. OpenClaw
    wybiera właściwy transport na podstawie odwołania do modelu.
  </Accordion>

  <Accordion title="Kolejność rozwiązywania zmiennych środowiskowych">
    OpenClaw rozwiązuje uwierzytelnianie Copilot ze zmiennych środowiskowych w następującej
    kolejności priorytetów:

    | Priorytet | Zmienna              | Uwagi                                  |
    | --------- | -------------------- | -------------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Najwyższy priorytet, specyficzna dla Copilot |
    | 2         | `GH_TOKEN`           | Token GitHub CLI (zapasowy)            |
    | 3         | `GITHUB_TOKEN`       | Standardowy token GitHub (najniższy)   |

    Gdy ustawionych jest wiele zmiennych, OpenClaw używa tej o najwyższym priorytecie.
    Przepływ logowania urządzenia (`openclaw models auth login-github-copilot`) zapisuje
    swój token w magazynie profili uwierzytelniania i ma pierwszeństwo przed wszystkimi
    zmiennymi środowiskowymi.

  </Accordion>

  <Accordion title="Przechowywanie tokenu">
    Logowanie zapisuje token GitHub w magazynie profili uwierzytelniania i wymienia go
    na token API Copilot podczas działania OpenClaw. Nie musisz zarządzać
    tokenem ręcznie.
  </Accordion>
</AccordionGroup>

<Warning>
Wymagany jest interaktywny TTY. Uruchom polecenie logowania bezpośrednio w terminalu, a nie
wewnątrz skryptu bez interfejsu ani zadania CI.
</Warning>

## Embeddingi wyszukiwania pamięci

GitHub Copilot może również służyć jako dostawca embeddingów dla
[wyszukiwania pamięci](/pl/concepts/memory-search). Jeśli masz subskrypcję Copilot i
się zalogowałeś, OpenClaw może używać go do embeddingów bez osobnego klucza API.

### Automatyczne wykrywanie

Gdy `memorySearch.provider` ma wartość `"auto"` (domyślnie), GitHub Copilot jest sprawdzany
z priorytetem 15 — po lokalnych embeddingach, ale przed OpenAI i innymi płatnymi
dostawcami. Jeśli token GitHub jest dostępny, OpenClaw wykrywa dostępne
modele embeddingów z API Copilot i automatycznie wybiera najlepszy.

### Jawna konfiguracja

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Opcjonalnie: zastąp automatycznie wykryty model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Jak to działa

1. OpenClaw rozwiązuje Twój token GitHub (ze zmiennych środowiskowych lub profilu uwierzytelniania).
2. Wymienia go na krótkotrwały token API Copilot.
3. Odpytuje endpoint Copilot `/models`, aby wykryć dostępne modele embeddingów.
4. Wybiera najlepszy model (preferuje `text-embedding-3-small`).
5. Wysyła żądania embeddingów do endpointu Copilot `/embeddings`.

Dostępność modeli zależy od Twojego planu GitHub. Jeśli żadne modele embeddingów nie są
dostępne, OpenClaw pomija Copilot i próbuje użyć następnego dostawcy.

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania awaryjnego.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
