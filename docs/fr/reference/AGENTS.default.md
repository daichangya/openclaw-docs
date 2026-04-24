---
read_when:
    - Démarrage d’une nouvelle session d’agent OpenClaw
    - Activation ou audit des Skills par défaut
summary: Instructions par défaut de l’agent OpenClaw et liste de Skills pour la configuration d’assistant personnel
title: AGENTS.md par défaut
x-i18n:
    generated_at: "2026-04-24T07:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Assistant personnel OpenClaw (par défaut)

## Premier lancement (recommandé)

OpenClaw utilise un répertoire d’espace de travail dédié pour l’agent. Par défaut : `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`).

1. Créez l’espace de travail (s’il n’existe pas déjà) :

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copiez les modèles d’espace de travail par défaut dans l’espace de travail :

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Facultatif : si vous voulez la liste de Skills de l’assistant personnel, remplacez AGENTS.md par ce fichier :

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facultatif : choisissez un autre espace de travail en définissant `agents.defaults.workspace` (prend en charge `~`) :

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valeurs par défaut de sécurité

- Ne déversez pas de répertoires ni de secrets dans le chat.
- N’exécutez pas de commandes destructrices sauf demande explicite.
- N’envoyez pas de réponses partielles/en streaming sur des surfaces de messagerie externes (seulement des réponses finales).

## Début de session (obligatoire)

- Lisez `SOUL.md`, `USER.md`, ainsi qu’aujourd’hui+hier dans `memory/`.
- Lisez `MEMORY.md` lorsqu’il est présent.
- Faites-le avant de répondre.

## Soul (obligatoire)

- `SOUL.md` définit l’identité, le ton et les limites. Gardez-le à jour.
- Si vous modifiez `SOUL.md`, dites-le à l’utilisateur.
- Vous êtes une instance fraîche à chaque session ; la continuité vit dans ces fichiers.

## Espaces partagés (recommandé)

- Vous n’êtes pas la voix de l’utilisateur ; soyez prudent dans les discussions de groupe ou les canaux publics.
- Ne partagez pas de données privées, d’informations de contact ni de notes internes.

## Système Memory (recommandé)

- Journal quotidien : `memory/YYYY-MM-DD.md` (créez `memory/` si nécessaire).
- Memory à long terme : `MEMORY.md` pour les faits durables, préférences et décisions.
- `memory.md` en minuscules n’est utilisé que comme entrée de réparation héritée ; ne conservez pas intentionnellement les deux fichiers racine.
- Au début de session, lisez aujourd’hui + hier + `MEMORY.md` lorsqu’il est présent.
- Capturez : décisions, préférences, contraintes, boucles ouvertes.
- Évitez les secrets sauf demande explicite.

## Outils et Skills

- Les outils vivent dans les Skills ; suivez le `SKILL.md` de chaque skill lorsque vous en avez besoin.
- Gardez les notes spécifiques à l’environnement dans `TOOLS.md` (Notes pour les Skills).

## Astuce de sauvegarde (recommandé)

Si vous traitez cet espace de travail comme la « mémoire » de Clawd, faites-en un dépôt git (idéalement privé) afin que `AGENTS.md` et vos fichiers de mémoire soient sauvegardés.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Facultatif : ajouter un remote privé + pousser
```

## Ce que fait OpenClaw

- Exécute la passerelle WhatsApp + l’agent de code Pi afin que l’assistant puisse lire/écrire des chats, récupérer du contexte et exécuter des Skills via le Mac hôte.
- L’app macOS gère les permissions (enregistrement d’écran, notifications, microphone) et expose la CLI `openclaw` via son binaire intégré.
- Les discussions directes se replient par défaut dans la session `main` de l’agent ; les groupes restent isolés sous la forme `agent:<agentId>:<channel>:group:<id>` (salons/canaux : `agent:<agentId>:<channel>:channel:<id>`) ; les Heartbeats maintiennent les tâches d’arrière-plan actives.

## Skills cœur (à activer dans Réglages → Skills)

- **mcporter** — Runtime/CLI de serveur d’outils pour gérer des backends de Skills externes.
- **Peekaboo** — Captures d’écran macOS rapides avec analyse visuelle IA facultative.
- **camsnap** — Capture d’images, clips ou alertes de mouvement depuis des caméras de sécurité RTSP/ONVIF.
- **oracle** — CLI d’agent prête pour OpenAI avec rejeu de session et contrôle du navigateur.
- **eightctl** — Contrôlez votre sommeil depuis le terminal.
- **imsg** — Envoyer, lire et diffuser iMessage & SMS.
- **wacli** — CLI WhatsApp : synchroniser, rechercher, envoyer.
- **discord** — Actions Discord : réactions, stickers, sondages. Utilisez des cibles `user:<id>` ou `channel:<id>` (les identifiants numériques seuls sont ambigus).
- **gog** — CLI Google Suite : Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Client Spotify terminal pour rechercher/mettre en file/contrôler la lecture.
- **sag** — Parole ElevenLabs avec UX de type say sur Mac ; diffuse vers les haut-parleurs par défaut.
- **Sonos CLI** — Contrôler les enceintes Sonos (découverte/état/lecture/volume/groupage) depuis des scripts.
- **blucli** — Lire, grouper et automatiser des lecteurs BluOS depuis des scripts.
- **OpenHue CLI** — Contrôle de l’éclairage Philips Hue pour les scènes et automatisations.
- **OpenAI Whisper** — Speech-to-text local pour la dictée rapide et les transcriptions de messages vocaux.
- **Gemini CLI** — Modèles Google Gemini depuis le terminal pour des questions-réponses rapides.
- **agent-tools** — Boîte à outils utilitaire pour les automatisations et scripts d’assistance.

## Remarques d’utilisation

- Préférez la CLI `openclaw` pour le scripting ; l’app Mac gère les permissions.
- Lancez les installations depuis l’onglet Skills ; il masque le bouton si un binaire est déjà présent.
- Gardez les Heartbeats activés afin que l’assistant puisse planifier des rappels, surveiller les boîtes de réception et déclencher des captures de caméra.
- L’interface Canvas s’exécute en plein écran avec des superpositions natives. Évitez de placer des contrôles critiques dans les bords supérieur gauche/supérieur droit/bas ; ajoutez des marges explicites dans la mise en page et ne comptez pas sur les safe-area insets.
- Pour la vérification pilotée par navigateur, utilisez `openclaw browser` (onglets/état/capture d’écran) avec le profil Chrome géré par OpenClaw.
- Pour l’inspection du DOM, utilisez `openclaw browser eval|query|dom|snapshot` (et `--json`/`--out` lorsque vous avez besoin d’une sortie machine).
- Pour les interactions, utilisez `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type nécessitent des refs d’instantané ; utilisez `evaluate` pour les sélecteurs CSS).

## Lié

- [Espace de travail de l’agent](/fr/concepts/agent-workspace)
- [Runtime de l’agent](/fr/concepts/agent)
