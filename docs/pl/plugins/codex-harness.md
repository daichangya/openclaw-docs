---
read_when:
    - Chcesz użyć dołączonego harness app-server Codex.
    - Potrzebujesz przykładów konfiguracji harness Codex.
    - Chcesz, aby wdrożenia wyłącznie z Codex kończyły się błędem zamiast wracać do PI.
summary: Uruchamianie osadzonych tur agenta OpenClaw przez dołączony harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
app-server Codex zamiast przez wbudowany harness PI.

Używaj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta: wykrywaniem
modeli, natywnym wznawianiem wątków, natywną Compaction i wykonaniem app-server.
OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modelu, narzędziami,
zatwierdzeniami, dostarczaniem multimediów i widocznym lustrzanym odbiciem transkryptu.

Jeśli próbujesz się zorientować, zacznij od
[Agent runtimes](/pl/concepts/agent-runtimes). Krótka wersja jest taka:
`openai/gpt-5.5` to referencja modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

Natywne tury Codex zachowują hooki Plugin OpenClaw jako publiczną warstwę zgodności.
Są to hooki OpenClaw uruchamiane w procesie, a nie hooki poleceń Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkryptu
- `agent_end`

Pluginy mogą także rejestrować neutralne względem runtime middleware wyników narzędzi, aby przepisywać dynamiczne wyniki narzędzi OpenClaw po wykonaniu narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. To jest oddzielone od publicznego hooka Plugin `tool_result_persist`, który przekształca zapisy wyników narzędzi w transkrypcie należącym do OpenClaw.

Informacje o samej semantyce hooków Plugin znajdziesz w [Plugin hooks](/pl/plugins/hooks)
oraz [Plugin guard behavior](/pl/tools/plugin).

Harness jest domyślnie wyłączony. Nowe konfiguracje powinny zachowywać referencje modeli OpenAI
w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`embeddedHarness.runtime: "codex"` albo `OPENCLAW_AGENT_RUNTIME=codex`, gdy
chcą natywnego wykonania przez app-server. Starsze referencje modeli `codex/*` nadal automatycznie wybierają
harness dla zgodności, ale starsze prefiksy dostawców wspierane przez runtime nie są pokazywane jako zwykłe wybory modelu/dostawcy.

## Wybierz właściwy prefiks modelu

Trasy rodziny OpenAI są zależne od prefiksu. Używaj `openai-codex/*`, gdy chcesz
OAuth Codex przez PI; używaj `openai/*`, gdy chcesz bezpośredniego dostępu do OpenAI API albo
gdy wymuszasz natywny harness app-server Codex:

| Referencja modelu                                     | Ścieżka runtime                              | Użyj, gdy                                                                 |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Dostawca OpenAI przez mechanikę OpenClaw/PI  | Chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OAuth OpenAI Codex przez OpenClaw/PI         | Chcesz uwierzytelniania subskrypcji ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex                     | Chcesz natywnego wykonania osadzonej tury agenta przez app-server Codex.   |

GPT-5.5 jest obecnie w OpenClaw dostępny tylko przez subskrypcję/OAuth. Używaj
`openai-codex/gpt-5.5` dla OAuth PI albo `openai/gpt-5.5` z harness app-server
Codex. Bezpośredni dostęp przez klucz API dla `openai/gpt-5.5` będzie obsługiwany,
gdy OpenAI włączy GPT-5.5 w publicznym API.

