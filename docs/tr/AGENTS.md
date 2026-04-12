---
x-i18n:
    generated_at: "2026-04-12T08:32:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# Dokümantasyon Kılavuzu

Bu dizin, dokümantasyon yazımını, Mintlify bağlantı kurallarını ve dokümantasyon i18n politikasını yönetir.

## Mintlify Kuralları

- Dokümantasyon Mintlify üzerinde barındırılır (`https://docs.openclaw.ai`).
- `docs/**/*.md` içindeki dahili doküman bağlantıları, `.md` veya `.mdx` uzantısı olmadan kök göreli kalmalıdır (örnek: `[Config](/configuration)`).
- Bölüm çapraz başvuruları, kök göreli yollar üzerindeki anchor'ları kullanmalıdır (örnek: `[Hooks](/configuration#hooks)`).
- Doküman başlıklarında em dash ve kesme işaretlerinden kaçınılmalıdır çünkü Mintlify anchor üretimi bu karakterlerde kırılgandır.
- README ve GitHub'da işlenen diğer dokümanlarda, bağlantıların Mintlify dışında da çalışması için mutlak doküman URL'leri korunmalıdır.
- Doküman içeriği genel kalmalıdır: kişisel cihaz adları, ana makine adları veya yerel yollar olmamalıdır; `user@gateway-host` gibi yer tutucular kullanın.

## Doküman İçerik Kuralları

- Dokümanlar, UI metinleri ve seçici listeleri için; bölüm açıkça çalışma zamanı sırasını veya otomatik algılama sırasını açıklamıyorsa hizmetleri/sağlayıcıları alfabetik olarak sıralayın.
- Paketlenmiş plugin adlandırmasını, kök `AGENTS.md` içindeki depo genelindeki plugin terminolojisi kurallarıyla tutarlı tutun.

## Doküman i18n

- Yabancı dilde dokümanlar bu depoda korunmaz. Oluşturulan yayın çıktısı ayrı `openclaw/docs` deposunda bulunur (genellikle yerelde `../openclaw-docs` olarak klonlanır).
- Burada `docs/<locale>/**` altına yerelleştirilmiş doküman eklemeyin veya düzenlemeyin.
- Bu depodaki İngilizce dokümanları ve sözlük dosyalarını doğruluk kaynağı olarak kabul edin.
- Ardışık düzen: burada İngilizce dokümanları güncelleyin, gerektiğinde `docs/.i18n/glossary.<locale>.json` dosyasını güncelleyin, ardından yayın deposu eşitlemesinin ve `openclaw/docs` içindeki `scripts/docs-i18n` çalışmasının bunu işlemesine izin verin.
- `scripts/docs-i18n` yeniden çalıştırılmadan önce, İngilizce kalması veya sabit bir çeviri kullanması gereken yeni teknik terimler, sayfa başlıkları ya da kısa gezinme etiketleri için sözlük girdileri ekleyin.
- `pnpm docs:check-i18n-glossary`, değiştirilen İngilizce doküman başlıkları ve kısa dahili doküman etiketleri için korumadır.
- Çeviri belleği, yayın deposundaki oluşturulmuş `docs/.i18n/*.tm.jsonl` dosyalarında bulunur.
- Bkz. `docs/.i18n/README.md`.
