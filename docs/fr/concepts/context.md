---
read_when:
    - Vous voulez comprendre ce que signifie « contexte » dans OpenClaw
    - Vous déboguez pourquoi le modèle « sait » quelque chose (ou l’a oublié)
    - Vous souhaitez réduire la surcharge de contexte (`/context`, `/status`, `/compact`)
summary: 'Contexte : ce que le modèle voit, comment il est construit et comment l’inspecter'
title: Contexte
x-i18n:
    generated_at: "2026-04-24T07:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

Le « contexte » est **tout ce qu’OpenClaw envoie au modèle pour une exécution**. Il est limité par la **fenêtre de contexte** du modèle (limite de tokens).

Modèle mental pour débuter :

- **Prompt système** (construit par OpenClaw) : règles, outils, liste des Skills, heure/exécution, et fichiers d’espace de travail injectés.
- **Historique de conversation** : vos messages + les messages de l’assistant pour cette session.
- **Appels/résultats d’outils + pièces jointes** : sortie de commande, lectures de fichiers, images/audio, etc.

Le contexte n’est _pas la même chose_ que la « mémoire » : la mémoire peut être stockée sur disque et rechargée plus tard ; le contexte est ce qui se trouve dans la fenêtre actuelle du modèle.

## Démarrage rapide (inspecter le contexte)

- `/status` → vue rapide « à quel point ma fenêtre est-elle remplie ? » + paramètres de session.
- `/context list` → ce qui est injecté + tailles approximatives (par fichier + totaux).
- `/context detail` → ventilation plus approfondie : tailles par fichier, par schéma d’outil, par entrée de Skill, et taille du prompt système.
- `/usage tokens` → ajoute un pied de page d’utilisation par réponse aux réponses normales.
- `/compact` → résume l’historique plus ancien en une entrée compacte pour libérer de l’espace dans la fenêtre.

Voir aussi : [Commandes slash](/fr/tools/slash-commands), [Utilisation des tokens et coûts](/fr/reference/token-use), [Compaction](/fr/concepts/compaction).

## Exemple de sortie

Les valeurs varient selon le modèle, le provider, la politique d’outils et le contenu de votre espace de travail.

### `/context list`