Starsze referencje `codex/gpt-*` są nadal akceptowane jako aliasy zgodności. Migracja zgodności Doctor przepisuje starsze główne referencje runtime na kanoniczne referencje modeli i zapisuje politykę runtime osobno, natomiast starsze referencje używane tylko jako fallback pozostają bez zmian, ponieważ runtime jest konfigurowany dla całego kontenera agenta.
Nowe konfiguracje OAuth PI Codex powinny używać `openai-codex/gpt-*`; nowe konfiguracje
natywnego harness app-server powinny używać `openai/gpt-*` plus
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` stosuje ten sam podział prefiksów. Używaj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy OAuth OpenAI
Codex. Używaj `codex/gpt-*`, gdy rozumienie obrazów ma działać
przez ograniczoną turę app-server Codex. Model app-server Codex musi
deklarować obsługę wejścia obrazów; modele tekstowe Codex kończą się błędem, zanim
rozpocznie się tura multimedialna.

Użyj `/status`, aby potwierdzić efektywny harness dla bieżącej sesji. Jeśli wybór jest zaskakujący, włącz logowanie debug dla podsystemu `agents/harness`
i sprawdź ustrukturyzowany rekord gateway `agent harness selected`. Zawiera on
identyfikator wybranego harness, powód wyboru, politykę runtime/fallback oraz,
w trybie `auto`, wynik obsługi dla każdego kandydata Plugin.

Wybór harness nie jest mechanizmem sterowania sesją na żywo. Gdy uruchamiana jest osadzona tura,
OpenClaw zapisuje identyfikator wybranego harness w tej sesji i nadal go używa
dla kolejnych tur w tym samym identyfikatorze sesji. Zmień konfigurację `embeddedHarness` lub
`OPENCLAW_AGENT_RUNTIME`, jeśli chcesz, aby przyszłe sesje używały innego harness;
użyj `/new` albo `/reset`, aby rozpocząć nową sesję przed przełączeniem istniejącej rozmowy między PI a Codex. Pozwala to uniknąć odtwarzania jednego transkryptu przez dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypięciem harness są traktowane jako przypięte do PI, jeśli mają już historię transkryptu. Użyj `/new` albo `/reset`, aby włączyć dla tej rozmowy Codex po zmianie konfiguracji.

`/status` pokazuje efektywny runtime modelu. Domyślny harness PI pojawia się jako
`Runtime: OpenClaw Pi Default`, a harness app-server Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- Codex app-server `0.118.0` lub nowszy.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub niezweryfikowane handshake app-server. Dzięki temu
OpenClaw pozostaje przy powierzchni protokołu, z którą był testowany.

W przypadku testów smoke live i Docker uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, plus
opcjonalne pliki CLI Codex, takie jak `~/.codex/auth.json` i
`~/.codex/config.toml`. Używaj tych samych materiałów uwierzytelniających, których używa lokalny app-server Codex.

## Minimalna konfiguracja

Użyj `openai/gpt-5.5`, włącz dołączony Plugin i wymuś harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij tam także `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Starsze konfiguracje ustawiające `agents.defaults.model` lub model agenta na
`codex/<model>` nadal automatycznie włączają dołączony Plugin `codex`. Nowe konfiguracje powinny
preferować `openai/<model>` plus jawny wpis `embeddedHarness` powyżej.

## Dodaj Codex obok innych modeli

Nie ustawiaj globalnie `runtime: "codex"`, jeśli ten sam agent ma swobodnie przełączać się
między Codex a modelami innych dostawców. Wymuszony runtime dotyczy każdej
osadzonej tury dla tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy
ten runtime jest wymuszony, OpenClaw nadal spróbuje użyć harness Codex i zakończy się
bezpiecznym błędem zamiast po cichu kierować tę turę przez PI.

Zamiast tego użyj jednego z tych układów:

- Umieść Codex na dedykowanym agencie z `embeddedHarness.runtime: "codex"`.
- Utrzymuj domyślnego agenta na `runtime: "auto"` i fallbacku PI dla normalnego użycia z mieszanymi
  dostawcami.
