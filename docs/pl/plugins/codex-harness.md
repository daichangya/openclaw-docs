---
read_when:
    - Chcesz używać dołączonej uprzęży app-server Codex
    - Potrzebujesz odwołań do modeli Codex i przykładów konfiguracji
    - Chcesz wyłączyć awaryjne przełączanie na PI w wdrożeniach korzystających wyłącznie z Codex
summary: Uruchamiaj tury osadzonego agenta OpenClaw przez dołączoną uprząż app-server Codex
title: Uprząż Codex
x-i18n:
    generated_at: "2026-04-11T02:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Uprząż Codex

Dołączony plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
app-server Codex zamiast wbudowanej uprzęży PI.

Użyj tego, gdy chcesz, aby Codex zarządzał niskopoziomową sesją agenta: wykrywaniem
modeli, natywnym wznawianiem wątków, natywną kompaktacją i wykonywaniem przez
app-server. OpenClaw nadal zarządza kanałami czatu, plikami sesji, wyborem modeli, narzędziami,
zatwierdzeniami, dostarczaniem multimediów i widocznym lustrem transkryptu.

Uprząż jest domyślnie wyłączona. Jest wybierana tylko wtedy, gdy plugin `codex` jest
włączony, a rozpoznany model to model `codex/*`, albo gdy jawnie wymusisz
`embeddedHarness.runtime: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`.
Jeśli nigdy nie skonfigurujesz `codex/*`, istniejące uruchomienia PI, OpenAI, Anthropic, Gemini, local
i custom-provider zachowają swoje obecne działanie.

## Wybierz właściwy prefiks modelu

OpenClaw ma oddzielne ścieżki dla dostępu w stylu OpenAI i Codex:

| Odwołanie do modelu   | Ścieżka runtime                              | Użyj, gdy                                                                |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Provider OpenAI przez mechanizmy OpenClaw/PI | Chcesz bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Provider OpenAI Codex OAuth przez PI        | Chcesz używać ChatGPT/Codex OAuth bez uprzęży app-server Codex.          |
| `codex/gpt-5.4`       | Dołączony provider Codex plus uprząż Codex   | Chcesz natywnego wykonywania przez app-server Codex dla osadzonej tury agenta. |

