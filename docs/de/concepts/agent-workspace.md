---
read_when:
    - Sie müssen den Agent-Workspace oder sein Dateilayout erklären
    - Sie möchten einen Agent-Workspace sichern oder migrieren
summary: 'Agent-Workspace: Speicherort, Layout und Backup-Strategie'
title: Agent-Workspace
x-i18n:
    generated_at: "2026-04-05T12:39:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Agent-Workspace

Der Workspace ist das Zuhause des Agenten. Er ist das einzige Arbeitsverzeichnis, das für
Datei-Tools und für den Workspace-Kontext verwendet wird. Halten Sie ihn privat und behandeln Sie ihn wie Gedächtnis.

Dies ist getrennt von `~/.openclaw/`, wo Konfiguration, Anmeldeinformationen und
Sitzungen gespeichert werden.

**Wichtig:** Der Workspace ist das **Standard-`cwd`**, keine harte Sandbox. Tools
lösen relative Pfade gegen den Workspace auf, aber absolute Pfade können weiterhin
andere Orte auf dem Host erreichen, sofern keine Sandbox aktiviert ist. Wenn Sie Isolation benötigen, verwenden Sie
[`agents.defaults.sandbox`](/gateway/sandboxing) (und/oder Sandbox-Konfiguration pro Agent).
Wenn Sandboxing aktiviert ist und `workspaceAccess` nicht `"rw"` ist, arbeiten Tools
innerhalb eines Sandbox-Workspaces unter `~/.openclaw/sandboxes`, nicht in Ihrem Host-Workspace.

## Standardspeicherort

- Standard: `~/.openclaw/workspace`
- Wenn `OPENCLAW_PROFILE` gesetzt und nicht `"default"` ist, wird der Standard zu
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
Workspace und legen die Bootstrap-Dateien an, falls sie fehlen.
Kopien für die Sandbox-Initialisierung akzeptieren nur reguläre Dateien innerhalb des Workspaces; Symlink-/Hardlink-
Aliasse, die außerhalb des Quell-Workspaces aufgelöst werden, werden ignoriert.

Wenn Sie die Workspace-Dateien bereits selbst verwalten, können Sie die Erstellung von Bootstrap-
Dateien deaktivieren:

```json5
{ agent: { skipBootstrap: true } }
```

## Zusätzliche Workspace-Ordner

Ältere Installationen haben möglicherweise `~/openclaw` erstellt. Das Beibehalten mehrerer Workspace-
Verzeichnisse kann zu verwirrenden Abweichungen bei Auth oder Status führen, weil immer nur ein
Workspace gleichzeitig aktiv ist.

**Empfehlung:** Behalten Sie einen einzigen aktiven Workspace. Wenn Sie die
zusätzlichen Ordner nicht mehr verwenden, archivieren Sie sie oder verschieben Sie sie in den Papierkorb (zum Beispiel `trash ~/openclaw`).
Wenn Sie absichtlich mehrere Workspaces behalten, stellen Sie sicher, dass
`agents.defaults.workspace` auf den aktiven zeigt.

`openclaw doctor` warnt, wenn zusätzliche Workspace-Verzeichnisse erkannt werden.

## Workspace-Dateiübersicht (Bedeutung der einzelnen Dateien)

Dies sind die Standarddateien, die OpenClaw im Workspace erwartet:

- `AGENTS.md`
  - Betriebsanweisungen für den Agenten und wie er Gedächtnis verwenden soll.
  - Wird zu Beginn jeder Sitzung geladen.
  - Guter Ort für Regeln, Prioritäten und Details dazu, „wie man sich verhalten soll“.

- `SOUL.md`
  - Persona, Tonfall und Grenzen.
  - Wird in jeder Sitzung geladen.
  - Leitfaden: [SOUL.md Personality Guide](/concepts/soul)

- `USER.md`
  - Wer der Benutzer ist und wie er angesprochen werden soll.
  - Wird in jeder Sitzung geladen.

- `IDENTITY.md`
  - Name, Vibe und Emoji des Agenten.
  - Wird während des Bootstrap-Rituals erstellt/aktualisiert.

- `TOOLS.md`
  - Hinweise zu Ihren lokalen Tools und Konventionen.
  - Steuert nicht die Tool-Verfügbarkeit; es ist nur Orientierung.

- `HEARTBEAT.md`
  - Optionale kleine Checkliste für Heartbeat-Ausführungen.
  - Halten Sie sie kurz, um Token-Verbrauch zu vermeiden.

- `BOOT.md`
  - Optionale Start-Checkliste, die beim Gateway-Neustart ausgeführt wird, wenn interne Hooks aktiviert sind.
  - Halten Sie sie kurz; verwenden Sie das `message`-Tool für ausgehende Sendungen.

- `BOOTSTRAP.md`
  - Einmaliges Ritual beim ersten Start.
  - Wird nur für einen brandneuen Workspace erstellt.
  - Löschen Sie die Datei, nachdem das Ritual abgeschlossen ist.

- `memory/YYYY-MM-DD.md`
  - Tägliches Gedächtnisprotokoll (eine Datei pro Tag).
  - Es wird empfohlen, beim Sitzungsstart den heutigen und gestrigen Eintrag zu lesen.

