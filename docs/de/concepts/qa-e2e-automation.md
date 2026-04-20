---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen von repo-gestützten QA-Szenarien
    - Erstellen realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsstruktur für qa-lab, qa-channel, vorab definierte Szenarien und Protokollberichte
title: QA-End-to-End-Automatisierung
x-i18n:
    generated_at: "2026-04-20T06:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-End-to-End-Automatisierung

Der private QA-Stack ist dafür gedacht, OpenClaw auf eine realistischere,
kanalähnliche Weise zu testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Workflow ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan zeigt.

Führe es aus mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, der Docker-gestützte Gateway-Lane gestartet und
die QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine
Automatisierungsschleife dem Agenten eine QA-Mission geben, echtes Kanalverhalten
beobachten und dokumentieren kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert blieb.

Für schnellere QA-Lab-UI-Iterationen, ohne das Docker-Image jedes Mal neu zu
bauen, starte den Stack mit einem per Bind-Mount eingebundenen QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Services auf einem vorab gebauten Image und
bind-mountet `extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu,
wenn sich der QA-Lab-Asset-Hash ändert.

Für einen transportechten Matrix-Smoke-Lane führe aus:

```bash
pnpm openclaw qa matrix
```

Dieser Lane stellt in Docker einen temporären Tuwunel-Homeserver bereit,
registriert temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen
privaten Raum und führt dann das echte Matrix-Plugin innerhalb eines QA-Gateway-
Child-Prozesses aus. Der Live-Transport-Lane hält die Child-Konfiguration auf
den getesteten Transport beschränkt, sodass Matrix ohne `qa-channel` in der
Child-Konfiguration läuft. Er schreibt die strukturierten Berichtsartefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis.
Um auch die äußere Build-/Launcher-Ausgabe von `scripts/run-node.mjs` zu
erfassen, setze `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale
Logdatei.

Für einen transportechten Telegram-Smoke-Lane führe aus:

```bash
pnpm openclaw qa telegram
```

Dieser Lane verwendet eine echte private Telegram-Gruppe, anstatt einen
temporären Server bereitzustellen. Er erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in
derselben privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben,
und die Bot-zu-Bot-Beobachtung funktioniert am besten, wenn bei beiden Bots der
Bot-to-Bot Communication Mode in `@BotFather` aktiviert ist.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt.
Verwende `--allow-failures`, wenn du Artefakte ohne fehlschlagenden Exit-Code
haben möchtest.

Live-Transport-Lanes teilen jetzt einen kleineren gemeinsamen Vertrag, anstatt
dass jeder seine eigene Form für die Szenarioliste definiert:

`qa-channel` bleibt die umfassende Suite für synthetisches Produktverhalten und
ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Erwähnungs-Gating | Allowlist-Blockierung | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Nachverfolgung | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | ----------------- | --------------------- | -------------------------- | -------------------- | --------------------- | ---------------- | -------------------- | ----------- |
| Matrix   | x      | x                 | x                     | x                          | x                    | x                     | x                | x                    |             |
| Telegram | x      |                   |                       |                            |                      |                       |                  |                      | x           |

Dadurch bleibt `qa-channel` die umfassende Suite für Produktverhalten, während
Matrix, Telegram und künftige Live-Transporte eine explizite Checkliste für
Transportverträge gemeinsam nutzen.

Für einen temporären Linux-VM-Lane, ohne Docker in den QA-Pfad einzubinden,
führe aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert,
OpenClaw innerhalb des Gasts gebaut, `qa suite` ausgeführt und dann der normale
QA-Bericht und die Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem
Host kopiert.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte
Szenarien parallel mit isolierten Gateway-Workern aus. `qa-channel` verwendet
standardmäßig eine Parallelität von 4, begrenzt durch die Anzahl der
ausgewählten Szenarien. Verwende `--concurrency <count>`, um die Anzahl der
Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt.
Verwende `--allow-failures`, wenn du Artefakte ohne fehlschlagenden Exit-Code
haben möchtest.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die
für den Gast praktikabel sind: umgebungsvariablenbasierte Provider-Schlüssel,
den Pfad zur QA-Live-Provider-Konfiguration und `CODEX_HOME`, falls vorhanden.
Halte `--output-dir` unter dem Repo-Root, damit der Gast über den eingehängten
Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese sind absichtlich in Git enthalten, damit der QA-Plan sowohl für Menschen
als auch für den Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei
für ein Szenario ist die Quelle der Wahrheit für einen Testlauf und sollte
Folgendes definieren:

- Szenariometadaten
- optionale Metadaten zu Kategorie, Fähigkeit, Lane und Risiko
- Doku- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf
generisch und querschnittlich bleiben. Beispielsweise können Markdown-Szenarien
transportseitige Helfer mit browserseitigen Helfern kombinieren, die die
eingebettete Control UI über die Gateway-Nahtstelle `browser.request` ansteuern,
ohne einen spezialfallbezogenen Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Quellbaum-Ordner
gruppiert werden. Halte Szenario-IDs stabil, wenn Dateien verschoben werden;
verwende `docsRefs` und `codeRefs` für die Nachverfolgbarkeit der Implementierung.

Die Basisliste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lifecycle von Nachrichtenaktionen
- Cron-Callbacks
- Speicherabruf
- Modellwechsel
- Übergabe an Subagenten
- Lesen von Repos und Dokus
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt der
  standardmäßige deterministische Mock-Lane für repo-gestützte QA und
  Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle
  Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und
  ersetzt nicht den Szenario-Dispatcher von `mock-openai`.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die
Gateway-Modellkonfiguration, Anforderungen für das Staging von Auth-Profilen
sowie Live-/Mock-Fähigkeits-Flags. Gemeinsamer Suite- und Gateway-Code sollte
über die Provider-Registry routen, anstatt anhand von Providernamen zu verzweigen.

## Transport-Adapter

`qa-lab` besitzt eine generische Transport-Nahtstelle für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Nahtstelle, aber das Designziel
ist breiter: Künftige echte oder synthetische Kanäle sollten an denselben
Suite-Runner angeschlossen werden, anstatt einen transportspezifischen QA-Runner
hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt die generische Szenarioausführung, Worker-Parallelität, das Schreiben von Artefakten und die Berichterstattung.
- der Transport-Adapter besitzt Gateway-Konfiguration, Bereitschaft, eingehende und ausgehende Beobachtung, Transportaktionen und normalisierten Transportstatus.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die ihn ausführt.

Maintainer-orientierte Einführungsrichtlinien für neue Kanal-Adapter befinden
sich in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstattung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten
Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert geblieben ist
- Welche Folge-Szenarien es wert sind, hinzugefügt zu werden

Für Prüfungen von Charakter und Stil führe dasselbe Szenario über mehrere Live-
Modell-Refs aus und schreibe einen bewerteten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Der Befehl führt lokale QA-Gateway-Child-Prozesse aus, nicht Docker.
Character-Eval-Szenarien sollten die Persona über `SOUL.md` festlegen und dann
gewöhnliche Benutzer-Turns wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben
ausführen. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es bewertet
wird. Der Befehl bewahrt jedes vollständige Transkript, zeichnet grundlegende
Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwende `--blind-judge-models`, wenn du Provider vergleichst: Der Judge-Prompt
erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs
werden durch neutrale Bezeichnungen wie `candidate-01` ersetzt; der Bericht
ordnet die Rangfolgen nach dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `xhigh` für OpenAI-
Modelle, die dies unterstützen. Überschreibe einen bestimmten Kandidaten inline
mit `--model provider/model,thinking=<level>`. `--thinking <level>` setzt
weiterhin einen globalen Fallback, und die ältere Form
`--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen
erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, sodass
Prioritätsverarbeitung verwendet wird, wo der Provider dies unterstützt. Füge
`,fast`, `,no-fast` oder `,fast=false` inline hinzu, wenn ein einzelner Kandidat
oder Judge eine Überschreibung benötigt. Übergebe `--fast` nur, wenn du den
Fast-Modus für jedes Kandidatenmodell erzwingen möchtest. Kandidaten- und Judge-
Laufzeiten werden im Bericht für die Benchmark-Analyse aufgezeichnet, aber in
den Judge-Prompts wird ausdrücklich darauf hingewiesen, nicht nach
Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modelläufe verwenden standardmäßig beide eine Parallelität
von 16. Verringere `--concurrency` oder `--judge-concurrency`, wenn Provider-
Limits oder lokaler Gateway-Druck einen Lauf zu unruhig machen.
Wenn kein Kandidat über `--model` übergeben wird, verwendet die Character-Eval
standardmäßig
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.4,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/web/dashboard)
