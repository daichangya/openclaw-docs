---
read_when:
    - Vous souhaitez contribuer des constats de sécurité ou des scénarios de menace
    - Révision ou mise à jour du modèle de menace
summary: Comment contribuer au modèle de menace d’OpenClaw
title: Contribuer au modèle de menace
x-i18n:
    generated_at: "2026-04-24T07:32:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Contribuer au modèle de menace d’OpenClaw

Merci de contribuer à rendre OpenClaw plus sûr. Ce modèle de menace est un document vivant et nous accueillons les contributions de tout le monde — vous n’avez pas besoin d’être un expert en sécurité.

## Manières de contribuer

### Ajouter une menace

Vous avez repéré un vecteur d’attaque ou un risque que nous n’avons pas couvert ? Ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues) et décrivez-le avec vos propres mots. Vous n’avez pas besoin de connaître des frameworks ni de remplir tous les champs — décrivez simplement le scénario.

**Utile à inclure (mais pas obligatoire) :**

- Le scénario d’attaque et la manière dont il pourrait être exploité
- Les parties d’OpenClaw affectées (CLI, gateway, canaux, ClawHub, serveurs MCP, etc.)
- Le niveau de gravité que vous estimez (faible / moyen / élevé / critique)
- Tout lien vers des recherches connexes, des CVE ou des exemples concrets

Nous nous occuperons du mapping ATLAS, des identifiants de menace et de l’évaluation du risque pendant la revue. Si vous souhaitez inclure ces détails, très bien — mais ce n’est pas attendu.

> **Ceci sert à enrichir le modèle de menace, pas à signaler des vulnérabilités actives.** Si vous avez trouvé une vulnérabilité exploitable, consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de divulgation responsable.

### Suggérer une mitigation

Vous avez une idée pour traiter une menace existante ? Ouvrez une issue ou une PR en faisant référence à cette menace. Les mitigations utiles sont spécifiques et actionnables — par exemple, « limitation de débit par expéditeur à 10 messages/minute au niveau du gateway » est mieux que « implémenter une limitation de débit ».

### Proposer une chaîne d’attaque

Les chaînes d’attaque montrent comment plusieurs menaces se combinent en un scénario d’attaque réaliste. Si vous voyez une combinaison dangereuse, décrivez les étapes et la manière dont un attaquant les enchaînerait. Un court récit de la façon dont l’attaque se déroule en pratique a plus de valeur qu’un modèle formel.

### Corriger ou améliorer le contenu existant

Fautes de frappe, clarifications, informations obsolètes, meilleurs exemples — les PR sont les bienvenues, sans issue préalable.

## Ce que nous utilisons

### MITRE ATLAS

Ce modèle de menace s’appuie sur [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework conçu spécifiquement pour les menaces IA/ML comme l’injection de prompt, l’abus d’outils et l’exploitation d’agents. Vous n’avez pas besoin de connaître ATLAS pour contribuer — nous relions les contributions au framework pendant la revue.

### Identifiants de menace

Chaque menace reçoit un identifiant comme `T-EXEC-003`. Les catégories sont :

| Code    | Category                                   |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance - collecte d’informations   |
| ACCESS  | Accès initial - obtenir une entrée         |
| EXEC    | Exécution - lancer des actions malveillantes |
| PERSIST | Persistance - maintenir l’accès            |
| EVADE   | Évasion des défenses - éviter la détection |
| DISC    | Découverte - comprendre l’environnement    |
| EXFIL   | Exfiltration - voler des données           |
| IMPACT  | Impact - dommage ou perturbation           |

Les identifiants sont attribués par les mainteneurs pendant la revue. Vous n’avez pas besoin d’en choisir un.

### Niveaux de risque

| Level        | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Critical** | Compromission complète du système, ou forte probabilité + impact critique |
| **High**     | Dégâts significatifs probables, ou probabilité moyenne + impact critique |
| **Medium**   | Risque modéré, ou faible probabilité + fort impact                |
| **Low**      | Peu probable et impact limité                                     |

Si vous n’êtes pas sûr du niveau de risque, décrivez simplement l’impact et nous l’évaluerons.

## Processus de revue

1. **Tri** — Nous examinons les nouvelles contributions sous 48 heures
2. **Évaluation** — Nous vérifions la faisabilité, attribuons le mapping ATLAS et l’identifiant de menace, validons le niveau de risque
3. **Documentation** — Nous nous assurons que tout est bien formaté et complet
4. **Fusion** — Ajout au modèle de menace et à la visualisation

## Ressources

- [Site ATLAS](https://atlas.mitre.org/)
- [Techniques ATLAS](https://atlas.mitre.org/techniques/)
- [Études de cas ATLAS](https://atlas.mitre.org/studies/)
- [Modèle de menace OpenClaw](/fr/security/THREAT-MODEL-ATLAS)

## Contact

- **Vulnérabilités de sécurité :** consultez notre [page Trust](https://trust.openclaw.ai) pour les instructions de signalement
- **Questions sur le modèle de menace :** ouvrez une issue sur [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Discussion générale :** canal Discord #security

## Reconnaissance

Les contributeurs au modèle de menace sont reconnus dans les remerciements du modèle de menace, les notes de version, et le hall of fame sécurité d’OpenClaw pour les contributions significatives.

## Lié

- [Modèle de menace](/fr/security/THREAT-MODEL-ATLAS)
- [Vérification formelle](/fr/security/formal-verification)
