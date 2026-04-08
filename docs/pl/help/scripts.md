---
read_when:
    - Uruchamianie skryptów z repozytorium
    - Dodawanie lub zmienianie skryptów w `./scripts`
summary: 'Skrypty repozytorium: przeznaczenie, zakres i uwagi dotyczące bezpieczeństwa'
title: Skrypty
x-i18n:
    generated_at: "2026-04-08T02:14:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecf1e9327929948fb75f80e306963af49b353c0aa8d3b6fa532ca964ff8b975
    source_path: help/scripts.md
    workflow: 15
---

# Skrypty

Katalog `scripts/` zawiera skrypty pomocnicze do lokalnych przepływów pracy i zadań operacyjnych.
Używaj ich, gdy zadanie jest wyraźnie powiązane ze skryptem; w przeciwnym razie preferuj CLI.

## Konwencje

- Skrypty są **opcjonalne**, chyba że odwołuje się do nich dokumentacja lub checklisty wydania.
- Preferuj powierzchnie CLI, gdy istnieją (przykład: monitorowanie uwierzytelniania używa `openclaw models status --check`).
- Zakładaj, że skrypty są specyficzne dla hosta; przeczytaj je przed uruchomieniem na nowej maszynie.

## Skrypty monitorowania uwierzytelniania

Monitorowanie uwierzytelniania opisano w [Uwierzytelnianie](/pl/gateway/authentication). Skrypty w `scripts/` to opcjonalne dodatki do przepływów pracy systemd/Termux na telefonie.

## Pomocnik odczytu GitHub

Użyj `scripts/gh-read`, gdy chcesz, aby `gh` używało tokenu instalacji GitHub App do wywołań odczytu ograniczonych do repozytorium, pozostawiając zwykłe `gh` na twoim osobistym loginie do działań zapisu.

Wymagane zmienne środowiskowe:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, gdy chcesz pominąć wyszukiwanie instalacji na podstawie repozytorium
- `OPENCLAW_GH_READ_PERMISSIONS` jako rozdzielane przecinkami zastąpienie podzbioru uprawnień odczytu do zażądania

Kolejność rozwiązywania repozytorium:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Przykłady:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Podczas dodawania skryptów

- Zachowuj skupienie skryptów i dokumentuj je.
- Dodaj krótki wpis w odpowiednim dokumencie (lub utwórz go, jeśli go brakuje).
