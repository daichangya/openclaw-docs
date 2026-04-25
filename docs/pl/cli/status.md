---
read_when:
    - Chcesz szybkiej diagnozy stanu kanałów i ostatnich odbiorców sesji
    - Chcesz gotowy do wklejenia status „all” do debugowania
summary: Dokumentacja CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: Status
x-i18n:
    generated_at: "2026-04-25T13:44:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostyka kanałów i sesji.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Uwagi:

- `--deep` uruchamia sondy na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` wypisuje znormalizowane okna użycia dostawców jako `X% left`.
- Dane wyjściowe statusu sesji rozdzielają `Execution:` od `Runtime:`. `Execution` to ścieżka sandboxa (`direct`, `docker/*`), natomiast `Runtime` informuje, czy sesja używa `OpenClaw Pi Default`, `OpenAI Codex`, backendu CLI czy backendu ACP, takiego jak `codex (acp/acpx)`. Zobacz [Agent runtimes](/pl/concepts/agent-runtimes), aby poznać rozróżnienie między dostawcą/modelem/środowiskiem wykonawczym.
- Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo, gdy są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, wyprowadzają etykietę okna z znaczników czasu, gdy to potrzebne, i zawierają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest uboga, `/status` może uzupełnić liczniki tokenów i cache z najnowszego logu użycia transkryptu. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo przed wartościami awaryjnymi z transkryptu.
- Awaryjne dane z transkryptu mogą również odzyskać etykietę aktywnego modelu środowiska wykonawczego, gdy brakuje jej w wpisie bieżącej sesji. Jeśli ten model z transkryptu różni się od wybranego modelu, status rozwiązuje okno kontekstowe względem odzyskanego modelu środowiska wykonawczego, a nie wybranego.
- Dla rozliczania rozmiaru promptu awaryjne dane z transkryptu preferują większą sumę zorientowaną na prompt, gdy brakuje metadanych sesji lub są mniejsze, dzięki czemu sesje niestandardowych dostawców nie spadają do wyświetlania `0` tokenów.
- Dane wyjściowe zawierają magazyny sesji per agent, gdy skonfigurowano wielu agentów.
- Przegląd zawiera status instalacji/środowiska wykonawczego usługi hosta Gateway i Node, gdy jest dostępny.
- Przegląd zawiera kanał aktualizacji i SHA git (dla checkoutów źródeł).
- Informacje o aktualizacjach pojawiają się w Przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje wskazówkę, aby uruchomić `openclaw update` (zobacz [Updating](/pl/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) rozwiązują obsługiwane SecretRef dla wskazanych ścieżek konfiguracji, gdy to możliwe.
- Jeśli obsługiwany kanał SecretRef jest skonfigurowany, ale niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i zgłasza zdegradowane dane wyjściowe zamiast się zawieszać. Dane dla ludzi pokazują ostrzeżenia takie jak „configured token unavailable in this command path”, a dane JSON zawierają `secretDiagnostics`.
- Gdy rozwiązywanie SecretRef lokalnie dla polecenia powiedzie się, status preferuje rozwiązaną migawkę i usuwa przejściowe znaczniki kanału „secret unavailable” z końcowego wyjścia.
- `status --all` zawiera wiersz przeglądu sekretów oraz sekcję diagnozy, która podsumowuje diagnostykę sekretów (obciętą dla czytelności) bez zatrzymywania generowania raportu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
