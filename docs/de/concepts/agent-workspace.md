---
read_when:
    - Sie müssen den Agent-Workspace oder dessen Dateilayout erklären
    - Sie möchten einen Agent-Workspace sichern oder migrieren
summary: 'Agent-Workspace: Speicherort, Layout und Backup-Strategie'
title: Agent-Workspace
x-i18n:
    generated_at: "2026-04-24T06:33:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Der Workspace ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für
Datei-Tools und für den Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn wie Speicher.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldedaten und
Sitzungen gespeichert werden.

**Wichtig:** Der Workspace ist das **Standard-cwd**, keine harte Sandbox. Tools
lösen relative Pfade gegen den Workspace auf, aber absolute Pfade können weiterhin
andere Bereiche auf dem Host erreichen, sofern keine Sandbox aktiviert ist. Wenn Sie Isolierung benötigen, verwenden Sie
[`agents.defaults.sandbox`](/de/gateway/sandboxing) (und/oder agentenspezifische Sandbox-Konfiguration).
Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools
innerhalb eines Sandbox-Workspace unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.

## Standardspeicherort

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt und nicht `"default"` ist, lautet der Standard stattdessen
  `~/.openclaw/workspace-<profile>`.
- Überschreiben in `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` oder `openclaw setup` erstellen den
Workspace und legen die Bootstrap-Dateien an, wenn sie fehlen.
Seed-Kopien für die Sandbox akzeptieren nur reguläre Dateien innerhalb des Workspace; Symlink-/Hardlink-
Aliasse, die sich außerhalb des Quell-Workspace auflösen, werden ignoriert.

Wenn Sie die Workspace-Dateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-
Dateien deaktivieren:

```json5
{ agent: { skipBootstrap: true } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Mehrere Workspace-
Verzeichnisse gleichzeitig können zu verwirrender Drift bei Auth oder Status führen, da immer nur ein
Workspace aktiv ist.

**Empfehlung:** Behalten Sie einen einzelnen aktiven Workspace. Wenn Sie die
zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`).
Wenn Sie absichtlich mehrere Workspaces behalten, stellen Sie sicher, dass
`agents.defaults.workspace` auf den aktiven verweist.

`openclaw doctor` warnt, wenn zusätzliche Workspace-Verzeichnisse erkannt werden.

## Workspace-Dateizuordnung (Bedeutung der einzelnen Dateien)

Dies sind die Standarddateien, die OpenClaw im Workspace erwartet:

- `AGENTS.md`
  - Betriebsanweisungen für den Agenten und wie er Speicher verwenden soll.
  - Wird zu Beginn jeder Sitzung geladen.
  - Guter Ort für Regeln, Prioritäten und Details zum „Wie verhalten“.

- `SOUL.md`
  - Persona, Ton und Grenzen.
  - Wird in jeder Sitzung geladen.
  - Leitfaden: [SOUL.md Personality Guide](/de/concepts/soul)

- `USER.md`
  - Wer der Benutzer ist und wie er angesprochen werden soll.
  - Wird in jeder Sitzung geladen.

- `IDENTITY.md`
  - Name, Vibe und Emoji des Agenten.
  - Wird während des Bootstrap-Rituals erstellt/aktualisiert.

- `TOOLS.md`
  - Hinweise zu Ihren lokalen Tools und Konventionen.
  - Steuert nicht die Verfügbarkeit von Tools; dient nur als Orientierung.

- `HEARTBEAT.md`
  - Optionale kleine Checkliste für Heartbeat-Läufe.
  - Kurz halten, um Token-Verbrauch zu vermeiden.

- `BOOT.md`
  - Optionale Start-Checkliste, die beim Gateway-Neustart automatisch ausgeführt wird (wenn [internal hooks](/de/automation/hooks) aktiviert sind).
  - Kurz halten; für ausgehende Sends das Tool `message` verwenden.

- `BOOTSTRAP.md`
  - Einmaliges Ritual beim ersten Start.
  - Wird nur für einen brandneuen Workspace erstellt.
  - Nach Abschluss des Rituals löschen.

