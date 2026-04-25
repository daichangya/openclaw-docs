---
read_when:
    - Implementazione delle approvazioni di associazione Node senza UI macOS
    - Aggiunta di flussi CLI per approvare Node remoti
    - Estensione del protocollo Gateway con gestione dei Node
summary: Associazione Node gestita dal Gateway (Opzione B) per iOS e altri Node remoti
title: Associazione gestita dal Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Nell'associazione gestita dal Gateway, il **Gateway** è la fonte di verità per quali Node
sono autorizzati a unirsi. Le UI (app macOS, futuri client) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i Node WS usano l'**associazione del dispositivo** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di associazione separato e **non** regola l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un Node ha chiesto di unirsi; richiede approvazione.
- **Node associato**: Node approvato con un token di autenticazione emesso.
- **Trasporto**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto legacy del bridge TCP è stato rimosso.)

## Come funziona l'associazione

1. Un Node si connette al Gateway WS e richiede l'associazione.
2. Il Gateway memorizza una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. All'approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati alla riassociazione).
5. Il Node si riconnette usando il token ed è ora “associato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Flusso CLI (compatibile con headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i Node associati/connessi e le loro funzionalità.

## Superficie API (protocollo Gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riutilizza una richiesta in sospeso.
- `node.pair.list` — elenca i Node in sospeso + associati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette un token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per Node: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Richieste ripetute per lo stesso Node in sospeso aggiornano anche i metadati del Node
  memorizzati e l'ultima istantanea dei comandi dichiarati in allowlist per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- Le richieste possono includere `silent: true` come suggerimento per flussi di auto-approvazione.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comandi non-exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- L'associazione del Node è un flusso di fiducia/identità più emissione del token.
- **Non** fissa la superficie dei comandi live del Node per singolo Node.
- I comandi live del Node provengono da ciò che il Node dichiara alla connessione dopo
  che viene applicato il criterio globale dei comandi Node del Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Il criterio allow/ask per `system.run` per singolo Node vive sul Node in
  `exec.approvals.node.*`, non nel record di associazione.

## Controllo dei comandi Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi Node sono disabilitati finché l'associazione del Node non viene approvata. La sola associazione del dispositivo non è più sufficiente per esporre i comandi Node dichiarati.
</Warning>

Quando un Node si connette per la prima volta, l'associazione viene richiesta automaticamente. Finché la richiesta di associazione non viene approvata, tutti i comandi Node in sospeso da quel Node vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite l'approvazione dell'associazione, i comandi dichiarati del Node diventano disponibili soggetti al normale criterio dei comandi.

Questo significa:

- I Node che in precedenza si affidavano solo all'associazione del dispositivo per esporre i comandi devono ora completare l'associazione del Node.
- I comandi accodati prima dell'approvazione dell'associazione vengono scartati, non differiti.

## Confini di fiducia degli eventi Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dal Node ora restano su una superficie fidata ridotta.
</Warning>

I riepiloghi originati dal Node e gli eventi di sessione correlati sono limitati alla superficie fidata prevista. I flussi guidati da notifiche o attivati dal Node che in precedenza facevano affidamento su un accesso più ampio agli strumenti host o di sessione potrebbero richiedere un adattamento. Questo rafforzamento garantisce che gli eventi Node non possano trasformarsi in accesso a strumenti a livello host oltre ciò che il confine di fiducia del Node consente.

## Auto-approvazione (app macOS)

L'app macOS può facoltativamente tentare una **approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host Gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, viene usato il normale prompt “Approva/Rifiuta”.

## Auto-approvazione del dispositivo con CIDR fidati

L'associazione del dispositivo WS per `role: node` resta manuale per impostazione predefinita. Per reti
private di Node dove il Gateway si fida già del percorso di rete, gli operatori possono
attivarla esplicitamente con CIDR espliciti o IP esatti:

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

Confine di sicurezza:

- Disabilitata quando `gateway.nodes.pairing.autoApproveCidrs` non è impostato.
- Non esiste alcuna modalità generale di auto-approvazione LAN o rete privata.
- È idonea solo l'associazione fresca del dispositivo `role: node` senza ambiti richiesti.
- I client operator, browser, UI di controllo e WebChat restano manuali.
- Gli upgrade di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi header trusted-proxy loopback sullo stesso host non sono idonei perché quel
  percorso può essere falsificato da chiamanti locali.

## Auto-approvazione dell'upgrade dei metadati

Quando un dispositivo già associato si riconnette con sole modifiche di metadati non sensibili
(ad esempio nome visualizzato o indizi sulla piattaforma client), OpenClaw lo tratta
come `metadata-upgrade`. L'auto-approvazione silenziosa è limitata: si applica solo ai
ricollegamenti di CLI/helper locali fidati che hanno già dimostrato il possesso del
token o della password condivisi su loopback. I client browser/UI di controllo e i client
remoti continuano a usare il flusso di riapprovazione esplicita. Gli upgrade di ambito (da read a
write/admin) e i cambi di chiave pubblica **non** sono idonei all'auto-approvazione dell'upgrade dei metadati — restano richieste di riapprovazione esplicita.

## Helper di associazione QR

`/pair qr` visualizza il payload di associazione come media strutturati così i client
mobili e browser possono scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di associazione in sospeso obsolete per quell'id dispositivo, così `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'associazione del Gateway tratta una connessione come loopback solo quando sia il socket grezzo
sia qualsiasi evidenza del proxy upstream concordano. Se una richiesta arriva su loopback ma
porta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che puntano
a un'origine non locale, quell'evidenza degli header inoltrati invalida la pretesa di località loopback. Il percorso di associazione richiede quindi un'approvazione esplicita invece di trattare silenziosamente la richiesta come una connessione dallo stesso host. Vedi
[Autenticazione Trusted Proxy](/it/gateway/trusted-proxy-auth) per la regola equivalente su
autenticazione operator.

## Archiviazione (locale, privata)

Lo stato di associazione viene memorizzato sotto la directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- Ruotare un token richiede la riapprovazione (oppure l'eliminazione della voce del Node).

## Comportamento del trasporto

- Il trasporto è **stateless**; non memorizza l'appartenenza.
- Se il Gateway è offline o l'associazione è disabilitata, i Node non possono associarsi.
- Se il Gateway è in modalità remota, l'associazione avviene comunque rispetto all'archivio del Gateway remoto.

## Correlati

- [Associazione del canale](/it/channels/pairing)
- [Nodes](/it/nodes)
- [CLI Devices](/it/cli/devices)
