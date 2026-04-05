---
read_when:
    - Starten einer neuen OpenClaw-Agent-Sitzung
    - Aktivieren oder Prüfen der Standard-Skills
summary: Standard-Agent-Anweisungen und Skills-Liste für die Einrichtung des persönlichen OpenClaw-Assistenten
title: Standard-AGENTS.md
x-i18n:
    generated_at: "2026-04-05T12:54:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Persönlicher OpenClaw-Assistent (Standard)

## Erster Start (empfohlen)

OpenClaw verwendet ein eigenes Workspace-Verzeichnis für den Agenten. Standard: `~/.openclaw/workspace` (konfigurierbar über `agents.defaults.workspace`).

1. Erstelle den Workspace, falls er noch nicht existiert:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Kopiere die Standard-Workspace-Vorlagen in den Workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Optional: Wenn du die Skills-Liste für den persönlichen Assistenten möchtest, ersetze AGENTS.md durch diese Datei:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optional: Wähle einen anderen Workspace, indem du `agents.defaults.workspace` setzt (unterstützt `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Standard-Sicherheitseinstellungen

- Gib keine Verzeichnisse oder Secrets im Chat aus.
- Führe keine destruktiven Befehle aus, sofern nicht ausdrücklich darum gebeten wurde.
- Sende keine teilweisen/streamenden Antworten an externe Messaging-Oberflächen (nur endgültige Antworten).

## Sitzungsstart (erforderlich)

- Lies `SOUL.md`, `USER.md` sowie heute+gestern in `memory/`.
- Lies `MEMORY.md`, falls vorhanden; greife nur auf das kleingeschriebene `memory.md` zurück, wenn `MEMORY.md` nicht vorhanden ist.
- Tue dies, bevor du antwortest.

## Soul (erforderlich)

- `SOUL.md` definiert Identität, Ton und Grenzen. Halte sie aktuell.
- Wenn du `SOUL.md` änderst, teile es dem Benutzer mit.
- Du bist in jeder Sitzung eine frische Instanz; Kontinuität lebt in diesen Dateien.

## Gemeinsame Bereiche (empfohlen)

- Du bist nicht die Stimme des Benutzers; sei in Gruppenchats oder öffentlichen Channels vorsichtig.
- Teile keine privaten Daten, Kontaktinformationen oder internen Notizen.

## Memory-System (empfohlen)

- Tagesprotokoll: `memory/YYYY-MM-DD.md` (erstelle `memory/`, falls nötig).
- Langzeit-Memory: `MEMORY.md` für dauerhafte Fakten, Präferenzen und Entscheidungen.
- Das kleingeschriebene `memory.md` ist nur ein älterer Fallback; halte nicht absichtlich beide Root-Dateien.
- Lies beim Sitzungsstart heute + gestern + `MEMORY.md`, falls vorhanden, andernfalls `memory.md`.
- Erfassen: Entscheidungen, Präferenzen, Einschränkungen, offene Schleifen.
- Vermeide Secrets, sofern nicht ausdrücklich gewünscht.

## Tools & Skills

- Tools leben in Skills; befolge die `SKILL.md` jedes Skills, wenn du ihn benötigst.
- Halte umgebungsspezifische Notizen in `TOOLS.md` fest (Notes for Skills).

## Backup-Tipp (empfohlen)

Wenn du diesen Workspace als „Memory“ von Clawd behandelst, mache ihn zu einem Git-Repository (idealerweise privat), damit `AGENTS.md` und deine Memory-Dateien gesichert sind.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Was OpenClaw tut

- Führt ein WhatsApp-Gateway + Pi-Coding-Agent aus, damit der Assistent Chats lesen/schreiben, Kontext abrufen und Skills über den Host-Mac ausführen kann.
- Die macOS-App verwaltet Berechtigungen (Bildschirmaufnahme, Mitteilungen, Mikrofon) und stellt die `openclaw` CLI über ihre gebündelte Binärdatei bereit.
- Direktchats werden standardmäßig in die `main`-Sitzung des Agenten zusammengeführt; Gruppen bleiben als `agent:<agentId>:<channel>:group:<id>` isoliert (Räume/Channels: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats halten Hintergrundaufgaben aktiv.

## Kern-Skills (in Einstellungen → Skills aktivieren)

- **mcporter** — Tool-Server-Laufzeit/CLI zur Verwaltung externer Skill-Backends.
- **Peekaboo** — Schnelle macOS-Screenshots mit optionaler KI-Bildanalyse.
- **camsnap** — Frames, Clips oder Bewegungsalarme von RTSP-/ONVIF-Sicherheitskameras erfassen.
- **oracle** — OpenAI-fähige Agent-CLI mit Sitzungswiedergabe und Browser-Steuerung.
- **eightctl** — Steuere deinen Schlaf aus dem Terminal.
- **imsg** — iMessage & SMS senden, lesen, streamen.
- **wacli** — WhatsApp-CLI: synchronisieren, suchen, senden.
- **discord** — Discord-Aktionen: Reaktionen, Sticker, Umfragen. Verwende Ziele vom Typ `user:<id>` oder `channel:<id>` (bloße numerische IDs sind mehrdeutig).
- **gog** — Google-Suite-CLI: Gmail, Kalender, Drive, Kontakte.
- **spotify-player** — Terminal-Spotify-Client zum Suchen/Warteschlange-Verwalten/Steuern der Wiedergabe.
- **sag** — ElevenLabs-Speech mit `say`-ähnlicher UX im Mac-Stil; streamt standardmäßig an Lautsprecher.
- **Sonos CLI** — Sonos-Lautsprecher (Discovery/Status/Wiedergabe/Lautstärke/Gruppierung) aus Skripten steuern.
- **blucli** — BluOS-Player aus Skripten wiedergeben, gruppieren und automatisieren.
- **OpenHue CLI** — Philips-Hue-Lichtsteuerung für Szenen und Automatisierungen.
- **OpenAI Whisper** — Lokales Speech-to-Text für schnelles Diktieren und Voicemail-Transkripte.
- **Gemini CLI** — Google-Gemini-Modelle aus dem Terminal für schnelles Q&A.
- **agent-tools** — Hilfs-Toolkit für Automatisierungen und Helper-Skripte.

## Nutzungshinweise

- Bevorzuge für Skripting die `openclaw` CLI; die Mac-App verwaltet Berechtigungen.
- Führe Installationen über den Tab Skills aus; die Schaltfläche wird ausgeblendet, wenn bereits eine Binärdatei vorhanden ist.
- Halte Heartbeats aktiviert, damit der Assistent Erinnerungen planen, Posteingänge überwachen und Kameraaufnahmen auslösen kann.
- Die Canvas-UI läuft im Vollbildmodus mit nativen Overlays. Platziere keine kritischen Steuerelemente oben links/oben rechts/an den unteren Rändern; füge im Layout explizite Abstände hinzu und verlasse dich nicht auf Safe-Area-Insets.
- Für browsergestützte Verifikation verwende `openclaw browser` (Tabs/Status/Screenshot) mit dem von OpenClaw verwalteten Chrome-Profil.
- Für DOM-Inspektion verwende `openclaw browser eval|query|dom|snapshot` (und `--json`/`--out`, wenn du maschinenlesbare Ausgabe benötigst).
- Für Interaktionen verwende `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type erfordern Snapshot-Referenzen; verwende `evaluate` für CSS-Selektoren).
