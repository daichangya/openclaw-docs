---
read_when:
    - Configurazione o debugging del controllo remoto macOS
summary: Flusso dell’app macOS per controllare un gateway OpenClaw remoto tramite SSH
title: Controllo remoto
x-i18n:
    generated_at: "2026-04-26T11:33:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Questo flusso permette all’app macOS di agire come controllo remoto completo per un gateway OpenClaw in esecuzione su un altro host (desktop/server). È la funzionalità **Remote over SSH** (esecuzione remota) dell’app. Tutte le funzionalità—controlli di integrità, inoltro di Voice Wake e Web Chat—riusano la stessa configurazione SSH remota da _Impostazioni → Generale_.

## Modalità

- **Local (questo Mac)**: tutto gira sul laptop. Nessun SSH coinvolto.
- **Remote over SSH (predefinita)**: i comandi OpenClaw vengono eseguiti sull’host remoto. L’app mac apre una connessione SSH con `-o BatchMode` più l’identità/chiave scelta e un port-forward locale.
- **Remote direct (ws/wss)**: nessun tunnel SSH. L’app mac si connette direttamente all’URL del gateway (ad esempio tramite Tailscale Serve o un reverse proxy HTTPS pubblico).

## Transport remoti

La modalità remota supporta due transport:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del gateway a localhost. Il gateway vedrà l’IP del Node come `127.0.0.1` perché il tunnel è in loopback.
- **Direct (ws/wss)**: si connette direttamente all’URL del gateway. Il gateway vede il vero IP del client.

In modalità tunnel SSH, gli hostname LAN/tailnet rilevati vengono salvati come
`gateway.remote.sshTarget`. L’app mantiene `gateway.remote.url` sull’endpoint locale
del tunnel, ad esempio `ws://127.0.0.1:18789`, così CLI, Web Chat e
il servizio locale node-host usano tutti lo stesso transport loopback sicuro.

L’automazione del browser in modalità remota è gestita dal CLI node host, non dal
Node nativo dell’app macOS. L’app avvia il servizio node host installato quando
possibile; se ti serve il controllo del browser da quel Mac, installalo/avvialo con
`openclaw node install ...` e `openclaw node start` (oppure esegui
`openclaw node run ...` in foreground), poi indirizza quel
Node con capacità browser.

## Prerequisiti sull’host remoto

1. Installa Node + pnpm e builda/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia su PATH per shell non interattive (symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Apri SSH con auth a chiave. Consigliamo IP **Tailscale** per raggiungibilità stabile fuori dalla LAN.

## Configurazione dell’app macOS

1. Apri _Impostazioni → Generale_.
2. In **OpenClaw runs**, scegli **Remote over SSH** e imposta:
   - **Transport**: **SSH tunnel** oppure **Direct (ws/wss)**.
   - **SSH target**: `user@host` (facoltativo `:port`).
     - Se il gateway è sulla stessa LAN e pubblicizza Bonjour, sceglilo dall’elenco rilevato per compilare automaticamente questo campo.
   - **Gateway URL** (solo Direct): `wss://gateway.example.ts.net` (oppure `ws://...` per locale/LAN).
   - **Identity file** (avanzato): percorso della tua chiave.
   - **Project root** (avanzato): percorso del checkout remoto usato per i comandi.
   - **CLI path** (avanzato): percorso facoltativo a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando pubblicizzato).
3. Premi **Test remote**. Il successo indica che `openclaw status --json` remoto viene eseguito correttamente. I fallimenti di solito indicano problemi di PATH/CLI; uscita 127 significa che la CLI non viene trovata in remoto.
4. I controlli di integrità e Web Chat ora verranno eseguiti automaticamente tramite questo tunnel SSH.

## Web Chat

- **Tunnel SSH**: Web Chat si connette al gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Direct (ws/wss)**: Web Chat si connette direttamente all’URL del gateway configurato.
- Non esiste più un server HTTP WebChat separato.

## Permessi

- L’host remoto richiede le stesse approvazioni TCC del locale (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Esegui l’onboarding su quella macchina per concederle una volta sola.
- I Node pubblicizzano il proprio stato dei permessi tramite `node.list` / `node.describe` così gli agenti sanno cosa è disponibile.

## Note di sicurezza

- Preferisci bind loopback sull’host remoto e connettiti tramite SSH o Tailscale.
- Il tunneling SSH usa il controllo rigoroso della host key; fidati prima della host key così esiste in `~/.ssh/known_hosts`.
- Se fai il bind del Gateway a un’interfaccia non loopback, richiedi una auth Gateway valida: token, password o un reverse proxy consapevole dell’identità con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Security](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di login WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull’host remoto**. Scansiona il QR con WhatsApp dal tuo telefono.
- Riesegui il login su quell’host se l’auth scade. Il controllo di integrità evidenzierà i problemi di collegamento.

## Risoluzione dei problemi

- **exit 127 / not found**: `openclaw` non è su PATH per shell non di login. Aggiungilo a `/etc/paths`, al tuo shell rc oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: controlla raggiungibilità SSH, PATH e che Baileys sia autenticato (`openclaw status --json`).
- **Web Chat bloccata**: conferma che il gateway sia in esecuzione sull’host remoto e che la porta inoltrata corrisponda alla porta WS del gateway; la UI richiede una connessione WS sana.
- **L’IP del Node mostra 127.0.0.1**: previsto con il tunnel SSH. Passa **Transport** a **Direct (ws/wss)** se vuoi che il gateway veda il vero IP del client.
- **Voice Wake**: le frasi trigger vengono inoltrate automaticamente in modalità remota; non serve alcun inoltro separato.

## Suoni di notifica

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Non esiste più un toggle globale di “default sound” nell’app; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [app macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
