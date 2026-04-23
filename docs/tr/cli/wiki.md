---
read_when:
    - memory-wiki CLI'yi kullanmak istiyorsunuz
    - '`openclaw wiki` belgeliyor veya değiştiriyorsunuz'
summary: '`openclaw wiki` için CLI başvurusu (memory-wiki vault durumu, arama, derleme, lint, uygulama, köprü ve Obsidian yardımcıları)'
title: wiki
x-i18n:
    generated_at: "2026-04-23T09:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

`memory-wiki` vault'unu inceleyin ve bakımını yapın.

Paketle gelen `memory-wiki` Plugin'i tarafından sağlanır.

İlgili:

- [Memory Wiki Plugin'i](/tr/plugins/memory-wiki)
- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: memory](/tr/cli/memory)

## Ne için kullanılır

Aşağıdakileri içeren derlenmiş bir bilgi vault'u istediğinizde `openclaw wiki` kullanın:

- wiki'ye özgü arama ve sayfa okuma
- köken bilgisi açısından zengin sentezler
- çelişki ve güncellik raporları
- etkin memory Plugin'inden köprü içe aktarımları
- isteğe bağlı Obsidian CLI yardımcıları

## Yaygın komutlar

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Komutlar

### `wiki status`

Geçerli vault modunu, sağlığını ve Obsidian CLI kullanılabilirliğini inceleyin.

Vault'un başlatılıp başlatılmadığından, köprü modunun sağlıklı olup olmadığından veya Obsidian entegrasyonunun kullanılabilirliğinden emin değilseniz önce bunu kullanın.

### `wiki doctor`

Wiki sağlık denetimlerini çalıştırın ve yapılandırma veya vault sorunlarını ortaya çıkarın.

Tipik sorunlar şunlardır:

- genel memory yapıtları olmadan etkinleştirilmiş köprü modu
- geçersiz veya eksik vault düzeni
- Obsidian modunun beklendiği durumda eksik harici Obsidian CLI

### `wiki init`

Wiki vault düzenini ve başlangıç sayfalarını oluşturun.

Bu, üst düzey dizinler ve önbellek dizinleri dahil kök yapıyı başlatır.

### `wiki ingest <path-or-url>`

İçeriği wiki kaynak katmanına içe aktarın.

Notlar:

- URL içe aktarma `ingest.allowUrlIngest` tarafından denetlenir
- içe aktarılan kaynak sayfaları köken bilgisini frontmatter içinde korur
- etkinleştirildiğinde içe aktarmadan sonra otomatik derleme çalışabilir

### `wiki compile`

Dizinleri, ilgili blokları, panoları ve derlenmiş özetleri yeniden oluşturun.

Bu, aşağıdaki konumlara kararlı makineye dönük yapıtlar yazar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` etkinse, derleme rapor sayfalarını da yeniler.

### `wiki lint`

Vault'u lint edin ve şunları raporlayın:

- yapısal sorunlar
- köken bilgisi boşlukları
- çelişkiler
- açık sorular
- düşük güvenli sayfalar/iddialar
- eski sayfalar/iddialar

Bunu anlamlı wiki güncellemelerinden sonra çalıştırın.

### `wiki search <query>`

Wiki içeriğinde arama yapın.

Davranış yapılandırmaya bağlıdır:

- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`

Wiki'ye özgü sıralama veya köken bilgisi ayrıntıları istediğinizde `wiki search` kullanın.
Tek geniş paylaşımlı hatırlama geçişi için, etkin memory Plugin'i paylaşımlı aramayı sunuyorsa `openclaw memory search` tercih edin.

### `wiki get <lookup>`

Bir wiki sayfasını kimliğe veya göreli yola göre okuyun.

Örnekler:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Serbest biçimli sayfa cerrahisi olmadan dar mutasyonlar uygulayın.

Desteklenen akışlar şunları içerir:

- bir sentez sayfası oluşturma/güncelleme
- sayfa meta verilerini güncelleme
- kaynak kimlikleri ekleme
- sorular ekleme
- çelişkiler ekleme
- güven/durum güncelleme
- yapılandırılmış iddialar yazma

Bu komut, yönetilen blokları elle düzenlemeden wiki'nin güvenli şekilde gelişebilmesi için vardır.

### `wiki bridge import`

Etkin memory Plugin'inden genel memory yapıtlarını, köprü destekli kaynak sayfalarına içe aktarın.

Bunu, en son dışa aktarılan memory yapıtlarının wiki vault'una çekilmesini istediğinizde `bridge` modunda kullanın.

### `wiki unsafe-local import`

`unsafe-local` modunda açıkça yapılandırılmış yerel yollardan içe aktarın.

Bu, kasıtlı olarak deneyseldir ve yalnızca aynı makinede çalışır.

### `wiki obsidian ...`

Obsidian dostu modda çalışan vault'lar için Obsidian yardımcı komutları.

Alt komutlar:

- `status`
- `search`
- `open`
- `command`
- `daily`

Bunlar, `obsidian.useOfficialCli` etkin olduğunda `PATH` üzerinde resmi `obsidian` CLI gerektirir.

## Pratik kullanım rehberi

- Köken bilgisi ve sayfa kimliği önemli olduğunda `wiki search` + `wiki get` kullanın.
- Yönetilen üretilmiş bölümleri elle düzenlemek yerine `wiki apply` kullanın.
- Çelişkili veya düşük güvenli içeriğe güvenmeden önce `wiki lint` kullanın.
- Toplu içe aktarımlardan veya kaynak değişikliklerinden sonra panoların ve derlenmiş özetlerin hemen güncel olmasını istediğinizde `wiki compile` kullanın.
- Köprü modu yeni dışa aktarılan memory yapıtlarına bağlı olduğunda `wiki bridge import` kullanın.

## Yapılandırma bağlantıları

`openclaw wiki` davranışı şu alanlar tarafından şekillendirilir:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Tam yapılandırma modeli için [Memory Wiki Plugin'i](/tr/plugins/memory-wiki) bölümüne bakın.
