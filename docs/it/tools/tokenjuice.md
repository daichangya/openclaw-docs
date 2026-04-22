---
read_when:
    - Vuoi risultati degli strumenti `exec` o `bash` più brevi in OpenClaw
    - Vuoi abilitare il plugin tokenjuice incluso nel pacchetto
    - Hai bisogno di capire cosa modifica tokenjuice e cosa lascia grezzo
summary: Compatta i risultati rumorosi degli strumenti exec e bash con un plugin incluso facoltativo
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-22T08:21:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b9a1054c9b1cc62e43ac6d5904c7790f9b27d8e0d0700c9da6e287c00e91783
    source_path: tools/tokenjuice.md
    workflow: 15
---

# Tokenjuice

`tokenjuice` è un plugin incluso facoltativo che compatta i risultati rumorosi degli strumenti `exec` e `bash` dopo che il comando è già stato eseguito.

Modifica il `tool_result` restituito, non il comando stesso. Tokenjuice non riscrive l'input della shell, non riesegue i comandi e non cambia i codici di uscita.

Attualmente questo si applica alle esecuzioni incorporate di Pi, in cui tokenjuice si aggancia al percorso incorporato di `tool_result` e riduce l'output che torna nella sessione.

## Abilita il plugin

Percorso rapido:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw include già il plugin. Non esiste un passaggio separato `plugins install` o `tokenjuice install openclaw`.

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
- Lascia invariata l'esecuzione originale del comando.
- Preserva le letture esatte del contenuto dei file e gli altri comandi che tokenjuice deve lasciare grezzi.
- Resta su base opt-in: disabilita il plugin se vuoi output letterale ovunque.

## Verifica che funzioni

1. Abilita il plugin.
2. Avvia una sessione che possa chiamare `exec`.
3. Esegui un comando rumoroso come `git status`.
4. Verifica che il risultato dello strumento restituito sia più breve e più strutturato dell'output grezzo della shell.

## Disabilita il plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

Oppure:

```bash
openclaw plugins disable tokenjuice
```
