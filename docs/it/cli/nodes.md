---
read_when:
    - Stai gestendo Node abbinati (fotocamere, schermo, canvas)
    - Devi approvare richieste o invocare comandi del Node
summary: Riferimento CLI per `openclaw nodes` (stato, abbinamento, invocazione, camera/canvas/schermo)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gestisci i Node abbinati (dispositivi) e richiama le capacità dei Node.

Correlati:

- Panoramica dei Node: [Node](/it/nodes)
- Fotocamera: [Node fotocamera](/it/nodes/camera)
- Immagini: [Node immagini](/it/nodes/images)

Opzioni comuni:

- `--url`, `--token`, `--timeout`, `--json`

## Comandi comuni

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` stampa le tabelle dei Node in sospeso/abbinati. Le righe abbinate includono il tempo trascorso dalla connessione più recente (Last Connect).
Usa `--connected` per mostrare solo i Node attualmente connessi. Usa `--last-connected <duration>` per
filtrare i Node che si sono connessi entro una durata specifica (ad esempio `24h`, `7d`).

Nota sull'approvazione:

- `openclaw nodes pending` richiede solo l'ambito di abbinamento.
- `gateway.nodes.pairing.autoApproveCidrs` può saltare il passaggio in sospeso solo per
  l'abbinamento di dispositivi `role: node` esplicitamente attendibili e alla prima associazione. È disattivato per
  impostazione predefinita e non approva gli upgrade.
- `openclaw nodes approve <requestId>` eredita requisiti di ambito aggiuntivi dalla
  richiesta in sospeso:
  - richiesta senza comandi: solo abbinamento
  - comandi Node non-exec: abbinamento + scrittura
  - `system.run` / `system.run.prepare` / `system.which`: abbinamento + admin

## Richiama

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flag di invocazione:

- `--params <json>`: stringa oggetto JSON (predefinito `{}`).
- `--invoke-timeout <ms>`: timeout di invocazione del Node (predefinito `15000`).
- `--idempotency-key <key>`: chiave di idempotenza facoltativa.
- `system.run` e `system.run.prepare` sono bloccati qui; usa lo strumento `exec` con `host=node` per l'esecuzione della shell.

Per l'esecuzione della shell su un Node, usa lo strumento `exec` con `host=node` invece di `openclaw nodes run`.
La CLI `nodes` è ora focalizzata sulle capacità: RPC diretto tramite `nodes invoke`, più abbinamento, fotocamera,
schermo, posizione, canvas e notifiche.

## Correlati

- [Riferimento CLI](/it/cli)
- [Node](/it/nodes)