- Używaj starszych referencji `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować
  `openai/*` plus jawną politykę runtime Codex.

Na przykład poniższa konfiguracja utrzymuje domyślnego agenta przy normalnym automatycznym wyborze i
dodaje osobnego agenta Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

W tym układzie:

- Domyślny agent `main` używa zwykłej ścieżki dostawcy i fallbacku zgodności PI.
- Agent `codex` używa harness app-server Codex.
- Jeśli dla agenta `codex` Codex będzie niedostępny albo nieobsługiwany, tura zakończy się
  błędem zamiast po cichu używać PI.

## Wdrożenia wyłącznie z Codex

Wymuś harness Codex, gdy musisz udowodnić, że każda osadzona tura agenta
używa Codex. Jawne runtime Plugin domyślnie nie mają fallbacku PI, więc
`fallback: "none"` jest opcjonalne, ale często przydatne jako dokumentacja:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nadpisanie środowiskowe:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy wymuszonym Codex OpenClaw kończy się błędem wcześnie, jeśli Plugin Codex jest wyłączony,
app-server jest zbyt stary albo app-server nie może się uruchomić. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby PI
obsługiwał brakujący wybór harness.

## Codex per agent

Możesz sprawić, że jeden agent będzie działał wyłącznie z Codex, podczas gdy domyślny agent zachowa zwykły
automatyczny wybór:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Używaj zwykłych poleceń sesji do przełączania agentów i modeli. `/new` tworzy świeżą
sesję OpenClaw, a harness Codex tworzy lub wznawia swój poboczny wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala następnej turze ponownie ustalić harness na podstawie bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie nie powiedzie się albo przekroczy limit czasu, używa dołączonego katalogu fallback dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Możesz dostroić wykrywanie w `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Wyłącz wykrywanie, gdy chcesz, aby uruchamianie unikało sondowania Codex i trzymało się
katalogu fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Połączenie z app-server i polityka

Domyślnie Plugin uruchamia Codex lokalnie przez:

```bash
codex app-server --listen stdio://
```

Domyślnie OpenClaw uruchamia lokalne sesje harness Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeatów: Codex może używać narzędzi powłoki i sieci
bez zatrzymywania się na natywnych promptach zatwierdzania, na które nikt nie czeka, aby odpowiedzieć.

Aby włączyć zatwierdzania przeglądane przez guardian Codex, ustaw `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Tryb guardian używa natywnej ścieżki auto-review zatwierdzeń Codex. Gdy Codex prosi o
opuszczenie sandbox, zapis poza obszarem roboczym albo dodanie uprawnień takich jak dostęp do sieci, Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca konkretne żądanie. Używaj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO, ale nadal potrzebujesz, aby nienadzorowani agenci robili postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` oraz `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą łączyć
preset z jawnie ustawionymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest
nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać
`auto_review`.

Dla już uruchomionego app-server użyj transportu WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Obsługiwane pola `appServer`:

| Pole                | Domyślnie                                | Znaczenie                                                                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                   |
| `command`           | `"codex"`                                | Plik wykonywalny dla transportu stdio.                                                                        |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                               |
| `url`               | nieustawione                             | URL app-server WebSocket.                                                                                     |
| `authToken`         | nieustawione                             | Token bearer dla transportu WebSocket.                                                                        |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                 |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań control plane do app-server.                                                          |
| `mode`              | `"yolo"`                                 | Preset dla wykonania YOLO lub z zatwierdzaniem sprawdzanym przez guardian.                                    |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzania Codex wysyłana przy starcie/wznowieniu/turze wątku.                           |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy starcie/wznowieniu wątku.                                            |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne prompty zatwierdzania. `guardian_subagent` pozostaje starszym aliasem. |
| `serviceTier`       | nieustawione                             | Opcjonalny poziom usługi app-server Codex: `"fast"`, `"flex"` albo `null`. Nieprawidłowe starsze wartości są ignorowane. |

Starsze zmienne środowiskowe nadal działają jako fallback do testów lokalnych, gdy
pasujące pole konfiguracji nie jest ustawione:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` zamiast tego albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Preferowana jest konfiguracja
dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Plugin w tym samym
sprawdzanym pliku co reszta konfiguracji harness Codex.

## Typowe przepisy

Lokalny Codex z domyślnym transportem stdio:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Walidacja harness wyłącznie z Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Zatwierdzenia Codex sprawdzane przez guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Zdalny app-server z jawnymi nagłówkami:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Przełączanie modeli pozostaje pod kontrolą OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła do
app-server aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzeń, sandbox i poziom usługi.
Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje
powiązanie z wątkiem, ale prosi Codex o kontynuację z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest ono
generyczne i działa na każdym kanale obsługującym tekstowe polecenia OpenClaw.

Typowe formy:

- `/codex status` pokazuje bieżącą łączność z app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla bieżące modele app-server Codex.
- `/codex threads [filter]` wyświetla listę ostatnich wątków Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o Compaction dołączonego wątku.
- `/codex review` uruchamia natywny review Codex dla dołączonego wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

`/codex resume` zapisuje ten sam poboczny plik powiązania, którego harness używa do
zwykłych tur. Przy następnej wiadomości OpenClaw wznowi ten wątek Codex, przekaże
do app-server aktualnie wybrany model OpenClaw i zachowa
włączoną rozszerzoną historię.

Powierzchnia poleceń wymaga Codex app-server `0.118.0` lub nowszego. Poszczególne
metody sterujące są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin między harness PI i Codex.                 |
| Middleware rozszerzeń app-server Codex| Dołączone Pluginy OpenClaw | Zachowanie adaptera per tura wokół dynamicznych narzędzi OpenClaw. |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa plików projektowych ani globalnych `hooks.json` Codex do routingu
zachowania Plugin OpenClaw. Dla obsługiwanego natywnego mostu narzędzi i uprawnień
OpenClaw wstrzykuje konfigurację Codex per wątek dla `PreToolUse`, `PostToolUse` i
`PermissionRequest`. Inne hooki Codex, takie jak `SessionStart`,
`UserPromptSubmit` i `Stop`, pozostają mechanizmami na poziomie Codex; nie są udostępniane
jako hooki Plugin OpenClaw w kontrakcie v1.

Dla dynamicznych narzędzi OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware, którego jest właścicielem, w
adapterze harness. Dla natywnych narzędzi Codex to Codex posiada kanoniczny rekord narzędzia.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisać natywnego wątku Codex,
chyba że Codex udostępni tę operację przez app-server lub natywne callbacki hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień app-server Codex
oraz ze stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia OpenClaw `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` są obserwacjami na poziomie adaptera, a nie przechwyceniami 1:1
wewnętrznego żądania lub ładunku Compaction Codex.

Natywne powiadomienia app-server Codex `hook/started` i `hook/completed` są
rzutowane jako zdarzenia agenta `codex_app_server.hook` dla trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt wsparcia V1

Tryb Codex nie jest PI z innym wywołaniem modelu pod spodem. Codex zarządza większą częścią
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w runtime Codex v1:

| Powierzchnia                            | Obsługa                                 | Dlaczego                                                                                                                                   |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Pętla modelu OpenAI przez Codex         | Obsługiwane                             | App-server Codex zarządza turą OpenAI, natywnym wznawianiem wątków i natywną kontynuacją narzędzi.                                       |
| Routing i dostarczanie kanałów OpenClaw | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza runtime modelu.                                                |
| Dynamiczne narzędzia OpenClaw           | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje na ścieżce wykonania.                                            |
| Pluginy promptu i kontekstu             | Obsługiwane                             | OpenClaw buduje nakładki promptu i rzutuje kontekst do tury Codex przed uruchomieniem lub wznowieniem wątku.                            |
| Cykl życia silnika kontekstu            | Obsługiwane                             | Assemble, ingest lub utrzymanie po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                          |
| Hooki dynamicznych narzędzi             | Obsługiwane                             | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamicznych narzędzi należących do OpenClaw.        |
| Hooki cyklu życia                       | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` uruchamiają się z uczciwymi ładunkami trybu Codex.     |
| Blokowanie lub obserwacja natywnej powłoki i patch | Obsługiwane przez natywny przekaźnik hooków | `PreToolUse` i `PostToolUse` Codex są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień              | Obsługiwane przez natywny przekaźnik hooków | `PermissionRequest` Codex może być kierowane przez politykę OpenClaw tam, gdzie runtime to udostępnia.                                   |
| Przechwytywanie trajektorii app-server  | Obsługiwane                             | OpenClaw zapisuje żądanie wysłane do app-server i powiadomienia app-server, które odbiera.                                              |

Nieobsługiwane w runtime Codex v1:

| Powierzchnia                                         | Granica v1                                                                                                                                      | Przyszła ścieżka                                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Natywna mutacja argumentów narzędzi                  | Natywne hooki Codex przed wywołaniem narzędzia mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych dla Codex.            | Wymaga wsparcia hooków/schematu Codex dla zastępowania danych wejściowych narzędzia.                     |
| Edytowalna historia transkryptu natywnego Codex      | Codex zarządza kanoniczną historią natywnego wątku. OpenClaw zarządza kopią lustrzaną i może projektować przyszły kontekst, ale nie powinien mutować niewspieranych wewnętrznych elementów. | Dodaj jawne API serwera aplikacji Codex, jeśli potrzebna będzie ingerencja w natywny wątek.              |
| `tool_result_persist` dla rekordów narzędzi natywnych Codex | Ten hook przekształca zapisy transkryptu należące do OpenClaw, a nie rekordy narzędzi natywnych Codex.                                         | Mógłby odzwierciedlać przekształcone rekordy, ale kanoniczne przepisywanie wymaga wsparcia Codex.        |
| Rozbudowane natywne metadane Compaction              | OpenClaw obserwuje rozpoczęcie i zakończenie Compaction, ale nie otrzymuje stabilnej listy zachowanych/usuniętych elementów, delty tokenów ani ładunku podsumowania. | Wymaga bogatszych zdarzeń Compaction w Codex.                                                             |
| Interwencja w Compaction                             | Obecne hooki Compaction w OpenClaw mają w trybie Codex poziom wyłącznie powiadomień.                                                           | Dodaj hooki Codex przed/po Compaction, jeśli Pluginy mają móc wetować lub przepisywać natywny Compaction. |
| Zatrzymywanie lub bramkowanie odpowiedzi końcowej    | Codex ma natywne hooki stop, ale OpenClaw nie udostępnia bramkowania odpowiedzi końcowej jako kontraktu Plugin v1.                            | Przyszły prymityw opt-in z zabezpieczeniami pętli i limitu czasu.                                         |
| Parzystość natywnych hooków MCP jako zatwierdzona powierzchnia v1 | Przekaźnik jest generyczny, ale OpenClaw nie objął jeszcze wersjonowaniem i testami natywnego zachowania hooków MCP end to end.               | Dodaj testy i dokumentację przekaźnika MCP w OpenClaw, gdy obsługiwany minimalny poziom protokołu serwera aplikacji obejmie te ładunki. |
| Przechwytywanie żądań API modelu bajt w bajt         | OpenClaw może przechwytywać żądania i powiadomienia serwera aplikacji, ale rdzeń Codex wewnętrznie buduje końcowe żądanie OpenAI API.         | Wymaga zdarzenia śledzenia żądań modelu Codex lub debug API.                                              |

## Narzędzia, multimedia i Compaction

Harness Codex zmienia tylko niskopoziomowy osadzony executor agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi do wiadomości nadal przechodzą przez normalną ścieżkę dostarczania
OpenClaw.

Przekaźnik natywnych hooków jest celowo generyczny, ale kontrakt wsparcia v1
jest ograniczony do natywnych ścieżek narzędzi i uprawnień Codex, które
OpenClaw testuje. Nie zakładaj, że każde przyszłe zdarzenie hooka Codex jest
powierzchnią Pluginu OpenClaw, dopóki kontrakt wykonawczy tego nie nazwie.

Wywołania zatwierdzeń dla narzędzi Codex MCP są kierowane przez przepływ
zatwierdzania Pluginu w OpenClaw, gdy Codex oznaczy `_meta.codex_approval_kind`
jako `"mcp_tool_call"`. Prompty Codex `request_user_input` są odsyłane do
czatu źródłowego, a kolejna zakolejkowana wiadomość uzupełniająca odpowiada na
to natywne żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne
żądania wywołań MCP nadal kończą się bezpieczną odmową.

Gdy wybrany model używa harnessu Codex, natywny Compaction wątku jest
delegowany do serwera aplikacji Codex. OpenClaw utrzymuje lustrzaną kopię
transkryptu na potrzeby historii kanału, wyszukiwania, `/new`, `/reset` oraz
przyszłego przełączania modelu lub harnessu. Kopia lustrzana obejmuje prompt
użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu
Codex, gdy serwer aplikacji je emituje. Obecnie OpenClaw rejestruje jedynie
sygnały rozpoczęcia i zakończenia natywnego Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani możliwej do audytu listy
wpisów, które Codex zachował po Compaction.

Ponieważ Codex zarządza kanonicznym natywnym wątkiem, `tool_result_persist`
obecnie nie przepisuje rekordów wyników narzędzi natywnych Codex. Ma
zastosowanie tylko wtedy, gdy OpenClaw zapisuje wynik narzędzia w transkrypcie
sesji należącym do OpenClaw.

Generowanie multimediów nie wymaga PI. Generowanie obrazów, wideo, muzyki, PDF,
TTS oraz rozumienie multimediów nadal używają odpowiadających ustawień
dostawcy/modelu, takich jak `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` i `messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** to jest oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*` z
`embeddedHarness.runtime: "codex"` (lub starszy odnośnik `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `runtime: "auto"` nadal może używać PI jako
backendu zgodności, gdy żaden harness Codex nie przejmuje wykonania. Ustaw
`embeddedHarness.runtime: "codex"`, aby wymusić wybór Codex podczas testów.
Wymuszony runtime Codex teraz kończy się błędem zamiast przechodzić awaryjnie do
PI, chyba że jawnie ustawisz `embeddedHarness.fallback: "pi"`. Gdy serwer
aplikacji Codex zostanie wybrany, jego błędy są ujawniane bezpośrednio, bez
dodatkowej konfiguracji fallback.

**Serwer aplikacji jest odrzucany:** zaktualizuj Codex tak, aby handshake
serwera aplikacji raportował wersję `0.118.0` lub nowszą.

**Wykrywanie modeli jest wolne:** obniż
`plugins.entries.codex.config.discovery.timeoutMs` lub wyłącz discovery.

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź
`appServer.url`, `authToken` oraz czy zdalny serwer aplikacji mówi tą samą
wersją protokołu serwera aplikacji Codex.

**Model inny niż Codex używa PI:** to jest oczekiwane, chyba że wymusiłeś
`embeddedHarness.runtime: "codex"` dla tego agenta lub wybrałeś starszy odnośnik
`codex/*`. Zwykłe odnośniki `openai/gpt-*` i inne odnośniki dostawców pozostają
na swojej normalnej ścieżce dostawcy w trybie `auto`. Jeśli wymusisz
`runtime: "codex"`, każda osadzona tura tego agenta musi być modelem OpenAI
obsługiwanym przez Codex.

## Powiązane

- [Pluginy harnessu agenta](/pl/plugins/sdk-agent-harness)
- [Runtime’y agentów](/pl/concepts/agent-runtimes)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dostawca OpenAI](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Hooki Pluginów](/pl/plugins/hooks)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing-live#live-codex-app-server-harness-smoke)