- `MEMORY.md` (optional)
  - Kuratiertes Langzeitgedächtnis.
  - Nur in der privaten Hauptsitzung laden (nicht in geteilten/Gruppenkontexten).

Siehe [Memory](/concepts/memory) für den Ablauf und das automatische Leeren des Gedächtnisses.

- `skills/` (optional)
  - Workspace-spezifische Skills.
  - Speicherort mit der höchsten Priorität für Skills in diesem Workspace.
  - Überschreibt Projekt-Agent-Skills, persönliche Agent-Skills, verwaltete Skills, gebündelte Skills und `skills.load.extraDirs`, wenn Namen kollidieren.

- `canvas/` (optional)
  - Canvas-UI-Dateien für Knotendarstellungen (zum Beispiel `canvas/index.html`).

Wenn eine Bootstrap-Datei fehlt, fügt OpenClaw einen Marker „fehlende Datei“ in
die Sitzung ein und fährt fort. Große Bootstrap-Dateien werden beim Einfügen abgeschnitten;
passen Sie die Limits mit `agents.defaults.bootstrapMaxChars` (Standard: 20000) und
`agents.defaults.bootstrapTotalMaxChars` (Standard: 150000) an.
`openclaw setup` kann fehlende Standarddateien wiederherstellen, ohne vorhandene
Dateien zu überschreiben.

## Was sich NICHT im Workspace befindet

Diese Dateien liegen unter `~/.openclaw/` und sollten NICHT in das Workspace-Repo committet werden:

- `~/.openclaw/openclaw.json` (Konfiguration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (Modell-Auth-Profile: OAuth + API-Schlüssel)
- `~/.openclaw/credentials/` (Kanal-/Provider-Status plus Legacy-OAuth-Importdaten)
- `~/.openclaw/agents/<agentId>/sessions/` (Sitzungs-Transkripte + Metadaten)
- `~/.openclaw/skills/` (verwaltete Skills)

Wenn Sie Sitzungen oder Konfiguration migrieren müssen, kopieren Sie sie separat und halten Sie sie
außerhalb der Versionsverwaltung.

## Git-Backup (empfohlen, privat)

Behandeln Sie den Workspace als privates Gedächtnis. Legen Sie ihn in ein **privates** Git-Repo, damit er
gesichert und wiederherstellbar ist.

Führen Sie diese Schritte auf dem Rechner aus, auf dem das Gateway läuft (dort befindet sich der
Workspace).

### 1) Das Repo initialisieren

Wenn Git installiert ist, werden brandneue Workspaces automatisch initialisiert. Wenn dieser
Workspace noch kein Repo ist, führen Sie Folgendes aus:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Ein privates Remote hinzufügen (einsteigerfreundliche Optionen)

Option A: GitHub-Web-UI

1. Erstellen Sie auf GitHub ein neues **privates** Repository.
2. Initialisieren Sie es nicht mit einer README-Datei (vermeidet Merge-Konflikte).
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

Option C: GitLab-Web-UI

1. Erstellen Sie auf GitLab ein neues **privates** Repository.
2. Initialisieren Sie es nicht mit einer README-Datei (vermeidet Merge-Konflikte).
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

Auch in einem privaten Repo sollten Sie vermeiden, Secrets im Workspace zu speichern:

- API-Schlüssel, OAuth-Token, Passwörter oder private Anmeldeinformationen.
- Alles unter `~/.openclaw/`.
- Rohe Dumps von Chats oder sensiblen Anhängen.

Wenn Sie sensible Referenzen speichern müssen, verwenden Sie Platzhalter und bewahren Sie das eigentliche
Secret an einem anderen Ort auf (Passwortmanager, Umgebungsvariablen oder `~/.openclaw/`).

Vorschlag für einen `.gitignore`-Startpunkt:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Den Workspace auf einen neuen Rechner verschieben

1. Klonen Sie das Repo in den gewünschten Pfad (Standard `~/.openclaw/workspace`).
2. Setzen Sie `agents.defaults.workspace` in `~/.openclaw/openclaw.json` auf diesen Pfad.
3. Führen Sie `openclaw setup --workspace <path>` aus, um fehlende Dateien anzulegen.
4. Wenn Sie Sitzungen benötigen, kopieren Sie `~/.openclaw/agents/<agentId>/sessions/` vom
   alten Rechner separat.

## Erweiterte Hinweise

- Multi-Agent-Routing kann unterschiedliche Workspaces pro Agent verwenden. Siehe
  [Kanal-Routing](/channels/channel-routing) für die Routing-Konfiguration.
- Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen Sandbox-
  Workspaces pro Sitzung unter `agents.defaults.sandbox.workspaceRoot` verwenden.

## Verwandt

- [Standing Orders](/automation/standing-orders) — persistente Anweisungen in Workspace-Dateien
- [Heartbeat](/gateway/heartbeat) — Workspace-Datei HEARTBEAT.md
- [Session](/concepts/session) — Speicherpfade für Sitzungen
- [Sandboxing](/gateway/sandboxing) — Workspace-Zugriff in sandboxed Umgebungen
