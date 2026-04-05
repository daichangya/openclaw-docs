---
read_when:
    - Vous devez expliquer l’espace de travail de l’agent ou son organisation de fichiers
    - Vous souhaitez sauvegarder ou migrer un espace de travail d’agent
summary: 'Espace de travail de l’agent : emplacement, organisation et stratégie de sauvegarde'
title: Espace de travail de l’agent
x-i18n:
    generated_at: "2026-04-05T12:39:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Espace de travail de l’agent

L’espace de travail est le foyer de l’agent. C’est le seul répertoire de travail utilisé pour
les outils de fichiers et pour le contexte de l’espace de travail. Gardez-le privé et traitez-le comme de la mémoire.

Ceci est distinct de `~/.openclaw/`, qui stocke la configuration, les identifiants et
les sessions.

**Important :** l’espace de travail est le **cwd par défaut**, pas un sandbox strict. Les outils
résolvent les chemins relatifs par rapport à l’espace de travail, mais les chemins absolus peuvent toujours atteindre
d’autres emplacements sur l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
[`agents.defaults.sandbox`](/gateway/sandboxing) (et/ou une configuration de sandbox par agent).
Lorsque le sandboxing est activé et que `workspaceAccess` n’est pas `"rw"`, les outils opèrent
dans un espace de travail sandbox sous `~/.openclaw/sandboxes`, et non dans votre espace de travail hôte.

## Emplacement par défaut

- Par défaut : `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` est défini et n’est pas `"default"`, l’emplacement par défaut devient
  `~/.openclaw/workspace-<profile>`.
