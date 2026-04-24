---
read_when:
    - Vous déboguez des rejets de requêtes fournisseur liés à la forme de la transcription
    - Vous modifiez le nettoyage de transcription ou la logique de réparation des appels d’outils
    - Vous enquêtez sur des incohérences d’identifiants d’appel d’outil entre fournisseurs
summary: 'Référence : règles de nettoyage et de réparation des transcriptions spécifiques au fournisseur'
title: Hygiène de transcription
x-i18n:
    generated_at: "2026-04-24T07:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Hygiène de transcription (correctifs fournisseur)

Ce document décrit les **correctifs spécifiques au fournisseur** appliqués aux transcriptions avant une exécution
(construction du contexte du modèle). Il s’agit d’ajustements **en mémoire** utilisés pour satisfaire
des exigences strictes des fournisseurs. Ces étapes d’hygiène ne **réécrivent pas** la transcription JSONL stockée
sur disque ; cependant, une passe séparée de réparation du fichier de session peut réécrire des fichiers JSONL
mal formés en supprimant les lignes invalides avant le chargement de la session. Lorsqu’une réparation a lieu, le
fichier d’origine est sauvegardé à côté du fichier de session.

Le périmètre inclut :

- Nettoyage des identifiants d’appel d’outil
- Validation des entrées d’appel d’outil
- Réparation de l’appariement des résultats d’outil
- Validation / ordonnancement des tours
- Nettoyage de signature de réflexion
- Nettoyage des charges utiles image
- Balisage de provenance de l’entrée utilisateur (pour les prompts routés inter-sessions)

Si vous avez besoin de détails sur le stockage des transcriptions, voir :

- [/reference/session-management-compaction](/fr/reference/session-management-compaction)

---

## Où cela s’exécute

Toute l’hygiène de transcription est centralisée dans l’exécuteur embarqué :

- Sélection de politique : `src/agents/transcript-policy.ts`
- Application du nettoyage/de la réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène de transcription, les fichiers de session sont réparés (si nécessaire) avant chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur embarqué)

---

## Règle globale : nettoyage des images

Les charges utiles image sont toujours nettoyées pour éviter les rejets côté fournisseur dus à des
limites de taille (réduction/recompression des images base64 trop volumineuses).

Cela aide aussi à contrôler la pression de jetons induite par les images pour les modèles capables de vision.
Des dimensions maximales plus faibles réduisent généralement l’usage de jetons ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal de l’image est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).

---

## Règle globale : appels d’outils mal formés

Les blocs d’appel d’outil assistant qui n’ont ni `input` ni `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets du fournisseur provenant d’appels d’outils
partiellement conservés (par exemple après un échec de limitation de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/replay-history.ts`

---

## Règle globale : provenance des entrées inter-sessions

Lorsqu’un agent envoie un prompt dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce agent-à-agent), OpenClaw conserve le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

Cette métadonnée est écrite au moment de l’ajout à la transcription et ne change pas le rôle
(`role: "user"` reste pour la compatibilité fournisseur). Les lecteurs de transcription peuvent l’utiliser
pour éviter de traiter des prompts internes routés comme des instructions rédigées par un utilisateur final.

Lors de la reconstruction du contexte, OpenClaw ajoute également au début un court marqueur `[Inter-session message]`
à ces tours utilisateur en mémoire afin que le modèle puisse les distinguer des instructions
externes d’utilisateur final.

---

## Matrice fournisseur (comportement actuel)

**OpenAI / OpenAI Codex**

- Nettoyage des images uniquement.
- Suppression des signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex.
- Aucun nettoyage des identifiants d’appel d’outil.
- Aucune réparation d’appariement des résultats d’outil.
- Aucune validation ni réordonnancement des tours.
- Aucun résultat d’outil synthétique.
- Aucun retrait de signature de réflexion.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Nettoyage des identifiants d’appel d’outil : alphanumérique strict.
- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (alternance de type Gemini).
- Correctif d’ordonnancement Google des tours (ajout en tête d’un minuscule bootstrap utilisateur si l’historique commence par un assistant).
- Antigravity Claude : normaliser les signatures de réflexion ; supprimer les blocs de réflexion non signés.

**Anthropic / Minimax (compatibles Anthropic)**

- Réparation de l’appariement des résultats d’outil et résultats d’outil synthétiques.
- Validation des tours (fusion des tours utilisateur consécutifs pour satisfaire l’alternance stricte).

**Mistral (y compris détection basée sur l’identifiant du modèle)**

- Nettoyage des identifiants d’appel d’outil : strict9 (alphanumérique longueur 9).

**OpenRouter Gemini**

- Nettoyage de signature de réflexion : supprimer les valeurs `thought_signature` non base64 (conserver base64).

**Tout le reste**

- Nettoyage des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène de transcription :

- Une **extension transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement usage/résultat d’outil.
  - Nettoyer les identifiants d’appel d’outil (y compris un mode non strict qui préservait `_`/`-`).
- L’exécuteur effectuait également un nettoyage spécifique au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires se produisaient en dehors de la politique fournisseur, notamment :
  - Retrait des balises `<final>` du texte assistant avant conservation.
  - Suppression des tours assistant d’erreur vides.
  - Troncature du contenu assistant après les appels d’outils.

Cette complexité a provoqué des régressions inter-fournisseurs (notamment sur l’appariement `call_id|fc_id` de `openai-responses`). Le nettoyage 2026.1.22 a supprimé l’extension, centralisé
la logique dans l’exécuteur, et rendu OpenAI **no-touch** au-delà du nettoyage des images.

## Voir aussi

- [Gestion de session](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
