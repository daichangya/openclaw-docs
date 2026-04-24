---
read_when:
    - Capturer les journaux macOS ou enquêter sur la journalisation de données privées
    - Débogage des problèmes de réveil vocal / cycle de vie de session
summary: 'Journalisation OpenClaw : journal de diagnostic rotatif sur fichier + indicateurs de confidentialité du journal unifié'
title: Journalisation macOS
x-i18n:
    generated_at: "2026-04-24T07:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Journalisation (macOS)

## Journal de diagnostic rotatif sur fichier (volet Debug)

OpenClaw route les journaux de l’application macOS via swift-log (journalisation unifiée par défaut) et peut écrire un journal local rotatif sur disque lorsque vous avez besoin d’une capture durable.

- Verbosité : **Volet Debug → Logs → App logging → Verbosity**
- Activer : **Volet Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- Emplacement : `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotation automatique ; les anciens fichiers reçoivent les suffixes `.1`, `.2`, …)
- Effacer : **Volet Debug → Logs → App logging → “Clear”**

Remarques :

- C’est **désactivé par défaut**. Activez-le uniquement pendant un débogage actif.
- Traitez ce fichier comme sensible ; ne le partagez pas sans l’avoir relu.

## Données privées de la journalisation unifiée sur macOS

La journalisation unifiée masque la plupart des charges utiles sauf si un sous-système active `privacy -off`. D’après l’article de Peter sur les [bizarreries de confidentialité de la journalisation](https://steipete.me/posts/2025/logging-privacy-shenanigans) sur macOS (2025), cela est contrôlé par un plist dans `/Library/Preferences/Logging/Subsystems/` indexé par le nom du sous-système. Seules les nouvelles entrées de journal prennent en compte cet indicateur ; activez-le donc avant de reproduire un problème.

## Activer pour OpenClaw (`ai.openclaw`)

- Écrivez d’abord le plist dans un fichier temporaire, puis installez-le de façon atomique en root :

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- Aucun redémarrage n’est requis ; logd détecte rapidement le fichier, mais seules les nouvelles lignes de journal incluront les charges utiles privées.
- Affichez la sortie enrichie avec l’assistant existant, par exemple `./scripts/clawlog.sh --category WebChat --last 5m`.

## Désactiver après le débogage

- Supprimez le remplacement : `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Vous pouvez éventuellement exécuter `sudo log config --reload` pour forcer logd à abandonner immédiatement le remplacement.
- N’oubliez pas que cette surface peut inclure des numéros de téléphone et des corps de message ; ne laissez le plist en place que tant que vous avez réellement besoin de ce niveau de détail supplémentaire.

## Associé

- [Application macOS](/fr/platforms/macos)
- [Journalisation du Gateway](/fr/gateway/logging)
