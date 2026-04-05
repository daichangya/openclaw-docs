---
read_when:
    - Node-Clients erstellen oder debuggen (iOS/Android/macOS-Knotenmodus)
    - Pairing- oder Bridge-Auth-Fehler untersuchen
    - Die vom Gateway exponierte Knotenoberfläche prüfen
summary: 'Historisches Bridge-Protokoll (Legacy-Knoten): TCP JSONL, Pairing, Scoped RPC'
title: Bridge Protocol
x-i18n:
    generated_at: "2026-04-05T12:41:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge-Protokoll (Legacy-Knotentransport)

<Warning>
Die TCP-Bridge wurde **entfernt**. Aktuelle OpenClaw-Builds liefern keinen Bridge-Listener mehr aus, und `bridge.*`-Konfigurationsschlüssel sind nicht mehr im Schema enthalten. Diese Seite wird nur als historische Referenz beibehalten. Verwenden Sie das [Gateway Protocol](/gateway/protocol) für alle Knoten-/Operator-Clients.
</Warning>

## Warum es existierte

- **Sicherheitsgrenze**: Die Bridge stellt statt der vollständigen Gateway-API-Oberfläche eine kleine Allowlist bereit.
- **Pairing + Knotenidentität**: Die Zulassung von Knoten gehört dem Gateway und ist an ein Token pro Knoten gebunden.
- **Discovery-UX**: Knoten können Gateways über Bonjour im LAN erkennen oder sich direkt über ein Tailnet verbinden.
- **Loopback-WS**: Die vollständige WS-Control-Plane bleibt lokal, sofern sie nicht per SSH getunnelt wird.

## Transport

- TCP, ein JSON-Objekt pro Zeile (JSONL).
- Optionales TLS (wenn `bridge.tls.enabled` auf true gesetzt ist).
- Der historische Standard-Listener-Port war `18790` (aktuelle Builds starten keine TCP-Bridge).

Wenn TLS aktiviert ist, enthalten TXT-Discovery-Datensätze `bridgeTls=1` plus
`bridgeTlsSha256` als nicht geheimen Hinweis. Beachten Sie, dass Bonjour-/mDNS-TXT-Datensätze nicht authentifiziert sind; Clients dürfen den beworbenen Fingerprint nicht als maßgeblichen Pin behandeln, ohne ausdrückliche Benutzerabsicht oder andere Verifikation außerhalb des Bandes.

## Handshake + Pairing

1. Der Client sendet `hello` mit Knotenmetadaten + Token (falls bereits gepairt).
2. Wenn nicht gepairt, antwortet das Gateway mit `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Der Client sendet `pair-request`.
4. Das Gateway wartet auf Freigabe und sendet dann `pair-ok` und `hello-ok`.

Historisch gab `hello-ok` `serverName` zurück und konnte
`canvasHostUrl` enthalten.

## Frames

Client → Gateway:

- `req` / `res`: Scoped Gateway RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: Knotensignale (Sprachtranskript, Agentenanfrage, Chat-Abonnement, Exec-Lebenszyklus)

Gateway → Client:

- `invoke` / `invoke-res`: Knotenbefehle (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: Chat-Updates für abonnierte Sitzungen
- `ping` / `pong`: Keepalive

Die Legacy-Durchsetzung der Allowlist befand sich in `src/gateway/server-bridge.ts` (entfernt).

## Exec-Lebenszyklusereignisse

Knoten können `exec.finished`- oder `exec.denied`-Ereignisse ausgeben, um `system.run`-Aktivität sichtbar zu machen.
Diese werden im Gateway auf Systemereignisse abgebildet. (Legacy-Knoten können weiterhin `exec.started` ausgeben.)

Payload-Felder (alle optional, sofern nicht anders angegeben):

- `sessionKey` (erforderlich): Agentensitzung, die das Systemereignis empfangen soll.
- `runId`: eindeutige Exec-ID zur Gruppierung.
- `command`: rohe oder formatierte Befehlszeichenfolge.
- `exitCode`, `timedOut`, `success`, `output`: Abschlussdetails (nur finished).
- `reason`: Grund für die Verweigerung (nur denied).

## Historische Tailnet-Nutzung

- Die Bridge an eine Tailnet-IP binden: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (nur historisch; `bridge.*` ist nicht mehr gültig).
- Clients verbinden sich über den MagicDNS-Namen oder die Tailnet-IP.
- Bonjour überschreitet **keine** Netzwerke; verwenden Sie bei Bedarf manuellen Host/Port oder Wide-Area DNS‑SD.

## Versionierung

Die Bridge war **implizit v1** (keine Min/Max-Aushandlung). Dieser Abschnitt dient nur als
historische Referenz; aktuelle Knoten-/Operator-Clients verwenden das WebSocket-
[Gateway Protocol](/gateway/protocol).
