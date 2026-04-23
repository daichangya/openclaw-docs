---
read_when:
    - Musisz lokalnie przechwytywać ruch transportowy OpenClaw do debugowania
    - Chcesz sprawdzać sesje debug proxy, bloby lub wbudowane presety zapytań
summary: Dokumentacja CLI dla `openclaw proxy`, lokalnego debug proxy i inspektora przechwyceń
title: proxy
x-i18n:
    generated_at: "2026-04-23T09:59:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Uruchamiaj lokalny jawny debug proxy i sprawdzaj przechwycony ruch.

To polecenie debugowania do badania na poziomie transportu. Może uruchomić
lokalny proxy, uruchomić polecenie podrzędne z włączonym przechwytywaniem, wyświetlić sesje
przechwytywania, wykonywać zapytania o typowe wzorce ruchu, odczytywać przechwycone bloby
i czyścić lokalne dane przechwytywania.

## Polecenia

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Presety zapytań

`openclaw proxy query --preset <name>` akceptuje:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Uwagi

- `start` domyślnie używa `127.0.0.1`, jeśli nie ustawiono `--host`.
- `run` uruchamia lokalny debug proxy, a następnie uruchamia polecenie po `--`.
- Przechwycenia to lokalne dane debugowania; po zakończeniu użyj `openclaw proxy purge`.
