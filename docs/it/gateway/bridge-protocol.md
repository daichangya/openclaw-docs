---
read_when:
    - Creazione o debug di client Node (modalità Node iOS/Android/macOS)
    - Analisi di errori di abbinamento o di auth del bridge
    - Verifica della superficie Node esposta dal gateway
summary: 'Protocollo bridge storico (Node legacy): TCP JSONL, abbinamento, RPC con ambito limitato'
title: Protocollo bridge
x-i18n:
    generated_at: "2026-04-25T13:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
Il bridge TCP è stato **rimosso**. Le build OpenClaw correnti non distribuiscono il listener bridge e le chiavi di configurazione `bridge.*` non fanno più parte dello schema. Questa pagina è mantenuta solo come riferimento storico. Usa il [Protocollo Gateway](/it/gateway/protocol) per tutti i client Node/operator.
</Warning>

## Perché esisteva

- **Confine di sicurezza**: il bridge espone una piccola allowlist invece
  dell'intera superficie API del gateway.
- **Abbinamento + identità Node**: l'ammissione del Node è gestita dal gateway e legata
  a un token per-Node.
- **UX di individuazione**: i Node possono individuare i gateway tramite Bonjour sulla LAN, oppure connettersi
  direttamente tramite una tailnet.
- **WS loopback**: il control plane WS completo resta locale salvo tunnel via SSH.

## Trasporto

- TCP, un oggetto JSON per riga (JSONL).
- TLS facoltativo (quando `bridge.tls.enabled` è true).
- La porta listener predefinita storica era `18790` (le build correnti non avviano un
  bridge TCP).

Quando TLS è abilitato, i record TXT di discovery includono `bridgeTls=1` più
`bridgeTlsSha256` come suggerimento non segreto. Nota che i record TXT Bonjour/mDNS non sono
autenticati; i client non devono trattare l'impronta digitale pubblicizzata come un pin
autorevole senza esplicita intenzione dell'utente o altra verifica fuori banda.

## Handshake + abbinamento

1. Il client invia `hello` con metadati Node + token (se già abbinato).
2. Se non è abbinato, il gateway risponde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Il client invia `pair-request`.
4. Il gateway attende l'approvazione, poi invia `pair-ok` e `hello-ok`.

Storicamente, `hello-ok` restituiva `serverName` e poteva includere
`canvasHostUrl`.

## Frame

Client → Gateway:

- `req` / `res`: RPC gateway con ambito limitato (chat, sessions, config, health, voicewake, skills.bins)
- `event`: segnali Node (trascrizione vocale, richiesta agente, sottoscrizione chat, ciclo di vita exec)

Gateway → Client:

- `invoke` / `invoke-res`: comandi Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: aggiornamenti chat per le sessioni sottoscritte
- `ping` / `pong`: keepalive

L'applicazione storica della allowlist si trovava in `src/gateway/server-bridge.ts` (rimosso).

## Eventi del ciclo di vita exec

I Node possono emettere eventi `exec.finished` o `exec.denied` per esporre l'attività system.run.
Questi vengono mappati a eventi di sistema nel gateway. (I Node legacy possono ancora emettere `exec.started`.)

Campi del payload (tutti facoltativi salvo diversa indicazione):

- `sessionKey` (obbligatorio): sessione agente che deve ricevere l'evento di sistema.
- `runId`: id exec univoco per il raggruppamento.
- `command`: stringa di comando grezza o formattata.
- `exitCode`, `timedOut`, `success`, `output`: dettagli di completamento (solo finished).
- `reason`: motivo del rifiuto (solo denied).

## Uso storico della tailnet

- Collega il bridge a un IP tailnet: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (solo storico; `bridge.*` non è più valido).
- I client si connettono tramite nome MagicDNS o IP tailnet.
- Bonjour **non** attraversa le reti; usa host/porta manuali o DNS‑SD wide-area
  quando necessario.

## Versioning

Il bridge era **v1 implicita** (senza negoziazione min/max). Questa sezione è
solo un riferimento storico; i client Node/operator correnti usano il [Protocollo Gateway](/it/gateway/protocol)
WebSocket.

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Node](/it/nodes)
