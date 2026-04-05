---
read_when:
    - Beim Erstellen oder Signieren von mac-Debug-Builds
summary: Signaturschritte für macOS-Debug-Builds, die von Paketierungsskripten erzeugt werden
title: macOS-Signierung
x-i18n:
    generated_at: "2026-04-05T12:49:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac-Signierung (Debug-Builds)

Diese App wird normalerweise mit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) erstellt, das jetzt:

- eine stabile Bundle-ID für Debug-Builds setzt: `ai.openclaw.mac.debug`
- die Info.plist mit dieser Bundle-ID schreibt (überschreibbar über `BUNDLE_ID=...`)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) aufruft, um die Hauptbinärdatei und das App-Bundle zu signieren, damit macOS jeden Neuaufbau als dasselbe signierte Bundle behandelt und TCC-Berechtigungen beibehält (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Sprache). Für stabile Berechtigungen verwenden Sie eine echte Signaturidentität; Ad-hoc ist optional und fragil (siehe [macOS-Berechtigungen](/platforms/mac/permissions)).
- standardmäßig `CODESIGN_TIMESTAMP=auto` verwendet; dadurch werden vertrauenswürdige Zeitstempel für Developer-ID-Signaturen aktiviert. Setzen Sie `CODESIGN_TIMESTAMP=off`, um das Setzen von Zeitstempeln zu überspringen (Offline-Debug-Builds).
- Build-Metadaten in die Info.plist einfügt: `OpenClawBuildTimestamp` (UTC) und `OpenClawGitCommit` (Kurz-Hash), damit der Bereich „Über“ Build, Git und Debug-/Release-Kanal anzeigen kann.
- **bei der Paketierung standardmäßig Node 24 verwendet**: Das Skript führt TS-Builds und den Build der Control UI aus. Node 22 LTS, derzeit `22.14+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.
- `SIGN_IDENTITY` aus der Umgebung liest. Fügen Sie `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (oder Ihr Zertifikat „Developer ID Application“) zu Ihrer Shell-RC-Datei hinzu, um immer mit Ihrem Zertifikat zu signieren. Ad-hoc-Signierung erfordert eine ausdrückliche Aktivierung über `ALLOW_ADHOC_SIGNING=1` oder `SIGN_IDENTITY="-"` (nicht empfohlen für Berechtigungstests).
- nach dem Signieren eine Team-ID-Prüfung ausführt und fehlschlägt, wenn ein Mach-O innerhalb des App-Bundles von einer anderen Team-ID signiert ist. Setzen Sie `SKIP_TEAM_ID_CHECK=1`, um dies zu umgehen.

## Verwendung

```bash
# vom Repo-Stamm aus
scripts/package-mac-app.sh               # wählt die Identität automatisch aus; gibt einen Fehler aus, wenn keine gefunden wird
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # echtes Zertifikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # Ad-hoc (Berechtigungen bleiben nicht erhalten)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explizites Ad-hoc (gleicher Vorbehalt)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # nur für Entwicklung: Workaround für Sparkle-Team-ID-Abweichung
```

### Hinweis zur Ad-hoc-Signierung

Beim Signieren mit `SIGN_IDENTITY="-"` (Ad-hoc) deaktiviert das Skript automatisch die **Hardened Runtime** (`--options runtime`). Das ist erforderlich, um Abstürze zu verhindern, wenn die App versucht, eingebettete Frameworks (wie Sparkle) zu laden, die nicht dieselbe Team-ID haben. Ad-hoc-Signaturen verhindern außerdem die dauerhafte Speicherung von TCC-Berechtigungen; siehe [macOS-Berechtigungen](/platforms/mac/permissions) für Schritte zur Wiederherstellung.

## Build-Metadaten für „Über“

`package-mac-app.sh` versieht das Bundle mit:

- `OpenClawBuildTimestamp`: ISO8601 UTC zum Zeitpunkt der Paketierung
- `OpenClawGitCommit`: kurzer Git-Hash (oder `unknown`, falls nicht verfügbar)

Der Tab „Über“ liest diese Schlüssel, um Version, Build-Datum, Git-Commit und anzuzeigen, ob es sich um einen Debug-Build handelt (über `#if DEBUG`). Führen Sie das Paketierungsskript erneut aus, um diese Werte nach Codeänderungen zu aktualisieren.

## Warum

TCC-Berechtigungen sind an die Bundle-ID _und_ die Codesignatur gebunden. Unsigned Debug-Builds mit sich ändernden UUIDs führten dazu, dass macOS die gewährten Berechtigungen nach jedem Neuaufbau vergaß. Das Signieren der Binärdateien (standardmäßig Ad-hoc) und das Beibehalten einer festen Bundle-ID/eines festen Pfads (`dist/OpenClaw.app`) erhält die Berechtigungen zwischen Builds und entspricht damit dem VibeTunnel-Ansatz.
