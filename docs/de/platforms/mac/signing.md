---
read_when:
    - Erstellen oder Signieren von mac-Debug-Builds
summary: Signierschritte für macOS-Debug-Builds, die von Packaging-Skripten erzeugt werden
title: macOS-Signierung
x-i18n:
    generated_at: "2026-04-24T06:48:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac-Signierung (Debug-Builds)

Diese App wird normalerweise mit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) gebaut, das jetzt:

- eine stabile Debug-Bundle-Identifier setzt: `ai.openclaw.mac.debug`
- die Info.plist mit dieser Bundle-ID schreibt (Überschreibung über `BUNDLE_ID=...`)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) aufruft, um das Haupt-Binary und das App-Bundle zu signieren, sodass macOS jeden Rebuild als dasselbe signierte Bundle behandelt und TCC-Berechtigungen beibehält (Benachrichtigungen, Bedienungshilfen, Bildschirmaufzeichnung, Mikrofon, Sprache). Für stabile Berechtigungen verwenden Sie eine echte Signieridentität; Ad-hoc ist Opt-in und fragil (siehe [macOS-Berechtigungen](/de/platforms/mac/permissions)).
- standardmäßig `CODESIGN_TIMESTAMP=auto` verwendet; dadurch werden vertrauenswürdige Zeitstempel für Developer-ID-Signaturen aktiviert. Setzen Sie `CODESIGN_TIMESTAMP=off`, um Zeitstempel zu überspringen (Offline-Debug-Builds).
- Build-Metadaten in die Info.plist injiziert: `OpenClawBuildTimestamp` (UTC) und `OpenClawGitCommit` (kurzer Hash), damit der Bereich „About“ Build, Git und Debug-/Release-Kanal anzeigen kann.
- **Packaging verwendet standardmäßig Node 24**: Das Skript führt TS-Builds und den Build der Control UI aus. Node 22 LTS, derzeit `22.14+`, bleibt aus Kompatibilitätsgründen unterstützt.
- `SIGN_IDENTITY` aus der Umgebung liest. Fügen Sie `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (oder Ihr Developer-ID-Application-Zertifikat) zu Ihrer Shell-RC hinzu, um immer mit Ihrem Zertifikat zu signieren. Ad-hoc-Signierung erfordert explizites Opt-in über `ALLOW_ADHOC_SIGNING=1` oder `SIGN_IDENTITY="-"` (nicht empfohlen für Berechtigungstests).
- nach dem Signieren ein Team-ID-Audit ausführt und fehlschlägt, wenn irgendein Mach-O innerhalb des App-Bundles mit einer anderen Team-ID signiert ist. Setzen Sie `SKIP_TEAM_ID_CHECK=1`, um dies zu umgehen.

## Verwendung

```bash
# aus dem Repo-Root
scripts/package-mac-app.sh               # wählt Identität automatisch; Fehler, wenn keine gefunden wird
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # echtes Zertifikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # Ad-hoc (Berechtigungen bleiben nicht erhalten)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explizites Ad-hoc (derselbe Hinweis)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # nur für Entwicklung: Workaround bei Sparkle-Team-ID-Mismatch
```

### Hinweis zur Ad-hoc-Signierung

Beim Signieren mit `SIGN_IDENTITY="-"` (Ad-hoc) deaktiviert das Skript automatisch die **Hardened Runtime** (`--options runtime`). Das ist notwendig, um Abstürze zu verhindern, wenn die App versucht, eingebettete Frameworks (wie Sparkle) zu laden, die nicht dieselbe Team-ID teilen. Ad-hoc-Signaturen zerstören außerdem die Persistenz von TCC-Berechtigungen; Wiederherstellungsschritte finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Build-Metadaten für About

`package-mac-app.sh` versieht das Bundle mit:

- `OpenClawBuildTimestamp`: ISO8601 UTC zum Zeitpunkt des Packagings
- `OpenClawGitCommit`: kurzer Git-Hash (oder `unknown`, falls nicht verfügbar)

Der Tab „About“ liest diese Schlüssel, um Version, Build-Datum, Git-Commit und anzuzeigen, ob es sich um einen Debug-Build handelt (über `#if DEBUG`). Führen Sie den Packager nach Code-Änderungen aus, um diese Werte zu aktualisieren.

## Warum

TCC-Berechtigungen sind an den Bundle-Identifier _und_ die Code-Signatur gebunden. Unsigned Debug-Builds mit wechselnden UUIDs führten dazu, dass macOS nach jedem Rebuild die gewährten Berechtigungen vergaß. Das Signieren der Binärdateien (standardmäßig ad hoc) und das Beibehalten einer festen Bundle-ID/eines festen Pfads (`dist/OpenClaw.app`) erhält die Berechtigungen zwischen Builds und entspricht dem VibeTunnel-Ansatz.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