Uprząż Codex przejmuje tylko odwołania do modeli `codex/*`. Istniejące odwołania `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local i custom provider zachowują
swoje normalne ścieżki.

## Wymagania

- OpenClaw z dostępnym dołączonym pluginem `codex`.
- App-server Codex `0.118.0` lub nowszy.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub nieposiadające wersji handshakes app-server. Dzięki temu
OpenClaw pozostaje przy powierzchni protokołu, z którą został przetestowany.

W testach live i smoke testach Docker uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, plus
opcjonalne pliki CLI Codex, takie jak `~/.codex/auth.json` i
`~/.codex/config.toml`. Użyj tych samych materiałów uwierzytelniających, których używa twój lokalny app-server Codex.

## Minimalna konfiguracja

Użyj `codex/gpt-5.4`, włącz dołączony plugin i wymuś uprząż `codex`:

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

Jeśli twoja konfiguracja używa `plugins.allow`, uwzględnij tam również `codex`:

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
automatycznie włącza dołączony plugin `codex`. Jawny wpis pluginu jest nadal
przydatny we współdzielonych konfiguracjach, ponieważ jasno pokazuje zamiar wdrożenia.

## Dodaj Codex bez zastępowania innych modeli

Zachowaj `runtime: "auto"`, jeśli chcesz używać Codex dla modeli `codex/*`, a PI dla
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

Przy takiej konfiguracji:

- `/model codex` lub `/model codex/gpt-5.4` używa uprzęży app-server Codex.
- `/model gpt` lub `/model openai/gpt-5.4` używa ścieżki providera OpenAI.
- `/model opus` używa ścieżki providera Anthropic.
- Jeśli zostanie wybrany model inny niż Codex, PI pozostaje uprzężą zgodności.

## Wdrożenia tylko z Codex

Wyłącz awaryjne przełączanie na PI, gdy musisz potwierdzić, że każda osadzona tura agenta używa
uprzęży Codex:

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

Nadpisanie przez zmienne środowiskowe:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Przy wyłączonym fallbacku OpenClaw kończy działanie wcześnie, jeśli plugin Codex jest wyłączony,
żądany model nie jest odwołaniem `codex/*`, app-server jest zbyt stary albo
app-server nie może się uruchomić.

## Codex dla poszczególnych agentów

Możesz ustawić jednego agenta jako tylko-Codex, podczas gdy domyślny agent zachowa normalny
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
sesję OpenClaw, a uprząż Codex tworzy lub wznawia swój pomocniczy wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku.

## Wykrywanie modeli

Domyślnie plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie się nie powiedzie lub przekroczy limit czasu, używa dołączonego katalogu zapasowego:

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

Wyłącz wykrywanie, jeśli chcesz, aby uruchamianie nie próbowało sondować Codex i pozostało przy
katalogu zapasowym:

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

## Połączenie i zasady app-server

Domyślnie plugin uruchamia lokalnie Codex za pomocą:

```bash
codex app-server --listen stdio://
```

Możesz zachować to ustawienie domyślne i dostroić tylko natywne zasady Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Pole                | Domyślnie                                | Znaczenie                                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.              |
| `command`           | `"codex"`                                | Plik wykonywalny dla transportu stdio.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                          |
| `url`               | nieustawione                             | URL WebSocket app-server.                                                |
| `authToken`         | nieustawione                             | Token Bearer dla transportu WebSocket.                                   |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                            |
| `requestTimeoutMs`  | `60000`                                  | Limit czasu dla wywołań control-plane app-server.                        |
| `approvalPolicy`    | `"never"`                                | Natywne zasady zatwierdzania Codex wysyłane do startu/wznowienia/tury wątku. |
| `sandbox`           | `"workspace-write"`                      | Natywny tryb sandbox Codex wysyłany do startu/wznowienia wątku.          |
| `approvalsReviewer` | `"user"`                                 | Użyj `"guardian_subagent"`, aby guardian Codex recenzował natywne zatwierdzenia. |
| `serviceTier`       | nieustawione                             | Opcjonalna warstwa usług Codex, na przykład `"priority"`.                |

Starsze zmienne środowiskowe nadal działają jako wartości zapasowe do lokalnych testów, gdy
odpowiadające im pole konfiguracji nie jest ustawione:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Konfiguracja jest preferowana dla powtarzalnych wdrożeń.

## Typowe scenariusze

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

Walidacja uprzęży tylko-Codex, z wyłączonym awaryjnym przełączaniem na PI:

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

Zatwierdzenia Codex recenzowane przez guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
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

Przełączanie modeli pozostaje pod kontrolą OpenClaw. Gdy sesja OpenClaw jest dołączona
do istniejącego wątku Codex, następna tura ponownie wysyła aktualnie wybrany
model `codex/*`, provider, zasady zatwierdzania, sandbox i warstwę usług do
app-server. Przełączenie z `codex/gpt-5.4` na `codex/gpt-5.2` zachowuje
powiązanie z wątkiem, ale prosi Codex o kontynuowanie pracy z nowo wybranym modelem.

## Polecenie Codex

Dołączony plugin rejestruje `/codex` jako autoryzowane polecenie slash. Jest
ogólne i działa na każdym kanale obsługującym polecenia tekstowe OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywne połączenie z app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla aktywne modele app-server Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` dołącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o skompaktowanie dołączonego wątku.
- `/codex review` uruchamia natywną recenzję Codex dla dołączonego wątku.
- `/codex account` pokazuje stan konta i limity szybkości.
- `/codex mcp` wyświetla stan serwerów MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

`/codex resume` zapisuje ten sam pomocniczy plik powiązania, którego uprząż używa w
zwykłych turach. Przy następnej wiadomości OpenClaw wznowi ten wątek Codex, przekaże
aktualnie wybrany model OpenClaw `codex/*` do app-server i zachowa
włączoną rozszerzoną historię.

Powierzchnia poleceń wymaga app-server Codex `0.118.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia danej metody JSON-RPC.

## Narzędzia, multimedia i kompaktacja

Uprząż Codex zmienia tylko niskopoziomowy mechanizm wykonawczy osadzonego agenta.

OpenClaw nadal buduje listę narzędzi i odbiera dynamiczne wyniki narzędzi z
uprzęży. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe
narzędzi do obsługi wiadomości nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.

Gdy wybrany model używa uprzęży Codex, natywna kompaktacja wątków jest
delegowana do app-server Codex. OpenClaw zachowuje lustrzaną kopię transkryptu na potrzeby
historii kanału, wyszukiwania, `/new`, `/reset` oraz przyszłego przełączania modeli lub uprzęży. Ta
kopia obejmuje prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy
rozumowania lub planu Codex, gdy app-server je emituje.

Generowanie multimediów nie wymaga PI. Generowanie obrazów, wideo, muzyki, PDF,
TTS oraz rozumienie multimediów nadal korzystają z odpowiadających im ustawień providera/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się w `/model`:** włącz `plugins.entries.codex.enabled`,
ustaw odwołanie do modelu `codex/*` albo sprawdź, czy `plugins.allow` nie wyklucza `codex`.

**OpenClaw przełącza się awaryjnie na PI:** ustaw `embeddedHarness.fallback: "none"` albo
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` podczas testowania.

**App-server jest odrzucany:** zaktualizuj Codex tak, aby handshake app-server
zgłaszał wersję `0.118.0` lub nowszą.

**Wykrywanie modeli jest wolne:** zmniejsz `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket natychmiast kończy się niepowodzeniem:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny app-server obsługuje tę samą wersję protokołu app-server Codex.

**Model inny niż Codex używa PI:** to jest oczekiwane. Uprząż Codex przejmuje tylko
odwołania do modeli `codex/*`.

## Powiązane

- [Pluginy uprzęży agenta](/pl/plugins/sdk-agent-harness)
- [Providery modeli](/pl/concepts/model-providers)
- [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference)
- [Testowanie](/pl/help/testing#live-codex-app-server-harness-smoke)
