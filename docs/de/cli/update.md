---
read_when:
    - Sie einen Source-Checkout sicher aktualisieren möchten
    - Sie das Kurzverhalten von `--update` verstehen müssen
summary: CLI-Referenz für `openclaw update` (relativ sicheres Quell-Update + automatischer Gateway-Neustart)
title: update
x-i18n:
    generated_at: "2026-04-05T12:39:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen den Kanälen stable/beta/dev wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Updates über den Paketmanager-Ablauf unter [Aktualisieren](/install/updating).

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

- `--no-restart`: Neustart des Gateway-Dienstes nach einer erfolgreichen Aktualisierung überspringen.
- `--channel <stable|beta|dev>`: den Update-Kanal festlegen (git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: das Paketziel nur für dieses Update überschreiben. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: geplante Update-Aktionen (Kanal/Tag/Ziel/Neustart-Ablauf) als Vorschau anzeigen, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: maschinenlesbares `UpdateRunResult`-JSON ausgeben.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1200 s).
- `--yes`: Bestätigungsabfragen überspringen (zum Beispiel die Bestätigung einer Herabstufung)

Hinweis: Herabstufungen erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.

## `update status`

Den aktiven Update-Kanal + Git-Tag/Branch/SHA (für Source-Checkouts) sowie die Update-Verfügbarkeit anzeigen.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: maschinenlesbares Status-JSON ausgeben.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3 s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Update-Kanals und zur Bestätigung, ob das Gateway
nach dem Update neu gestartet werden soll (Standard ist ein Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, eines zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Update-Schritt (Standard `1200`)

## Was es tut

Wenn Sie explizit den Kanal wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode abgestimmt:

- `dev` → stellt ein Git-Checkout sicher (Standard: `~/openclaw`, Überschreibung mit `OPENCLAW_GIT_DIR`),
  aktualisiert es und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt das npm-dist-tag `beta`, fällt aber auf `latest` zurück, wenn beta
  fehlt oder älter als die aktuelle stabile Version ist.

Der Core-Auto-Updater des Gateways (wenn über die Konfiguration aktiviert) verwendet denselben Update-Pfad erneut.

## Git-Checkout-Ablauf

Kanäle:

- `stable`: das neueste Nicht-Beta-Tag auschecken, dann build + doctor ausführen.
- `beta`: bevorzugt das neueste `-beta`-Tag, fällt aber auf das neueste stabile Tag
  zurück, wenn beta fehlt oder älter ist.
- `dev`: `main` auschecken, dann fetch + rebase.

Auf hoher Ebene:

1. Erfordert einen sauberen Worktree (keine nicht committeten Änderungen).
2. Wechselt zum ausgewählten Kanal (Tag oder Branch).
3. Ruft Upstream ab (nur dev).
4. Nur dev: Preflight-Lint + TypeScript-Build in einem temporären Worktree; wenn der Tip fehlschlägt, wird bis zu 10 Commits zurückgegangen, um den neuesten sauberen Build zu finden.
5. Rebased auf den ausgewählten Commit (nur dev).
6. Installiert Abhängigkeiten (pnpm bevorzugt; npm als Fallback; bun bleibt als sekundärer Kompatibilitäts-Fallback verfügbar).
7. Führt build aus + erstellt die Control UI.
8. Führt `openclaw doctor` als abschließende Prüfung für ein „sicheres Update“ aus.
9. Synchronisiert Plugins mit dem aktiven Kanal (dev verwendet gebündelte Erweiterungen; stable/beta verwendet npm) und aktualisiert npm-installierte Plugins.

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Siehe auch

- `openclaw doctor` (bietet an, bei Git-Checkouts zuerst ein Update auszuführen)
- [Entwicklungskanäle](/install/development-channels)
- [Aktualisieren](/install/updating)
- [CLI-Referenz](/cli)
