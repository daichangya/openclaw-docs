---
x-i18n:
    generated_at: "2026-04-25T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Tweakcn Özel Tema İçe Aktarma Tasarımı

Durum: 2026-04-22 tarihinde terminalde onaylandı

## Özet

Bir tweakcn paylaşım bağlantısından içe aktarılabilen, tam olarak bir adet tarayıcı-yerel özel Control UI tema yuvası ekleyin. Mevcut yerleşik tema aileleri `claw`, `knot` ve `dash` olarak kalır. Yeni `custom` ailesi normal bir OpenClaw tema ailesi gibi davranır ve içe aktarılan tweakcn yükü hem açık hem de koyu belirteç kümeleri içerdiğinde `light`, `dark` ve `system` modlarını destekler.

İçe aktarılan tema yalnızca mevcut tarayıcı profilinde, diğer Control UI ayarlarıyla birlikte saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar veya tarayıcılar arasında eşitlenmez.

## Sorun

Control UI tema sistemi şu anda üç sabit kodlanmış tema ailesiyle sınırlıdır:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Kullanıcılar yerleşik aileler ve mod varyantları arasında geçiş yapabilir, ancak repo CSS'ini düzenlemeden tweakcn'den bir tema getiremezler. İstenen sonuç genel bir tema sistemi kadar büyük değildir: üç yerleşik temayı koruyun ve bir tweakcn bağlantısından değiştirilebilen tek bir kullanıcı denetimli içe aktarılan yuva ekleyin.

## Hedefler

- Mevcut yerleşik tema ailelerini değiştirmeden korumak.
- Bir tema kitaplığı değil, tam olarak bir içe aktarılan özel yuva eklemek.
- Bir tweakcn paylaşım bağlantısını veya doğrudan `https://tweakcn.com/r/themes/{id}` URL'sini kabul etmek.
- İçe aktarılan temayı yalnızca tarayıcı yerel depolamasında kalıcı hale getirmek.
- İçe aktarılan yuvanın mevcut `light`, `dark` ve `system` mod denetimleriyle çalışmasını sağlamak.
- Hata davranışını güvenli tutmak: kötü bir içe aktarma etkin UI temasını asla bozmamalıdır.

## Hedef dışı konular

- Çoklu tema kitaplığı veya tarayıcı-yerel içe aktarma listesi yok.
- Gateway tarafında kalıcılık veya cihazlar arası eşitleme yok.
- Rastgele CSS düzenleyicisi veya ham tema JSON düzenleyicisi yok.
- tweakcn'den uzak yazı tipi varlıklarını otomatik yükleme yok.
- Yalnızca tek modu gösteren tweakcn yüklerini destekleme girişimi yok.
- Control UI için gereken seam'lerin ötesinde repo genelinde tema sistemi yeniden düzenlemesi yok.

## Zaten verilmiş kullanıcı kararları

- Üç yerleşik tema korunacak.
- tweakcn destekli tek bir içe aktarma yuvası eklenecek.
- İçe aktarılan tema Gateway yapılandırmasında değil, tarayıcıda saklanacak.
- İçe aktarılan tema için `light`, `dark` ve `system` desteklenecek.
- Bir sonraki içe aktarma ile özel yuvanın üzerine yazılması amaçlanan davranıştır.

## Önerilen yaklaşım

Control UI tema modeline dördüncü bir tema ailesi kimliği olarak `custom` ekleyin. `custom` ailesi yalnızca geçerli bir tweakcn içe aktarması mevcut olduğunda seçilebilir hale gelir. İçe aktarılan yük, OpenClaw'e özgü bir özel tema kaydına normalize edilir ve diğer UI ayarlarıyla birlikte tarayıcı yerel depolamasında saklanır.

Çalışma zamanında OpenClaw, çözümlenmiş özel CSS değişken bloklarını tanımlayan yönetilen bir `<style>` etiketi oluşturur:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Bu, özel tema değişkenlerini `custom` ailesiyle sınırlı tutar ve satır içi CSS değişkenlerinin yerleşik ailelere sızmasını önler.

## Mimari

### Tema modeli

`ui/src/ui/theme.ts` dosyasını güncelleyin:

- `ThemeName` türünü `custom` içerecek şekilde genişletin.
- `ResolvedTheme` türünü `custom` ve `custom-light` içerecek şekilde genişletin.
- `VALID_THEME_NAMES` değerini genişletin.
- `resolveTheme()` işlevini `custom` mevcut aile davranışını yansıtacak şekilde güncelleyin:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> OS tercihine göre `custom` veya `custom-light`

`custom` için eski takma adlar eklenmez.

### Kalıcılık modeli

