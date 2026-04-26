---
read_when:
    - Instalowanie lub konfigurowanie harness `acpx` dla Claude Code / Codex / Gemini CLI
    - Włączanie mostu MCP `plugin-tools` lub `OpenClaw-tools`
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja harness `acpx`, konfiguracja Pluginów, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-04-26T11:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Aby zapoznać się z omówieniem, runbookiem operatora i pojęciami, zobacz [Agenci ACP](/pl/tools/acp-agents).

Poniższe sekcje obejmują konfigurację harness `acpx`, konfigurację Pluginów dla mostów MCP oraz konfigurację uprawnień.

Używaj tej strony tylko wtedy, gdy konfigurujesz ścieżkę ACP/acpx. W przypadku natywnej konfiguracji środowiska wykonawczego app-server Codex użyj [Harness Codex](/pl/plugins/codex-harness). W przypadku kluczy API OpenAI lub konfiguracji dostawcy modeli Codex OAuth użyj
[OpenAI](/pl/providers/openai).

Codex ma dwie ścieżki OpenClaw:

| Ścieżka                   | Konfiguracja/polecenie                                  | Strona konfiguracji                    |
| ------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Natywny app-server Codex  | `/codex ...`, `agentRuntime.id: "codex"`                | [Harness Codex](/pl/plugins/codex-harness) |
| Jawny adapter ACP Codex   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"`  | Ta strona                              |

Preferuj ścieżkę natywną, chyba że wyraźnie potrzebujesz zachowania ACP/acpx.

## Obsługa harness `acpx` (obecnie)

Bieżące wbudowane aliasy harness `acpx`:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Gdy OpenClaw używa backendu `acpx`, preferuj te wartości dla `agentId`, chyba że Twoja konfiguracja `acpx` definiuje niestandardowe aliasy agentów.
Jeśli Twoja lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji `acpx`, zamiast zmieniać domyślną wartość wbudowaną.

Bezpośrednie użycie CLI `acpx` może także kierować do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka awaryjna jest funkcją CLI `acpx` (a nie standardowej ścieżki `agentId` OpenClaw).

Sterowanie modelem zależy od możliwości adaptera. Odwołania do modeli Codex ACP są
normalizowane przez OpenClaw przed uruchomieniem. Inne harnessy wymagają ACP `models` oraz
obsługi `session/set_model`; jeśli harness nie udostępnia ani tej możliwości ACP,
ani własnej flagi modelu przy uruchamianiu, OpenClaw/acpx nie może wymusić wyboru modelu.

## Wymagana konfiguracja

Podstawowa konfiguracja ACP:

```json5
{
  acp: {
    enabled: true,
    // Opcjonalne. Domyślnie true; ustaw false, aby wstrzymać wysyłanie ACP przy zachowaniu kontrolek /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfiguracja powiązania wątków zależy od adaptera kanału. Przykład dla Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jeśli uruchamianie ACP związane z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania z bieżącą konwersacją nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu konwersacji i adaptera kanału, który udostępnia powiązania konwersacji ACP.

Zobacz [Dokumentacja referencyjna konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Pluginu dla backendu `acpx`

Świeże instalacje dostarczają wbudowany Plugin środowiska wykonawczego `acpx` włączony domyślnie, więc ACP
zwykle działa bez ręcznej instalacji Pluginu.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalny checkout deweloperski, użyj jawnej ścieżki Pluginu:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokalna instalacja w obszarze roboczym podczas programowania:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie zweryfikuj stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji `acpx`

Domyślnie wbudowany Plugin `acpx` rejestruje osadzony backend ACP bez
uruchamiania agenta ACP podczas startu Gateway. Uruchom `/acp doctor`, aby wykonać jawne
sprawdzenie na żywo. Ustaw `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` tylko wtedy, gdy potrzebujesz, aby
Gateway sprawdzał skonfigurowanego agenta przy uruchamianiu.

Nadpisz polecenie lub wersję w konfiguracji Pluginu:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` akceptuje ścieżkę bezwzględną, ścieżkę względną (rozwiązywaną względem obszaru roboczego OpenClaw) albo nazwę polecenia.
- `expectedVersion: "any"` wyłącza ścisłe dopasowanie wersji.
- Niestandardowe ścieżki `command` wyłączają automatyczną instalację lokalną dla Pluginu.

