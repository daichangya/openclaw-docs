---
read_when:
    - Erweitern von qa-lab oder qa-channel
    - Hinzufügen repo-gestützter QA-Szenarien
    - Erstellen von QA-Automatisierung mit höherem Realitätsgrad rund um das Gateway-Dashboard
summary: Private QA-Automatisierungsstruktur für qa-lab, qa-channel, Seeded Scenarios und Protokollberichte
title: QA-E2E-Automatisierung
x-i18n:
    generated_at: "2026-04-12T23:28:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9fe27dc049823d5e3eb7ae1eac6aad21ed9e917425611fb1dbcb28ab9210d5e
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA-E2E-Automatisierung

Der private QA-Stack soll OpenClaw auf realistischere, kanalähnliche Weise testen,
als es ein einzelner Unit-Test kann.

Aktuelle Bausteine:

- `extensions/qa-channel`: synthetischer Nachrichtenkanal mit DM-, Kanal-, Thread-,
  Reaktions-, Bearbeitungs- und Löschoberflächen.
- `extensions/qa-lab`: Debugger-UI und QA-Bus zum Beobachten des Transkripts,
  Einspielen eingehender Nachrichten und Exportieren eines Markdown-Berichts.
- `qa/`: repo-gestützte Seed-Assets für die Startaufgabe und grundlegende QA-
  Szenarien.

Der aktuelle QA-Operator-Ablauf ist eine QA-Site mit zwei Bereichen:

- Links: Gateway-Dashboard (Control UI) mit dem Agenten.
- Rechts: QA Lab mit dem Slack-ähnlichen Transkript und dem Szenarioplan.

Führen Sie es aus mit:

```bash
pnpm qa:lab:up
```

Dadurch wird die QA-Site gebaut, die Docker-gestützte Gateway-Lane gestartet und
die QA-Lab-Seite bereitgestellt, auf der ein Operator oder eine Automatisierungsschleife
dem Agenten eine QA-Mission geben, echtes Kanalverhalten beobachten und festhalten kann,
was funktioniert hat, fehlgeschlagen ist oder blockiert geblieben ist.

