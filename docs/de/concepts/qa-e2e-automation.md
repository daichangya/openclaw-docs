---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen von repo-gestützten QA-Szenarien
    - Erstellen einer realistischeren QA-Automatisierung rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsstruktur für qa-lab, qa-channel, vorab definierte Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-17T06:22:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f97293c184d7c04c95d9858305668fbc0f93273f587ec7e54896ad5d603ab0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalförmige Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Flow ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan anzeigt.

Starten Sie es mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, die Docker-gestützte Gateway-Lane gestartet und
die QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine
Automatisierungsschleife dem Agenten eine QA-Mission geben, echtes Kanalverhalten
beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert geblieben ist.

Für schnellere Iterationen an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu
zu bauen, starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorab gebauten Image und
bind-mountet `extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu,
wenn sich der Asset-Hash von QA Lab ändert.

Für eine Matrix-Smoke-Lane mit echtem Transport führen Sie Folgendes aus:

```bash
pnpm openclaw qa matrix
```

Diese Lane stellt in Docker einen temporären Tuwunel-Homeserver bereit,
registriert temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen
privaten Raum und führt dann das echte Matrix-Plugin innerhalb eines QA-Gateway-
Child-Prozesses aus. Die Live-Transport-Lane hält die Child-Konfiguration auf den
zu testenden Transport begrenzt, sodass Matrix ohne `qa-channel` in der
Child-Konfiguration läuft. Sie schreibt die strukturierten Berichtsartefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis.
Um zusätzlich die äußere Build-/Launcher-Ausgabe von `scripts/run-node.mjs` zu
erfassen, setzen Sie `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale
Logdatei.

Für eine Telegram-Smoke-Lane mit echtem Transport führen Sie Folgendes aus:

```bash
pnpm openclaw qa telegram
```

Diese Lane verwendet eine echte private Telegram-Gruppe, anstatt einen
temporären Server bereitzustellen. Sie erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in
derselben privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben,
und die Beobachtung von Bot zu Bot funktioniert am besten, wenn für beide Bots
im `@BotFather` der Modus für Bot-zu-Bot-Kommunikation aktiviert ist.

Live-Transport-Lanes teilen sich jetzt einen kleineren gemeinsamen Vertrag,
anstatt jeweils ihre eigene Form für die Szenarioliste zu erfinden:

`qa-channel` bleibt die umfassende synthetische Suite für Produktverhalten und
ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention gating | Allowlist-Blockierung | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Nachverfolgung | Thread-Isolierung | Reaktionsbeobachtung | Hilfebefehl |
| -------- | ------ | -------------- | --------------------- | -------------------------- | ------------------------ | --------------------- | ----------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x                     | x                          | x                        | x                     | x                 | x                    |              |
| Telegram | x      |                |                       |                            |                          |                       |                   |                      | x            |

Dadurch bleibt `qa-channel` die umfassende Suite für Produktverhalten, während
Matrix, Telegram und zukünftige Live-Transporte eine explizite gemeinsame
Checkliste für Transportverträge nutzen.

Für eine temporäre Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen,
führen Sie Folgendes aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert,
OpenClaw innerhalb des Gasts gebaut, `qa suite` ausgeführt und anschließend der
normale QA-Bericht sowie die Zusammenfassung zurück nach `.artifacts/qa-e2e/...`
auf dem Host kopiert.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte
Szenarien parallel mit isolierten Gateway-Workern aus, bis zu 64 Worker oder die
Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die
Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die
für den Gast praktikabel sind: umgebungsvariablenbasierte Provider-Schlüssel,
den Konfigurationspfad des QA-Live-Providers und `CODEX_HOME`, falls vorhanden.
Halten Sie `--output-dir` unter dem Repo-Root, damit der Gast über den
gemounteten Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Diese liegen bewusst in git, damit der QA-Plan sowohl für Menschen als auch für
den Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei für
ein Szenario ist die Quelle der Wahrheit für einen Testlauf und sollte Folgendes
definieren:

- Szenariometadaten
- Doku- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionaler Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, die `qa-flow` unterstützt, darf
generisch und schnittstellenübergreifend bleiben. Zum Beispiel können
Markdown-Szenarien transportseitige Hilfsfunktionen mit browserseitigen
Hilfsfunktionen kombinieren, die die eingebettete Control UI über die
Gateway-`browser.request`-Naht steuern, ohne einen Runner mit Spezialfällen
hinzuzufügen.

