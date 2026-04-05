---
read_when:
    - Débogage des invites de permission macOS absentes ou bloquées
    - Packaging ou signature de l’application macOS
    - Modification des identifiants de bundle ou des chemins d’installation de l’application
summary: Persistance des permissions macOS (TCC) et exigences de signature
title: Permissions macOS
x-i18n:
    generated_at: "2026-04-05T12:48:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# Permissions macOS (TCC)

Les autorisations macOS sont fragiles. TCC associe une autorisation à la
signature du code de l’application, à son identifiant de bundle et à son chemin sur le disque. Si l’un de ces éléments change,
macOS traite l’application comme nouvelle et peut supprimer ou masquer les invites.

## Exigences pour des permissions stables

- Même chemin : exécutez l’application depuis un emplacement fixe (pour OpenClaw, `dist/OpenClaw.app`).
- Même identifiant de bundle : changer l’identifiant de bundle crée une nouvelle identité de permission.
- Application signée : les builds non signées ou signées ad hoc ne conservent pas les permissions.
- Signature cohérente : utilisez un vrai certificat Apple Development ou Developer ID
  afin que la signature reste stable d’une reconstruction à l’autre.

Les signatures ad hoc génèrent une nouvelle identité à chaque build. macOS oubliera les autorisations précédentes,
et les invites peuvent même disparaître complètement jusqu’à ce que les anciennes entrées soient supprimées.

## Checklist de récupération lorsque les invites disparaissent

1. Quittez l’application.
2. Supprimez l’entrée de l’application dans Réglages système -> Confidentialité et sécurité.
3. Relancez l’application depuis le même chemin et réaccordez les permissions.
4. Si l’invite n’apparaît toujours pas, réinitialisez les entrées TCC avec `tccutil` et réessayez.
5. Certaines permissions ne réapparaissent qu’après un redémarrage complet de macOS.

Exemples de réinitialisation (remplacez l’identifiant de bundle si nécessaire) :

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Permissions fichiers et dossiers (Desktop/Documents/Downloads)

macOS peut aussi protéger Desktop, Documents et Downloads pour les processus terminal/arrière-plan. Si les lectures de fichiers ou les listes de répertoires se bloquent, accordez l’accès au même contexte de processus qui effectue les opérations sur fichiers (par exemple Terminal/iTerm, application lancée par LaunchAgent ou processus SSH).

Solution de contournement : déplacez les fichiers dans l’espace de travail OpenClaw (`~/.openclaw/workspace`) si vous voulez éviter des autorisations par dossier.

Si vous testez les permissions, signez toujours avec un vrai certificat. Les builds ad hoc
ne sont acceptables que pour des exécutions locales rapides où les permissions n’ont pas d’importance.
