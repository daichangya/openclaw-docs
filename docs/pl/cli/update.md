---
read_when:
    - Chcesz bezpiecznie zaktualizować checkout źródłowy
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja CLI dla `openclaw update` (w miarę bezpieczna aktualizacja źródeł + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-04-26T11:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Bezpieczne aktualizowanie OpenClaw i przełączanie między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Updating](/pl/install/updating).

## Użycie

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opcje

- `--no-restart`: pomija restart usługi Gateway po pomyślnej aktualizacji. Aktualizacje przez menedżer pakietów, które restartują Gateway, weryfikują, że zrestartowana usługa raportuje oczekiwaną zaktualizowaną wersję, zanim polecenie zakończy się powodzeniem.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje docelowy pakiet tylko dla tej aktualizacji. Dla instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokazuje podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ restartu) bez zapisywania konfiguracji, instalowania, synchronizacji Plugin ani restartu.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji Plugin po aktualizacji
  zostanie wykryty dryf artefaktu Plugin npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800 s).
- `--yes`: pomija monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji)

Uwaga: obniżenia wersji wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.

## `update status`

Pokazuje aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisuje czytelny maszynowo JSON stanu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ do wyboru kanału aktualizacji i potwierdzenia, czy po aktualizacji
zrestartować Gateway (domyślnie następuje restart). Jeśli wybierzesz `dev` bez checkoutu git,
zostanie zaoferowane jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisanie przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy `beta`
  nie istnieje albo jest starsze niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) używa tej samej ścieżki aktualizacji.

W przypadku instalacji przez menedżer pakietów `openclaw update` rozwiązuje docelową wersję pakietu
przed wywołaniem menedżera pakietów. Nawet jeśli zainstalowana wersja
już odpowiada wersji docelowej, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację Plugin, odświeżenie uzupełnień i restart. Dzięki temu spakowane
sidecary oraz rekordy Plugin zarządzane przez kanały pozostają zgodne z zainstalowanym
buildem OpenClaw.

## Przepływ checkoutu git

Kanały:

- `stable`: checkout najnowszego tagu niebędącego beta, następnie build + doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable,
  gdy `beta` nie istnieje albo jest starsze.
- `dev`: checkout `main`, następnie `fetch` + `rebase`.

Na wysokim poziomie:

1. Wymaga czystego worktree (bez niezacommitowanych zmian).
2. Przełącza na wybrany kanał (tag albo gałąź).
3. Pobiera zmiany z upstream (`dev` tylko).
4. Tylko `dev`: sprawdzenie wstępne lint + build TypeScript w tymczasowym worktree; jeśli czubek gałęzi nie przejdzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszy build przechodzący bez błędów.
5. Wykonuje `rebase` na wybrany commit (`dev` tylko).
6. Instaluje zależności przy użyciu menedżera pakietów repozytorium. Dla checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, a potem przez tymczasowy fallback `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
7. Buduje oraz buduje Control UI.
8. Uruchamia `openclaw doctor` jako końcowe sprawdzenie „bezpiecznej aktualizacji”.
9. Synchronizuje Plugin z aktywnym kanałem (`dev` używa bundled Plugin; `stable`/`beta` używają npm) i aktualizuje Plugin zainstalowane przez npm.

Jeśli dokładnie przypięta aktualizacja Plugin npm rozwiąże się do artefaktu, którego integralność
różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację
artefaktu Plugin zamiast go instalować. Zainstaluj ponownie lub zaktualizuj Plugin
jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.

Błędy synchronizacji Plugin po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalsze działania związane z restartem. Napraw błąd instalacji/aktualizacji Plugin, a następnie uruchom ponownie
`openclaw update`.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześniej z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne w powłokach i skryptach uruchamiających).

## Powiązane

- `openclaw doctor` (oferuje najpierw uruchomienie aktualizacji dla checkoutów git)
- [Development channels](/pl/install/development-channels)
- [Updating](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
