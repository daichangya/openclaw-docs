---
read_when:
    - Die macOS-Entwicklungsumgebung einrichten
summary: Einrichtungsanleitung für Entwickler, die an der OpenClaw-macOS-App arbeiten
title: macOS-Dev-Setup
x-i18n:
    generated_at: "2026-04-24T06:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS-Entwickler-Setup

Diese Anleitung beschreibt die notwendigen Schritte, um die OpenClaw-macOS-App aus dem Quellcode zu bauen und auszuführen.

## Voraussetzungen

Bevor Sie die App bauen, stellen Sie sicher, dass Folgendes installiert ist:

1. **Xcode 26.2+**: Erforderlich für Swift-Entwicklung.
2. **Node.js 24 & pnpm**: Empfohlen für Gateway, CLI und Packaging-Skripte. Node 22 LTS, derzeit `22.14+`, bleibt aus Kompatibilitätsgründen unterstützt.

## 1. Abhängigkeiten installieren

Installieren Sie die projektweiten Abhängigkeiten:

```bash
pnpm install
```

## 2. App bauen und paketieren

Um die macOS-App zu bauen und in `dist/OpenClaw.app` zu paketieren, führen Sie aus:

```bash
./scripts/package-mac-app.sh
```

Wenn Sie kein Apple-Developer-ID-Zertifikat haben, verwendet das Skript automatisch **Ad-hoc-Signing** (`-`).

Für Dev-Run-Modi, Signing-Flags und Fehlerbehebung bei Team-ID-Problemen siehe das README der macOS-App:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Hinweis**: Ad-hoc-signierte Apps können Sicherheitsabfragen auslösen. Wenn die App sofort mit „Abort trap 6“ abstürzt, siehe den Abschnitt [Fehlerbehebung](#fehlerbehebung).

## 3. Die CLI installieren

Die macOS-App erwartet eine globale Installation der CLI `openclaw`, um Hintergrundaufgaben zu verwalten.

**Zur Installation (empfohlen):**

1. Öffnen Sie die OpenClaw-App.
2. Wechseln Sie zum Einstellungs-Tab **General**.
3. Klicken Sie auf **„Install CLI“**.

Alternativ können Sie sie manuell installieren:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` und `bun add -g openclaw@<version>` funktionieren ebenfalls.
Für die Gateway-Laufzeit bleibt Node der empfohlene Weg.

## Fehlerbehebung

### Build schlägt fehl: Nichtübereinstimmung von Toolchain oder SDK

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

### App stürzt bei Erteilen von Berechtigungen ab

Wenn die App abstürzt, wenn Sie Zugriff auf **Spracherkennung** oder **Mikrofon** erlauben möchten, kann dies an einem beschädigten TCC-Cache oder einer nicht passenden Signatur liegen.

**Lösung:**

1. Setzen Sie die TCC-Berechtigungen zurück:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Wenn das nicht hilft, ändern Sie die `BUNDLE_ID` vorübergehend in [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), um einen „sauberen Neustart“ aus Sicht von macOS zu erzwingen.

### Gateway bleibt dauerhaft bei „Starting...“

Wenn der Gateway-Status auf „Starting...“ stehen bleibt, prüfen Sie, ob ein Zombie-Prozess den Port hält:

```bash
openclaw gateway status
openclaw gateway stop

# Wenn Sie keinen LaunchAgent verwenden (Dev-Modus / manuelle Läufe), den Listener finden:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Wenn ein manueller Lauf den Port hält, stoppen Sie diesen Prozess (Ctrl+C). Als letztes Mittel beenden Sie die oben gefundene PID.

## Verwandt

- [macOS app](/de/platforms/macos)
- [Install overview](/de/install)
