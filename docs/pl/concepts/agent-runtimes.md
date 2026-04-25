---
read_when:
    - Wybierasz między PI, Codex, ACP lub innym natywnym runtime’em agenta.
    - Masz wątpliwości co do etykiet dostawca/model/runtime w statusie lub konfiguracji.
    - Dokumentujesz zgodność obsługi dla natywnej wiązki.
summary: Jak OpenClaw oddziela dostawców modeli, modele, kanały i runtime’y agentów
title: Runtime’y agentów
x-i18n:
    generated_at: "2026-04-25T13:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f492209da2334361060f0827c243d5d845744be906db9ef116ea00384879b33
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

**Runtime agenta** to komponent, który obsługuje jedną przygotowaną pętlę modelu: otrzymuje prompt, steruje wyjściem modelu, obsługuje natywne wywołania narzędzi i zwraca zakończoną turę do OpenClaw.

Runtime’y łatwo pomylić z dostawcami, ponieważ oba pojawiają się w pobliżu konfiguracji modelu. To różne warstwy:

| Warstwa        | Przykłady                             | Co to oznacza                                                     |
| -------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Dostawca       | `openai`, `anthropic`, `openai-codex` | Jak OpenClaw uwierzytelnia, wykrywa modele i nazywa referencje modeli. |
| Model          | `gpt-5.5`, `claude-opus-4-6`          | Model wybrany dla tury agenta.                                    |
| Runtime agenta | `pi`, `codex`, runtime’y oparte na ACP | Niskopoziomowa pętla wykonująca przygotowaną turę.                |
| Kanał          | Telegram, Discord, Slack, WhatsApp    | Miejsce, przez które wiadomości wchodzą do OpenClaw i je opuszczają. |

W kodzie i konfiguracji zobaczysz też słowo **harness**. Harness to implementacja dostarczająca runtime agenta. Na przykład dołączony harness Codex implementuje runtime `codex`. Klucz konfiguracji nadal nazywa się `embeddedHarness` ze względów zgodności, ale dokumentacja skierowana do użytkownika i dane wyjściowe statusu powinny ogólnie używać określenia runtime.

