---
read_when:
    - Sie reproduzierbare Installationen mit Rollback-Möglichkeit möchten
    - Sie bereits Nix/NixOS/Home Manager verwenden
    - Sie möchten, dass alles fixiert und deklarativ verwaltet wird
summary: OpenClaw deklarativ mit Nix installieren
title: Nix
x-i18n:
    generated_at: "2026-04-05T12:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Nix-Installation

Installieren Sie OpenClaw deklarativ mit **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- einem Home-Manager-Modul mit allem Nötigen.

<Info>
Das Repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) ist die maßgebliche Quelle für die Nix-Installation. Diese Seite ist ein kurzer Überblick.
</Info>

## Was Sie erhalten

- Gateway + macOS-App + Tools (whisper, spotify, cameras) -- alles fixiert
- Launchd-Dienst, der Neustarts übersteht
- Plugin-System mit deklarativer Konfiguration
- Sofortiges Rollback: `home-manager switch --rollback`

## Schnellstart

<Steps>
  <Step title="Determinate Nix installieren">
    Wenn Nix noch nicht installiert ist, folgen Sie den Anweisungen des [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Ein lokales Flake erstellen">
    Verwenden Sie die agent-first-Vorlage aus dem Repository nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Geheimnisse konfigurieren">
    Richten Sie Ihr Messaging-Bot-Token und den API-Schlüssel Ihres Modell-Providers ein. Einfache Dateien unter `~/.secrets/` funktionieren gut.
  </Step>
  <Step title="Platzhalter in der Vorlage ausfüllen und umschalten">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Überprüfen">
    Bestätigen Sie, dass der launchd-Dienst läuft und Ihr Bot auf Nachrichten antwortet.
  </Step>
</Steps>

Siehe die [nix-openclaw README](https://github.com/openclaw/nix-openclaw) für vollständige Moduloptionen und Beispiele.

## Laufzeitverhalten im Nix-Modus

Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist (automatisch mit nix-openclaw), wechselt OpenClaw in einen deterministischen Modus, der Auto-Installationsabläufe deaktiviert.

Sie können es auch manuell setzen:

```bash
export OPENCLAW_NIX_MODE=1
```

Unter macOS übernimmt die GUI-App Shell-Umgebungsvariablen nicht automatisch. Aktivieren Sie den Nix-Modus stattdessen über defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Was sich im Nix-Modus ändert

- Auto-Installations- und Selbstmodifikationsabläufe sind deaktiviert
- Fehlende Abhängigkeiten zeigen Nix-spezifische Hinweise zur Behebung an
- Die UI zeigt ein schreibgeschütztes Nix-Modus-Banner an

### Konfigurations- und Statuspfade

OpenClaw liest JSON5-Konfiguration aus `OPENCLAW_CONFIG_PATH` und speichert veränderbare Daten in `OPENCLAW_STATE_DIR`. Beim Ausführen unter Nix sollten Sie diese explizit auf von Nix verwaltete Orte setzen, damit Laufzeitstatus und Konfiguration aus dem unveränderlichen Store herausgehalten werden.

| Variable               | Standard                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

## Verwandt

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- vollständiger Einrichtungsleitfaden
- [Wizard](/de/start/wizard) -- CLI-Einrichtung ohne Nix
- [Docker](/install/docker) -- containerisierte Einrichtung
