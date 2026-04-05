---
read_when:
    - Initialiser manuellement un workspace
summary: Modèle de workspace pour TOOLS.md
title: Modèle TOOLS.md
x-i18n:
    generated_at: "2026-04-05T12:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Notes locales

Les Skills définissent _comment_ les outils fonctionnent. Ce fichier est destiné à _vos_ spécificités — ce qui est propre à votre configuration.

## Que mettre ici

Des éléments comme :

- Noms et emplacements des caméras
- Hôtes SSH et alias
- Voix préférées pour le TTS
- Noms des enceintes/pièces
- Surnoms des appareils
- Tout ce qui est spécifique à l’environnement

## Exemples

```markdown
### Caméras

- living-room → Pièce principale, grand angle 180°
- front-door → Entrée, déclenchement sur mouvement

### SSH

- home-server → 192.168.1.100, utilisateur : admin

### TTS

- Voix préférée : "Nova" (chaleureuse, légèrement britannique)
- Enceinte par défaut : HomePod de la cuisine
```

## Pourquoi séparer ?

Les Skills sont partagées. Votre configuration vous appartient. Les garder séparées permet de mettre à jour les Skills sans perdre vos notes, et de partager les Skills sans exposer votre infrastructure.

---

Ajoutez tout ce qui vous aide à faire votre travail. C’est votre antisèche.
