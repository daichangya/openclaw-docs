---
read_when:
    - Vous voulez que votre agent paraisse moins générique
    - Vous modifiez `SOUL.md`
    - Vous voulez une personnalité plus forte sans compromettre la sécurité ni la brièveté
summary: Utilisez `SOUL.md` pour donner à votre agent OpenClaw une véritable voix au lieu d’une bouillie générique d’assistant.
title: Guide de personnalité `SOUL.md`
x-i18n:
    generated_at: "2026-04-24T07:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` est l’endroit où vit la voix de votre agent.

OpenClaw l’injecte dans les sessions normales, donc il a un vrai poids. Si votre agent
semble fade, hésitant ou bizarrement corporate, c’est généralement ce fichier qu’il faut corriger.

## Ce qui doit aller dans SOUL.md

Mettez-y ce qui change la sensation qu’on a en parlant à l’agent :

- le ton
- les opinions
- la brièveté
- l’humour
- les limites
- le niveau de franchise par défaut

N’en faites **pas** :

- une histoire de vie
- un changelog
- un dump de politique de sécurité
- un énorme mur de vibes sans effet comportemental

Court vaut mieux que long. Net vaut mieux que vague.

## Pourquoi cela fonctionne

Cela s’aligne sur les recommandations de prompt d’OpenAI :

- Le guide de prompt engineering dit que le comportement général, le ton, les objectifs et
  les exemples doivent se trouver dans la couche d’instructions à haute priorité, pas enfouis dans le
  tour utilisateur.
- Le même guide recommande de traiter les prompts comme quelque chose que l’on itère,
  épingle et évalue, et non comme une prose magique qu’on écrit une fois puis oublie.

Pour OpenClaw, `SOUL.md` est cette couche.

Si vous voulez une meilleure personnalité, écrivez des instructions plus fortes. Si vous voulez une
personnalité stable, gardez-les concises et versionnées.

Références OpenAI :

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Le prompt Molty

Collez ceci dans votre agent et laissez-le réécrire `SOUL.md`.

Chemin fixé pour les espaces de travail OpenClaw : utilisez `SOUL.md`, pas `http://SOUL.md`.

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

## À quoi ressemble une bonne version

De bonnes règles `SOUL.md` ressemblent à ceci :

- avoir un point de vue
- éviter le remplissage
- être drôle quand cela s’y prête
- signaler tôt les mauvaises idées
- rester concis sauf si la profondeur est réellement utile

De mauvaises règles `SOUL.md` ressemblent à ceci :

- maintenir un professionnalisme en toutes circonstances
- fournir une assistance complète et réfléchie
- garantir une expérience positive et bienveillante

Cette deuxième liste, c’est comme ça qu’on obtient de la bouillie.

## Un avertissement

La personnalité n’est pas une permission d’être négligent.

Gardez `AGENTS.md` pour les règles de fonctionnement. Gardez `SOUL.md` pour la voix, la posture et
le style. Si votre agent travaille dans des canaux partagés, des réponses publiques ou des
surfaces client, assurez-vous que le ton reste adapté au contexte.

Aiguisé, c’est bien. Agaçant, non.

## Documentation associée

- [Espace de travail d’agent](/fr/concepts/agent-workspace)
- [Prompt système](/fr/concepts/system-prompt)
- [Modèle SOUL.md](/fr/reference/templates/SOUL)
