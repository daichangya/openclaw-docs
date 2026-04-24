---
read_when:
    - Node-Clients erstellen oder debuggen (iOS-/Android-/macOS-Node-Modus)
    - Pairing- oder Bridge-Auth-Fehler untersuchen
    - Die vom Gateway bereitgestellte Node-Oberfläche prüfen
summary: 'Historisches Bridge-Protokoll (Legacy-Nodes): TCP JSONL, Pairing, Scoped RPC'
title: Bridge-Protokoll
x-i18n:
    generated_at: "2026-04-24T06:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge-Protokoll (Legacy-Node-Transport)

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds enthalten keinen Bridge-Listener mehr, und Konfigurationsschlüssel `bridge.*` sind nicht mehr im Schema enthalten. Diese Seite wird nur noch als historische Referenz aufbewahrt. Verwenden Sie für alle Node-/Operator-Clients das [Gateway Protocol](/de/gateway/protocol).
</Warning>

## Warum es existierte

- **Sicherheitsgrenze**: Die Bridge stellt eine kleine Allowlist statt der
  vollständigen Gateway-API-Oberfläche bereit.
- **Pairing + Node-Identität**: Die Zulassung von Nodes wird vom Gateway verwaltet und ist
  an ein Token pro Node gebunden.
- **Discovery-UX**: Nodes können Gateways per Bonjour im LAN entdecken oder sich
  direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Control-Plane bleibt lokal, sofern sie nicht per SSH getunnelt wird.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optional TLS (wenn `bridge.tls.enabled` `true` ist).
- Der historische Standard-Listener-Port war `18790` (aktuelle Builds starten keine
  TCP-Bridge).

Wenn TLS aktiviert ist, enthalten Discovery-TXT-Records `bridgeTls=1` sowie
`bridgeTlsSha256` als nicht geheimen Hinweis. Beachten Sie, dass Bonjour-/mDNS-TXT-Records nicht authentifiziert sind; Clients dürfen den beworbenen Fingerprint nicht als maßgeblichen Pin behandeln, sofern keine ausdrückliche Benutzerabsicht oder andere Verifikation außerhalb des Bands vorliegt.

## Handshake + Pairing

1. Der Client sendet `hello` mit Node-Metadaten + Token (falls bereits gepairt).
2. Wenn nicht gepairt, antwortet das Gateway mit `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Der Client sendet `pair-request`.
4. Das Gateway wartet auf Genehmigung und sendet dann `pair-ok` und `hello-ok`.

Historisch gab `hello-ok` `serverName` zurück und konnte
`canvasHostUrl` enthalten.

## Frames

Client → Gateway:

- `req` / `res`: bereichsbezogenes Gateway-RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: Node-Signale (Sprachtranskript, Agentenanfrage, Chat-Abonnement, Exec-Lebenszyklus)

Gateway → Client:

- `invoke` / `invoke-res`: Node-Befehle (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: Chat-Updates für abonnierte Sitzungen
- `ping` / `pong`: Keepalive

Die Legacy-Durchsetzung der Allowlist befand sich in `src/gateway/server-bridge.ts` (entfernt).

## Exec-Lebenszyklusereignisse

Nodes können Ereignisse `exec.finished` oder `exec.denied` ausgeben, um `system.run`-Aktivitäten sichtbar zu machen.
Diese werden im Gateway auf Systemereignisse abgebildet. (Legacy-Nodes können weiterhin `exec.started` ausgeben.)

Payload-Felder (alle optional, sofern nicht anders angegeben):

- `sessionKey` (erforderlich): Agentensitzung, die das Systemereignis erhalten soll.
- `runId`: eindeutige Exec-ID für die Gruppierung.
- `command`: rohe oder formatierte Befehlszeichenfolge.
- `exitCode`, `timedOut`, `success`, `output`: Abschlussdetails (nur bei finished).
- `reason`: Grund für die Ablehnung (nur bei denied).

## Historische Tailnet-Nutzung

- Binden Sie die Bridge an eine Tailnet-IP: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (nur historisch; `bridge.*` ist nicht mehr gültig).
- Clients verbinden sich über MagicDNS-Namen oder Tailnet-IP.
- Bonjour überschreitet **keine** Netzwerke; verwenden Sie bei Bedarf manuelle Host-/Port-Angaben oder Wide-Area-DNS‑SD.

## Versionierung

Die Bridge war **implizit v1** (keine Min-/Max-Aushandlung). Dieser Abschnitt dient
nur als historische Referenz; aktuelle Node-/Operator-Clients verwenden das WebSocket-
[Gateway Protocol](/de/gateway/protocol).

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
- [Nodes](/de/nodes)
