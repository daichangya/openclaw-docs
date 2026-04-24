---
read_when:
    - Vous devez expliquer l’espace de travail de l’agent ou son organisation de fichiers
    - Vous voulez sauvegarder ou migrer un espace de travail d’agent
summary: 'Espace de travail de l’agent : emplacement, organisation et stratégie de sauvegarde'
title: espace de travail de l’agent
x-i18n:
    generated_at: "2026-04-24T07:06:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

L’espace de travail est la maison de l’agent. C’est le seul répertoire de travail utilisé pour
les outils de fichier et pour le contexte d’espace de travail. Gardez-le privé et traitez-le comme de la mémoire.

Ceci est distinct de `~/.openclaw/`, qui stocke la configuration, les identifiants et
les sessions.

**Important :** l’espace de travail est le **cwd par défaut**, pas un bac à sable strict. Les outils
résolvent les chemins relatifs par rapport à l’espace de travail, mais les chemins absolus peuvent toujours atteindre
d’autres emplacements sur l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
[`agents.defaults.sandbox`](/fr/gateway/sandboxing) (et/ou une configuration de sandbox par agent).
Lorsque le sandboxing est activé et que `workspaceAccess` n’est pas `"rw"`, les outils opèrent
dans un espace de travail sandbox sous `~/.openclaw/sandboxes`, et non dans votre espace de travail hôte.

## Emplacement par défaut

- Par défaut : `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` est défini et n’est pas `"default"`, la valeur par défaut devient
  `~/.openclaw/workspace-<profile>`.
- Redéfinition dans `~/.openclaw/openclaw.json` :

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` créeront l’
espace de travail et initialiseront les fichiers bootstrap s’ils sont absents.
Les copies de graine sandbox n’acceptent que des fichiers ordinaires situés dans l’espace de travail ; les
alias symlink/hardlink qui se résolvent en dehors de l’espace de travail source sont ignorés.

Si vous gérez déjà vous-même les fichiers de l’espace de travail, vous pouvez désactiver la création
des fichiers bootstrap :

```json5
{ agent: { skipBootstrap: true } }
```

## Dossiers supplémentaires d’espace de travail

Les anciennes installations peuvent avoir créé `~/openclaw`. Conserver plusieurs répertoires
d’espace de travail peut provoquer une dérive confuse de l’authentification ou de l’état, car un seul
espace de travail est actif à la fois.

**Recommandation :** gardez un seul espace de travail actif. Si vous n’utilisez plus les
dossiers supplémentaires, archivez-les ou déplacez-les vers la corbeille (par exemple `trash ~/openclaw`).
Si vous conservez intentionnellement plusieurs espaces de travail, assurez-vous que
`agents.defaults.workspace` pointe vers celui qui est actif.

`openclaw doctor` avertit lorsqu’il détecte des répertoires d’espace de travail supplémentaires.

## Carte des fichiers de l’espace de travail (signification de chaque fichier)

Voici les fichiers standard qu’OpenClaw attend dans l’espace de travail :

- `AGENTS.md`
  - Instructions de fonctionnement pour l’agent et la manière dont il doit utiliser la mémoire.
  - Chargé au début de chaque session.
  - Bon emplacement pour les règles, priorités et détails sur « comment se comporter ».

- `SOUL.md`
  - Persona, ton et limites.
  - Chargé à chaque session.
  - Guide : [Guide de personnalité SOUL.md](/fr/concepts/soul)

- `USER.md`
  - Qui est l’utilisateur et comment s’adresser à lui.
  - Chargé à chaque session.

- `IDENTITY.md`
  - Nom, style et emoji de l’agent.
  - Créé/mis à jour pendant le rituel bootstrap.

- `TOOLS.md`
  - Notes sur vos outils locaux et conventions.
  - Ne contrôle pas la disponibilité des outils ; sert uniquement de guide.

- `HEARTBEAT.md`
  - Petite liste de contrôle facultative pour les exécutions Heartbeat.
  - Gardez-la courte pour éviter de brûler des tokens.

- `BOOT.md`
  - Liste de contrôle facultative de démarrage exécutée automatiquement au redémarrage de la Gateway (lorsque les [hooks internes](/fr/automation/hooks) sont activés).
  - Gardez-la courte ; utilisez l’outil de message pour les envois sortants.

- `BOOTSTRAP.md`
  - Rituel unique de première exécution.
  - Créé uniquement pour un espace de travail tout neuf.
  - Supprimez-le une fois le rituel terminé.

- `memory/YYYY-MM-DD.md`
  - Journal mémoire quotidien (un fichier par jour).
  - Recommandé : lire aujourd’hui + hier au démarrage de la session.

- `MEMORY.md` (facultatif)
  - Mémoire de long terme organisée.
  - À charger uniquement dans la session principale privée (pas dans les contextes partagés/de groupe).

Voir [Mémoire](/fr/concepts/memory) pour le flux de travail et le vidage automatique de la mémoire.

- `skills/` (facultatif)
  - Skills spécifiques à l’espace de travail.
  - Emplacement de Skills à plus haute priorité pour cet espace de travail.
  - Remplace les skills d’agent du projet, les skills d’agent personnels, les Skills gérés, les skills intégrés et `skills.load.extraDirs` en cas de collision de noms.

- `canvas/` (facultatif)
  - Fichiers d’interface Canvas pour les affichages de Node (par exemple `canvas/index.html`).

Si un fichier bootstrap manque, OpenClaw injecte un marqueur « fichier manquant » dans
la session et continue. Les gros fichiers bootstrap sont tronqués lors de l’injection ;
ajustez les limites avec `agents.defaults.bootstrapMaxChars` (par défaut : 12000) et
`agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000).
`openclaw setup` peut recréer les valeurs par défaut manquantes sans écraser les
fichiers existants.

