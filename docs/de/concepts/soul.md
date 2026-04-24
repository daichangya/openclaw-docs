---
read_when:
    - Sie möchten, dass Ihr Agent weniger generisch klingt.
    - Sie bearbeiten `SOUL.md`.
    - Sie möchten eine stärkere Persönlichkeit, ohne Sicherheit oder Kürze zu beeinträchtigen.
summary: Verwenden Sie `SOUL.md`, um Ihrem OpenClaw-Agenten eine echte Stimme zu geben statt generischem Assistant-Brei.
title: Leitfaden zur Persönlichkeit in `SOUL.md`
x-i18n:
    generated_at: "2026-04-24T06:35:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` ist der Ort, an dem die Stimme Ihres Agenten lebt.

OpenClaw injiziert sie in normalen Sitzungen, daher hat sie echtes Gewicht. Wenn Ihr Agent
langweilig, ausweichend oder seltsam nach Konzern klingt, ist dies normalerweise die Datei, die Sie korrigieren sollten.

## Was in `SOUL.md` gehört

Packen Sie dort Dinge hinein, die verändern, wie es sich anfühlt, mit dem Agenten zu sprechen:

- Ton
- Meinungen
- Kürze
- Humor
- Grenzen
- standardmäßiges Maß an Direktheit

Verwandeln Sie es **nicht** in:

- eine Lebensgeschichte
- ein Changelog
- einen Dump von Sicherheitsrichtlinien
- eine riesige Wand aus Vibes ohne Verhaltenseffekt

Kurz schlägt lang. Präzise schlägt vage.

## Warum das funktioniert

Das entspricht der Prompt-Guidance von OpenAI:

- Der Leitfaden für Prompt Engineering sagt, dass Verhalten auf hoher Ebene, Ton, Ziele und
  Beispiele in die hoch priorisierte Instruktionsebene gehören, nicht vergraben in den
  User-Turn.
- Derselbe Leitfaden empfiehlt, Prompts als etwas zu behandeln, das man iteriert,
  pinnt und evaluiert, nicht als magische Prosa, die man einmal schreibt und dann vergisst.

Für OpenClaw ist `SOUL.md` diese Ebene.

Wenn Sie bessere Persönlichkeit möchten, schreiben Sie stärkere Instruktionen. Wenn Sie stabile
Persönlichkeit möchten, halten Sie sie knapp und versioniert.

OpenAI-Referenzen:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Der Molty-Prompt

Fügen Sie dies in Ihren Agenten ein und lassen Sie ihn `SOUL.md` umschreiben.

Pfad fest für OpenClaw-Workspaces: Verwenden Sie `SOUL.md`, nicht `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## So sieht gut aus

Gute Regeln in `SOUL.md` klingen so:

- habe eine Meinung
- überspringe Fülltext
- sei witzig, wenn es passt
- sprich schlechte Ideen früh an
- bleibe prägnant, es sei denn, Tiefe ist wirklich nützlich

Schlechte Regeln in `SOUL.md` klingen so:

- wahre jederzeit Professionalität
- biete umfassende und durchdachte Unterstützung
- stelle eine positive und unterstützende Erfahrung sicher

Die zweite Liste führt zu Brei.

## Eine Warnung

Persönlichkeit ist keine Erlaubnis, schlampig zu sein.

Behalten Sie `AGENTS.md` für Betriebsregeln. Behalten Sie `SOUL.md` für Stimme, Haltung und
Stil. Wenn Ihr Agent in gemeinsamen Channels, öffentlichen Antworten oder kundenorientierten
Oberflächen arbeitet, stellen Sie sicher, dass der Ton weiterhin zum Kontext passt.

Scharf ist gut. Nervig ist es nicht.

## Verwandte Dokumentation

- [Agent workspace](/de/concepts/agent-workspace)
- [System prompt](/de/concepts/system-prompt)
- [SOUL.md template](/de/reference/templates/SOUL)