- `memory/YYYY-MM-DD.md`
  - Tägliches Speicherprotokoll (eine Datei pro Tag).
  - Empfohlen wird, beim Sitzungsstart den heutigen und gestrigen Eintrag zu lesen.

- `MEMORY.md` (optional)
  - Kuratierter Langzeitspeicher.
  - Nur in der Hauptsitzung und privaten Sitzung laden (nicht in gemeinsamen/Gruppenkontexten).

Siehe [Memory](/de/concepts/memory) für den Workflow und das automatische Leeren des Speichers.

- `skills/` (optional)
  - Workspace-spezifische Skills.
  - Speicherort mit höchster Priorität für Skills in diesem Workspace.
  - Überschreibt projektbezogene Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.

- `canvas/` (optional)
  - Canvas-UI-Dateien für Node-Displays (zum Beispiel `canvas/index.html`).

Wenn eine Bootstrap-Datei fehlt, injiziert OpenClaw einen Marker „missing file“ in
die Sitzung und fährt fort. Große Bootstrap-Dateien werden bei der Injektion abgeschnitten;
passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 12000) und
`agents.defaults.bootstrapTotalMaxChars` (Standard: 60000) an.
`openclaw setup` kann fehlende Standarddateien neu erstellen, ohne vorhandene
Dateien zu überschreiben.

## Was NICHT im Workspace ist

Diese befinden sich unter `~/.openclaw/` und sollten NICHT in das Workspace-Repository eingecheckt werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Auth-Profile für Modelle: OAuth + API-Schlüssel)
- `~/.openclaw/credentials/` (Kanal-/Provider-Status plus Legacy-OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungstranskripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie
außerhalb der Versionskontrolle.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Workspace als privaten Speicher. Legen Sie ihn in einem **privaten** Git-Repository ab, damit er
gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem das Gateway läuft (dort befindet sich der
Workspace).

### 1) Repository initialisieren

Wenn Git installiert ist, werden brandneue Workspaces automatisch initialisiert. Wenn dieser
Workspace noch kein Repository ist, führen Sie Folgendes aus:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Ein privates Remote hinzufügen (einsteigerfreundliche Optionen)

Option A: GitHub-Weboberfläche

1. Erstellen Sie auf GitHub ein neues **privates** Repository.
2. Nicht mit einer README initialisieren (vermeidet Merge-Konflikte).
3. Kopieren Sie die HTTPS-Remote-URL.
4. Fügen Sie das Remote hinzu und pushen Sie:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Option B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Option C: GitLab-Weboberfläche

1. Erstellen Sie auf GitLab ein neues **privates** Repository.
2. Nicht mit einer README initialisieren (vermeidet Merge-Konflikte).
3. Kopieren Sie die HTTPS-Remote-URL.
4. Fügen Sie das Remote hinzu und pushen Sie:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Laufende Aktualisierungen

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Keine Secrets committen

Selbst in einem privaten Repository sollten Sie vermeiden, Secrets im Workspace zu speichern:

- API-Schlüssel, OAuth-Tokens, Passwörter oder private Anmeldedaten.
- Alles unter `~/.openclaw/`.
- Rohe Dumps von Chats oder sensible Anhänge.

Wenn Sie sensible Referenzen speichern müssen, verwenden Sie Platzhalter und bewahren Sie das echte
Secret an anderer Stelle auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).

Vorgeschlagener Starter für `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Den Workspace auf einen neuen Rechner verschieben

1. Klonen Sie das Repository an den gewünschten Pfad (Standard `~/.openclaw/workspace`).
2. Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
3. Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
4. Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` vom
   alten Rechner separat.

## Erweiterte Hinweise

- Multi-Agent-Routing kann unterschiedliche Workspaces pro Agent verwenden. Siehe
  [Channel routing](/de/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen per Sitzung Sandbox-
  Workspaces unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Standing Orders](/de/automation/standing-orders) — persistente Anweisungen in Workspace-Dateien
- [Heartbeat](/de/gateway/heartbeat) — Workspace-Datei `HEARTBEAT.md`
- [Session](/de/concepts/session) — Speicherpfade für Sitzungen
- [Sandboxing](/de/gateway/sandboxing) — Workspace-Zugriff in Sandbox-Umgebungen
