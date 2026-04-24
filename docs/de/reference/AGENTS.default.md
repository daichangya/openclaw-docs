---
read_when:
    - Eine neue OpenClaw-Agentensitzung starten
    - Standard-Skills aktivieren oder prüfen
summary: Standard-Agentenanweisungen und Skills-Liste von OpenClaw für das persönliche Assistenten-Setup
title: Standard-AGENTS.md
x-i18n:
    generated_at: "2026-04-24T06:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw Personal Assistant (Standard)

## Erster Start (empfohlen)

OpenClaw verwendet ein dediziertes Workspace-Verzeichnis für den Agenten. Standard: `~/.openclaw/workspace` (konfigurierbar über `agents.defaults.workspace`).

1. Erstellen Sie den Workspace (falls er noch nicht existiert):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Kopieren Sie die Standard-Workspace-Vorlagen in den Workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Optional: Wenn Sie die Skills-Liste für den persönlichen Assistenten möchten, ersetzen Sie AGENTS.md durch diese Datei:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optional: Wählen Sie einen anderen Workspace, indem Sie `agents.defaults.workspace` setzen (`~` wird unterstützt):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Sicherheitsstandards

- Keine Verzeichnisse oder Secrets in den Chat dumpen.
- Keine destruktiven Befehle ausführen, sofern dies nicht ausdrücklich angefordert wurde.
- Keine teilweisen/gestreamten Antworten an externe Messaging-Oberflächen senden (nur finale Antworten).

## Sitzungsstart (erforderlich)

- Lesen Sie `SOUL.md`, `USER.md` und heute+gestern in `memory/`.
- Lesen Sie `MEMORY.md`, wenn vorhanden.
- Tun Sie das, bevor Sie antworten.

## Soul (erforderlich)

- `SOUL.md` definiert Identität, Ton und Grenzen. Halten Sie diese Datei aktuell.
- Wenn Sie `SOUL.md` ändern, informieren Sie den Benutzer.
- Sie sind in jeder Sitzung eine frische Instanz; Kontinuität lebt in diesen Dateien.

## Geteilte Räume (empfohlen)

- Sie sind nicht die Stimme des Benutzers; seien Sie in Gruppenchats oder öffentlichen Kanälen vorsichtig.
- Teilen Sie keine privaten Daten, Kontaktdaten oder internen Notizen.

## Memory-System (empfohlen)

- Tagesprotokoll: `memory/YYYY-MM-DD.md` (erstellen Sie `memory/`, falls nötig).
- Langzeitspeicher: `MEMORY.md` für dauerhafte Fakten, Präferenzen und Entscheidungen.
- Klein geschriebenes `memory.md` ist nur für Legacy-Reparatureingaben gedacht; behalten Sie nicht absichtlich beide Root-Dateien.
- Lesen Sie beim Sitzungsstart heute + gestern + `MEMORY.md`, wenn vorhanden.
- Erfassen Sie: Entscheidungen, Präferenzen, Einschränkungen, offene Schleifen.
- Vermeiden Sie Secrets, sofern nicht ausdrücklich gewünscht.

## Tools & Skills

- Tools leben in Skills; folgen Sie der `SKILL.md` jeder Skill, wenn Sie sie benötigen.
- Halten Sie umgebungsspezifische Hinweise in `TOOLS.md` fest (Hinweise für Skills).

## Backup-Tipp (empfohlen)

