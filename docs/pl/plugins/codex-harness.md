---
read_when:
    - Chcesz używać dołączonego harnessu app-server Codex
    - Potrzebujesz przykładów konfiguracji harnessu Codex
    - Chcesz, aby wdrożenia tylko z Codex kończyły się błędem zamiast przechodzić do PI
summary: Uruchamiaj osadzone tury agenta OpenClaw przez dołączony harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-26T11:36:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Dołączony Plugin `codex` pozwala OpenClaw uruchamiać osadzone tury agenta przez
app-server Codex zamiast przez wbudowany harness PI.

Używaj tego, gdy chcesz, aby Codex był właścicielem niskopoziomowej sesji agenta: wykrywania modeli, natywnego wznawiania wątków, natywnego Compaction i wykonania przez app-server.
OpenClaw nadal jest właścicielem kanałów czatu, plików sesji, wyboru modeli, narzędzi,
zatwierdzeń, dostarczania mediów i widocznego lustrzanego transkryptu.

Jeśli próbujesz się zorientować, zacznij od
[Agent runtimes](/pl/concepts/agent-runtimes). Krótka wersja jest taka:
`openai/gpt-5.5` to referencja modelu, `codex` to runtime, a Telegram,
Discord, Slack lub inny kanał pozostaje powierzchnią komunikacji.

## Co zmienia ten Plugin

Dołączony Plugin `codex` wnosi kilka oddzielnych możliwości:

| Możliwość                        | Jak jej używasz                                     | Co robi                                                                       |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Natywny embedded runtime         | `agentRuntime.id: "codex"`                          | Uruchamia osadzone tury agenta OpenClaw przez app-server Codex.               |
| Natywne polecenia sterowania czatem | `/codex bind`, `/codex resume`, `/codex steer`, ... | Wiąże i steruje wątkami app-server Codex z rozmowy w komunikatorze.           |
| Dostawca/katalog app-server Codex | wewnętrzne elementy `codex`, ujawniane przez harness | Pozwala runtime wykrywać i walidować modele app-server.                       |
| Ścieżka rozumienia mediów Codex  | ścieżki zgodności modeli obrazów `codex/*`          | Uruchamia ograniczone tury app-server Codex dla obsługiwanych modeli rozumienia obrazów. |
| Natywne przekazywanie hooków     | Hooki Plugin wokół natywnych zdarzeń Codex          | Pozwala OpenClaw obserwować/blokować obsługiwane natywne zdarzenia narzędzi/finalizacji Codex. |

Włączenie Plugin udostępnia te możliwości. **Nie** powoduje ono:

- używania Codex dla każdego modelu OpenAI
- konwersji referencji modeli `openai-codex/*` do natywnego runtime
- uczynienia ACP/acpx domyślną ścieżką Codex
- przełączania na gorąco istniejących sesji, które już zapisały runtime PI
- zastąpienia dostarczania kanałowego OpenClaw, plików sesji, magazynu auth-profile ani routingu wiadomości

Ten sam Plugin jest też właścicielem natywnej powierzchni poleceń sterowania czatem `/codex`. Jeśli
Plugin jest włączony i użytkownik chce wiązać, wznawiać, sterować, zatrzymywać lub sprawdzać
wątki Codex z czatu, agenci powinni preferować `/codex ...` zamiast ACP. ACP pozostaje
jawnym fallbackiem, gdy użytkownik prosi o ACP/acpx albo testuje adapter ACP
Codex.

Natywne tury Codex zachowują hooki Plugin OpenClaw jako publiczną warstwę zgodności.
To są hooki OpenClaw działające w procesie, a nie hooki poleceń `hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` dla lustrzanych rekordów transkryptu
- `before_agent_finalize` przez przekazanie Codex `Stop`
- `agent_end`

Plugin mogą także rejestrować neutralne względem runtime middleware wyników narzędzi, aby przepisywać wyniki dynamic tools OpenClaw po wykonaniu narzędzia przez OpenClaw i przed zwróceniem wyniku do Codex. To jest oddzielone od publicznego hooka Plugin `tool_result_persist`, który przekształca zapisy wyników narzędzi w transkrypcie będącym własnością OpenClaw.

Semantykę samych hooków Plugin opisano w [Plugin hooks](/pl/plugins/hooks)
i [Plugin guard behavior](/pl/tools/plugin).

Harness jest domyślnie wyłączony. Nowe konfiguracje powinny zachowywać referencje modeli OpenAI
w kanonicznej postaci `openai/gpt-*` i jawnie wymuszać
`agentRuntime.id: "codex"` lub `OPENCLAW_AGENT_RUNTIME=codex`, gdy
chcą natywnego wykonania przez app-server. Starsze referencje modeli `codex/*` nadal automatycznie wybierają
harness dla zgodności, ale starsze prefiksy dostawców wspierane przez runtime nie są
pokazywane jako zwykłe wybory modelu/dostawcy.

