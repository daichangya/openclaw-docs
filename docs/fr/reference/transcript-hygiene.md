---
read_when:
    - Vous déboguez des rejets de requêtes fournisseur liés à la forme de la transcription
    - Vous modifiez l’assainissement des transcriptions ou la logique de réparation des appels d’outils
    - Vous enquêtez sur des incompatibilités d’identifiants d’appels d’outils entre fournisseurs
summary: 'Référence : règles d’assainissement et de réparation des transcriptions propres à chaque fournisseur'
title: Hygiène des transcriptions
x-i18n:
    generated_at: "2026-04-05T12:54:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Hygiène des transcriptions (correctifs fournisseur)

Ce document décrit les **correctifs propres à chaque fournisseur** appliqués aux transcriptions avant une exécution
(construction du contexte du modèle). Il s’agit d’ajustements **en mémoire** utilisés pour satisfaire
les exigences strictes des fournisseurs. Ces étapes d’hygiène ne **réécrivent pas** la transcription JSONL stockée
sur disque ; toutefois, un passage séparé de réparation du fichier de session peut réécrire les fichiers JSONL malformés
en supprimant les lignes invalides avant le chargement de la session. Lorsqu’une réparation a lieu, le fichier
original est sauvegardé à côté du fichier de session.

Le périmètre comprend :

- Assainissement des identifiants d’appels d’outils
- Validation des entrées d’appels d’outils
- Réparation de l’appariement des résultats d’outils
- Validation / ordre des tours
- Nettoyage des signatures de réflexion
- Assainissement des charges utiles d’image
- Marquage de provenance des entrées utilisateur (pour les prompts routés entre sessions)

Si vous avez besoin de détails sur le stockage des transcriptions, consultez :

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Où cela s’exécute

Toute l’hygiène des transcriptions est centralisée dans l’exécuteur intégré :

- Sélection de politique : `src/agents/transcript-policy.ts`
- Application de l’assainissement/de la réparation : `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/google.ts`

La politique utilise `provider`, `modelApi` et `modelId` pour décider quoi appliquer.

Séparément de l’hygiène des transcriptions, les fichiers de session sont réparés (si nécessaire) avant chargement :

- `repairSessionFileIfNeeded` dans `src/agents/session-file-repair.ts`
- Appelé depuis `run/attempt.ts` et `compact.ts` (exécuteur intégré)

---

## Règle globale : assainissement des images

Les charges utiles d’image sont toujours assainies pour éviter les rejets côté fournisseur dus aux limites
de taille (réduction/recompression des images base64 surdimensionnées).

Cela aide également à contrôler la pression en jetons induite par les images pour les modèles capables de vision.
Des dimensions maximales plus faibles réduisent généralement l’usage de jetons ; des dimensions plus élevées préservent les détails.

Implémentation :

- `sanitizeSessionMessagesImages` dans `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` dans `src/agents/tool-images.ts`
- Le côté maximal des images est configurable via `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`).

---

## Règle globale : appels d’outils malformés

Les blocs d’appels d’outils d’assistant auxquels il manque à la fois `input` et `arguments` sont supprimés
avant la construction du contexte du modèle. Cela évite les rejets de fournisseurs dus à des
appels d’outils partiellement persistés (par exemple après un échec de limitation de débit).

Implémentation :

- `sanitizeToolCallInputs` dans `src/agents/session-transcript-repair.ts`
- Appliqué dans `sanitizeSessionHistory` dans `src/agents/pi-embedded-runner/google.ts`

---

## Règle globale : provenance des entrées inter-sessions

Lorsqu’un agent envoie un prompt dans une autre session via `sessions_send` (y compris
les étapes de réponse/annonce agent-vers-agent), OpenClaw persiste le tour utilisateur créé avec :

- `message.provenance.kind = "inter_session"`

Ces métadonnées sont écrites au moment de l’ajout à la transcription et ne changent pas le rôle
(`role: "user"` est conservé pour la compatibilité fournisseur). Les lecteurs de transcription peuvent utiliser
cela pour éviter de traiter les prompts internes routés comme des instructions rédigées par un utilisateur final.

Lors de la reconstruction du contexte, OpenClaw préfixe aussi en mémoire ces tours utilisateur d’un court marqueur `[Inter-session message]` afin que le modèle puisse les distinguer des instructions externes d’utilisateur final.

---

## Matrice des fournisseurs (comportement actuel)

**OpenAI / OpenAI Codex**

- Assainissement des images uniquement.
- Supprimer les signatures de raisonnement orphelines (éléments de raisonnement autonomes sans bloc de contenu suivant) pour les transcriptions OpenAI Responses/Codex.
- Aucun assainissement des identifiants d’appels d’outils.
- Aucune réparation d’appariement des résultats d’outils.
- Aucune validation ni réordonnancement des tours.
- Aucun résultat d’outil synthétique.
- Aucune suppression des signatures de réflexion.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Assainissement des identifiants d’appels d’outils : alphanumérique strict.
- Réparation de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (alternance de tours de style Gemini).
- Correctif d’ordre des tours Google (préfixer un minuscule bootstrap utilisateur si l’historique commence par l’assistant).
- Antigravity Claude : normaliser les signatures de réflexion ; supprimer les blocs de réflexion non signés.

**Anthropic / Minimax (compatible Anthropic)**

- Réparation de l’appariement des résultats d’outils et résultats d’outils synthétiques.
- Validation des tours (fusionner les tours utilisateur consécutifs pour satisfaire l’alternance stricte).

**Mistral (y compris détection basée sur l’identifiant de modèle)**

- Assainissement des identifiants d’appels d’outils : strict9 (alphanumérique de longueur 9).

**OpenRouter Gemini**

- Nettoyage des signatures de réflexion : supprimer les valeurs `thought_signature` non base64 (conserver le base64).

**Tout le reste**

- Assainissement des images uniquement.

---

## Comportement historique (avant 2026.1.22)

Avant la version 2026.1.22, OpenClaw appliquait plusieurs couches d’hygiène des transcriptions :

- Une extension **transcript-sanitize** s’exécutait à chaque construction de contexte et pouvait :
  - Réparer l’appariement usage/résultat d’outil.
  - Assainir les identifiants d’appels d’outils (y compris un mode non strict qui conservait `_`/`-`).
- L’exécuteur effectuait également un assainissement propre au fournisseur, ce qui dupliquait le travail.
- Des mutations supplémentaires avaient lieu en dehors de la politique fournisseur, notamment :
  - Suppression des balises `<final>` du texte d’assistant avant persistance.
  - Suppression des tours d’erreur d’assistant vides.
  - Réduction du contenu d’assistant après les appels d’outils.

Cette complexité a provoqué des régressions inter-fournisseurs (notamment l’appariement `call_id|fc_id` de `openai-responses`). Le nettoyage de 2026.1.22 a supprimé l’extension, centralisé
la logique dans l’exécuteur et rendu OpenAI **intouché** au-delà de l’assainissement des images.
