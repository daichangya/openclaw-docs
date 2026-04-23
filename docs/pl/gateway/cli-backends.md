---
read_when:
    - Potrzebujesz niezawodnego rozwiązania awaryjnego, gdy dostawcy API zawodzą.
    - Używasz Codex CLI lub innych lokalnych CLI AI i chcesz używać ich ponownie.
    - Chcesz zrozumieć most local loopback MCP do dostępu narzędzi backendu CLI.
summary: 'Backendy CLI: lokalny awaryjny CLI AI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-23T14:55:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (awaryjne środowisko uruchomieniowe)

OpenClaw może uruchamiać **lokalne CLI AI** jako **wyłącznie tekstowe rozwiązanie awaryjne**, gdy dostawcy API są niedostępni,
objęci limitami szybkości lub tymczasowo działają nieprawidłowo. Jest to celowo zachowawcze podejście:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia gateway przez most local loopback MCP.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (dzięki temu kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie zaprojektowano jako **siatkę bezpieczeństwa**, a nie główną ścieżkę. Używaj go, gdy
chcesz uzyskać odpowiedzi tekstowe typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli chcesz mieć pełne środowisko uruchomieniowe harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj
[agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Szybki start dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jeśli Twój gateway działa pod launchd/systemd i `PATH` jest minimalne, dodaj tylko
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

To wszystko. Żadne klucze ani dodatkowa konfiguracja uwierzytelniania nie są potrzebne poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na
hoście gateway, OpenClaw teraz automatycznie ładuje należący do niego dołączony Plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w odwołaniu do modelu albo w
`agents.defaults.cliBackends`.

## Używanie jako rozwiązania awaryjnego

Dodaj backend CLI do listy rozwiązań awaryjnych, aby był uruchamiany tylko wtedy, gdy modele podstawowe zawiodą:

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

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam również modele backendu CLI.
- Jeśli podstawowy dostawca zawiedzie (uwierzytelnianie, limity szybkości, przekroczenia czasu), OpenClaw
  spróbuje następnie użyć backendu CLI.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **id dostawcy** (np. `codex-cli`, `my-cli`).
Id dostawcy staje się lewą stroną odwołania do modelu:

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

1. **Wybiera backend** na podstawie prefiksu dostawcy (`codex-cli/...`).
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw i kontekstu workspace.
3. **Uruchamia CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces Claude stdio aktywny dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje dane wyjściowe** (JSON albo zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** dla każdego backendu, aby kolejne tury ponownie używały tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` w Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do pliku
tymczasowego dla każdej nowej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym prompcie systemowym oraz
tymczasowy Plugin Claude Code przekazywany przez `--plugin-dir`. Plugin zawiera
tylko Skills kwalifikujące się dla tego agenta/sesji, więc natywny mechanizm rozpoznawania Skills Claude Code
widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w prompcie.
Nadpisania env/kluczy API dla Skills są nadal stosowane przez OpenClaw do środowiska procesu potomnego na czas uruchomienia.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, samo Claude Code
musi być już zalogowane na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik binarny `claude`
nie jest już dostępny w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) albo
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator musi zostać wstawiony
  do wielu flag.
- Jeśli CLI używa **podpolecenia wznowienia** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli nic nie zapisano).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy został wcześniej zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, dzięki czemu kolejne tury ponownie używają aktywnego procesu Claude,
  gdy jest on aktywny. Ciepłe stdio jest teraz ustawieniem domyślnym, także dla konfiguracji niestandardowych,
  które pomijają pola transportu. Jeśli Gateway uruchomi się ponownie albo bezczynny proces
  zakończy działanie, OpenClaw wznowi pracę na podstawie zapisanego identyfikatora sesji Claude. Zapisane identyfikatory sesji
  są weryfikowane względem istniejącego, czytelnego transkryptu projektu przed
  wznowieniem, więc fantomowe powiązania są czyszczone z `reason=transcript-missing`,
  zamiast po cichu rozpoczynać nową sesję Claude CLI pod `--resume`.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Domyślne codzienne
  resetowanie sesji ich nie przerywa; `/reset` i jawne polityki `session.reset` już tak.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność uruchomień w tym samym lane.
- Większość CLI serializuje pracę w jednym lane dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość uwierzytelniania,
  w tym gdy zmienia się id profilu uwierzytelniania, statyczny klucz API, statyczny token
  albo tożsamość konta OAuth, jeśli CLI ją udostępnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie przerywa zapisanej sesji CLI. Jeśli CLI nie udostępnia stabilnego id konta OAuth,
  OpenClaw pozwala temu CLI samodzielnie egzekwować uprawnienia wznowienia.

## Obrazy (przekazywanie dalej)

Jeśli Twój CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie jest ustawione, OpenClaw dołącza
ścieżki plików do promptu (wstrzykiwanie ścieżek), co wystarcza dla CLI, które automatycznie
ładują pliki lokalne ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślne) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla danych wyjściowych Gemini CLI w formacie JSON OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  użycie z `stats`, gdy `usage` jest nieobecne lub puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji,
  jeśli są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślne) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Ustawienia domyślne (należące do Pluginu)

Dołączony Plugin OpenAI rejestruje również domyślne ustawienia dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje również domyślne ustawienia dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` albo
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie wraca do `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli `stats.input` jest nieobecne, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to potrzebne (częsty przypadek: bezwzględna ścieżka `command`).

## Ustawienia domyślne należące do Pluginu

Domyślne ustawienia backendu CLI są teraz częścią powierzchni Pluginu:

- Pluginy rejestrują je przez `api.registerCliBackend(...)`.
- Backend `id` staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje domyślne ustawienia Pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu nadal pozostaje po stronie Pluginu dzięki opcjonalnemu
  hookowi `normalizeConfig`.

Pluginy, które potrzebują drobnych shimów zgodności promptów/wiadomości, mogą deklarować
dwukierunkowe transformacje tekstu bez zastępowania dostawcy ani backendu CLI:

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

`input` przepisuje prompt systemowy i prompt użytkownika przekazywane do CLI. `output`
przepisuje strumieniowane delty asystenta i sparsowany tekst końcowy, zanim OpenClaw obsłuży
własne znaczniki sterujące i dostarczenie kanałowe.

Dla CLI, które emitują JSONL zgodny z Claude Code stream-json, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP dla bundle

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć generowaną nakładkę konfiguracji MCP przez `bundleMcp: true`.

Obecne zachowanie dla dołączonych backendów:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy bundle MCP jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP local loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most przy użyciu tokenu na sesję (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego workspace
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomieniową przy użyciu trybu integracji należącego do backendu z rozszerzenia będącego jego właścicielem

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza bundle MCP, aby uruchomienia w tle pozostały odizolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia.
- **Wyjścia strukturalne** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez dane wyjściowe tekstowe (bez JSONL), co jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby mapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie potrafi wznawiać z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki do plików).
