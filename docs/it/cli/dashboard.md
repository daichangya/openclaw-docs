---
read_when:
    - Vuoi aprire la UI di controllo con il tuo token attuale
    - Vuoi stampare l'URL senza avviare un browser
summary: Riferimento CLI per `openclaw dashboard` (apri la UI di controllo)
title: Dashboard
x-i18n:
    generated_at: "2026-04-25T13:43:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Apri la UI di controllo usando l'autenticazione attuale.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Note:

- `dashboard` risolve i SecretRef configurati di `gateway.auth.token` quando possibile.
- `dashboard` segue `gateway.tls.enabled`: i Gateway con TLS abilitato stampano/aprono
  URL della UI di controllo `https://` e si connettono tramite `wss://`.
- Per i token gestiti da SecretRef (risolti o non risolti), `dashboard` stampa/copia/apre un URL senza token per evitare di esporre segreti esterni nell'output del terminale, nella cronologia degli appunti o negli argomenti di avvio del browser.
- Se `gateway.auth.token` è gestito da SecretRef ma non è risolto in questo percorso di comando, il comando stampa un URL senza token e indicazioni operative esplicite per la correzione invece di incorporare un segnaposto di token non valido.

## Correlati

- [Riferimento CLI](/it/cli)
- [Dashboard](/it/web/dashboard)
