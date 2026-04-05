---
read_when:
    - Sie möchten, dass Ihr Agent weniger generisch klingt
    - Sie bearbeiten SOUL.md
    - Sie eine stärkere Persönlichkeit möchten, ohne Sicherheit oder Kürze zu beeinträchtigen
summary: Verwenden Sie SOUL.md, um Ihrem OpenClaw-Agenten eine echte Stimme zu geben statt generischem Assistenten-Brei
title: SOUL.md Personality Guide
x-i18n:
    generated_at: "2026-04-05T12:41:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# SOUL.md Personality Guide

`SOUL.md` ist der Ort, an dem die Stimme Ihres Agenten lebt.

OpenClaw fügt es in normalen Sitzungen ein, daher hat es echtes Gewicht. Wenn Ihr Agent
langweilig, ausweichend oder seltsam unternehmerisch klingt, ist dies normalerweise die Datei, die Sie korrigieren sollten.

## Was in SOUL.md gehört

Schreiben Sie dort die Dinge hinein, die verändern, wie es sich anfühlt, mit dem Agenten zu sprechen:

- Ton
- Meinungen
- Kürze
- Humor
- Grenzen
- standardmäßiges Maß an Direktheit

Machen Sie daraus **nicht**:

- eine Lebensgeschichte
- ein Changelog
- einen Dump einer Sicherheitsrichtlinie
- eine riesige Wand aus Stimmung ohne verhaltensbezogene Wirkung

Kurz schlägt lang. Präzise schlägt vage.

## Warum das funktioniert

Das passt zu den Prompt-Empfehlungen von OpenAI:

- Der Leitfaden für Prompt Engineering sagt, dass Verhalten auf hoher Ebene, Ton, Ziele und
  Beispiele in die hoch priorisierte Anweisungsebene gehören und nicht im
  Benutzer-Turn vergraben sein sollten.
- Derselbe Leitfaden empfiehlt, Prompts als etwas zu behandeln, das Sie iterieren,
  pinnen und evaluieren, nicht als magische Prosa, die Sie einmal schreiben und dann vergessen.

Für OpenClaw ist `SOUL.md` diese Ebene.

Wenn Sie eine bessere Persönlichkeit wollen, schreiben Sie stärkere Anweisungen. Wenn Sie eine stabile
Persönlichkeit wollen, halten Sie sie knapp und versioniert.

OpenAI-Referenzen:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Der Molty-Prompt

Fügen Sie dies in Ihren Agenten ein und lassen Sie ihn `SOUL.md` umschreiben.

Pfad für OpenClaw-Workspaces fest vorgegeben: Verwenden Sie `SOUL.md`, nicht `http://SOUL.md`.

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

## So sieht es gut aus

Gute Regeln in `SOUL.md` klingen so:

- vertreten Sie eine Meinung
- lassen Sie Fülltext weg
- seien Sie lustig, wenn es passt
- sprechen Sie schlechte Ideen früh an
- bleiben Sie knapp, außer wenn Tiefe tatsächlich nützlich ist

Schlechte Regeln in `SOUL.md` klingen so:

- jederzeit Professionalität wahren
- umfassende und durchdachte Unterstützung bieten
- eine positive und unterstützende Erfahrung sicherstellen

Mit der zweiten Liste bekommen Sie Brei.

## Eine Warnung

Persönlichkeit ist keine Erlaubnis, schlampig zu sein.

Behalten Sie `AGENTS.md` für Betriebsregeln. Behalten Sie `SOUL.md` für Stimme, Haltung und
Stil. Wenn Ihr Agent in gemeinsam genutzten Kanälen, öffentlichen Antworten oder
Kundenoberflächen arbeitet, stellen Sie sicher, dass der Ton trotzdem zum Umfeld passt.

Prägnant ist gut. Nervig ist es nicht.

## Verwandte Dokumentation

- [Agent-Workspace](/concepts/agent-workspace)
- [System-Prompt](/concepts/system-prompt)
- [SOUL.md-Vorlage](/reference/templates/SOUL)
