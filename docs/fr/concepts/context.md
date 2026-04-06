---
read_when:
    - Vous voulez comprendre ce que signifie « contexte » dans OpenClaw
    - Vous déboguez pourquoi le modèle « sait » quelque chose (ou l’a oublié)
    - Vous voulez réduire la surcharge du contexte (/context, /status, /compact)
summary: 'Contexte : ce que le modèle voit, comment il est construit et comment l’inspecter'
title: Contexte
x-i18n:
    generated_at: "2026-04-06T03:06:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe7dfe52cb1a64df229c8622feed1804df6c483a6243e0d2f309f6ff5c9fe521
    source_path: concepts/context.md
    workflow: 15
---

# Contexte

Le « contexte » est **tout ce que OpenClaw envoie au modèle pour une exécution**. Il est limité par la **fenêtre de contexte** du modèle (limite de jetons).

Modèle mental pour débutants :

- **Prompt système** (construit par OpenClaw) : règles, outils, liste des skills, heure/exécution, et fichiers d’espace de travail injectés.
- **Historique de conversation** : vos messages + les messages de l’assistant pour cette session.
- **Appels/résultats d’outils + pièces jointes** : sortie de commande, lectures de fichiers, images/audio, etc.

Le contexte _n’est pas la même chose_ que la « mémoire » : la mémoire peut être stockée sur disque et rechargée plus tard ; le contexte est ce qui se trouve dans la fenêtre actuelle du modèle.

## Démarrage rapide (inspecter le contexte)

- `/status` → vue rapide « à quel point ma fenêtre est-elle remplie ? » + paramètres de session.
- `/context list` → ce qui est injecté + tailles approximatives (par fichier + totaux).
- `/context detail` → ventilation plus détaillée : tailles par fichier, par schéma d’outil, par entrée de skill, et taille du prompt système.
- `/usage tokens` → ajoute un pied de page d’utilisation par réponse aux réponses normales.
- `/compact` → résume l’historique plus ancien dans une entrée compacte pour libérer de l’espace dans la fenêtre.

Voir aussi : [Commandes slash](/fr/tools/slash-commands), [Utilisation des jetons et coûts](/fr/reference/token-use), [Compactage](/fr/concepts/compaction).

## Exemple de sortie

Les valeurs varient selon le modèle, le fournisseur, la politique des outils et le contenu de votre espace de travail.

### `/context list`

```
🧠 Ventilation du contexte
Espace de travail : <workspaceDir>
Maximum bootstrap/fichier : 20,000 caractères
Sandbox : mode=non-main sandboxed=false
Prompt système (exécution) : 38,412 caractères (~9,603 jetons) (Contexte du projet 23,901 caractères (~5,976 jetons))

Fichiers de l’espace de travail injectés :
- AGENTS.md: OK | brut 1,742 caractères (~436 jetons) | injecté 1,742 caractères (~436 jetons)
- SOUL.md: OK | brut 912 caractères (~228 jetons) | injecté 912 caractères (~228 jetons)
- TOOLS.md: TRONQUÉ | brut 54,210 caractères (~13,553 jetons) | injecté 20,962 caractères (~5,241 jetons)
- IDENTITY.md: OK | brut 211 caractères (~53 jetons) | injecté 211 caractères (~53 jetons)
- USER.md: OK | brut 388 caractères (~97 jetons) | injecté 388 caractères (~97 jetons)
- HEARTBEAT.md: ABSENT | brut 0 | injecté 0
- BOOTSTRAP.md: OK | brut 0 caractères (~0 jeton) | injecté 0 caractères (~0 jeton)

Liste des skills (texte du prompt système) : 2,184 caractères (~546 jetons) (12 skills)
Outils : read, edit, write, exec, process, browser, message, sessions_send, …
Liste des outils (texte du prompt système) : 1,032 caractères (~258 jetons)
Schémas des outils (JSON) : 31,988 caractères (~7,997 jetons) (compte dans le contexte ; n’est pas affiché comme texte)
Outils : (identiques à ci-dessus)

Jetons de session (en cache) : 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Ventilation du contexte (détaillée)
…
Principaux skills (taille d’entrée de prompt) :
- frontend-design: 412 caractères (~103 jetons)
- oracle: 401 caractères (~101 jetons)
… (+10 autres skills)

Principaux outils (taille du schéma) :
- browser: 9,812 caractères (~2,453 jetons)
- exec: 6,240 caractères (~1,560 jetons)
… (+N autres outils)
```

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte, y compris :

- Le prompt système (toutes les sections).
- L’historique de conversation.
- Les appels d’outils + les résultats d’outils.
- Les pièces jointes/transcriptions (images/audio/fichiers).
- Les résumés de compactage et les artefacts d’élagage.
- Les « wrappers » de fournisseur ou en-têtes cachés (non visibles, mais quand même comptés).

## Comment OpenClaw construit le prompt système

Le prompt système appartient à **OpenClaw** et est reconstruit à chaque exécution. Il inclut :

