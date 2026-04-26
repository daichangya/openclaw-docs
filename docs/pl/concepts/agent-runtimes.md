---
read_when:
    - Wybierasz między Pi, Codex, ACP lub innym natywnym runtime agenta
    - Nie rozumiesz etykiet dostawcy/modelu/runtime w statusie lub konfiguracji
    - Dokumentujesz równoważność wsparcia dla natywnego harnessu
summary: Jak OpenClaw rozdziela dostawców modeli, modele, kanały i runtime agentów
title: Runtime agentów
x-i18n:
    generated_at: "2026-04-26T11:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**Runtime agenta** to komponent, który obsługuje jedną przygotowaną pętlę modelu: otrzymuje prompt, steruje generowaniem modelu, obsługuje natywne wywołania narzędzi i zwraca ukończoną turę do OpenClaw.

Runtime łatwo pomylić z dostawcami, ponieważ oba pojawiają się blisko konfiguracji modelu. To jednak różne warstwy:

| Warstwa       | Przykłady                             | Co to oznacza                                                      |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Dostawca      | `openai`, `anthropic`, `openai-codex` | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa referencje modeli. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model wybrany dla tury agenta.                                     |
| Runtime agenta | `pi`, `codex`, `claude-cli`          | Niskopoziomowa pętla lub backend, który wykonuje przygotowaną turę. |
| Kanał         | Telegram, Discord, Slack, WhatsApp    | Miejsce, w którym wiadomości wchodzą do OpenClaw i z niego wychodzą. |

W kodzie zobaczysz też słowo **harness**. Harness to implementacja, która dostarcza runtime agenta. Na przykład dołączony harness Codex implementuje runtime `codex`. Publiczna konfiguracja używa `agentRuntime.id`; `openclaw doctor --fix` przepisuje starsze klucze polityki runtime do tej postaci.

Istnieją dwie rodziny runtime:

- **Embedded harnesses** działają wewnątrz przygotowanej pętli agenta OpenClaw. Obecnie jest to wbudowany runtime `pi` oraz zarejestrowane harnessy Plugin, takie jak `codex`.
- **CLI backends** uruchamiają lokalny proces CLI, zachowując przy tym referencję modelu jako kanoniczną. Na przykład `anthropic/claude-opus-4-7` z `agentRuntime.id: "claude-cli"` oznacza „wybierz model Anthropic, wykonaj przez Claude CLI”. `claude-cli` nie jest identyfikatorem embedded harness i nie może być przekazywany do wyboru AgentHarness.

## Trzy rzeczy nazywane Codex

Większość zamieszania wynika z tego, że trzy różne powierzchnie współdzielą nazwę Codex:

| Powierzchnia                                         | Nazwa/konfiguracja w OpenClaw         | Co robi                                                                                             |
| ---------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Trasa dostawcy OAuth Codex                           | referencje modeli `openai-codex/*`    | Używa subskrypcyjnego OAuth ChatGPT/Codex przez zwykły runner PI OpenClaw.                         |
| Natywny runtime app-server Codex                     | `agentRuntime.id: "codex"`            | Uruchamia embedded turę agenta przez dołączony harness app-server Codex.                           |
| Adapter ACP Codex                                    | `runtime: "acp"`, `agentId: "codex"`  | Uruchamia Codex przez zewnętrzną płaszczyznę sterowania ACP/acpx. Używaj tylko wtedy, gdy ACP/acpx jest wyraźnie wymagane. |
| Natywny zestaw poleceń sterowania czatem Codex       | `/codex ...`                          | Wiąże, wznawia, steruje, zatrzymuje i sprawdza wątki app-server Codex z poziomu czatu.             |
| Trasa OpenAI Platform API dla modeli w stylu GPT/Codex | referencje modeli `openai/*`        | Używa uwierzytelniania kluczem API OpenAI, chyba że nadpisanie runtime, takie jak `runtime: "codex"`, wykonuje turę. |

Te powierzchnie są celowo niezależne. Włączenie Plugin `codex` udostępnia funkcje natywnego app-server, ale nie przepisuje `openai-codex/*` na `openai/*`, nie zmienia istniejących sesji i nie czyni ACP domyślnym dla Codex. Wybranie `openai-codex/*` oznacza „użyj trasy dostawcy OAuth Codex”, chyba że osobno wymusisz runtime.

Typowa konfiguracja Codex używa dostawcy `openai` z runtime `codex`:

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
}
```

Oznacza to, że OpenClaw wybiera referencję modelu OpenAI, a następnie prosi runtime app-server Codex o uruchomienie embedded tury agenta. Nie oznacza to, że kanał, katalog dostawców modeli ani magazyn sesji OpenClaw stają się Codex.

Gdy dołączony Plugin `codex` jest włączony, sterowanie Codex w języku naturalnym powinno używać natywnej powierzchni poleceń `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) zamiast ACP. Używaj ACP dla Codex tylko wtedy, gdy użytkownik wyraźnie prosi o ACP/acpx albo testuje ścieżkę adaptera ACP. Claude Code, Gemini CLI, OpenCode, Cursor i podobne zewnętrzne harnessy nadal używają ACP.

