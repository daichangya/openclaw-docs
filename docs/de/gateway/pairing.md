---
read_when:
    - Node-Pairing-Genehmigungen ohne macOS-UI implementieren
    - CLI-Abläufe zum Genehmigen von Remote-Nodes hinzufügen
    - Gateway-Protokoll um Node-Management erweitern
summary: Gateway-eigenes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Gateway-eigenes Pairing
x-i18n:
    generated_at: "2026-04-24T06:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway-eigenes Pairing (Option B)

Beim Gateway-eigenen Pairing ist das **Gateway** die Quelle der Wahrheit dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden **Geräte-Pairing** (Rolle `node`) während `connect`.
`node.pair.*` ist ein separater Pairing-Speicher und steuert den WS-Handshake **nicht**.
Nur Clients, die ausdrücklich `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat um Beitritt gebeten; Genehmigung erforderlich.
- **Gepairte Node**: Genehmigte Node mit ausgegebenem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht
  über Mitgliedschaft. (Legacy-Unterstützung für TCP-Bridge wurde entfernt.)

## So funktioniert das Pairing

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Pairing an.
2. Das Gateway speichert eine **ausstehende Anfrage** und sendet `node.pair.requested`.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung stellt das Gateway ein **neues Token** aus (Tokens werden bei erneutem Pairing rotiert).
5. Die Node verbindet sich mit dem Token erneut und ist nun „gepairt“.

Ausstehende Anfragen laufen automatisch nach **5 Minuten** ab.

## CLI-Workflow (headless-freundlich)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` zeigt gepairte/verbundene Nodes und deren Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — wird ausgegeben, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — wird ausgegeben, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

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
  Metadaten und den neuesten allowlisteten Snapshot deklarierter Befehle für die Sichtbarkeit von Operatoren.
- Die Genehmigung erzeugt **immer** ein frisches Token; aus
  `node.pair.request` wird niemals ein Token zurückgegeben.
- Anfragen können `silent: true` als Hinweis für Auto-Genehmigungsabläufe enthalten.
- `node.pair.approve` verwendet die in der ausstehenden Anfrage deklarierten Befehle, um
  zusätzliche Genehmigungs-Scopes durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Nicht-Exec-Befehlen: `operator.pairing` + `operator.write`
  - Anfrage mit `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Wichtig:

- Node-Pairing ist ein Vertrauens-/Identitätsablauf plus Token-Ausgabe.
- Es pinnt **nicht** die Live-Oberfläche der Node-Befehle pro Node.
- Live-Node-Befehle stammen aus dem, was die Node bei `connect` deklariert, nachdem
  die globale Node-Befehlsrichtlinie des Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) angewendet wurde.
- Die per-Node-Richtlinie für `system.run` mit allow/ask liegt auf der Node in
  `exec.approvals.node.*`, nicht im Pairing-Datensatz.

## Gating für Node-Befehle (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis das Node-Pairing genehmigt wurde. Geräte-Pairing allein reicht nicht mehr aus, um deklarierte Node-Befehle bereitzustellen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird Pairing automatisch angefordert. Bis die Pairing-Anfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieser Node gefiltert und nicht ausgeführt. Sobald Vertrauen durch Genehmigung des Pairings hergestellt ist, werden die deklarierten Befehle der Node vorbehaltlich der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die sich bisher darauf verlassen haben, dass Geräte-Pairing allein Befehle bereitstellt, müssen jetzt das Node-Pairing abschließen.
- Befehle, die vor der Genehmigung des Pairings in die Warteschlange gestellt wurden, werden verworfen und nicht aufgeschoben.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Node-ausgehende Läufe bleiben jetzt auf eine reduzierte vertrauenswürdige Oberfläche beschränkt.
</Warning>

Von Nodes ausgehende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgetriebene oder von Nodes ausgelöste Abläufe, die sich bisher auf breiteren Zugriff auf Host- oder Sitzungs-Tools stützten, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht in Host-Level-Toolzugriff über die Vertrauensgrenze der Node hinaus eskalieren können.

## Auto-Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage mit `silent` markiert ist und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, fällt sie auf die normale Aufforderung „Approve/Reject“ zurück.

## Auto-Genehmigung bei Metadaten-Upgrades

Wenn sich ein bereits gepairtes Gerät nur mit nicht sensiblen Änderungen an den Metadaten
erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille Auto-Genehmigung ist eng begrenzt: Sie gilt nur für
vertrauenswürdige lokale CLI-/Hilfs-erneut-Verbindungen, die bereits den Besitz des
gemeinsamen Tokens oder Passworts über Loopback nachgewiesen haben. Browser-/Control-UI-Clients und Remote-
Clients verwenden weiterhin den expliziten Ablauf zur erneuten Genehmigung. Scope-Upgrades (von read zu
write/admin) und Änderungen des öffentlichen Schlüssels kommen **nicht** für die Auto-Genehmigung bei Metadaten-Upgrades infrage — sie bleiben explizite Anfragen zur erneuten Genehmigung.

## QR-Pairing-Helfer

`/pair qr` rendert die Pairing-Payload als strukturierte Medien, sodass mobile und
browserbasierte Clients sie direkt scannen können.

Das Löschen eines Geräts bereinigt außerdem alle veralteten ausstehenden Pairing-Anfragen für diese
Geräte-ID, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway-Pairing behandelt eine Verbindung nur dann als Loopback, wenn sowohl der rohe Socket
als auch Belege eines vorgeschalteten Proxys übereinstimmen. Wenn eine Anfrage auf Loopback eingeht, aber
Header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` trägt,
die auf einen nicht lokalen Ursprung verweisen, disqualifizieren diese Belege durch weitergeleitete Header
den Anspruch auf Loopback-Lokalität. Der Pairing-Pfad erfordert dann explizite Genehmigung,
statt die Anfrage still als Verbindung vom selben Host zu behandeln. Siehe
[Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
Operator-Auth.

## Speicherung (lokal, privat)

Der Pairing-Status wird im Statusverzeichnis des Gateway gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, verschiebt sich der Ordner `nodes/` mit.

Sicherheitshinweise:

- Tokens sind Secrets; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn das Gateway offline ist oder Pairing deaktiviert ist, können Nodes kein Pairing durchführen.
- Wenn sich das Gateway im Remote-Modus befindet, erfolgt das Pairing trotzdem gegen den Speicher des Remote-Gateway.

## Verwandt

- [Channel-Pairing](/de/channels/pairing)
- [Nodes](/de/nodes)
- [Devices CLI](/de/cli/devices)