```
🧠 Ventilation du contexte
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Ventilation du contexte (détaillée)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte, y compris :

- Prompt système (toutes les sections).
- Historique de conversation.
- Appels d’outils + résultats d’outils.
- Pièces jointes/transcriptions (images/audio/fichiers).
- Résumés de Compaction et artefacts d’élagage.
- « Wrappers » du provider ou en-têtes cachés (non visibles, mais tout de même comptés).

## Comment OpenClaw construit le prompt système

Le prompt système est **géré par OpenClaw** et reconstruit à chaque exécution. Il comprend :

- Liste des outils + descriptions courtes.
- Liste des Skills (métadonnées uniquement ; voir ci-dessous).
- Emplacement de l’espace de travail.
- Heure (UTC + heure utilisateur convertie si configurée).
- Métadonnées d’exécution (hôte/OS/modèle/réflexion).
- Fichiers bootstrap de l’espace de travail injectés sous **Project Context**.

Ventilation complète : [Prompt système](/fr/concepts/system-prompt).

## Fichiers d’espace de travail injectés (Project Context)

Par défaut, OpenClaw injecte un ensemble fixe de fichiers d’espace de travail (s’ils sont présents) :

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (première exécution uniquement)

Les gros fichiers sont tronqués par fichier via `agents.defaults.bootstrapMaxChars` (par défaut `12000` caractères). OpenClaw applique également un plafond total d’injection bootstrap sur l’ensemble des fichiers avec `agents.defaults.bootstrapTotalMaxChars` (par défaut `60000` caractères). `/context` affiche les tailles **brutes vs injectées** et indique si une troncature a eu lieu.

Lorsqu’une troncature se produit, l’exécution peut injecter dans le prompt un bloc d’avertissement sous Project Context. Configurez cela avec `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always` ; par défaut `once`).

## Skills : injectés vs chargés à la demande

Le prompt système inclut une **liste compacte de Skills** (nom + description + emplacement). Cette liste a un vrai coût.

Les instructions des Skills ne sont _pas_ incluses par défaut. Le modèle est censé `read` le `SKILL.md` du Skill **uniquement lorsque nécessaire**.

## Outils : il y a deux coûts

Les outils affectent le contexte de deux façons :

1. **Texte de la liste d’outils** dans le prompt système (ce que vous voyez sous « Tooling »).
2. **Schémas d’outils** (JSON). Ils sont envoyés au modèle pour qu’il puisse appeler les outils. Ils comptent dans le contexte même si vous ne les voyez pas sous forme de texte brut.

`/context detail` ventile les plus gros schémas d’outils afin que vous puissiez voir ce qui domine.

## Commandes, directives et « raccourcis inline »

Les commandes slash sont gérées par le Gateway. Il existe quelques comportements différents :

- **Commandes autonomes** : un message composé uniquement de `/...` s’exécute comme commande.
- **Directives** : `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` sont retirées avant que le modèle ne voie le message.
  - Les messages composés uniquement de directives persistent les paramètres de session.
  - Les directives inline dans un message normal agissent comme indices propres au message.
- **Raccourcis inline** (expéditeurs autorisés uniquement) : certains jetons `/...` à l’intérieur d’un message normal peuvent s’exécuter immédiatement (exemple : « hey /status »), puis sont retirés avant que le modèle ne voie le texte restant.

Détails : [Commandes slash](/fr/tools/slash-commands).

## Sessions, Compaction et élagage (ce qui persiste)

Ce qui persiste entre les messages dépend du mécanisme :

- **Historique normal** persiste dans la transcription de session jusqu’à être compacté/élagué par la politique.
- **Compaction** persiste un résumé dans la transcription et conserve intacts les messages récents.
- **Élagage** supprime les anciens résultats d’outils du prompt _en mémoire_ pour libérer de l’espace dans la fenêtre de contexte, mais ne réécrit pas la transcription de session — l’historique complet reste inspectable sur disque.

Documentation : [Session](/fr/concepts/session), [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning).

Par défaut, OpenClaw utilise le moteur de contexte intégré `legacy` pour l’assemblage et
la compaction. Si vous installez un Plugin qui fournit `kind: "context-engine"` et
le sélectionnez avec `plugins.slots.contextEngine`, OpenClaw délègue alors l’assemblage
du contexte, `/compact`, et les hooks associés du cycle de vie du contexte des sous-agents à ce
moteur. `ownsCompaction: false` ne provoque pas de retour automatique au moteur
legacy ; le moteur actif doit tout de même implémenter correctement `compact()`. Voir
[Context Engine](/fr/concepts/context-engine) pour l’interface enfichable complète,
les hooks de cycle de vie et la configuration.

## Ce que `/context` signale réellement

`/context` préfère le dernier rapport de prompt système **construit à l’exécution** lorsqu’il est disponible :

- `System prompt (run)` = capturé depuis la dernière exécution intégrée (capable d’utiliser des outils) et persisté dans le magasin de session.
- `System prompt (estimate)` = calculé à la volée lorsqu’aucun rapport d’exécution n’existe (ou lors d’une exécution via un backend CLI qui ne génère pas le rapport).

Dans les deux cas, il signale les tailles et les principaux contributeurs ; il ne vide **pas** le prompt système complet ni les schémas d’outils.

## Lié

- [Context Engine](/fr/concepts/context-engine) — injection de contexte personnalisée via des Plugins
- [Compaction](/fr/concepts/compaction) — résumé des longues conversations
- [Prompt système](/fr/concepts/system-prompt) — comment le prompt système est construit
- [Boucle d’agent](/fr/concepts/agent-loop) — cycle complet d’exécution de l’agent