- La liste des outils + de courtes descriptions.
- La liste des skills (métadonnées uniquement ; voir ci-dessous).
- L’emplacement de l’espace de travail.
- L’heure (UTC + heure utilisateur convertie si configurée).
- Les métadonnées d’exécution (hôte/OS/modèle/réflexion).
- Les fichiers bootstrap injectés de l’espace de travail sous **Contexte du projet**.

Ventilation complète : [Prompt système](/fr/concepts/system-prompt).

## Fichiers de l’espace de travail injectés (Contexte du projet)

Par défaut, OpenClaw injecte un ensemble fixe de fichiers d’espace de travail (s’ils sont présents) :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (première exécution uniquement)

Les gros fichiers sont tronqués par fichier à l’aide de `agents.defaults.bootstrapMaxChars` (par défaut `20000` caractères). OpenClaw applique aussi un plafond total d’injection bootstrap sur l’ensemble des fichiers avec `agents.defaults.bootstrapTotalMaxChars` (par défaut `150000` caractères). `/context` affiche les tailles **brutes vs injectées** et indique si une troncature a eu lieu.

Lorsqu’une troncature se produit, l’exécution peut injecter un bloc d’avertissement dans le prompt sous Contexte du projet. Configurez cela avec `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ; valeur par défaut `once`).

## Skills : injectés vs chargés à la demande

Le prompt système inclut une **liste de skills** compacte (nom + description + emplacement). Cette liste a un vrai coût en surcharge.

Les instructions des skills ne sont _pas_ incluses par défaut. Le modèle est censé `read` le `SKILL.md` du skill **uniquement si nécessaire**.

## Outils : il y a deux coûts

Les outils affectent le contexte de deux façons :

1. Le **texte de la liste des outils** dans le prompt système (ce que vous voyez comme « Tooling »).
2. Les **schémas des outils** (JSON). Ils sont envoyés au modèle pour qu’il puisse appeler des outils. Ils comptent dans le contexte même si vous ne les voyez pas en texte brut.

`/context detail` détaille les plus gros schémas d’outils afin que vous puissiez voir ce qui domine.

## Commandes, directives et « raccourcis en ligne »

Les commandes slash sont gérées par la Gateway. Il existe plusieurs comportements différents :

- **Commandes autonomes** : un message qui contient uniquement `/...` est exécuté comme une commande.
- **Directives** : `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` sont retirées avant que le modèle ne voie le message.
  - Les messages contenant uniquement une directive conservent les paramètres de session.
  - Les directives en ligne dans un message normal agissent comme des indications par message.
- **Raccourcis en ligne** (expéditeurs autorisés uniquement) : certains jetons `/...` à l’intérieur d’un message normal peuvent être exécutés immédiatement (exemple : « hey /status »), et sont retirés avant que le modèle ne voie le texte restant.

Détails : [Commandes slash](/fr/tools/slash-commands).

## Sessions, compactage et élagage (ce qui persiste)

Ce qui persiste entre les messages dépend du mécanisme :

- **L’historique normal** persiste dans la transcription de session jusqu’à ce qu’il soit compacté/élagué par la politique.
- **Le compactage** conserve un résumé dans la transcription et garde les messages récents intacts.
- **L’élagage** supprime les anciens résultats d’outils de l’invite _en mémoire_ pour une exécution, mais ne réécrit pas la transcription.

Documentation : [Session](/fr/concepts/session), [Compactage](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning).

Par défaut, OpenClaw utilise le moteur de contexte intégré `legacy` pour l’assemblage et
le compactage. Si vous installez un plugin qui fournit `kind: "context-engine"` et
le sélectionnez avec `plugins.slots.contextEngine`, OpenClaw délègue alors l’assemblage du contexte,
`/compact` et les hooks de cycle de vie de contexte des sous-agents associés à ce
moteur à la place. `ownsCompaction: false` ne revient pas automatiquement au
moteur legacy ; le moteur actif doit toujours implémenter correctement `compact()`. Voir
[Context Engine](/fr/concepts/context-engine) pour l’interface enfichable complète,
les hooks de cycle de vie et la configuration.

## Ce que `/context` rapporte réellement

`/context` privilégie le rapport le plus récent du prompt système **construit à l’exécution** lorsqu’il est disponible :

- `System prompt (run)` = capturé lors de la dernière exécution embarquée (capable d’utiliser des outils) et conservé dans le stockage de session.
- `System prompt (estimate)` = calculé à la volée lorsqu’aucun rapport d’exécution n’existe encore.

Dans les deux cas, il rapporte les tailles et les principaux contributeurs ; il **ne** restitue **pas** le prompt système complet ni les schémas des outils.

## Lié

- [Context Engine](/fr/concepts/context-engine) — injection de contexte personnalisée via des plugins
- [Compactage](/fr/concepts/compaction) — résumé de longues conversations
- [Prompt système](/fr/concepts/system-prompt) — comment le prompt système est construit
- [Boucle de l’agent](/fr/concepts/agent-loop) — le cycle d’exécution complet de l’agent
