---
read_when:
    - ClawHub neuen Benutzern vorstellen.
    - Skills oder Plugins installieren, suchen oder veröffentlichen.
    - ClawHub-CLI-Flags und Synchronisierungsverhalten erklären.
summary: 'ClawHub-Leitfaden: öffentliches Registry, native OpenClaw-Installationsabläufe und ClawHub-CLI-Workflows'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T07:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub ist das öffentliche Registry für **OpenClaw-Skills und -Plugins**.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen/zu installieren/zu aktualisieren und
  Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI, wenn Sie Registry-Authentifizierung, Veröffentlichen, Löschen,
  Wiederherstellen oder Sync-Workflows benötigen.

Website: [clawhub.ai](https://clawhub.ai)

## Native OpenClaw-Flows

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Bare npm-safe Plugin-Spezifikationen werden ebenfalls zuerst gegen ClawHub versucht und erst danach gegen npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Native `openclaw`-Befehle installieren in Ihren aktiven Workspace und persistieren Quell-
Metadaten, damit spätere `update`-Aufrufe auf ClawHub bleiben können.

Plugin-Installationen validieren die beworbene Kompatibilität von `pluginApi` und `minGatewayVersion`
vor dem Installieren des Archivs, sodass inkompatible Hosts frühzeitig fail-closed reagieren, statt das Paket teilweise zu installieren.

`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-Familien.
Wenn ein ClawHub-Paket tatsächlich ein Skill ist, stoppt OpenClaw und verweist Sie stattdessen auf
`openclaw skills install <slug>`.

## Was ClawHub ist

- Ein öffentliches Registry für OpenClaw-Skills und -Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Discovery-Oberfläche für Suche, Tags und Usage-Signale.

## So funktioniert es

1. Ein Benutzer veröffentlicht ein Skill-Bundle (Dateien + Metadaten).
2. ClawHub speichert das Bundle, parst Metadaten und weist eine Version zu.
3. Das Registry indiziert den Skill für Suche und Discovery.
4. Benutzer durchsuchen, laden herunter und installieren Skills in OpenClaw.

## Was Sie tun können

- Neue Skills und neue Versionen bestehender Skills veröffentlichen.
- Skills anhand von Namen, Tags oder Suche entdecken.
- Skill-Bundles herunterladen und ihre Dateien prüfen.
- Skills melden, die missbräuchlich oder unsicher sind.
- Wenn Sie Moderator sind, ausblenden, einblenden, löschen oder bannen.

## Für wen das ist (einsteigerfreundlich)

Wenn Sie Ihrem OpenClaw-Agenten neue Fähigkeiten hinzufügen möchten, ist ClawHub die einfachste Möglichkeit, Skills zu finden und zu installieren. Sie müssen nicht wissen, wie das Backend funktioniert. Sie können:

- Skills in natürlicher Sprache suchen.
- Einen Skill in Ihren Workspace installieren.
- Skills später mit einem Befehl aktualisieren.
- Ihre eigenen Skills sichern, indem Sie sie veröffentlichen.

## Schnellstart (nicht technisch)

1. Suchen Sie nach etwas, das Sie benötigen:
   - `openclaw skills search "calendar"`
2. Installieren Sie einen Skill:
   - `openclaw skills install <skill-slug>`
3. Starten Sie eine neue OpenClaw-Sitzung, damit der neue Skill übernommen wird.
4. Wenn Sie Registry-Authentifizierung veröffentlichen oder verwalten möchten, installieren Sie zusätzlich die separate
   `clawhub`-CLI.

## Die ClawHub-CLI installieren

Sie benötigen diese nur für Registry-authentifizierte Workflows wie Publish/Sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Wie das in OpenClaw passt

`openclaw skills install` installiert nativ in das aktive Workspace-Verzeichnis `skills/`. `openclaw plugins install clawhub:...` erfasst eine normale verwaltete
Plugin-Installation plus ClawHub-Quellmetadaten für Updates.

Anonyme ClawHub-Plugin-Installationen failen für private Pakete ebenfalls fail-closed.
Community- oder andere nicht offizielle Kanäle können weiterhin installieren, aber OpenClaw warnt,
damit Operatoren Quelle und Verifikation vor dem Aktivieren prüfen können.

Die separate `clawhub`-CLI installiert Skills außerdem nach `./skills` unter Ihrem
aktuellen Arbeitsverzeichnis. Wenn ein OpenClaw-Workspace konfiguriert ist, fällt `clawhub`
auf diesen Workspace zurück, sofern Sie nicht `--workdir` (oder
`CLAWHUB_WORKDIR`) überschreiben. OpenClaw lädt Workspace-Skills aus `<workspace>/skills`
und übernimmt sie in der **nächsten** Sitzung. Wenn Sie bereits
`~/.openclaw/skills` oder gebündelte Skills verwenden, haben Workspace-Skills Vorrang.

Weitere Details dazu, wie Skills geladen, geteilt und gesteuert werden, finden Sie unter
[Skills](/de/tools/skills).

## Überblick über das Skill-System

Ein Skill ist ein versioniertes Bundle von Dateien, das OpenClaw beibringt, wie eine
bestimmte Aufgabe ausgeführt wird. Jede Veröffentlichung erzeugt eine neue Version, und das Registry behält
einen Versionsverlauf, sodass Benutzer Änderungen auditieren können.

Ein typischer Skill enthält:

- Eine Datei `SKILL.md` mit der primären Beschreibung und Verwendung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub verwendet Metadaten, um Discovery zu ermöglichen und Skill-Fähigkeiten sicher offenzulegen.
Das Registry verfolgt außerdem Usage-Signale (wie Sterne und Downloads), um
Ranking und Sichtbarkeit zu verbessern.

## Was der Dienst bereitstellt (Funktionen)

- **Öffentliches Browsing** von Skills und ihrem `SKILL.md`-Inhalt.
- **Suche** auf Basis von Embeddings (Vektorsuche), nicht nur nach Schlüsselwörtern.
- **Versionierung** mit Semver, Changelogs und Tags (einschließlich `latest`).
- **Downloads** als Zip pro Version.
- **Sterne und Kommentare** für Community-Feedback.
- **Moderations**-Hooks für Freigaben und Audits.
- **CLI-freundliche API** für Automatisierung und Scripting.

## Sicherheit und Moderation

ClawHub ist standardmäßig offen. Jeder kann Skills hochladen, aber ein GitHub-Konto muss
mindestens eine Woche alt sein, um veröffentlichen zu können. Das hilft, Missbrauch zu verlangsamen, ohne
legitime Mitwirkende zu blockieren.

Melden und Moderation:

- Jeder angemeldete Benutzer kann einen Skill melden.
- Meldegründe sind erforderlich und werden protokolliert.
- Jeder Benutzer kann bis zu 20 aktive Meldungen gleichzeitig haben.
- Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.
- Moderatoren können ausgeblendete Skills ansehen, wieder einblenden, löschen oder Benutzer bannen.
- Missbrauch der Meldefunktion kann zu Kontosperren führen.

Interessiert daran, Moderator zu werden? Fragen Sie im OpenClaw-Discord und kontaktieren Sie einen
Moderator oder Maintainer.

## CLI-Befehle und Parameter

Globale Optionen (gelten für alle Befehle):

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: aktuelles Verzeichnis; fällt auf OpenClaw-Workspace zurück).
- `--dir <dir>`: Skills-Verzeichnis relativ zu workdir (Standard: `skills`).
- `--site <url>`: Basis-URL der Site (Browser-Login).
- `--registry <url>`: Basis-URL der Registry-API.
- `--no-input`: Prompts deaktivieren (nicht interaktiv).
- `-V, --cli-version`: CLI-Version ausgeben.

Authentifizierung:

- `clawhub login` (Browser-Flow) oder `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Optionen:

- `--token <token>`: Ein API-Token einfügen.
- `--label <label>`: Label, das für Tokens bei Browser-Login gespeichert wird (Standard: `CLI token`).
- `--no-browser`: Keinen Browser öffnen (erfordert `--token`).

Suche:

- `clawhub search "query"`
- `--limit <n>`: Maximale Anzahl an Ergebnissen.

Installieren:

- `clawhub install <slug>`
- `--version <version>`: Eine bestimmte Version installieren.
- `--force`: Überschreiben, wenn der Ordner bereits existiert.

Aktualisieren:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Auf eine bestimmte Version aktualisieren (nur einzelner Slug).
- `--force`: Überschreiben, wenn lokale Dateien keiner veröffentlichten Version entsprechen.

Auflisten:

- `clawhub list` (liest `.clawhub/lock.json`)

Skills veröffentlichen:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill-Slug.
- `--name <name>`: Anzeigename.
- `--version <version>`: Semver-Version.
- `--changelog <text>`: Changelog-Text (kann leer sein).
- `--tags <tags>`: kommagetrennte Tags (Standard: `latest`).

Plugins veröffentlichen:

- `clawhub package publish <source>`
- `<source>` kann ein lokaler Ordner, `owner/repo`, `owner/repo@ref` oder eine GitHub-URL sein.
- `--dry-run`: Den exakten Publish-Plan erstellen, ohne etwas hochzuladen.
- `--json`: Maschinenlesbare Ausgabe für CI ausgeben.
- `--source-repo`, `--source-commit`, `--source-ref`: Optionale Überschreibungen, wenn die automatische Erkennung nicht ausreicht.

Löschen/Wiederherstellen (nur Besitzer/Admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (lokale Skills scannen + neue/aktualisierte veröffentlichen):

- `clawhub sync`
- `--root <dir...>`: Zusätzliche Scan-Roots.
- `--all`: Alles ohne Prompts hochladen.
- `--dry-run`: Zeigen, was hochgeladen würde.
- `--bump <type>`: `patch|minor|major` für Updates (Standard: `patch`).
- `--changelog <text>`: Changelog für nicht interaktive Updates.
- `--tags <tags>`: kommagetrennte Tags (Standard: `latest`).
- `--concurrency <n>`: Registry-Prüfungen (Standard: 4).

## Häufige Workflows für Agenten

### Nach Skills suchen

```bash
clawhub search "postgres backups"
```

### Neue Skills herunterladen

```bash
clawhub install my-skill-pack
```

### Installierte Skills aktualisieren

```bash
clawhub update --all
```

### Ihre Skills sichern (publish oder sync)

Für einen einzelnen Skill-Ordner:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Um viele Skills auf einmal zu scannen und zu sichern:

```bash
clawhub sync --all
```

### Ein Plugin von GitHub veröffentlichen

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Code-Plugins müssen die erforderlichen OpenClaw-Metadaten in `package.json` enthalten:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Veröffentlichte Pakete sollten gebautes JavaScript mitliefern und `runtimeExtensions`
auf diese Ausgabe zeigen lassen. Installationen aus Git-Checkouts können weiterhin auf TypeScript-Quellcode zurückfallen,
wenn keine gebauten Dateien existieren, aber gebaute Runtime-Einträge vermeiden Runtime-
TypeScript-Kompilierung in Pfaden für Start, Doctor und Plugin-Laden.

## Erweiterte Details (technisch)

### Versionierung und Tags

- Jede Veröffentlichung erzeugt eine neue **Semver**-`SkillVersion`.
- Tags (wie `latest`) zeigen auf eine Version; durch Verschieben von Tags können Sie zurückrollen.
- Changelogs werden pro Version angehängt und können beim Sync oder Publish von Updates leer sein.

### Lokale Änderungen vs. Registry-Versionen

Updates vergleichen den lokalen Skill-Inhalt per Content-Hash mit Registry-Versionen. Wenn lokale Dateien keiner veröffentlichten Version entsprechen, fragt die CLI vor dem Überschreiben (oder erfordert `--force` in nicht interaktiven Läufen).

### Sync-Scanning und Fallback-Roots

`clawhub sync` scannt zuerst Ihr aktuelles workdir. Wenn keine Skills gefunden werden, fällt es auf bekannte ältere Speicherorte zurück (zum Beispiel `~/openclaw/skills` und `~/.openclaw/skills`). So sollen ältere Skill-Installationen ohne zusätzliche Flags gefunden werden.

### Speicher und Lockfile

- Installierte Skills werden in `.clawhub/lock.json` unter Ihrem workdir aufgezeichnet.
- Auth-Tokens werden in der ClawHub-CLI-Konfigurationsdatei gespeichert (überschreibbar über `CLAWHUB_CONFIG_PATH`).

### Telemetrie (Installationszahlen)

Wenn Sie `clawhub sync` im angemeldeten Zustand ausführen, sendet die CLI einen minimalen Snapshot, um Installationszahlen zu berechnen. Sie können dies vollständig deaktivieren:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Umgebungsvariablen

- `CLAWHUB_SITE`: URL der Site überschreiben.
- `CLAWHUB_REGISTRY`: URL der Registry-API überschreiben.
- `CLAWHUB_CONFIG_PATH`: Speicherort von Token/Konfiguration für die CLI überschreiben.
- `CLAWHUB_WORKDIR`: Standard-workdir überschreiben.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Telemetrie bei `sync` deaktivieren.

## Verwandt

- [Plugin](/de/tools/plugin)
- [Skills](/de/tools/skills)
- [Community-Plugins](/de/plugins/community)
