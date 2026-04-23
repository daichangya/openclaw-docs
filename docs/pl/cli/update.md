---
read_when:
    - Chcesz bezpiecznie zaktualizować checkout źródła
    - Musisz zrozumieć skrócone zachowanie `--update`
summary: Dokumentacja CLI dla `openclaw update` (w miarę bezpieczna aktualizacja źródła + automatyczne ponowne uruchamianie Gateway)
title: aktualizacja
x-i18n:
    generated_at: "2026-04-23T09:59:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizowanie](/pl/install/updating).

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

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po pomyślnej aktualizacji.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokaż podgląd planowanych działań aktualizacji (przepływ kanału/tagu/celu/ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizacji pluginów ani ponownego uruchamiania.
- `--json`: wypisz czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji pluginów po aktualizacji
  zostanie wykryty dryf artefaktów pluginów npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1200 s).
- `--yes`: pomiń monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji)

Uwaga: obniżenie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.

## `update status`

Pokaż aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisz czytelny maszynowo JSON stanu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy po aktualizacji ponownie uruchomić Gateway
(domyślnie następuje ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
otrzymasz propozycję jego utworzenia.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1200`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisanie przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje znacznik dist-tag npm `beta`, ale wraca do `latest`, gdy wersja beta
  nie istnieje lub jest starsza niż bieżąca wersja stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) używa tej samej ścieżki aktualizacji.

W przypadku instalacji przez menedżer pakietów `openclaw update` rozpoznaje docelową wersję pakietu
przed wywołaniem menedżera pakietów. Jeśli zainstalowana wersja dokładnie
odpowiada wersji docelowej i nie trzeba zapisywać zmiany kanału aktualizacji,
polecenie kończy się jako pominięte przed instalacją pakietu, synchronizacją pluginów, odświeżaniem ukończeń
lub ponownym uruchamianiem gateway.

## Przepływ checkoutu git

Kanały:

- `stable`: przełącza na najnowszy tag niebędący wersją beta, a następnie wykonuje build + doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable,
  gdy wersja beta nie istnieje lub jest starsza.
- `dev`: przełącza na `main`, a następnie wykonuje fetch + rebase.

W skrócie:

1. Wymaga czystego worktree (bez niezacommitowanych zmian).
2. Przełącza na wybrany kanał (tag lub gałąź).
3. Pobiera upstream (tylko dev).
4. Tylko dev: wykonuje wstępne lint + build TypeScript w tymczasowym worktree; jeśli tip kończy się niepowodzeniem, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszy poprawny build.
5. Rebase na wybrany commit (tylko dev).
6. Instaluje zależności przy użyciu menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator uruchamia `pnpm` na żądanie (najpierw przez `corepack`, a potem zapasowo przez tymczasowe `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
7. Wykonuje build + build interfejsu Control UI.
8. Uruchamia `openclaw doctor` jako końcowy test „bezpiecznej aktualizacji”.
9. Synchronizuje pluginy z aktywnym kanałem (dev używa dołączonych pluginów; stable/beta używają npm) i aktualizuje pluginy zainstalowane przez npm.

Jeśli aktualizacja dokładnie przypiętego pluginu npm prowadzi do artefaktu, którego integralność
różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację
tego artefaktu pluginu zamiast go instalować. Zainstaluj ponownie lub zaktualizuj plugin
jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.

Jeśli uruchomienie pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześniej z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Zobacz także

- `openclaw doctor` (proponuje najpierw uruchomić aktualizację dla checkoutów git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
