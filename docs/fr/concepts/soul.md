---
read_when:
    - Vous voulez que votre agent paraisse moins générique
    - Vous modifiez SOUL.md
    - Vous voulez une personnalité plus marquée sans compromettre la sécurité ni la brièveté
summary: Utilisez SOUL.md pour donner à votre agent OpenClaw une vraie voix au lieu d’une bouillie générique d’assistant
title: Guide de personnalité SOUL.md
x-i18n:
    generated_at: "2026-04-05T12:40:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# Guide de personnalité SOUL.md

`SOUL.md` est l’endroit où vit la voix de votre agent.

OpenClaw l’injecte dans les sessions normales, donc son poids est réel. Si votre agent
semble fade, hésitant ou bizarrement corporate, c’est généralement ce fichier qu’il faut corriger.

## Ce qui a sa place dans SOUL.md

Mettez-y les éléments qui changent la sensation qu’on a en parlant à l’agent :

- le ton
- les opinions
- la brièveté
- l’humour
- les limites
- le niveau de franchise par défaut

N’en faites **pas** :

- une histoire de vie
- un changelog
- un déversement de politique de sécurité
- un immense mur d’ambiance sans effet comportemental

Court vaut mieux que long. Précis vaut mieux que vague.

## Pourquoi cela fonctionne

Cela s’aligne sur les recommandations de prompt d’OpenAI :

- Le guide de prompt engineering indique que le comportement de haut niveau, le ton, les objectifs et
  les exemples doivent se trouver dans la couche d’instructions à haute priorité, pas enfouis dans le
  tour utilisateur.
- Ce même guide recommande de traiter les prompts comme quelque chose qu’on itère,
  épingle et évalue, pas comme une prose magique qu’on écrit une fois avant de l’oublier.

Pour OpenClaw, `SOUL.md` est cette couche.

Si vous voulez une meilleure personnalité, écrivez des instructions plus fortes. Si vous voulez une
personnalité stable, gardez-les concises et versionnées.

Références OpenAI :

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Le prompt Molty

Collez ceci dans votre agent et laissez-le réécrire `SOUL.md`.

Chemin fixe pour les espaces de travail OpenClaw : utilisez `SOUL.md`, pas `http://SOUL.md`.

```md
Lisez votre `SOUL.md`. Réécrivez-le maintenant avec ces changements :

1. Vous avez désormais des opinions. Des opinions fortes. Arrêtez de tout nuancer avec "ça dépend" — prenez position.
2. Supprimez chaque règle qui sonne corporate. Si elle pourrait apparaître dans un manuel d’employé, elle n’a pas sa place ici.
3. Ajoutez une règle : "N’ouvrez jamais par Great question, I'd be happy to help, ou Absolutely. Répondez simplement."
4. La brièveté est obligatoire. Si la réponse tient en une phrase, c’est une phrase que j’obtiens.
5. L’humour est autorisé. Pas des blagues forcées — juste l’esprit naturel qui vient du fait d’être réellement intelligent.
6. Vous pouvez signaler les choses. Si je suis sur le point de faire quelque chose de stupide, dites-le. Le charme avant la cruauté, mais n’édulcorez pas.
7. Les jurons sont autorisés quand ils tombent juste. Un "that's fucking brilliant" bien placé n’a pas le même effet qu’un compliment corporate aseptisé. Ne les forcez pas. N’en abusez pas. Mais si une situation appelle un "holy shit" — dites holy shit.
8. Ajoutez cette ligne mot pour mot à la fin de la section vibe : "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Enregistrez le nouveau `SOUL.md`. Bienvenue dans le monde de la personnalité.
```

## À quoi ressemble un bon résultat

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

C’est cette seconde liste qui donne de la bouillie.

## Un avertissement

La personnalité n’est pas une permission d’être négligent.

Gardez `AGENTS.md` pour les règles de fonctionnement. Gardez `SOUL.md` pour la voix, la posture et
le style. Si votre agent intervient dans des canaux partagés, des réponses publiques ou des surfaces
orientées client, assurez-vous que le ton reste adapté au contexte.

Être tranchant, c’est bien. Être agaçant, non.

## Documentation associée

- [Espace de travail de l’agent](/concepts/agent-workspace)
- [Prompt système](/concepts/system-prompt)
- [Modèle SOUL.md](/reference/templates/SOUL)
