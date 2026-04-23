---
read_when:
    - Node-Pairing-Genehmigungen ohne macOS-UI implementieren
    - CLI-Abläufe zum Genehmigen von Remote-Nodes hinzufügen
    - Gateway-Protokoll um Node-Verwaltung erweitern
summary: Gateway-eigenes Node-Pairing (Option B) für iOS und andere Remote-Nodes
title: Gateway-eigenes Pairing
x-i18n:
    generated_at: "2026-04-23T14:02:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway-eigenes Pairing (Option B)

Beim Gateway-eigenen Pairing ist das **Gateway** die Quelle der Wahrheit dafür, welche Nodes
beitreten dürfen. UIs (macOS-App, zukünftige Clients) sind nur Frontends, die
ausstehende Anfragen genehmigen oder ablehnen.

**Wichtig:** WS-Nodes verwenden beim `connect` **Device Pairing** (Rolle `node`).
`node.pair.*` ist ein separater Pairing-Speicher und steuert **nicht** den WS-Handshake.
Nur Clients, die explizit `node.pair.*` aufrufen, verwenden diesen Ablauf.

## Konzepte

- **Ausstehende Anfrage**: Eine Node hat um Beitritt gebeten; erfordert Genehmigung.
- **Gepairte Node**: Genehmigte Node mit ausgegebenem Auth-Token.
- **Transport**: Der Gateway-WS-Endpunkt leitet Anfragen weiter, entscheidet aber nicht über
  die Mitgliedschaft. (Legacy-TCP-Bridge-Unterstützung wurde entfernt.)

## So funktioniert Pairing

1. Eine Node verbindet sich mit dem Gateway-WS und fordert Pairing an.
2. Das Gateway speichert eine **ausstehende Anfrage** und sendet `node.pair.requested`.
3. Sie genehmigen oder lehnen die Anfrage ab (CLI oder UI).
4. Bei Genehmigung gibt das Gateway ein **neues Token** aus (bei erneutem Pairing werden Tokens rotiert).
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

`nodes status` zeigt gepairte/verbundene Nodes und deren Fähigkeiten.

## API-Oberfläche (Gateway-Protokoll)

Ereignisse:

- `node.pair.requested` — gesendet, wenn eine neue ausstehende Anfrage erstellt wird.
- `node.pair.resolved` — gesendet, wenn eine Anfrage genehmigt/abgelehnt/abgelaufen ist.

Methoden:

- `node.pair.request` — eine ausstehende Anfrage erstellen oder wiederverwenden.
- `node.pair.list` — ausstehende + gepairte Nodes auflisten (`operator.pairing`).
- `node.pair.approve` — eine ausstehende Anfrage genehmigen (gibt ein Token aus).
- `node.pair.reject` — eine ausstehende Anfrage ablehnen.
- `node.pair.verify` — `{ nodeId, token }` verifizieren.

Hinweise:

- `node.pair.request` ist pro Node idempotent: Wiederholte Aufrufe geben dieselbe
  ausstehende Anfrage zurück.
- Wiederholte Anfragen für dieselbe ausstehende Node aktualisieren außerdem die gespeicherten Node-
  Metadaten und den neuesten Allowlist-Snapshot deklarierter Befehle für die Sichtbarkeit durch Operatoren.
- Eine Genehmigung erzeugt **immer** ein neues Token; es wird niemals ein Token aus
  `node.pair.request` zurückgegeben.
