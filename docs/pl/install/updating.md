---
read_when:
    - Aktualizowanie OpenClaw
    - Coś psuje się po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofania zmian
title: Aktualizowanie
x-i18n:
    generated_at: "2026-04-25T13:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Aktualizuj OpenClaw na bieżąco.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

```bash
openclaw update
```

Aby przełączyć kanał lub wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # podgląd bez zastosowania
```

`--channel beta` preferuje beta, ale środowisko wykonawcze wraca do stable/latest, gdy
tag beta nie istnieje albo jest starszy niż najnowsze stabilne wydanie. Użyj `--tag beta`,
jeśli chcesz użyć surowego npm dist-tag beta do jednorazowej aktualizacji pakietu.

Semantyka kanałów: [Development channels](/pl/install/development-channels).

## Alternatywa: uruchom instalator ponownie

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Dla instalacji ze źródeł przekaż `--install-method git --no-onboard`.

## Alternatywa: ręcznie przez npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Globalne instalacje npm i zależności wykonawcze

OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w środowisku wykonawczym, nawet gdy
globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Zależności wykonawcze dołączonych Plugin
są przygotowywane w zapisywalnym katalogu runtime zamiast modyfikować drzewo
pakietu. Dzięki temu `openclaw update` nie ściga się z działającym gateway ani
lokalnym agentem, który naprawia zależności Plugin podczas tej samej instalacji.

Niektóre konfiguracje npm w Linuksie instalują pakiety globalne pod katalogami należącymi do root,
takimi jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje ten układ przez
tę samą zewnętrzną ścieżkę stagingu.

Dla utwardzonych jednostek systemd ustaw zapisywalny katalog stagingu uwzględniony w
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jeśli `OPENCLAW_PLUGIN_STAGE_DIR` nie jest ustawione, OpenClaw używa `$STATE_DIRECTORY`, gdy
udostępnia go systemd, a następnie wraca do `~/.openclaw/plugin-runtime-deps`.

### Zależności wykonawcze dołączonych Plugin

Spakowane instalacje utrzymują zależności wykonawcze dołączonych Plugin poza drzewem pakietu tylko do odczytu. Przy starcie i podczas `openclaw doctor --fix` OpenClaw naprawia
zależności wykonawcze tylko dla dołączonych Plugin, które są aktywne w konfiguracji, aktywne
przez starszą konfigurację kanału lub włączone przez domyślne ustawienie dołączonego manifestu.

Jawne wyłączenie ma pierwszeństwo. Wyłączony Plugin lub kanał nie dostaje
naprawy zależności wykonawczych tylko dlatego, że istnieje w pakiecie. Zewnętrzne
Pluginy i niestandardowe ścieżki ładowania nadal używają `openclaw plugins install` lub
`openclaw plugins update`.

## Auto-updater

Auto-updater jest domyślnie wyłączony. Włącz go w `~/.openclaw/openclaw.json`:

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

| Kanał    | Zachowanie                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Czeka `stableDelayHours`, a następnie stosuje z deterministycznym jitterem w zakresie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                         |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                              |

Gateway zapisuje też wskazówkę o aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje polityki DM i sprawdza stan gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

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

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Wskazówka: `npm view openclaw version` pokazuje bieżącą opublikowaną wersję.

### Przypnij commit (źródła)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj wynik.
- Dla `openclaw update --channel dev` w checkoutach źródeł aktualizator automatycznie bootstrapuje `pnpm`, gdy to potrzebne. Jeśli widzisz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (lub ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Troubleshooting](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Install Overview](/pl/install) — wszystkie metody instalacji
- [Doctor](/pl/gateway/doctor) — kontrole stanu po aktualizacjach
- [Migrating](/pl/install/migrating) — przewodniki migracji głównych wersji