Jeśli Plugin `codex` jest włączony, ale model główny nadal jest
`openai-codex/*`, `openclaw doctor` ostrzega zamiast zmieniać trasę. To jest
zamierzone: `openai-codex/*` pozostaje ścieżką PI dla OAuth/subskrypcji Codex, a
natywne wykonanie przez app-server pozostaje jawnym wyborem runtime.

## Mapa tras

Użyj tej tabeli przed zmianą konfiguracji:

| Pożądane zachowanie                           | Referencja modelu           | Konfiguracja runtime                    | Wymaganie Plugin          | Oczekiwana etykieta statusu    |
| --------------------------------------------- | --------------------------- | --------------------------------------- | ------------------------- | ------------------------------ |
| OpenAI API przez zwykły runner OpenClaw       | `openai/gpt-*`              | pominięte lub `runtime: "pi"`           | Dostawca OpenAI           | `Runtime: OpenClaw Pi Default` |
| Codex OAuth/subskrypcja przez PI              | `openai-codex/gpt-*`        | pominięte lub `runtime: "pi"`           | Dostawca OpenAI Codex OAuth | `Runtime: OpenClaw Pi Default` |
| Natywne osadzone tury app-server Codex        | `openai/gpt-*`              | `agentRuntime.id: "codex"`              | Plugin `codex`            | `Runtime: OpenAI Codex`        |
| Mieszani dostawcy z ostrożnym trybem auto     | referencje specyficzne dla dostawcy | `agentRuntime.id: "auto"`       | Opcjonalne runtime Plugin | Zależy od wybranego runtime    |
| Jawna sesja adaptera ACP Codex                | zależne od promptu/modelu ACP | `sessions_spawn` z `runtime: "acp"`  | zdrowy backend `acpx`     | Status zadania/sesji ACP       |

Ważny jest podział między dostawcą a runtime:

- `openai-codex/*` odpowiada na pytanie „której trasy dostawcy/auth powinno używać PI?”
- `agentRuntime.id: "codex"` odpowiada na pytanie „która pętla powinna wykonać tę
  osadzoną turę?”
- `/codex ...` odpowiada na pytanie „z którą natywną rozmową Codex powinien związać się ten czat
  albo którą powinien sterować?”
- ACP odpowiada na pytanie „który zewnętrzny proces harness powinien uruchomić acpx?”

## Wybierz właściwy prefiks modelu

Trasy rodziny OpenAI są specyficzne dla prefiksu. Użyj `openai-codex/*`, gdy chcesz
OAuth Codex przez PI; użyj `openai/*`, gdy chcesz bezpośredniego dostępu do OpenAI API lub
gdy wymuszasz natywny harness app-server Codex:

