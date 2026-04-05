---
read_when:
    - Débogage des indicateurs d’état de l’app Mac
summary: Comment l’app macOS signale les états de santé de Gateway/Baileys
title: Vérifications d’état (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9223b2bbe272b32526f79cf878510ac5104e788402d94a1b1627e72c5fbebf5
    source_path: platforms/mac/health.md
    workflow: 15
---

# Vérifications d’état sur macOS

Comment voir si le canal lié est sain depuis l’application de barre de menus.

## Barre de menus

- Le point d’état reflète désormais l’état de Baileys :
  - Vert : lié + socket récemment ouvert.
  - Orange : connexion/réessai.
  - Rouge : déconnecté ou échec de la sonde.
- La ligne secondaire affiche « linked · auth 12m » ou la raison de l’échec.
- L’élément de menu « Run Health Check » déclenche une sonde à la demande.

## Paramètres

- L’onglet General gagne une carte Health affichant : âge de l’auth liée, chemin/nombre du magasin de session, heure de la dernière vérification, dernier code d’erreur/d’état, et boutons Run Health Check / Reveal Logs.
- Utilise un instantané en cache pour que l’interface se charge instantanément et se replie proprement hors ligne.
- **L’onglet Channels** expose l’état du canal + des contrôles pour WhatsApp/Telegram (QR de connexion, déconnexion, sonde, dernier disconnect/erreur).

## Comment fonctionne la sonde

- L’application exécute `openclaw health --json` via `ShellExecutor` toutes les ~60 s et à la demande. La sonde charge les identifiants et signale l’état sans envoyer de messages.
- Met en cache séparément le dernier instantané valide et la dernière erreur afin d’éviter le scintillement ; affiche l’horodatage de chacun.

## En cas de doute

- Vous pouvez toujours utiliser le flux CLI de [État de santé Gateway](/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) et suivre `/tmp/openclaw/openclaw-*.log` pour `web-heartbeat` / `web-reconnect`.
