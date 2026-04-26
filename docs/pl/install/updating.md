---
read_when:
    - Aktualizowanie OpenClaw
    - Coś psuje się po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródła) oraz strategia wycofania zmian
title: Aktualizacja
x-i18n:
    generated_at: "2026-04-26T11:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

Aktualizuj OpenClaw.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

```bash
openclaw update
```

Aby przełączyć kanały lub wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # podgląd bez zastosowania
```

`--channel beta` preferuje betę, ale runtime przechodzi awaryjnie do stable/latest, gdy
tag beta nie istnieje lub jest starszy od najnowszego stabilnego wydania. Użyj `--tag beta`,
jeśli chcesz użyć surowego npm dist-tag beta do jednorazowej aktualizacji pakietu.

Semantykę kanałów znajdziesz w [Kanały rozwojowe](/pl/install/development-channels).

## Przełączanie między instalacją npm a git

Użyj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, poświadczenia i workspace w `~/.openclaw`; zmienia tylko to,
której instalacji kodu OpenClaw używają CLI i gateway.

```bash
# instalacja pakietu npm -> edytowalny checkout git
openclaw update --channel dev

# checkout git -> instalacja pakietu npm
openclaw update --channel stable
```

Najpierw uruchom z `--dry-run`, aby zobaczyć dokładny podgląd przełączenia trybu instalacji:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kanał `dev` zapewnia checkout git, buduje go i instaluje globalne CLI
z tego checkoutu. Kanały `stable` i `beta` używają instalacji pakietowych. Jeśli
gateway jest już zainstalowany, `openclaw update` odświeża metadane usługi
i restartuje ją, chyba że przekażesz `--no-restart`.

## Alternatywa: uruchom ponownie instalator

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` lub
`--install-method npm --no-onboard`.

## Alternatywa: ręczne npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw uruchamia zwykłe
polecenie instalacji globalnej. Jeśli to polecenie zakończy się niepowodzeniem, OpenClaw
ponawia próbę raz z `--omit=optional`. To ponowienie pomaga na hostach, gdzie natywne
opcjonalne zależności nie mogą się skompilować, zachowując widoczność pierwotnego błędu, jeśli fallback również się nie powiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Globalne instalacje npm i zależności runtime

OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w runtime, nawet gdy
globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Zależności runtime
dołączonych Pluginów są przygotowywane w zapisywalnym katalogu runtime zamiast modyfikować
drzewo pakietu. Dzięki temu `openclaw update` nie ściga się z działającym gateway ani
lokalnym agentem, który w tym samym czasie naprawia zależności Pluginów.

Niektóre konfiguracje npm w Linux instalują pakiety globalne w katalogach należących do roota, takich
jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje ten układ przez tę samą zewnętrzną ścieżkę stagingu.

Dla utwardzonych jednostek systemd ustaw zapisywalny katalog stage, który jest uwzględniony w `ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jeśli `OPENCLAW_PLUGIN_STAGE_DIR` nie jest ustawione, OpenClaw używa `$STATE_DIRECTORY`, gdy
systemd go udostępnia, a następnie przechodzi awaryjnie do `~/.openclaw/plugin-runtime-deps`.
Krok naprawy traktuje ten stage jako lokalny root pakietów należący do OpenClaw i
ignoruje ustawienia prefix/global npm użytkownika, dzięki czemu konfiguracja npm dla instalacji globalnych nie
przekierowuje zależności dołączonych Pluginów do `~/node_modules` ani do globalnego drzewa pakietów.

Przed aktualizacjami pakietów i naprawami zależności runtime dołączonych Pluginów OpenClaw wykonuje
kontrolę wolnego miejsca na dysku dla docelowego wolumenu w trybie best-effort. Mała ilość miejsca generuje ostrzeżenie
z badaną ścieżką, ale nie blokuje aktualizacji, ponieważ kwoty systemu plików,
migawki i wolumeny sieciowe mogą się zmienić po sprawdzeniu. Rzeczywista instalacja npm,
kopiowanie i weryfikacja po instalacji pozostają autorytatywne.

### Zależności runtime dołączonych Pluginów

Instalacje pakietowe utrzymują zależności runtime dołączonych Pluginów poza drzewem pakietu tylko do odczytu. Przy starcie i podczas `openclaw doctor --fix` OpenClaw naprawia
zależności runtime tylko dla dołączonych Pluginów, które są aktywne w konfiguracji, aktywne
przez starszą konfigurację kanału lub włączone przez domyślny manifest bundle.
Sam utrwalony stan auth kanału nie wyzwala naprawy zależności runtime
przy starcie Gateway.

Jawne wyłączenie ma pierwszeństwo. Wyłączony Plugin lub kanał nie otrzymuje
naprawy zależności runtime tylko dlatego, że istnieje w pakiecie. Zewnętrzne
Pluginy i niestandardowe ścieżki ładowania nadal używają `openclaw plugins install` lub
`openclaw plugins update`.

## Autoaktualizator

Autoaktualizator jest domyślnie wyłączony. Włącz go w `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Channel  | Zachowanie                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Czeka `stableDelayHours`, a następnie stosuje z deterministycznym jitter w zakresie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                            |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                 |

Gateway zapisuje też wskazówkę aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje polityki DM i sprawdza kondycję gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

### Zrestartuj gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Wycofanie zmian

### Przypięcie wersji (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Wskazówka: `npm view openclaw version` pokazuje bieżącą opublikowaną wersję.

### Przypięcie commita (źródło)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do latest: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj dane wyjściowe.
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (lub ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install) — wszystkie metody instalacji
- [Doctor](/pl/gateway/doctor) — kontrole kondycji po aktualizacjach
- [Migracja](/pl/install/migrating) — przewodniki migracji głównych wersji
