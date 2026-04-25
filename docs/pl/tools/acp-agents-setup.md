---
read_when:
    - Instalowanie lub konfigurowanie harnessu acpx dla Claude Code / Codex / Gemini CLI
    - Włączanie mostu MCP plugin-tools lub OpenClaw-tools
    - Konfigurowanie trybów uprawnień ACP
summary: 'Konfigurowanie agentów ACP: konfiguracja harnessu acpx, konfiguracja Pluginu, uprawnienia'
title: Agenci ACP — konfiguracja
x-i18n:
    generated_at: "2026-04-25T13:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Przegląd, runbook operatora i omówienie pojęć znajdziesz w sekcji [Agenci ACP](/pl/tools/acp-agents).

Poniższe sekcje omawiają konfigurację harnessu acpx, konfigurację Pluginu dla mostów MCP oraz konfigurację uprawnień.

## Obsługa harnessu acpx (obecnie)

Obecne wbudowane aliasy harnessu acpx:

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

Gdy OpenClaw używa backendu acpx, preferuj te wartości dla `agentId`, chyba że Twoja konfiguracja acpx definiuje niestandardowe aliasy agentów.
Jeśli lokalna instalacja Cursor nadal udostępnia ACP jako `agent acp`, nadpisz polecenie agenta `cursor` w konfiguracji acpx zamiast zmieniać wbudowaną wartość domyślną.

Bezpośrednie użycie CLI acpx może także kierować żądania do dowolnych adapterów przez `--agent <command>`, ale ta surowa furtka awaryjna jest funkcją CLI acpx (a nie standardową ścieżką `agentId` w OpenClaw).

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

Jeśli uruchamianie ACP powiązane z wątkiem nie działa, najpierw sprawdź flagę funkcji adaptera:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Powiązania bieżącej konwersacji nie wymagają tworzenia wątku podrzędnego. Wymagają aktywnego kontekstu rozmowy i adaptera kanału, który udostępnia powiązania konwersacji ACP.

Zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Konfiguracja Pluginu dla backendu acpx

Nowe instalacje są dostarczane z domyślnie włączonym wbudowanym Pluginem runtime `acpx`, więc ACP
zwykle działa bez ręcznego kroku instalacji Pluginu.

Zacznij od:

```text
/acp doctor
```

Jeśli wyłączyłeś `acpx`, zablokowałeś go przez `plugins.allow` / `plugins.deny` albo chcesz
przełączyć się na lokalne środowisko deweloperskie, użyj jawnej ścieżki Pluginu:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalacja z lokalnego obszaru roboczego podczas developmentu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Następnie sprawdź stan backendu:

```text
/acp doctor
```

### Konfiguracja polecenia i wersji acpx

Domyślnie wbudowany Plugin `acpx` używa własnego, przypiętego binarium lokalnego dla Pluginu (`node_modules/.bin/acpx` wewnątrz pakietu Pluginu). Podczas uruchamiania backend jest rejestrowany jako niegotowy, a zadanie w tle weryfikuje `acpx --version`; jeśli binarium jest brakujące lub ma niezgodną wersję, uruchamiane jest `npm install --omit=dev --no-save acpx@<pinned>`, a następnie ponowna weryfikacja. Gateway przez cały czas pozostaje nieblokujący.

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

Gdy instalujesz OpenClaw globalnie przez `npm install -g openclaw`, zależności runtime acpx
(binaria zależne od platformy) są instalowane automatycznie
przez hook postinstall. Jeśli automatyczna instalacja się nie powiedzie, Gateway nadal uruchamia się
normalnie i zgłasza brakującą zależność przez `openclaw acp doctor`.

### Most MCP dla narzędzi Pluginów

Domyślnie sesje ACPX **nie** udostępniają zarejestrowanych przez Pluginy OpenClaw narzędzi
do harnessu ACP.

