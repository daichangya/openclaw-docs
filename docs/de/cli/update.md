---
read_when:
    - Sie möchten einen Source-Checkout sicher aktualisieren.
    - Sie müssen das Kurzform-Verhalten von `--update` verstehen.
summary: CLI-Referenz für `openclaw update` (vergleichsweise sicheres Source-Update + automatischer Gateway-Neustart)
title: update
x-i18n:
    generated_at: "2026-04-23T14:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen stable-/beta-/dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine git-Metadaten),
erfolgen Updates über den Package-Manager-Ablauf in [Updating](/de/install/updating).

## Verwendung

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

## Optionen

- `--no-restart`: Neustart des Gateway-Dienstes nach einem erfolgreichen Update überspringen.
- `--channel <stable|beta|dev>`: den Update-Kanal festlegen (git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: das Package-Ziel nur für dieses Update überschreiben. Bei Package-Installationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: geplante Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) vorab anzeigen, ohne Konfiguration zu schreiben, zu installieren, Plugin zu synchronisieren oder neu zu starten.
- `--json`: maschinenlesbares `UpdateRunResult`-JSON ausgeben, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Plugin-Synchronisierung nach dem Update
  eine Abweichung von npm-Plugin-Artefakten erkannt wird.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1200s).
- `--yes`: Bestätigungsabfragen überspringen (zum Beispiel die Bestätigung einer Herabstufung)

Hinweis: Herabstufungen erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.

## `update status`

Den aktiven Update-Kanal + git-Tag/Branch/SHA (für Source-Checkouts) sowie die Update-Verfügbarkeit anzeigen.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: maschinenlesbares Status-JSON ausgeben.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3s).

## `update wizard`

Interaktiver Ablauf zum Auswählen eines Update-Kanals und zur Bestätigung, ob das Gateway
nach dem Update neu gestartet werden soll (Standard ist ein Neustart). Wenn Sie `dev` ohne git-Checkout auswählen,
wird angeboten, eines zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1200`)

## Was der Befehl tut

Wenn Sie Kanäle explizit wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode abgestimmt:

- `dev` → stellt ein git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert es und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt das npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn `beta`
  fehlt oder älter als die aktuelle stable-Version ist.

Der Core-Auto-Updater des Gateway (wenn per Konfiguration aktiviert) verwendet denselben Update-Pfad wieder.

Bei Package-Manager-Installationen löst `openclaw update` die Ziel-Package-
Version auf, bevor der Package-Manager aufgerufen wird. Wenn die installierte Version exakt
mit der Zielversion übereinstimmt und keine Änderung des Update-Kanals gespeichert werden muss, wird der
Befehl als übersprungen beendet, bevor Package-Installation, Plugin-Synchronisierung, Aktualisierung der Completion
oder Gateway-Neustart ausgeführt werden.

## git-Checkout-Ablauf

Kanäle:

- `stable`: das neueste Nicht-Beta-Tag auschecken, dann bauen + `doctor`.
- `beta`: bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste stable-Tag
  zurück, wenn `beta` fehlt oder älter ist.
- `dev`: `main` auschecken, dann abrufen + rebasen.

Überblick:

1. Erfordert einen sauberen Worktree (keine nicht committeten Änderungen).
2. Wechselt auf den ausgewählten Kanal (Tag oder Branch).
3. Holt Upstream-Änderungen ab (nur dev).
4. Nur dev: Preflight-Lint + TypeScript-Build in einem temporären Worktree; wenn die Spitze fehlschlägt, geht der Vorgang bis zu 10 Commits zurück, um den neuesten sauberen Build zu finden.
5. Rebased auf den ausgewählten Commit (nur dev).
6. Installiert Abhängigkeiten mit dem Package-Manager des Repo. Bei pnpm-Checkouts bootstrapped der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann mit einem temporären Fallback `npm install pnpm@10`), statt `npm run build` innerhalb eines pnpm-Workspace auszuführen.
7. Baut und baut die Control UI.
8. Führt `openclaw doctor` als abschließende Prüfung für ein „sicheres Update“ aus.
9. Synchronisiert Plugin mit dem aktiven Kanal (dev verwendet gebündelte Plugin; stable/beta verwenden npm) und aktualisiert über npm installierte Plugin.

Wenn ein exaktes gepinntes npm-Plugin-Update zu einem Artefakt aufgelöst wird, dessen Integrität
vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` dieses Plugin-
Artefakt-Update ab, anstatt es zu installieren. Installieren Sie das Plugin neu oder aktualisieren Sie es nur dann explizit,
wenn Sie geprüft haben, dass Sie dem neuen Artefakt vertrauen.

Wenn das pnpm-Bootstrap weiterhin fehlschlägt, stoppt der Updater jetzt früh mit einem Package-Manager-spezifischen Fehler, statt `npm run build` innerhalb des Checkouts zu versuchen.

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Siehe auch

- `openclaw doctor` (bietet an, auf git-Checkouts zuerst ein Update auszuführen)
- [Development channels](/de/install/development-channels)
- [Updating](/de/install/updating)
- [CLI reference](/de/cli)
