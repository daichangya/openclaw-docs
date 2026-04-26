---
read_when:
    - Uruchamianie smoke testów live macierzy modeli / backendów CLI / ACP / dostawców multimediów
    - Debugowanie rozwiązywania poświadczeń testów live
    - Dodawanie nowego testu live specyficznego dla dostawcy
sidebarTitle: Live tests
summary: 'Testy live (dotykające sieci): macierz modeli, backendy CLI, ACP, dostawcy multimediów, poświadczenia'
title: 'Testowanie: zestawy live'
x-i18n:
    generated_at: "2026-04-26T11:32:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

Aby szybko zacząć, poznać runnery QA, zestawy unit/integration i przepływy Docker, zobacz
[Testowanie](/pl/help/testing). Ta strona obejmuje zestawy testów **live** (dotykających sieci):
macierz modeli, backendy CLI, ACP i testy live dostawców multimediów oraz obsługę
poświadczeń.

## Live: lokalne polecenia smoke dla profilu

Przed doraźnymi kontrolami live załaduj `~/.profile`, aby klucze dostawców i lokalne ścieżki narzędzi
odpowiadały Twojej powłoce:

```bash
source ~/.profile
```

Bezpieczny smoke multimediów:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Bezpieczny smoke gotowości połączeń głosowych:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` to dry run, chyba że obecne jest także `--yes`. Używaj `--yes` tylko
wtedy, gdy celowo chcesz wykonać rzeczywiste połączenie powiadamiające. Dla Twilio, Telnyx i
Plivo udana kontrola gotowości wymaga publicznego URL Webhooka; fallbacki lokalne
tylko-loopback/prywatne są celowo odrzucane.

## Live: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie ogłaszane** przez połączony Android Node i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępne/ręczne przygotowanie (zestaw nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego Android Node.
- Wymagane przygotowanie:
  - Aplikacja Android jest już połączona z gateway + sparowana.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie są przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Androida: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profilu)

Testy live są podzielone na dwie warstwy, aby można było izolować błędy:

- „Direct model” mówi nam, że dostawca/model w ogóle potrafi odpowiedzieć przy danym kluczu.
- „Gateway smoke” mówi nam, że pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandbox, itd.).

### Warstwa 1: bezpośrednie uzupełnianie przez model (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, do których masz poświadczenia
  - Uruchomić małe uzupełnienie dla każdego modelu (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten zestaw; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` pozostało skupione na gateway smoke
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` to alias dla nowoczesnej allowlist
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist rozdzielana przecinkami)
  - Przebiegi modern/all domyślnie używają wyselekcjonowanego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla pełnego przebiegu modern lub wartość dodatnią dla mniejszego limitu.
  - Pełne przebiegi używają `OPENCLAW_LIVE_TEST_TIMEOUT_MS` jako timeoutu całego testu direct-model. Domyślnie: 60 minut.
  - Testy direct-model działają domyślnie z równoległością 20; ustaw `OPENCLAW_LIVE_MODEL_CONCURRENCY`, aby to nadpisać.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „pipeline agenta gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: przepływy replay reasoning + tool-call w OpenAI Responses/Codex Responses)

### Warstwa 2: smoke Gateway + agent dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway w procesie
  - Utworzyć/poprawić sesję `agent:dev:*` (nadpisanie modelu per uruchomienie)
  - Iterować po modelach-z-kluczami i potwierdzić:
    - „znaczącą” odpowiedź (bez narzędzi)
    - że działa rzeczywiste wywołanie narzędzia (read probe)
    - opcjonalne dodatkowe testy narzędzi (exec+read probe)
    - że ścieżki regresji OpenAI (tylko tool-call → follow-up) nadal działają
- Szczegóły testów (aby można było szybko wyjaśnić błędy):
  - Test `read`: test zapisuje plik nonce w workspace i prosi agenta o jego `read` oraz odesłanie nonce.
  - Test `exec+read`: test prosi agenta o zapisanie nonce do pliku tymczasowego przez `exec`, a następnie o `read`.
  - Test obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Implementacja referencyjna: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` to alias dla nowoczesnej allowlist
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przebiegi gateway modern/all domyślnie używają wyselekcjonowanego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla pełnego przebiegu modern lub wartość dodatnią dla mniejszego limitu.
- Jak wybierać dostawców (unikaj „wszystko przez OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist rozdzielana przecinkami)
- Testy narzędzi + obrazu są zawsze włączone w tym teście live:
  - test `read` + test `exec+read` (obciążenie narzędzi)
  - test obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazowego
  - Przepływ (ogólnie):
    - Test generuje mały PNG z „CAT” + losowy kod (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` jako `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dozwolone)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (i dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować pipeline Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do właściciela rozszerzenia.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Ustawienia domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie command/args/image pochodzi z metadanych pluginu backendu CLI będącego właścicielem.
- Nadpisania (opcjonalnie):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu). Recepty Docker domyślnie mają to wyłączone, chyba że zostanie to jawnie zażądane.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazów jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazów, gdy ustawione jest `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, aby włączyć test ciągłości tej samej sesji Claude Sonnet -> Opus, gdy wybrany model obsługuje cel przełączenia. Recepty Docker domyślnie mają to wyłączone dla zbiorczej niezawodności.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, aby włączyć test loopback MCP/narzędzi. Recepty Docker domyślnie mają to wyłączone, chyba że zostanie to jawnie zażądane.

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Tani smoke konfiguracji Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

To nie prosi Gemini o wygenerowanie odpowiedzi. Zapisuje te same ustawienia systemowe,
które OpenClaw przekazuje Gemini, a następnie uruchamia `gemini --debug mcp list`, aby potwierdzić, że
zapisany serwer `transport: "streamable-http"` jest normalizowany do kształtu HTTP MCP Gemini
i potrafi połączyć się z lokalnym serwerem MCP streamable-HTTP.

Recepta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recepty Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repo jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI z rozszerzenia właściciela, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Docker, a następnie uruchamia dwie tury backendu CLI Gateway bez zachowywania zmiennych env klucza API Anthropic. Ta ścieżka subskrypcji domyślnie wyłącza testy Claude MCP/narzędzi i obrazów, ponieważ Claude obecnie kieruje użycie aplikacji zewnętrznych przez dodatkowe rozliczenie usage zamiast zwykłych limitów planu subskrypcji.
- Smoke live backendu CLI wykonuje teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI gateway.
- Domyślny smoke Claude dodatkowo poprawia sesję z Sonnet do Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke powiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ powiązania konwersacji ACP z użyciem live agenta ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną konwersację kanału wiadomości w miejscu
  - wysłać zwykłe dalsze polecenie w tej samej konwersacji
  - potwierdzić, że dalsza wiadomość trafia do transkryptu powiązanej sesji ACP
- Włączanie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Ustawienia domyślne:
  - Agenci ACP w Docker: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Syntetyczny kanał: kontekst rozmowy w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Uwagi:
  - Ta ścieżka używa powierzchni `chat.send` gateway z polami originating-route syntetycznymi dostępnymi tylko dla admin, dzięki czemu testy mogą dołączyć kontekst kanału wiadomości bez udawania dostarczania zewnętrznego.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów osadzonego pluginu `acpx` dla wybranego agenta harness ACP.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recepty Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Uwagi dotyczące Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke powiązania ACP względem zagregowanych live agentów CLI sekwencyjnie: `claude`, `codex`, potem `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, aby zawęzić macierz.
