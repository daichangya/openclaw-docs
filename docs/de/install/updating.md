---
read_when:
    - Beim Aktualisieren von OpenClaw
    - Wenn nach einem Update etwas kaputtgeht
summary: OpenClaw sicher aktualisieren (globale Installation oder Source), plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-05T12:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Aktualisieren

OpenClaw aktuell halten.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Es erkennt Ihren Installationstyp (npm oder git), holt die neueste Version, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Um Channels zu wechseln oder eine bestimmte Version anzusteuern:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwendung
```

`--channel beta` bevorzugt Beta, aber die Laufzeit fällt auf stable/latest zurück, wenn
das Beta-Tag fehlt oder älter ist als das neueste stabile Release. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

Siehe [Development channels](/install/development-channels) für die Semantik von Channels.

## Alternative: das Installationsskript erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Bei Source-Installationen übergeben Sie `--install-method git --no-onboard`.

## Alternative: manuell mit npm, pnpm oder bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

## Auto-Updater

Der Auto-Updater ist standardmäßig deaktiviert. Aktivieren Sie ihn in `~/.openclaw/openclaw.json`:

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

| Channel  | Verhalten                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (verteiltes Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                               |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                        |

Das Gateway protokolliert beim Start außerdem einen Update-Hinweis (deaktivierbar mit `update.checkOnStart: false`).

## Nach dem Update

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft DM-Richtlinien und überprüft den Zustand des Gateways. Details: [Doctor](/gateway/doctor)

### Das Gateway neu starten

```bash
openclaw gateway restart
```

### Verifizieren

```bash
openclaw health
```

</Steps>

## Rollback

### Eine Version pinnen (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Tipp: `npm view openclaw version` zeigt die aktuell veröffentlichte Version.

### Einen Commit pinnen (Source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Um zur neuesten Version zurückzukehren: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Prüfen Sie: [Fehlerbehebung](/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/install) — alle Installationsmethoden
- [Doctor](/gateway/doctor) — Health-Checks nach Updates
- [Migrating](/install/migrating) — Leitfäden für Migrationen zwischen Hauptversionen
