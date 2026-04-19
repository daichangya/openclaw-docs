---
read_when:
    - Yaygın kurulum, yükleme, ilk kullanım veya çalışma zamanı destek sorularını yanıtlama
    - Daha derin hata ayıklamadan önce kullanıcı tarafından bildirilen sorunları önceliklendirme
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-19T08:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f569fb0412797314a11c41a1bbfa14f5892d2d368544fa67800823a6457000e6
    source_path: help/faq.md
    workflow: 15
---

# SSS

Gerçek dünya kurulumları için hızlı yanıtlar ve daha derin sorun giderme (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model yedekleme). Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma başvurusu için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozuksa ilk 60 saniyede yapılacaklar

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: işletim sistemi + güncelleme, gateway/hizmet erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (gateway erişilebilirse).

2. **Paylaşılabilir rapor (güvenle paylaşılabilir)**

   ```bash
   openclaw status --all
   ```

   Günlük sonunu da içeren salt okunur teşhis (token'lar sansürlenmiştir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Supervisor çalışma zamanı ile RPC erişilebilirliğini, probe hedef URL’sini ve hizmetin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin probe'lar**

   ```bash
   openclaw status --deep
   ```

   Destekleniyorsa kanal probe'ları da dahil olmak üzere canlı bir gateway sağlık probe'u çalıştırır
   (erişilebilir bir gateway gerektirir). Bkz. [Sağlık](/tr/gateway/health).

5. **En son günlüğü canlı izle**

   ```bash
   openclaw logs --follow
   ```

   RPC çalışmıyorsa şuna geri dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; bkz. [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting).

6. **Doctor'ı çalıştırın (onarım)**

   ```bash
   openclaw doctor
   ```

   Yapılandırmayı/durumu onarır veya taşır + sağlık kontrolleri çalıştırır. Bkz. [Doctor](/tr/gateway/doctor).

7. **Gateway anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hata durumunda hedef URL’yi + yapılandırma yolunu gösterir
   ```

   Çalışan gateway’den tam bir anlık görüntü ister (yalnızca WS). Bkz. [Sağlık](/tr/gateway/health).

## Hızlı başlangıç ve ilk çalıştırma kurulumu

<AccordionGroup>
  <Accordion title="Takıldım, en hızlı şekilde nasıl kurtulurum?">
    Makinenizi **görebilen** yerel bir AI ajanı kullanın. Bu, Discord’da soru sormaktan çok daha etkilidir,
    çünkü “takıldım” vakalarının çoğu, uzaktaki yardımcıların inceleyemeyeceği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar depoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu düzeltmeye yardımcı olabilir (PATH, hizmetler, izinler, kimlik doğrulama dosyaları). Onlara
    hacklenebilir (git) kurulum üzerinden **tam kaynak checkout** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw’ı **bir git checkout’undan** kurar; böylece ajan kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git` olmadan
    yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: ajandan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), sonra yalnızca gerekli
    komutları çalıştırın. Bu, değişiklikleri küçük ve denetlenmesini daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen bir GitHub issue açın veya bir PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: gateway/ajan sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniyede yapılacaklar](#bir-şey-bozuksa-ilk-60-saniyede-yapılacaklar).
    Kurulum belgeleri: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış active-hours penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/başlık içeren iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz gelmemiş
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamen kapalı)

    Görev modunda, zaman damgaları yalnızca gerçek bir heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw’ı kurmanın ve ayarlamanın önerilen yolu">
    Depo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak oluşturabilir. Onboarding’den sonra genellikle Gateway’i **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding’den sonra panoyu nasıl açarım?">
    Sihirbaz, onboarding’den hemen sonra tarayıcınızı temiz (token içermeyen) bir pano URL’siyle açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmadıysa aynı makinede yazdırılan URL’yi kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Panoda localhost ile uzak bağlantıda kimlik doğrulamayı nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost değilse:**

    - **Tailscale Serve** (önerilir): bind'i loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` açın. `gateway.auth.allowTailscale` `true` ise, kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (paylaşılan gizli anahtarı yapıştırmak gerekmez, güvenilir gateway host varsayılır); HTTP API’leri ise özel olarak private-ingress `none` veya trusted-proxy HTTP auth kullanmadığınız sürece yine paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden eşzamanlı hatalı Serve kimlik doğrulama girişimleri, başarısız kimlik doğrulama sınırlayıcısı kaydetmeden önce serileştirilir; bu yüzden ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` açın, ardından pano ayarlarına eşleşen paylaşılan gizli anahtarı yapıştırın.
    - **Kimlik farkındalıklı reverse proxy**: Gateway’i loopback olmayan güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL’sini açın.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` açın. Tünel üzerinden de paylaşılan gizli anahtar kimlik doğrulaması geçerlidir; istenirse yapılandırılmış token veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Pano](/web/dashboard) ve [Web yüzeyleri](/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec approval yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Ana makine exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca
    onay istemlerinin nerede görüneceğini ve insanların nasıl yanıt verebileceğini kontrol eder.

    Çoğu kurulumda **ikisinin birden** gerekli olması beklenmez:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbette `/approve` ortak yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayıcıları güvenli biçimde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarsız veya `"auto"` olduğunda DM-first yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda, birincil yol o yerel UI’dır; ajan yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylüyorsa manuel `/approve` komutunu eklemelidir.
    - İstemlerin ayrıca başka sohbetlere veya belirli operasyon odalarına iletilmesi gerekiyorsa yalnızca `approvals.exec` kullanın.
    - Yalnızca onay istemlerinin kaynak oda/konuya geri gönderilmesini açıkça istiyorsanız `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları ayrıca ayrıdır: varsayılan olarak aynı sohbette `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar bunun üstünde yerel plugin-onayı işleme davranışını sürdürür.

    Kısacası: iletme yönlendirme içindir, yerel istemci yapılandırması ise daha zengin kanala özgü UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Gateway için Bun **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    disk alanının yeterli olduğu belirtilir; ayrıca bir **Raspberry Pi 4’ün çalıştırabileceği** de not edilir.

    Ek pay bırakmak isterseniz (günlükler, medya, diğer hizmetler), **2GB önerilir**, ancak bu
    katı bir alt sınır değildir.

    İpucu: küçük bir Pi/VPS Gateway’i barındırabilir ve yerel ekran/kamera/canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **node** eşleyebilirsiniz. Bkz. [Node'lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipuçları var mı?">
    Kısaca: çalışır, ama pürüzler bekleyin.

    - **64-bit** bir işletim sistemi kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/Skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Garip ikili dosya sorunları yaşarsanız, bu genellikle bir **ARM uyumluluk** problemidir.

    Belgeler: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="wake up my friend ekranında takılıyor / onboarding başlamıyor. Şimdi ne olacak?">
    Bu ekran, Gateway’in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca
    ilk açılışta otomatik olarak “Wake up, my friend!” gönderir. Bu satırı **yanıt olmadan**
    görüyorsanız ve token'lar 0’da kalıyorsa, ajan hiç çalışmamış demektir.

    1. Gateway’i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durumu + kimlik doğrulamayı kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa, tünel/Tailscale bağlantısının açık olduğundan ve UI’ın
    doğru Gateway’e işaret ettiğinden emin olun. Bkz. [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumu yeni bir makineye (Mac mini) onboarding’i yeniden yapmadan taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor’ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu “tam olarak aynı” (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) şekilde korur:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) dizinini kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway hizmetini yeniden başlatın.

    Bu, yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Eğer
    uzak moddaysanız, oturum deposu ve çalışma alanının sahibi gateway host olduğunu unutmayın.

    **Önemli:** çalışma alanınızı yalnızca GitHub’a commit/push ederseniz,
    **bellek + önyükleme dosyalarını** yedeklemiş olursunuz, ancak **oturum geçmişini veya kimlik doğrulamayı** değil. Bunlar
    `~/.openclaw/` altında bulunur (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Disk üzerinde dosyaların bulunduğu yer](#disk-üzerinde-dosyalarin-bulundugu-yer),
    [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog’una bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. En üst bölüm **Unreleased** olarak işaretliyse, sonraki tarihli
    bölüm yayımlanmış en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** başlıkları altında gruplanır (gerektiğinde belgeler/diğer bölümler de eklenir).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity
    Advanced Security üzerinden `docs.openclaw.ai` adresini hatalı biçimde engelliyor. Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini izin listesine ekleyin, sonra tekrar deneyin.
    Engelini kaldırmamıza yardımcı olmak için lütfen burada bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız, belgeler GitHub üzerinde yansılanmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Stable ve beta arasındaki fark">
    **Stable** ve **beta**, ayrı kod hatları değil, **npm dist-tag** değerleridir:

    - `latest` = stable
    - `beta` = test için erken derleme

    Genellikle stable bir sürüm önce **beta** üzerinde yayımlanır, sonra açık bir
    terfi adımı aynı sürümü `latest` konumuna taşır. Gerektiğinde maintainers ayrıca
    doğrudan `latest` konumuna da yayımlayabilir. Bu yüzden terfiden sonra beta ve stable
    **aynı sürüme** işaret edebilir.

    Neyin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlıkları ve beta ile dev arasındaki fark için aşağıdaki accordion’a bakın.

  </Accordion>

  <Accordion title="Beta sürümü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta`’dır (`latest` ile terfiden sonra eşleşebilir).
    **Dev**, `main` dalının hareketli ucudur (git); yayımlandığında npm dist-tag `dev` kullanır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyicisi (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Geliştirme kanalları](/tr/install/development-channels) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="En son parçaları nasıl denerim?">
    İki seçenek:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, sizi `main` dalına geçirir ve kaynaktan günceller.

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir depo verir, sonra git ile güncelleyebilirsiniz.

    Temiz bir clone’u elle tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelleme](/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve onboarding genelde ne kadar sürer?">
    Kabaca rehber:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılı kalırsa [Yükleyici takıldı](#quick-start-and-first-run-setup)
    ve [Takıldım](#quick-start-and-first-run-setup) içindeki hızlı hata ayıklama döngüsünü kullanın.

  </Accordion>

  <Accordion title="Yükleyici takıldı mı? Nasıl daha fazla geri bildirim alırım?">
    Yükleyiciyi **ayrıntılı çıktı** ile yeniden çalıştırın:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Ayrıntılı beta kurulumu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Hacklenebilir (git) kurulum için:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) eşdeğeri:

    ```powershell
    # install.ps1 için henüz özel bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumu git bulunamadı veya openclaw tanınmıyor diyor">
    İki yaygın Windows sorunu:

    **1) npm hata spawn git / git bulunamadı**

    - **Git for Windows** kurun ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell’i kapatıp yeniden açın, ardından yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH’inize ekleyin (Windows’ta `\bin` soneki gerekmez; çoğu sistemde bu `%AppData%\npm` olur).
    - PATH’i güncelledikten sonra PowerShell’i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu için yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısında bozuk Çince metin görünüyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında konsol kod sayfası uyuşmazlığıdır.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi mojibake olarak gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell’de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sonra Gateway’i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw sürümünde hâlâ yeniden üretebiliyorsanız, burada takip edin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler soruma yanıt vermedi - nasıl daha iyi bir yanıt alırım?">
    **Hacklenebilir (git) kurulumu** kullanın; böylece tam kaynak ve belgeler yerelde elinizde olur, sonra
    botunuza (veya Claude/Codex’e) _o klasörün içinden_ sorun; böylece depoyu okuyup tam isabetli yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw’ı Linux’a nasıl kurarım?">
    Kısa yanıt: Linux rehberini izleyin, ardından onboarding çalıştırın.

    - Linux hızlı yol + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım rehber: [Başlangıç](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw’ı bir VPS’e nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway’e erişmek için SSH/Tailscale kullanın.

    Rehberler: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum rehberleri nerede?">
    Yaygın sağlayıcıları içeren bir **barındırma merkezi** tutuyoruz. Birini seçin ve rehberi izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta nasıl çalışır: **Gateway sunucuda çalışır**, siz de ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) ile erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu yüzden host’u doğruluk kaynağı olarak görün ve yedekleyin.

    Yerel ekran/kamera/canvas erişimi sağlamak veya Gateway’i bulutta tutarken
    dizüstü bilgisayarınızda komut çalıştırmak için bu bulut Gateway ile **node**’ları (Mac/iOS/Android/headless)
    eşleyebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzak erişim: [Gateway remote](/tr/gateway/remote).
    Node'lar: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw’dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, ancak önerilmez**. Güncelleme akışı
    Gateway’i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak kabuktan çalıştırmaktır.

    CLI’yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir ajandan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelleme](/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** size şunları adım adım sunar:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + önyükleme dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketli kanal Plugin'leri)
    - **Daemon kurulumu** (macOS’ta LaunchAgent; Linux/WSL2’de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırdığınız model bilinmiyorsa veya kimlik doğrulama eksikse uyarı verir.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw’ı **API anahtarları** (Anthropic/OpenAI/diğerleri) ile veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamanın isteğe bağlı yollarıdır.

    OpenClaw içinde Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw içinde Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bize bu kullanımın yeniden izinli olduğunu söyledi ve Anthropic yeni bir
      politika yayımlamadığı sürece OpenClaw bu entegrasyon için `claude -p`
      kullanımını onaylı kabul ediyor

    Uzun ömürlü gateway host’ları için Anthropic API anahtarları hâlâ daha
    öngörülebilir bir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenmektedir.

    OpenClaw ayrıca diğer barındırılan abonelik tarzı seçenekleri de destekler; bunlar arasında
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** bulunur.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle
    Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumu istiyorsanız, bunun yerine bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic çalışanları bize bu kullanımın yeniden izinli olduğunu söyledi; bu yüzden OpenClaw,
    Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için
    Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.

    Anthropic setup-token hâlâ desteklenen bir OpenClaw token yolu olarak kullanılabilir, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için, Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw içinde abonelik tarzında barındırılan diğer
    seçenekleri görmek isterseniz [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm) bölümlerine bakın.

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
Bu, mevcut pencere için **Anthropic kota/hız sınırınızın** tükendiği anlamına gelir. Eğer
**Claude CLI** kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. Eğer
bir **Anthropic API anahtarı** kullanıyorsanız, Anthropic Console
üzerinden kullanım/faturalandırmayı kontrol edin ve gerekirse limitleri artırın.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M context beta özelliğini (`context1m: true`) kullanmaya çalışıyor demektir. Bu yalnızca
    kimlik bilgileriniz uzun bağlam faturalandırması için uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkin olan OpenClaw Claude-login yolu).

    İpucu: bir sağlayıcı hız sınırına takıldığında OpenClaw’ın yanıt vermeye devam edebilmesi için bir **yedek model** ayarlayın.
    Bkz. [Models](/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketli bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretçileri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedip bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi takdirde `plugins.entries.amazon-bedrock.config.discovery.enabled` seçeneğini açıkça etkinleştirebilir veya elle bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen anahtar akışını tercih ediyorsanız, Bedrock önünde bir OpenAI uyumlu proxy kullanmak da geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, **OpenAI Code (Codex)** desteğini OAuth (ChatGPT oturum açma) üzerinden sunar. Onboarding OAuth akışını çalıştırabilir ve uygun olduğunda varsayılan modeli `openai-codex/gpt-5.4` olarak ayarlar. Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="ChatGPT GPT-5.4 neden OpenClaw içinde openai/gpt-5.4 kilidini açmıyor?">
    OpenClaw bu iki yolu ayrı değerlendirir:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = doğrudan OpenAI Platform API

    OpenClaw içinde ChatGPT/Codex oturum açma, doğrudan `openai/*` yoluna değil,
    `openai-codex/*` yoluna bağlanır. OpenClaw içinde doğrudan API yolunu
    istiyorsanız `OPENAI_API_KEY` ayarlayın (veya eşdeğer OpenAI sağlayıcı yapılandırmasını).
    OpenClaw içinde ChatGPT/Codex oturum açmayı istiyorsanız `openai-codex/*` kullanın.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web'den farklı olabilir?">
    `openai-codex/*`, Codex OAuth yolunu kullanır ve kullanılabilir kota pencereleri
    OpenAI tarafından yönetilir ve plana bağlıdır. Pratikte bu limitler,
    ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulama deneyiminden farklı olabilir.

    OpenClaw, o anda görünür sağlayıcı kullanımını/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    yetkilerini doğrudan API erişimine dönüştürmez veya normalize etmez. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına
    açıkça izin vermektedir. Onboarding bu OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde istemci kimliği veya gizli anahtar değil,
    bir **Plugin auth flow** kullanır.

    Adımlar:

    1. `gemini` komutu `PATH` üzerinde olacak şekilde Gemini CLI’yi yerelde kurun
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Girişten sonra varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa gateway host üzerinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token'larını gateway host üzerindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Sıradan sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Mecbursanız, yerelde çalıştırabildiğiniz **en büyük** model derlemesini (LM Studio) kullanın ve [/gateway/local-models](/tr/gateway/local-models) bölümüne bakın. Daha küçük/kuantize modeller prompt injection riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD’de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD’de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya uyarken yedek modellerin de kullanılabilir kalması için `models.mode: "merge"` kullanarak Anthropic/OpenAI’yi bunlarla birlikte yine listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    her zaman açık bir host olarak bir tane alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da iş görür.

    Yalnızca **macOS’e özel araçlar** için Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux’ta veya başka bir yerde çalışabilir. Diğer macOS’e özel araçları istiyorsanız Gateway’i bir Mac üzerinde çalıştırın veya bir macOS node eşleyin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages’a giriş yapmış **bir tür macOS cihazına** ihtiyacınız var. Bunun mutlaka Mac mini olması gerekmez -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux’ta veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway’i Linux/VPS üzerinde çalıştırın, BlueBubbles sunucusunu ise Messages’a giriş yapılmış herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini alırsam, onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway’i çalıştırabilir**, MacBook Pro’nuz ise bir
    **node** (yardımcı cihaz) olarak bağlanabilir. Node'lar Gateway’i çalıştırmaz -
    o cihazda ekran/kamera/canvas ve `system.run` gibi ek
    yetenekler sağlarlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir node host çalıştırır ve Gateway ile eşleşir.
    - Görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram’da çalışma zamanı hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız bunu
    WhatsApp/Telegram olmayan üretim dışı bir gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girilir?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Onboarding `@username` girdisini kabul eder ve bunu sayısal kimliğe çözer, ancak OpenClaw yetkilendirmesi yalnızca sayısal kimlikler kullanır.

    Daha güvenli (üçüncü taraf bot olmadan):

    - Botunuza DM gönderin, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API:

    - Botunuza DM gönderin, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağırın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az gizli):

    - `@userinfobot` veya `@getidsbot`’a DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bir WhatsApp numarasını farklı OpenClaw örnekleriyle birden fazla kişi kullanabilir mi?">
    Evet, **çoklu ajan yönlendirme** ile. Her gönderenin WhatsApp **DM**’ini (`kind: "direct"` eşi, gönderen E.164 örneği `+15551234567`) farklı bir `agentId`’ye bağlayın; böylece her kişi kendi çalışma alanını ve oturum deposunu alır. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) her WhatsApp hesabı için genel olur. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" ajanı ve "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çoklu ajan yönlendirme kullanın: her ajana kendi varsayılan modelini verin, sonra gelen rotaları (sağlayıcı hesabı veya belirli eşler) her ajana bağlayın. Örnek yapılandırma [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) bölümünde bulunur. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew, Linux’u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw’ı systemd üzerinden çalıştırıyorsanız, hizmet PATH’inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekiniz) içermesini sağlayın; böylece `brew` ile kurulan araçlar oturum açılmayan kabuklarda çözümlenebilir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini (`~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin` gibi) başa ekler ve ayarlıysa `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm install arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerelde çalıştırırsınız ve kodu/belgeleri yamalayabilirsiniz.
    - **npm install:** global CLI kurulumu, depo yok, “çalıştır gitsin” yaklaşımı için en iyisi.
      Güncellemeler npm dist-tag’lerinden gelir.

    Belgeler: [Başlangıç](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. Diğer kurulum türünü yükleyin, sonra gateway hizmeti yeni giriş noktasını işaret etsin diye Doctor’ı çalıştırın.
    Bu işlem **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir. Durumunuz
    (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm’den git’e:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git’ten npm’e:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor, gateway hizmeti giriş noktası uyuşmazlığını algılar ve hizmet yapılandırmasını mevcut kuruluma uyacak şekilde yeniden yazmayı önerir (otomasyonda `--repair` kullanın).

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway’i dizüstü bilgisayarımda mı yoksa bir VPS’te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız bir VPS kullanın**. En düşük sürtünmeyi istiyorsanız
    ve uyku/yeniden başlatmalar sizin için sorun değilse, yerelde çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmalar kesinti yaratır, cihazın uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksileri:** genelde headless çalışır (ekran görüntüsü kullanın), yalnızca uzak dosya erişimi vardır, güncellemeler için SSH gerekir.

    **OpenClaw’e özel not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS üzerinde gayet iyi çalışır. Tek gerçek ödünleşim **headless tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac’i aktif olarak kullanıyorsanız ve yerel dosya erişimi veya görünür tarayıcıyla UI otomasyonu istiyorsanız yerel kurulum harikadır.

  </Accordion>

  <Accordion title="OpenClaw’ı özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değil, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Özel host (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutmak daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın en iyisini istiyorsanız Gateway’i özel bir host üzerinde tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **node** olarak eşleyin. Bkz. [Node'lar](/tr/nodes).
    Güvenlik rehberi için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** pay bırakmak için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden fazla kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** kullanın (veya modern bir Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw’ı bir sanal makinede çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir sanal makineyi VPS gibi değerlendirin: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz tüm kanallar için yeterli RAM’e sahip olmalıdır.

    Temel rehber:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden fazla kanal, tarayıcı otomasyonu veya medya araçları kullanıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay sanal makine tarzı kurulumdur** ve en iyi araç
    uyumluluğunu sunar. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS’i bir sanal makinede çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="OpenClaw tek paragrafta nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistandır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketli kanal Plugin'leri) yanıt verir; ayrıca desteklenen platformlarda ses + canlı Canvas da sunabilir. **Gateway** her zaman açık kontrol düzlemidir; ürün ise asistanın kendisidir.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw, “yalnızca bir Claude sarmalayıcısı” değildir. **Yerel öncelikli bir kontrol düzlemidir** ve
    yetenekli bir asistanı **kendi donanımınız üzerinde**, zaten kullandığınız sohbet uygulamaları üzerinden erişilebilir şekilde,
    durumlu oturumlar, bellek ve araçlarla çalıştırmanıza olanak tanır - iş akışlarınızın kontrolünü barındırılan bir
    SaaS’e teslim etmeden.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway’i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanı + oturum geçmişini yerelde tutun.
    - **Web sandbox’ı değil, gerçek kanallar:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; ajan başına yönlendirme
      ve yedekleme ile.
    - **Yalnızca yerel seçenek:** isterseniz yerel modeller çalıştırın; böylece **tüm veriler cihazınızda kalabilir**.
    - **Çoklu ajan yönlendirme:** kanal, hesap veya görev başına ayrı ajanlar; her birinin kendi
      çalışma alanı ve varsayılanları vardır.
    - **Açık kaynak ve hacklenebilir:** satıcıya bağımlı kalmadan inceleyin, genişletin ve kendi kendinize barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - ilk olarak ne yapmalıyım?">
    İyi ilk projeler:

    - Web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Mobil uygulama prototipi hazırlayın (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizlik, adlandırma, etiketleme).
    - Gmail’i bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri de halledebilir, ancak bunları aşamalara böldüğünüzde ve
    paralel çalışma için alt ajanlar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için en yaygın ilk beş günlük kullanım senaryosu nedir?">
    Günlük kazançlar genelde şöyle görünür:

    - **Kişisel brifingler:** gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** hızlı araştırma, özetler ve e-posta veya belgeler için ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** Cron veya Heartbeat odaklı dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** form doldurma, veri toplama ve tekrar eden web görevleri.
    - **Cihazlar arası koordinasyon:** telefonunuzdan görev gönderin, Gateway bunu bir sunucuda çalıştırsın ve sonuç size sohbette geri gelsin.

  </Accordion>

  <Accordion title="OpenClaw bir SaaS için lead generation, outreach, reklamlar ve bloglarda yardımcı olabilir mi?">
    Evet, **araştırma, nitelendirme ve taslak hazırlama** için. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach veya reklam metni taslakları yazabilir.

    **Outreach veya reklam çalıştırmaları** için insanı döngüde tutun. Spam’den kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli desen,
    OpenClaw’ın taslak hazırlaması ve sizin onay vermenizdir.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme açısından Claude Code’a göre avantajları nelerdir?">
    OpenClaw, bir IDE yerine **kişisel bir asistan** ve koordinasyon katmanıdır. Bir depo içinde en hızlı doğrudan kodlama döngüsü için
    Claude Code veya Codex kullanın. Kalıcı bellek, cihazlar arası erişim ve araç orkestrasyonu istediğinizde
    OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (tarayıcı, dosyalar, planlama, hook'lar)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşime geçin)
    - Yerel tarayıcı/ekran/kamera/exec için **Node'lar**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Depoyu kirli tutmadan Skills’i nasıl özelleştiririm?">
    Depodaki kopyayı düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketli → `skills.load.extraDirs` şeklindedir; böylece yönetilen geçersiz kılmalar git’e dokunmadan paketli Skills’in önüne geçer. Skill genel olarak kurulu olsun ama yalnızca bazı ajanlarda görünür olsun istiyorsanız, paylaşılan kopyayı `~/.openclaw/skills` içinde tutun ve görünürlüğü `agents.defaults.skills` ile `agents.list[].skills` üzerinden kontrol edin. Yalnızca upstream’e uygun düzenlemeler depoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills’i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` ile ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketli → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar ve OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak değerlendirir. Skill yalnızca belirli ajanlarda görünür olmalıysa bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen desenler şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: mevcut oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    Bkz. [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl dışarı aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    bir özet döndürür ve ana sohbetinizin yanıt verebilir kalmasını sağlar.

    Botunuza “bu görev için bir alt ajan oluştur” deyin veya `/subagents` kullanın.
    Gateway’in şu anda ne yaptığını (ve meşgul olup olmadığını) görmek için sohbette `/status` kullanın.

    Token ipucu: uzun görevler ve alt ajanlar da token tüketir. Maliyet sizin için önemliyse,
    `agents.defaults.subagents.model` ile alt ajanlar için daha ucuz bir model ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord’da iş parçacığına bağlı subagent oturumları nasıl çalışır?">
    İş parçacığı bağlamalarını kullanın. Bir Discord iş parçacığını bir subagent’a veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları o bağlı oturumda kalır.

    Temel akış:

    - `sessions_spawn` ile `thread: true` kullanarak başlatın (ve kalıcı takip için isteğe bağlı olarak `mode: "session"` ekleyin).
    - Veya elle `/focus <target>` ile bağlayın.
    - Bağlama durumunu incelemek için `/agents` kullanın.
    - Otomatik odağı kaldırmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Global varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Oluşturma sırasında otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir alt ajan tamamlandı, ancak tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenmiş istekçi rotasını kontrol edin:

    - Tamamlanma modu alt ajan teslimi, varsa herhangi bir bağlı iş parçacığı veya konuşma rotasını tercih eder.
    - Tamamlanma kaynağı yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimin yine de başarılı olabilmesi için istekçi oturumunun saklanan rotasına (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir rota ne de kullanılabilir bir saklanan rota varsa, doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruklu oturum teslimine geri düşer.
    - Geçersiz veya bayat hedefler yine kuyruk geri düşüşünü veya son teslim başarısızlığını zorlayabilir.
    - Alt öğenin son görünür assistant yanıtı tam olarak sessiz token `NO_REPLY` / `no_reply` ise veya tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski ilerlemeyi göndermek yerine duyuruyu kasıtlı olarak bastırır.
    - Alt öğe yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını yeniden oynatmak yerine bunu kısa bir kısmi ilerleme özetine indirgeyebilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt ajanlar](/tr/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar tetiklenmiyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway sürekli çalışmıyorsa,
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron’un etkin olduğunu doğrulayın (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlı olmasın.
    - Gateway’in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma olmadan).
    - İş için saat dilimi ayarlarını doğrulayın (`--tz` ile host saat dilimi karşılaştırması).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi, ama kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` demek, harici mesaj beklenmediği anlamına gelir.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`), çalıştırıcının dışa teslimi atladığı anlamına gelir.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`), çalıştırıcının teslim etmeyi denediğini ancak kimlik bilgilerinin bunu engellediğini gösterir.
    - Sessiz bir yalıtılmış sonuç (`NO_REPLY` / `no_reply` yalnızca) kasıtlı olarak teslim edilemez kabul edilir; bu yüzden çalıştırıcı kuyruk geri düşüşü teslimini de bastırır.

    Yalıtılmış cron işleri için son teslimin sahibi çalıştırıcıdır. Ajanın,
    çalıştırıcının göndermesi için düz metin bir özet döndürmesi beklenir. `--no-deliver`,
    bu sonucu içeride tutar; bunun yerine ajanın mesaj aracıyla doğrudan göndermesine
    izin vermez.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir cron çalıştırması neden modelleri değiştirdi veya bir kez yeniden denedi?">
    Bu genelde yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış cron, etkin çalıştırma
    `LiveSessionModelSwitchError` fırlattığında çalışma zamanı model devrini kalıcılaştırabilir ve yeniden deneyebilir. Yeniden deneme değiştirilen
    sağlayıcıyı/modeli korur; geçiş yeni bir auth profile geçersiz kılması taşıdıysa cron,
    yeniden denemeden önce bunu da kalıcılaştırır.

    İlgili seçim kuralları:

    - Uygun olduğunda önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklanan herhangi bir cron oturumu model geçersiz kılması.
    - Sonra normal ajan/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk deneme artı 2 değiştirme yeniden denemesinden sonra
    cron sonsuza kadar döngüye girmek yerine durdurur.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl kurarım?">
    Yerel `openclaw skills` komutlarını kullanın veya Skills’i çalışma alanınıza bırakın. macOS Skills UI Linux’ta yoktur.
    Skills’e [https://clawhub.ai](https://clawhub.ai) adresinden göz atın.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Yerel `openclaw skills install`, etkin çalışma alanındaki `skills/`
    dizinine yazar. Ayrı `clawhub` CLI’yı yalnızca kendi Skills’inizi yayımlamak veya
    eşitlemek istiyorsanız kurun. Ajanlar arasında paylaşılan kurulumlar için Skill’i
    `~/.openclaw/skills` altına koyun ve hangi ajanların bunu görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya
    `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri zamanlı veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalardan sonra da kalır).
    - “Ana oturum” periyodik kontrolleri için **Heartbeat**.
    - Özetler gönderen veya sohbetlere teslim eden otonom ajanlar için **yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux'tan Apple macOS-only Skills çalıştırabilir miyim?">
    Doğrudan hayır. macOS Skills, `metadata.openclaw.os` ve gerekli ikili dosyalarla sınırlandırılır ve Skills yalnızca **Gateway host** üzerinde uygun olduklarında sistem isteminde görünür. Linux’ta `darwin`-only Skills (`apple-notes`, `apple-reminders`, `things-mac` gibi), bu sınırlandırmayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç desen vardır:

    **Seçenek A - Gateway’i bir Mac üzerinde çalıştırın (en basiti).**
    Gerekli macOS ikili dosyalarının bulunduğu yerde Gateway’i çalıştırın, sonra Linux’tan [uzak modda](#gateway-ports-already-running-and-remote-mode) veya Tailscale üzerinden bağlanın. Skills normal şekilde yüklenir çünkü Gateway host macOS’tur.

    **Seçenek B - bir macOS node kullanın (SSH yok).**
    Gateway’i Linux’ta çalıştırın, bir macOS node (menü çubuğu uygulaması) eşleyin ve Mac üzerinde **Node Run Commands** ayarını “Always Ask” veya “Always Allow” yapın. Gerekli ikili dosyalar node üzerinde mevcut olduğunda OpenClaw, macOS-only Skills’i uygun kabul edebilir. Ajan bu Skills’i `nodes` aracıyla çalıştırır. “Always Ask” seçerseniz, istemde “Always Allow” onayı vermek o komutu izin listesine ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden proxy'leyin (ileri seviye).**
    Gateway’i Linux’ta tutun, ancak gerekli CLI ikili dosyalarının bir Mac üzerinde çalışan SSH sarmalayıcılarına çözülmesini sağlayın. Sonra Skill’i Linux’a izin verecek şekilde geçersiz kılın; böylece uygun kalır.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux host üzerinde `PATH` içine koyun (örneğin `~/bin/memo`).
    3. Skill metadata’sını (çalışma alanı veya `~/.openclaw/skills`) Linux’a izin verecek şekilde geçersiz kılın:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsü yenilensin diye yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Bugün yerleşik değil.

    Seçenekler:

    - **Özel Skill / Plugin:** güvenilir API erişimi için en iyisi (Notion ve HeyGen’in ikisinin de API’si vardır).
    - **Tarayıcı otomasyonu:** kod gerektirmez ama daha yavaş ve daha kırılgandır.

    Bağlamı istemci başına korumak istiyorsanız (ajans iş akışları), basit bir desen şudur:

    - İstemci başına bir Notion sayfası (bağlam + tercihler + aktif iş).
    - Ajandan oturum başında o sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, o API’leri hedefleyen bir özellik isteği açın veya bir Skill
    geliştirin.

    Skills kurun:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanındaki `skills/` dizinine gider. Ajanlar arasında paylaşılan Skills için bunları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan kurulumu yalnızca bazı ajanlar görecekse `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı Skills, Homebrew ile kurulan ikili dosyalar bekler; Linux’ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). Bkz. [Skills](/tr/tools/skills), [Skills yapılandırması](/tr/tools/skills-config) ve [ClawHub](/tr/tools/clawhub).

  </Accordion>

  <Accordion title="Mevcut oturum açılmış Chrome'umu OpenClaw ile nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` tarayıcı profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol host-yereldir. Gateway başka bir yerde çalışıyorsa, tarayıcı makinesinde bir node host çalıştırın veya bunun yerine uzak CDP kullanın.

    `existing-session` / `user` için mevcut sınırlamalar:

    - eylemler CSS seçici değil, ref odaklıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda yalnızca bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu eylemler hâlâ yönetilen bir tarayıcıya veya ham CDP profiline ihtiyaç duyar

  </Accordion>
</AccordionGroup>

## Sandboxing ve bellek

<AccordionGroup>
  <Accordion title="Özel bir sandboxing belgesi var mı?">
    Evet. Bkz. [Sandboxing](/tr/gateway/sandboxing). Docker’a özgü kurulum için (Docker içinde tam gateway veya sandbox imajları), bkz. [Docker](/tr/install/docker).
  </Accordion>

  <Accordion title="Docker kısıtlı hissettiriyor - tüm özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır; bu yüzden
    sistem paketleri, Homebrew veya paketli tarayıcılar içermez. Daha tam bir kurulum için:

    - Önbellekler kalıcı olsun diye `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcılaştırın.
    - Sistem bağımlılıklarını `OPENCLAW_DOCKER_APT_PACKAGES` ile imaja gömün.
    - Playwright tarayıcılarını paketli CLI ile kurun:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları herkese açık/sandbox içinde tek bir ajanla yapabilir miyim?">
    Evet - özel trafiğiniz **DM'ler** ve herkese açık trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (ana olmayan anahtarlar) Docker içinde çalışır, ana DM oturumu ise host üzerinde kalır. Sonra sandbox içindeki oturumlarda hangi araçların kullanılabildiğini `tools.sandbox.tools` ile kısıtlayın.

    Kurulum anlatımı + örnek yapılandırma: [Gruplar: kişisel DM'ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ana yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Bir host klasörünü sandbox içine nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (ör. `"/home/user/src:/src:ro"`). Global + ajan başına bağlamalar birleşir; ajan başına bağlamalar `scope: "shared"` olduğunda yok sayılır. Hassas olan her şey için `:ro` kullanın ve bağlamaların sandbox dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw, bind kaynaklarını hem normalize edilmiş yola hem de en derin mevcut üst dizin üzerinden çözümlenen kanonik yola karşı doğrular. Bu, son yol segmenti henüz mevcut değilken bile symlink-ebeveyn kaçışlarının güvenli biçimde başarısız olması ve izin verilen kök denetimlerinin symlink çözümlemesinden sonra da uygulanması anlamına gelir.

    Örnekler ve güvenlik notları için [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, ajan çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca modele
    otomatik Compaction öncesinde kalıcı notlar yazmasını hatırlatmak için **sessiz bir pre-compaction bellek flush** çalıştırır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox'lar bunu atlar). Bkz. [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Bellek sürekli bir şeyleri unutuyor. Bunu nasıl kalıcı yaparım?">
    Bota **gerçeği belleğe yazmasını** söyleyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam ise `memory/YYYY-MM-DD.md` içine gider.

    Bu hâlâ geliştirmekte olduğumuz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Hâlâ unutuyorsa Gateway’in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nelerdir?">
    Bellek dosyaları diskte yaşar ve siz silene kadar kalır. Sınır,
    model değil depolamanızdır. **Oturum bağlamı** ise yine model
    bağlam penceresiyle sınırlıdır; bu yüzden uzun konuşmalar sıkıştırılabilir veya kırpılabilir. Bu nedenle
    bellek araması vardır - yalnızca ilgili parçaları yeniden bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekir mi?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlama işlemlerini kapsar ve
    embeddings erişimi vermez, bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI girişi)** anlamsal bellek aramasında yardımcı olmaz. OpenAI embeddings
    için hâlâ gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Açıkça bir sağlayıcı ayarlamazsanız OpenClaw, bir API anahtarını
    çözümleyebildiğinde otomatik olarak sağlayıcı seçer (auth profiles, `models.providers.*.apiKey` veya ortam değişkenleri).
    OpenAI anahtarı çözülürse OpenAI’yi, aksi durumda Gemini anahtarı
    çözülürse Gemini’yi, sonra Voyage’ı, sonra Mistral’ı tercih eder. Uzak anahtar yoksa bellek
    araması siz yapılandırana kadar devre dışı kalır. Yerel bir model yolu
    yapılandırılmış ve mevcutsa OpenClaw
    `local`’ı tercih eder. Ollama, siz açıkça
    `memorySearch.provider = "ollama"` ayarladığınızda desteklenir.

    Yerelde kalmayı tercih ediyorsanız `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` sağlayın (veya
    `memorySearch.remote.apiKey`). **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Dosyalar diskte nerede bulunur

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw’ın durumu yereldir**, ancak **harici hizmetler yine de onlara gönderdiğiniz şeyleri görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway host üzerinde yaşar
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar
      onların API’lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) mesaj verilerini
      kendi sunucularında saklar.
    - **İzi siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede saklar?">
    Her şey `$OPENCLAW_STATE_DIR` altında yaşar (varsayılan: `~/.openclaw`):

    | Path                                                            | Amaç                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarma (ilk kullanımda auth profiles içine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli yük |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)          |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Ajan başına durum (agentDir + sessions)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (ajan başına)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum metadata’sı (ajan başına)                                   |

    Eski tek ajan yolu: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır).

    **Çalışma alanınız** (`AGENTS.md`, bellek dosyaları, Skills vb.) ayrıdır ve `agents.defaults.workspace` ile yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede bulunmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **ajan çalışma alanında** bulunur.

    - **Çalışma alanı (ajan başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (veya `MEMORY.md` yoksa eski geri dönüş olarak `memory.md`),
      `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profiles, oturumlar, günlükler,
      ve paylaşılan Skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace` dizinidir, şu şekilde yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra “unutuyorsa”, Gateway’in her açılışta aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod
    yerel dizüstü bilgisayarınızın değil, **gateway host’un**
    çalışma alanını kullanır).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbete güvenmek yerine bottan bunu
    **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    Bkz. [Ajan çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Ajan çalışma alanınızı** **özel** bir git deposuna koyun ve
    özel bir yere yedekleyin (örneğin GitHub private). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve daha sonra asistanın “zihnini” geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, token'lar veya şifrelenmiş gizli yükler).
    Tam geri yükleme gerekiyorsa çalışma alanını ve durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw’ı tamamen nasıl kaldırırım?">
    Özel rehbere bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Ajanlar çalışma alanının dışında çalışabilir mi?">
    Evet. Çalışma alanı, katı bir sandbox değil, **varsayılan cwd** ve bellek dayanağıdır.
    Göreli yollar çalışma alanı içinde çözülür, ancak mutlak yollar diğer
    host konumlarına erişebilir; sandboxing etkin değilse. Yalıtım gerekiyorsa
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya ajan başına sandbox ayarlarını kullanın. Bir deponun
    varsayılan çalışma dizini olmasını istiyorsanız, o ajanın
    `workspace` değerini depo köküne yönlendirin. OpenClaw deposu yalnızca kaynak koddur; ajanın bilinçli olarak onun içinde çalışmasını istemiyorsanız
    çalışma alanını ayrı tutun.

    Örnek (varsayılan cwd olarak depo):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uzak mod: oturum deposu nerede?">
    Oturum durumunun sahibi **gateway host**’tur. Uzak moddaysanız, önem verdiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil, uzak makinededir. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimde? Nerede?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` konumundan isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya yoksa güvenli sayılabilecek varsayılanları kullanır (varsayılan çalışma alanı olarak `~/.openclaw/workspace` dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve şimdi hiçbir şey dinlemiyor / UI unauthorized diyor'>
    Loopback olmayan bind'ler **geçerli bir gateway auth yolu** gerektirir. Pratikte bu şunlardan biri demektir:

    - paylaşılan gizli anahtar auth: token veya parola
    - doğru yapılandırılmış loopback olmayan kimlik farkındalıklı reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notlar:

    - `gateway.remote.token` / `.password`, yerel gateway auth’u tek başına etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarsızsa geri dönüş olarak `gateway.remote.*` kullanabilir.
    - Parola auth’u için bunun yerine `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` açıkça SecretRef ile yapılandırılmış ama çözümlenmemişse, çözümleme güvenli biçimde başarısız olur (maskeleyen uzak geri dönüş yok).
    - Paylaşılan gizli anahtarlı Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` ile kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizli anahtarları URL’lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile, aynı host loopback reverse proxy'leri yine de trusted-proxy auth’u karşılamaz. Güvenilir proxy yapılandırılmış loopback olmayan bir kaynak olmalıdır.

  </Accordion>

  <Accordion title="Neden artık localhost'ta bir token'a ihtiyacım var?">
    OpenClaw, loopback dahil varsayılan olarak gateway auth uygular. Normal varsayılan yolda bu token auth demektir: açık bir auth yolu yapılandırılmamışsa gateway başlatma token moduna çözülür ve otomatik olarak bir token üretip bunu `gateway.auth.token` içine kaydeder; bu yüzden **yerel WS istemcileri kimlik doğrulamalıdır**. Bu, diğer yerel süreçlerin Gateway’i çağırmasını engeller.

    Farklı bir auth yolu tercih ediyorsanız parola modunu (veya loopback olmayan kimlik farkındalıklı reverse proxy'ler için `trusted-proxy`) açıkça seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor sizin için istediğiniz zaman bir token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekir mi?">
    Gateway yapılandırmayı izler ve hot-reload destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri anında uygular, kritik olanlar için yeniden başlatır
    - `hot`, `restart`, `off` da desteklenir

  </Accordion>

  <Accordion title="Eğlenceli CLI sloganlarını nasıl kapatırım?">
    Yapılandırmada `cli.banner.taglineMode` ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ama banner başlığı/sürüm satırını korur.
    - `default`: her zaman `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen eğlenceli/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web aramayı (ve web fetch'i) nasıl etkinleştiririm?">
    `web_fetch` bir API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırdığınız Ollama host’unu kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ancak resmî olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsızdır/kendiniz barındırabilirsiniz; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
    Ortam değişkeni alternatifleri:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` veya `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // isteğe bağlı; otomatik algılama için çıkarın
            },
          },
        },
    }
    ```

    Sağlayıcıya özgü web-search yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında bulunur.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web-fetch geri dönüş yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında bulunur.

    Notlar:

    - İzin listeleri kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` belirtilmezse, OpenClaw mevcut kimlik bilgilerinden hazır ilk fetch geri dönüş sağlayıcısını otomatik algılar. Bugün paketli sağlayıcı Firecrawl’dır.
    - Daemon'lar ortam değişkenlerini `~/.openclaw/.env` içinden (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tr/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl kurtarırım ve bunu nasıl önlerim?">
    `config.apply`, **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz diğer
    her şey kaldırılır.

    Kurtarma:

    - Yedekten geri yükleyin (git veya kopyalanmış bir `~/.openclaw/openclaw.json`).
    - Yedeğiniz yoksa `openclaw doctor` yeniden çalıştırın ve kanalları/modelleri yeniden yapılandırın.
    - Bu beklenmedikse bir hata bildirin ve son bilinen yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı genellikle günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden kurabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; bu, aşağı doğru inceleme için sığ bir şema düğümü ve hemen alt özetlerini döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değiştirme için kalsın.
    - Bir ajan çalıştırmasından owner-only `gateway` aracını kullanıyorsanız, yine de `tools.exec.ask` / `tools.exec.security` yollarına yazmayı reddeder (aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil).

    Belgeler: [Yapılandırma](/cli/config), [Yapılandır](/cli/configure), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Cihazlar arasında uzmanlaşmış çalışanlarla merkezi bir Gateway'i nasıl çalıştırırım?">
    Yaygın desen **bir Gateway** (ör. Raspberry Pi) artı **node**'lar ve **ajanlar** şeklindedir:

    - **Gateway (merkezi):** kanalları (Signal/WhatsApp), yönlendirmeyi ve oturumları sahiplenir.
    - **Node'lar (cihazlar):** Mac/iOS/Android çevre birimi olarak bağlanır ve yerel araçları açığa çıkarır (`system.run`, `canvas`, `camera`).
    - **Ajanlar (çalışanlar):** uzman roller için ayrı zihinler/çalışma alanları (ör. “Hetzner işlemleri”, “Kişisel veriler”).
    - **Alt ajanlar:** paralellik istediğinizde ana ajandan arka plan işi başlatır.
    - **TUI:** Gateway’e bağlanır ve ajanlar/oturumlar arasında geçiş yapar.

    Belgeler: [Node'lar](/tr/nodes), [Uzak erişim](/tr/gateway/remote), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw tarayıcısı headless çalışabilir mi?">
    Evet. Bu bir yapılandırma seçeneğidir:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Varsayılan `false`’tur (headful). Headless, bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. Bkz. [Tarayıcı](/tr/tools/browser).

    Headless, **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, girişler). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsellere ihtiyacınız varsa ekran görüntüleri kullanın).
    - Bazı siteler headless modda otomasyona karşı daha sıkıdır (CAPTCHA’lar, anti-bot).
      Örneğin X/Twitter sık sık headless oturumlarını engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya herhangi bir Chromium tabanlı tarayıcıya) ayarlayın ve Gateway’i yeniden başlatın.
    Tam yapılandırma örnekleri için [Tarayıcı](/tr/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak gateway'ler ve node'lar

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve node'lar arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    ancak bir node aracı gerektiğinde **Gateway WebSocket** üzerinden node'ları çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Node'lar gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrıları alırlar.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı bir node olarak eşleyin**. Gateway başka bir yerde çalışır, ancak
    Gateway WebSocket üzerinden yerel makinenizdeki `node.*` araçlarını (ekran, kamera, sistem) çağırabilir.

    Tipik kurulum:

    1. Gateway’i her zaman açık host üzerinde çalıştırın (VPS/ev sunucusu).
    2. Gateway host’u ve bilgisayarınızı aynı tailnet üzerine koyun.
    3. Gateway WS'nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve **Remote over SSH** modunda (veya doğrudan tailnet ile)
       bağlanın; böylece kendini bir node olarak kaydedebilir.
    5. Gateway üzerinde node'u onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; node'lar Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS node'u eşlemek, o makinede `system.run` izni verir. Yalnızca
    güvendiğiniz cihazları eşleyin ve [Güvenlik](/tr/gateway/security) bölümünü inceleyin.

    Belgeler: [Node'lar](/tr/nodes), [Gateway protocol](/tr/gateway/protocol), [macOS remote mode](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt alamıyorum. Şimdi ne olacak?">
    Temelleri kontrol edin:

    - Gateway çalışıyor mu: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Sonra kimlik doğrulamayı ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız `gateway.auth.allowTailscale` değerinin doğru ayarlandığından emin olun.
    - SSH tüneli ile bağlanıyorsanız yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - İzin listelerinizin (DM veya grup) hesabınızı içerdiğini doğrulayın.

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzak erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir “bot-to-bot” köprüsü yoktur, ancak bunu birkaç
    güvenilir yolla kurabilirsiniz:

    **En basiti:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A, Bot B’ye mesaj göndersin; sonra Bot B normal şekilde yanıtlasın.

    **CLI köprüsü (genel):** diğer Gateway’i
    `openclaw agent --message ... --deliver` ile çağıran bir betik çalıştırın; bunu diğer botun
    dinlediği sohbete hedefleyin. Botlardan biri uzak bir VPS üzerindeyse CLI’nizi o uzak Gateway’e
    SSH/Tailscale üzerinden yönlendirin (bkz. [Uzak erişim](/tr/gateway/remote)).

    Örnek desen (hedef Gateway’e erişebilen bir makineden çalıştırın):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir koruma ekleyin (yalnızca bahsetme, kanal
    izin listeleri veya “bot mesajlarına yanıt verme” kuralı).

    Belgeler: [Uzak erişim](/tr/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla ajan için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Bir Gateway, her biri kendi çalışma alanına, model varsayılanlarına
    ve yönlendirmeye sahip birden fazla ajanı barındırabilir. Bu normal kurulumdur ve
    ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS'leri yalnızca katı yalıtım (güvenlik sınırları) veya
    paylaşmak istemediğiniz çok farklı yapılandırmalar gerektiğinde kullanın. Aksi halde tek bir Gateway tutun ve
    birden fazla ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="Uzak bir VPS'ten SSH kullanmak yerine kişisel dizüstü bilgisayarımda bir node kullanmanın faydası var mı?">
    Evet - node'lar, uzak bir Gateway’den dizüstü bilgisayarınıza ulaşmanın birinci sınıf yoludur ve
    kabuk erişiminden daha fazlasını açar. Gateway macOS/Linux üzerinde çalışır (Windows, WSL2 üzerinden) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden yaygın
    kurulum her zaman açık bir host artı node olarak dizüstü bilgisayarınızdır.

    - **İçe gelen SSH gerekmez.** Node'lar Gateway WebSocket'e dışarı doğru bağlanır ve cihaz eşlemesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayarda node izin listeleri/onaylarıyla korunur.
    - **Daha fazla cihaz aracı.** Node'lar `system.run` yanında `canvas`, `camera` ve `screen` de sunar.
    - **Yerel tarayıcı otomasyonu.** Gateway’i bir VPS üzerinde tutun, ama Chrome’u dizüstü bilgisayardaki bir node host üzerinden yerelde çalıştırın veya Chrome MCP ile host üzerindeki yerel Chrome’a bağlanın.

    SSH, geçici kabuk erişimi için iyidir, ancak node'lar sürekli ajan iş akışları ve
    cihaz otomasyonu için daha basittir.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes), [Tarayıcı](/tr/tools/browser).

  </Accordion>

  <Accordion title="Node'lar bir gateway hizmeti çalıştırır mı?">
    Hayır. Kasıtlı olarak yalıtılmış profiller çalıştırmadığınız sürece host başına yalnızca **bir gateway** çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)). Node'lar, gateway’e bağlanan çevre birimleridir
    (iOS/Android node'ları veya menü çubuğu uygulamasında macOS “node mode”). Headless node
    host'ları ve CLI denetimi için bkz. [Node host CLI](/cli/node).

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını sığ şema düğümü, eşleşen UI ipucu ve hemen alt özetleriyle inceleyin
    - `config.get`: mevcut anlık görüntüyü + hash değerini alın
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir); mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - `config.apply`: tam yapılandırmayı doğrular + değiştirir; mümkün olduğunda hot-reload yapar, gerektiğinde yeniden başlatır
    - Owner-only `gateway` çalışma zamanı aracı hâlâ `tools.exec.ask` / `tools.exec.security` yollarını yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için makul en küçük yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimlerin tetikleyebileceğini sınırlar.

  </Accordion>

  <Accordion title="Bir VPS üzerinde Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    En az adımlar:

    1. **VPS üzerinde kurun + giriş yapın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac’inizde kurun + giriş yapın**
       - Tailscale uygulamasını kullanın ve aynı tailnet üzerinde oturum açın.
    3. **MagicDNS’i etkinleştirin (önerilir)**
       - Tailscale yönetici konsolunda MagicDNS’i etkinleştirin; böylece VPS’in kararlı bir adı olur.
    4. **Tailnet host adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız VPS üzerinde Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway’i loopback’e bağlı tutar ve HTTPS’yi Tailscale üzerinden açığa çıkarır. Bkz. [Tailscale](/tr/gateway/tailscale).

  </Accordion>

  <Accordion title="Bir Mac node'unu uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS** yüzeyini açığa çıkarır. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS ile Mac’in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Remote modunda kullanın** (SSH hedefi tailnet host adı olabilir).
       Uygulama Gateway portunu tüneller ve bir node olarak bağlanır.
    3. **Gateway üzerinde node'u onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protocol](/tr/gateway/protocol), [Discovery](/tr/gateway/discovery), [macOS remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci bir dizüstü bilgisayara mı kurmalıyım, yoksa sadece bir node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (ekran/kamera/exec) ihtiyacınız varsa onu
    bir **node** olarak ekleyin. Bu, tek bir Gateway tutar ve yinelenen yapılandırmadan kaçınır. Yerel node araçları
    şu anda yalnızca macOS’ta vardır, ancak bunları başka işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci bir Gateway’i yalnızca **katı yalıtıma** veya tamamen ayrı iki bota ihtiyacınız olduğunda kurun.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/cli/nodes), [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw, üst süreçten (kabuk, launchd/systemd, CI vb.) ortam değişkenlerini okur ve ayrıca şunları yükler:

    - geçerli çalışma dizinindeki `.env`
    - `~/.openclaw/.env` içindeki genel geri dönüş `.env` (namıdiğer `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.

    Ayrıca yapılandırma içinde satır içi ortam değişkenleri tanımlayabilirsiniz (yalnızca süreç ortamında eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik ve kaynaklar için bkz. [/environment](/tr/help/environment).

  </Accordion>

  <Accordion title="Gateway'i hizmet üzerinden başlattım ve ortam değişkenlerim kayboldu. Şimdi ne olacak?">
    İki yaygın çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece hizmet kabuk ortamınızı devralmasa bile alınırlar.
    2. Kabuk içe aktarmayı etkinleştirin (isteğe bağlı kolaylık):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Bu, giriş kabuğunuzu çalıştırır ve yalnızca eksik beklenen anahtarları içe aktarır (asla geçersiz kılmaz). Ortam değişkeni eşdeğerleri:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım, ama models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env import** etkin olup olmadığını raporlar. “Shell env: off”
    ifadesi ortam değişkenlerinizin eksik olduğu anlamına gelmez - yalnızca OpenClaw’ın
    giriş kabuğunuzu otomatik yüklemeyeceği anlamına gelir.

    Gateway bir hizmet olarak çalışıyorsa (launchd/systemd), kabuk
    ortamınızı devralmaz. Şunlardan birini yaparak düzeltin:

    1. Token'ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell import’u etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya bunu yapılandırmanızdaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

    Sonra gateway’i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot token'ları `COPILOT_GITHUB_TOKEN` içinden okunur (`GH_TOKEN` / `GITHUB_TOKEN` da desteklenir).
    Bkz. [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment).

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden fazla sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Tek başına mesaj olarak `/new` veya `/reset` gönderin. Bkz. [Oturum yönetimi](/tr/concepts/session).
  </Accordion>

  <Accordion title="Hiç /new göndermezsem oturumlar otomatik sıfırlanır mı?">
    Oturumların süresi `session.idleMinutes` sonrasında dolabilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Boşta kalma süresi dolumunu etkinleştirmek için bunu pozitif bir değere ayarlayın. Etkin olduğunda,
    boşta kalma süresinden sonraki **ilk** mesaj o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, dökümleri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw örneklerinden oluşan bir ekip kurmanın bir yolu var mı (bir CEO ve birçok ajan)?">
    Evet, **çoklu ajan yönlendirme** ve **alt ajanlar** üzerinden. Bir koordine edici
    ajan ve kendi çalışma alanlarıyla modellerine sahip birkaç çalışan ajan oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi şekilde **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumları olan tek bir bot kullanmaktan daha az verimlidir. Gözümüzdeki tipik model,
    konuştuğunuz tek bir bottur ve paralel işler için farklı oturumlar kullanır. O
    bot gerektiğinde alt ajanlar da başlatabilir.

    Belgeler: [Çoklu ajan yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tr/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Bağlam neden görevin ortasında kırpıldı? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya Compaction veya kırpmayı tetikleyebilir.

    Yardımcı olan şeyler:

    - Bottan mevcut durumu özetlemesini ve bunu bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan bunu tekrar okumasını isteyin.
    - Ana sohbet daha küçük kalsın diye uzun veya paralel işler için alt ajanlar kullanın.
    - Bu sık oluyorsa daha büyük bağlam penceresine sahip bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw’ı tamamen nasıl sıfırlarım ama kurulu kalsın?">
    Sıfırlama komutunu kullanın:

    ```bash
    openclaw reset
    ```

    Etkileşimsiz tam sıfırlama:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Sonra kurulumu yeniden çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding, mevcut bir yapılandırma görürse **Reset** de sunar. Bkz. [Onboarding (CLI)](/tr/start/wizard).
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>` şeklindedir).
    - Geliştirici sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirme yapılandırmasını + kimlik bilgilerini + oturumları + çalışma alanını siler).

  </Accordion>

  <Accordion title='“context too large” hataları alıyorum - nasıl sıfırlar veya sıkıştırırım?'>
    Şunlardan birini kullanın:

    - **Sıkıştırma** (konuşmayı korur ama eski turları özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Sıfırlama** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Bu sürekli oluyorsa:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam penceresine sahip bir model kullanın.

    Belgeler: [Compaction](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='Neden "LLM request rejected: messages.content.tool_use.input field required" görüyorum?'>
    Bu bir sağlayıcı doğrulama hatasıdır: model gerekli
    `input` olmadan bir `tool_use` bloğu üretti. Genellikle oturum geçmişinin bayat veya bozuk olduğu anlamına gelir (çoğu zaman uzun iş parçacıklarından
    veya bir araç/şema değişikliğinden sonra).

    Düzeltme: `/new` ile yeni bir oturum başlatın (tek başına mesaj).

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat'ler varsayılan olarak her **30m** çalışır (OAuth auth kullanırken **1h**). Ayarlayın veya devre dışı bırakın:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // veya devre dışı bırakmak için "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md` varsa ama fiilen boşsa (yalnızca boş satırlar ve
    `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını korumak için heartbeat çalıştırmasını atlar.
    Dosya yoksa heartbeat yine çalışır ve model ne yapacağına karar verir.

    Ajan başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekir mi?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır, bu yüzden siz gruptaysanız OpenClaw da görebilir.
    Varsayılan olarak, gönderenlere izin verene kadar grup yanıtları engellenir (`groupPolicy: "allowlist"`).

    Yalnızca **sizin** grup yanıtlarını tetikleyebilmenizi istiyorsanız:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir WhatsApp grubunun JID'sini nasıl alırım?">
    Seçenek 1 (en hızlı): günlükleri izle ve grupta bir test mesajı gönder:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın, örneğin:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmışsa/izin listesindeyse): yapılandırmadan grupları listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Dizin](/cli/directory), [Günlükler](/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw neden bir grupta yanıt vermiyor?">
    İki yaygın neden:

    - Mention gating açık (varsayılan). Botu @mention etmeniz gerekir (veya `mentionPatterns` ile eşleşmesi gerekir).
    - `channels.whatsapp.groups` yapılandırdınız ama içinde `"*"` yok ve grup izin listesine alınmamış.

    Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).

  </Accordion>

  <Accordion title="Gruplar/iş parçacıkları DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturumda birleşir. Gruplar/kanallar kendi oturum anahtarlarına sahiptir ve Telegram konuları / Discord iş parçacıkları ayrı oturumlardır. Bkz. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages).
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve ajan oluşturabilirim?">
    Katı sınır yoktur. Onlarca (hatta yüzlerce) uygundur, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + dökümler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla ajan, daha fazla eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** ajan başına auth profiles, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Ajan başına tek bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya depo girdilerini silin).
    - Başıboş çalışma alanlarını ve profil uyumsuzluklarını görmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden fazla bot veya sohbet çalıştırabilir miyim (Slack) ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eş bazında yönlendirmek için **Çoklu Ajan Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür ama “insanın yapabildiği her şeyi yapar” düzeyinde değildir - anti-bot, CAPTCHA'lar ve MFA
    otomasyonu yine de engelleyebilir. En güvenilir tarayıcı denetimi için host üzerindeki yerel Chrome MCP’yi kullanın
    veya tarayıcının gerçekten çalıştığı makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway host’u (VPS/Mac mini).
    - Rol başına bir ajan (bağlamalar).
    - Bu ajanlara bağlı Slack kanalı/kanalları.
    - Gerektiğinde Chrome MCP veya node üzerinden yerel tarayıcı.

    Belgeler: [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Tarayıcı](/tr/tools/browser), [Node'lar](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller: varsayılanlar, seçim, takma adlar, değiştirme

<AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw’ın varsayılan modeli, şurada ayarladığınız modeldir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak referans verilir (örnek: `openai/gpt-5.4`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra artık kullanılmaması gereken bir uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya geri döner. O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw eski kaldırılmış-sağlayıcı varsayılanını göstermek yerine yapılandırılmış ilk sağlayıcı/modele geri düşer. Yine de **açıkça** `provider/model` ayarlamanız gerekir.

  </Accordion>

  <Accordion title="Hangi modeli önerirsiniz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda mevcut olan en güçlü yeni nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdili ajanlar için:** maliyetten önce model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbet için:** daha ucuz yedek modeller kullanın ve ajanın rolüne göre yönlendirin.

    MiniMax’in kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Temel kural: yüksek riskli işler için **karşılayabildiğiniz en iyi modeli** kullanın, rutin
    sohbetler veya özetler içinse daha ucuz bir model kullanın. Modelleri ajan başına yönlendirebilir ve
    uzun görevleri paralelleştirmek için alt ajanlar kullanabilirsiniz (her alt ajan token tüketir). Bkz. [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tr/tools/subagents).

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller prompt
    injection ve güvensiz davranışa karşı daha savunmasızdır. Bkz. [Güvenlik](/tr/gateway/security).

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modelleri nasıl değiştiririm?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tüm yapılandırmayı değiştirmekten kaçının.

    Güvenli seçenekler:

    - sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` düzenleyin

    Tüm yapılandırmayı değiştirmek istemiyorsanız `config.apply` ile kısmi nesne göndermeyin.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup yükü size normalize edilmiş yolu, sığ şema belgelerini/kısıtlarını ve hemen alt özetlerini verir.
    kısmi güncellemeler için.
    Yapılandırmanın üstüne yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Yapılandır](/cli/configure), [Yapılandırma](/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama’dır.

    En hızlı kurulum:

    1. Ollama’yı `https://ollama.com/download` adresinden kurun
    2. `ollama pull gemma4` gibi bir yerel modeli çekin
    3. Bulut modellerini de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local`, bulut modellerini artı yerel Ollama modellerinizi verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel çekme gerektirmez
    - Elle değiştirmek için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun biçimde kuantize edilmiş modeller prompt
    injection’a karşı daha savunmasızdır. Araç kullanabilen herhangi bir bot için **büyük modelleri** güçlü biçimde öneriyoruz.
    Yine de küçük modeller istiyorsanız sandboxing ve sıkı araç izin listelerini etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model sağlayıcıları](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway’deki güncel çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenliğe duyarlı/araç etkin ajanlar için mevcut en güçlü yeni nesil modeli kullanın.
  </Accordion>

  <Accordion title="Modelleri anında nasıl değiştiririm (yeniden başlatmadan)?">
    Tek başına mesaj olarak `/model` komutunu kullanın:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` ile eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) kompakt, numaralı bir seçici gösterir. Numarayla seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir auth profile’ı da zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi ajanın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sırada hangi auth profile’ın deneneceğini gösterir.
    Ayrıca mevcutsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da gösterir.

    **@profile ile ayarladığım profile sabitlemesini nasıl kaldırırım?**

    `@profile` soneki olmadan `/model` komutunu yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi auth profile’ın etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.2 ve kodlama için Codex 5.3 kullanabilir miyim?">
    Evet. Birini varsayılan yapın ve gerektiğinde değiştirin:

    - **Hızlı geçiş (oturum başına):** günlük görevler için `/model gpt-5.4`, Codex OAuth ile kodlama için `/model openai-codex/gpt-5.4`.
    - **Varsayılan + geçiş:** `agents.defaults.model.primary` değerini `openai/gpt-5.4` yapın, sonra kodlama sırasında `openai-codex/gpt-5.4`’e geçin (veya tersi).
    - **Alt ajanlar:** kodlama görevlerini farklı varsayılan modele sahip alt ajanlara yönlendirin.

    Bkz. [Modeller](/tr/concepts/models) ve [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="GPT 5.4 için fast mode'u nasıl yapılandırırım?">
    Ya oturum anahtarı ya da yapılandırma varsayılanı kullanın:

    - **Oturum başına:** oturum `openai/gpt-5.4` veya `openai-codex/gpt-5.4` kullanırken `/fast on` gönderin.
    - **Model başına varsayılan:** `agents.defaults.models["openai/gpt-5.4"].params.fastMode` değerini `true` yapın.
    - **Codex OAuth için de:** `openai-codex/gpt-5.4` kullanıyorsanız aynı bayrağı orada da ayarlayın.

    Örnek:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    OpenAI için fast mode, desteklenen yerel Responses isteklerinde `service_tier = "priority"` değerine eşlenir. Oturumdaki `/fast` geçersiz kılmaları yapılandırma varsayılanlarını yener.

    Bkz. [Thinking ve fast mode](/tr/tools/thinking) ve [OpenAI fast mode](/tr/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüyorum ve sonra yanıt gelmiyor?'>
    `agents.defaults.models` ayarlıysa, bu `/model` ve tüm
    oturum geçersiz kılmaları için **izin listesi** olur. O listede olmayan bir modeli seçmek şunu döndürür:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Bu hata normal bir yanıtın **yerine** döndürülür. Düzeltme: modeli
    `agents.defaults.models` içine ekleyin, izin listesini kaldırın veya `/model list` içinden bir model seçin.

  </Accordion>

  <Accordion title='Neden "Unknown model: minimax/MiniMax-M2.7" görüyorum?'>
    Bu, **sağlayıcının yapılandırılmadığı** anlamına gelir (MiniMax sağlayıcı yapılandırması veya auth
    profile bulunamadı), bu yüzden model çözümlenemiyor.

    Düzeltme kontrol listesi:

    1. Güncel bir OpenClaw sürümüne yükseltin (veya kaynak `main` üzerinden çalıştırın), sonra gateway’i yeniden başlatın.
    2. MiniMax’in yapılandırıldığından emin olun (sihirbaz veya JSON) ya da eşleşen sağlayıcının enjekte edilebilmesi için
       env/auth profiles içinde MiniMax auth bulunduğunu doğrulayın
       (`minimax` için `MINIMAX_API_KEY`, `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya kayıtlı MiniMax
       OAuth).
    3. Auth yolunuz için tam model kimliğini kullanın (büyük/küçük harfe duyarlı):
       API anahtarı kurulumu için `minimax/MiniMax-M2.7` veya `minimax/MiniMax-M2.7-highspeed`,
       ya da OAuth kurulumu için `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed`.
    4. Şunu çalıştırın:

       ```bash
       openclaw models list
       ```

       ve listeden seçin (veya sohbette `/model list`).

    Bkz. [MiniMax](/tr/providers/minimax) ve [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="MiniMax'i varsayılan, OpenAI'yi karmaşık görevler için kullanabilir miyim?">
    Evet. **MiniMax’i varsayılan** olarak kullanın ve gerektiğinde modelleri **oturum başına** değiştirin.
    Yedekler **zor görevler** için değil, **hatalar** içindir; bu yüzden `/model` veya ayrı bir ajan kullanın.

    **Seçenek A: oturum başına değiştirin**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Sonra:

    ```
    /model gpt
    ```

    **Seçenek B: ayrı ajanlar**

    - Ajan A varsayılanı: MiniMax
    - Ajan B varsayılanı: OpenAI
    - Ajana göre yönlendirin veya değiştirmek için `/agent` kullanın

    Belgeler: [Modeller](/tr/concepts/models), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [MiniMax](/tr/providers/minimax), [OpenAI](/tr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt yerleşik kısayollar mı?">
    Evet. OpenClaw birkaç varsayılan kısa ad ile gelir (`agents.defaults.models` içinde model mevcut olduğunda uygulanır):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Aynı adla kendi takma adınızı ayarlarsanız sizin değeriniz kazanır.

  </Accordion>

  <Accordion title="Model kısayollarını (takma adları) nasıl tanımlar/değiştiririm?">
    Takma adlar `agents.defaults.models.<modelId>.alias` içinden gelir. Örnek:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Sonra `/model sonnet` (veya destekleniyorsa `/<alias>`) bu model kimliğine çözülür.

  </Accordion>

  <Accordion title="OpenRouter veya Z.AI gibi diğer sağlayıcılardan modelleri nasıl eklerim?">
    OpenRouter (token başına ödeme; birçok model):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM modelleri):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Bir sağlayıcı/model referans verir ama gerekli sağlayıcı anahtarı eksik olursa çalışma zamanında bir auth hatası alırsınız (örn. `No API key found for provider "zai"`).

    **Yeni bir ajan ekledikten sonra sağlayıcı için API anahtarı bulunamadı**

    Bu genellikle **yeni ajanın** auth deposunun boş olduğu anlamına gelir. Auth ajan başınadır ve
    şurada saklanır:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Düzeltme seçenekleri:

    - `openclaw agents add <id>` çalıştırın ve sihirbaz sırasında auth yapılandırın.
    - Veya ana ajanın `agentDir` içindeki `auth-profiles.json` dosyasını yeni ajanın `agentDir` içine kopyalayın.

    `agentDir` değerini ajanlar arasında **yeniden kullanmayın**; auth/oturum çakışmalarına neden olur.

  </Accordion>
</AccordionGroup>

## Model yedekleme ve "All models failed"

<AccordionGroup>
  <Accordion title="Yedekleme nasıl çalışır?">
    Yedekleme iki aşamada olur:

    1. Aynı sağlayıcı içinde **Auth profile rotasyonu**.
    2. `agents.defaults.model.fallbacks` içindeki sonraki modele **Model geri dönüşü**.

    Başarısız profillere bekleme süreleri uygulanır (üstel geri çekilme), böylece bir sağlayıcı hız sınırına takılsa veya geçici olarak arızalansa bile OpenClaw yanıt vermeye devam edebilir.

    Hız sınırı havuzu yalnızca düz `429` yanıtlarından fazlasını içerir. OpenClaw,
    ayrıca `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` ve dönemsel
    kullanım penceresi sınırları (`weekly/monthly limit reached`) gibi mesajları da yedeklemeye değer
    hız sınırları olarak değerlendirir.

    Faturalandırma gibi görünen bazı yanıtlar `402` değildir ve bazı HTTP `402`
    yanıtları da bu geçici havuzda kalır. Bir sağlayıcı
    `401` veya `403` üzerinde açık faturalandırma metni döndürürse OpenClaw bunu yine de
    faturalandırma yolunda tutabilir, ancak sağlayıcıya özgü metin eşleyicileri
    bunlara sahip olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `Key limit exceeded`). Eğer bir `402`
    mesajı bunun yerine yeniden denenebilir bir kullanım penceresi veya
    organizasyon/çalışma alanı harcama sınırı gibi görünüyorsa (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw bunu uzun süreli faturalandırma devre dışı bırakma değil,
    `rate_limit` olarak değerlendirir.

    Bağlam taşması hataları farklıdır: örneğin
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` veya `ollama error: context length
    exceeded` gibi imzalar model
    geri dönüşünü ilerletmek yerine compaction/yeniden deneme yolunda kalır.

    Genel sunucu-hatası metni, “içinde unknown/error geçen her şey”den özellikle daha dardır.
    OpenClaw, Anthropic’in yalın `An unknown error occurred`, OpenRouter’ın yalın
    `Provider returned error`, `Unhandled stop reason:
    error` gibi durdurma nedeni hataları, geçici sunucu metni içeren JSON `api_error` yükleri
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ve `ModelNotReadyException` gibi sağlayıcı-meşgul hataları
    sağlayıcı bağlamı eşleştiğinde yedeklemeye değer zaman aşımı/aşırı yük sinyalleri olarak ele alır.
    `LLM request failed with an unknown
    error.` gibi genel iç geri dönüş metni temkinli kalır ve tek başına model geri dönüşünü tetiklemez.

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” ne anlama gelir?'>
    Bu, sistemin `anthropic:default` auth profile kimliğini kullanmaya çalıştığı, ancak bunun için beklenen auth deposunda kimlik bilgisi bulamadığı anlamına gelir.

    **Düzeltme kontrol listesi:**

    - **Auth profiles’in nerede yaşadığını doğrulayın** (yeni ve eski yollar)
      - Geçerli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Eski: `~/.openclaw/agent/*` (`openclaw doctor` tarafından taşınır)
    - **Env değişkeninizin Gateway tarafından yüklendiğini doğrulayın**
      - `ANTHROPIC_API_KEY` değerini kabuğunuzda ayarladıysanız ama Gateway’i systemd/launchd üzerinden çalıştırıyorsanız, bunu devralmayabilir. `~/.openclaw/.env` içine koyun veya `env.shellEnv` etkinleştirin.
    - **Doğru ajanı düzenlediğinizden emin olun**
      - Çoklu ajan kurulumlarında birden fazla `auth-profiles.json` dosyası olabilir.
    - **Model/auth durumunu akılcı biçimde kontrol edin**
      - Yapılandırılmış modelleri ve sağlayıcıların kimlik doğrulanıp doğrulanmadığını görmek için `openclaw models status` kullanın.

    **“No credentials found for profile anthropic” için düzeltme kontrol listesi**

    Bu, çalıştırmanın bir Anthropic auth profile’ına sabitlendiği, ancak Gateway’in
    bunu auth deposunda bulamadığı anlamına gelir.

    - **Claude CLI kullanın**
      - Gateway host üzerinde `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın.
    - **Bunun yerine API anahtarı kullanmak istiyorsanız**
      - **Gateway host** üzerindeki `~/.openclaw/.env` içine `ANTHROPIC_API_KEY` koyun.
      - Eksik bir profile’ı zorlayan sabitlenmiş sırayı temizleyin:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Komutları gateway host üzerinde çalıştırdığınızı doğrulayın**
      - Uzak modda auth profiles dizüstü bilgisayarınızda değil, gateway makinesinde yaşar.

  </Accordion>

  <Accordion title="Neden Google Gemini'yi de denedi ve başarısız oldu?">
    Model yapılandırmanız Google Gemini’yi yedek olarak içeriyorsa (veya bir Gemini kısa adına geçtiyseniz), OpenClaw model geri dönüşü sırasında onu dener. Google kimlik bilgilerini yapılandırmadıysanız `No API key found for provider "google"` görürsünüz.

    Düzeltme: ya Google auth sağlayın ya da geri dönüş oraya yönlenmesin diye `agents.defaults.model.fallbacks` / takma adlar içindeki Google modellerini kaldırın/kaçının.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Neden: oturum geçmişi **imzasız thinking blokları** içeriyor (çoğu zaman
    iptal edilmiş/kısmi bir akıştan). Google Antigravity, thinking blokları için imza gerektirir.

    Düzeltme: OpenClaw artık Google Antigravity Claude için imzasız thinking bloklarını ayıklıyor. Hâlâ görünüyorsa **yeni bir oturum** başlatın veya o ajan için `/thinking off` ayarlayın.

  </Accordion>
</AccordionGroup>

## Auth profiles: nedirler ve nasıl yönetilirler

İlgili: [/concepts/oauth](/tr/concepts/oauth) (OAuth akışları, token depolama, çok hesaplı desenler)

<AccordionGroup>
  <Accordion title="Auth profile nedir?">
    Auth profile, bir sağlayıcıya bağlı adlandırılmış kimlik bilgisi kaydıdır (OAuth veya API anahtarı). Profiller şurada yaşar:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Tipik profile kimlikleri nelerdir?">
    OpenClaw, sağlayıcı önekli kimlikler kullanır, örneğin:

    - `anthropic:default` (e-posta kimliği olmadığında yaygın)
    - OAuth kimlikleri için `anthropic:<email>`
    - sizin seçtiğiniz özel kimlikler (örn. `anthropic:work`)

  </Accordion>

  <Accordion title="Önce hangi auth profile'ın deneneceğini kontrol edebilir miyim?">
    Evet. Yapılandırma, profiller için isteğe bağlı metadata ve sağlayıcı başına bir sıralama (`auth.order.<provider>`) destekler. Bu, gizli verileri saklamaz; kimlikleri sağlayıcı/mod ile eşler ve dönüş sırasını ayarlar.

    OpenClaw, bir profil kısa bir **cooldown** içinde ise (hız sınırları/zaman aşımı/auth başarısızlıkları) veya daha uzun bir **disabled** durumundaysa (faturalandırma/yetersiz kredi) geçici olarak atlayabilir. Bunu incelemek için `openclaw models status --json` çalıştırın ve `auth.unusableProfiles` değerini kontrol edin. İnce ayar: `auth.cooldowns.billingBackoffHours*`.

    Hız sınırı cooldown'ları model kapsamlı olabilir. Bir model için
    cooldown içinde olan profil, aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir,
    buna karşılık faturalandırma/devre dışı bırakma pencereleri hâlâ tüm profili engeller.

    CLI üzerinden ayrıca **ajan başına** bir sıra geçersiz kılması ayarlayabilirsiniz (o ajanın `auth-state.json` dosyasında saklanır):

    ```bash
    # Yapılandırılmış varsayılan ajana göre çalışır (--agent atlanır)
    openclaw models auth order get --provider anthropic

    # Rotasyonu tek bir profile kilitle (yalnızca bunu dene)
    openclaw models auth order set --provider anthropic anthropic:default

    # Veya açık bir sıra ayarla (sağlayıcı içinde geri dönüş)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Geçersiz kılmayı temizle (config auth.order / round-robin’a geri dön)
    openclaw models auth order clear --provider anthropic
    ```

    Belirli bir ajanı hedeflemek için:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gerçekte neyin deneneceğini doğrulamak için şunu kullanın:

    ```bash
    openclaw models status --probe
    ```

    Saklanan bir profil açık sıradan çıkarılırsa probe,
    bu profili sessizce denemek yerine `excluded_by_auth_order` bildirir.

  </Accordion>

  <Accordion title="OAuth ile API anahtarı arasındaki fark nedir?">
    OpenClaw ikisini de destekler:

    - **OAuth** genellikle abonelik erişiminden yararlanır (uygulanabildiği yerlerde).
    - **API anahtarları** token başına faturalandırma kullanır.

    Sihirbaz, Anthropic Claude CLI, OpenAI Codex OAuth ve API anahtarlarını açıkça destekler.

  </Accordion>
</AccordionGroup>

## Gateway: portlar, "already running" ve uzak mod

<AccordionGroup>
  <Accordion title="Gateway hangi portu kullanır?">
    `gateway.port`, WebSocket + HTTP (Control UI, hook'lar vb.) için tek çoklanmış portu kontrol eder.

    Öncelik:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > varsayılan 18789
    ```

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Runtime: running" ama "RPC probe: failed" diyor?'>
    Çünkü “running”, **supervisor’un** görünümüdür (launchd/systemd/schtasks). RPC probe ise CLI’nin gerçekten gateway WebSocket’e bağlanıp `status` çağırmasıdır.

    `openclaw gateway status` kullanın ve şu satırlara güvenin:

    - `Probe target:` (probe’un gerçekten kullandığı URL)
    - `Listening:` (port üzerinde gerçekten neyin bağlı olduğu)
    - `Last gateway error:` (süreç canlı ama port dinlemiyorken yaygın kök neden)

  </Accordion>

  <Accordion title='Neden openclaw gateway status "Config (cli)" ile "Config (service)" değerlerini farklı gösteriyor?'>
    Bir yapılandırma dosyasını düzenliyorsunuz ama hizmet başka birini çalıştırıyor (çoğu zaman `--profile` / `OPENCLAW_STATE_DIR` uyuşmazlığı).

    Düzeltme:

    ```bash
    openclaw gateway install --force
    ```

    Bunu, hizmetin kullanmasını istediğiniz aynı `--profile` / ortam altında çalıştırın.

  </Accordion>

  <Accordion title='“another gateway instance is already listening” ne anlama gelir?'>
    OpenClaw, başlangıçta WebSocket dinleyicisini hemen bağlayarak bir çalışma zamanı kilidi uygular (varsayılan `ws://127.0.0.1:18789`). Bağlama `EADDRINUSE` ile başarısız olursa, başka bir örneğin zaten dinlediğini belirten `GatewayLockError` fırlatır.

    Düzeltme: diğer örneği durdurun, portu boşaltın veya `openclaw gateway --port <port>` ile çalıştırın.

  </Accordion>

  <Accordion title="OpenClaw'ı uzak modda nasıl çalıştırırım (istemci başka yerdeki bir Gateway'e bağlanır)?">
    `gateway.mode: "remote"` ayarlayın ve isteğe bağlı paylaşılan gizli uzaktan kimlik bilgileriyle uzak bir WebSocket URL’si gösterin:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Notlar:

    - `openclaw gateway` yalnızca `gateway.mode` `local` olduğunda başlar (veya geçersiz kılma bayrağı geçirirsiniz).
    - macOS uygulaması yapılandırma dosyasını izler ve bu değerler değiştiğinde modları canlı olarak değiştirir.
    - `gateway.remote.token` / `.password` yalnızca istemci tarafı uzak kimlik bilgileridir; yerel gateway auth’u tek başına etkinleştirmez.

  </Accordion>

  <Accordion title='Control UI "unauthorized" diyor (veya sürekli yeniden bağlanıyor). Şimdi ne olacak?'>
    Gateway auth yolunuz ile UI'ın auth yöntemi eşleşmiyor.

    Gerçekler (koddan):

    - Control UI, token’ı geçerli tarayıcı sekmesi oturumu ve seçili gateway URL’si için `sessionStorage` içinde tutar; böylece aynı sekmede yenilemeler, uzun ömürlü `localStorage` token kalıcılığını geri yüklemeden çalışmaya devam eder.
    - `AUTH_TOKEN_MISMATCH` durumunda güvenilir istemciler, gateway yeniden deneme ipuçları döndürdüğünde (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`) önbelleğe alınmış cihaz token’ıyla sınırlı bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi artık cihaz token’ı ile saklanan önbelleklenmiş onaylı scope’ları yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar ise önbelleklenen scope’ları devralmak yerine istedikleri scope kümesini korur.
    - Bu yeniden deneme yolu dışında bağlanma auth önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token’ı, sonra bootstrap token şeklindedir.
    - Bootstrap token scope denetimleri rol önekine bağlıdır. Yerleşik bootstrap operator izin listesi yalnızca operator isteklerini karşılar; node veya diğer operator olmayan roller yine de kendi rol önekleri altında scope gerektirir.

    Düzeltme:

    - En hızlısı: `openclaw dashboard` (pano URL’sini yazdırır + kopyalar, açmayı dener; headless ise SSH ipucu gösterir).
    - Henüz token'ınız yoksa: `openclaw doctor --generate-gateway-token`.
    - Uzak ise önce tünel açın: `ssh -N -L 18789:127.0.0.1:18789 user@host` sonra `http://127.0.0.1:18789/` açın.
    - Paylaşılan gizli mod: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` veya `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` ayarlayın, sonra eşleşen gizliyi Control UI ayarlarına yapıştırın.
    - Tailscale Serve modu: `gateway.auth.allowTailscale` etkin olduğundan ve Tailscale kimlik başlıklarını atlayan ham loopback/tailnet URL’si yerine Serve URL’sini açtığınızdan emin olun.
    - Trusted-proxy modu: aynı host loopback proxy’si veya ham gateway URL’si değil, yapılandırılmış loopback olmayan kimlik farkındalıklı proxy üzerinden geldiğinizden emin olun.
    - Eşleşmezlik tek yeniden denemeden sonra da sürerse, eşlenmiş cihaz token’ını döndürün/yeniden onaylayın:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Bu döndürme çağrısı reddedildi derse iki şeyi kontrol edin:
      - eşlenmiş cihaz oturumları yalnızca **kendi** cihazlarını döndürebilir, ayrıca `operator.admin` yetkileri yoksa
      - açık `--scope` değerleri çağıranın mevcut operator scope’larını aşamaz
    - Hâlâ takıldınız mı? `openclaw status --all` çalıştırın ve [Sorun Giderme](/tr/gateway/troubleshooting) bölümünü izleyin. Auth ayrıntıları için bkz. [Pano](/web/dashboard).

  </Accordion>

  <Accordion title="gateway.bind tailnet ayarladım ama bağlanamıyor ve hiçbir şey dinlemiyor">
    `tailnet` bind, ağ arayüzlerinizden bir Tailscale IP’si seçer (100.64.0.0/10). Makine Tailscale üzerinde değilse (veya arayüz kapalıysa), bağlanacak bir şey yoktur.

    Düzeltme:

    - O host üzerinde Tailscale’i başlatın (böylece 100.x adresi olur), veya
    - `gateway.bind: "loopback"` / `"lan"` değerine geçin.

    Not: `tailnet` açıktır. `auto`, loopback’i tercih eder; yalnızca tailnet bind istediğinizde `gateway.bind: "tailnet"` kullanın.

  </Accordion>

  <Accordion title="Aynı host üzerinde birden fazla Gateway çalıştırabilir miyim?">
    Genellikle hayır - bir Gateway birden fazla mesajlaşma kanalını ve ajanı çalıştırabilir. Birden fazla Gateway’i yalnızca yedeklilik (ör: kurtarma botu) veya katı yalıtım gerektiğinde kullanın.

    Evet, ama şunları yalıtmanız gerekir:

    - `OPENCLAW_CONFIG_PATH` (örnek başına yapılandırma)
    - `OPENCLAW_STATE_DIR` (örnek başına durum)
    - `agents.defaults.workspace` (çalışma alanı yalıtımı)
    - `gateway.port` (benzersiz portlar)

    Hızlı kurulum (önerilir):

    - Örnek başına `openclaw --profile <name> ...` kullanın (otomatik olarak `~/.openclaw-<name>` oluşturur).
    - Her profil yapılandırmasında benzersiz `gateway.port` ayarlayın (veya elle çalıştırmalar için `--port` geçin).
    - Profil başına hizmet kurun: `openclaw --profile <name> gateway install`.

    Profiller ayrıca hizmet adlarına sonek ekler (`ai.openclaw.<profile>`; eski `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Tam rehber: [Birden fazla gateway](/tr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='“invalid handshake” / code 1008 ne anlama gelir?'>
    Gateway bir **WebSocket sunucusudur** ve aldığı ilk mesajın
    bir `connect` çerçevesi olmasını bekler. Bunun dışında bir şey alırsa bağlantıyı
    **code 1008** ile kapatır (ilke ihlali).

    Yaygın nedenler:

    - Tarayıcıda **HTTP** URL’sini açtınız (`http://...`), WS istemcisi değil.
    - Yanlış portu veya yolu kullandınız.
    - Bir proxy veya tünel auth başlıklarını çıkardı ya da Gateway olmayan bir istek gönderdi.

    Hızlı düzeltmeler:

    1. WS URL’sini kullanın: `ws://<host>:18789` (veya HTTPS ise `wss://...`).
    2. WS portunu normal tarayıcı sekmesinde açmayın.
    3. Auth açıksa `connect` çerçevesine token/parolayı ekleyin.

    CLI veya TUI kullanıyorsanız URL şöyle görünmelidir:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protokol ayrıntıları: [Gateway protocol](/tr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Günlükleme ve hata ayıklama

<AccordionGroup>
  <Accordion title="Günlükler nerede?">
    Dosya günlükleri (yapılandırılmış):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file` ile kararlı bir yol ayarlayabilirsiniz. Dosya günlük düzeyi `logging.level` ile kontrol edilir. Konsol ayrıntı düzeyi `--verbose` ve `logging.consoleLevel` ile kontrol edilir.

    Günlüğü en hızlı izleme:

    ```bash
    openclaw logs --follow
    ```

    Hizmet/supervisor günlükleri (gateway launchd/systemd üzerinden çalışıyorsa):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` ve `gateway.err.log` (varsayılan: `~/.openclaw/logs/...`; profiller `~/.openclaw-<profile>/logs/...` kullanır)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Daha fazlası için bkz. [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Gateway hizmetini nasıl başlatır/durdurur/yeniden başlatırım?">
    Gateway yardımcılarını kullanın:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway’i elle çalıştırıyorsanız `openclaw gateway --force` portu geri alabilir. Bkz. [Gateway](/tr/gateway).

  </Accordion>

  <Accordion title="Windows'ta terminalimi kapattım - OpenClaw'ı nasıl yeniden başlatırım?">
    **İki Windows kurulum modu** vardır:

    **1) WSL2 (önerilir):** Gateway Linux içinde çalışır.

    PowerShell’i açın, WSL’ye girin, sonra yeniden başlatın:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Hizmeti hiç kurmadıysanız ön planda başlatın:

    ```bash
    openclaw gateway run
    ```

    **2) Yerel Windows (önerilmez):** Gateway doğrudan Windows’ta çalışır.

    PowerShell’i açın ve şunu çalıştırın:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Elle çalıştırıyorsanız (hizmet yok), şunu kullanın:

    ```powershell
    openclaw gateway run
    ```

    Belgeler: [Windows (WSL2)](/tr/platforms/windows), [Gateway hizmet runbook’u](/tr/gateway).

  </Accordion>

  <Accordion title="Gateway açık ama yanıtlar hiç gelmiyor. Neyi kontrol etmeliyim?">
    Hızlı bir sağlık taramasıyla başlayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Yaygın nedenler:

    - Model auth **gateway host** üzerinde yüklenmemiş (bkz. `models status`).
    - Kanal eşleme/izin listesi yanıtları engelliyor (kanal yapılandırmasını + günlükleri kontrol edin).
    - WebChat/Pano doğru token olmadan açık.

    Uzak moddaysanız tünel/Tailscale bağlantısının açık olduğunu ve
    Gateway WebSocket’in erişilebilir olduğunu doğrulayın.

    Belgeler: [Kanallar](/tr/channels), [Sorun Giderme](/tr/gateway/troubleshooting), [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - şimdi ne olacak?'>
    Bu genellikle UI’ın WebSocket bağlantısını kaybettiği anlamına gelir. Kontrol edin:

    1. Gateway çalışıyor mu? `openclaw gateway status`
    2. Gateway sağlıklı mı? `openclaw status`
    3. UI’da doğru token var mı? `openclaw dashboard`
    4. Uzak moddaysanız tünel/Tailscale bağlantısı açık mı?

    Sonra günlükleri izleyin:

    ```bash
    openclaw logs --follow
    ```

    Belgeler: [Pano](/web/dashboard), [Uzak erişim](/tr/gateway/remote), [Sorun Giderme](/tr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands başarısız oluyor. Neyi kontrol etmeliyim?">
    Günlükler ve kanal durumuyla başlayın:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Sonra hatayı eşleştirin:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram menüsünde çok fazla giriş var. OpenClaw zaten Telegram sınırına göre kırpıp daha az komutla yeniden deniyor, ama bazı menü girdilerinin yine de düşürülmesi gerekiyor. Plugin/Skill/özel komutları azaltın veya menüye ihtiyacınız yoksa `channels.telegram.commands.native` devre dışı bırakın.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` veya benzer ağ hataları: bir VPS üzerindeyseniz veya proxy arkasındaysanız, dışa dönük HTTPS’in izinli olduğunu ve `api.telegram.org` için DNS’in çalıştığını doğrulayın.

    Gateway uzaktaysa, günlükleri Gateway host üzerinde incelediğinizden emin olun.

    Belgeler: [Telegram](/tr/channels/telegram), [Kanal sorun giderme](/tr/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI hiçbir çıktı göstermiyor. Neyi kontrol etmeliyim?">
    Önce Gateway’in erişilebilir olduğunu ve ajanın çalışabildiğini doğrulayın:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI içinde mevcut durumu görmek için `/status` kullanın. Yanıtları bir sohbet
    kanalında bekliyorsanız teslimin etkin olduğundan emin olun (`/deliver on`).

    Belgeler: [TUI](/web/tui), [Slash commands](/tr/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway'i tamamen durdurup sonra nasıl başlatırım?">
    Hizmeti kurduysanız:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Bu, **denetlenen hizmeti** durdurur/başlatır (macOS’ta launchd, Linux’ta systemd).
    Gateway arka planda daemon olarak çalışıyorsa bunu kullanın.

    Ön planda çalıştırıyorsanız Ctrl-C ile durdurun, sonra:

    ```bash
    openclaw gateway run
    ```

    Belgeler: [Gateway hizmet runbook’u](/tr/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart ile openclaw gateway arasındaki fark">
    - `openclaw gateway restart`: **arka plan hizmetini** yeniden başlatır (launchd/systemd).
    - `openclaw gateway`: gateway’i bu terminal oturumu için **ön planda** çalıştırır.

    Hizmeti kurduysanız gateway komutlarını kullanın. Tek seferlik, ön planda bir çalıştırma
    istediğinizde `openclaw gateway` kullanın.

  </Accordion>

  <Accordion title="Bir şey başarısız olduğunda daha fazla ayrıntı almanın en hızlı yolu">
    Daha fazla konsol ayrıntısı almak için Gateway’i `--verbose` ile başlatın. Sonra kanal auth, model yönlendirme ve RPC hataları için günlük dosyasını inceleyin.
  </Accordion>
</AccordionGroup>

## Medya ve ekler

<AccordionGroup>
  <Accordion title="Skill'im bir görsel/PDF üretti ama hiçbir şey gönderilmedi">
    Ajandan çıkan ekler, kendi satırında olacak şekilde bir `MEDIA:<path-or-url>` satırı içermelidir. Bkz. [OpenClaw assistant setup](/tr/start/openclaw) ve [Agent send](/tr/tools/agent-send).

    CLI ile gönderme:

    ```bash
    openclaw message send --target +15555550123 --message "İşte burada" --media /path/to/file.png
    ```

    Ayrıca şunları kontrol edin:

    - Hedef kanal giden medyayı destekliyor ve izin listeleri tarafından engellenmiyor.
    - Dosya sağlayıcının boyut sınırları içinde (görseller en fazla 2048px’e yeniden boyutlandırılır).
    - `tools.fs.workspaceOnly=true`, yerel yol gönderimlerini çalışma alanı, temp/media-store ve sandbox tarafından doğrulanmış dosyalarla sınırlar.
    - `tools.fs.workspaceOnly=false`, ajanın zaten okuyabildiği host-yerel dosyaların `MEDIA:` ile gönderilmesine izin verir, ancak yalnızca medya artı güvenli belge türleri için (görseller, ses, video, PDF ve Office belgeleri). Düz metin ve gizli veri benzeri dosyalar hâlâ engellenir.

    Bkz. [Görseller](/tr/nodes/images).

  </Accordion>
</AccordionGroup>

## Güvenlik ve erişim kontrolü

<AccordionGroup>
  <Accordion title="OpenClaw'ı gelen DM'lere açmak güvenli mi?">
    Gelen DM’leri güvenilmeyen girdi olarak değerlendirin. Varsayılanlar riski azaltmak için tasarlanmıştır:

    - DM destekleyen kanallarda varsayılan davranış **pairing**’dir:
      - Bilinmeyen gönderenler bir pairing kodu alır; bot mesajlarını işlemez.
      - Şununla onaylayın: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Bekleyen istekler **kanal başına 3** ile sınırlıdır; kod gelmediyse `openclaw pairing list --channel <channel> [--account <id>]` ile kontrol edin.
    - DM’leri herkese açık biçimde açmak açık katılım gerektirir (`dmPolicy: "open"` ve izin listesi `"*"`).

    Riskli DM ilkelerini görmek için `openclaw doctor` çalıştırın.

  </Accordion>

  <Accordion title="Prompt injection yalnızca herkese açık botlar için mi endişe kaynağıdır?">
    Hayır. Prompt injection, yalnızca bota kimin DM gönderebildiğiyle değil, **güvenilmeyen içerikle** ilgilidir.
    Asistanınız harici içerik okursa (web search/fetch, tarayıcı sayfaları, e-postalar,
    belgeler, ekler, yapıştırılmış günlükler), bu içerik modele
    el koymaya çalışan talimatlar içerebilir. Bu, **tek gönderen siz olsanız bile**
    gerçekleşebilir.

    En büyük risk, araçlar etkin olduğunda ortaya çıkar: model kandırılıp
    bağlamı sızdırabilir veya sizin adınıza araç çağırabilir. Etki alanını şu yollarla azaltın:

    - güvenilmeyen içeriği özetlemek için salt okunur veya araçları kapalı bir “reader” ajan kullanın
    - araç etkin ajanlarda `web_search` / `web_fetch` / `browser` kapalı tutun
    - kodu çözülmüş dosya/belge metnini de güvenilmeyen sayın: OpenResponses
      `input_file` ve medya-eki çıkarımı, çıkarılan metni ham dosya metni
      olarak geçirmek yerine açık harici-içerik sınır işaretleyicileri içine sarar
    - sandboxing ve sıkı araç izin listeleri kullanın

    Ayrıntılar: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Botumun kendi e-postası, GitHub hesabı veya telefon numarası olmalı mı?">
    Evet, çoğu kurulum için. Botu ayrı hesaplar ve telefon numaralarıyla yalıtmak,
    bir şey ters giderse etki alanını azaltır. Ayrıca kimlik bilgilerini döndürmeyi
    veya kişisel hesaplarınızı etkilemeden erişimi iptal etmeyi kolaylaştırır.

    Küçük başlayın. Yalnızca gerçekten ihtiyaç duyduğunuz araçlara ve hesaplara erişim verin, gerekirse
    sonra genişletin.

    Belgeler: [Güvenlik](/tr/gateway/security), [Pairing](/tr/channels/pairing).

  </Accordion>

  <Accordion title="Metin mesajlarım üzerinde özerklik verebilir miyim ve bu güvenli mi?">
    Kişisel mesajlarınız üzerinde tam özerklik **önermiyoruz**. En güvenli desen şudur:

    - DM’leri **pairing mode** veya sıkı bir izin listesinde tutun.
    - Sizin adınıza mesaj göndermesini istiyorsanız **ayrı bir numara veya hesap** kullanın.
    - Taslak hazırlasın, sonra **göndermeden önce onay verin**.

    Deneme yapmak istiyorsanız bunu özel bir hesapta yapın ve yalıtılmış tutun. Bkz.
    [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Kişisel asistan görevleri için daha ucuz modeller kullanabilir miyim?">
    Evet, **eğer** ajan yalnızca sohbet amaçlıysa ve girdi güvenilirse. Daha küçük katmanlar
    talimat ele geçirmeye daha yatkındır; bu nedenle araç etkin ajanlarda
    veya güvenilmeyen içerik okurken onlardan kaçının. Daha küçük bir model kullanmanız gerekiyorsa
    araçları sıkılaştırın ve sandbox içinde çalıştırın. Bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Telegram'da /start çalıştırdım ama pairing kodu almadım">
    Pairing kodları **yalnızca** bilinmeyen bir gönderici bota mesaj attığında ve
    `dmPolicy: "pairing"` etkin olduğunda gönderilir. `/start` tek başına kod oluşturmaz.

    Bekleyen istekleri kontrol edin:

    ```bash
    openclaw pairing list telegram
    ```

    Hemen erişim istiyorsanız gönderen kimliğinizi izin listesine alın veya o hesap için `dmPolicy: "open"`
    ayarlayın.

  </Accordion>

  <Accordion title="WhatsApp: kişilerime mesaj atar mı? Pairing nasıl çalışır?">
    Hayır. Varsayılan WhatsApp DM ilkesi **pairing**’dir. Bilinmeyen gönderenler yalnızca bir pairing kodu alır ve mesajları **işlenmez**. OpenClaw yalnızca aldığı sohbetlere veya sizin tetiklediğiniz açık gönderimlere yanıt verir.

    Pairing’i şununla onaylayın:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Bekleyen istekleri listeleyin:

    ```bash
    openclaw pairing list whatsapp
    ```

    Sihirbazdaki telefon numarası istemi, **izin listenizi/sahibinizi** ayarlamak için kullanılır; böylece kendi DM’lerinize izin verilir. Otomatik gönderim için kullanılmaz. Kişisel WhatsApp numaranızda çalıştırıyorsanız bu numarayı kullanın ve `channels.whatsapp.selfChatMode` etkinleştirin.

  </Accordion>
</AccordionGroup>

## Sohbet komutları, görev iptali ve "durmuyor"

<AccordionGroup>
  <Accordion title="Dahili sistem mesajlarının sohbette görünmesini nasıl durdururum?">
    Çoğu dahili veya araç mesajı yalnızca o oturum için **verbose**, **trace** veya **reasoning** etkin olduğunda
    görünür.

    Bunu gördüğünüz sohbette düzeltin:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Hâlâ gürültülüyse Control UI içindeki oturum ayarlarını kontrol edin ve verbose
    değerini **inherit** yapın. Ayrıca yapılandırmada `verboseDefault` değeri
    `on` olan bir bot profile kullanmadığınızı doğrulayın.

    Belgeler: [Thinking ve verbose](/tr/tools/thinking), [Güvenlik](/tr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Çalışan bir görevi nasıl durdurur/iptal ederim?">
    Bunlardan herhangi birini **tek başına mesaj olarak** gönderin (slash olmadan):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Bunlar iptal tetikleyicileridir (slash command değildir).

    Arka plan süreçleri için (exec aracından), ajandan şunu çalıştırmasını isteyebilirsiniz:

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands genel bakışı için bkz. [Slash commands](/tr/tools/slash-commands).

    Çoğu komut, `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir, ancak birkaç kısayol (ör. `/status`) izin listesindeki gönderenler için satır içinde de çalışır.

  </Accordion>

  <Accordion title='Telegram'dan Discord mesajı nasıl gönderirim? ("Cross-context messaging denied")'>
    OpenClaw varsayılan olarak **çapraz sağlayıcı** mesajlaşmayı engeller. Bir araç çağrısı
    Telegram’a bağlıysa siz açıkça izin vermedikçe Discord’a göndermez.

    Ajan için çapraz sağlayıcı mesajlaşmayı etkinleştirin:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Yapılandırmayı düzenledikten sonra gateway’i yeniden başlatın.

  </Accordion>

  <Accordion title='Botun hızlı peş peşe mesajları "yok saydığı" hissi neden oluşuyor?'>
    Kuyruk modu, yeni mesajların uçuş hâlindeki bir çalıştırmayla nasıl etkileşeceğini kontrol eder. Modları değiştirmek için `/queue` kullanın:

    - `steer` - yeni mesajlar mevcut görevi yeniden yönlendirir
    - `followup` - mesajları tek tek çalıştırır
    - `collect` - mesajları toplar ve bir kez yanıt verir (varsayılan)
    - `steer-backlog` - şimdi yönlendirir, sonra birikmiş kuyruğu işler
    - `interrupt` - mevcut çalıştırmayı iptal eder ve temiz başlar

    Followup modları için `debounce:2s cap:25 drop:summarize` gibi seçenekler ekleyebilirsiniz.

  </Accordion>
</AccordionGroup>

## Çeşitli

<AccordionGroup>
  <Accordion title='Anthropic için API anahtarıyla varsayılan model nedir?'>
    OpenClaw’da kimlik bilgileri ve model seçimi ayrıdır. `ANTHROPIC_API_KEY` ayarlamak (veya auth profiles içinde bir Anthropic API anahtarı saklamak) kimlik doğrulamayı etkinleştirir, ancak gerçek varsayılan model `agents.defaults.model.primary` içinde yapılandırdığınız şeydir (örneğin `anthropic/claude-sonnet-4-6` veya `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` görüyorsanız, bu Gateway’in çalışan ajan için beklenen `auth-profiles.json` içinde Anthropic kimlik bilgilerini bulamadığı anlamına gelir.
  </Accordion>
</AccordionGroup>

---

Hâlâ takıldınız mı? [Discord](https://discord.com/invite/clawd) üzerinde sorun veya bir [GitHub discussion](https://github.com/openclaw/openclaw/discussions) açın.
