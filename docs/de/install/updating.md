---
read_when:
    - OpenClaw aktualisieren
    - Nach einem Update funktioniert etwas nicht mehr
summary: OpenClaw sicher aktualisieren (globale Installation oder aus dem Quellcode), plus Rollback-Strategie
title: Aktualisieren
x-i18n:
    generated_at: "2026-04-24T06:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

OpenClaw aktuell halten.

## Empfohlen: `openclaw update`

Der schnellste Weg zum Aktualisieren. Erkennt Ihren Installationstyp (npm oder git), lädt die neueste Version, führt `openclaw doctor` aus und startet das Gateway neu.

```bash
openclaw update
```

Um Kanäle zu wechseln oder eine bestimmte Version anzusteuern:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # Vorschau ohne Anwenden
```

`--channel beta` bevorzugt Beta, aber die Laufzeit fällt auf stable/latest zurück, wenn
das Beta-Tag fehlt oder älter ist als das neueste stabile Release. Verwenden Sie `--tag beta`,
wenn Sie das rohe npm-Beta-dist-tag für ein einmaliges Paket-Update möchten.

Siehe [Development channels](/de/install/development-channels) für die Semantik der Kanäle.

## Alternative: Installationsprogramm erneut ausführen

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Fügen Sie `--no-onboard` hinzu, um das Onboarding zu überspringen. Für Source-Installationen übergeben Sie `--install-method git --no-onboard`.

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

### Root-gehörende globale npm-Installationen

Einige Linux-npm-Setups installieren globale Pakete in Root-gehörende Verzeichnisse wie
`/usr/lib/node_modules/openclaw`. OpenClaw unterstützt dieses Layout: Das installierte
Paket wird zur Laufzeit als schreibgeschützt behandelt, und Laufzeitabhängigkeiten gebündelter Plugins
werden in ein beschreibbares Laufzeitverzeichnis ausgelagert, statt den
Paketbaum zu verändern.

Für gehärtete systemd-Units setzen Sie ein beschreibbares Stage-Verzeichnis, das in
`ReadWritePaths` enthalten ist:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Wenn `OPENCLAW_PLUGIN_STAGE_DIR` nicht gesetzt ist, verwendet OpenClaw `$STATE_DIRECTORY`, wenn
systemd es bereitstellt, und fällt andernfalls auf `~/.openclaw/plugin-runtime-deps` zurück.

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

| Kanal    | Verhalten                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Wartet `stableDelayHours` und wendet dann mit deterministischem Jitter über `stableJitterHours` an (verteiltes Rollout). |
| `beta`   | Prüft alle `betaCheckIntervalHours` (Standard: stündlich) und wendet sofort an.                               |
| `dev`    | Keine automatische Anwendung. Verwenden Sie `openclaw update` manuell.                                        |

Das Gateway protokolliert außerdem beim Start einen Update-Hinweis (deaktivierbar mit `update.checkOnStart: false`).

## Nach dem Update

<Steps>

### Doctor ausführen

```bash
openclaw doctor
```

Migriert die Konfiguration, prüft DM-Richtlinien und den Zustand des Gateway. Details: [Doctor](/de/gateway/doctor)

### Gateway neu starten

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

Zurück zur neuesten Version: `git checkout main && git pull`.

## Wenn Sie nicht weiterkommen

- Führen Sie `openclaw doctor` erneut aus und lesen Sie die Ausgabe sorgfältig.
- Bei `openclaw update --channel dev` auf Source-Checkouts bootstrapped der Updater `pnpm` bei Bedarf automatisch. Wenn Sie einen pnpm-/corepack-Bootstrap-Fehler sehen, installieren Sie `pnpm` manuell (oder aktivieren Sie `corepack` erneut) und führen Sie das Update erneut aus.
- Prüfen Sie: [Fehlerbehebung](/de/gateway/troubleshooting)
- Fragen Sie in Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Verwandt

- [Installationsübersicht](/de/install) — alle Installationsmethoden
- [Doctor](/de/gateway/doctor) — Integritätsprüfungen nach Updates
- [Migrieren](/de/install/migrating) — Anleitungen zur Migration größerer Versionen
