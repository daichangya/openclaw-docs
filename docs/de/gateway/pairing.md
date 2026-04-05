---
read_when:
    - Node-Pairing-Genehmigungen ohne macOS-UI implementieren
    - CLI-Abläufe zum Genehmigen von Remote-Nodes hinzufügen
    - Gateway-Protokoll um Node-Verwaltung erweitern
summary: Gateway-gesteuertes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Gateway-gesteuertes Pairing
x-i18n:
    generated_at: "2026-04-05T12:43:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway-gesteuertes Pairing (Option B)

Beim Gateway-gesteuerten Pairing ist das **Gateway** die Quelle der Wahrheit dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden beim `connect` **Device Pairing** (Rolle `node`).
`node.pair.*` ist ein separater Pairing-Speicher und steuert den WS-Handshake **nicht**.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat um Beitritt gebeten; erfordert Genehmigung.
- **Gepairte Node**: Genehmigte Node mit ausgegebenem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber
  nicht über die Mitgliedschaft. (Legacy-TCP-Bridge-Unterstützung wurde entfernt.)

## So funktioniert Pairing

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Pairing an.
2. Das Gateway speichert eine **ausstehende Anfrage** und sendet `node.pair.requested`.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung stellt das Gateway einen **neuen Token** aus (bei erneutem Pairing werden Tokens rotiert).
5. Die Node verbindet sich mit dem Token erneut und ist jetzt „gepairt“.

Ausstehende Anfragen laufen nach **5 Minuten** automatisch ab.

## CLI-Ablauf (headless-freundlich)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gepairte/verbundene Nodes und ihre Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — wird gesendet, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — wird gesendet, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` — eine ausstehende Anfrage erstellen oder wiederverwenden.
- `node.pair.list` — ausstehende + gepairte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` — eine ausstehende Anfrage genehmigen (stellt Token aus).
- `node.pair.reject` — eine ausstehende Anfrage ablehnen.
- `node.pair.verify` — `{ nodeId, token }` verifizieren.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für dieselbe ausstehende Node aktualisieren außerdem die gespeicherten Node-
  Metadaten und den neuesten allowlist-basierten Snapshot deklarierter Befehle zur Sichtbarkeit für Operatoren.
- Die Genehmigung erzeugt **immer** einen frischen Token; von
  `node.pair.request` wird niemals ein Token zurückgegeben.
- Anfragen können `silent: true` als Hinweis für Auto-Genehmigungs-Abläufe enthalten.
- `node.pair.approve` verwendet die von der ausstehenden Anfrage deklarierten Befehle, um
  zusätzliche Genehmigungs-Scopes durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehl: `operator.pairing` + `operator.write`
  - Anfrage mit `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Wichtig:

- Node-Pairing ist ein Vertrauens-/Identitätsablauf plus Token-Ausstellung.
- Es pinnt **nicht** die aktive Node-Befehlsoberfläche pro Node.
- Aktive Node-Befehle stammen aus dem, was die Node beim `connect` deklariert, nachdem die
  globale Node-Befehlsrichtlinie des Gateways (`gateway.nodes.allowCommands` /
  `denyCommands`) angewendet wurde.
- Die Allow/Ask-Richtlinie pro Node für `system.run` liegt auf der Node in
  `exec.approvals.node.*`, nicht im Pairing-Datensatz.

## Node-Befehls-Gating (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis das Node-Pairing genehmigt wurde. Device Pairing allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird Pairing automatisch angefordert. Bis die Pairing-Anfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieser Node herausgefiltert und nicht ausgeführt. Sobald über die Genehmigung des Pairings Vertrauen hergestellt wurde, werden die deklarierten Befehle der Node vorbehaltlich der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die sich zuvor darauf verlassen haben, allein über Device Pairing Befehle bereitzustellen, müssen jetzt Node-Pairing abschließen.
- Befehle, die vor der Genehmigung des Pairings in die Warteschlange gestellt wurden, werden verworfen und nicht aufgeschoben.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes ausgehende Läufe bleiben jetzt auf eine reduzierte vertrauenswürdige Oberfläche beschränkt.
</Warning>

Von Nodes ausgehende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgesteuerte oder von Nodes ausgelöste Abläufe, die sich zuvor auf breiteren Host- oder Sitzungs-Tool-Zugriff verlassen haben, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht zu Tool-Zugriff auf Host-Ebene eskalieren können, der über die Vertrauensgrenze der Node hinausgeht.

## Auto-Genehmigung (macOS-App)

Die macOS-App kann optional versuchen, eine **stille Genehmigung** durchzuführen, wenn:

- die Anfrage als `silent` markiert ist und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, greift sie auf die normale Eingabeaufforderung „Approve/Reject“ zurück.

## Speicherung (lokal, privat)

Der Pairing-Status wird unter dem Gateway-State-Verzeichnis gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, wird der Ordner `nodes/` mit verschoben.

Sicherheitshinweise:

- Tokens sind Secrets; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert eine erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn das Gateway offline ist oder Pairing deaktiviert ist, können sich Nodes nicht pairen.
- Wenn sich das Gateway im Remote-Modus befindet, erfolgt das Pairing trotzdem gegen den Speicher des Remote-Gateways.
