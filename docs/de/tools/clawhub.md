---
read_when:
    - ClawHub neuen Benutzern vorstellen
    - Skills oder Plugins installieren, suchen oder veröffentlichen
    - ClawHub-CLI-Flags und Synchronisierungsverhalten erklären
summary: 'ClawHub-Anleitung: öffentliche Registry, native OpenClaw-Installationsabläufe und ClawHub-CLI-Workflows'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T12:57:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub ist die öffentliche Registry für **OpenClaw-Skills und -Plugins**.

- Verwende native `openclaw`-Befehle, um Skills zu suchen/zu installieren/zu aktualisieren und
  Plugins aus ClawHub zu installieren.
- Verwende die separate CLI `clawhub`, wenn du Registry-Auth, Veröffentlichen, Löschen,
  Wiederherstellen oder Sync-Workflows benötigst.

Website: [clawhub.ai](https://clawhub.ai)

## Native OpenClaw-Abläufe

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

Einfache npm-sichere Plugin-Spezifikationen werden ebenfalls zuerst gegen ClawHub versucht, bevor npm verwendet wird:

```bash
openclaw plugins install openclaw-codex-app-server
```

Native `openclaw`-Befehle installieren in deinen aktiven Workspace und persistieren Metadaten zur Quelle,
damit spätere `update`-Aufrufe bei ClawHub bleiben können.

Plugin-Installationen validieren die beworbene Kompatibilität von `pluginApi` und `minGatewayVersion`,
bevor die Installation des Archivs läuft, sodass inkompatible Hosts frühzeitig sicher fehlschlagen,
anstatt das Paket teilweise zu installieren.

`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-Familien.
Wenn ein ClawHub-Paket tatsächlich ein Skill ist, stoppt OpenClaw und verweist dich stattdessen auf
`openclaw skills install <slug>`.

## Was ClawHub ist

- Eine öffentliche Registry für OpenClaw-Skills und -Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Discovery-Oberfläche für Suche, Tags und Nutzungssignale.

## So funktioniert es

1. Ein Benutzer veröffentlicht ein Skill-Bundle (Dateien + Metadaten).
2. ClawHub speichert das Bundle, parst Metadaten und weist eine Version zu.
3. Die Registry indexiert den Skill für Suche und Discovery.
4. Benutzer durchsuchen, laden herunter und installieren Skills in OpenClaw.

## Was du tun kannst

- Neue Skills und neue Versionen bestehender Skills veröffentlichen.
- Skills nach Namen, Tags oder Suche finden.
- Skill-Bundles herunterladen und ihre Dateien prüfen.
- Skills melden, die missbräuchlich oder unsicher sind.
- Wenn du Moderator bist, ausblenden, einblenden, löschen oder sperren.

## Für wen das ist (einsteigerfreundlich)

Wenn du deinem OpenClaw-Agenten neue Fähigkeiten hinzufügen möchtest, ist ClawHub der einfachste Weg, Skills zu finden und zu installieren. Du musst nicht wissen, wie das Backend funktioniert. Du kannst:

- Skills in Alltagssprache suchen.
- Einen Skill in deinen Workspace installieren.
- Skills später mit einem Befehl aktualisieren.
- Deine eigenen Skills durch Veröffentlichen sichern.

## Schnellstart (nicht technisch)

1. Suche nach etwas, das du brauchst:
   - `openclaw skills search "calendar"`
2. Installiere einen Skill:
   - `openclaw skills install <skill-slug>`
3. Starte eine neue OpenClaw-Sitzung, damit der neue Skill übernommen wird.
4. Wenn du veröffentlichen oder Registry-Auth verwalten möchtest, installiere zusätzlich
   die separate CLI `clawhub`.

## Die ClawHub CLI installieren

Du brauchst diese nur für Registry-authentifizierte Workflows wie Veröffentlichen/Sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Wie es in OpenClaw passt

Native `openclaw skills install`-Befehle installieren in das Verzeichnis `skills/`
des aktiven Workspace. `openclaw plugins install clawhub:...` zeichnet eine normale verwaltete
Plugin-Installation plus ClawHub-Quellmetadaten für Updates auf.

Anonyme ClawHub-Plugin-Installationen schlagen für private Pakete ebenfalls sicher fehl.
Community- oder andere nicht offizielle Channels können weiterhin installieren, aber OpenClaw warnt,
damit Operatoren Quelle und Verifikation vor der Aktivierung prüfen können.

Die separate CLI `clawhub` installiert Skills außerdem in `./skills` unter deinem
aktuellen Arbeitsverzeichnis. Wenn ein OpenClaw-Workspace konfiguriert ist, greift `clawhub`
auf diesen Workspace zurück, sofern du `--workdir` (oder
`CLAWHUB_WORKDIR`) nicht überschreibst. OpenClaw lädt Workspace-Skills aus `<workspace>/skills`
und übernimmt sie in der **nächsten** Sitzung. Wenn du bereits
`~/.openclaw/skills` oder gebündelte Skills verwendest, haben Workspace-Skills Vorrang.

Weitere Details dazu, wie Skills geladen, geteilt und gesteuert werden, findest du unter
[Skills](/tools/skills).

## Überblick über das Skill-System

Ein Skill ist ein versioniertes Bundle aus Dateien, das OpenClaw beibringt, wie eine
bestimmte Aufgabe ausgeführt wird. Jede Veröffentlichung erzeugt eine neue Version, und die
Registry behält einen Versionsverlauf, damit Benutzer Änderungen prüfen können.

Ein typischer Skill enthält:

- Eine Datei `SKILL.md` mit der primären Beschreibung und Verwendung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub nutzt Metadaten, um Discovery zu unterstützen und Skill-Fähigkeiten sicher bereitzustellen.
Die Registry verfolgt außerdem Nutzungssignale (wie Sterne und Downloads), um
Ranking und Sichtbarkeit zu verbessern.

## Was der Dienst bereitstellt (Features)

- **Öffentliches Durchsuchen** von Skills und ihrem Inhalt in `SKILL.md`.
- **Suche** auf Basis von Embeddings (Vektorsuche), nicht nur Schlüsselwörtern.
- **Versionierung** mit Semver, Changelogs und Tags (einschließlich `latest`).
- **Downloads** als ZIP pro Version.
- **Sterne und Kommentare** für Community-Feedback.
- **Moderations**-Hooks für Genehmigungen und Audits.
- **CLI-freundliche API** für Automatisierung und Skripting.

## Sicherheit und Moderation

ClawHub ist standardmäßig offen. Jeder kann Skills hochladen, aber ein GitHub-Konto muss
mindestens eine Woche alt sein, um veröffentlichen zu dürfen. Das hilft, Missbrauch zu verlangsamen, ohne
legitime Mitwirkende zu blockieren.

Melden und Moderation:

- Jeder angemeldete Benutzer kann einen Skill melden.
- Meldegründe sind erforderlich und werden aufgezeichnet.
- Jeder Benutzer kann bis zu 20 aktive Meldungen gleichzeitig haben.
- Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.
- Moderatoren können ausgeblendete Skills ansehen, wieder einblenden, löschen oder Benutzer sperren.
- Missbrauch der Meldefunktion kann zu Kontosperrungen führen.

Interessiert daran, Moderator zu werden? Frag im OpenClaw-Discord und kontaktiere einen
Moderator oder Maintainer.

## CLI-Befehle und Parameter

Globale Optionen (gelten für alle Befehle):

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: aktuelles Verzeichnis; greift auf den OpenClaw-Workspace zurück).
- `--dir <dir>`: Skills-Verzeichnis relativ zu workdir (Standard: `skills`).
- `--site <url>`: Basis-URL der Website (Browser-Login).
- `--registry <url>`: Basis-URL der Registry-API.
- `--no-input`: Prompts deaktivieren (nicht interaktiv).
- `-V, --cli-version`: CLI-Version ausgeben.

Auth:

- `clawhub login` (Browser-Ablauf) oder `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Optionen:

- `--token <token>`: API-Token einfügen.
- `--label <label>`: Label, das für Browser-Login-Tokens gespeichert wird (Standard: `CLI token`).
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
- `--force`: Überschreiben, wenn lokale Dateien zu keiner veröffentlichten Version passen.

Auflisten:

- `clawhub list` (liest `.clawhub/lock.json`)

Skills veröffentlichen:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill-Slug.
- `--name <name>`: Anzeigename.
- `--version <version>`: Semver-Version.
- `--changelog <text>`: Changelog-Text (kann leer sein).
- `--tags <tags>`: Durch Kommas getrennte Tags (Standard: `latest`).

Plugins veröffentlichen:

- `clawhub package publish <source>`
- `<source>` kann ein lokaler Ordner, `owner/repo`, `owner/repo@ref` oder eine GitHub-URL sein.
- `--dry-run`: Den exakten Veröffentlichungsplan erstellen, ohne etwas hochzuladen.
- `--json`: Maschinenlesbare Ausgabe für CI erzeugen.
- `--source-repo`, `--source-commit`, `--source-ref`: Optionale Überschreibungen, wenn die automatische Erkennung nicht ausreicht.

Löschen/Wiederherstellen (nur Eigentümer/Admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (lokale Skills scannen + neue/aktualisierte veröffentlichen):

- `clawhub sync`
- `--root <dir...>`: Zusätzliche Scan-Wurzeln.
- `--all`: Alles ohne Prompts hochladen.
- `--dry-run`: Zeigen, was hochgeladen würde.
- `--bump <type>`: `patch|minor|major` für Updates (Standard: `patch`).
- `--changelog <text>`: Changelog für nicht interaktive Updates.
- `--tags <tags>`: Durch Kommas getrennte Tags (Standard: `latest`).
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

### Deine Skills sichern (veröffentlichen oder synchronisieren)

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
    "extensions": ["./index.ts"],
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

## Erweiterte Details (technisch)

### Versionierung und Tags

- Jede Veröffentlichung erzeugt eine neue **Semver**-`SkillVersion`.
- Tags (wie `latest`) zeigen auf eine Version; verschiebbare Tags erlauben Rollbacks.
- Changelogs werden pro Version angehängt und können beim Synchronisieren oder Veröffentlichen von Updates leer sein.

### Lokale Änderungen vs. Registry-Versionen

Updates vergleichen den lokalen Skill-Inhalt mit Registry-Versionen über einen Content-Hash. Wenn lokale Dateien zu keiner veröffentlichten Version passen, fragt die CLI vor dem Überschreiben nach (oder verlangt `--force` in nicht interaktiven Läufen).

### Sync-Scanning und Fallback-Wurzeln

`clawhub sync` scannt zuerst dein aktuelles workdir. Wenn keine Skills gefunden werden, greift es auf bekannte alte Speicherorte zurück (zum Beispiel `~/openclaw/skills` und `~/.openclaw/skills`). Das ist dafür gedacht, ältere Skill-Installationen ohne zusätzliche Flags zu finden.

### Speicher und Lockfile

- Installierte Skills werden in `.clawhub/lock.json` unter deinem workdir aufgezeichnet.
- Auth-Tokens werden in der Konfigurationsdatei der ClawHub CLI gespeichert (überschreibbar über `CLAWHUB_CONFIG_PATH`).

### Telemetrie (Installationszahlen)

Wenn du `clawhub sync` im angemeldeten Zustand ausführst, sendet die CLI einen minimalen Snapshot, um Installationszahlen zu berechnen. Du kannst das vollständig deaktivieren:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Umgebungsvariablen

- `CLAWHUB_SITE`: Überschreibt die URL der Website.
- `CLAWHUB_REGISTRY`: Überschreibt die URL der Registry-API.
- `CLAWHUB_CONFIG_PATH`: Überschreibt den Speicherort für Token/Konfiguration der CLI.
- `CLAWHUB_WORKDIR`: Überschreibt das Standard-workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Deaktiviert Telemetrie bei `sync`.