Wenn Sie diesen Workspace als „Memory“ von Clawd behandeln, machen Sie daraus ein Git-Repository (idealerweise privat), damit `AGENTS.md` und Ihre Memory-Dateien gesichert werden.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: ein privates Remote hinzufügen + pushen
```

## Was OpenClaw tut

- Führt WhatsApp-Gateway + Pi-Coding-Agent aus, damit der Assistent Chats lesen/schreiben, Kontext abrufen und Skills über den Host-Mac ausführen kann.
- Die macOS-App verwaltet Berechtigungen (Bildschirmaufnahme, Benachrichtigungen, Mikrofon) und stellt die CLI `openclaw` über ihre gebündelte Binärdatei bereit.
- Direktchats werden standardmäßig in die `main`-Sitzung des Agenten zusammengeführt; Gruppen bleiben isoliert als `agent:<agentId>:<channel>:group:<id>` (Räume/Kanäle: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats halten Hintergrundaufgaben aktiv.

## Kern-Skills (aktivieren in Einstellungen → Skills)

- **mcporter** — Tool-Server-Laufzeit/CLI zum Verwalten externer Skill-Backends.
- **Peekaboo** — Schnelle macOS-Screenshots mit optionaler KI-Bildanalyse.
- **camsnap** — Frames, Clips oder Bewegungsalarme von RTSP-/ONVIF-Sicherheitskameras erfassen.
- **oracle** — OpenAI-fähige Agenten-CLI mit Sitzungs-Replay und Browser-Steuerung.
- **eightctl** — Steuern Sie Ihren Schlaf vom Terminal aus.
- **imsg** — iMessage & SMS senden, lesen, streamen.
- **wacli** — WhatsApp-CLI: synchronisieren, suchen, senden.
- **discord** — Discord-Aktionen: reagieren, Sticker, Umfragen. Verwenden Sie Ziele vom Typ `user:<id>` oder `channel:<id>` (bloße numerische IDs sind mehrdeutig).
- **gog** — Google-Suite-CLI: Gmail, Kalender, Drive, Kontakte.
- **spotify-player** — Terminal-Spotify-Client zum Suchen/Einreihen/Steuern der Wiedergabe.
- **sag** — ElevenLabs-Sprachausgabe mit `say`-ähnlicher UX auf dem Mac; streamt standardmäßig auf Lautsprecher.
- **Sonos CLI** — Sonos-Lautsprecher (Entdecken/Status/Wiedergabe/Lautstärke/Gruppierung) aus Skripten steuern.
- **blucli** — BluOS-Player aus Skripten abspielen, gruppieren und automatisieren.
- **OpenHue CLI** — Philips-Hue-Lichtsteuerung für Szenen und Automatisierungen.
- **OpenAI Whisper** — Lokale Speech-to-Text für schnelles Diktieren und Voicemail-Transkripte.
- **Gemini CLI** — Google-Gemini-Modelle vom Terminal aus für schnelle Fragen und Antworten.
- **agent-tools** — Utility-Toolkit für Automatisierungen und Hilfsskripte.

## Nutzungshinweise

- Bevorzugen Sie für Skripting die CLI `openclaw`; die Mac-App verwaltet Berechtigungen.
- Starten Sie Installationen über den Tab Skills; die Schaltfläche wird ausgeblendet, wenn bereits eine Binärdatei vorhanden ist.
- Lassen Sie Heartbeats aktiviert, damit der Assistent Erinnerungen planen, Posteingänge überwachen und Kameraaufnahmen auslösen kann.
- Canvas UI läuft im Vollbild mit nativen Overlays. Vermeiden Sie es, kritische Steuerelemente oben links/oben rechts oder an den unteren Rändern zu platzieren; fügen Sie dem Layout explizite Ränder hinzu und verlassen Sie sich nicht auf Safe-Area-Insets.
- Für browsergesteuerte Verifikation verwenden Sie `openclaw browser` (Tabs/Status/Screenshot) mit dem von OpenClaw verwalteten Chrome-Profil.
- Für DOM-Inspektion verwenden Sie `openclaw browser eval|query|dom|snapshot` (und `--json`/`--out`, wenn Sie maschinelle Ausgabe benötigen).
- Für Interaktionen verwenden Sie `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type erfordern Snapshot-Refs; verwenden Sie `evaluate` für CSS-Selektoren).

## Verwandt

- [Agent workspace](/de/concepts/agent-workspace)
- [Agent runtime](/de/concepts/agent)