Für schnellere QA-Lab-UI-Iterationen, ohne das Docker-Image jedes Mal neu zu bauen,
starten Sie den Stack mit einem bind-gemounteten QA-Lab-Bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` hält die Docker-Dienste auf einem vorgebauten Image und bind-mountet
`extensions/qa-lab/web/dist` in den `qa-lab`-Container. `qa:lab:watch`
baut dieses Bundle bei Änderungen neu, und der Browser lädt automatisch neu, wenn sich
der QA-Lab-Asset-Hash ändert.

Für eine Matrix-Smoke-Lane mit echtem Transport führen Sie aus:

```bash
pnpm openclaw qa matrix
```

Diese Lane stellt einen flüchtigen Tuwunel-Homeserver in Docker bereit, registriert
temporäre Driver-, SUT- und Observer-Benutzer, erstellt einen privaten Raum und führt
dann das echte Matrix-Plugin innerhalb eines QA-Gateway-Child-Prozesses aus. Die Live-
Transport-Lane hält die Child-Konfiguration auf den getesteten Transport begrenzt, sodass
Matrix ohne `qa-channel` in der Child-Konfiguration läuft.

Für eine Telegram-Smoke-Lane mit echtem Transport führen Sie aus:

```bash
pnpm openclaw qa telegram
```

Diese Lane zielt auf eine echte private Telegram-Gruppe, anstatt einen flüchtigen Server
bereitzustellen. Erforderlich sind `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` sowie zwei unterschiedliche Bots in derselben
privaten Gruppe. Der SUT-Bot muss einen Telegram-Benutzernamen haben, und die Bot-zu-Bot-
Beobachtung funktioniert am besten, wenn bei beiden Bots der Bot-to-Bot Communication Mode
in `@BotFather` aktiviert ist.

Live-Transport-Lanes verwenden jetzt einen kleineren gemeinsamen Vertrag, statt dass jede
ihre eigene Form der Szenarioliste erfindet:

`qa-channel` bleibt die breite synthetische Suite für Produktverhalten und ist nicht Teil
der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Nach Neustart fortsetzen | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | ------------------------ | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x                          | x                        | x                | x                | x                    |              |
| Telegram | x      |                |                 |                            |                          |                  |                  |                      | x            |

Dadurch bleibt `qa-channel` die breite Suite für Produktverhalten, während Matrix,
Telegram und künftige Live-Transporte eine explizite Checkliste für Transportverträge
gemeinsam nutzen.

Für eine flüchtige Linux-VM-Lane, ohne Docker in den QA-Pfad einzubringen, führen Sie aus:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Dadurch wird ein frischer Multipass-Gast gestartet, Abhängigkeiten installiert, OpenClaw
innerhalb des Gasts gebaut, `qa suite` ausgeführt und anschließend der normale QA-Bericht
sowie die Zusammenfassung zurück nach `.artifacts/qa-e2e/...` auf dem Host kopiert.
Es verwendet dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host.
Host- und Multipass-Suite-Ausführungen führen standardmäßig mehrere ausgewählte Szenarien
parallel mit isolierten Gateway-Workern aus, bis zu 64 Workern oder der Anzahl der
ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker
anzupassen, oder `--concurrency 1` für serielle Ausführung.
Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für
den Gast praktikabel sind: Provider-Schlüssel über Umgebungsvariablen, den QA-Live-
Provider-Konfigurationspfad und `CODEX_HOME`, falls vorhanden. Halten Sie `--output-dir`
unterhalb der Repo-Wurzel, damit der Gast über den gemounteten Workspace zurückschreiben kann.

## Repo-gestützte Seeds

Seed-Assets befinden sich in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Diese liegen absichtlich in Git, damit der QA-Plan sowohl für Menschen als auch für den
Agenten sichtbar ist.

`qa-lab` sollte ein generischer Markdown-Runner bleiben. Jede Markdown-Datei für ein
Szenario ist die Quelle der Wahrheit für einen Testlauf und sollte Folgendes definieren:

- Szenariometadaten
- Dokumentations- und Code-Referenzen
- optionale Plugin-Anforderungen
- optionalen Gateway-Konfigurations-Patch
- den ausführbaren `qa-flow`

Die grundlegende Liste sollte breit genug bleiben, um Folgendes abzudecken:

- DM- und Kanal-Chat
- Thread-Verhalten
- Lebenszyklus von Nachrichtenaktionen
- Cron-Callbacks
- Memory-Abruf
- Modellwechsel
- Subagent-Übergabe
- Lesen des Repo und Lesen der Dokumentation
- eine kleine Build-Aufgabe wie Lobster Invaders

## Transport-Adapter

`qa-lab` besitzt eine generische Transport-Nahtstelle für Markdown-QA-Szenarien.
`qa-channel` ist der erste Adapter auf dieser Nahtstelle, aber das Designziel ist breiter:
Künftige echte oder synthetische Kanäle sollten sich in dieselbe Suite-Ausführung einklinken,
anstatt einen transportspezifischen QA-Runner hinzuzufügen.

Auf Architekturebene ist die Aufteilung wie folgt:

- `qa-lab` besitzt die generische Szenarioausführung, Worker-Parallelität, Artefaktschreibung und Berichterstattung.
- Der Transport-Adapter besitzt Gateway-Konfiguration, Bereitschaft, Ein- und Ausgangsbeobachtung, Transportaktionen und normalisierten Transportzustand.
- Markdown-Szenariodateien unter `qa/scenarios/` definieren den Testlauf; `qa-lab` stellt die wiederverwendbare Laufzeitoberfläche bereit, die sie ausführt.

Die maintainer-orientierte Anleitung zur Einführung neuer Kanal-Adapter steht in
[Testing](/de/help/testing#adding-a-channel-to-qa).

## Berichterstattung

`qa-lab` exportiert einen Markdown-Protokollbericht aus der beobachteten Bus-Zeitleiste.
Der Bericht sollte folgende Fragen beantworten:

- Was hat funktioniert
- Was ist fehlgeschlagen
- Was ist blockiert geblieben
- Welche Folge-Szenarien es sich lohnt hinzuzufügen

Für Zeichen- und Stilprüfungen führen Sie dasselbe Szenario über mehrere Live-
Modell-Referenzen hinweg aus und schreiben einen bewerteten Markdown-Bericht:

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

Der Befehl führt lokale QA-Gateway-Child-Prozesse aus, nicht Docker. Character-eval-
Szenarien sollten die Persona über `SOUL.md` setzen und dann gewöhnliche Benutzerzüge
wie Chat, Workspace-Hilfe und kleine Dateiaufgaben ausführen. Dem Kandidatenmodell sollte
nicht mitgeteilt werden, dass es bewertet wird. Der Befehl bewahrt jedes vollständige
Transkript, erfasst grundlegende Laufstatistiken und bittet dann die Bewertungsmodelle im
schnellen Modus mit `xhigh`-Reasoning, die Läufe nach Natürlichkeit, Vibe und Humor zu
bewerten.
Verwenden Sie `--blind-judge-models`, wenn Sie Provider vergleichen: Der Bewertungs-Prompt
erhält weiterhin jedes Transkript und jeden Laufstatus, aber Kandidaten-Refs werden durch
neutrale Bezeichnungen wie `candidate-01` ersetzt; der Bericht ordnet die Ranglisten nach
dem Parsen wieder den echten Refs zu.
Kandidatenläufe verwenden standardmäßig `high` thinking, mit `xhigh` für OpenAI-Modelle,
die dies unterstützen. Überschreiben Sie einen bestimmten Kandidaten inline mit
`--model provider/model,thinking=<level>`. `--thinking <level>` setzt weiterhin einen
globalen Fallback, und die ältere Form `--model-thinking <provider/model=level>` bleibt
aus Kompatibilitätsgründen erhalten.
OpenAI-Kandidaten-Refs verwenden standardmäßig den schnellen Modus, damit Prioritätsverarbeitung
genutzt wird, sofern der Provider dies unterstützt. Fügen Sie inline `,fast`, `,no-fast`
oder `,fast=false` hinzu, wenn ein einzelner Kandidat oder Bewertungsmodell eine
Überschreibung benötigt. Übergeben Sie `--fast` nur, wenn Sie den schnellen Modus für jedes
Kandidatenmodell erzwingen möchten. Kandidaten- und Bewertungsdauer werden im Bericht für
Benchmark-Analysen erfasst, aber in den Bewertungs-Prompts wird ausdrücklich darauf
hingewiesen, nicht nach Geschwindigkeit zu bewerten.
Kandidaten- und Bewertungsmodellläufe verwenden beide standardmäßig eine Parallelität von 16.
Senken Sie `--concurrency` oder `--judge-concurrency`, wenn Provider-Limits oder lokaler
Gateway-Druck einen Lauf zu unruhig machen.
Wenn kein Kandidaten-`--model` übergeben wird, verwendet character eval standardmäßig
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` und
`google/gemini-3.1-pro-preview`, wenn kein `--model` übergeben wird.
Wenn kein `--judge-model` übergeben wird, verwenden die Bewertungsmodelle standardmäßig
`openai/gpt-5.4,thinking=xhigh,fast` und
`anthropic/claude-opus-4-6,thinking=high`.

## Verwandte Dokumentation

- [Testing](/de/help/testing)
- [QA Channel](/de/channels/qa-channel)
- [Dashboard](/web/dashboard)