Jeśli chcesz, aby agenci ACP, tacy jak Codex lub Claude Code, mogli wywoływać zainstalowane
narzędzia Pluginów OpenClaw, takie jak memory recall/store, włącz dedykowany most:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-plugin-tools` do bootstrapu
  sesji ACPX.
- Udostępnia narzędzia Pluginów już zarejestrowane przez zainstalowane i włączone Pluginy OpenClaw.
- Zachowuje tę funkcję jako jawną i domyślnie wyłączoną.

Uwagi dotyczące bezpieczeństwa i zaufania:

- To rozszerza powierzchnię narzędzi harnessu ACP.
- Agenci ACP uzyskują dostęp tylko do narzędzi Pluginów już aktywnych w Gateway.
- Traktuj to jako tę samą granicę zaufania, co pozwolenie tym Pluginom na wykonywanie się w samym OpenClaw.
- Przed włączeniem sprawdź zainstalowane Pluginy.

Niestandardowe `mcpServers` nadal działają tak jak wcześniej. Wbudowany most plugin-tools
jest dodatkową wygodną funkcją opt-in, a nie zastępstwem dla ogólnej konfiguracji serwera MCP.

### Most MCP dla narzędzi OpenClaw

Domyślnie sesje ACPX również **nie** udostępniają wbudowanych narzędzi OpenClaw przez
MCP. Włącz osobny most narzędzi rdzenia, gdy agent ACP potrzebuje wybranych
wbudowanych narzędzi, takich jak `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Co to robi:

- Wstrzykuje wbudowany serwer MCP o nazwie `openclaw-tools` do bootstrapu
  sesji ACPX.
- Udostępnia wybrane wbudowane narzędzia OpenClaw. Początkowo serwer udostępnia `cron`.
- Zachowuje ekspozycję narzędzi rdzenia jako jawną i domyślnie wyłączoną.

### Konfiguracja limitu czasu runtime

Wbudowany Plugin `acpx` domyślnie ustawia limit czasu osadzonych tur runtime na 120 sekund.
Daje to wolniejszym harnessom, takim jak Gemini CLI, wystarczająco dużo czasu na ukończenie
uruchamiania i inicjalizacji ACP. Nadpisz tę wartość, jeśli host wymaga innego
limitu runtime:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Po zmianie tej wartości uruchom ponownie Gateway.

### Konfiguracja agenta health probe

Wbudowany Plugin `acpx` sonduje jednego agenta harnessu podczas ustalania, czy
backend osadzonego runtime jest gotowy. Jeśli `acp.allowedAgents` jest ustawione, domyślnie używany jest
pierwszy dozwolony agent; w przeciwnym razie domyślnie używany jest `codex`. Jeśli wdrożenie
wymaga innego agenta ACP do kontroli stanu, ustaw agenta sondującego jawnie:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Po zmianie tej wartości uruchom ponownie Gateway.

## Konfiguracja uprawnień

Sesje ACP działają nieinteraktywnie — nie ma TTY do zatwierdzania ani odrzucania promptów uprawnień zapisu plików i wykonywania poleceń powłoki. Plugin acpx udostępnia dwa klucze konfiguracji, które kontrolują sposób obsługi uprawnień:

Te uprawnienia harnessu ACPX są oddzielne od zatwierdzeń wykonywania OpenClaw i oddzielne od flag obejścia dostawców backendu CLI, takich jak Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` to przełącznik awaryjny break-glass na poziomie harnessu dla sesji ACP.

### `permissionMode`

Kontroluje, które operacje agent harnessu może wykonywać bez promptu.

| Wartość | Zachowanie |
| --------------- | --------------------------------------------------------- |
| `approve-all` | Automatycznie zatwierdza wszystkie zapisy plików i polecenia powłoki. |
| `approve-reads` | Automatycznie zatwierdza tylko odczyty; zapisy i exec wymagają promptów. |
| `deny-all` | Odrzuca wszystkie prompty uprawnień. |

### `nonInteractivePermissions`

Kontroluje, co się dzieje, gdy prompt uprawnień miałby zostać pokazany, ale nie jest dostępne interaktywne TTY (co zawsze ma miejsce w sesjach ACP).

| Wartość | Zachowanie |
| ------ | ----------------------------------------------------------------- |
| `fail` | Przerywa sesję z `AcpRuntimeError`. **(domyślnie)** |
| `deny` | Po cichu odrzuca uprawnienie i kontynuuje (łagodna degradacja). |

### Konfiguracja

Ustaw przez konfigurację Pluginu:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Po zmianie tych wartości uruchom ponownie Gateway.

> **Ważne:** OpenClaw obecnie domyślnie używa `permissionMode=approve-reads` i `nonInteractivePermissions=fail`. W nieinteraktywnych sesjach ACP każdy zapis lub exec, który wywoła prompt uprawnień, może zakończyć się błędem `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jeśli chcesz ograniczyć uprawnienia, ustaw `nonInteractivePermissions` na `deny`, aby sesje degradowały się łagodnie zamiast kończyć awarią.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — przegląd, runbook operatora, pojęcia
- [Sub-agenci](/pl/tools/subagents)
- [Routing wielu agentów](/pl/concepts/multi-agent)
