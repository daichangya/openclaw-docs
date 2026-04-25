---
read_when:
    - Modificare le regole dei messaggi di gruppo o le menzioni
summary: Comportamento e configurazione per la gestione dei messaggi di gruppo di WhatsApp (`mentionPatterns` è condiviso tra le superfici)
title: Messaggi di gruppo
x-i18n:
    generated_at: "2026-04-25T13:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Comportamento e configurazione per la gestione dei messaggi di gruppo di WhatsApp (`mentionPatterns` è ora condiviso anche tra Telegram/Discord/Slack/iMessage) con un focus sul comportamento specifico di WhatsApp.

Nota: `agents.list[].groupChat.mentionPatterns` è ora usato anche da Telegram/Discord/Slack/iMessage; questa documentazione si concentra sul comportamento specifico di WhatsApp. Per configurazioni multi-agente, imposta `agents.list[].groupChat.mentionPatterns` per ogni agente (oppure usa `messages.groupChat.mentionPatterns` come fallback globale).

## Implementazione attuale (2025-12-03)

- Modalità di attivazione: `mention` (predefinita) oppure `always`. `mention` richiede un ping (vere @-mention di WhatsApp tramite `mentionedJids`, pattern regex sicuri, oppure il numero E.164 del bot in qualunque punto del testo). `always` attiva l'agente su ogni messaggio, ma dovrebbe rispondere solo quando può aggiungere valore in modo significativo; altrimenti restituisce il token silenzioso esatto `NO_REPLY` / `no_reply`. I valori predefiniti possono essere impostati nella configurazione (`channels.whatsapp.groups`) e sovrascritti per singolo gruppo tramite `/activation`. Quando `channels.whatsapp.groups` è impostato, funge anche da allowlist per i gruppi (includi `"*"` per consentire tutti).
- Policy dei gruppi: `channels.whatsapp.groupPolicy` controlla se i messaggi di gruppo sono accettati (`open|disabled|allowlist`). `allowlist` usa `channels.whatsapp.groupAllowFrom` (fallback: `channels.whatsapp.allowFrom` esplicito). Il valore predefinito è `allowlist` (bloccato finché non aggiungi mittenti).
- Sessioni per gruppo: le chiavi di sessione hanno il formato `agent:<agentId>:whatsapp:group:<jid>`, quindi comandi come `/verbose on`, `/trace on` o `/think high` (inviati come messaggi standalone) sono limitati a quel gruppo; lo stato dei messaggi diretti personali resta invariato. Gli Heartbeat vengono saltati per i thread di gruppo.
- Iniezione del contesto: i messaggi di gruppo **solo in attesa** (predefinito 50) che _non_ hanno attivato un'esecuzione vengono prefissati sotto `[Chat messages since your last reply - for context]`, con la riga che ha attivato l'esecuzione sotto `[Current message - respond to this]`. I messaggi già presenti nella sessione non vengono reiniettati.
- Esposizione del mittente: ogni batch di gruppo ora termina con `[from: Nome mittente (+E164)]`, così Pi sa chi sta parlando.
- Effimeri/view-once: li decomprimiamo prima di estrarre testo/mention, quindi i ping al loro interno attivano comunque l'agente.
- Prompt di sistema del gruppo: al primo turno di una sessione di gruppo (e ogni volta che `/activation` cambia modalità) iniettiamo un breve testo nel prompt di sistema, ad esempio `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Se i metadati non sono disponibili, diciamo comunque all'agente che si tratta di una chat di gruppo.

## Esempio di configurazione (WhatsApp)

Aggiungi un blocco `groupChat` a `~/.openclaw/openclaw.json` in modo che i ping basati sul nome visualizzato funzionino anche quando WhatsApp rimuove il `@` visivo dal corpo del testo:

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

- Le regex non distinguono tra maiuscole e minuscole e usano le stesse protezioni safe-regex delle altre superfici regex della configurazione; i pattern non validi e le ripetizioni annidate non sicure vengono ignorati.
- WhatsApp invia comunque le mention canoniche tramite `mentionedJids` quando qualcuno tocca il contatto, quindi il fallback sul numero raramente è necessario, ma è una rete di sicurezza utile.

### Comando di attivazione (solo proprietario)

Usa il comando della chat di gruppo:

- `/activation mention`
- `/activation always`

Solo il numero del proprietario (da `channels.whatsapp.allowFrom`, oppure l'E.164 del bot stesso se non impostato) può modificarlo. Invia `/status` come messaggio standalone nel gruppo per vedere la modalità di attivazione corrente.

## Come usarlo

1. Aggiungi il tuo account WhatsApp (quello che esegue OpenClaw) al gruppo.
2. Scrivi `@openclaw …` (oppure includi il numero). Solo i mittenti presenti nell'allowlist possono attivarlo, a meno che tu non imposti `groupPolicy: "open"`.
3. Il prompt dell'agente includerà il contesto recente del gruppo più il marcatore finale `[from: …]`, così potrà rivolgersi alla persona giusta.
4. Le direttive a livello di sessione (`/verbose on`, `/trace on`, `/think high`, `/new` o `/reset`, `/compact`) si applicano solo alla sessione di quel gruppo; inviale come messaggi standalone in modo che vengano registrate. La tua sessione DM personale resta indipendente.

## Test / verifica

- Smoke test manuale:
  - Invia un ping `@openclaw` nel gruppo e conferma una risposta che faccia riferimento al nome del mittente.
  - Invia un secondo ping e verifica che il blocco della cronologia venga incluso e poi cancellato al turno successivo.
- Controlla i log del gateway (esegui con `--verbose`) per vedere le voci `inbound web message` che mostrano `from: <groupJid>` e il suffisso `[from: …]`.

## Considerazioni note

- Gli Heartbeat vengono intenzionalmente saltati per i gruppi per evitare broadcast rumorosi.
- La soppressione dell'eco usa la stringa batch combinata; se invii due volte lo stesso testo senza mention, solo il primo riceverà una risposta.
- Le voci del session store appariranno come `agent:<agentId>:whatsapp:group:<jid>` nel session store (`~/.openclaw/agents/<agentId>/sessions/sessions.json` per impostazione predefinita); un'assenza significa solo che il gruppo non ha ancora attivato un'esecuzione.
- Gli indicatori di digitazione nei gruppi seguono `agents.defaults.typingMode` (predefinito: `message` quando non c'è una mention).

## Correlati

- [Gruppi](/it/channels/groups)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Gruppi broadcast](/it/channels/broadcast-groups)