- Ładuje `~/.profile`, przygotowuje pasujące materiały uwierzytelniania CLI do kontenera, a następnie instaluje żądane live CLI (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid przez `https://app.factory.ai/cli`, `@google/gemini-cli` lub `opencode-ai`), jeśli ich brakuje. Sam backend ACP to dołączony osadzony pakiet `acpx/runtime` z pluginu `acpx`.
- Wariant Docker Droid przygotowuje `~/.factory` dla ustawień, przekazuje `FACTORY_API_KEY` i wymaga tego klucza API, ponieważ lokalne uwierzytelnianie Factory OAuth/keyring nie jest przenośne do kontenera. Używa wbudowanego wpisu rejestru ACPX `droid exec --output-format acp`.
- Wariant Docker OpenCode to ścisła ścieżka regresji dla pojedynczego agenta. Zapisuje tymczasowy domyślny model `OPENCODE_CONFIG_CONTENT` z `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (domyślnie `opencode/kimi-k2.6`) po załadowaniu `~/.profile`, a `pnpm test:docker:live-acp-bind:opencode` wymaga powiązanego transkryptu asystenta zamiast akceptować ogólne pominięcie po powiązaniu.
- Bezpośrednie wywołania CLI `acpx` są tylko ręczną/awaryjną ścieżką do porównywania zachowania poza Gateway. Smoke powiązania ACP w Docker wykonuje osadzony backend runtime `acpx` OpenClaw.

## Live: smoke harness app-server Codex

- Cel: zweryfikować harness Codex należący do Plugin przez normalną metodę
  `agent` gateway:
  - załadować dołączony Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę agenta gateway do `openai/gpt-5.2` z wymuszonym harness Codex
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek app-server
    może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę polecenia gateway
  - opcjonalnie uruchomić dwa testy eskalowane recenzowane przez Guardian: jedno nieszkodliwe
    polecenie, które powinno zostać zatwierdzone, oraz jedno fałszywe wysłanie sekretu,
    które powinno zostać odrzucone, tak aby agent dopytał
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Domyślny model: `openai/gpt-5.2`
- Opcjonalny test obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalny test MCP/narzędzi: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Opcjonalny test Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzony harness Codex
  nie mógł przejść przez ciche przełączenie awaryjne do PI.
- Uwierzytelnianie: uwierzytelnianie app-server Codex z lokalnego logowania subskrypcji Codex. Testy Docker
  mogą także dostarczyć `OPENAI_API_KEY` dla testów innych niż Codex, gdy ma to zastosowanie,
  oraz opcjonalnie skopiowane `~/.codex/auth.json` i `~/.codex/config.toml`.

Lokalna recepta:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recepta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi dotyczące Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Ładuje zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniania CLI Codex, jeśli są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko test live harness Codex.
- Docker domyślnie włącza testy obrazu, MCP/narzędzi oraz Guardian. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, gdy potrzebujesz węższego przebiegu debugowania.
- Docker eksportuje również `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją testu live,
  aby starsze aliasy lub fallback do PI nie mogły ukryć regresji harness Codex.

