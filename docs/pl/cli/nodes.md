---
read_when:
    - Zarządzasz sparowanymi Node'ami (kamerami, ekranem, canvas)
    - Musisz zatwierdzać żądania lub wywoływać polecenia Nodeów
summary: Dokumentacja CLI dla `openclaw nodes` (status, pairing, invoke, kamera/canvas/ekran)
title: Node'y
x-i18n:
    generated_at: "2026-04-25T13:44:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Zarządzaj sparowanymi Node'ami (urządzeniami) i wywołuj możliwości Node'ów.

Powiązane:

- Przegląd Node'ów: [Nodes](/pl/nodes)
- Kamera: [Node'y kamery](/pl/nodes/camera)
- Obrazy: [Node'y obrazów](/pl/nodes/images)

Typowe opcje:

- `--url`, `--token`, `--timeout`, `--json`

## Typowe polecenia

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` wypisuje tabele oczekujących/sparowanych. Sparowane wiersze zawierają wiek ostatniego połączenia (Last Connect).
Użyj `--connected`, aby pokazać tylko aktualnie połączone Node'y. Użyj `--last-connected <duration>`, aby
filtrować do Node'ów, które połączyły się w zadanym czasie (np. `24h`, `7d`).

Uwaga dotycząca zatwierdzania:

- `openclaw nodes pending` wymaga tylko zakresu pairing.
- `gateway.nodes.pairing.autoApproveCidrs` może pominąć etap oczekiwania tylko dla
  jawnie zaufanego, pierwszorazowego pairingu urządzenia `role: node`. Domyślnie jest wyłączone
  i nie zatwierdza aktualizacji.
- `openclaw nodes approve <requestId>` dziedziczy dodatkowe wymagania zakresu z
  oczekującego żądania:
  - żądanie bez polecenia: tylko pairing
  - polecenia Node bez `exec`: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flagi invoke:

- `--params <json>`: ciąg obiektu JSON (domyślnie `{}`).
- `--invoke-timeout <ms>`: limit czasu wywołania Node (domyślnie `15000`).
- `--idempotency-key <key>`: opcjonalny klucz idempotencji.
- `system.run` i `system.run.prepare` są tutaj blokowane; do wykonywania poleceń powłoki użyj narzędzia `exec` z `host=node`.

Do wykonywania poleceń powłoki na Node używaj narzędzia `exec` z `host=node` zamiast `openclaw nodes run`.
CLI `nodes` jest teraz ukierunkowane na możliwości: bezpośrednie RPC przez `nodes invoke`, a także pairing, kamerę,
ekran, lokalizację, canvas i powiadomienia.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Nodes](/pl/nodes)
