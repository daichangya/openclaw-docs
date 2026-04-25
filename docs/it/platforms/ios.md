---
read_when:
    - Associare o riconnettere il Node iOS
    - Eseguire l'app iOS dal sorgente
    - Debug della scoperta del gateway o dei comandi canvas
summary: 'App Node iOS: connessione al Gateway, associazione, canvas e risoluzione dei problemi'
title: App iOS
x-i18n:
    generated_at: "2026-04-25T13:51:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilità: anteprima interna. L'app iOS non è ancora distribuita pubblicamente.

## Cosa fa

- Si connette a un Gateway tramite WebSocket (LAN o tailnet).
- Espone capacità del Node: Canvas, snapshot schermo, acquisizione fotocamera, posizione, modalità Talk, attivazione vocale.
- Riceve comandi `node.invoke` e riporta eventi di stato del Node.

## Requisiti

- Gateway in esecuzione su un altro dispositivo (macOS, Linux o Windows tramite WSL2).
- Percorso di rete:
  - Stessa LAN tramite Bonjour, **oppure**
  - Tailnet tramite DNS-SD unicast (dominio di esempio: `openclaw.internal.`), **oppure**
  - Host/porta manuali (fallback).

## Avvio rapido (associa + connetti)

1. Avvia il Gateway:

```bash
openclaw gateway --port 18789
```

2. Nell'app iOS, apri Impostazioni e scegli un gateway rilevato (oppure abilita Host manuale e inserisci host/porta).

3. Approva la richiesta di associazione sull'host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se l'app ritenta l'associazione con dettagli auth modificati (ruolo/scope/chiave pubblica),
la richiesta precedente in sospeso viene sostituita e viene creato un nuovo `requestId`.
Esegui di nuovo `openclaw devices list` prima dell'approvazione.

Facoltativo: se il Node iOS si connette sempre da una subnet strettamente controllata, puoi
abilitare esplicitamente l'auto-approvazione iniziale del Node con CIDR espliciti o IP esatti:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Questa funzione è disabilitata per impostazione predefinita. Si applica solo a una nuova associazione `role: node` senza
scope richiesti. L'associazione operator/browser e qualsiasi modifica a ruolo, scope, metadati o
chiave pubblica richiedono comunque approvazione manuale.

4. Verifica la connessione:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push supportato da relay per build ufficiali

Le build iOS ufficiali distribuite usano il relay push esterno invece di pubblicare il token APNs grezzo
al gateway.

Requisito lato Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Come funziona il flusso:

- L'app iOS si registra presso il relay usando App Attest e la ricevuta dell'app.
- Il relay restituisce un relay handle opaco più una send grant con ambito di registrazione.
- L'app iOS recupera l'identità del gateway associato e la include nella registrazione relay, così la registrazione supportata da relay viene delegata a quel gateway specifico.
- L'app inoltra quella registrazione supportata da relay al gateway associato con `push.apns.register`.
- Il gateway usa il relay handle memorizzato per `push.test`, wake in background e wake nudges.
- Il base URL del relay del gateway deve corrispondere all'URL relay integrato nella build iOS ufficiale/TestFlight.
- Se l'app in seguito si connette a un gateway diverso o a una build con un base URL relay diverso, aggiorna la registrazione relay invece di riutilizzare il vecchio binding.

Cosa **non** serve al gateway per questo percorso:

- Nessun token relay valido per tutto il deployment.
- Nessuna chiave APNs diretta per invii ufficiali/TestFlight supportati da relay.

Flusso operatore previsto:

1. Installa la build iOS ufficiale/TestFlight.
2. Imposta `gateway.push.apns.relay.baseUrl` sul gateway.
3. Associa l'app al gateway e lasciale completare la connessione.
4. L'app pubblica automaticamente `push.apns.register` dopo avere un token APNs, avere la sessione operatore connessa e aver completato con successo la registrazione relay.
5. Dopo di ciò, `push.test`, i wake di riconnessione e i wake nudges possono usare la registrazione supportata da relay memorizzata.

Nota di compatibilità:

- `OPENCLAW_APNS_RELAY_BASE_URL` funziona ancora come override env temporaneo per il gateway.

## Flusso di autenticazione e fiducia

Il relay esiste per imporre due vincoli che APNs diretto sul gateway non può fornire per
le build iOS ufficiali:

- Solo build iOS OpenClaw autentiche distribuite tramite Apple possono usare il relay ospitato.
- Un gateway può inviare push supportati da relay solo a dispositivi iOS associati a quel gateway
  specifico.

Hop per hop:

1. `app iOS -> gateway`
   - L'app si associa prima al gateway tramite il normale flusso auth del Gateway.
   - Questo fornisce all'app una sessione Node autenticata più una sessione operatore autenticata.
   - La sessione operatore viene usata per chiamare `gateway.identity.get`.