To jest drzewo decyzyjne dla agenta:

1. Jeśli użytkownik prosi o **Codex bind/control/thread/resume/steer/stop**, użyj natywnej powierzchni poleceń `/codex`, gdy dołączony Plugin `codex` jest włączony.
2. Jeśli użytkownik prosi o **Codex jako embedded runtime**, użyj `openai/<model>` z `agentRuntime.id: "codex"`.
3. Jeśli użytkownik prosi o **OAuth/subskrypcyjne uwierzytelnianie Codex w zwykłym runnerze OpenClaw**, użyj `openai-codex/<model>` i pozostaw runtime jako PI.
4. Jeśli użytkownik wyraźnie mówi **ACP**, **acpx** lub **adapter ACP Codex**, użyj ACP z `runtime: "acp"` i `agentId: "codex"`.
5. Jeśli żądanie dotyczy **Claude Code, Gemini CLI, OpenCode, Cursor, Droid lub innego zewnętrznego harnessu**, użyj ACP/acpx, a nie natywnego runtime subagenta.

| Chodzi Ci o...                          | Użyj...                                      |
| --------------------------------------- | -------------------------------------------- |
| Sterowanie czatem/wątkiem app-server Codex | `/codex ...` z dołączonego Plugin `codex` |
| Embedded runtime agenta app-server Codex | `agentRuntime.id: "codex"`                  |
| OAuth OpenAI Codex w runnerze PI        | referencje modeli `openai-codex/*`           |
| Claude Code lub inny zewnętrzny harness | ACP/acpx                                     |