Die grundlegende Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Rückrufe
- Speicherabruf
- Modellwechsel
- Übergabe an Subagenten
- Lesen des Repo und Lesen der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die
  standardmäßige deterministische Mock-Lane für repo-gestützte QA- und
  Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle
  Protokoll-, Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und
  ersetzt nicht den Szenario-Dispatcher von `mock-openai`.

Die Implementierung der Provider-Lanes befindet sich unter
`extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die
Gateway-Modellkonfiguration, Anforderungen für das Staging von Auth-Profilen
sowie Live-/Mock-Fähigkeitsflags. Gemeinsamer Suite- und Gateway-Code sollte
über die Provider-Registry geleitet werden, anstatt anhand von Providernamen zu
verzweigen.

## Transport-Adapter

`qa-lab` besitzt eine generische Transport-Naht für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Naht, aber das Designziel ist
breiter: zukünftige reale oder synthetische Kanäle sollten sich in denselben
Suite-Runner integrieren, anstatt einen transport-spezifischen QA-Runner
hinzuzufügen.

Auf Architekturebene ist die Aufteilung wie folgt:

- `qa-lab` besitzt die generische Szenarioausführung, Worker-Parallelität, das Schreiben von Artefakten und die Berichterstattung.
- der Transport-Adapter besitzt die Gateway-Konfiguration, Bereitschaft, Beobachtung eingehender und ausgehender Daten, Transportaktionen und den normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

Die maintainer-orientierte Einführungsanleitung für neue Kanal-Adapter finden
Sie unter
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstattung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten
Bus-Zeitleiste.
Der Bericht sollte folgende Fragen beantworten:

- Was hat funktioniert
- Was ist fehlgeschlagen
- Was ist blockiert geblieben
- Welche Folgeszenarien sollten ergänzt werden

Für Prüfungen von Charakter und Stil führen Sie dasselbe Szenario für mehrere
Live-Modell-Refs aus und schreiben einen bewerteten Markdown-Bericht:

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
Szenarien für Character-Eval sollten die Persona über `SOUL.md` setzen und dann
normale Benutzer-Turns wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben
ausführen. Dem Kandidatenmodell sollte nicht mitgeteilt werden, dass es
evaluiert wird. Der Befehl bewahrt jedes vollständige Transkript, zeichnet
grundlegende Laufstatistiken auf und bittet dann die Bewertungsmodelle im
Fast-Modus mit `xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor
zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der
Bewertungs-Prompt erhält weiterhin jedes Transkript und jeden Laufstatus, aber
Kandidaten-Refs werden durch neutrale Labels wie `candidate-01` ersetzt; der
Bericht ordnet die Bewertungen nach dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` thinking, mit `xhigh` für
OpenAI-Modelle, die dies unterstützen. Überschreiben Sie einen bestimmten
Kandidaten inline mit `--model provider/model,thinking=<level>`. `--thinking <level>`
setzt weiterhin einen globalen Fallback, und die ältere Form
`--model-thinking <provider/model=level>` bleibt aus Kompatibilitätsgründen
erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit dort, wo
der Provider dies unterstützt, Priority Processing verwendet wird. Fügen Sie
`,fast`, `,no-fast` oder `,fast=false` inline hinzu, wenn ein einzelner
Kandidat oder Bewerter eine Überschreibung benötigt. Übergeben Sie `--fast` nur
dann, wenn Sie den Fast-Modus für jedes Kandidatenmodell erzwingen möchten.
Dauern von Kandidaten- und Bewertungsmodellläufen werden im Bericht für
Benchmark-Analysen aufgezeichnet, aber Bewertungs-Prompts weisen ausdrücklich
darauf hin, nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Bewertungsmodellläufe verwenden beide standardmäßig Parallelität
16. Verringern Sie `--concurrency` oder `--judge-concurrency`, wenn
Provider-Limits oder lokaler Gateway-Druck einen Lauf zu unruhig machen.
Wenn kein Kandidat-`--model` übergeben wird, verwendet Character-Eval
standardmäßig `openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewerter standardmäßig
`openai/gpt-5.4,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/web/dashboard)