## Ce qui N’EST PAS dans l’espace de travail

Ces éléments se trouvent sous `~/.openclaw/` et ne doivent PAS être commités dans le dépôt de l’espace de travail :

- `~/.openclaw/openclaw.json` (configuration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profils d’authentification de modèle : OAuth + clés API)
- `~/.openclaw/credentials/` (état du canal/fournisseur plus données héritées d’import OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcriptions de session + métadonnées)
- `~/.openclaw/skills/` (Skills gérés)

Si vous devez migrer des sessions ou la configuration, copiez-les séparément et gardez-les
hors du contrôle de version.

## Sauvegarde Git (recommandée, privée)

Traitez l’espace de travail comme une mémoire privée. Placez-le dans un dépôt git **privé** afin qu’il soit
sauvegardé et récupérable.

Exécutez ces étapes sur la machine où la Gateway s’exécute (c’est là que
l’espace de travail se trouve).

### 1) Initialiser le dépôt

Si git est installé, les espaces de travail tout neufs sont initialisés automatiquement. Si cet
espace de travail n’est pas déjà un dépôt, exécutez :

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Ajouter un remote privé (options simples pour débutants)

Option A : interface web GitHub

1. Créez un nouveau dépôt **privé** sur GitHub.
2. Ne l’initialisez pas avec un README (pour éviter les conflits de fusion).
3. Copiez l’URL HTTPS du remote.
4. Ajoutez le remote et poussez :

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Option B : CLI GitHub (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Option C : interface web GitLab

1. Créez un nouveau dépôt **privé** sur GitLab.
2. Ne l’initialisez pas avec un README (pour éviter les conflits de fusion).
3. Copiez l’URL HTTPS du remote.
4. Ajoutez le remote et poussez :

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Mises à jour continues

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Ne commitez pas de secrets

Même dans un dépôt privé, évitez de stocker des secrets dans l’espace de travail :

- Clés API, jetons OAuth, mots de passe ou identifiants privés.
- Tout ce qui se trouve sous `~/.openclaw/`.
- Dumps bruts de discussions ou pièces jointes sensibles.

Si vous devez stocker des références sensibles, utilisez des espaces réservés et conservez le vrai
secret ailleurs (gestionnaire de mots de passe, variables d’environnement ou `~/.openclaw/`).

Exemple de départ recommandé pour `.gitignore` :

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Déplacer l’espace de travail vers une nouvelle machine

1. Clonez le dépôt vers le chemin souhaité (par défaut `~/.openclaw/workspace`).
2. Définissez `agents.defaults.workspace` sur ce chemin dans `~/.openclaw/openclaw.json`.
3. Exécutez `openclaw setup --workspace <path>` pour initialiser les fichiers manquants.
4. Si vous avez besoin des sessions, copiez `~/.openclaw/agents/<agentId>/sessions/` depuis l’
   ancienne machine séparément.

## Remarques avancées

- Le routage multi-agent peut utiliser différents espaces de travail par agent. Voir
  [Routage des canaux](/fr/channels/channel-routing) pour la configuration du routage.
- Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent utiliser des espaces de travail
  sandbox par session sous `agents.defaults.sandbox.workspaceRoot`.

## Liens associés

- [Instructions permanentes](/fr/automation/standing-orders) — instructions persistantes dans les fichiers de l’espace de travail
- [Heartbeat](/fr/gateway/heartbeat) — fichier d’espace de travail HEARTBEAT.md
- [Session](/fr/concepts/session) — chemins de stockage des sessions
- [Sandboxing](/fr/gateway/sandboxing) — accès à l’espace de travail dans des environnements sandboxés
