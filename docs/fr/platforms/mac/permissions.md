---
read_when:
    - Déboguer les invites de permissions macOS manquantes ou bloquées
    - Packaging ou signature de l’app macOS
    - Modifier les identifiants de bundle ou les chemins d’installation de l’app macOS
summary: Persistance des permissions macOS (TCC) et exigences de signature
title: Permissions macOS
x-i18n:
    generated_at: "2026-04-24T07:21:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 15
---

Les autorisations macOS sont fragiles. TCC associe une autorisation à la
signature du code de l’app, à l’identifiant de bundle et à son chemin sur le disque. Si l’un de ces éléments change,
macOS considère l’app comme nouvelle et peut supprimer ou masquer les invites.

## Exigences pour des permissions stables

- Même chemin : exécutez l’app depuis un emplacement fixe (pour OpenClaw, `dist/OpenClaw.app`).
- Même identifiant de bundle : changer l’identifiant de bundle crée une nouvelle identité de permission.
- App signée : les builds non signés ou signés ad hoc ne conservent pas les permissions.
- Signature cohérente : utilisez un vrai certificat Apple Development ou Developer ID
  afin que la signature reste stable entre les reconstructions.

Les signatures ad hoc génèrent une nouvelle identité à chaque build. macOS oubliera les autorisations précédentes,
et les invites peuvent même disparaître complètement jusqu’à ce que les anciennes entrées soient effacées.

## Checklist de récupération lorsque les invites disparaissent

1. Quittez l’app.
2. Supprimez l’entrée de l’app dans Réglages Système -> Confidentialité et sécurité.
3. Relancez l’app depuis le même chemin et réaccordez les permissions.
4. Si l’invite n’apparaît toujours pas, réinitialisez les entrées TCC avec `tccutil` et réessayez.
5. Certaines permissions ne réapparaissent qu’après un redémarrage complet de macOS.

Exemples de réinitialisation (remplacez l’identifiant de bundle si nécessaire) :

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissions fichiers et dossiers (Desktop/Documents/Downloads)

macOS peut aussi restreindre Desktop, Documents et Downloads pour les processus terminal/arrière-plan. Si des lectures de fichiers ou des listages de répertoires se bloquent, accordez l’accès au même contexte de processus que celui qui exécute les opérations sur les fichiers (par exemple Terminal/iTerm, app lancée par LaunchAgent, ou processus SSH).

Solution de contournement : déplacez les fichiers dans l’espace de travail OpenClaw (`~/.openclaw/workspace`) si vous voulez éviter des autorisations par dossier.

Si vous testez les permissions, signez toujours avec un vrai certificat. Les builds ad hoc
ne sont acceptables que pour des exécutions locales rapides où les permissions n’ont pas d’importance.

## Articles connexes

- [App macOS](/fr/platforms/macos)
- [Signature macOS](/fr/platforms/mac/signing)
