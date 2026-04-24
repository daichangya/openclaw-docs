---
read_when:
    - Broadcast-Gruppen konfigurieren
    - Fehlerbehebung bei Antworten mehrerer Agenten in WhatsApp
status: experimental
summary: Eine WhatsApp-Nachricht an mehrere Agenten senden
title: Broadcast-Gruppen
x-i18n:
    generated_at: "2026-04-24T06:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Status:** Experimentell  
**Version:** Hinzugefügt in 2026.1.9

## Überblick

Broadcast Groups ermöglichen es mehreren Agenten, dieselbe Nachricht gleichzeitig zu verarbeiten und darauf zu antworten. So können Sie spezialisierte Agenten-Teams erstellen, die in einer einzigen WhatsApp-Gruppe oder DM zusammenarbeiten — und dabei nur eine Telefonnummer verwenden.

Aktueller Umfang: **nur WhatsApp** (Web-Channel).

Broadcast-Gruppen werden nach Channel-Allowlists und Gruppenaktivierungsregeln ausgewertet. In WhatsApp-Gruppen bedeutet das, dass Broadcasts stattfinden, wenn OpenClaw normalerweise antworten würde (zum Beispiel bei Erwähnung, abhängig von Ihren Gruppeneinstellungen).

## Anwendungsfälle

### 1. Spezialisierte Agenten-Teams

Stellen Sie mehrere Agenten mit klar abgegrenzten, fokussierten Aufgaben bereit:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Jeder Agent verarbeitet dieselbe Nachricht und liefert seine spezialisierte Perspektive.

### 2. Unterstützung für mehrere Sprachen

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Qualitätssicherungs-Workflows

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Aufgabenautomatisierung

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Konfiguration

### Grundlegende Einrichtung

Fügen Sie einen `broadcast`-Abschnitt auf oberster Ebene hinzu (neben `bindings`). Die Schlüssel sind WhatsApp-Peer-IDs:

- Gruppenchats: Gruppen-JID (z. B. `120363403215116621@g.us`)
- DMs: E.164-Telefonnummer (z. B. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Ergebnis:** Wenn OpenClaw in diesem Chat antworten würde, führt es alle drei Agenten aus.

### Verarbeitungsstrategie

Steuern Sie, wie Agenten Nachrichten verarbeiten:

#### Parallel (Standard)

Alle Agenten verarbeiten gleichzeitig:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequentiell

Agenten verarbeiten der Reihe nach (einer wartet, bis der vorherige fertig ist):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Vollständiges Beispiel

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Funktionsweise

### Nachrichtenfluss

1. **Eine eingehende Nachricht** trifft in einer WhatsApp-Gruppe ein
2. **Broadcast-Prüfung**: Das System prüft, ob die Peer-ID in `broadcast` enthalten ist
3. **Wenn sie in der Broadcast-Liste enthalten ist**:
   - Alle aufgeführten Agenten verarbeiten die Nachricht
   - Jeder Agent hat seinen eigenen Sitzungsschlüssel und isolierten Kontext
   - Agenten verarbeiten parallel (Standard) oder sequentiell
4. **Wenn sie nicht in der Broadcast-Liste enthalten ist**:
   - Es gilt das normale Routing (erste passende Bindung)

Hinweis: Broadcast-Gruppen umgehen weder Channel-Allowlists noch Gruppenaktivierungsregeln (Erwähnungen/Befehle/usw.). Sie ändern nur, _welche Agenten ausgeführt werden_, wenn eine Nachricht zur Verarbeitung berechtigt ist.

### Sitzungsisolierung

Jeder Agent in einer Broadcast-Gruppe verwaltet vollständig getrennt:

- **Sitzungsschlüssel** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Konversationsverlauf** (der Agent sieht die Nachrichten anderer Agenten nicht)
- **Workspace** (separate Sandboxes, falls konfiguriert)
- **Tool-Zugriff** (unterschiedliche Allow-/Deny-Listen)
- **Memory/Kontext** (separate `IDENTITY.md`, `SOUL.md` usw.)
- **Gruppenkontextpuffer** (aktuelle Gruppennachrichten, die als Kontext verwendet werden) wird pro Peer gemeinsam genutzt, sodass alle Broadcast-Agenten beim Auslösen denselben Kontext sehen

Dadurch kann jeder Agent Folgendes haben:

- Unterschiedliche Persönlichkeiten
- Unterschiedlichen Tool-Zugriff (z. B. schreibgeschützt vs. Lesen/Schreiben)
- Unterschiedliche Modelle (z. B. opus vs. sonnet)
- Unterschiedliche installierte Skills

### Beispiel: Isolierte Sitzungen

In der Gruppe `120363403215116621@g.us` mit den Agenten `["alfred", "baerbel"]`:

**Alfreds Kontext:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Bärbels Kontext:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Bewährte Verfahren

### 1. Halten Sie Agenten fokussiert

Entwerfen Sie jeden Agenten mit einer einzelnen, klaren Aufgabe:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Gut:** Jeder Agent hat genau eine Aufgabe  
❌ **Schlecht:** Ein allgemeiner Agent „dev-helper“

### 2. Verwenden Sie aussagekräftige Namen

Machen Sie klar, was jeder Agent tut:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Unterschiedlichen Tool-Zugriff konfigurieren

Geben Sie Agenten nur die Tools, die sie benötigen:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Schreibgeschützt
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Lesen/Schreiben
    }
  }
}
```

### 4. Performance überwachen

Bei vielen Agenten sollten Sie Folgendes berücksichtigen:

- Verwenden Sie `"strategy": "parallel"` (Standard) für Geschwindigkeit
- Beschränken Sie Broadcast-Gruppen auf 5–10 Agenten
- Verwenden Sie schnellere Modelle für einfachere Agenten

### 5. Fehler robust behandeln

Agenten schlagen unabhängig voneinander fehl. Der Fehler eines Agenten blockiert die anderen nicht:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Kompatibilität

### Anbieter

Broadcast-Gruppen funktionieren derzeit mit:

- ✅ WhatsApp (implementiert)
- 🚧 Telegram (geplant)
- 🚧 Discord (geplant)
- 🚧 Slack (geplant)

### Routing

Broadcast-Gruppen funktionieren zusammen mit bestehendem Routing:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Nur alfred antwortet (normales Routing)
- `GROUP_B`: agent1 UND agent2 antworten (Broadcast)

**Priorität:** `broadcast` hat Vorrang vor `bindings`.

## Fehlerbehebung

### Agenten antworten nicht

**Prüfen Sie:**

1. Die Agenten-IDs existieren in `agents.list`
2. Das Peer-ID-Format ist korrekt (z. B. `120363403215116621@g.us`)
3. Agenten befinden sich nicht in Deny-Listen

**Debugging:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Nur ein Agent antwortet

**Ursache:** Die Peer-ID befindet sich möglicherweise in `bindings`, aber nicht in `broadcast`.

**Lösung:** Zur Broadcast-Konfiguration hinzufügen oder aus `bindings` entfernen.

### Performance-Probleme

**Wenn es mit vielen Agenten langsam ist:**

- Verringern Sie die Anzahl der Agenten pro Gruppe
- Verwenden Sie leichtere Modelle (sonnet statt opus)
- Prüfen Sie die Startzeit der Sandbox

## Beispiele

### Beispiel 1: Code-Review-Team

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Benutzer sendet:** Code-Snippet  
**Antworten:**

- code-formatter: „Einrückung korrigiert und Typ-Hinweise hinzugefügt“
- security-scanner: „⚠️ SQL-Injection-Schwachstelle in Zeile 12“
- test-coverage: „Die Abdeckung liegt bei 45 %, Tests für Fehlerfälle fehlen“
- docs-checker: „Fehlender Docstring für die Funktion `process_data`“

### Beispiel 2: Mehrsprachiger Support

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API-Referenz

### Konfigurationsschema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Felder

- `strategy` (optional): Wie Agenten verarbeitet werden
  - `"parallel"` (Standard): Alle Agenten verarbeiten gleichzeitig
  - `"sequential"`: Agenten verarbeiten in der Reihenfolge des Arrays
- `[peerId]`: WhatsApp-Gruppen-JID, E.164-Nummer oder andere Peer-ID
  - Wert: Array von Agenten-IDs, die Nachrichten verarbeiten sollen

## Einschränkungen

1. **Max. Agenten:** Kein festes Limit, aber 10+ Agenten können langsam sein
2. **Gemeinsamer Kontext:** Agenten sehen die Antworten der anderen nicht (absichtlich)
3. **Nachrichtenreihenfolge:** Parallele Antworten können in beliebiger Reihenfolge eintreffen
4. **Ratenbegrenzungen:** Alle Agenten zählen gegen die WhatsApp-Ratenbegrenzungen

## Zukünftige Erweiterungen

Geplante Funktionen:

- [ ] Modus für gemeinsamen Kontext (Agenten sehen die Antworten der anderen)
- [ ] Agentenkoordination (Agenten können sich gegenseitig Signale senden)
- [ ] Dynamische Agentenauswahl (Auswahl von Agenten basierend auf dem Nachrichteninhalt)
- [ ] Agentenprioritäten (einige Agenten antworten vor anderen)

## Verwandt

- [Gruppen](/de/channels/groups)
- [Channel-Routing](/de/channels/channel-routing)
- [Pairing](/de/channels/pairing)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Sitzungsverwaltung](/de/concepts/session)
