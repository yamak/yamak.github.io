'use strict';
window.GUIDE = {
  "id": "paper-06",
  "title": "PEARTS",
  "fullTitle": "PEARTS: Provable Execution in Real-Time Embedded Systems",
  "subtitle": "Kesilebilen bir görevin çıktısına, zamanına ve yürütme bütünlüğüne uzaktan nasıl güvenilir?",
  "authors": "Antonio Joia Neto · Norrathep Rattanavipanon · Ivan De Oliveira Nunes",
  "venue": "IEEE S&P 2025",
  "minutes": 50,
  "pdf": "../papers/06-pearts-provable-execution-in-real-time-embedded-systems.pdf",
  "overview": {
    "name": "PEARTS",
    "thesis": "Bir sensör görevi RTOS tarafından kesilse bile, yürütmesine müdahale edilip edilmediğini ve gecikmelerini uzaktan doğrulanabilir kanıta bağlamak.",
    "problem": "Cihazdan gelen ölçümün yanında geçerli bir kimlik doğrulama kodu bulunması, o ölçümün beklenen program tarafından doğru bağlamda üretildiğini tek başına göstermez. Cihazın işletim sistemi veya diğer görevleri ele geçirilmiş olabilir.",
    "gap": "Klasik Proof of Execution yaklaşımları kanıtlanan görevin kesilmeden çalışmasını isteyebilir. Gerçek zamanlı sistemde ise başka görevin acil işi için araya girmesi gerekir. Bütün kesmeleri kapatmak güvenlik ile zamanında hizmet arasında çatışma oluşturur.",
    "solution": "PEARTS, F görevi ile güvenilmeyen FAdv arasında her geçişi Secure World’deki root of trust üzerinden izler. Bellek ve çevre birimi erişimlerinden doğan müdahaleleri ve geçiş zamanlarını rapora kaydeder. Doğrulayıcı kod ölçümü, challenge, kayıtlar ve çıktı üzerindeki doğrulama sonucuna göre karar verir.",
    "example": "Bir sıcaklık görevi ölçümler arasında RTOS uyku çağrısı yapsın. Başka görev bu sırada aynı sensörün yapılandırmasını değiştirirse sonuç etkilenebilir. PEARTS erişimi kaydeder ve kaynağı serbest bırakabilir; uzaktaki doğrulayıcı bu müdahaleyi görüp çıktıyı güvenilir saymayı reddeder.",
    "contribution": "Katkı RT-PoX hedefini tanımlamak ve bunu TrustZone-M destekli MCU ile değiştirilmemiş FreeRTOS yanında gerçekleştirmektir. Bütün kaynakları sürekli kilitlemek yerine müdahale kanıtı ve güvenli zaman ölçümü kullanılır.",
    "takeaway": "Görevin kesilmesi kanıtı otomatik bozmaz; gizli kalan bağlam veya zaman müdahalesi kanıtın güvenilirliğini bozar.",
    "limit": "PEARTS kötü niyetli RTOS’a karşı zamanında çalıştırılmayı garanti etmez. Müdahaleyi kaydetmek onu engellemek değildir. Donanım, Secure World root of trust ve anahtar koruması güvenilir kabul edilir.",
    "route": [
      "Açık: atomik PoX ile RTOS çatışması",
      "Fikir: güvenli geçiş ve müdahale kaydı",
      "Sonuç: kesilebilir yürütme için uzaktan kanıt"
    ],
    "page": 1
  },
  "sections": [
    {
      "id": "problem",
      "title": "1. Ölçümün imzası, ölçümün hikâyesi değildir",
      "kicker": "TEMEL FİKİR",
      "page": 1,
      "lead": "Beklenen programın beklenen bağlamla çalıştığını bilmek, yalnız çıktının kimden geldiğini bilmekten fazlasıdır.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Remote attestation</h3><p>Cihazın yazılım durumuna ilişkin kanıtı uzaktaki doğrulayıcıya verir. Bellekte beklenen kodun bulunması, belirli çıktının gerçekten o kodun yürütülmesiyle üretildiğini tek başına kanıtlamaz.</p></div><div class=\"card\"><h3>Proof of Execution</h3><p>Belirli bir görevin yürütülmesini ve ürettiği çıktıyı kanıta bağlar. Klasik atomik yürütme koşulu, araya başka görev veya kesme girmesini sınırlar. Bu koşul gerçek zamanlı görev paylaşımıyla çatışabilir.</p></div></div><div class=\"callout\">PEARTS fiziksel sıcaklığın doğru olduğunu kanıtlamaz; sayısallaştırma sonrasındaki yazılım yürütmesinin bütünlüğünü modelin sınırları içinde ele alır.</div>"
    },
    {
      "id": "goals",
      "title": "2. RT-PoX için beş koşul",
      "kicker": "GÜVENLİK HEDEFİ",
      "page": 4,
      "lead": "Kesilebilir yürütmenin hangi özellikleri koruması gerektiğini açıkça tanımla.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Özellik</th><th>İstenen koşul</th></tr></thead><tbody><tr><td>F immutability</td><td>Kanıtlanan kodun değişiminin gizlenememesi</td></tr><tr><td>Execution flow integrity</td><td>Doğru giriş, çıkış ve güvenli geri dönüş</td></tr><tr><td>Context integrity</td><td>Bellek, kayıtlar ve kullanılan I/O bağlamına müdahalenin gizlenememesi</td></tr><tr><td>Timing integrity</td><td>FAdv kaynaklı duraklamaların doğrulayıcıya ölçülmüş olarak bildirilmesi</td></tr><tr><td>RTOS availability</td><td>RTOS’un zamanlama ve kaynak görevleriyle birlikte çalışabilme</td></tr></tbody></table></div><p>Son özellik, ele geçirilmiş RTOS’un F’yi her durumda deadline içinde çalıştıracağı anlamına gelmez. RT-PoX, güvenilir scheduling mekanizması kurmak yerine doğrulayıcının müdahale ve gecikmeyi değerlendirebilmesini hedefler. Bu ayrım makalenin güvenlik iddiasını doğru okumak için temeldir.</p>"
    },
    {
      "id": "architecture",
      "title": "3. F, FAdv ve FRoT aynı yerde yaşamaz",
      "kicker": "MİMARİ",
      "page": 5,
      "lead": "Kanıtlanan uygulama da güvenilmeyen RTOS da Non-Secure World’dedir.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>F ve FAdv</h3><p>F, doğrulanacak görevin kendi kodu ve bağımlılıklarıdır. FAdv geri kalan görevleri, RTOS’u ve dış kesme hizmetlerini kapsar. F’nin gerektirdiği ISR’ler gerekiyorsa kendi binary’sine bağlanır; bütün kesmeler otomatik olarak F’ye ait değildir.</p></div><div class=\"card\"><h3>FRoT</h3><p>Secure World’deki root of trust, geçişleri yönetir, kayıtları tutar ve raporu doğrulanabilir biçimde üretir. Anahtar ve güvenli timer yalnız bu taraftan erişilebilirdir. F’nin kendisi bu güven tabanının içine taşınmaz.</p></div></div><p>F’yi doğrudan Secure World’e koymak root of trust ile uygulamanın güven sınırını karıştırır. PEARTS uygulama belleğinin görünümünü değiştirerek farklı görevlerin kanıtlanmasını sağlar; bu, normal bir ayrıcalık seviyesini bütün uygulamaya vermekten farklıdır.</p>"
    },
    {
      "id": "esr",
      "title": "4. Elastic Secure Region neden elastik?",
      "kicker": "BELLEK GÖRÜNÜMÜ",
      "page": 7,
      "lead": "Aynı alanın güvenlik niteliği, hangi tarafın çalıştığına göre değişir.",
      "html": "<p>ESR, F’nin kodunu ve verisini içerir. F çalışırken Non-Secure erişime açılır. FAdv’ye geçilirken Secure olarak işaretlenir; böylece FAdv’den erişim bir fault üretip FRoT’ye görünür olur. F’nin kullandığı çevre birimleri de geçişte benzer şekilde izlenir.</p><div class=\"lab\"><div class=\"lab-header\"><h3>Yürütme bağlamına göre koruma</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"pea-world\">Çalışan taraf</label><select id=\"pea-world\"><option value=\"f\">F çalışıyor</option><option value=\"adv\">FAdv çalışıyor</option></select><div class=\"state-box\" id=\"pea-world-out\" aria-live=\"polite\"></div></div></div><div class=\"callout\">ESR, F’nin daima Secure World’de çalıştığı sabit bir enclave değildir. Bölge niteliğinin değiştirilmesi izleme için bir araçtır.</div>"
    },
    {
      "id": "interference",
      "title": "5. Müdahaleyi kaydetmek, kaynağı kilitlemek değildir",
      "kicker": "KRİTİK AYRIM",
      "page": 7,
      "lead": "PEARTS başka gerçek zamanlı işleri durdurmamak için müdahaleyi rapora geçirip erişimi serbest bırakabilir.",
      "html": "<p>FAdv, F’nin ESR alanına veya F’nin kullandığı bir çevre birimine erişmek isterse interference exception doğar. FRoT erişimin türünü Elog’a yazar. Sonra bölgeyi veya aygıtı erişilebilir kılarak FAdv’nin devam etmesini sağlar. Bu durumda kanıt temiz değildir; doğrulayıcı olayı görür.</p><div class=\"lab\"><div class=\"lab-header\"><h3>Bir erişimin sonucu</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"pea-access\">FAdv davranışı</label><select id=\"pea-access\"><option value=\"none\">F ile ilgisiz kaynağı kullan</option><option value=\"memory\">F’nin ESR belleğine eriş</option><option value=\"sensor\">F’nin kullandığı sensörü yeniden yapılandır</option></select><div class=\"state-box\" id=\"pea-access-out\" aria-live=\"polite\"></div></div></div><div class=\"callout\">Tasarımın temel garantisi, müdahaleli çıktının temiz yürütme gibi kabul edilmesini önlemektir. “Her müdahaleyi durdurur” demek mekanizmayı yanlış anlatır.</div>"
    },
    {
      "id": "transitions",
      "title": "6. Kesme geldiğinde bütün yol",
      "kicker": "GEÇİŞLER",
      "page": 10,
      "lead": "Kayıtlar ve dönüş adresi korunmadan yalnız bellek görünümünü değiştirmek yeterli değildir.",
      "html": "<div class=\"lab\"><div class=\"lab-header\"><h3>F → FRoT → FAdv → FRoT → F</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><div id=\"pea-route-nodes\" class=\"stage-nodes\"></div><div class=\"state-box\" id=\"pea-route-out\" aria-live=\"polite\"></div><div class=\"controls\"><button type=\"button\" class=\"small-button\" id=\"pea-route-prev\">← Önceki</button><button type=\"button\" class=\"small-button\" id=\"pea-route-next\">Sonraki →</button><button type=\"button\" class=\"small-button\" id=\"pea-route-reset\">Başa dön</button></div></div></div><p>FRoT, F’nin kayıt bağlamını güvenli tarafta saklar; FAdv bağlamını kurar ve geçişi zamanlar. Geri dönerken saklanan F bağlamı ve doğru dönüş noktası geri yüklenir. FAdv’nin doğrudan F kodunun ortasına atlaması ESR koruması nedeniyle görünür bir müdahale oluşturur. İç kontrol akışının her dalını kaydeden genel bir CFA izine eşit değildir.</p>"
    },
    {
      "id": "shadow",
      "title": "7. RTOS değişmeden F nasıl görev gibi görünür?",
      "kicker": "SHADOW TASK",
      "page": 10,
      "lead": "Bir gölge görev, RTOS’un zamanlama arayüzü ile korunan F bağlamı arasında köprü olur.",
      "html": "<p>RTOS, Non-Secure World’de normal API’siyle bir shadow task oluşturur. Bu görev çalıştırıldığında FRoT’ye başlatma veya sürdürme isteği verir. F’den gelen desteklenen sistem çağrıları da önce FRoT tarafından yakalanır, sonra shadow task üzerinden gerçek RTOS hizmetine yönlendirilir.</p><div class=\"two-col\"><div class=\"card\"><h3>Zaman çağrıları</h3><p>F uyumak, beklemek veya senkronizasyon yapmak istediğinde RTOS yine işini yapar. FRoT bu sırada dönüş gecikmesini kendi timer’ıyla ölçer. RTOS’un kendi saatine körü körüne güvenilmez.</p></div><div class=\"card\"><h3>Sınır</h3><p>Her API’nin bütün veri paylaşım biçimleri otomatik güvenli değildir. F kendi hesaplama kodunu / bağımlılıklarını içermeli; kullanılan syscall arayüzü PEARTS’in desteklediği enstrümantasyona uymalıdır.</p></div></div>"
    },
    {
      "id": "resources",
      "title": "8. Yalnız CPU belleğini korumak yeterli değil",
      "kicker": "I/O VE DMA",
      "page": 8,
      "lead": "Sensör yapılandırması ve DMA, program aynı kalsa da kullanılan veriyi değiştirebilir.",
      "html": "<p>Başlatmada FRoT, çevre birimlerini izlenebilir güvenli duruma alır. F bir aygıta ihtiyaç duyduğunda FRoT erişimi açıp aygıtı F ile ilişkilendirir. FAdv döneminde bu kaynağa müdahale kayda geçer. Kullanılmayan kaynaklar FAdv’nin çalışması için serbest kalabilir.</p><p>DMA CPU’dan bağımsız yazabilir. FRoT başlatmada ESR’ye yazan önceden yapılandırılmış kanalları kontrol eder; süreç boyunca DMA yapılandırma yetkisini güvenli tarafta tutar ve istekleri API üzerinden izler. F’nin dinamik belleği gerekiyorsa ESR içinde ayrı allocator kullanılır.</p><div class=\"callout\">Fiziksel ortamın sensör değerini değiştirmesi ile cihaz yazılımının sensör yapılandırmasını bozması farklı olaylardır. RT-PoX, fiziksel gerçekliğin doğruluğunu tek başına onaylamaz.</div>"
    },
    {
      "id": "report",
      "title": "9. Rapor hangi parçaları birbirine bağlar?",
      "kicker": "KRİPTOGRAFİK KANIT",
      "page": 9,
      "lead": "Çıktı, kod, challenge ve kayıtlar aynı doğrulama bağlamına ait olmalıdır.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Alan</th><th>Ne anlatır?</th></tr></thead><tbody><tr><td>H(F)</td><td>Başlangıçta ölçülen F kodu</td></tr><tr><td>Chal</td><td>Bu isteğe ait tazelik değeri</td></tr><tr><td>Elog</td><td>Bağlama yapılan dış müdahaleler</td></tr><tr><td>Tlog</td><td>Geçişler, işlemler ve güvenli zaman damgaları</td></tr><tr><td>Θ</td><td>F’nin ürettiği çıktı</td></tr><tr><td>σF</td><td>Bu parçaların birlikte kimlik doğrulaması</td></tr></tbody></table></div><p>Makale soyut anlatımında <code>Sign(H(F) || Chal || Elog || Tlog || Θ)</code> biçimini kullanır. Prototip finalization ölçümleri HMAC ve SHA224 donanım desteğiyle yapılır. Soyut açık anahtarlı imza anlatımıyla bu prototipin simetrik doğrulama mekanizmasını aynı algoritma gibi düşünme.</p><p>F yalnız geçerli bitişine ulaştığında rapor sonlandırılır. Başta sabitlenen kod ölçümü ve challenge, başka yürütmeden alınan sonucun bu isteğin temiz kanıtı gibi yeniden sunulmasını önlemeye yardım eder.</p>"
    },
    {
      "id": "verifier",
      "title": "10. Geçerli doğrulama etiketi her zaman kabul değildir",
      "kicker": "DOĞRULAYICI",
      "page": 6,
      "lead": "Doğrulayıcı bütünlüğü doğruladıktan sonra uygulama politikasını da değerlendirmelidir.",
      "html": "<div class=\"lab\"><div class=\"lab-header\"><h3>Örnek kabul politikası</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label><input type=\"checkbox\" id=\"pea-auth\" checked> Rapor kimlik doğrulaması, kod ölçümü ve challenge geçerli</label><br><label><input type=\"checkbox\" id=\"pea-interference\"> Elog içinde müdahale var</label><br><label for=\"pea-delay\">En uzun örnek duraklama (ms)</label><input type=\"range\" id=\"pea-delay\" min=\"0\" max=\"20\" value=\"3\" step=\"1\"><div class=\"state-box\" id=\"pea-verdict\" aria-live=\"polite\"></div></div></div><p>Bu modelde en uzun izinli duraklama örnek olarak 5 ms seçilmiştir; makaleden alınmış evrensel eşik değildir. Gerçek doğrulayıcı, Tlog içindeki ilgili çağrı ve geçişlerin uygulamaya özgü zaman ilişkilerini kontrol eder. Yalnız bütün kayda tek maksimum eşik uygulamak her uygulama için yeterli olmaz.</p>"
    },
    {
      "id": "evaluation",
      "title": "11. Mikro gecikmeler ile uygulama maliyeti",
      "kicker": "DENEYLER",
      "page": 11,
      "lead": "Tek bir geçişin cycle sayısı bütün görev süresindeki artışı anlatmaz.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Ölçüm</th><th>Bildirilen sonuç</th><th>Koşul</th></tr></thead><tbody><tr><td>Başlatma rutini</td><td>En çok 8512 cycle</td><td>NUCLEO-L552ZE-Q, 110 MHz</td></tr><tr><td>Sonlandırma rutini</td><td>3252–14332 cycle</td><td>Rapor / log boyutuna bağlı</td></tr><tr><td>Interference exception</td><td>En çok 92 cycle</td><td>Prototip ölçümü</td></tr><tr><td>F uygulama süresinde artış</td><td>%10,6–%19,8</td><td>Tablo 4 ilk satırı, 1 kHz / tek görev düzeni</td></tr><tr><td>Ayrılan varsayılan log RAM’i</td><td>2,4 KB</td><td>Deneylerdeki rapor metadata’sı ve log için</td></tr></tbody></table></div><p>Cortex-M33 prototipi TrustZone-M ve FreeRTOS kullanır. Görev sayısı ve kesme sıklığı arttığında maliyetler değişir. Tablo 4–7 birden fazla uygulama ve düzeni verir. Küçük dispatcher süresi, her uygulamada önemsiz toplam maliyet veya her deadline için uygunluk garantisi değildir.</p>"
    },
    {
      "id": "limits",
      "title": "12. Güvenilir çıktı ile garantili hizmeti ayır",
      "kicker": "SINIRLAR VE SENTEZ",
      "page": 5,
      "lead": "Bir sistem kanıtı reddettirebilir; kanıtı gizlice temiz gösterememesi ayrı güvenlik özelliğidir.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Güvenilenler</h3><p>TrustZone-M erişim denetimleri, Secure World FRoT, anahtar koruması ve güvenli timer doğru çalışmalıdır. Fiziksel / donanımsal müdahaleler bu çalışmanın modelinin dışındadır. F’nin kendi işlevsel mantığı ve sensörün fiziksel doğruluğu ayrıca değerlendirilir.</p></div><div class=\"card\"><h3>Garanti edilmeyenler</h3><p>Kötü niyetli veya hatalı RTOS F’yi geciktirebilir ya da çalıştırmayabilir. PEARTS bunun yerine geçerli rapordaki müdahale ve zaman izini doğrulanabilir kılar. Kaynakları sürekli bloke ederek her F yürütmesini temiz tutmayı hedeflemez.</p></div></div><p>Kendi notunu şu soruyla bitir: uygulamam bozulmayı önlemek mi, bozulmuş sonucu kabul etmemek mi istiyor? PEARTS ikinci hedef için uzaktan kanıt üretir; kullanılabilirlik koruması ve güvenilir scheduling ek mekanizmalar gerektirebilir.</p>"
    }
  ],
  "quiz": [
    {
      "q": "Klasik atomik PoX ile RTOS neden çatışabilir?",
      "options": [
        "Başka zaman kritik işlerin araya girmesi gerekir.",
        "RTOS hiçbir zaman kesme kullanmaz.",
        "PoX yalnız diskte çalışır."
      ],
      "correct": 0,
      "why": "Kesintisiz F yürütmesi, eşzamanlı gerçek zamanlı görevlerin zamanında hizmet almasını engelleyebilir."
    },
    {
      "q": "F normal yürütmesinde hangi dünyadadır?",
      "options": [
        "Daima Secure World",
        "Non-Secure World; ESR görünümü geçişlerde değişir",
        "Ayrı bir fiziksel işlemcide"
      ],
      "correct": 1,
      "why": "FRoT Secure World’dedir; F ve RTOS Non-Secure tarafta kalır."
    },
    {
      "q": "FAdv F’nin sensörüne müdahale ederse PEARTS ne yapabilir?",
      "options": [
        "Her durumda sonsuza kadar erişimi engeller.",
        "Hiç kayıt tutmadan bırakır.",
        "Müdahaleyi kaydeder ve kaynağı serbest bırakır."
      ],
      "correct": 2,
      "why": "Availability ile birlikte çalışmak için müdahale gizlenmez; erişim loglandıktan sonra FAdv devam edebilir."
    },
    {
      "q": "Raporun kimlik doğrulaması geçerli ama Elog doluysa ne çıkar?",
      "options": [
        "Politika değerlendirmesi gerekir; temiz yürütme kabulü otomatik değildir.",
        "F kesinlikle doğru çalışmıştır.",
        "Challenge’a artık gerek yoktur."
      ],
      "correct": 0,
      "why": "Etiket raporun bütünlüğünü doğrular; içeriğindeki müdahale ve zaman bilgisi ayrıca değerlendirilir."
    },
    {
      "q": "Chal hangi sorunu hedefler?",
      "options": [
        "RAM hizalaması",
        "Eski raporun yeni istek için tekrar sunulması",
        "Sensörün fiziksel kalibrasyonu"
      ],
      "correct": 1,
      "why": "Challenge tazeliği bu RT-PoX isteğine bağlar; kod, log ve çıktıyla birlikte doğrulanır."
    },
    {
      "q": "PEARTS ele geçirilmiş RTOS’a rağmen F deadline’ını garanti eder mi?",
      "options": [
        "Evet, bütün görev setlerinde",
        "Yalnız saat 1 kHz ise",
        "Hayır; geçişleri zamanlar ve doğrulayıcıya kanıt verir."
      ],
      "correct": 2,
      "why": "RT-PoX güvenilir scheduling değildir; gecikmiş veya hiç tamamlanmamış yürütme yine mümkün olabilir."
    },
    {
      "q": "Shadow task ne sağlar?",
      "options": [
        "Değiştirilmemiş RTOS’un görev arayüzü ile FRoT arasında köprü",
        "Anahtarı Non-Secure World’e kopyalama",
        "Bütün logları silme"
      ],
      "correct": 0,
      "why": "Normal görev API’siyle yaratılan köprü, F’nin başlatılma / sürdürülme ve syscall yollarını taşır."
    },
    {
      "q": "Örnek demodaki 5 ms eşik nasıl yorumlanmalı?",
      "options": [
        "Makalenin bütün uygulamalar için ispatladığı süre",
        "Öğretici, uygulamaya özgü politikanın bir örneği",
        "Donanımın sabit hata sınırı"
      ],
      "correct": 1,
      "why": "Gerçek doğrulayıcı ilgili uygulamanın zaman koşullarını Tlog üzerinden incelemelidir; 5 ms burada örnektir."
    }
  ],
  "glossary": [
    [
      "RA",
      "Remote attestation: uzak cihazın durumuna ilişkin doğrulanabilir kanıt."
    ],
    [
      "PoX",
      "Proof of Execution: belirli yürütme ile çıktıyı ilişkilendiren kanıt."
    ],
    [
      "RT-PoX",
      "RTOS ile birlikte çalışabilen, kesilebilir yürütme için PoX hedefi."
    ],
    [
      "Prv",
      "Kanıtı üreten prover cihaz."
    ],
    [
      "Vrf",
      "Kanıtı ve uygulama politikasını değerlendiren uzak verifier."
    ],
    [
      "F",
      "Yürütmesi kanıtlanacak görev ve gerekli bağımlılıkları."
    ],
    [
      "FAdv",
      "Diğer görevler, RTOS ve F dışındaki hizmetlerin oluşturduğu taraf."
    ],
    [
      "FRoT",
      "Secure World’deki güven kökü uygulaması."
    ],
    [
      "ESR",
      "F kodu ve verisini içeren, güvenlik niteliği değiştirilen Elastic Secure Region."
    ],
    [
      "TrustZone-M",
      "Arm mikrodenetleyicilerinde Secure / Non-Secure ayrımı sağlayan mimari özellik."
    ],
    [
      "SAU",
      "Adres bölgelerinin güvenlik niteliğini yapılandıran birim."
    ],
    [
      "Elog",
      "Bağlama dış müdahalelerin kayıt dizisi."
    ],
    [
      "Tlog",
      "Geçiş, işlem ve güvenli zaman damgalarının kayıt dizisi."
    ],
    [
      "Chal",
      "Yeni kanıt isteğine ait challenge / tazelik değeri."
    ],
    [
      "H(F)",
      "F binary’sinin başlangıçta alınan kriptografik ölçümü."
    ],
    [
      "Θ",
      "F yürütmesinin ürettiği çıktı."
    ],
    [
      "Shadow task",
      "RTOS ile FRoT arasında görev ve syscall köprüsü."
    ],
    [
      "Interference exception",
      "F bağlamına müdahaleyi FRoT’ye görünür kılan fault."
    ],
    [
      "Secure timer",
      "Güvenilmeyen RTOS’un değiştiremediği zaman ölçüm kaynağı."
    ],
    [
      "DMA",
      "İşlemciden bağımsız bellek transferi yapan aygıt mekanizması."
    ],
    [
      "ISR",
      "Kesme geldiğinde çalışan hizmet rutini."
    ],
    [
      "HMAC",
      "Paylaşılan gizli anahtarla mesaj bütünlüğü ve özgünlüğü doğrulayan mekanizma."
    ],
    [
      "Availability",
      "Hizmetin erişilebilir / çalışabilir kalması; temiz kanıtla aynı hedef değildir."
    ],
    [
      "Trusted scheduling",
      "Görevlerin zamanında yürütülmesini saldırgana rağmen koruma hedefi; PEARTS’in yerine geçmediği mekanizma."
    ]
  ]
};
window.GUIDE.init = function () {
const $=s=>document.querySelector(s);
function world(){$('#pea-world-out').textContent=$('#pea-world').value==='f'?'F aktif: ESR Non-Secure; F kendi kodu/verisine erişir. FAdv’ye geçiş FRoT tarafından izlenir.':'FAdv aktif: ESR ve F’ye bağlı kaynaklar Secure olarak izlenir. Bir erişim fault ile FRoT’ye bildirilir.'}$('#pea-world').onchange=world;world();
function access(){const v=$('#pea-access').value;$('#pea-access-out').textContent=v==='none'?'F’ye ait olmayan kaynak: bu basitleştirilmiş modelde F bağlamı için müdahale kaydı oluşmaz.':v==='memory'?'ESR erişimi → fault → Elog kaydı → kaynak serbest bırakılabilir. Sonuç temiz yürütme gibi kabul edilmez.':'F sensörüne erişim → fault → Elog kaydı → erişim serbest bırakılabilir. Sensör yapılandırmasının gizlice değiştirilmesi raporda görünür olur.'}$('#pea-access').onchange=access;access();
const names=['F','FRoT: çıkış','FAdv','FRoT: dönüş','F sürer'];const texts=['F ESR içinde yürür; bağımlı ISR ve kaynakları kendi yürütme bağlamına dahildir.','F kayıtları güvenli tarafa saklanır; ESR / F kaynakları Secure yapılır ve çıkış zaman damgası yazılır.','RTOS veya başka görev çalışır. F kaynaklarına müdahale olursa Elog’a kaydedilir.','FRoT dönüşü zamanlar, saklanan doğru bağlamı geri yükler ve ESR’yi F’ye açar.','F güvenli dönüş noktasından devam eder. Kesilme kaydı vardır; bunun kabulü uygulamanın zaman politikasına bağlıdır.'];let step=0;function route(){$('#pea-route-nodes').innerHTML=names.map((n,i)=>'<div class="stage-node '+(i===step?'active':'')+'">'+n+'</div>').join('');$('#pea-route-out').textContent=texts[step];$('#pea-route-prev').disabled=step===0;$('#pea-route-next').disabled=step===names.length-1}$('#pea-route-prev').onclick=()=>{step=Math.max(0,step-1);route()};$('#pea-route-next').onclick=()=>{step=Math.min(names.length-1,step+1);route()};$('#pea-route-reset').onclick=()=>{step=0;route()};route();
function verdict(){const auth=$('#pea-auth').checked,interference=$('#pea-interference').checked,delay=Number($('#pea-delay').value);const reasons=[];if(!auth)reasons.push('kimlik doğrulaması, kod ölçümü veya challenge geçersiz');if(interference)reasons.push('Elog içinde müdahale var');if(delay>5)reasons.push('örnek 5 ms duraklama sınırı aşıldı');$('#pea-verdict').textContent='Duraklama: '+delay+' ms. '+(reasons.length?'REDDET: '+reasons.join('; ')+'.':'KABUL: bu örnek politikada rapor temiz ve zaman koşulu sağlanıyor.')}['pea-auth','pea-interference','pea-delay'].forEach(id=>$('#'+id).oninput=verdict);verdict();
};
