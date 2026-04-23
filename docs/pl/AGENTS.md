---
x-i18n:
    generated_at: "2026-04-23T09:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Przewodnik po dokumentacji

Ten katalog odpowiada za tworzenie dokumentacji, reguły linków Mintlify oraz politykę internacjonalizacji dokumentacji.

## Reguły Mintlify

- Dokumentacja jest hostowana w Mintlify (`https://docs.openclaw.ai`).
- Wewnętrzne linki do dokumentacji w `docs/**/*.md` muszą pozostać root-relative bez sufiksu `.md` ani `.mdx` (przykład: `[Config](/gateway/configuration)`).
- Odwołania między sekcjami powinny używać anchorów na ścieżkach root-relative (przykład: `[Hooks](/gateway/configuration-reference#hooks)`).
- Nagłówki dokumentacji powinny unikać półpauz i apostrofów, ponieważ generowanie anchorów w Mintlify jest na nie podatne.
- README i inne dokumenty renderowane przez GitHub powinny zachować bezwzględne adresy URL dokumentacji, aby linki działały poza Mintlify.
- Treść dokumentacji musi pozostać ogólna: bez osobistych nazw urządzeń, nazw hostów ani lokalnych ścieżek; używaj placeholderów takich jak `user@gateway-host`.

## Reguły dotyczące treści dokumentacji

- W dokumentacji, tekstach UI i listach wyboru usługi/providerów porządkuj alfabetycznie, chyba że dana sekcja wyraźnie opisuje kolejność działania w runtime lub kolejność automatycznego wykrywania.
- Zachowuj spójne nazewnictwo bundlowanych pluginów zgodnie z ogólnorepozytoryjnymi zasadami terminologii pluginów z głównego `AGENTS.md`.

## Internacjonalizacja dokumentacji

- Dokumentacja w językach obcych nie jest utrzymywana w tym repozytorium. Wygenerowany wynik publikacji znajduje się w osobnym repozytorium `openclaw/docs` (często sklonowanym lokalnie jako `../openclaw-docs`).
- Nie dodawaj ani nie edytuj zlokalizowanej dokumentacji w `docs/<locale>/**` tutaj.
- Traktuj angielską dokumentację w tym repozytorium oraz pliki glosariusza jako źródło prawdy.
- Pipeline: zaktualizuj tutaj angielską dokumentację, w razie potrzeby zaktualizuj `docs/.i18n/glossary.<locale>.json`, a następnie pozwól, by synchronizacja repozytorium publikacji i `scripts/docs-i18n` uruchomiły się w `openclaw/docs`.
- Przed ponownym uruchomieniem `scripts/docs-i18n` dodaj wpisy do glosariusza dla wszystkich nowych terminów technicznych, tytułów stron lub krótkich etykiet nawigacyjnych, które muszą pozostać w języku angielskim lub mieć ustalone tłumaczenie.
- `pnpm docs:check-i18n-glossary` to zabezpieczenie dla zmienionych angielskich tytułów dokumentów i krótkich wewnętrznych etykiet dokumentacji.
- Pamięć tłumaczeniowa znajduje się w wygenerowanych plikach `docs/.i18n/*.tm.jsonl` w repozytorium publikacji.
- Zobacz `docs/.i18n/README.md`.