- Anfragen können `silent: true` als Hinweis für Auto-Genehmigungs-Abläufe enthalten.
- `node.pair.approve` verwendet die von der ausstehenden Anfrage deklarierten Befehle, um
  zusätzliche Genehmigungs-Scopes durchzusetzen:
  - Anfrage ohne Befehle: `operator.pairing`
  - Anfrage mit Befehlen außer Exec-Befehlen: `operator.pairing` + `operator.write`
  - Anfrage mit `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Wichtig:

- Node Pairing ist ein Vertrauens-/Identitätsablauf plus Token-Ausgabe.
- Es pinnt **nicht** die Live-Node-Befehlsoberfläche pro Node.
- Live-Node-Befehle kommen aus dem, was die Node beim Verbinden deklariert, nachdem die
  globale Node-Befehlsrichtlinie des Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) angewendet wurde.
- Die Allow-/Ask-Richtlinie pro Node für `system.run` lebt auf der Node in
  `exec.approvals.node.*`, nicht im Pairing-Datensatz.

## Node-Befehls-Gating (2026.3.31+)

<Warning>
**Breaking Change:** Ab `2026.3.31` sind Node-Befehle deaktiviert, bis das Node Pairing genehmigt wurde. Device Pairing allein reicht nicht mehr aus, um deklarierte Node-Befehle verfügbar zu machen.
</Warning>

Wenn sich eine Node zum ersten Mal verbindet, wird Pairing automatisch angefordert. Bis die Pairing-Anfrage genehmigt ist, werden alle ausstehenden Node-Befehle dieser Node herausgefiltert und nicht ausgeführt. Sobald durch die Pairing-Genehmigung Vertrauen hergestellt wurde, werden die von der Node deklarierten Befehle vorbehaltlich der normalen Befehlsrichtlinie verfügbar.

Das bedeutet:

- Nodes, die sich zuvor darauf verlassen haben, dass Device Pairing allein Befehle verfügbar macht, müssen jetzt Node Pairing abschließen.
- Vor der Pairing-Genehmigung in die Queue eingestellte Befehle werden verworfen, nicht zurückgestellt.

## Vertrauensgrenzen für Node-Ereignisse (2026.3.31+)

<Warning>
**Breaking Change:** Von Nodes ausgehende Ausführungen bleiben jetzt auf eine reduzierte vertrauenswürdige Oberfläche beschränkt.
</Warning>

Von Nodes ausgehende Zusammenfassungen und zugehörige Sitzungsereignisse sind auf die vorgesehene vertrauenswürdige Oberfläche beschränkt. Benachrichtigungsgesteuerte oder durch Nodes ausgelöste Abläufe, die zuvor von breiterem Host- oder Sitzungs-Tool-Zugriff abhingen, müssen möglicherweise angepasst werden. Diese Härtung stellt sicher, dass Node-Ereignisse nicht zu Host-Level-Tool-Zugriff über die Vertrauensgrenze der Node hinaus eskalieren können.

## Auto-Genehmigung (macOS-App)

Die macOS-App kann optional eine **stille Genehmigung** versuchen, wenn:

- die Anfrage mit `silent` markiert ist und
- die App eine SSH-Verbindung zum Gateway-Host mit demselben Benutzer verifizieren kann.

Wenn die stille Genehmigung fehlschlägt, greift sie auf die normale Aufforderung „Genehmigen/Ablehnen“ zurück.

## Auto-Genehmigung bei Metadaten-Upgrades

Wenn sich ein bereits gepairtes Gerät nur mit unkritischen Metadatenänderungen
erneut verbindet (zum Beispiel Anzeigename oder Hinweise zur Client-Plattform), behandelt OpenClaw
dies als `metadata-upgrade`. Die stille Auto-Genehmigung ist eng begrenzt: Sie gilt nur
für vertrauenswürdige erneute Verbindungen von lokalem CLI/Helper, die bereits über
local loopback Besitz des gemeinsamen Tokens oder Passworts nachgewiesen haben. Browser-/Control-UI-Clients und entfernte
Clients verwenden weiterhin den expliziten Re-Genehmigungs-Ablauf. Scope-Upgrades (read auf
write/admin) und Änderungen an öffentlichen Schlüsseln kommen **nicht** für die Auto-Genehmigung von Metadaten-Upgrades in Frage —
sie bleiben explizite Re-Genehmigungs-Anfragen.

## QR-Pairing-Helfer

`/pair qr` rendert die Pairing-Payload als strukturierte Medien, sodass mobile und
Browser-Clients sie direkt scannen können.

Das Löschen eines Geräts räumt auch veraltete ausstehende Pairing-Anfragen für diese
Geräte-ID auf, sodass `nodes pending` nach einem Widerruf keine verwaisten Zeilen anzeigt.

## Lokalität und weitergeleitete Header

Gateway Pairing behandelt eine Verbindung nur dann als loopback, wenn sowohl der rohe Socket
als auch etwaige Upstream-Proxy-Hinweise übereinstimmen. Wenn eine Anfrage über loopback eintrifft, aber
Header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` mitführt,
die auf einen nicht lokalen Ursprung verweisen, disqualifizieren diese weitergeleiteten Header
den loopback-Lokalitätsanspruch. Der Pairing-Pfad erfordert dann explizite Genehmigung,
anstatt die Anfrage stillschweigend als Verbindung vom selben Host zu behandeln. Siehe
[Trusted Proxy Auth](/de/gateway/trusted-proxy-auth) für die entsprechende Regel bei
der Operator-Authentifizierung.

## Speicherung (lokal, privat)

Der Pairing-Status wird unter dem Statusverzeichnis des Gateway gespeichert (Standard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Wenn Sie `OPENCLAW_STATE_DIR` überschreiben, verschiebt sich auch der Ordner `nodes/`.

Sicherheitshinweise:

- Tokens sind Geheimnisse; behandeln Sie `paired.json` als sensibel.
- Das Rotieren eines Tokens erfordert eine erneute Genehmigung (oder das Löschen des Node-Eintrags).

## Transportverhalten

- Der Transport ist **zustandslos**; er speichert keine Mitgliedschaft.
- Wenn das Gateway offline ist oder Pairing deaktiviert ist, können Nodes kein Pairing durchführen.
- Wenn sich das Gateway im Remote-Modus befindet, erfolgt das Pairing weiterhin gegen den Speicher des Remote-Gateway.