`ui/src/ui/storage.ts` içindeki `UiSettings` kalıcılığını isteğe bağlı bir özel tema yüküyle genişletin:

- `customTheme?: ImportedCustomTheme`

Önerilen depolanan biçim:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Notlar:

- `sourceUrl`, normalleştirmeden sonra özgün kullanıcı girdisini saklar.
- `themeId`, URL'den çıkarılan tweakcn tema kimliğidir.
- `label`, varsa tweakcn `name` alanıdır, yoksa `Custom` kullanılır.
- `light` ve `dark`, ham tweakcn yükleri değil, zaten normalize edilmiş OpenClaw belirteç eşlemeleridir.
- İçe aktarılan yük, diğer tarayıcı-yerel ayarların yanında yaşar ve aynı yerel depolama belgesinde serileştirilir.
- Depolanan özel tema verisi yükleme sırasında eksik veya geçersizse, yükü yok sayın ve kalıcı aile `custom` ise `theme: "claw"` değerine geri dönün.

### Çalışma zamanı uygulaması

Control UI çalışma zamanında, `ui/src/ui/app-settings.ts` ve `ui/src/ui/theme.ts` yakınında sahiplenilen dar kapsamlı bir özel tema stil sayfası yöneticisi ekleyin.

Sorumluluklar:

- `document.head` içinde kararlı bir `<style id="openclaw-custom-theme">` etiketi oluşturmak veya güncellemek.
- Yalnızca geçerli bir özel tema yükü mevcut olduğunda CSS üretmek.
- Yük temizlendiğinde stil etiketi içeriğini kaldırmak.
- Yerleşik aile CSS'ini `ui/src/styles/base.css` içinde tutmak; içe aktarılan belirteçleri depodaki stil sayfasına eklememek.

Bu yönetici, ayarlar yüklendiğinde, kaydedildiğinde, içe aktarıldığında veya temizlendiğinde çalışır.

### Açık mod seçicileri

Uygulama, aileler arası açık mod stili için `custom-light` özel durumunu ele almak yerine `data-theme-mode="light"` tercih etmelidir. Mevcut bir seçici `data-theme="light"` değerine sabitlenmişse ve her açık aileye uygulanması gerekiyorsa, bu iş kapsamında genişletin.

## UX içe aktarma

`ui/src/ui/views/config.ts` içindeki `Appearance` bölümünü güncelleyin:

- `Claw`, `Knot` ve `Dash` yanına bir `Custom` tema kartı ekleyin.
- İçe aktarılmış özel tema yoksa kartı devre dışı gösterin.
- Tema ızgarasının altına şu öğeleri içeren bir içe aktarma paneli ekleyin:
  - bir tweakcn paylaşım bağlantısı veya `/r/themes/{id}` URL'si için bir metin girdisi
  - bir `Import` düğmesi
  - özel yük zaten varsa bir `Replace` yolu
  - özel yük zaten varsa bir `Clear` eylemi
- Yük varsa içe aktarılan tema etiketini ve kaynak ana bilgisayarını gösterin.
- Etkin tema `custom` ise, bir değiştirme içe aktarması hemen uygulanır.
- Etkin tema `custom` değilse, içe aktarma yalnızca yeni yükü kullanıcı `Custom` kartını seçene kadar saklar.

`ui/src/ui/views/config-quick.ts` içindeki hızlı ayarlar tema seçicisi de `Custom` öğesini yalnızca bir yük mevcut olduğunda göstermelidir.

## URL ayrıştırma ve uzak getirme

Tarayıcı içe aktarma yolu şunları kabul eder:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Uygulama her iki biçimi de şu biçime normalize etmelidir:

- `https://tweakcn.com/r/themes/{id}`

Tarayıcı daha sonra normalleştirilmiş `/r/themes/{id}` uç noktasını doğrudan getirir.

Harici yük için dar kapsamlı bir şema doğrulayıcı kullanın. Bu güvenilmeyen harici bir sınır olduğu için zod şeması tercih edilir.

Gerekli uzak alanlar:

- üst düzeyde isteğe bağlı dize olarak `name`
- isteğe bağlı nesne olarak `cssVars.theme`
- nesne olarak `cssVars.light`
- nesne olarak `cssVars.dark`

`cssVars.light` veya `cssVars.dark` eksikse içe aktarmayı reddedin. Bu bilinçli bir tercihtir: onaylanmış ürün davranışı, eksik tarafın en iyi çabayla sentezi değil, tam mod desteğidir.

## Belirteç eşleme

tweakcn değişkenlerini körü körüne yansıtmayın. Sınırlı bir alt kümeyi OpenClaw belirteçlerine normalize edin ve geri kalanını bir yardımcı içinde türetin.

