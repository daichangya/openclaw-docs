---
read_when:
    - qa-lab oder qa-channel erweitern
    - Repository-gestützte QA-Szenarien hinzufügen
    - Hochrealistische QA-Automatisierung rund um das Gateway-Dashboard aufbauen
summary: Private QA-Automatisierungsform für qa-lab, qa-channel, vorbereitete Szenarien und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-24T06:35:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Der private QA-Stack soll OpenClaw auf eine realistischere, kanalähnliche
Weise testen, als es ein einzelner Unit-Test kann.

Aktuelle Bestandteile:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit Oberflächen für DM, Kanal, Thread,
  Reaktion, Bearbeiten und Löschen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspeisen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repository-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab, das das Slack-ähnliche Transkript und den Szenarioplan anzeigt.

Starten Sie es mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, die Docker-gestützte Gateway-Lane gestartet und die
QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife dem Agenten eine QA-
Mission geben, reales Kanalverhalten beobachten und aufzeichnen kann, was funktioniert hat, fehlgeschlagen ist oder blockiert blieb.

Für schnellere UI-Iteration im QA Lab, ohne das Docker-Image jedes Mal neu zu bauen,
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

Für eine transportechte Matrix-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Diese Lane stellt in Docker einen wegwerfbaren Tuwunel-Homeserver bereit, registriert
temporäre Driver-, SUT- und Beobachter-Benutzer, erstellt einen privaten Raum und führt dann
das echte Matrix-Plugin in einem untergeordneten QA-Gateway aus. Die Live-Transport-Lane hält die
Konfiguration des Child-Prozesses auf den getesteten Transport beschränkt, sodass Matrix ohne
`qa-channel` in der Child-Konfiguration läuft. Sie schreibt die Artefakte des strukturierten Berichts und
ein kombiniertes stdout/stderr-Log in das ausgewählte Matrix-QA-Ausgabeverzeichnis. Um auch die äußere
Build-/Launcher-Ausgabe von `scripts/run-node.mjs` zu erfassen, setzen Sie
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` auf eine repository-lokale Logdatei.

Für eine transportechte Telegram-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Diese Lane zielt auf eine echte private Telegram-Gruppe statt auf die Bereitstellung eines
wegwerfbaren Servers. Sie erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und die Beobachtung von Bot zu Bot funktioniert am besten, wenn bei beiden Bots der Bot-to-Bot Communication Mode
in `@BotFather` aktiviert ist.
Der Befehl endet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Der Telegram-Bericht und die Zusammenfassung enthalten RTT pro Antwort von der Sendeanfrage der Driver-
Nachricht bis zur beobachteten Antwort des SUT, beginnend mit dem Canary.

Für eine transportechte Discord-Smoke-Lane führen Sie aus:

```bash
pnpm openclaw qa discord
```

Diese Lane zielt auf einen echten privaten Discord-Guild-Kanal mit zwei Bots: einem
Driver-Bot, der vom Harness gesteuert wird, und einem SUT-Bot, der vom untergeordneten
OpenClaw-Gateway über das gebündelte Discord-Plugin gestartet wird. Sie erfordert
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
und `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`, wenn Umgebungsanmeldedaten verwendet werden.
Die Lane prüft das Verhalten bei Kanalerwähnungen und kontrolliert, dass der SUT-Bot
den nativen Befehl `/help` bei Discord registriert hat.
Der Befehl endet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.

Live-Transport-Lanes teilen jetzt einen kleineren gemeinsamen Vertrag, statt jeweils
ihre eigene Form für Szenariolisten zu erfinden:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Erwähnungs-Gating | Allowlist-Block | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl | Registrierung nativer Befehle |
| -------- | ------ | ----------------- | --------------- | -------------------------- | -------------------- | ---------------- | ---------------- | -------------------- | ------------ | ----------------------------- |
| Matrix   | x      | x                 | x               | x                          | x                    | x                | x                | x                    |              |                               |
| Telegram | x      | x                 |                 |                            |                      |                  |                  |                      | x            |                               |
| Discord  | x      | x                 |                 |                            |                      |                  |                  |                      |              | x                             |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine gemeinsame explizite Transport-Vertrags-
Checkliste teilen.

Für eine Lane auf einer wegwerfbaren Linux-VM, ohne Docker in den QA-Pfad einzubringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dies startet einen frischen Multipass-Gast, installiert Abhängigkeiten, baut
OpenClaw innerhalb des Gasts, führt `qa suite` aus und kopiert dann den normalen QA-Bericht und die
Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host.
Es verwendet dasselbe Verhalten bei der Szenarioauswahl wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Läufe führen standardmäßig mehrere ausgewählte Szenarien parallel
mit isolierten Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität 4,
begrenzt durch die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die
Anzahl der Worker anzupassen, oder `--concurrency 1` für serielle Ausführung.
Der Befehl endet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn
Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den
Gast praktikabel sind: env-basierte Provider-Schlüssel, den Konfigurationspfad des QA-Live-Providers und
`CODEX_HOME`, sofern vorhanden. Halten Sie `--output-dir` unter dem Repository-Root, damit der Gast
über den gemounteten Workspace zurückschreiben kann.

## Repository-gestützte Seeds

Seed-Assets liegen in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Szenariodatei ist
die Quelle der Wahrheit für einen einzelnen Testlauf und sollte Folgendes definieren:

- Szenario-Metadaten
- optionale Metadaten zu Kategorie, Fähigkeit, Lane und Risiko
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die wiederverwendbare Laufzeitoberfläche, die `qa-flow` unterstützt, darf generisch
und querschnittlich bleiben. Markdown-Szenarien können zum Beispiel Transport-seitige
Hilfen mit Browser-seitigen Hilfen kombinieren, die die eingebettete Control UI über die
Schnittstelle `browser.request` des Gateway steuern, ohne einen Spezialfall-Runner hinzuzufügen.

Szenariodateien sollten nach Produktfähigkeit statt nach Quellbaum-Ordner gruppiert werden.
Halten Sie Szenario-IDs stabil, wenn Dateien verschoben werden; verwenden Sie `docsRefs` und `codeRefs`
für die Nachverfolgbarkeit der Implementierung.

Die Baseline-Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Recall
- Modellwechsel
- Subagent-Handoff
- Lesen von Repository und Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Provider-Mock-Lanes

`qa suite` hat zwei lokale Provider-Mock-Lanes:

- `mock-openai` ist der szenariobewusste OpenClaw-Mock. Er bleibt die standardmäßige
  deterministische Mock-Lane für repository-gestützte QA und Paritäts-Gates.
- `aimock` startet einen AIMock-gestützten Provider-Server für experimentelle Protokoll-,
  Fixture-, Record/Replay- und Chaos-Abdeckung. Er ist additiv und ersetzt nicht den
  Szenario-Dispatcher von `mock-openai`.

Die Implementierung der Provider-Lanes befindet sich unter `extensions/qa-lab/src/providers/`.
Jeder Provider besitzt seine Standardwerte, den lokalen Serverstart, die Gateway-Modellkonfiguration,
den Bedarf an Auth-Profil-Staging sowie Live-/Mock-Fähigkeits-Flags. Gemeinsamer Suite- und
Gateway-Code sollte über die Provider-Registry routen, statt nach Providernamen zu verzweigen.

## Transport-Adapter

`qa-lab` besitzt eine generische Transport-Schnittstelle für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Schnittstelle, aber das Designziel ist breiter:
künftige echte oder synthetische Kanäle sollen in denselben Suite-Runner eingesteckt werden,
statt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung:

- `qa-lab` besitzt generische Szenarioausführung, Worker-Parallelität, Artefaktschreiben und Berichterstellung.
- der Transport-Adapter besitzt Gateway-Konfiguration, Bereitschaft, Beobachtung von Ein- und Ausgang, Transportaktionen und normalisierten Transportstatus.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

Hinweise für Maintainer zur Einführung neuer Kanal-Adapter finden Sie in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstellung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte beantworten:

- Was hat funktioniert
- Was ist fehlgeschlagen
- Was blieb blockiert
- Welche Folge-Szenarien sollten ergänzt werden

Für Prüfungen von Stil und Charakter führen Sie dasselbe Szenario über mehrere Live-Modell-
Referenzen aus und schreiben einen bewerteten Markdown-Bericht:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzer-Turns
wie Chat, Workspace-Hilfe und kleine Datei-Aufgaben ausführen. Dem Kandidatenmodell
sollte nicht gesagt werden, dass es bewertet wird. Der Befehl bewahrt jedes vollständige
Transkript, zeichnet grundlegende Laufstatistiken auf und bittet dann die Judge-Modelle im schnellen Modus mit
`xhigh`-Reasoning, wo unterstützt, darum, die Läufe nach Natürlichkeit, Vibe und Humor zu ranken.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Judge-Prompt erhält weiterhin
jedes Transkript und den Laufstatus, aber Kandidaten-Refs werden durch neutrale Labels wie
`candidate-01` ersetzt; der Bericht ordnet die Rankings nach dem Parsen wieder den echten Refs zu.

Kandidatenläufe verwenden standardmäßig `high` Thinking, mit `medium` für GPT-5.4 und `xhigh`
für ältere OpenAI-Eval-Refs, die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt aus
Kompatibilitätsgründen erhalten.

OpenAI-Kandidaten-Refs verwenden standardmäßig den schnellen Modus, damit Prioritätsverarbeitung genutzt wird, wo
der Provider dies unterstützt. Fügen Sie `,fast`, `,no-fast` oder `,fast=false` inline hinzu, wenn ein
einzelner Kandidat oder Judge eine Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den schnellen Modus
für jedes Kandidatenmodell erzwingen möchten. Kandidaten- und Judge-Dauern werden zur Benchmark-
Analyse im Bericht aufgezeichnet, aber in Judge-Prompts wird ausdrücklich gesagt, nicht nach Geschwindigkeit zu ranken.

Kandidaten- und Judge-Modelläufe verwenden beide standardmäßig eine Parallelität von 16. Reduzieren Sie
`--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder Druck auf das lokale Gateway
einen Lauf zu unruhig machen.

Wenn kein Kandidat mit `--model` übergeben wird, verwendet Character Eval standardmäßig
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
- [Dashboard](/de/web/dashboard)
