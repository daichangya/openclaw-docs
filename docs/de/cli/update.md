---
read_when:
    - Sie möchten einen Quell-Checkout sicher aktualisieren.
    - Sie müssen das Kurzverhalten von `--update` verstehen.
summary: CLI-Referenz für `openclaw update` (vergleichsweise sicheres Quellupdate + automatischer Gateway-Neustart)
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-24T06:33:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw sicher aktualisieren und zwischen Stable-/Beta-/Dev-Kanälen wechseln.

Wenn Sie über **npm/pnpm/bun** installiert haben (globale Installation, keine Git-Metadaten),
erfolgen Aktualisierungen über den Paketmanager-Ablauf in [Aktualisieren](/de/install/updating).

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
- `--channel <stable|beta|dev>`: den Aktualisierungskanal festlegen (git + npm; wird in der Konfiguration gespeichert).
- `--tag <dist-tag|version|spec>`: das Paketziel nur für diese Aktualisierung überschreiben. Bei Paketinstallationen wird `main` auf `github:openclaw/openclaw#main` abgebildet.
- `--dry-run`: geplante Aktualisierungsaktionen (Kanal/Tag/Ziel/Neustart-Ablauf) in der Vorschau anzeigen, ohne Konfiguration zu schreiben, zu installieren, Plugins zu synchronisieren oder neu zu starten.
- `--json`: maschinenlesbares JSON vom Typ `UpdateRunResult` ausgeben, einschließlich
  `postUpdate.plugins.integrityDrifts`, wenn während der Synchronisierung von Plugins nach dem Update
  Integritätsabweichungen bei npm-Plugin-Artefakten erkannt werden.
- `--timeout <seconds>`: Timeout pro Schritt (Standard ist 1200s).
- `--yes`: Bestätigungsabfragen überspringen (zum Beispiel Bestätigung bei einem Downgrade)

Hinweis: Downgrades erfordern eine Bestätigung, da ältere Versionen die Konfiguration beschädigen können.

## `update status`

Den aktiven Aktualisierungskanal sowie Git-Tag/Branch/SHA (für Quell-Checkouts) und die Verfügbarkeit von Updates anzeigen.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Optionen:

- `--json`: maschinenlesbares Status-JSON ausgeben.
- `--timeout <seconds>`: Timeout für Prüfungen (Standard ist 3s).

## `update wizard`

Interaktiver Ablauf zur Auswahl eines Aktualisierungskanals und zur Bestätigung, ob das Gateway
nach der Aktualisierung neu gestartet werden soll (Standard ist Neustart). Wenn Sie `dev` ohne Git-Checkout auswählen,
wird angeboten, eines zu erstellen.

Optionen:

- `--timeout <seconds>`: Timeout für jeden Aktualisierungsschritt (Standard `1200`)

## Was der Befehl tut

Wenn Sie explizit den Kanal wechseln (`--channel ...`), hält OpenClaw auch die
Installationsmethode entsprechend synchron:

- `dev` → stellt ein Git-Checkout sicher (Standard: `~/openclaw`, überschreibbar mit `OPENCLAW_GIT_DIR`),
  aktualisiert es und installiert die globale CLI aus diesem Checkout.
- `stable` → installiert aus npm mit `latest`.
- `beta` → bevorzugt den npm-Dist-Tag `beta`, fällt aber auf `latest` zurück, wenn Beta
  fehlt oder älter als die aktuelle Stable-Version ist.

Der Core-Auto-Updater des Gateways (wenn per Konfiguration aktiviert) verwendet denselben Aktualisierungspfad.

Bei Paketmanager-Installationen löst `openclaw update` die Zielpaketversion
auf, bevor der Paketmanager aufgerufen wird. Wenn die installierte Version exakt
mit dem Ziel übereinstimmt und keine Änderung des Aktualisierungskanals gespeichert werden muss, wird der
Befehl als übersprungen beendet, bevor Paketinstallation, Plugin-Synchronisierung, Aktualisierung von Completion-
Daten oder Gateway-Neustart ausgeführt werden.

## Git-Checkout-Ablauf

Kanäle:

- `stable`: den neuesten Nicht-Beta-Tag auschecken, dann bauen + Doctor ausführen.
- `beta`: bevorzugt den neuesten `-beta`-Tag, fällt aber auf den neuesten Stable-Tag
  zurück, wenn Beta fehlt oder älter ist.
- `dev`: `main` auschecken, dann abrufen + rebasen.

Auf hoher Ebene:

1. Erfordert einen sauberen Worktree (keine uncommitteten Änderungen).
2. Wechselt zum ausgewählten Kanal (Tag oder Branch).
3. Holt Upstream-Änderungen ab (nur dev).
4. Nur dev: führt Vorabprüfungen mit Lint + TypeScript-Build in einem temporären Worktree aus; wenn der aktuelle Stand fehlschlägt, geht der Ablauf bis zu 10 Commits zurück, um den neuesten sauber buildbaren Stand zu finden.
5. Rebased auf den ausgewählten Commit (nur dev).
6. Installiert Abhängigkeiten mit dem Paketmanager des Repos. Bei pnpm-Checkouts bootstrapped der Updater `pnpm` bei Bedarf (zuerst über `corepack`, dann mit einem temporären Fallback `npm install pnpm@10`), anstatt `npm run build` innerhalb eines pnpm-Workspaces auszuführen.
7. Baut und baut die Control UI.
8. Führt `openclaw doctor` als abschließende Prüfung für das „sichere Update“ aus.
9. Synchronisiert Plugins mit dem aktiven Kanal (dev verwendet gebündelte Plugins; stable/beta verwenden npm) und aktualisiert per npm installierte Plugins.

Wenn bei einer exakten angehefteten npm-Plugin-Aktualisierung ein Artefakt aufgelöst wird, dessen Integrität
vom gespeicherten Installationsdatensatz abweicht, bricht `openclaw update` diese Plugin-
Artefakt-Aktualisierung ab, anstatt sie zu installieren. Installieren oder aktualisieren Sie das Plugin
erst dann explizit neu, nachdem Sie verifiziert haben, dass Sie dem neuen Artefakt vertrauen.

Wenn das Bootstrap von pnpm weiterhin fehlschlägt, stoppt der Updater jetzt frühzeitig mit einem paketmanager-spezifischen Fehler, anstatt zu versuchen, `npm run build` innerhalb des Checkouts auszuführen.

## Kurzform `--update`

`openclaw --update` wird zu `openclaw update` umgeschrieben (nützlich für Shells und Launcher-Skripte).

## Verwandt

- `openclaw doctor` (bietet bei Git-Checkouts an, zuerst ein Update auszuführen)
- [Entwicklungskanäle](/de/install/development-channels)
- [Aktualisieren](/de/install/updating)
- [CLI-Referenz](/de/cli)