- Remplacez-le dans `~/.openclaw/openclaw.json` :

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` créeront
l’espace de travail et initialiseront les fichiers bootstrap s’ils sont absents.
Les copies d’amorçage du sandbox n’acceptent que les fichiers ordinaires dans l’espace de travail ; les alias
de lien symbolique/lien physique qui se résolvent en dehors de l’espace de travail source sont ignorés.

Si vous gérez déjà vous-même les fichiers de l’espace de travail, vous pouvez désactiver la création
des fichiers bootstrap :

```json5
{ agent: { skipBootstrap: true } }
```

## Dossiers supplémentaires d’espace de travail

Les anciennes installations ont pu créer `~/openclaw`. Conserver plusieurs répertoires
d’espace de travail peut provoquer des dérives d’authentification ou d’état difficiles à comprendre, car un seul
espace de travail est actif à la fois.

**Recommandation :** gardez un seul espace de travail actif. Si vous n’utilisez plus les
dossiers supplémentaires, archivez-les ou placez-les dans la Corbeille (par exemple `trash ~/openclaw`).
Si vous conservez volontairement plusieurs espaces de travail, assurez-vous que
`agents.defaults.workspace` pointe vers l’espace de travail actif.

`openclaw doctor` affiche un avertissement lorsqu’il détecte des répertoires d’espace de travail supplémentaires.

## Carte des fichiers de l’espace de travail (signification de chaque fichier)

Voici les fichiers standard qu’OpenClaw attend dans l’espace de travail :

- `AGENTS.md`
  - Instructions de fonctionnement pour l’agent et façon dont il doit utiliser la mémoire.
  - Chargé au début de chaque session.
  - Bon emplacement pour les règles, priorités et détails sur « comment se comporter ».

- `SOUL.md`
  - Persona, ton et limites.
  - Chargé à chaque session.
  - Guide : [Guide de personnalité SOUL.md](/concepts/soul)

- `USER.md`
  - Qui est l’utilisateur et comment s’adresser à lui.
  - Chargé à chaque session.

- `IDENTITY.md`
  - Le nom, le style et l’emoji de l’agent.
  - Créé/mis à jour pendant le rituel bootstrap.

- `TOOLS.md`
  - Notes sur vos outils locaux et conventions.
  - Ne contrôle pas la disponibilité des outils ; ne sert que de guide.

- `HEARTBEAT.md`
  - Petite checklist facultative pour les exécutions heartbeat.
  - Gardez-la courte pour éviter de gaspiller des jetons.

- `BOOT.md`
  - Checklist de démarrage facultative exécutée au redémarrage de gateway lorsque les hooks internes sont activés.
  - Gardez-la courte ; utilisez l’outil de message pour les envois sortants.

- `BOOTSTRAP.md`
  - Rituel unique de première exécution.
  - Créé uniquement pour un espace de travail entièrement nouveau.
  - Supprimez-le une fois le rituel terminé.

- `memory/YYYY-MM-DD.md`
  - Journal mémoire quotidien (un fichier par jour).
  - Il est recommandé de lire aujourd’hui + hier au démarrage de la session.

- `MEMORY.md` (facultatif)
  - Mémoire long terme organisée.
  - À charger uniquement dans la session principale privée (pas dans les contextes partagés/de groupe).

Voir [Mémoire](/concepts/memory) pour le flux de travail et la purge mémoire automatique.

- `skills/` (facultatif)
  - Skills spécifiques à l’espace de travail.
  - Emplacement de Skills à la plus haute priorité pour cet espace de travail.
  - Remplace les Skills d’agent de projet, les Skills d’agent personnels, les Skills gérés, les Skills intégrés et `skills.load.extraDirs` en cas de collision de noms.

- `canvas/` (facultatif)
  - Fichiers UI canvas pour les affichages de nœud (par exemple `canvas/index.html`).

Si un fichier bootstrap est absent, OpenClaw injecte un marqueur « fichier manquant » dans
la session et continue. Les gros fichiers bootstrap sont tronqués lors de l’injection ;
ajustez les limites avec `agents.defaults.bootstrapMaxChars` (par défaut : 20000) et
`agents.defaults.bootstrapTotalMaxChars` (par défaut : 150000).
`openclaw setup` peut recréer les valeurs par défaut manquantes sans écraser les
fichiers existants.

## Ce qui n’est PAS dans l’espace de travail

Ces éléments se trouvent sous `~/.openclaw/` et ne doivent PAS être validés dans le dépôt de l’espace de travail :

- `~/.openclaw/openclaw.json` (configuration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profils d’authentification de modèle : OAuth + clés API)
- `~/.openclaw/credentials/` (état du canal/fournisseur plus données d’importation OAuth héritées)
- `~/.openclaw/agents/<agentId>/sessions/` (transcriptions de session + métadonnées)
- `~/.openclaw/skills/` (Skills gérés)

Si vous devez migrer des sessions ou la configuration, copiez-les séparément et gardez-les
hors du contrôle de version.

## Sauvegarde Git (recommandée, privée)

Traitez l’espace de travail comme une mémoire privée. Placez-le dans un dépôt git **privé** afin qu’il soit
sauvegardé et récupérable.

Exécutez ces étapes sur la machine où gateway s’exécute (c’est là que
l’espace de travail se trouve).

### 1) Initialiser le dépôt

Si git est installé, les nouveaux espaces de travail sont initialisés automatiquement. Si cet
espace de travail n’est pas déjà un dépôt, exécutez :

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Ajouter un remote privé (options adaptées aux débutants)

Option A : interface web GitHub

1. Créez un nouveau dépôt **privé** sur GitHub.
2. Ne l’initialisez pas avec un README (pour éviter les conflits de fusion).
3. Copiez l’URL remote HTTPS.
4. Ajoutez le remote et poussez :

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Option B : GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Option C : interface web GitLab

1. Créez un nouveau dépôt **privé** sur GitLab.
2. Ne l’initialisez pas avec un README (pour éviter les conflits de fusion).
3. Copiez l’URL remote HTTPS.
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

## Ne validez pas de secrets

Même dans un dépôt privé, évitez de stocker des secrets dans l’espace de travail :

- Clés API, jetons OAuth, mots de passe ou identifiants privés.
- Tout ce qui se trouve sous `~/.openclaw/`.
- Dumps bruts de chats ou pièces jointes sensibles.

Si vous devez stocker des références sensibles, utilisez des espaces réservés et conservez le vrai
secret ailleurs (gestionnaire de mots de passe, variables d’environnement ou `~/.openclaw/`).

Exemple de départ pour `.gitignore` :

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

## Notes avancées

- Le routage multi-agent peut utiliser différents espaces de travail par agent. Voir
  [Routage des canaux](/channels/channel-routing) pour la configuration du routage.
- Si `agents.defaults.sandbox` est activé, les sessions non principales peuvent utiliser des espaces de travail
  sandbox par session sous `agents.defaults.sandbox.workspaceRoot`.

## Liens associés

- [Ordres permanents](/automation/standing-orders) — instructions persistantes dans les fichiers d’espace de travail
- [Heartbeat](/gateway/heartbeat) — fichier d’espace de travail HEARTBEAT.md
- [Session](/concepts/session) — chemins de stockage des sessions
- [Sandboxing](/gateway/sandboxing) — accès à l’espace de travail dans les environnements sandboxés
