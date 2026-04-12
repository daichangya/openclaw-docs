---
x-i18n:
    generated_at: "2026-04-12T23:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# Guida alla documentazione

Questa directory gestisce la redazione della documentazione, le regole dei link di Mintlify e la policy i18n della documentazione.

## Regole di Mintlify

- La documentazione è ospitata su Mintlify (`https://docs.openclaw.ai`).
- I link interni alla documentazione in `docs/**/*.md` devono rimanere root-relative senza suffisso `.md` o `.mdx` (esempio: `[Config](/configuration)`).
- I riferimenti incrociati tra sezioni devono usare anchor su percorsi root-relative (esempio: `[Hooks](/configuration#hooks)`).
- Le intestazioni della documentazione devono evitare trattini lunghi ed apostrofi perché la generazione degli anchor in Mintlify è fragile in questi casi.
- Il README e gli altri documenti renderizzati su GitHub devono mantenere URL assoluti della documentazione, così i link funzionano anche fuori da Mintlify.
- Il contenuto della documentazione deve rimanere generico: nessun nome di dispositivo personale, hostname o percorso locale; usare segnaposto come `user@gateway-host`.

## Regole sui contenuti della documentazione

- Nella documentazione, nel testo dell'interfaccia utente e negli elenchi dei selettori, ordinare servizi/provider in ordine alfabetico, a meno che la sezione non descriva esplicitamente l'ordine di esecuzione o l'ordine di rilevamento automatico.
- Mantenere coerente la denominazione dei plugin inclusi con le regole terminologiche sui plugin definite a livello di repository nel file `AGENTS.md` principale.

## i18n della documentazione

- La documentazione in lingue straniere non viene mantenuta in questo repository. L'output pubblicato generato si trova nel repository separato `openclaw/docs` (spesso clonato localmente come `../openclaw-docs`).
- Non aggiungere né modificare documentazione localizzata in `docs/<locale>/**` qui.
- Considerare la documentazione in inglese di questo repository, insieme ai file del glossario, come fonte di verità.
- Pipeline: aggiornare qui la documentazione in inglese, aggiornare `docs/.i18n/glossary.<locale>.json` se necessario, quindi lasciare che la sincronizzazione del repository di pubblicazione e `scripts/docs-i18n` vengano eseguiti in `openclaw/docs`.
- Prima di rieseguire `scripts/docs-i18n`, aggiungere voci al glossario per eventuali nuovi termini tecnici, titoli di pagina o brevi etichette di navigazione che devono rimanere in inglese o usare una traduzione fissa.
- `pnpm docs:check-i18n-glossary` è il controllo per i titoli della documentazione in inglese modificati e le brevi etichette interne della documentazione.
- La memoria di traduzione si trova nei file generati `docs/.i18n/*.tm.jsonl` nel repository di pubblicazione.
- Vedere `docs/.i18n/README.md`.