### Doğrudan içe aktarılan belirteçler

Her tweakcn mod bloğundan:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Varsa paylaşılan `cssVars.theme` içinden:

- `font-sans`
- `font-mono`

Bir mod bloğu `font-sans`, `font-mono` veya `radius` değerini geçersiz kılıyorsa, mod-yerel değer kazanır.

### OpenClaw için türetilen belirteçler

İçe aktarıcı, içe aktarılan temel renklerden yalnızca OpenClaw'a ait değişkenleri türetir:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Türetme kuralları saf bir yardımcıda yaşar, böylece bağımsız olarak test edilebilirler. Tam renk karışım formülleri uygulama ayrıntısıdır, ancak yardımcı şu iki kısıtı karşılamalıdır:

- içe aktarılan tema niyetine yakın okunabilir kontrastı korumak
- aynı içe aktarılan yük için kararlı çıktı üretmek

### v1'de yok sayılan belirteçler

Bu tweakcn belirteçleri ilk sürümde bilinçli olarak yok sayılır:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Bu, kapsamı mevcut Control UI'nin gerçekten ihtiyaç duyduğu belirteçler üzerinde tutar.

### Yazı tipleri

Yazı tipi yığını dizeleri varsa içe aktarılır, ancak OpenClaw v1'de uzak yazı tipi varlıklarını yüklemez. İçe aktarılan yığın tarayıcıda kullanılamayan yazı tiplerine başvuruyorsa, normal geri dönüş davranışı uygulanır.

## Hata davranışı

Kötü içe aktarmalar kapalı şekilde başarısız olmalıdır.

- Geçersiz URL biçimi: satır içi doğrulama hatası göster, getirme yapma.
- Desteklenmeyen ana bilgisayar veya yol biçimi: satır içi doğrulama hatası göster, getirme yapma.
- Ağ hatası, OK olmayan yanıt veya bozuk JSON: satır içi hata göster, mevcut depolanan yükü dokunmadan koru.
- Şema hatası veya eksik açık/koyu bloklar: satır içi hata göster, mevcut depolanan yükü dokunmadan koru.
- Temizleme eylemi:
  - depolanan özel yükü kaldırır
  - yönetilen özel stil etiketi içeriğini kaldırır
  - `custom` etkinse tema ailesini `claw` değerine geri döndürür
- İlk yüklemede geçersiz depolanan özel yük:
  - depolanan yükü yok say
  - özel CSS üretme
  - kalıcı tema ailesi `custom` ise `claw` değerine geri dön

Başarısız bir içe aktarma hiçbir noktada etkin belgeyi kısmi özel CSS değişkenleri uygulanmış durumda bırakmamalıdır.

## Uygulamada değişmesi beklenen dosyalar

Birincil dosyalar:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Muhtemel yeni yardımcılar:

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

Testler:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL ayrıştırma ve yük normalleştirme için yeni odaklı testler

## Test

Asgari uygulama kapsamı:

- paylaşım bağlantısı URL'sini tweakcn tema kimliğine ayrıştırmak
- `/themes/{id}` ve `/r/themes/{id}` biçimlerini getirme URL'sine normalize etmek
- desteklenmeyen ana bilgisayarları ve bozuk kimlikleri reddetmek
- tweakcn yük biçimini doğrulamak
- geçerli bir tweakcn yükünü normalize edilmiş OpenClaw açık ve koyu belirteç eşlemelerine dönüştürmek
- özel yükü tarayıcı-yerel ayarlarda yüklemek ve kaydetmek
- `custom` temasını `light`, `dark` ve `system` için çözümlemek
- yük yokken `Custom` seçimini devre dışı bırakmak
- `custom` zaten etkin olduğunda içe aktarılan temayı hemen uygulamak
- etkin özel tema temizlendiğinde `claw` değerine geri dönmek

Elle doğrulama hedefi:

- Ayarlar'dan bilinen bir tweakcn temasını içe aktarmak
- `light`, `dark` ve `system` arasında geçiş yapmak
- `custom` ile yerleşik aileler arasında geçiş yapmak
- sayfayı yeniden yüklemek ve içe aktarılan özel temanın yerel olarak kalıcı olduğunu doğrulamak

## Yayın notları

Bu özellik bilinçli olarak küçüktür. Kullanıcılar daha sonra çoklu içe aktarılan temalar, yeniden adlandırma, dışa aktarma veya cihazlar arası eşitleme isterse, bunu sonraki bir tasarım olarak ele alın. Bu uygulamada önceden bir tema kitaplığı soyutlaması kurmayın.
