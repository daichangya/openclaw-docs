---
read_when:
    - Démarrage d’une nouvelle session d’agent OpenClaw
    - Activation ou audit des Skills par défaut
summary: Instructions d’agent OpenClaw par défaut et liste des Skills pour la configuration d’assistant personnel
title: AGENTS.md par défaut
x-i18n:
    generated_at: "2026-04-05T12:53:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - Assistant personnel OpenClaw (par défaut)

## Premier lancement (recommandé)

OpenClaw utilise un répertoire de workspace dédié pour l’agent. Par défaut : `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`).

1. Créez le workspace (s’il n’existe pas déjà) :

```bash
mkdir -p ~/.openclaw/workspace
```

2. Copiez les modèles de workspace par défaut dans le workspace :

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Facultatif : si vous voulez la liste des Skills d’assistant personnel, remplacez AGENTS.md par ce fichier :

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Facultatif : choisissez un autre workspace en définissant `agents.defaults.workspace` (prend en charge `~`) :

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Valeurs de sécurité par défaut

- Ne déversez pas de répertoires ni de secrets dans le chat.
- N’exécutez pas de commandes destructrices sauf demande explicite.
- N’envoyez pas de réponses partielles/en streaming vers des surfaces de messagerie externes (réponses finales uniquement).

## Début de session (obligatoire)

- Lisez `SOUL.md`, `USER.md`, ainsi qu’aujourd’hui + hier dans `memory/`.
- Lisez `MEMORY.md` lorsqu’il est présent ; ne revenez à `memory.md` en minuscules que lorsque `MEMORY.md` est absent.
- Faites-le avant de répondre.

## Soul (obligatoire)

- `SOUL.md` définit l’identité, le ton et les limites. Gardez-le à jour.
- Si vous modifiez `SOUL.md`, dites-le à l’utilisateur.
- Vous êtes une instance fraîche à chaque session ; la continuité vit dans ces fichiers.

## Espaces partagés (recommandé)

- Vous n’êtes pas la voix de l’utilisateur ; soyez prudent dans les discussions de groupe ou les canaux publics.
- Ne partagez pas de données privées, coordonnées ou notes internes.

## Système de mémoire (recommandé)

- Journal quotidien : `memory/YYYY-MM-DD.md` (créez `memory/` si nécessaire).
- Mémoire long terme : `MEMORY.md` pour les faits, préférences et décisions durables.
- `memory.md` en minuscules est uniquement une solution de repli historique ; ne conservez pas intentionnellement les deux fichiers racine.
- Au début de la session, lisez aujourd’hui + hier + `MEMORY.md` lorsqu’il est présent, sinon `memory.md`.
- Capturez : décisions, préférences, contraintes, boucles ouvertes.
- Évitez les secrets sauf demande explicite.

## Outils & Skills

- Les outils vivent dans les Skills ; suivez le `SKILL.md` de chaque Skill lorsque vous en avez besoin.
- Conservez les notes spécifiques à l’environnement dans `TOOLS.md` (Notes for Skills).

## Astuce de sauvegarde (recommandée)

Si vous traitez ce workspace comme la « mémoire » de Clawd, faites-en un dépôt git (idéalement privé) afin que `AGENTS.md` et vos fichiers de mémoire soient sauvegardés.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Facultatif : ajoutez un remote privé + push
```

## Ce que fait OpenClaw

- Exécute une passerelle WhatsApp + un agent de codage Pi pour que l’assistant puisse lire/écrire des discussions, récupérer du contexte et exécuter des Skills via le Mac hôte.
- L’app macOS gère les autorisations (enregistrement d’écran, notifications, microphone) et expose la CLI `openclaw` via son binaire intégré.
- Les discussions directes se réduisent par défaut à la session `main` de l’agent ; les groupes restent isolés sous `agent:<agentId>:<channel>:group:<id>` (salons/canaux : `agent:<agentId>:<channel>:channel:<id>`) ; les heartbeats maintiennent les tâches d’arrière-plan actives.

## Skills centraux (à activer dans Réglages → Skills)

- **mcporter** — runtime/CLI de serveur d’outils pour gérer des backends de Skills externes.
- **Peekaboo** — captures d’écran macOS rapides avec analyse de vision IA facultative.
- **camsnap** — capturer des images, clips ou alertes de mouvement depuis des caméras de sécurité RTSP/ONVIF.
- **oracle** — CLI d’agent prête pour OpenAI avec relecture de session et contrôle browser.
- **eightctl** — contrôlez votre sommeil depuis le terminal.
- **imsg** — envoyer, lire, streamer iMessage & SMS.
- **wacli** — CLI WhatsApp : synchroniser, rechercher, envoyer.
- **discord** — actions Discord : réactions, stickers, sondages. Utilisez des cibles `user:<id>` ou `channel:<id>` (les identifiants numériques nus sont ambigus).
- **gog** — CLI Google Suite : Gmail, Calendar, Drive, Contacts.
- **spotify-player** — client Spotify en terminal pour rechercher/mettre en file/contrôler la lecture.
- **sag** — voix ElevenLabs avec une expérience de type say sur Mac ; streame vers les haut-parleurs par défaut.
- **Sonos CLI** — contrôler des haut-parleurs Sonos (découverte/état/lecture/volume/groupage) depuis des scripts.
- **blucli** — lire, grouper et automatiser des lecteurs BluOS depuis des scripts.
- **OpenHue CLI** — contrôle d’éclairage Philips Hue pour scènes et automatisations.
- **OpenAI Whisper** — speech-to-text local pour dictée rapide et transcriptions de messagerie vocale.
- **Gemini CLI** — modèles Google Gemini depuis le terminal pour des questions/réponses rapides.
- **agent-tools** — boîte à outils utilitaire pour automatisations et scripts auxiliaires.

## Remarques d’utilisation

- Préférez la CLI `openclaw` pour le scripting ; l’app Mac gère les autorisations.
- Lancez les installations depuis l’onglet Skills ; il masque le bouton si un binaire est déjà présent.
- Gardez les heartbeats activés afin que l’assistant puisse planifier des rappels, surveiller des boîtes de réception et déclencher des captures caméra.
- L’interface Canvas s’exécute en plein écran avec des surcouches natives. Évitez de placer des contrôles critiques dans les bords haut gauche/haut droite/bas ; ajoutez des marges explicites dans la mise en page et ne vous appuyez pas sur les safe-area insets.
- Pour la vérification pilotée par browser, utilisez `openclaw browser` (tabs/status/screenshot) avec le profil Chrome géré par OpenClaw.
- Pour l’inspection DOM, utilisez `openclaw browser eval|query|dom|snapshot` (et `--json`/`--out` lorsque vous avez besoin d’une sortie machine).
- Pour les interactions, utilisez `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type nécessitent des références snapshot ; utilisez `evaluate` pour les sélecteurs CSS).
