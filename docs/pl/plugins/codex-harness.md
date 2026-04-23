---
read_when:
    - Chcesz używać dołączonego harnessu app-server Codex
    - Potrzebujesz referencji modeli Codex i przykładów konfiguracji
    - Chcesz wyłączyć zapasowe użycie Pi dla wdrożeń tylko z Codex
summary: Uruchamiaj osadzone tury agenta OpenClaw przez dołączony harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-23T10:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Dołączony plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
app-server Codex zamiast przez wbudowany harness Pi.

Używaj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta:
wykrywaniem modeli, natywnym wznawianiem wątków, natywną Compaction i wykonywaniem app-server.
OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modeli, narzędziami,
zatwierdzeniami, dostarczaniem multimediów oraz widocznym lustrzanym transkryptem.

Natywne tury Codex respektują też współdzielone hooki pluginów, dzięki czemu shimy promptów,
automatyzacja uwzględniająca Compaction, middleware narzędzi i obserwatorzy cyklu życia
pozostają zgodne z harnessem Pi:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

Dołączone pluginy mogą również rejestrować fabrykę rozszerzeń app-server Codex, aby dodać
asynchroniczne middleware `tool_result`.

Harness jest domyślnie wyłączony. Jest wybierany tylko wtedy, gdy plugin `codex` jest
włączony i rozpoznany model jest modelem `codex/*`, albo gdy jawnie wymusisz
`embeddedHarness.runtime: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.
Jeśli nigdy nie skonfigurujesz `codex/*`, istniejące uruchomienia Pi, OpenAI, Anthropic, Gemini, lokalne
i z niestandardowym dostawcą zachowają swoje obecne działanie.

## Wybierz właściwy prefiks modelu

OpenClaw ma osobne ścieżki dla dostępu w stylu OpenAI i Codex:

| Model ref              | Ścieżka runtime                             | Używaj, gdy                                                              |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`       | Dostawca OpenAI przez infrastrukturę OpenClaw/Pi | Chcesz bezpośredniego dostępu do API OpenAI Platform z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Dostawca OAuth OpenAI Codex przez Pi        | Chcesz OAuth ChatGPT/Codex bez harnessu app-server Codex.                |
| `codex/gpt-5.4`        | Dołączony dostawca Codex plus harness Codex | Chcesz natywnego wykonywania app-server Codex dla osadzonej tury agenta. |

Harness Codex przejmuje tylko referencje modeli `codex/*`. Istniejące referencje `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, lokalne i niestandardowych dostawców zachowują
swoje normalne ścieżki.

## Wymagania

- OpenClaw z dostępnym dołączonym plugin `codex`.
- App-server Codex `0.118.0` lub nowszy.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub niezweryfikowane handshake’i app-server. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, z którą był testowany.

W testach smoke live i Docker uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, plus
opcjonalne pliki CLI Codex, takie jak `~/.codex/auth.json` i
`~/.codex/config.toml`. Użyj tych samych materiałów uwierzytelniających, których używa Twój lokalny
app-server Codex.

## Minimalna konfiguracja

Użyj `codex/gpt-5.4`, włącz dołączony plugin i wymuś harness `codex`:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Jeśli Twoja konfiguracja używa `plugins.allow`, uwzględnij tam również `codex`:

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

Ustawienie `agents.defaults.model` lub modelu agenta na `codex/<model>` również
automatycznie włącza dołączony plugin `codex`. Jawny wpis pluginu nadal
jest przydatny we współdzielonych konfiguracjach, ponieważ jasno pokazuje zamiar wdrożenia.

## Dodanie Codex bez zastępowania innych modeli

Zachowaj `runtime: "auto"`, jeśli chcesz używać Codex dla modeli `codex/*`, a Pi dla
wszystkiego innego:

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

W tej konfiguracji:

- `/model codex` lub `/model codex/gpt-5.4` używa harnessu app-server Codex.
- `/model gpt` lub `/model openai/gpt-5.4` używa ścieżki dostawcy OpenAI.
- `/model opus` używa ścieżki dostawcy Anthropic.
- Jeśli zostanie wybrany model inny niż Codex, Pi pozostaje harness kompatybilności.

## Wdrożenia tylko z Codex

Wyłącz zapasowe użycie Pi, gdy musisz wykazać, że każda osadzona tura agenta używa
harnessu Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nadpisanie przez środowisko:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallback OpenClaw kończy działanie wcześniej, jeśli plugin Codex jest wyłączony,
żądany model nie jest referencją `codex/*`, app-server jest zbyt stary albo
app-server nie może się uruchomić.

## Codex dla konkretnego agenta

Możesz ustawić jednego agenta jako tylko Codex, podczas gdy agent domyślny zachowuje normalny
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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Używaj zwykłych poleceń sesji do przełączania agentów i modeli. `/new` tworzy nową
sesję OpenClaw, a harness Codex tworzy lub wznawia swój poboczny wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku.

## Wykrywanie modeli

Domyślnie plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie zakończy się niepowodzeniem lub przekroczy limit czasu, używa dołączonego katalogu zapasowego:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Wyłącz wykrywanie, jeśli chcesz, aby uruchamianie unikało sondowania Codex i trzymało się
katalogu zapasowego:

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

Domyślnie plugin uruchamia lokalnie Codex za pomocą:

```bash
codex app-server --listen stdio://
```

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana postawa lokalnego operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi powłoki i sieci bez
zatrzymywania się na natywnych monitach zatwierdzeń, na które nikt nie odpowie.

Aby włączyć zatwierdzenia przeglądane przez Guardian Codex, ustaw `appServer.mode:
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

Tryb Guardian rozwija się do:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian to natywny recenzent zatwierdzeń Codex. Gdy Codex chce opuścić
sandbox, pisać poza workspace albo dodać uprawnienia, takie jak dostęp do sieci,
Codex kieruje żądanie zatwierdzenia do subagenta recenzującego zamiast do monitu dla człowieka.
Recenzent zbiera kontekst i stosuje ramy ryzyka Codex, a następnie
zatwierdza lub odrzuca konkretne żądanie. Guardian jest przydatny, gdy chcesz mieć więcej
zabezpieczeń niż w trybie YOLO, ale nadal potrzebujesz agentów i Heartbeat bez nadzoru,
którzy robią postępy.

Harness Docker live zawiera sondę Guardian, gdy
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`. Uruchamia harness Codex w
trybie Guardian, weryfikuje, że nieszkodliwe polecenie powłoki z eskalacją zostaje zatwierdzone, oraz
weryfikuje, że przesłanie fałszywego sekretu do niezaufanego zewnętrznego miejsca docelowego zostaje
odrzucone, tak aby agent poprosił z powrotem o jawne zatwierdzenie.

Poszczególne pola polityki nadal mają pierwszeństwo przed `mode`, więc zaawansowane wdrożenia mogą
łączyć preset z jawnymi wyborami.

Dla już działającego app-server użyj transportu WebSocket:

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

| Field               | Default                                  | Znaczenie                                                                                                  |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                |
| `command`           | `"codex"`                                | Plik wykonywalny dla transportu stdio.                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                            |
| `url`               | unset                                    | Adres URL app-server WebSocket.                                                                            |
| `authToken`         | unset                                    | Token Bearer dla transportu WebSocket.                                                                     |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                              |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań płaszczyzny sterowania app-server.                                                 |
| `mode`              | `"yolo"`                                 | Preset dla wykonania YOLO lub z przeglądem Guardian.                                                       |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzeń Codex wysyłana do startu/wznowienia/tury wątku.                              |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany do startu/wznowienia wątku.                                            |
| `approvalsReviewer` | `"user"`                                 | Użyj `"guardian_subagent"`, aby Guardian Codex przeglądał monity.                                          |
| `serviceTier`       | unset                                    | Opcjonalny poziom usługi app-server Codex: `"fast"`, `"flex"` lub `null`. Nieprawidłowe starsze wartości są ignorowane. |

Starsze zmienne środowiskowe nadal działają jako wartości zapasowe przy lokalnych testach, gdy
odpowiadające pole konfiguracji nie jest ustawione:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Zamiast tego użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych testów lokalnych. Konfiguracja jest
preferowana dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie plugin w
tym samym sprawdzonym pliku co reszta konfiguracji harnessu Codex.

## Typowe receptury

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

Walidacja harnessu tylko Codex, z wyłączonym zapasowym użyciem Pi:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Zatwierdzenia Codex przeglądane przez Guardian:

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
            approvalsReviewer: "guardian_subagent",
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

Przełączanie modeli pozostaje kontrolowane przez OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model `codex/*`, dostawcę, politykę zatwierdzeń, sandbox i poziom usługi do
app-server. Przełączenie z `codex/gpt-5.4` na `codex/gpt-5.2` zachowuje
powiązanie z wątkiem, ale prosi Codex o kontynuowanie z nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest
ogólne i działa na każdym kanale, który obsługuje polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywną łączność z app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla aktywne modele app-server Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o wykonanie Compaction dołączonego wątku.
- `/codex review` uruchamia natywny review Codex dla dołączonego wątku.
- `/codex account` pokazuje stan konta i limitów szybkości.
- `/codex mcp` wyświetla stan serwera MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

`/codex resume` zapisuje ten sam poboczny plik powiązania, którego harness używa w
zwykłych turach. Przy następnej wiadomości OpenClaw wznowi ten wątek Codex, przekaże
aktualnie wybrany model OpenClaw `codex/*` do app-server i zachowa włączoną
rozszerzoną historię.

Powierzchnia poleceń wymaga app-server Codex `0.118.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Narzędzia, multimedia i Compaction

Harness Codex zmienia tylko niskopoziomowy wykonawca osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi wiadomości nadal przechodzą przez normalną ścieżkę dostarczania OpenClaw.

Pozyskiwanie zatwierdzeń narzędzi MCP Codex jest kierowane przez przepływ
zatwierdzeń plugin OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`; inne żądania pozyskania i żądania swobodnych danych wejściowych nadal kończą się bezpiecznym odrzuceniem.

Gdy wybrany model używa harnessu Codex, natywna Compaction wątku jest
delegowana do app-server Codex. OpenClaw zachowuje lustrzany transkrypt dla historii kanału,
wyszukiwania, `/new`, `/reset` i przyszłego przełączania modelu lub harnessu. To
lustro obejmuje prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy app-server je emituje. Obecnie OpenClaw zapisuje tylko
sygnały rozpoczęcia i zakończenia natywnej Compaction. Nie udostępnia jeszcze
czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy tego, które wpisy Codex
zachował po Compaction.

Generowanie multimediów nie wymaga Pi. Obraz, wideo, muzyka, PDF, TTS i
rozumienie multimediów nadal używają odpowiadających ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się w `/model`:** włącz `plugins.entries.codex.enabled`,
ustaw referencję modelu `codex/*` albo sprawdź, czy `plugins.allow` nie wyklucza `codex`.

**OpenClaw używa Pi zamiast Codex:** jeśli żaden harness Codex nie przejmuje uruchomienia,
OpenClaw może użyć Pi jako backendu zgodności. Ustaw
`embeddedHarness.runtime: "codex"`, aby wymusić wybór Codex podczas testów, albo
`embeddedHarness.fallback: "none"`, aby zakończyć działanie, gdy żaden harness plugin nie pasuje. Gdy
app-server Codex zostanie wybrany, jego błędy są zgłaszane bezpośrednio bez dodatkowej
konfiguracji fallback.

**App-server jest odrzucany:** zaktualizuj Codex, aby handshake app-server
zgłaszał wersję `0.118.0` lub nowszą.

**Wykrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź `appServer.url`, `authToken`
oraz to, czy zdalny app-server używa tej samej wersji protokołu app-server Codex.

**Model inny niż Codex używa Pi:** to oczekiwane. Harness Codex przejmuje tylko
referencje modeli `codex/*`.

## Powiązane

- [Plugin Harness agenta](/pl/plugins/sdk-agent-harness)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Testing](/pl/help/testing#live-codex-app-server-harness-smoke)