### Zalecane recepty live

Wąskie, jawne allowlist są najszybsze i najmniej podatne na niestabilność:

- Pojedynczy model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi przez kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke adaptacyjnego myślenia Google:
  - Jeśli lokalne klucze znajdują się w profilu powłoki: `source ~/.profile`
  - Gemini 3, dynamiczne ustawienie domyślne: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5, dynamiczny budżet: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego CLI Gemini na Twojej maszynie (osobne uwierzytelnianie + specyficzne cechy narzędzi).
- API Gemini vs CLI Gemini:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (uwierzytelnianie kluczem API / profilem); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny binarny `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opcjonalne), ale to są **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest przebieg „typowych modeli”, który ma stale działać:

- OpenAI (nie-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` i `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom gateway smoke z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Poziom bazowy: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz przynajmniej jeden model na rodzinę dostawcy:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (mile widziane):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model z obsługą narzędzi, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalne; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij przynajmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI z vision itd.), aby wykonać test obrazu.

### Agregatory / alternatywne gatewaye

Jeśli masz włączone klucze, obsługujemy także testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia+obrazy)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe punkty końcowe): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj na sztywno wpisywać „wszystkich modeli” w dokumentacji. Autorytatywną listą jest to, co zwraca `discoverModels(...)` na Twojej maszynie + jakie klucze są dostępne.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. W praktyce oznacza to:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „brak poświadczeń”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego home live, jeśli istnieje, ale nie jest głównym magazynem profile-key)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego home testowego; przygotowane home live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby testy nie dotykały Twojego rzeczywistego workspace hosta.

Jeśli chcesz polegać na kluczach env (np. eksportowanych w `~/.profile`), uruchamiaj lokalne testy po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą one montować `~/.profile` do kontenera).

## Live Deepgram (transkrypcja audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Włączanie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `extensions/byteplus/live.test.ts`
- Włączanie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live multimediów workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Wykonuje dołączone ścieżki comfy dla obrazów, wideo i `music_generate`
  - Pomija każdą możliwość, jeśli nie skonfigurowano `plugins.entries.comfy.config.<capability>`
  - Przydatne po zmianach w zgłaszaniu workflow comfy, odpytywaniu, pobieraniu lub rejestracji pluginu

## Live generowania obrazów

- Test: `test/image-generation.runtime.live.test.ts`
- Polecenie: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Ładuje brakujące zmienne env dostawców z powłoki logowania (`~/.profile`) przed testowaniem
  - Domyślnie używa live/env API keys przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez używalnego uwierzytelniania/profilu/modelu
  - Uruchamia każdego skonfigurowanego dostawcę przez współdzielony runtime generowania obrazów:
    - `<provider>:generate`
    - `<provider>:edit`, gdy dostawca deklaruje obsługę edycji
- Obecnie objęci dołączeni dostawcy:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko-env

Dla dostarczonej ścieżki CLI dodaj smoke `infer` po przejściu testu live
dostawcy/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

To obejmuje parsowanie argumentów CLI, rozwiązywanie config/domyslnego agenta,
aktywację dołączonych pluginów, naprawę zależności runtime dołączonych na żądanie, współdzielony
runtime generowania obrazów oraz żądanie do live dostawcy.

## Live generowania muzyki

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Wykonuje współdzieloną dołączoną ścieżkę dostawców generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env dostawców z powłoki logowania (`~/.profile`) przed testowaniem
  - Domyślnie używa live/env API keys przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez używalnego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym wyłącznie na prompt
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Aktualne współdzielone pokrycie ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przegląd
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko-env

## Live generowania wideo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Wykonuje współdzieloną dołączoną ścieżkę dostawców generowania wideo
  - Domyślnie używa bezpiecznej dla wydań ścieżki smoke: dostawcy inni niż FAL, jedno żądanie text-to-video per dostawca, jednosekundowy prompt z homarem i limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie po stronie kolejki dostawcy może zdominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env dostawców z powłoki logowania (`~/.profile`) przed testowaniem
  - Domyślnie używa live/env API keys przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne klucze testowe w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez używalnego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled`, a wybrany dostawca/model akceptuje wejście lokalnego obrazu opartego na buforze we współdzielonym przeglądzie
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled`, a wybrany dostawca/model akceptuje wejście lokalnego wideo opartego na buforze we współdzielonym przeglądzie
  - Aktualni zadeklarowani, ale pomijani dostawcy `imageToVideo` we współdzielonym przeglądzie:
    - `vydra`, ponieważ dołączony `veo3` jest tylko tekstowy, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa zdalnego fixture URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Aktualni zadeklarowani, ale pomijani dostawcy `videoToVideo` we współdzielonym przeglądzie:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL-i `http(s)` / MP4
    - `google`, ponieważ bieżąca współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze, a ta ścieżka nie jest akceptowana we współdzielonym przeglądzie
    - `openai`, ponieważ bieżąca współdzielona ścieżka nie gwarantuje dostępu do inpaint/remix wideo specyficznego dla organizacji
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przeglądzie, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji każdego dostawcy dla agresywnego przebiegu smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko-env

## Harness live multimediów

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live obrazów, muzyki i wideo przez jeden natywny punkt wejścia repo
  - Automatycznie ładuje brakujące zmienne env dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do dostawców, którzy aktualnie mają używalne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu quiet pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Powiązane

- [Testowanie](/pl/help/testing) — zestawy unit, integration, QA i Docker