| Referencja modelu                             | Ścieżka runtime                              | Użyj, gdy                                                                  |
| --------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Dostawca OpenAI przez mechanikę OpenClaw/PI  | Chcesz bieżącego bezpośredniego dostępu do OpenAI Platform API z `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth przez OpenClaw/PI         | Chcesz uwierzytelniania subskrypcją ChatGPT/Codex z domyślnym runnerem PI. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                     | Chcesz natywnego wykonania app-server Codex dla osadzonej tury agenta.    |

GPT-5.5 jest obecnie w OpenClaw dostępny tylko przez subskrypcję/OAuth. Użyj
`openai-codex/gpt-5.5` dla OAuth przez PI albo `openai/gpt-5.5` z
harnessem app-server Codex. Bezpośredni dostęp kluczem API do `openai/gpt-5.5` będzie obsługiwany,
gdy OpenAI udostępni GPT-5.5 w publicznym API.

Starsze referencje `codex/gpt-*` są nadal akceptowane jako aliasy zgodności. Doctor
migracji zgodności przepisuje starsze podstawowe referencje runtime do kanonicznych referencji modeli
i zapisuje politykę runtime osobno, podczas gdy starsze referencje tylko dla fallbacków
pozostają bez zmian, ponieważ runtime jest konfigurowany dla całego kontenera agenta.
Nowe konfiguracje PI Codex OAuth powinny używać `openai-codex/gpt-*`; nowe natywne
konfiguracje harnessu app-server powinny używać `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` podąża za tym samym podziałem prefiksów. Użyj
`openai-codex/gpt-*`, gdy rozumienie obrazów ma działać przez ścieżkę dostawcy OpenAI
Codex OAuth. Użyj `codex/gpt-*`, gdy rozumienie obrazów ma działać
przez ograniczoną turę app-server Codex. Model app-server Codex musi
reklamować obsługę wejścia obrazowego; tekstowe modele Codex kończą się błędem przed
rozpoczęciem tury mediów.

Użyj `/status`, aby potwierdzić efektywny harness dla bieżącej sesji. Jeśli wybór jest zaskakujący, włącz debug logging dla podsystemu `agents/harness` i sprawdź uporządkowany rekord `agent harness selected` w gateway. Zawiera on wybrany identyfikator harnessu, powód wyboru, politykę runtime/fallback oraz,
w trybie `auto`, wynik obsługi każdego kandydata Plugin.

### Co oznaczają ostrzeżenia doctor

`openclaw doctor` ostrzega, gdy spełnione są wszystkie te warunki:

- dołączony Plugin `codex` jest włączony lub dozwolony
- główny model agenta to `openai-codex/*`
- efektywny runtime tego agenta nie jest `codex`

To ostrzeżenie istnieje, ponieważ użytkownicy często oczekują, że „Plugin Codex włączony” oznacza
„natywny runtime app-server Codex”. OpenClaw nie wykonuje tego skoku. Ostrzeżenie oznacza:

- **Nie trzeba nic zmieniać**, jeśli zamierzałeś używać OAuth ChatGPT/Codex przez PI.
- Zmień model na `openai/<model>` i ustaw
  `agentRuntime.id: "codex"`, jeśli zamierzałeś używać natywnego
  wykonania przez app-server.
- Istniejące sesje nadal wymagają `/new` lub `/reset` po zmianie runtime,
  ponieważ przypięcia runtime do sesji są trwałe.

Wybór harnessu nie jest sterowaniem aktywną sesją. Gdy wykonywana jest osadzona tura,
OpenClaw zapisuje wybrany identyfikator harnessu w tej sesji i nadal używa go dla
kolejnych tur w tym samym ID sesji. Zmień konfigurację `agentRuntime` lub
`OPENCLAW_AGENT_RUNTIME`, jeśli chcesz, aby przyszłe sesje używały innego harnessu;
użyj `/new` lub `/reset`, aby rozpocząć świeżą sesję przed przełączeniem istniejącej
rozmowy między PI i Codex. Pozwala to uniknąć odtwarzania jednego transkryptu przez
dwa niezgodne natywne systemy sesji.

Starsze sesje utworzone przed przypięciami harnessu są traktowane jako przypięte do PI, jeśli
mają historię transkryptu. Użyj `/new` lub `/reset`, aby włączyć Codex dla tej rozmowy po zmianie konfiguracji.

`/status` pokazuje efektywny runtime modelu. Domyślny harness PI jest wyświetlany jako
`Runtime: OpenClaw Pi Default`, a harness app-server Codex jako
`Runtime: OpenAI Codex`.

## Wymagania

- OpenClaw z dostępnym dołączonym Plugin `codex`.
- App-server Codex `0.125.0` lub nowszy. Dołączony Plugin domyślnie zarządza zgodnym
  binarium app-server Codex, więc lokalne polecenia `codex` w `PATH` nie wpływają
  na normalne uruchamianie harnessu.
- Uwierzytelnianie Codex dostępne dla procesu app-server.

Plugin blokuje starsze lub niezweryfikowane handshake app-server. Dzięki temu
OpenClaw pozostaje na powierzchni protokołu, przeciw której był testowany.

W testach live i smoke w Docker uwierzytelnianie zwykle pochodzi z `OPENAI_API_KEY`, plus
opcjonalne pliki Codex CLI, takie jak `~/.codex/auth.json` i
`~/.codex/config.toml`. Użyj tych samych materiałów auth, których używa Twój lokalny app-server Codex.

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
      agentRuntime: {
        id: "codex",
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
preferować `openai/<model>` plus jawny wpis `agentRuntime` powyżej.

## Dodaj Codex obok innych modeli

Nie ustawiaj `agentRuntime.id: "codex"` globalnie, jeśli ten sam agent ma móc swobodnie przełączać się
między modelami Codex i modelami dostawców innych niż Codex. Wymuszony runtime ma zastosowanie do każdej
osadzonej tury tego agenta lub sesji. Jeśli wybierzesz model Anthropic, gdy taki runtime jest wymuszony, OpenClaw nadal spróbuje użyć harnessu Codex i zakończy się fail-closed zamiast po cichu kierować tę turę przez PI.

Użyj zamiast tego jednego z tych kształtów:

- Umieść Codex na dedykowanym agencie z `agentRuntime.id: "codex"`.
- Pozostaw domyślnego agenta na `agentRuntime.id: "auto"` i fallbacku PI dla normalnego użycia z mieszanymi dostawcami.
- Używaj starszych referencji `codex/*` tylko dla zgodności. Nowe konfiguracje powinny preferować `openai/*` plus jawną politykę runtime Codex.

Na przykład ta konfiguracja utrzymuje domyślnego agenta na normalnym automatycznym wyborze i
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
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Przy takiej strukturze:

- Domyślny agent `main` używa zwykłej ścieżki dostawcy i fallbacku zgodności PI.
- Agent `codex` używa harnessu app-server Codex.
- Jeśli dla agenta `codex` brakuje Codex albo nie jest on obsługiwany, tura kończy się
  błędem zamiast po cichu używać PI.

## Routing poleceń agenta

Agenci powinni kierować żądania użytkownika według intencji, a nie wyłącznie według słowa „Codex”:

| Użytkownik prosi o...                                  | Agent powinien użyć...                         |
| ------------------------------------------------------ | ---------------------------------------------- |
| „Powiąż ten czat z Codex”                              | `/codex bind`                                  |
| „Wznów tutaj wątek Codex `<id>`”                       | `/codex resume <id>`                           |
| „Pokaż wątki Codex”                                    | `/codex threads`                               |
| „Użyj Codex jako runtime dla tego agenta”              | zmiana konfiguracji `agentRuntime.id`          |
| „Użyj mojej subskrypcji ChatGPT/Codex ze zwykłym OpenClaw” | referencje modeli `openai-codex/*`         |
| „Uruchom Codex przez ACP/acpx”                         | ACP `sessions_spawn({ runtime: "acp", ... })`  |
| „Uruchom Claude Code/Gemini/OpenCode/Cursor w wątku”   | ACP/acpx, nie `/codex` i nie natywne subagenty |

OpenClaw reklamuje agentom wskazówki dotyczące uruchamiania ACP tylko wtedy, gdy ACP jest włączone,
możliwe do dyspozycji i wspierane przez załadowany backend runtime. Jeśli ACP nie jest dostępne,
prompt systemowy i Skills Plugin nie powinny uczyć agenta routingu
ACP.

## Wdrożenia tylko z Codex

Wymuś harness Codex, gdy musisz wykazać, że każda osadzona tura agenta
używa Codex. Jawne runtime Plugin domyślnie nie mają fallbacku do PI, więc
`fallback: "none"` jest opcjonalne, ale często przydatne jako dokumentacja:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Nadpisanie przez środowisko:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Przy wymuszonym Codex OpenClaw kończy się błędem wcześnie, jeśli Plugin Codex jest wyłączony,
app-server jest za stary albo app-server nie może wystartować. Ustaw
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` tylko wtedy, gdy celowo chcesz, aby PI obsługiwało
brakujący wybór harnessu.

## Codex per agent

Możesz ustawić jednego agenta jako tylko-Codex, podczas gdy domyślny agent zachowa zwykły
automatyczny wybór:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Używaj zwykłych poleceń sesji, aby przełączać agentów i modele. `/new` tworzy świeżą
sesję OpenClaw, a harness Codex tworzy lub wznawia swój boczny wątek app-server
w razie potrzeby. `/reset` czyści powiązanie sesji OpenClaw dla tego wątku
i pozwala, aby kolejna tura ponownie rozstrzygnęła harness z bieżącej konfiguracji.

## Wykrywanie modeli

Domyślnie Plugin Codex pyta app-server o dostępne modele. Jeśli
wykrywanie nie powiedzie się lub przekroczy timeout, używa dołączonego katalogu fallback dla:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Możesz dostroić wykrywanie pod `plugins.entries.codex.config.discovery`:

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

Wyłącz wykrywanie, gdy chcesz, aby uruchomienie unikało sondowania Codex i trzymało się
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

Domyślnie Plugin uruchamia lokalnie zarządzane binarium Codex OpenClaw przez:

```bash
codex app-server --listen stdio://
```

Zarządzane binarium jest zadeklarowane jako dołączona zależność runtime Plugin i przygotowywane
wraz z pozostałymi zależnościami Plugin `codex`. Dzięki temu wersja app-server
pozostaje powiązana z dołączonym Plugin, zamiast zależeć od dowolnego osobnego CLI Codex,
który akurat jest zainstalowany lokalnie. Ustaw `appServer.command` tylko wtedy, gdy
celowo chcesz uruchamiać inne wykonywalne polecenie.

Domyślnie OpenClaw uruchamia lokalne sesje harnessu Codex w trybie YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` oraz
`sandbox: "danger-full-access"`. To zaufana lokalna postawa operatora używana
dla autonomicznych Heartbeat: Codex może używać narzędzi shell i sieciowych bez
zatrzymywania się na natywnych promptach zatwierdzania, na które nikt nie jest obecny, by odpowiedzieć.

Aby włączyć zatwierdzenia przeglądane przez guardian Codex, ustaw `appServer.mode:
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

Tryb Guardian używa natywnej ścieżki auto-review zatwierdzeń Codex. Gdy Codex prosi o
opuszczenie sandboxa, zapis poza workspace albo dodanie uprawnień, takich jak dostęp sieciowy,
Codex kieruje to żądanie zatwierdzenia do natywnego recenzenta zamiast do
promptu dla człowieka. Recenzent stosuje ramy ryzyka Codex i zatwierdza albo odrzuca
konkretne żądanie. Używaj Guardian, gdy chcesz więcej zabezpieczeń niż w trybie YOLO,
ale nadal potrzebujesz, aby nienadzorowani agenci mogli robić postępy.

Preset `guardian` rozwija się do `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` i `sandbox: "workspace-write"`.
Poszczególne pola polityki nadal nadpisują `mode`, więc zaawansowane wdrożenia mogą mieszać
preset z jawnymi wyborami. Starsza wartość recenzenta `guardian_subagent` jest
nadal akceptowana jako alias zgodności, ale nowe konfiguracje powinny używać
`auto_review`.

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

| Pole                | Domyślnie                                | Znaczenie                                                                                                      |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` uruchamia Codex; `"websocket"` łączy się z `url`.                                                    |
| `command`           | zarządzane binarium Codex                | Polecenie wykonywalne dla transportu stdio. Pozostaw nieustawione, aby użyć zarządzanego binarium; ustawiaj tylko przy jawnym nadpisaniu. |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumenty dla transportu stdio.                                                                                |
| `url`               | nieustawione                             | URL app-server WebSocket.                                                                                      |
| `authToken`         | nieustawione                             | Token bearer dla transportu WebSocket.                                                                         |
| `headers`           | `{}`                                     | Dodatkowe nagłówki WebSocket.                                                                                  |
| `requestTimeoutMs`  | `60000`                                  | Timeout dla wywołań control-plane app-server.                                                                  |
| `mode`              | `"yolo"`                                 | Preset dla wykonania YOLO lub z zatwierdzeniami przeglądanymi przez guardian.                                  |
| `approvalPolicy`    | `"never"`                                | Natywna polityka zatwierdzeń Codex wysyłana przy starcie/wznawianiu/turze wątku.                              |
| `sandbox`           | `"danger-full-access"`                   | Natywny tryb sandbox Codex wysyłany przy starcie/wznawianiu wątku.                                             |
| `approvalsReviewer` | `"user"`                                 | Użyj `"auto_review"`, aby pozwolić Codex przeglądać natywne prompty zatwierdzeń. `guardian_subagent` pozostaje starszym aliasem. |
| `serviceTier`       | nieustawione                             | Opcjonalny service tier app-server Codex: `"fast"`, `"flex"` lub `null`. Nieprawidłowe starsze wartości są ignorowane. |

Nadpisania przez środowisko pozostają dostępne do lokalnych testów:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` omija zarządzane binarium, gdy
`appServer.command` nie jest ustawione.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` zostało usunięte. Użyj
`plugins.entries.codex.config.appServer.mode: "guardian"` zamiast tego albo
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` do jednorazowych lokalnych testów. Preferowana jest konfiguracja
dla powtarzalnych wdrożeń, ponieważ utrzymuje zachowanie Plugin w tym samym
sprawdzanym pliku co reszta konfiguracji harnessu Codex.

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

Walidacja harnessu tylko-Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
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

Przełączanie modeli pozostaje pod kontrolą OpenClaw. Gdy sesja OpenClaw jest podłączona
do istniejącego wątku Codex, następna tura ponownie wysyła do
app-server aktualnie wybrany model OpenAI, dostawcę, politykę zatwierdzeń, sandbox i service tier.
Przełączenie z `openai/gpt-5.5` na `openai/gpt-5.2` zachowuje powiązanie z wątkiem,
ale prosi Codex o kontynuację z nowo wybranym modelem.

## Polecenie Codex

Dołączony Plugin rejestruje `/codex` jako autoryzowane slash command. Jest ono
generyczne i działa na każdym kanale, który obsługuje tekstowe polecenia OpenClaw.

Typowe formy:

- `/codex status` pokazuje aktywne połączenie z app-server, modele, konto, limity szybkości, serwery MCP i Skills.
- `/codex models` wyświetla aktywne modele app-server Codex.
- `/codex threads [filter]` wyświetla ostatnie wątki Codex.
- `/codex resume <thread-id>` podłącza bieżącą sesję OpenClaw do istniejącego wątku Codex.
- `/codex compact` prosi app-server Codex o wykonanie Compaction podłączonego wątku.
- `/codex review` uruchamia natywny review Codex dla podłączonego wątku.
- `/codex account` pokazuje status konta i limitów szybkości.
- `/codex mcp` wyświetla status serwerów MCP app-server Codex.
- `/codex skills` wyświetla Skills app-server Codex.

`/codex resume` zapisuje ten sam plik powiązania sidecar, którego harness używa
dla zwykłych tur. Przy następnej wiadomości OpenClaw wznowi ten wątek Codex, przekaże do
app-server aktualnie wybrany model OpenClaw i pozostawi włączoną rozszerzoną historię.

Powierzchnia poleceń wymaga app-server Codex `0.125.0` lub nowszego. Poszczególne
metody sterowania są zgłaszane jako `unsupported by this Codex app-server`, jeśli
przyszły lub niestandardowy app-server nie udostępnia tej metody JSON-RPC.

## Granice hooków

Harness Codex ma trzy warstwy hooków:

| Warstwa                               | Właściciel               | Cel                                                                 |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooki Plugin OpenClaw                 | OpenClaw                 | Zgodność produktu/Plugin między harnessami PI i Codex.              |
| Middleware rozszerzeń app-server Codex | Dołączone Plugin OpenClaw | Zachowanie adaptera per tura wokół dynamic tools OpenClaw.        |
| Natywne hooki Codex                   | Codex                    | Niskopoziomowy cykl życia Codex i natywna polityka narzędzi z konfiguracji Codex. |

OpenClaw nie używa projektowych ani globalnych plików `hooks.json` Codex do routingu
zachowania Plugin OpenClaw. Dla obsługiwanego mostka natywnych narzędzi i uprawnień
OpenClaw wstrzykuje per wątek konfigurację Codex dla `PreToolUse`, `PostToolUse`,
`PermissionRequest` i `Stop`. Inne hooki Codex, takie jak `SessionStart` i
`UserPromptSubmit`, pozostają kontrolkami na poziomie Codex; nie są ujawniane jako
hooki Plugin OpenClaw w kontrakcie v1.

Dla dynamic tools OpenClaw OpenClaw wykonuje narzędzie po tym, jak Codex poprosi o
wywołanie, więc OpenClaw uruchamia zachowanie Plugin i middleware, którego jest właścicielem, w adapterze
harnessu. Dla narzędzi natywnych Codex właścicielem kanonicznego rekordu narzędzia jest Codex.
OpenClaw może odzwierciedlać wybrane zdarzenia, ale nie może przepisywać natywnego wątku Codex,
chyba że Codex udostępni tę operację przez app-server lub natywne callbacki
hooków.

Projekcje Compaction i cyklu życia LLM pochodzą z powiadomień app-server Codex
i stanu adaptera OpenClaw, a nie z natywnych poleceń hooków Codex.
Zdarzenia `before_compaction`, `after_compaction`, `llm_input` i
`llm_output` OpenClaw są obserwacjami na poziomie adaptera, a nie bajt-w-bajt przechwyceniami
wewnętrznego żądania Codex lub payloadu Compaction.

Natywne powiadomienia app-server Codex `hook/started` i `hook/completed` są
projektowane jako zdarzenia agenta `codex_app_server.hook` na potrzeby trajektorii i debugowania.
Nie wywołują hooków Plugin OpenClaw.

## Kontrakt wsparcia V1

Tryb Codex to nie jest PI z innym wywołaniem modelu pod spodem. Codex posiada większą część
natywnej pętli modelu, a OpenClaw dostosowuje swoje powierzchnie Plugin i sesji
wokół tej granicy.

Obsługiwane w runtime Codex v1:

| Powierzchnia                                  | Obsługa                                 | Dlaczego                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pętla modelu OpenAI przez Codex               | Obsługiwana                             | App-server Codex jest właścicielem tury OpenAI, natywnego wznawiania wątku i natywnej kontynuacji narzędzi.                                                                                             |
| Routing i dostarczanie kanałowe OpenClaw      | Obsługiwane                             | Telegram, Discord, Slack, WhatsApp, iMessage i inne kanały pozostają poza runtime modelu.                                                                                                                |
| Dynamic tools OpenClaw                        | Obsługiwane                             | Codex prosi OpenClaw o wykonanie tych narzędzi, więc OpenClaw pozostaje w ścieżce wykonania.                                                                                                            |
| Plugin promptów i kontekstu                   | Obsługiwane                             | OpenClaw buduje nakładki promptów i projektuje kontekst do tury Codex przed rozpoczęciem lub wznowieniem wątku.                                                                                        |
| Cykl życia silnika kontekstu                  | Obsługiwany                             | Assemble, ingest lub utrzymanie po turze oraz koordynacja Compaction silnika kontekstu działają dla tur Codex.                                                                                         |
| Hooki dynamic tools                           | Obsługiwane                             | `before_tool_call`, `after_tool_call` i middleware wyników narzędzi działają wokół dynamic tools będących własnością OpenClaw.                                                                          |
| Hooki cyklu życia                             | Obsługiwane jako obserwacje adaptera    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` i `after_compaction` wywołują się z uczciwymi payloadami trybu Codex.                                                                      |
| Bramka rewizji końcowej odpowiedzi            | Obsługiwana przez przekazanie natywnego hooka | Codex `Stop` jest przekazywany do `before_agent_finalize`; `revise` prosi Codex o jeszcze jeden przebieg modelu przed finalizacją.                                                                  |
| Natywny shell, patch i MCP block lub observe  | Obsługiwane przez przekazanie natywnego hooka | Codex `PreToolUse` i `PostToolUse` są przekazywane dla zatwierdzonych natywnych powierzchni narzędzi, w tym payloadów MCP w app-server Codex `0.125.0` lub nowszym. Blokowanie jest obsługiwane; przepisywanie argumentów nie. |
| Natywna polityka uprawnień                    | Obsługiwana przez przekazanie natywnego hooka | `PermissionRequest` Codex może być kierowane przez politykę OpenClaw tam, gdzie runtime to udostępnia. Jeśli OpenClaw nie zwróci decyzji, Codex kontynuuje własną zwykłą ścieżką zatwierdzenia guardian lub user. |
| Przechwytywanie trajektorii app-server        | Obsługiwane                             | OpenClaw rejestruje żądanie wysłane do app-server i powiadomienia otrzymywane z app-server.                                                                                                            |

Nieobsługiwane w runtime Codex v1:

| Powierzchnia                                           | Granica v1                                                                                                                                     | Przyszła ścieżka                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Mutacja argumentów natywnych narzędzi                  | Natywne hooki pre-tool Codex mogą blokować, ale OpenClaw nie przepisuje argumentów narzędzi natywnych Codex.                                  | Wymaga wsparcia hook/schema Codex dla zastępczego wejścia narzędzia.                    |
| Edytowalna historia natywnego transkryptu Codex        | Codex jest właścicielem kanonicznej historii natywnego wątku. OpenClaw posiada lustro i może projektować przyszły kontekst, ale nie powinien mutować nieobsługiwanych elementów wewnętrznych. | Dodanie jawnych API app-server Codex, jeśli potrzebna jest ingerencja w natywny wątek. |
| `tool_result_persist` dla natywnych rekordów narzędzi Codex | Ten hook przekształca zapisy transkryptu będące własnością OpenClaw, a nie natywne rekordy narzędzi Codex.                               | Można by odzwierciedlać przekształcone rekordy, ale kanoniczne przepisanie wymaga wsparcia Codex. |
| Bogate natywne metadane Compaction                     | OpenClaw obserwuje początek i zakończenie Compaction, ale nie otrzymuje stabilnej listy kept/dropped, delty tokenów ani payloadu podsumowania. | Potrzebne bogatsze zdarzenia Compaction Codex.                                          |
| Interwencja w Compaction                               | Obecne hooki Compaction OpenClaw w trybie Codex mają poziom wyłącznie powiadomień.                                                             | Dodanie hooków Codex przed/po Compaction, jeśli Plugin mają wetować lub przepisywać natywny Compaction. |
| Przechwytywanie żądań API modelu bajt-w-bajt           | OpenClaw może przechwytywać żądania i powiadomienia app-server, ale rdzeń Codex buduje końcowe żądanie OpenAI API wewnętrznie.                | Potrzebne zdarzenie śledzenia żądań modelu Codex lub debug API.                         |

## Narzędzia, media i Compaction

Harness Codex zmienia tylko niskopoziomowy osadzony wykonawca agenta.

OpenClaw nadal buduje listę narzędzi i odbiera wyniki dynamic tools z
harnessu. Tekst, obrazy, wideo, muzyka, TTS, zatwierdzenia i dane wyjściowe narzędzi komunikacyjnych
nadal przechodzą przez zwykłą ścieżkę dostarczania OpenClaw.

Przekazanie natywnego hooka jest celowo generyczne, ale kontrakt wsparcia v1 jest
ograniczony do natywnych ścieżek narzędzi i uprawnień Codex, które OpenClaw testuje. W
runtime Codex obejmuje to payloady shell, patch i MCP `PreToolUse`,
`PostToolUse` oraz `PermissionRequest`. Nie zakładaj, że każde przyszłe
zdarzenie hooka Codex jest powierzchnią Plugin OpenClaw, dopóki kontrakt runtime tego
nie nazwie.

Dla `PermissionRequest` OpenClaw zwraca jawne decyzje allow lub deny
tylko wtedy, gdy polityka podejmie decyzję. Wynik bez decyzji nie oznacza allow. Codex traktuje go jako brak
decyzji hooka i przechodzi do własnej ścieżki zatwierdzenia guardian lub user.

Wywołania zatwierdzeń narzędzi MCP Codex są kierowane przez przepływ
zatwierdzeń Plugin OpenClaw, gdy Codex oznacza `_meta.codex_approval_kind` jako
`"mcp_tool_call"`. Prompty `request_user_input` Codex są wysyłane z powrotem do
źródłowego czatu, a kolejna zakolejkowana wiadomość follow-up odpowiada na to natywne
żądanie serwera zamiast być kierowana jako dodatkowy kontekst. Inne żądania wywołania MCP nadal kończą się fail-closed.

Gdy wybrany model używa harnessu Codex, natywny Compaction wątku jest
delegowany do app-server Codex. OpenClaw utrzymuje lustrzany transkrypt dla
historii kanału, wyszukiwania, `/new`, `/reset` i przyszłego przełączania modeli lub harnessów. Lustro zawiera prompt użytkownika, końcowy tekst asystenta oraz lekkie rekordy rozumowania lub planu Codex, gdy app-server je emituje. Obecnie OpenClaw rejestruje tylko sygnały rozpoczęcia i zakończenia natywnego Compaction. Nie ujawnia jeszcze czytelnego dla człowieka podsumowania Compaction ani audytowalnej listy wpisów, które Codex zachował po Compaction.

Ponieważ to Codex jest właścicielem kanonicznego natywnego wątku, `tool_result_persist` nie
przepisuje obecnie natywnych rekordów wyników narzędzi Codex. Ma zastosowanie tylko wtedy, gdy
OpenClaw zapisuje wynik narzędzia w transkrypcie sesji będącym własnością OpenClaw.

Generowanie mediów nie wymaga PI. Obraz, wideo, muzyka, PDF, TTS i rozumienie mediów
nadal używają odpowiadających im ustawień dostawcy/modelu, takich jak
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` i
`messages.tts`.

## Rozwiązywanie problemów

**Codex nie pojawia się jako zwykły dostawca `/model`:** to oczekiwane dla
nowych konfiguracji. Wybierz model `openai/gpt-*` z
`agentRuntime.id: "codex"` (lub starszą referencją `codex/*`), włącz
`plugins.entries.codex.enabled` i sprawdź, czy `plugins.allow` nie wyklucza
`codex`.

**OpenClaw używa PI zamiast Codex:** `agentRuntime.id: "auto"` nadal może używać PI jako
backendu zgodności, gdy żaden harness Codex nie przejmuje uruchomienia. Ustaw
`agentRuntime.id: "codex"`, aby wymusić wybór Codex podczas testów. Wymuszony
runtime Codex kończy się teraz błędem zamiast przechodzić do PI, chyba że
jawnie ustawisz `agentRuntime.fallback: "pi"`. Gdy app-server Codex zostanie już
wybrany, jego błędy są ujawniane bezpośrednio, bez dodatkowej konfiguracji fallbacku.

**App-server jest odrzucany:** zaktualizuj Codex tak, aby handshake app-server
zgłaszał wersję `0.125.0` lub nowszą. Wersje prerelease o tej samej wersji lub z sufiksem buildu,
takie jak `0.125.0-alpha.2` lub `0.125.0+custom`, są odrzucane, ponieważ
stabilny próg protokołu `0.125.0` to poziom, na którym testowany jest OpenClaw.

**Wykrywanie modeli jest wolne:** obniż `plugins.entries.codex.config.discovery.timeoutMs`
albo wyłącz wykrywanie.

**Transport WebSocket kończy się błędem natychmiast:** sprawdź `appServer.url`, `authToken`
oraz czy zdalny app-server mówi tym samym protokołem app-server Codex.

**Model inny niż Codex używa PI:** to oczekiwane, chyba że wymusiłeś
`agentRuntime.id: "codex"` dla tego agenta albo wybrałeś starszą
referencję `codex/*`. Zwykłe `openai/gpt-*` i inne referencje dostawców pozostają na swojej normalnej
ścieżce dostawcy w trybie `auto`. Jeśli wymusisz `agentRuntime.id: "codex"`, każda osadzona
tura tego agenta musi być modelem OpenAI obsługiwanym przez Codex.

## Powiązane

- [Agent harness plugins](/pl/plugins/sdk-agent-harness)
- [Agent runtimes](/pl/concepts/agent-runtimes)
- [Model providers](/pl/concepts/model-providers)
- [OpenAI provider](/pl/providers/openai)
- [Status](/pl/cli/status)
- [Plugin hooks](/pl/plugins/hooks)
- [Configuration reference](/pl/gateway/configuration-reference)
- [Testing](/pl/help/testing-live#live-codex-app-server-harness-smoke)
