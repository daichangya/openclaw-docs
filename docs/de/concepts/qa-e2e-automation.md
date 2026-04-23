---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Repo-gestützte QA-Szenarien hinzufügen
    - Aufbau realitätsnäherer QA-Automatisierung rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsform für qa-lab, qa-channel, Seed-Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-23T14:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf eine realistischere,
kanalähnliche Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Kickoff-Aufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Flow ist eine zweigeteilte QA-Site:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und dem Szenarioplan.

Starten Sie es mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, der Docker-gestützte Gateway-Lane gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, echtes Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder
blockiert blieb.

Für schnellere Iteration an der QA-Lab-UI, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den Container `qa-lab`. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich der QA-Lab-
Asset-Hash ändert.

Für einen Matrix-Smoke-Lane mit echtem Transport führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Dieser Lane provisioniert einen temporären Tuwunel-Homeserver in Docker, registriert
temporäre Benutzer für Driver, SUT und Beobachter, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin innerhalb eines QA-Gateway-Child-Prozesses aus. Der Live-Transport-Lane hält
die Child-Konfiguration auf den getesteten Transport begrenzt, sodass Matrix ohne
`qa-channel` in der Child-Konfiguration läuft. Er schreibt die strukturierten Bericht-Artefakte und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um
zusätzlich die Ausgabe von Build/Launcher des äußeren `scripts/run-node.mjs` zu erfassen, setzen Sie
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repo-lokale Logdatei.

Für einen Telegram-Smoke-Lane mit echtem Transport führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Dieser Lane zielt auf eine echte private Telegram-Gruppe, statt einen temporären Server zu provisionieren. Er
erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, außerdem zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und Bot-zu-Bot-
Beobachtung funktioniert am besten, wenn bei beiden Bots der Bot-to-Bot Communication Mode
in `@BotFather` aktiviert ist.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Der Telegram-Bericht und die Zusammenfassung enthalten die RTT pro Antwort von der Sendeanfrage der Driver-Nachricht
bis zur beobachteten Antwort des SUT, beginnend mit dem Canary.

Live-Transport-Lanes teilen sich jetzt einen kleineren gemeinsamen Vertrag, statt jeweils
ihre eigene Form der Szenarioliste zu erfinden:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Coverage-Matrix für Live-Transporte.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | -------------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x                          | x                    | x                | x                | x                    |              |
| Telegram | x      |                |                 |                            |                      |                  |                  |                      | x            |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte sich eine explizite Prüfliste für den Transportvertrag teilen.

Für einen temporären Linux-VM-Lane, ohne Docker in den QA-Pfad einzubeziehen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Guest, installiert Abhängigkeiten, baut OpenClaw innerhalb des Guests,
führt `qa suite` aus und kopiert dann den normalen QA-Bericht und die Zusammenfassung zurück nach
`.artifacts/qa-e2e/...` auf den Host.
Es verwendet dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel mit
isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Concurrency 4,
begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um
die Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl endet mit einem Nicht-Null-Status, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den
Guest praktikabel sind: env-basierte Provider-Schlüssel, der Pfad zur QA-Live-Provider-Konfiguration und
`CODEX_HOME`, wenn vorhanden. Halten Sie `--output-dir` unterhalb des Repo-Root, damit der Guest
über den gemounteten Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei eines Szenarios ist
die Source of Truth für einen Testlauf und sollte definieren:

- Szenario-Metadaten
- optionale Metadaten zu Kategorie, Fähigkeit, Lane und Risiko
- Doku- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Runtime-Oberfläche, auf der `qa-flow` basiert, darf generisch
und schnittübergreifend bleiben. Zum Beispiel können Markdown-Szenarien Hilfen auf
Transportseite mit Hilfen auf Browserseite kombinieren, die die eingebettete Control UI über den
Gateway-Seam `browser.request` ansteuern, ohne einen speziellen Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Source-Tree-Ordner gruppiert werden.
Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Rückverfolgbarkeit zur Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lifecycle von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Recall
- Modellwechsel
- Subagent-Übergabe
- Lesen von Repos und Doku
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt der standardmäßige
  deterministische Mock-Lane für repo-gestützte QA und Parity-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Coverage. Er ist additiv und ersetzt den
  Szenario-Dispatcher von `mock-openai` nicht.

Die Implementierung der Provider-Lanes liegt unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den Start des lokalen Servers, die Gateway-Modellkonfiguration,
Bedürfnisse beim Stageing von Auth-Profilen und Live-/Mock-Fähigkeits-Flags. Gemeinsame Suite- und
Gateway-Logik sollte über das Provider-Registry routen, statt nach Providernamen zu verzweigen.

## Transport-Adapter

`qa-lab` besitzt einen generischen Transport-Seam für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf diesem Seam, aber das Ziel des Designs ist breiter:
Künftige echte oder synthetische Kanäle sollen in denselben Suite-Runner eingesteckt werden,
statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Concurrency, Schreiben von Artefakten und Reporting.
- der Transport-Adapter besitzt Gateway-Konfiguration, Bereitschaft, Beobachtung von Inbound und Outbound, Transportaktionen und normalisierten Transportstatus.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Runtime-Oberfläche bereit, die sie ausführt.

Maintainer-orientierte Hinweise zur Einführung neuer Kanal-Adapter stehen in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Timeline.
Der Bericht sollte beantworten:

- Was funktioniert hat
- Was fehlgeschlagen ist
- Was blockiert blieb
- Welche Folge-Szenarien sich hinzuzufügen lohnen

Für Prüfungen von Charakter und Stil führen Sie dasselbe Szenario über mehrere Live-Modell-
Referenzen aus und schreiben einen beurteilten Markdown-Bericht:

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

Der Befehl führt lokale QA-Gateway-Child-Prozesse aus, nicht Docker. Character-Eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche User-Turns ausführen,
etwa Chat, Workspace-Hilfe und kleine Dateiaufgaben. Dem Kandidatenmodell
sollte nicht gesagt werden, dass es bewertet wird. Der Befehl bewahrt jedes vollständige
Transkript, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im Fast-Modus mit
`xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor zu bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch neutrale
Labels wie `candidate-01` ersetzt; der Bericht ordnet Rankings nach dem Parsen den echten Refs wieder zu.
Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `xhigh` für OpenAI-Modelle, die
es unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt
zur Kompatibilität erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den Fast-Modus, damit priorisierte Verarbeitung genutzt wird, wo
der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast` oder `,fast=false` hinzu, wenn ein
einzelner Kandidat oder Judge ein Override braucht. Übergeben Sie `--fast` nur dann, wenn Sie den
Fast-Modus für jedes Kandidatenmodell erzwingen möchten. Dauer von Kandidaten- und Judge-Läufen wird
für Benchmark-Analysen im Bericht festgehalten, aber Judge-Prompts sagen ausdrücklich,
nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Judge-Modelläufe verwenden standardmäßig beide Concurrency 16. Verringern Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokale Gateway-
Last einen Lauf zu verrauscht machen.
Wenn kein Kandidat-`--model` übergeben wird, verwendet Character Eval standardmäßig
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Judges standardmäßig
`openai/gpt-5.4,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Doku

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/de/web/dashboard)