2. `app iOS -> relay`
   - L'app chiama gli endpoint di registrazione del relay tramite HTTPS.
   - La registrazione include prova App Attest più la ricevuta dell'app.
   - Il relay convalida bundle ID, prova App Attest e ricevuta Apple, e richiede il
     percorso di distribuzione ufficiale/di produzione.
   - Questo è ciò che blocca le build locali Xcode/dev dall'usare il relay ospitato. Una build locale può essere
     firmata, ma non soddisfa la prova di distribuzione Apple ufficiale che il relay si aspetta.

3. `delega identità gateway`
   - Prima della registrazione relay, l'app recupera l'identità del gateway associato da
     `gateway.identity.get`.
   - L'app include quell'identità gateway nel payload di registrazione relay.
   - Il relay restituisce un relay handle e una send grant con ambito di registrazione delegati a
     quell'identità gateway.

4. `gateway -> relay`
   - Il gateway memorizza il relay handle e la send grant da `push.apns.register`.
   - Su `push.test`, wake di riconnessione e wake nudges, il gateway firma la richiesta di invio con la
     propria identità dispositivo.
   - Il relay verifica sia la send grant memorizzata sia la firma del gateway rispetto all'identità
     gateway delegata dalla registrazione.
   - Un altro gateway non può riutilizzare quella registrazione memorizzata, anche se in qualche modo ottiene l'handle.

5. `relay -> APNs`
   - Il relay possiede le credenziali APNs di produzione e il token APNs grezzo per la build ufficiale.
   - Il gateway non memorizza mai il token APNs grezzo per build ufficiali supportate da relay.
   - Il relay invia il push finale ad APNs per conto del gateway associato.

Perché è stato creato questo design:

- Per mantenere le credenziali APNs di produzione fuori dai gateway utente.
- Per evitare di memorizzare token APNs grezzi di build ufficiali sul gateway.
- Per consentire l'uso del relay ospitato solo per build OpenClaw ufficiali/TestFlight.
- Per impedire che un gateway invii wake push a dispositivi iOS posseduti da un gateway diverso.

Le build locali/manuali restano su APNs diretto. Se stai testando quelle build senza relay, il
gateway ha comunque bisogno di credenziali APNs dirette:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Queste sono variabili env di runtime sull'host gateway, non impostazioni Fastlane. `apps/ios/fastlane/.env` memorizza solo
l'auth App Store Connect / TestFlight come `ASC_KEY_ID` e `ASC_ISSUER_ID`; non configura
la consegna APNs diretta per build iOS locali.

Archiviazione consigliata sull'host gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Non fare commit del file `.p8` e non collocarlo sotto il checkout del repo.

## Percorsi di rilevamento

### Bonjour (LAN)

L'app iOS esplora `_openclaw-gw._tcp` su `local.` e, quando configurato, lo stesso
dominio di rilevamento DNS-SD wide-area. I gateway sulla stessa LAN compaiono automaticamente da `local.`;
il rilevamento cross-network può usare il dominio wide-area configurato senza cambiare il tipo di beacon.

### Tailnet (cross-network)

Se mDNS è bloccato, usa una zona DNS-SD unicast (scegli un dominio; esempio:
`openclaw.internal.`) e DNS split Tailscale.
Vedi [Bonjour](/it/gateway/bonjour) per l'esempio CoreDNS.

### Host/porta manuali

In Impostazioni, abilita **Host manuale** e inserisci host + porta del gateway (predefinito `18789`).

## Canvas + A2UI

Il Node iOS esegue il rendering di un canvas WKWebView. Usa `node.invoke` per guidarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Note:

- L'host canvas del Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Viene servito dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).
- Il Node iOS naviga automaticamente verso A2UI alla connessione quando viene pubblicizzato un URL host canvas.
- Torna allo scaffold integrato con `canvas.navigate` e `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Attivazione vocale + modalità Talk

- Attivazione vocale e modalità Talk sono disponibili in Impostazioni.
- iOS può sospendere l'audio in background; considera le funzioni vocali come best-effort quando l'app non è attiva.

## Errori comuni

- `NODE_BACKGROUND_UNAVAILABLE`: porta l'app iOS in primo piano (i comandi canvas/fotocamera/schermo lo richiedono).
- `A2UI_HOST_NOT_CONFIGURED`: il Gateway non ha pubblicizzato un URL host canvas; controlla `canvasHost` in [Configurazione del Gateway](/it/gateway/configuration).
- Il prompt di associazione non compare mai: esegui `openclaw devices list` e approva manualmente.
- La riconnessione fallisce dopo la reinstallazione: il token di associazione del Keychain è stato cancellato; associa di nuovo il Node.

## Documentazione correlata

- [Associazione](/it/channels/pairing)
- [Rilevamento](/it/gateway/discovery)
- [Bonjour](/it/gateway/bonjour)
