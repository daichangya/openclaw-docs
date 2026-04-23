---
read_when:
    - Chcesz zrozumieć trasowanie i izolację sesji
    - Chcesz skonfigurować zakres DM dla konfiguracji wieloużytkownikowych
summary: Jak OpenClaw zarządza sesjami rozmów
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-04-23T10:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Zarządzanie sesjami

OpenClaw organizuje rozmowy w **sesje**. Każda wiadomość jest kierowana do
sesji na podstawie miejsca pochodzenia — DM, czaty grupowe, zadania cron itp.

## Jak trasowane są wiadomości

| Źródło           | Zachowanie                |
| ---------------- | ------------------------- |
| Wiadomości bezpośrednie | Współdzielona sesja domyślnie |
| Czaty grupowe    | Izolowane per grupa       |
| Pokoje/kanały    | Izolowane per pokój       |
| Zadania cron     | Świeża sesja dla każdego uruchomienia |
| Webhooki         | Izolowane per hook        |

## Izolacja DM

Domyślnie wszystkie DM współdzielą jedną sesję dla ciągłości. To sprawdza się
w konfiguracjach jednoosobowych.

<Warning>
Jeśli wiele osób może wysyłać wiadomości do Twojego agenta, włącz izolację DM. Bez tego wszyscy
użytkownicy współdzielą ten sam kontekst rozmowy — prywatne wiadomości Alicji byłyby
widoczne dla Boba.
</Warning>

**Rozwiązanie:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
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
`session.identityLinks`, aby powiązać jej tożsamości, tak aby współdzieliły jedną sesję.
</Tip>

Zweryfikuj konfigurację za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są ponownie używane do momentu wygaśnięcia:

- **Codzienny reset** (domyślnie) — nowa sesja o 4:00 czasu lokalnego na hoście
  gateway.
- **Reset po bezczynności** (opcjonalny) — nowa sesja po okresie braku aktywności. Ustaw
  `session.reset.idleMinutes`.
- **Reset ręczny** — wpisz `/new` lub `/reset` na czacie. `/new <model>` także
  przełącza model.

Gdy skonfigurowano jednocześnie codzienne i bezczynnościowe resety, wygrywa to,
które wygaśnie wcześniej.

Sesje z aktywną sesją CLI należącą do providera nie są odcinane przez niejawną
domyślną zmianę dzienną. Użyj `/reset` albo jawnie skonfiguruj `session.reset`, gdy takie
sesje powinny wygasać według timera.

## Gdzie znajduje się stan

Cały stan sesji należy do **gateway**. Klienci UI odpytyją gateway o dane
sesji.

- **Magazyn:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrypty:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Konserwacja sesji

OpenClaw automatycznie z czasem ogranicza rozmiar magazynu sesji. Domyślnie działa
w trybie `warn` (raportuje, co zostałoby wyczyszczone). Ustaw `session.maintenance.mode`
na `"enforce"`, aby włączyć automatyczne czyszczenie:

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

Podejrzyj działanie przez `openclaw sessions cleanup --dry-run`.

## Inspekcja sesji

- `openclaw status` — ścieżka magazynu sesji i ostatnia aktywność.
- `openclaw sessions --json` — wszystkie sesje (filtruj przez `--active <minutes>`).
- `/status` na czacie — użycie kontekstu, model i przełączniki.
- `/context list` — co znajduje się w prompcie systemowym.

## Dalsza lektura

- [Przycinanie sesji](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich rozmów
- [Narzędzia sesji](/pl/concepts/session-tool) — narzędzia agenta do pracy między sesjami
- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction) —
  schemat magazynu, transkrypty, polityka wysyłania, metadane pochodzenia i konfiguracja zaawansowana
- [Multi-Agent](/pl/concepts/multi-agent) — trasowanie i izolacja sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — jak praca odłączona tworzy rekordy zadań z odwołaniami do sesji
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości przychodzące są kierowane do sesji
