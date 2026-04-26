---
read_when:
    - Implementazione delle approvazioni di abbinamento dei nodi senza interfaccia macOS
    - Aggiunta di flussi CLI per approvare nodi remoti
    - Estensione del protocollo Gateway con gestione dei nodi
summary: Abbinamento dei nodi gestito dal Gateway (Opzione B) per iOS e altri nodi remoti
title: Abbinamento gestito dal Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Nell'abbinamento gestito dal Gateway, il **Gateway** è la fonte di verità per stabilire quali nodi
sono autorizzati a unirsi. Le UI (app macOS, futuri client) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i nodi WS usano **l'abbinamento dispositivo** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di abbinamento separato e **non** controlla l'handshake WS.
Usano questo flusso solo i client che chiamano esplicitamente `node.pair.*`.

## Concetti

- **Richiesta in sospeso**: un nodo ha chiesto di unirsi; richiede approvazione.
- **Nodo abbinato**: nodo approvato con token di autenticazione emesso.
- **Trasporto**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto legacy per il bridge TCP è stato rimosso.)

## Come funziona l'abbinamento

1. Un nodo si connette al WS del Gateway e richiede l'abbinamento.
2. Il Gateway archivia una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. In caso di approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati al ri-abbinamento).
5. Il nodo si riconnette usando il token ed è ora “abbinato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Flusso CLI (adatto ad ambienti headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i nodi abbinati/connessi e le relative capacità.

## Superficie API (protocollo gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riusa una richiesta in sospeso.
- `node.pair.list` — elenca nodi in sospeso + abbinati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per nodo: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso nodo in sospeso aggiornano anche i metadati del nodo
  archiviati e l'ultimo snapshot dei comandi dichiarati in allowlist per visibilità dell'operatore.
- L'approvazione **genera sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- Le richieste possono includere `silent: true` come suggerimento per i flussi di auto-approvazione.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comandi non-exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- L'abbinamento dei nodi è un flusso di fiducia/identità più emissione di token.
- **Non** fissa la superficie dei comandi live del nodo per singolo nodo.
- I comandi live del nodo derivano da ciò che il nodo dichiara alla connessione dopo
  l'applicazione del criterio globale dei comandi del nodo del gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- Il criterio per nodo `system.run` allow/ask risiede sul nodo in
  `exec.approvals.node.*`, non nel record di abbinamento.

## Controllo dei comandi del nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi del nodo sono disabilitati finché l'abbinamento del nodo non viene approvato. Il solo abbinamento del dispositivo non è più sufficiente per esporre i comandi del nodo dichiarati.
</Warning>

Quando un nodo si connette per la prima volta, l'abbinamento viene richiesto automaticamente. Finché la richiesta di abbinamento non viene approvata, tutti i comandi del nodo in sospeso di quel nodo vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite l'approvazione dell'abbinamento, i comandi dichiarati del nodo diventano disponibili soggetti al normale criterio dei comandi.

Questo significa:

- I nodi che in precedenza facevano affidamento solo sull'abbinamento del dispositivo per esporre comandi ora devono completare l'abbinamento del nodo.
- I comandi messi in coda prima dell'approvazione dell'abbinamento vengono eliminati, non differiti.

## Confini di fiducia degli eventi del nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dal nodo ora restano su una superficie trusted ridotta.
</Warning>

I riepiloghi originati dal nodo e gli eventi di sessione correlati sono limitati alla superficie trusted prevista. I flussi guidati da notifiche o attivati dal nodo che in precedenza facevano affidamento su un accesso più ampio a host o strumenti di sessione potrebbero richiedere adattamenti. Questo rafforzamento garantisce che gli eventi del nodo non possano trasformarsi in accesso a strumenti a livello host oltre quanto consentito dal confine di fiducia del nodo.

## Auto-approvazione (app macOS)

L'app macOS può facoltativamente tentare una **approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, il sistema torna al normale prompt “Approve/Reject”.

## Auto-approvazione del dispositivo per CIDR trusted

L'abbinamento del dispositivo WS per `role: node` resta manuale per impostazione predefinita. Per reti
private di nodi in cui il Gateway già si fida del percorso di rete, gli operatori possono
fare opt-in con CIDR espliciti o IP esatti:

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

- Disabilitato quando `gateway.nodes.pairing.autoApproveCidrs` non è impostato.
- Non esiste alcuna modalità di auto-approvazione generalizzata per LAN o rete privata.
- Sono idonei solo nuovi abbinamenti dispositivo `role: node` senza scope richiesti.
- I client operator, browser, Control UI e WebChat restano manuali.
- Gli upgrade di ruolo, scope, metadati e chiave pubblica restano manuali.
- I percorsi di header trusted-proxy loopback sullo stesso host non sono idonei perché quel
  percorso può essere falsificato da chiamanti locali.

## Auto-approvazione dell'upgrade dei metadati

Quando un dispositivo già abbinato si riconnette con sole modifiche non sensibili ai metadati
(per esempio, nome visualizzato o suggerimenti sulla piattaforma client), OpenClaw lo tratta
come `metadata-upgrade`. L'auto-approvazione silenziosa è limitata: si applica solo
a riconnessioni locali trusted non-browser che hanno già dimostrato il possesso di credenziali locali
o condivise, incluse riconnessioni di app native sullo stesso host dopo modifiche ai metadati
della versione del sistema operativo. I client browser/Control UI e i client remoti usano comunque
il flusso di ri-approvazione esplicita. Gli upgrade di scope (da read a write/admin) e le modifiche
della chiave pubblica **non** sono idonei all'auto-approvazione dell'upgrade dei metadati —
restano richieste di ri-approvazione esplicita.

## Helper di abbinamento QR

`/pair qr` renderizza il payload di abbinamento come media strutturato così i client mobili e
browser possono scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di abbinamento in sospeso obsolete per quell'ID
dispositivo, così `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'abbinamento Gateway tratta una connessione come loopback solo quando sia il socket grezzo
sia qualsiasi evidenza proxy upstream concordano. Se una richiesta arriva su loopback ma
trasporta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che puntano
a un'origine non locale, quell'evidenza degli header inoltrati invalida la pretesa di località
loopback. Il percorso di abbinamento richiede quindi approvazione esplicita invece di trattare
silenziosamente la richiesta come una connessione sullo stesso host. Vedi
[Trusted Proxy Auth](/it/gateway/trusted-proxy-auth) per la regola equivalente su
autenticazione operatore.

## Archiviazione (locale, privata)

Lo stato di abbinamento viene archiviato sotto la directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se fai override di `OPENCLAW_STATE_DIR`, anche la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono secret; tratta `paired.json` come sensibile.
- La rotazione di un token richiede una nuova approvazione (oppure l'eliminazione della voce del nodo).

## Comportamento del trasporto

- Il trasporto è **stateless**; non archivia l'appartenenza.
- Se il Gateway è offline o l'abbinamento è disabilitato, i nodi non possono abbinarsi.
- Se il Gateway è in modalità remota, l'abbinamento avviene comunque rispetto all'archivio del Gateway remoto.

## Correlati

- [Abbinamento del canale](/it/channels/pairing)
- [Nodes](/it/nodes)
- [CLI dei dispositivi](/it/cli/devices)
