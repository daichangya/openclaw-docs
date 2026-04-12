---
read_when:
    - Modifica delle regole dei messaggi di gruppo o delle menzioni
summary: Comportamento e configurazione per la gestione dei messaggi di gruppo di WhatsApp (`mentionPatterns` sono condivisi tra le varie superfici)
title: Messaggi di gruppo
x-i18n:
    generated_at: "2026-04-12T23:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d9484dd1de74d42f8dce4c3ac80d60c24864df30a7802e64893ef55506230fe
    source_path: channels/group-messages.md
    workflow: 15
---

# Messaggi di gruppo (canale web di WhatsApp)

Obiettivo: consentire a Clawd di restare nei gruppi WhatsApp, attivarsi solo quando viene chiamato e mantenere quel thread separato dalla sessione DM personale.

Nota: `agents.list[].groupChat.mentionPatterns` ora viene usato anche da Telegram/Discord/Slack/iMessage; questa documentazione si concentra sul comportamento specifico di WhatsApp. Per configurazioni multi-agente, imposta `agents.list[].groupChat.mentionPatterns` per agente (oppure usa `messages.groupChat.mentionPatterns` come fallback globale).

## Implementazione attuale (2025-12-03)

- Modalità di attivazione: `mention` (predefinita) oppure `always`. `mention` richiede un ping (vere @-menzioni di WhatsApp tramite `mentionedJids`, pattern regex sicuri o il numero E.164 del bot in qualsiasi punto del testo). `always` attiva l'agente a ogni messaggio, ma dovrebbe rispondere solo quando può aggiungere un valore significativo; altrimenti restituisce l'esatto token silenzioso `NO_REPLY` / `no_reply`. I valori predefiniti possono essere impostati nella configurazione (`channels.whatsapp.groups`) e sovrascritti per singolo gruppo tramite `/activation`. Quando `channels.whatsapp.groups` è impostato, funziona anche come allowlist dei gruppi (includi `"*"` per consentire tutti).
- Criterio dei gruppi: `channels.whatsapp.groupPolicy` controlla se i messaggi di gruppo sono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non aggiungi mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno il formato `agent:<agentId>:whatsapp:group:<jid>`, quindi comandi come `/verbose on`, `/trace on` o `/think high` (inviati come messaggi autonomi) sono limitati a quel gruppo; lo stato dei DM personali non viene toccato. Gli Heartbeat vengono saltati per i thread di gruppo.
- Iniezione del contesto: i messaggi di gruppo **solo in sospeso** (predefinito 50) che _non_ hanno attivato un'esecuzione vengono prefissati sotto `[Chat messages since your last reply - for context]`, con la riga che ha attivato l'esecuzione sotto `[Current message - respond to this]`. I messaggi già presenti nella sessione non vengono reinseriti.
- Visualizzazione del mittente: ogni batch di gruppo ora termina con `[from: Sender Name (+E164)]`, così Pi sa chi sta parlando.
- Effimeri/view-once: li scartiamo prima di estrarre testo/menzioni, quindi i ping al loro interno attivano comunque la risposta.
- Prompt di sistema del gruppo: al primo turno di una sessione di gruppo (e ogni volta che `/activation` cambia la modalità) iniettiamo un breve testo nel prompt di sistema come `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se i metadati non sono disponibili, diciamo comunque all'agente che si tratta di una chat di gruppo.

## Esempio di configurazione (WhatsApp)

Aggiungi un blocco `groupChat` a `~/.openclaw/openclaw.json` in modo che i ping tramite nome visualizzato funzionino anche quando WhatsApp rimuove la `@` visiva dal corpo del testo:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Note:

- Le regex non distinguono tra maiuscole e minuscole e usano gli stessi vincoli di sicurezza regex delle altre superfici regex di configurazione; i pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- WhatsApp invia comunque menzioni canoniche tramite `mentionedJids` quando qualcuno tocca il contatto, quindi il fallback sul numero è raramente necessario ma resta una rete di sicurezza utile.

### Comando di attivazione (solo proprietario)

Usa il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo il numero del proprietario (da `channels.whatsapp.allowFrom`, oppure l'E.164 del bot stesso se non impostato) può cambiarlo. Invia `/status` come messaggio autonomo nel gruppo per vedere la modalità di attivazione attuale.

## Come usarlo

1. Aggiungi il tuo account WhatsApp (quello che esegue OpenClaw) al gruppo.
2. Scrivi `@openclaw …` (oppure includi il numero). Solo i mittenti nell'allowlist possono attivarlo, a meno che tu non imposti `groupPolicy: "open"`.
3. Il prompt dell'agente includerà il contesto recente del gruppo più il marker finale `[from: …]`, così potrà rivolgersi alla persona giusta.
4. Le direttive a livello di sessione (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviale come messaggi autonomi in modo che vengano registrate. La tua sessione DM personale resta indipendente.

## Test / verifica

- Smoke test manuale:
  - Invia un ping `@openclaw` nel gruppo e conferma una risposta che faccia riferimento al nome del mittente.
  - Invia un secondo ping e verifica che il blocco della cronologia venga incluso e poi cancellato al turno successivo.
- Controlla i log del gateway (eseguito con `--verbose`) per vedere le voci `inbound web message` che mostrano `from: <groupJid>` e il suffisso `[from: …]`.

## Considerazioni note

- Gli Heartbeat vengono intenzionalmente saltati per i gruppi, per evitare broadcast rumorosi.
- La soppressione dell'eco usa la stringa batch combinata; se invii due volte lo stesso testo senza menzioni, solo il primo riceverà una risposta.
- Le voci dell'archivio sessioni appariranno come `agent:<agentId>:whatsapp:group:<jid>` nell'archivio sessioni (`~/.openclaw/agents/<agentId>/sessions/sessions.json` per impostazione predefinita); un'assenza della voce significa solo che il gruppo non ha ancora attivato un'esecuzione.
- Gli indicatori di digitazione nei gruppi seguono `agents.defaults.typingMode` (predefinito: `message` quando non menzionato).
