---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres DM dla konfiguracji wieloużytkownikowych
    - Debugujesz codzienne lub bezczynne resetowanie sesji
summary: Jak OpenClaw zarządza sesjami rozmów
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-04-26T11:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organizuje rozmowy w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie tego, skąd pochodzi — DM, czaty grupowe, zadania Cron itp.

## Jak kierowane są wiadomości

| Źródło         | Zachowanie                |
| -------------- | ------------------------- |
| Wiadomości bezpośrednie | Domyślnie współdzielona sesja |
| Czaty grupowe  | Izolowane per grupa       |
| Pokoje/kanały  | Izolowane per pokój       |
| Zadania Cron   | Nowa sesja dla każdego uruchomienia |
| Webhooki       | Izolowane per hook        |

## Izolacja DM

Domyślnie wszystkie DM współdzielą jedną sesję dla zachowania ciągłości. To działa dobrze
w konfiguracjach jednoosobowych.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do Twojego agenta, włącz izolację DM. Bez tego wszyscy
użytkownicy współdzielą ten sam kontekst rozmowy — prywatne wiadomości Alice byłyby
widoczne dla Boba.
</Warning>

**Rozwiązanie:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // izolacja według kanału + nadawcy
  },
}
```

Inne opcje:

- `main` (domyślnie) — wszystkie DM współdzielą jedną sesję.
- `per-peer` — izolacja według nadawcy (między kanałami).
- `per-channel-peer` — izolacja według kanału + nadawcy (zalecane).
- `per-account-channel-peer` — izolacja według konta + kanału + nadawcy.

<Tip>
Jeśli ta sama osoba kontaktuje się z Tobą przez wiele kanałów, użyj
`session.identityLinks`, aby połączyć jej tożsamości tak, by współdzieliły jedną sesję.
</Tip>

Zweryfikuj konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są używane ponownie, dopóki nie wygasną:

- **Codzienny reset** (domyślnie) — nowa sesja o 4:00 czasu lokalnego na hoście
  gateway. Codzienna świeżość jest oparta na tym, kiedy rozpoczęło się bieżące `sessionId`, a nie
  na późniejszych zapisach metadanych.
- **Reset po bezczynności** (opcjonalny) — nowa sesja po okresie braku aktywności. Ustaw
  `session.reset.idleMinutes`. Świeżość bezczynności opiera się na ostatniej rzeczywistej
  interakcji użytkownika/kanału, więc zdarzenia systemowe Heartbeat, Cron i exec nie
  podtrzymują sesji.
- **Reset ręczny** — wpisz `/new` lub `/reset` na czacie. `/new <model>` również
  przełącza model.

Gdy skonfigurowane są jednocześnie codzienne resety i resety po bezczynności, wygrywa to, co wygaśnie wcześniej.
Tury zdarzeń systemowych Heartbeat, Cron, exec i innych mogą zapisywać metadane sesji,
ale te zapisy nie wydłużają świeżości codziennego resetu ani resetu po bezczynności. Gdy reset
przewinie sesję, zakolejkowane powiadomienia zdarzeń systemowych dla starej sesji są
odrzucane, aby nieaktualne aktualizacje w tle nie były dodawane na początek pierwszego promptu w
nowej sesji.

Sesje z aktywną sesją CLI należącą do dostawcy nie są przecinane przez domyślny niejawny codzienny reset.
Użyj `/reset` lub skonfiguruj `session.reset` jawnie, gdy takie sesje powinny wygasać według timera.

## Gdzie przechowywany jest stan

Cały stan sesji należy do **gateway**. Klienci UI pytają gateway o
dane sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypty:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` przechowuje oddzielne znaczniki czasu cyklu życia:

- `sessionStartedAt`: kiedy rozpoczęło się bieżące `sessionId`; używa tego codzienny reset.
- `lastInteractionAt`: ostatnia interakcja użytkownika/kanału, która wydłuża czas życia bezczynności.
- `updatedAt`: ostatnia mutacja wiersza magazynu; przydatna do listowania i przycinania, ale nie
  autorytatywna dla świeżości codziennego resetu/resetu po bezczynności.

Starsze wiersze bez `sessionStartedAt` są rozwiązywane z nagłówka sesji w transkrypcie JSONL,
gdy jest dostępny. Jeśli starszy wiersz nie ma także `lastInteractionAt`,
świeżość bezczynności używa fallback do czasu rozpoczęcia tej sesji, a nie do późniejszych zapisów technicznych.

## Utrzymanie sesji

OpenClaw automatycznie ogranicza rozmiar magazynu sesji w czasie. Domyślnie działa
w trybie `warn` (zgłasza, co zostałoby wyczyszczone). Ustaw `session.maintenance.mode`
na `"enforce"` dla automatycznego czyszczenia:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Podejrzyj wynik za pomocą `openclaw sessions cleanup --dry-run`.

## Sprawdzanie sesji

- `openclaw status` — ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` — wszystkie sesje (filtruj przez `--active <minutes>`).
- `/status` na czacie — użycie kontekstu, model i przełączniki.
- `/context list` — co znajduje się w system prompt.

## Dalsza lektura

- [Przycinanie sesji](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Narzędzia sesji](/pl/concepts/session-tool) — narzędzia agenta do pracy między sesjami
- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction) --
  schemat magazynu, transkrypty, polityka wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Wieloagentowość](/pl/concepts/multi-agent) — routing i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak praca odłączona tworzy rekordy zadań z odwołaniami do sesji
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji

## Powiązane

- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
