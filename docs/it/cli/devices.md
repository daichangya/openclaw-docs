---
read_when:
    - Stai approvando richieste di abbinamento dei dispositivi
    - Devi ruotare o revocare i token dei dispositivi
summary: Riferimento CLI per `openclaw devices` (abbinamento dei dispositivi + rotazione/revoca del token)
title: Dispositivi
x-i18n:
    generated_at: "2026-04-25T13:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestisci le richieste di abbinamento dei dispositivi e i token con ambito dispositivo.

## Comandi

### `openclaw devices list`

Elenca le richieste di abbinamento in sospeso e i dispositivi abbinati.

```
openclaw devices list
openclaw devices list --json
```

L'output delle richieste in sospeso mostra l'accesso richiesto accanto all'accesso attualmente
approvato del dispositivo quando il dispositivo è già abbinato. Questo rende espliciti
gli upgrade di ambito/ruolo invece di far sembrare che l'abbinamento sia andato perso.

### `openclaw devices remove <deviceId>`

Rimuovi una voce di dispositivo abbinato.

Quando sei autenticato con un token di dispositivo abbinato, i chiamanti non admin possono
rimuovere solo la voce del **proprio** dispositivo. La rimozione di un altro dispositivo richiede
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Cancella in blocco i dispositivi abbinati.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approva una richiesta di abbinamento del dispositivo in sospeso tramite `requestId` esatto. Se `requestId`
viene omesso o viene passato `--latest`, OpenClaw stampa solo la richiesta in sospeso
selezionata ed esce; riesegui l'approvazione con l'ID richiesta esatto dopo aver verificato
i dettagli.

Nota: se un dispositivo ritenta l'abbinamento con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), OpenClaw sostituisce la precedente voce in sospeso ed emette un nuovo
`requestId`. Esegui `openclaw devices list` subito prima dell'approvazione per usare l'ID
corrente.

Se il dispositivo è già abbinato e richiede ambiti più ampi o un ruolo più ampio,
OpenClaw mantiene l'approvazione esistente e crea una nuova richiesta di upgrade in sospeso.
Controlla le colonne `Requested` e `Approved` in `openclaw devices list`
oppure usa `openclaw devices approve --latest` per visualizzare in anteprima l'upgrade esatto prima
di approvarlo.

Se il Gateway è configurato esplicitamente con
`gateway.nodes.pairing.autoApproveCidrs`, le richieste iniziali `role: node` da
IP client corrispondenti possono essere approvate prima di comparire in questo elenco. Questa policy
è disabilitata per impostazione predefinita e non si applica mai a client operator/browser o a richieste di upgrade.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di abbinamento del dispositivo in sospeso.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota un token di dispositivo per un ruolo specifico (aggiornando facoltativamente gli ambiti).
Il ruolo di destinazione deve già esistere nel contratto di abbinamento approvato di quel dispositivo;
la rotazione non può emettere un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano gli
ambiti approvati memorizzati nella cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l'insieme di ambiti memorizzato per le future riconnessioni con token in cache.
I chiamanti non admin con dispositivo abbinato possono ruotare solo il token del **proprio**
dispositivo. Inoltre, eventuali valori `--scope` espliciti devono restare entro gli
ambiti operator del chiamante stesso; la rotazione non può emettere un token operator più ampio di quello che il chiamante
possiede già.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce il nuovo payload del token come JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token di dispositivo per un ruolo specifico.

I chiamanti non admin con dispositivo abbinato possono revocare solo il token del **proprio**
dispositivo. La revoca del token di un altro dispositivo richiede `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Restituisce il risultato della revoca come JSON.

## Opzioni comuni

- `--url <url>`: URL WebSocket del Gateway (usa `gateway.remote.url` come predefinito quando configurato).
- `--token <token>`: token del Gateway (se richiesto).
- `--password <password>`: password del Gateway (autenticazione con password).
- `--timeout <ms>`: timeout RPC.
- `--json`: output JSON (consigliato per gli script).

Nota: quando imposti `--url`, la CLI non usa come fallback le credenziali della configurazione o dell'ambiente.
Passa `--token` o `--password` esplicitamente. L'assenza di credenziali esplicite è un errore.

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono l'ambito `operator.pairing` (o `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` è una policy Gateway opzionale per
  il solo abbinamento iniziale dei dispositivi node; non modifica l'autorità di approvazione della CLI.
- La rotazione del token resta entro l'insieme di ruoli di abbinamento approvati e la baseline di ambiti approvati
  per quel dispositivo. Una voce di token in cache fuori posto non concede un nuovo
  obiettivo di rotazione.
- Per le sessioni con token di dispositivo abbinato, la gestione tra dispositivi è riservata agli admin:
  `remove`, `rotate` e `revoke` sono limitati al proprio dispositivo a meno che il chiamante non abbia
  `operator.admin`.
- `devices clear` è intenzionalmente protetto da `--yes`.
- Se l'ambito di abbinamento non è disponibile su local loopback (e non viene passato alcun `--url` esplicito), `list`/`approve` possono usare un fallback di abbinamento locale.
- `devices approve` richiede un ID richiesta esplicito prima di emettere token; omettere `requestId` o passare `--latest` mostra solo in anteprima la richiesta in sospeso più recente.

## Checklist di recupero per deriva del token

Usa questa checklist quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Conferma la sorgente del token Gateway corrente:

```bash
openclaw config get gateway.auth.token
```

2. Elenca i dispositivi abbinati e identifica l'id del dispositivo interessato:

```bash
openclaw devices list
```

3. Ruota il token operator per il dispositivo interessato:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se la rotazione non è sufficiente, rimuovi l'abbinamento obsoleto e approva di nuovo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Riprova la connessione del client con il token/password condiviso corrente.

Note:

- La normale precedenza di autenticazione in riconnessione è prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token del dispositivo memorizzato, poi token bootstrap.
- Il recupero attendibile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme sia il token condiviso sia il token del dispositivo memorizzato per quell'unico tentativo limitato.

Correlati:

- [Risoluzione dei problemi di autenticazione del Dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
