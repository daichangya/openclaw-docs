---
x-i18n:
    generated_at: "2026-04-23T08:56:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b046833f9a15dc61894ab9e808a09a9fb055ef7ada5c3d4893fbe5f70dec126
    source_path: AGENTS.md
    workflow: 15
---

# Doküman Rehberi

Bu dizin, doküman yazarlığını, Mintlify bağlantı kurallarını ve doküman i18n politikasını yönetir.

## Mintlify Kuralları

- Dokümanlar Mintlify üzerinde barındırılır (`https://docs.openclaw.ai`).
- `docs/**/*.md` içindeki dahili doküman bağlantıları, `.md` veya `.mdx` soneki olmadan kök göreli kalmalıdır (örnek: `[Config](/gateway/configuration)`).
- Bölüm çapraz referansları, kök göreli yollarda anchor kullanmalıdır (örnek: `[Hooks](/gateway/configuration-reference#hooks)`).
- Doküman başlıkları em dash ve apostrof içermemelidir çünkü Mintlify anchor oluşturma bu durumlarda hassastır.
- README ve GitHub'da işlenen diğer dokümanlarda, bağlantıların Mintlify dışında da çalışması için mutlak doküman URL'leri korunmalıdır.
- Doküman içeriği genel kalmalıdır: kişisel cihaz adları, ana makine adları veya yerel yollar olmamalıdır; `user@gateway-host` gibi yer tutucular kullanın.

## Doküman İçerik Kuralları

- Dokümanlar, UI metinleri ve seçici listeleri için, bölüm açıkça çalışma zamanı sırasını veya otomatik algılama sırasını açıklamıyorsa hizmetleri/sağlayıcıları alfabetik sırayla dizin.
- Paketlenmiş plugin adlandırmasını, kök `AGENTS.md` içindeki depo genelindeki plugin terminoloji kurallarıyla tutarlı tutun.

## Doküman i18n

- Yabancı dil dokümanları bu depoda bakım görmez. Oluşturulan yayımlama çıktısı ayrı `openclaw/docs` deposunda bulunur (çoğu zaman yerelde `../openclaw-docs` olarak klonlanır).
- Burada `docs/<locale>/**` altında yerelleştirilmiş dokümanlar eklemeyin veya düzenlemeyin.
- Bu depodaki İngilizce dokümanları ve sözlük dosyalarını doğruluk kaynağı olarak değerlendirin.
- İş akışı: İngilizce dokümanları burada güncelleyin, gerektiğinde `docs/.i18n/glossary.<locale>.json` dosyasını güncelleyin, ardından yayımlama deposu eşitlemesinin ve `scripts/docs-i18n` çalışmasının `openclaw/docs` içinde gerçekleşmesine izin verin.
- `scripts/docs-i18n` yeniden çalıştırılmadan önce, İngilizce kalması gereken veya sabit bir çeviri kullanması gereken yeni teknik terimler, sayfa başlıkları ya da kısa gezinme etiketleri için sözlük girdileri ekleyin.
- `pnpm docs:check-i18n-glossary`, değişen İngilizce doküman başlıkları ve kısa dahili doküman etiketleri için korumadır.
- Çeviri belleği, yayımlama deposundaki oluşturulmuş `docs/.i18n/*.tm.jsonl` dosyalarında bulunur.
- Bkz. `docs/.i18n/README.md`.
