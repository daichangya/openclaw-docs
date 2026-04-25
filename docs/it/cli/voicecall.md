---
read_when:
    - Usi il Plugin per chiamate vocali e vuoi i punti di ingresso della CLI
    - Vuoi esempi rapidi per `voicecall setup|smoke|call|continue|dtmf|status|tail|expose`
summary: Riferimento CLI per `openclaw voicecall` (superficie di comando del Plugin per chiamate vocali)
title: Chiamata vocale
x-i18n:
    generated_at: "2026-04-25T13:44:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 15
---

# `openclaw voicecall`

`voicecall` è un comando fornito da un Plugin. Compare solo se il Plugin per chiamate vocali è installato e abilitato.

Documentazione principale:

- Plugin per chiamate vocali: [Voice Call](/it/plugins/voice-call)

## Comandi comuni

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` stampa controlli di disponibilità leggibili dalle persone per impostazione predefinita. Usa `--json` per
gli script:

```bash
openclaw voicecall setup --json
```

Per i provider esterni (`twilio`, `telnyx`, `plivo`), la configurazione iniziale deve risolvere un
URL Webhook pubblico da `publicUrl`, un tunnel o esposizione Tailscale. Un fallback di servizio
loopback/privato viene rifiutato perché gli operatori non possono raggiungerlo.

`smoke` esegue gli stessi controlli di disponibilità. Non effettuerà una vera chiamata telefonica
a meno che non siano presenti sia `--to` sia `--yes`:

```bash
openclaw voicecall smoke --to "+15555550123"        # prova a secco
openclaw voicecall smoke --to "+15555550123" --yes  # chiamata notify reale
```

## Esporre i Webhook (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

Nota di sicurezza: esponi l'endpoint Webhook solo a reti di cui ti fidi. Preferisci Tailscale Serve a Funnel quando possibile.

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin per chiamate vocali](/it/plugins/voice-call)
