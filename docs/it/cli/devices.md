---
read_when:
    - Stai approvando richieste di pairing del dispositivo
    - Devi ruotare o revocare i token del dispositivo
summary: Riferimento CLI per `openclaw devices` (pairing del dispositivo + rotazione/revoca del token)
title: Dispositivi
x-i18n:
    generated_at: "2026-04-26T11:25:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestisci le richieste di pairing dei dispositivi e i token con ambito dispositivo.

## Comandi

### `openclaw devices list`

Elenca le richieste di pairing in sospeso e i dispositivi associati.

```
openclaw devices list
openclaw devices list --json
```

L'output delle richieste in sospeso mostra l'accesso richiesto accanto all'accesso
attualmente approvato del dispositivo quando il dispositivo è già associato. Questo rende
espliciti gli aggiornamenti di scope/ruolo invece di far sembrare che il pairing sia andato perso.

### `openclaw devices remove <deviceId>`

Rimuovi una voce di dispositivo associato.

Quando sei autenticato con un token di dispositivo associato, i chiamanti non admin possono
rimuovere solo la voce del **proprio** dispositivo. La rimozione di un altro dispositivo richiede
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Cancella in blocco i dispositivi associati.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Approva una richiesta di pairing dispositivo in sospeso tramite `requestId` esatto. Se `requestId`
viene omesso o viene passato `--latest`, OpenClaw stampa soltanto la richiesta in sospeso
selezionata ed esce; riesegui l'approvazione con l'ID richiesta esatto dopo aver verificato
i dettagli.

Nota: se un dispositivo ritenta il pairing con dettagli di autenticazione modificati (ruolo/scope/chiave pubblica),
OpenClaw sostituisce la precedente voce in sospeso ed emette un nuovo
`requestId`. Esegui `openclaw devices list` subito prima dell'approvazione per usare l'ID
corrente.

Se il dispositivo è già associato e richiede scope più ampi o un ruolo più ampio,
OpenClaw mantiene l'approvazione esistente e crea una nuova richiesta di aggiornamento
in sospeso. Controlla le colonne `Requested` e `Approved` in `openclaw devices list`
oppure usa `openclaw devices approve --latest` per visualizzare in anteprima l'esatto aggiornamento prima
di approvarlo.

Se il Gateway è configurato esplicitamente con
`gateway.nodes.pairing.autoApproveCidrs`, le richieste iniziali `role: node` da IP client corrispondenti
possono essere approvate prima di comparire in questo elenco. Questa policy
è disabilitata per impostazione predefinita e non si applica mai a client operator/browser o a richieste di aggiornamento.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rifiuta una richiesta di pairing dispositivo in sospeso.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Ruota un token dispositivo per un ruolo specifico (aggiornando facoltativamente gli scope).
Il ruolo di destinazione deve esistere già nel contratto di pairing approvato di quel dispositivo;
la rotazione non può generare un nuovo ruolo non approvato.
Se ometti `--scope`, le riconnessioni successive con il token ruotato memorizzato riutilizzano gli
scope approvati memorizzati nella cache di quel token. Se passi valori `--scope` espliciti, questi
diventano l'insieme di scope memorizzato per future riconnessioni con token in cache.
I chiamanti non admin con dispositivo associato possono ruotare solo il token del **proprio** dispositivo.
L'insieme di scope del token di destinazione deve rimanere entro gli scope operator del chiamante stesso;
la rotazione non può generare né mantenere un token operator più ampio di quello
che il chiamante possiede già.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Restituisce il payload del nuovo token come JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token dispositivo per un ruolo specifico.

I chiamanti non admin con dispositivo associato possono revocare solo il token del **proprio** dispositivo.
La revoca del token di un altro dispositivo richiede `operator.admin`.
Anche l'insieme di scope del token di destinazione deve rientrare negli
scope operator del chiamante; i chiamanti solo pairing non possono revocare token operator admin/write.

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
Passa esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.

## Note

- La rotazione del token restituisce un nuovo token (sensibile). Trattalo come un segreto.
- Questi comandi richiedono scope `operator.pairing` (o `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` è una policy Gateway opzionale per
  il solo pairing iniziale dei dispositivi node; non modifica l'autorità di approvazione della CLI.
- La rotazione e la revoca del token restano entro l'insieme di ruoli di pairing approvati e
  la baseline di scope approvata per quel dispositivo. Una voce di token in cache fuori posto non
  concede un target di gestione token.
- Per le sessioni token di dispositivo associato, la gestione cross-device è solo admin:
  `remove`, `rotate` e `revoke` sono solo self a meno che il chiamante non abbia
  `operator.admin`.
- La mutazione del token è anche contenuta negli scope del chiamante: una sessione solo pairing non può
  ruotare o revocare un token che attualmente ha `operator.admin` o
  `operator.write`.
- `devices clear` è intenzionalmente protetto da `--yes`.
- Se lo scope di pairing non è disponibile su local loopback (e non viene passato alcun `--url` esplicito), list/approve possono usare un fallback di pairing locale.
- `devices approve` richiede un ID richiesta esplicito prima di generare token; omettere `requestId` o passare `--latest` mostra solo in anteprima la richiesta in sospeso più recente.

## Checklist di recupero da deriva del token

Usala quando Control UI o altri client continuano a fallire con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Conferma l'origine del token gateway corrente:

```bash
openclaw config get gateway.auth.token
```

2. Elenca i dispositivi associati e identifica l'ID del dispositivo interessato:

```bash
openclaw devices list
```

3. Ruota il token operator per il dispositivo interessato:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Se la rotazione non è sufficiente, rimuovi il pairing obsoleto e approva di nuovo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Riprova la connessione del client con il token/password condiviso corrente.

Note:

- La normale precedenza di autenticazione alla riconnessione è prima token/password condiviso esplicito, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token bootstrap.
- Il recupero affidabile da `AUTH_TOKEN_MISMATCH` può inviare temporaneamente insieme sia il token condiviso sia il token dispositivo memorizzato per quell'unico tentativo limitato.

Correlati:

- [Risoluzione dei problemi di autenticazione Dashboard](/it/web/dashboard#if-you-see-unauthorized-1008)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