Typowa konfiguracja Codex używa dostawcy `openai` z runtime’em `codex`:

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
}
```

Oznacza to, że OpenClaw wybiera referencję modelu OpenAI, a następnie prosi runtime serwera aplikacji Codex o uruchomienie osadzonej tury agenta. Nie oznacza to, że kanał, katalog dostawców modeli ani magazyn sesji OpenClaw stają się Codex.

Informacje o podziale prefiksów rodziny OpenAI znajdziesz w [OpenAI](/pl/providers/openai) i [Dostawcy modeli](/pl/concepts/model-providers). Informacje o kontrakcie obsługi runtime’u Codex znajdziesz w [Harness Codex](/pl/plugins/codex-harness#v1-support-contract).

## Własność runtime’u

Różne runtime’y obsługują różną część pętli.

| Powierzchnia                 | Osadzony PI OpenClaw                     | Serwer aplikacji Codex                                                     |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Właściciel pętli modelu      | OpenClaw przez osadzony runner PI        | Serwer aplikacji Codex                                                     |
| Kanoniczny stan wątku        | Transkrypt OpenClaw                      | Wątek Codex oraz lustrzana kopia transkryptu OpenClaw                      |
| Dynamiczne narzędzia OpenClaw | Natywna pętla narzędzi OpenClaw         | Mostkowane przez adapter Codex                                             |
| Natywne narzędzia shell i plików | Ścieżka PI/OpenClaw                  | Narzędzia natywne Codex, mostkowane przez natywne hooki tam, gdzie są obsługiwane |
| Silnik kontekstu             | Natywne składanie kontekstu OpenClaw     | Kontekst składany przez projekty OpenClaw do tury Codex                    |
| Compaction                   | OpenClaw lub wybrany silnik kontekstu    | Natywny Compaction Codex z powiadomieniami OpenClaw i utrzymaniem lustrzanej kopii |
| Dostarczanie przez kanał     | OpenClaw                                 | OpenClaw                                                                   |

Ten podział własności to główna zasada projektowa:

- Jeśli właścicielem powierzchni jest OpenClaw, OpenClaw może zapewnić normalne działanie hooków Pluginów.
- Jeśli właścicielem powierzchni jest natywny runtime, OpenClaw potrzebuje zdarzeń runtime’u lub natywnych hooków.
- Jeśli natywny runtime jest właścicielem kanonicznego stanu wątku, OpenClaw powinien odzwierciedlać i rzutować kontekst, a nie przepisywać nieobsługiwane elementy wewnętrzne.

## Wybór runtime’u

OpenClaw wybiera osadzony runtime po rozpoznaniu dostawcy i modelu:

1. Pierwszeństwo ma runtime zapisany dla sesji. Zmiany konfiguracji nie przełączają na gorąco istniejącego transkryptu do innego natywnego systemu wątków.
2. `OPENCLAW_AGENT_RUNTIME=<id>` wymusza ten runtime dla nowych lub zresetowanych sesji.
3. `agents.defaults.embeddedHarness.runtime` lub
   `agents.list[].embeddedHarness.runtime` mogą ustawić `auto`, `pi` lub zarejestrowany identyfikator runtime’u, taki jak `codex`.
4. W trybie `auto` zarejestrowane runtime’y Pluginów mogą przejmować obsługę wspieranych par dostawca/model.
5. Jeśli żaden runtime nie przejmie tury w trybie `auto`, a ustawione jest `fallback: "pi"` (domyślnie), OpenClaw używa PI jako zgodnościowego fallbacku. Ustaw
   `fallback: "none"`, aby niepasujący wybór w trybie `auto` kończył się błędem.

Jawne runtime’y Pluginów domyślnie kończą się zamkniętym błędem. Na przykład
`runtime: "codex"` oznacza Codex albo wyraźny błąd wyboru, chyba że ustawisz
`fallback: "pi"` w tym samym zakresie nadpisania. Nadpisanie runtime’u nie dziedziczy szerszego ustawienia fallback, więc `runtime: "codex"` na poziomie agenta nie zostanie po cichu przekierowane z powrotem do PI tylko dlatego, że ustawienia domyślne używały `fallback: "pi"`.

## Kontrakt zgodności

Gdy runtime nie jest PI, powinien dokumentować, które powierzchnie OpenClaw obsługuje.
W dokumentacji runtime’u używaj tej struktury:

| Pytanie                               | Dlaczego to ma znaczenie                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Kto jest właścicielem pętli modelu?   | Określa, gdzie odbywają się ponowienia, kontynuacja narzędzi i decyzje o końcowej odpowiedzi. |
| Kto jest właścicielem kanonicznej historii wątku? | Określa, czy OpenClaw może edytować historię, czy tylko ją odzwierciedlać.         |
| Czy działają dynamiczne narzędzia OpenClaw? | Wiadomości, sesje, Cron i narzędzia należące do OpenClaw od tego zależą.               |
| Czy działają hooki dynamicznych narzędzi? | Pluginy oczekują `before_tool_call`, `after_tool_call` i middleware wokół narzędzi należących do OpenClaw. |
| Czy działają hooki natywnych narzędzi? | Shell, patch i narzędzia należące do runtime’u wymagają natywnej obsługi hooków dla zasad i obserwacji. |
| Czy uruchamia się cykl życia silnika kontekstu? | Pluginy pamięci i kontekstu zależą od cyklu życia assemble, ingest, after-turn i Compaction. |
| Jakie dane Compaction są ujawniane?   | Niektóre Pluginy potrzebują tylko powiadomień, a inne także metadanych kept/dropped.          |
| Co jest celowo nieobsługiwane?        | Użytkownicy nie powinni zakładać równoważności z PI tam, gdzie natywny runtime posiada więcej stanu. |

Kontrakt obsługi runtime’u Codex jest udokumentowany w
[Harness Codex](/pl/plugins/codex-harness#v1-support-contract).

## Etykiety statusu

Dane wyjściowe statusu mogą pokazywać etykiety `Execution` i `Runtime`. Traktuj je jako diagnostykę, a nie nazwy dostawców.

- Referencja modelu taka jak `openai/gpt-5.5` mówi, jaki dostawca/model został wybrany.
- Identyfikator runtime’u taki jak `codex` mówi, która pętla wykonuje turę.
- Etykieta kanału taka jak Telegram lub Discord mówi, gdzie odbywa się konwersacja.

Jeśli sesja nadal pokazuje PI po zmianie konfiguracji runtime’u, rozpocznij nową sesję
przez `/new` lub wyczyść bieżącą przez `/reset`. Istniejące sesje zachowują zapisany runtime, aby transkrypt nie był odtwarzany przez dwa niezgodne natywne systemy sesji.

## Powiązane

- [Harness Codex](/pl/plugins/codex-harness)
- [OpenAI](/pl/providers/openai)
- [Pluginy harness agenta](/pl/plugins/sdk-agent-harness)
- [Pętla agenta](/pl/concepts/agent-loop)
- [Modele](/pl/concepts/models)
- [Status](/pl/cli/status)
