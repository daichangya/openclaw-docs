---
read_when:
    - Chcesz szybko zdiagnozować stan kanału + odbiorców ostatniej sesji
    - Chcesz mieć gotowy do wklejenia status „all” do debugowania
summary: Odwołanie do CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: status
x-i18n:
    generated_at: "2026-04-23T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostyka kanałów + sesji.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Uwagi:

- `--deep` uruchamia aktywne sondy (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` wyświetla znormalizowane okna użycia dostawcy jako `X% left`.
- Dane wyjściowe stanu sesji rozdzielają teraz `Runtime:` od `Runner:`. `Runtime` to ścieżka wykonania i stan sandboxa (`direct`, `docker/*`), natomiast `Runner` informuje, czy sesja używa osadzonego Pi, dostawcy opartego na CLI, czy backendu harness ACP, takiego jak `codex (acp/acpx)`.
- Surowe pola `usage_percent` / `usagePercent` w MiniMax oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbie mają pierwszeństwo, jeśli są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyprowadzają etykietę okna z sygnatur czasowych i zawierają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest uboga w dane, `/status` może uzupełnić liczniki tokenów i cache na podstawie najnowszego dziennika użycia transkryptu. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo przed wartościami uzupełnionymi z transkryptu.
- Uzupełnianie z transkryptu może też odzyskać etykietę aktywnego modelu runtime, gdy brakuje jej we wpisie aktywnej sesji. Jeśli ten model z transkryptu różni się od wybranego modelu, status ustala okno kontekstowe względem odzyskanego modelu runtime zamiast wybranego.
- Dla rozliczania rozmiaru promptu uzupełnianie z transkryptu preferuje większą sumę zorientowaną na prompt, gdy metadane sesji są nieobecne lub mniejsze, dzięki czemu sesje niestandardowych dostawców nie spadają do wyświetlania `0` tokenów.
- Dane wyjściowe obejmują magazyny sesji dla każdego agenta, gdy skonfigurowano wielu agentów.
- Przegląd obejmuje status instalacji/uruchomienia usługi hosta Gateway + Node, gdy jest dostępny.
- Przegląd obejmuje kanał aktualizacji + git SHA (dla checkoutów ze źródeł).
- Informacje o aktualizacji są widoczne w sekcji Overview; jeśli aktualizacja jest dostępna, status wyświetla wskazówkę, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/pl/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) w miarę możliwości rozwiązują obsługiwane SecretRefs dla docelowych ścieżek konfiguracji.
- Jeśli obsługiwany kanał SecretRef jest skonfigurowany, ale niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i zgłasza zdegradowane dane wyjściowe zamiast się wykrzaczyć. Dane czytelne dla człowieka pokazują ostrzeżenia, takie jak „configured token unavailable in this command path”, a dane wyjściowe JSON zawierają `secretDiagnostics`.
- Gdy rozwiązanie SecretRef lokalnie dla polecenia powiedzie się, status preferuje rozwiązaną migawkę i usuwa przejściowe znaczniki kanału „secret unavailable” z końcowych danych wyjściowych.
- `status --all` zawiera wiersz przeglądu Secrets oraz sekcję diagnozy, która podsumowuje diagnostykę sekretów (obciętą dla czytelności) bez zatrzymywania generowania raportu.
