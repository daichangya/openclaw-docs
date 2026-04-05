---
read_when:
    - Einrichten der macOS-Entwicklungsumgebung
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw macOS-App arbeiten
title: macOS-Entwicklereinrichtung
x-i18n:
    generated_at: "2026-04-05T12:49:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS-Entwicklereinrichtung

Diese Anleitung beschreibt die erforderlichen Schritte, um die OpenClaw macOS-Anwendung aus dem Quellcode zu bauen und auszuführen.

## Voraussetzungen

Bevor Sie die App bauen, stellen Sie sicher, dass Folgendes installiert ist:

1. **Xcode 26.2+**: Erforderlich für die Swift-Entwicklung.
2. **Node.js 24 & pnpm**: Empfohlen für das Gateway, die CLI und die Paketierungsskripte. Node 22 LTS, derzeit `22.14+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.

## 1. Abhängigkeiten installieren

Installieren Sie die projektweiten Abhängigkeiten:

```bash
pnpm install
```

## 2. Die App bauen und paketieren

Um die macOS-App zu bauen und in `dist/OpenClaw.app` zu paketieren, führen Sie Folgendes aus:

```bash
./scripts/package-mac-app.sh
```

Wenn Sie kein Apple Developer ID-Zertifikat haben, verwendet das Skript automatisch **Ad-hoc-Signierung** (`-`).

Informationen zu Entwicklungs-Ausführungsmodi, Signierungs-Flags und zur Fehlerbehebung bei der Team-ID finden Sie in der macOS-App-README:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Hinweis**: Ad-hoc-signierte Apps können Sicherheitsabfragen auslösen. Wenn die App sofort mit „Abort trap 6“ abstürzt, lesen Sie den Abschnitt [Fehlerbehebung](#troubleshooting).

## 3. Die CLI installieren

Die macOS-App erwartet eine globale `openclaw`-CLI-Installation, um Hintergrundaufgaben zu verwalten.

**So installieren Sie sie (empfohlen):**

1. Öffnen Sie die OpenClaw-App.
2. Wechseln Sie zur Registerkarte **General**.
3. Klicken Sie auf **"Install CLI"**.

Alternativ können Sie sie manuell installieren:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Für die Gateway-Laufzeit bleibt Node der empfohlene Weg.

## Fehlerbehebung

### Build schlägt fehl: Toolchain- oder SDK-Konflikt

Der Build der macOS-App erwartet das neueste macOS-SDK und die Swift-6.2-Toolchain.

**Systemabhängigkeiten (erforderlich):**

- **Neueste in Software Update verfügbare macOS-Version** (erforderlich für Xcode-26.2-SDKs)
- **Xcode 26.2** (Swift-6.2-Toolchain)

**Prüfungen:**

```bash
xcodebuild -version
xcrun swift --version
```

Wenn die Versionen nicht übereinstimmen, aktualisieren Sie macOS/Xcode und führen Sie den Build erneut aus.

### App stürzt bei der Berechtigungsfreigabe ab

Wenn die App abstürzt, wenn Sie **Speech Recognition**- oder **Microphone**-Zugriff erlauben möchten, kann dies an einem beschädigten TCC-Cache oder einer Signaturabweichung liegen.

**Behebung:**

1. Setzen Sie die TCC-Berechtigungen zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Falls das nicht hilft, ändern Sie `BUNDLE_ID` vorübergehend in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), um von macOS einen „sauberen Neustart“ zu erzwingen.

### Gateway bleibt unbegrenzt auf "Starting..."

Wenn der Gateway-Status auf "Starting..." stehen bleibt, prüfen Sie, ob ein Zombie-Prozess den Port belegt:

```bash
openclaw gateway status
openclaw gateway stop

# Wenn Sie keinen LaunchAgent verwenden (Entwicklungsmodus / manuelle Ausführungen), suchen Sie den Listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn eine manuelle Ausführung den Port belegt, stoppen Sie diesen Prozess (Strg+C). Töten Sie als letzten Ausweg die oben gefundene PID.
