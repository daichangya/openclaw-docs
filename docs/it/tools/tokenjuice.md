---
read_when:
    - Vuoi risultati più brevi degli strumenti `exec` o `bash` in OpenClaw
    - Vuoi abilitare il Plugin tokenjuice incluso
    - Ti serve capire cosa cambia tokenjuice e cosa lascia grezzo
summary: Compatta i risultati rumorosi degli strumenti exec e bash con un Plugin incluso facoltativo
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T13:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` è un Plugin incluso facoltativo che compatta i risultati rumorosi degli strumenti `exec` e `bash` dopo che il comando è già stato eseguito.

Modifica il `tool_result` restituito, non il comando stesso. Tokenjuice non riscrive l'input della shell, non riesegue i comandi e non cambia gli exit code.

Oggi questo si applica alle esecuzioni PI integrate e agli strumenti dinamici OpenClaw nell'harness app-server Codex. Tokenjuice si aggancia al middleware dei risultati degli strumenti di OpenClaw e riduce l'output prima che ritorni nella sessione harness attiva.

## Abilita il Plugin

Percorso rapido:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw distribuisce già il Plugin. Non esiste un passaggio separato `plugins install`
o `tokenjuice install openclaw`.

Se preferisci modificare direttamente la configurazione:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Cosa cambia tokenjuice

- Compatta i risultati rumorosi di `exec` e `bash` prima che vengano reinseriti nella sessione.
- Mantiene invariata l'esecuzione del comando originale.
- Preserva le letture esatte del contenuto dei file e gli altri comandi che tokenjuice deve lasciare grezzi.
- Resta opzionale: disabilita il Plugin se vuoi output verbatim ovunque.

## Verifica che funzioni

1. Abilita il Plugin.
2. Avvia una sessione che possa chiamare `exec`.
3. Esegui un comando rumoroso come `git status`.
4. Controlla che il risultato dello strumento restituito sia più breve e più strutturato dell'output grezzo della shell.

## Disabilita il Plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oppure:

```bash
openclaw plugins disable tokenjuice
```

## Correlati

- [Strumento Exec](/it/tools/exec)
- [Livelli di thinking](/it/tools/thinking)
- [Motore di contesto](/it/concepts/context-engine)
