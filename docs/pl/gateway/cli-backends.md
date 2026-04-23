---
read_when:
    - Chcesz mieć niezawodne rozwiązanie awaryjne, gdy providerzy API zawodzą
    - Używasz Codex CLI lub innych lokalnych CLI AI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć most MCP local loopback do dostępu narzędzi dla backendów CLI
summary: 'Backendy CLI: lokalne awaryjne przejście do CLI AI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-23T10:00:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (środowisko awaryjne)

OpenClaw może uruchamiać **lokalne CLI AI** jako **awaryjne rozwiązanie tylko tekstowe**, gdy providerzy API są niedostępni,
objęci ograniczeniami szybkości lub tymczasowo działają nieprawidłowo. To podejście jest celowo zachowawcze:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP local loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (dzięki czemu kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie zostało zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj go, gdy
chcesz mieć „zawsze działające” odpowiedzi tekstowe bez polegania na zewnętrznych API.

Jeśli chcesz pełnego środowiska harness z kontrolą sesji ACP, zadaniami w tle,
wiązaniem wątku / rozmowy oraz trwałymi zewnętrznymi sesjami kodowania, użyj
[ACP Agents](/pl/tools/acp-agents). Backendy CLI to nie ACP.

## Szybki start dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jeśli Twój Gateway działa pod launchd/systemd, a PATH jest minimalny, dodaj tylko
ścieżkę polecenia:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

To wszystko. Nie są potrzebne żadne klucze ani dodatkowa konfiguracja uwierzytelniania poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego providera wiadomości** na
hoście Gateway, OpenClaw automatycznie wczytuje teraz należący do niego dołączony plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w model ref lub pod
`agents.defaults.cliBackends`.

## Używanie jako rozwiązania awaryjnego

Dodaj backend CLI do listy awaryjnej, aby był uruchamiany tylko wtedy, gdy modele podstawowe zawiodą:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Uwagi:

- Jeśli używasz `agents.defaults.models` (lista dozwolonych), musisz uwzględnić tam również modele backendu CLI.
- Jeśli podstawowy provider zawiedzie (uwierzytelnianie, limity szybkości, timeouty), OpenClaw
  spróbuje następnie backendu CLI.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **id providera** (np. `codex-cli`, `my-cli`).
Id providera staje się lewą stroną model ref:

```
<provider>/<model>
```

### Przykładowa konfiguracja

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // CLI w stylu Codex mogą zamiast tego wskazywać plik promptu:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Jak to działa

1. **Wybiera backend** na podstawie prefiksu providera (`codex-cli/...`).
2. **Buduje system prompt** przy użyciu tego samego promptu OpenClaw + kontekstu workspace.
3. **Wykonuje CLI** z id sesji (jeśli jest obsługiwane), dzięki czemu historia pozostaje spójna.
   Dołączony backend `claude-cli` utrzymuje proces stdio Claude przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje wyjście** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala id sesji** dla każdego backendu, dzięki czemu kolejne tury używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako sankcjonowane dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje system prompt OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do pliku
tymczasowego dla każdej nowej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączanym system prompt oraz
tymczasowy plugin Claude Code przekazywany przez `--plugin-dir`. Plugin zawiera
tylko Skills kwalifikujące się dla danego agenta / sesji, dzięki czemu natywny resolver Skills Claude Code
widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w prompcie.
Nadpisania env / kluczy API dla Skills są nadal stosowane przez OpenClaw do środowiska procesu potomnego dla runu.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy id trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznawiania niebędącego JSON).
- `sessionMode`:
  - `always`: zawsze wysyła id sesji (nowe UUID, jeśli nic nie zapisano).
  - `existing`: wysyła id sesji tylko wtedy, gdy wcześniej zostało zapisane.
  - `none`: nigdy nie wysyła id sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, dzięki czemu kolejne tury używają ponownie aktywnego procesu Claude,
  dopóki jest aktywny. Ciepłe stdio jest teraz ustawieniem domyślnym, także dla konfiguracji niestandardowych,
  które pomijają pola transportu. Jeśli Gateway uruchomi się ponownie lub bezczynny proces
  zakończy działanie, OpenClaw wznowi pracę z zapisanego id sesji Claude. Zapisane id sesji
  są weryfikowane względem istniejącej czytelnej transkrypcji projektu przed
  wznowieniem, więc widmowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu uruchamiać nową sesję Claude CLI pod `--resume`.
- Zapisane sesje CLI to ciągłość należąca do providera. Niejawny codzienny
  reset sesji ich nie przecina; `/reset` i jawne polityki `session.reset` nadal to robią.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność uruchomień w tym samym pasie.
- Większość CLI serializuje na jednym pasie providera.
- OpenClaw odrzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość uwierzytelniania,
  w tym zmienione id profilu uwierzytelniania, statyczny klucz API, statyczny token lub tożsamość konta OAuth,
  gdy CLI ją udostępnia. Rotacja tokenów dostępu i odświeżania OAuth nie przecina zapisanej sesji CLI. Jeśli CLI nie udostępnia
  stabilnego id konta OAuth, OpenClaw pozwala temu CLI samodzielnie egzekwować uprawnienia wznowienia.

## Obrazy (pass-through)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie istnieje, OpenClaw
dołącza ścieżki plików do promptu (wstrzyknięcie ścieżki), co wystarcza dla CLI, które automatycznie
wczytują pliki lokalne ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst + id sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a
  użycie z `stats`, gdy `usage` nie istnieje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używane jest stdin.

## Ustawienia domyślne (należące do pluginu)

Dołączony plugin OpenAI rejestruje również domyślne ustawienia dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony plugin Google rejestruje również domyślne ustawienia dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie przechodzi awaryjnie do `stats`, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli `stats.input` nie istnieje, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to potrzebne (najczęściej: bezwzględna ścieżka `command`).

## Ustawienia domyślne należące do pluginu

Ustawienia domyślne backendów CLI są teraz częścią powierzchni pluginu:

- Pluginy rejestrują je przez `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem providera w model ref.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje domyślne ustawienia pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością pluginu dzięki opcjonalnemu
  hookowi `normalizeConfig`.

Pluginy, które potrzebują drobnych shimów zgodności promptów / wiadomości, mogą deklarować
dwukierunkowe transformacje tekstu bez zastępowania providera ani backendu CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` przepisuje system prompt i prompt użytkownika przekazywane do CLI. `output`
przepisuje strumieniowane delty asystenta i sparsowany końcowy tekst, zanim OpenClaw obsłuży
własne markery sterujące i dostarczanie do kanału.

Dla CLI, które emitują JSONL zgodny ze stream-json Claude Code, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki Bundle MCP

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP przez `bundleMcp: true`.

Bieżące dołączone zachowanie:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: inline nadpisania konfiguracji dla `mcp_servers`
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy bundle MCP jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP local loopback, który udostępnia narzędzia Gateway procesowi CLI
- uwierzytelnia most tokenem na sesję (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- wczytuje włączone serwery bundle-MCP dla bieżącego workspace
- scala je z dowolnym istniejącym kształtem konfiguracji / ustawień MCP backendu
- przepisuje konfigurację uruchamiania przy użyciu należącego do backendu trybu integracji z rozszerzenia będącego właścicielem

Jeśli żaden serwer MCP nie jest włączony, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza bundle MCP, aby uruchomienia w tle pozostawały izolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  aż do zakończenia.
- **Ustrukturyzowane wyjścia** zależą od formatu JSON CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), które jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby mapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że ustawiono `sessionArg`, a `sessionMode` nie ma
  wartości `none` (Codex CLI obecnie nie potrafi wznawiać z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki do plików).