Aby poznać podział prefiksów rodziny OpenAI, zobacz [OpenAI](/pl/providers/openai) oraz [Model providers](/pl/concepts/model-providers). Informacje o kontrakcie wsparcia runtime Codex znajdziesz w [Codex harness](/pl/plugins/codex-harness#v1-support-contract).

## Własność runtime

Różne runtime są właścicielami różnych części pętli.

| Powierzchnia                | OpenClaw PI embedded                    | App-server Codex                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Właściciel pętli modelu     | OpenClaw przez embedded runner PI       | App-server Codex                                                            |
| Kanoniczny stan wątku       | Transkrypt OpenClaw                     | Wątek Codex plus lustrzana kopia transkryptu OpenClaw                       |
| Dynamic tools OpenClaw      | Natywna pętla narzędzi OpenClaw         | Mostkowane przez adapter Codex                                              |
| Natywne narzędzia shell i file | Ścieżka PI/OpenClaw                  | Natywne narzędzia Codex, mostkowane przez native hooks tam, gdzie są obsługiwane |
| Silnik kontekstu            | Natywne składanie kontekstu OpenClaw    | Kontekst projektowany przez OpenClaw składany do tury Codex                 |
| Compaction                  | OpenClaw lub wybrany silnik kontekstu   | Natywny Compaction Codex, z powiadomieniami OpenClaw i utrzymaniem lustra   |
| Dostarczanie kanałowe       | OpenClaw                                | OpenClaw                                                                    |

Ten podział własności jest główną zasadą projektową:

- Jeśli właścicielem powierzchni jest OpenClaw, OpenClaw może zapewnić normalne zachowanie hooków Plugin.
- Jeśli właścicielem powierzchni jest natywny runtime, OpenClaw potrzebuje zdarzeń runtime lub native hooks.
- Jeśli natywny runtime jest właścicielem kanonicznego stanu wątku, OpenClaw powinien odzwierciedlać i projektować kontekst, a nie przepisywać nieobsługiwane wewnętrzne mechanizmy.

## Wybór runtime

OpenClaw wybiera embedded runtime po rozstrzygnięciu dostawcy i modelu:

1. Wygrywa runtime zapisany w sesji. Zmiany konfiguracji nie przełączają na gorąco istniejącego transkryptu na inny natywny system wątków.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza ten runtime dla nowych lub zresetowanych sesji.
3. `agents.defaults.agentRuntime.id` lub `agents.list[].agentRuntime.id` może ustawić `auto`, `pi`, identyfikator zarejestrowanego embedded harness, taki jak `codex`, albo obsługiwany alias backendu CLI, taki jak `claude-cli`.
4. W trybie `auto` zarejestrowane runtime Plugin mogą przejmować obsługiwane pary dostawca/model.
5. Jeśli żaden runtime nie przejmie tury w trybie `auto`, a ustawione jest `fallback: "pi"` (domyślnie), OpenClaw używa PI jako fallbacku zgodności. Ustaw `fallback: "none"`, aby nieudane dopasowanie w trybie `auto` kończyło się błędem.

Jawne runtime Plugin domyślnie kończą się w trybie fail-closed. Na przykład `runtime: "codex"` oznacza Codex albo wyraźny błąd wyboru, chyba że ustawisz `fallback: "pi"` w tym samym zakresie nadpisania. Nadpisanie runtime nie dziedziczy szerszego ustawienia fallbacku, więc `runtime: "codex"` na poziomie agenta nie zostanie po cichu skierowane z powrotem do PI tylko dlatego, że ustawienia domyślne używały `fallback: "pi"`.

Aliasy backendów CLI różnią się od identyfikatorów embedded harness. Preferowana postać dla Claude CLI to:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Starsze referencje, takie jak `claude-cli/claude-opus-4-7`, nadal są obsługiwane dla zgodności, ale nowa konfiguracja powinna zachowywać kanoniczność dostawcy/modelu, a backend wykonawczy umieszczać w `agentRuntime.id`.

Tryb `auto` jest celowo zachowawczy. Runtime Plugin mogą przejmować pary dostawca/model, które rozumieją, ale Plugin Codex nie przejmuje dostawcy `openai-codex` w trybie `auto`. Dzięki temu `openai-codex/*` pozostaje jawną trasą PI Codex OAuth i unika cichego przenoszenia konfiguracji uwierzytelniania subskrypcyjnego na natywny harness app-server.

Jeśli `openclaw doctor` ostrzega, że Plugin `codex` jest włączony, a `openai-codex/*` nadal jest kierowane przez PI, traktuj to jako diagnozę, a nie migrację. Pozostaw konfigurację bez zmian, jeśli chcesz używać PI Codex OAuth. Przełącz na `openai/<model>` plus `agentRuntime.id: "codex"` tylko wtedy, gdy chcesz natywnego wykonania przez app-server Codex.

## Kontrakt zgodności

Gdy runtime nie jest PI, powinien dokumentować, które powierzchnie OpenClaw obsługuje.
Użyj takiej struktury dla dokumentacji runtime:

| Pytanie                                | Dlaczego to ma znaczenie                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Kto jest właścicielem pętli modelu?    | Określa, gdzie odbywają się ponowienia, kontynuacja narzędzi i decyzje o końcowej odpowiedzi.      |
| Kto jest właścicielem kanonicznej historii wątku? | Określa, czy OpenClaw może edytować historię, czy tylko ją odzwierciedlać.              |
| Czy działają dynamic tools OpenClaw?   | Zależą od tego wiadomości, sesje, Cron i narzędzia będące własnością OpenClaw.                      |
| Czy działają hooki dynamic tools?      | Plugin oczekują `before_tool_call`, `after_tool_call` i middleware wokół narzędzi będących własnością OpenClaw. |
| Czy działają native hooks narzędzi?    | Shell, patch i narzędzia będące własnością runtime wymagają wsparcia native hook dla polityki i obserwacji. |
| Czy działa cykl życia silnika kontekstu? | Plugin pamięci i kontekstu zależą od cyklu życia assemble, ingest, after-turn i Compaction.      |
| Jakie dane Compaction są ujawniane?    | Niektóre Plugin potrzebują tylko powiadomień, a inne metadanych kept/dropped.                       |
| Co jest celowo nieobsługiwane?         | Użytkownicy nie powinni zakładać równoważności z PI tam, gdzie natywny runtime ma większą własność stanu. |

Kontrakt wsparcia runtime Codex jest udokumentowany w
[Codex harness](/pl/plugins/codex-harness#v1-support-contract).

## Etykiety statusu

W danych wyjściowych statusu mogą pojawiać się etykiety `Execution` i `Runtime`. Czytaj je jako diagnostykę, a nie jako nazwy dostawców.

- Referencja modelu, taka jak `openai/gpt-5.5`, informuje o wybranym dostawcy/modelu.
- Identyfikator runtime, taki jak `codex`, informuje, która pętla wykonuje turę.
- Etykieta kanału, taka jak Telegram lub Discord, informuje, gdzie odbywa się rozmowa.

Jeśli sesja nadal pokazuje PI po zmianie konfiguracji runtime, rozpocznij nową sesję
przez `/new` albo wyczyść bieżącą przez `/reset`. Istniejące sesje zachowują swój
zapisany runtime, aby transkrypt nie był odtwarzany przez dwa niezgodne natywne
systemy sesji.

## Powiązane

- [Codex harness](/pl/plugins/codex-harness)
- [OpenAI](/pl/providers/openai)
- [Agent harness plugins](/pl/plugins/sdk-agent-harness)
- [Agent loop](/pl/concepts/agent-loop)
- [Models](/pl/concepts/models)
- [Status](/pl/cli/status)