Zobacz [Pluginy](/pl/tools/plugin).

### Automatyczna instalacja zależności

Gdy instalujesz OpenClaw globalnie za pomocą `npm install -g openclaw`, zależności środowiska wykonawczego `acpx`
(binaria zależne od platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, gateway nadal uruchomi się
normalnie i zgłosi brakującą zależność przez `openclaw acp doctor`.

### Most MCP narzędzi Pluginów

Domyślnie sesje ACPX **nie** udostępniają zarejestrowanych przez Pluginy OpenClaw narzędzi
dla harnessu ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, mogli wywoływać zainstalowane
narzędzia Pluginów OpenClaw, takie jak przywoływanie/zapisywanie pamięci, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu sesji ACPX.
- Udostępnia narzędzia Pluginów już zarejestrowane przez zainstalowane i włączone Pluginy OpenClaw.
- Pozostawia tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi Pluginów już aktywnych w gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Pluginom na wykonywanie działań
  w samym OpenClaw.
- Przed włączeniem sprawdź zainstalowane Pluginy.

Niestandardowe `mcpServers` nadal działają jak wcześniej. Wbudowany most narzędzi Pluginów
jest dodatkowym wygodnym mechanizmem opt-in, a nie zamiennikiem ogólnej konfiguracji serwera MCP.

### Most MCP narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez
MCP. Włącz oddzielny most podstawowych narzędzi, gdy agent ACP potrzebuje wybranych
wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowo serwer udostępnia `cron`.
- Pozostawia udostępnianie podstawowych narzędzi jako jawne i domyślnie wyłączone.

### Konfiguracja limitu czasu środowiska wykonawczego

Wbudowany Plugin `acpx` domyślnie ustawia 120-sekundowy limit czasu dla tur osadzonego
środowiska wykonawczego. Daje to wolniejszym harnessom, takim jak Gemini CLI, wystarczająco dużo czasu
na zakończenie uruchamiania i inicjalizacji ACP. Nadpisz tę wartość, jeśli Twój host potrzebuje
innego limitu środowiska wykonawczego:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie gateway.

### Konfiguracja agenta sondy stanu

Gdy `/acp doctor` lub opcjonalna sonda uruchamiania sprawdza backend, wbudowany
Plugin `acpx` sprawdza jednego agenta harnessu. Jeśli ustawiono `acp.allowedAgents`, domyślnie
używany jest pierwszy dozwolony agent; w przeciwnym razie domyślnie jest to `codex`. Jeśli Twoje wdrożenie
wymaga innego agenta ACP do kontroli stanu, ustaw agenta sondy jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania monitów o uprawnienia zapisu plików i wykonywania poleceń powłoki. Plugin `acpx` udostępnia dwa klucze konfiguracyjne, które kontrolują obsługę uprawnień:

Te uprawnienia harnessu ACPX są oddzielne od zatwierdzeń `exec` OpenClaw i oddzielne od flag obejścia dostawcy backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to awaryjny przełącznik break-glass na poziomie harnessu dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harnessu może wykonywać bez monitu.

| Wartość         | Zachowanie                                                |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i `exec` wymagają monitów. |
| `deny-all`      | Odrzuca wszystkie monity o uprawnienia.                   |

### `nonInteractivePermissions`

Kontroluje, co dzieje się, gdy miałby zostać pokazany monit o uprawnienia, ale interaktywny TTY nie jest dostępny (co zawsze ma miejsce w sesjach ACP).

| Wartość | Zachowanie                                                      |
| ------- | --------------------------------------------------------------- |
| `fail`  | Przerywa sesję błędem `AcpRuntimeError`. **(domyślnie)**        |
| `deny`  | Po cichu odrzuca uprawnienie i kontynuuje działanie (łagodna degradacja). |

### Konfiguracja

Ustaw przez konfigurację Pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub `exec`, który wywoła monit o uprawnienia, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli chcesz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje ulegały łagodnej degradacji zamiast się zawieszać.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — omówienie, runbook operatora, pojęcia
- [Pod-agenci](/pl/tools/subagents)
- [Routing wielu agentów](/pl/concepts/multi-agent)
