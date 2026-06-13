// ============================================
// FutMundial26 — Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // ---- Clear stale localStorage cache on every page load ----
  // This prevents old/cached content from showing on devices
  try {
    const cacheVersion = 'fm26_v5'; // Bump this to force cache clear
    if (localStorage.getItem('fm26_cache_version') !== cacheVersion) {
      // Remove all fm26_ cached data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fm26_') && key !== 'fm26_cache_version') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('fm26_cache_version', cacheVersion);
    }
  } catch(e) { /* localStorage not available */ }

  // ---- Navbar scroll effect ----
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ---- Hamburger Menu ----
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      }
    });
  }

  // ---- Faceoff Slider ----
  const slides = document.querySelector('.faceoff-slides');
  const dots = document.querySelectorAll('.slider-dots .dot');
  const prevBtn = document.querySelector('.slider-btn.prev');
  const nextBtn = document.querySelector('.slider-btn.next');
  let currentSlide = 0;
  const totalSlides = dots.length || 3;

  function goToSlide(n) {
    currentSlide = ((n % totalSlides) + totalSlides) % totalSlides;
    if (slides) slides.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

  // Auto-slide every 6 seconds
  if (dots.length > 0) {
    setInterval(() => goToSlide(currentSlide + 1), 6000);
  }

  // ---- TV Channels Setup (GoPelotero + National) ----
  const DEFAULT_CHANNELS = [
    { name: "🏆 RTRTV Mundial", flag: "🏆", url: "https://tv3ecuador.site/hls/stream/index.m3u8", type: "hls" },
    { name: "TyC Sports", flag: "🇦🇷 AR", url: "https://amg26268-amg26268c14-freelivesports-emea-10267.playouts.now.amagi.tv/ts-us-e2-n2/playlist/amg26268-sportsstudio-tycsports-freelivesportsemea/playlist.m3u8", type: "hls" },
    { name: "ADN 40 (México)", flag: "🇲🇽 MX", url: "https://mdstrm.com/live-stream-playlist/60b578b060947317de7b57ac.m3u8", type: "hls" },
    { name: "Azteca Internacional", flag: "🇲🇽 MX", url: "https://azt-mun.otteravision.com/azt/mun/mun.m3u8", type: "hls" },
    { name: "Latina Televisión", flag: "🇵🇪 PE", url: "https://redirector.rudo.video/hls-video/567ffde3fa319fadf3419efda25619456231dfea/latina/latina.smil/playlist.m3u8", type: "hls" },
    { name: "Ecuavisa (Quito)", flag: "🇪🇨 EC", url: "https://redirector.dps.live/hls-video/c54ac2799874375c81c1672abb700870537c5223/ecuavisa/ecuavisa.smil/playlist.m3u8", type: "hls" },
    { name: "Ecuavisa (Guayaquil)", flag: "🇪🇨 EC", url: "https://dai.google.com/linear/hls/event/GyPkTVDZSXGhpOvxPK7m2g/master.m3u8", type: "hls" },
    { name: "13C (Chile)", flag: "🇨🇱 CL", url: "https://origin.dpsgo.com/ssai/event/GI-9cp_bT8KcerLpZwkuhw/master.m3u8", type: "hls" },
    { name: "Canal 26", flag: "🇦🇷 AR", url: "https://stream-gtlc.telecentro.net.ar/hls/canal26hls/main.m3u8", type: "hls" },
    { name: "TeleSUR", flag: "🇻🇪 VE", url: "https://mblesmain01.telesur.ultrabase.net/mbliveMain/hd/chunklist.m3u8", type: "hls" },
    { name: "DW Español", flag: "🇩🇪 DE", url: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8", type: "hls" }
  ];


  // Load channels from localStorage or set defaults
  let channels = [];
  const storedChannels = localStorage.getItem('fm26_channels');
  if (storedChannels) {
    channels = JSON.parse(storedChannels);
  } else {
    channels = [...DEFAULT_CHANNELS];
    localStorage.setItem('fm26_channels', JSON.stringify(channels));
  }

  // Live TV player fallbacks
  function playHLS(url, container) {
    container.innerHTML = `
      <video id="hls-video" style="width:100%;height:100%;position:absolute;top:0;left:0;background:#000;" controls autoplay></video>
    `;
    const video = document.getElementById('hls-video');
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn('HLS player fatal error, trying fallback as iframe:', url);
          playIframe(url, container);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      playIframe(url, container);
    }
  }

  function playIframe(url, container) {
    let playUrl = url;
    let sandboxAttr = 'sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"';
    
    if (url.includes('canalesdeportivos.net/')) {
      // Dynamic routing through our same-origin PHP proxy
      const match = url.match(/canalesdeportivos\.net\/([a-zA-Z0-9_-]+\.php)/);
      if (match) {
        playUrl = `proxy.php?canal=${match[1]}`;
        // Keep allow-popups in sandbox to prevent player script failures
        sandboxAttr = 'sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"';
      }
    }

    container.innerHTML = `
      <iframe src="${playUrl}" style="width:100%;height:100%;position:absolute;top:0;left:0;border:none;background:#000;" ${sandboxAttr} allow="autoplay; encrypted-media" allowfullscreen></iframe>
    `;
  }

  // Render homepage live channels button list
  const liveChannelsContainer = document.querySelector('.live-channels');
  const playerContainer = document.getElementById('live-player');
  if (liveChannelsContainer && playerContainer) {
    // Show only first 10 on home for aesthetic cleanliness
    const homeChannelsList = channels.slice(0, 10);
    liveChannelsContainer.innerHTML = homeChannelsList.map((ch, idx) => `
      <button class="channel-btn ${idx === 0 ? 'active' : ''}" data-url="${ch.url}" data-type="${ch.type}">${ch.flag.split(' ').pop() || ch.flag} ${ch.name}</button>
    `).join('');

    // Autoplay first channel on home
    if (homeChannelsList.length > 0) {
      const firstCh = homeChannelsList[0];
      if (firstCh.type === 'iframe') playIframe(firstCh.url, playerContainer);
      else playHLS(firstCh.url, playerContainer);
    }

    // Bind click handlers
    const channelBtns = liveChannelsContainer.querySelectorAll('.channel-btn');
    channelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        channelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const url = btn.dataset.url;
        const type = btn.dataset.type || 'hls';
        if (type === 'iframe') playIframe(url, playerContainer);
        else playHLS(url, playerContainer);
      });
    });
  }

  // Render en vivo page channel grid
  const envivoChannelsContainer = document.getElementById('envivo-channels');
  const playerContainerEnvivo = document.getElementById('live-player-envivo');
  if (envivoChannelsContainer && playerContainerEnvivo) {
    envivoChannelsContainer.innerHTML = channels.map((ch, idx) => `
      <div class="ch-btn ${idx === 0 ? 'active' : ''}" data-url="${ch.url}" data-type="${ch.type}">
        <div class="ch-flag">${ch.flag.split(' ').pop() || ch.flag}</div>
        <div class="ch-name">${ch.name}</div>
        <div class="ch-status">● EN VIVO</div>
      </div>
    `).join('');

    // Autoplay first channel on envivo page
    if (channels.length > 0) {
      const firstCh = channels[0];
      if (firstCh.type === 'iframe') playIframe(firstCh.url, playerContainerEnvivo);
      else playHLS(firstCh.url, playerContainerEnvivo);
    }

    // Bind click handlers
    const chBtns = envivoChannelsContainer.querySelectorAll('.ch-btn');
    chBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const url = btn.dataset.url;
        const type = btn.dataset.type || 'hls';
        if (type === 'iframe') playIframe(url, playerContainerEnvivo);
        else playHLS(url, playerContainerEnvivo);
      });
    });
  }

  // ---- Viewer Count Animation ----
  const viewerEl = document.getElementById('viewer-count');
  if (viewerEl) {
    setInterval(() => {
      const base = 1247;
      const variation = Math.floor(Math.random() * 200) - 100;
      viewerEl.textContent = (base + variation).toLocaleString();
    }, 5000);
  }

  // ---- News Loading System (always fresh from JSON, no cache) ----
  async function loadArticles() {
    try {
      const res = await fetch('data/articles.json?t=' + Date.now());
      const articles = await res.json();
      return articles;
    } catch (e) {
      console.error('Error fetching articles', e);
      return [];
    }
  }

  const articlesGrid = document.getElementById('articles-grid');
  const categoryTabs = document.getElementById('category-tabs');
  const articlesList = await loadArticles();

  if (articlesGrid) {
    renderArticles(articlesList, 'all', articlesGrid);

    if (categoryTabs) {
      categoryTabs.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          categoryTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          renderArticles(articlesList, tab.dataset.category, articlesGrid);
        });
      });
    }
  }

  const noticiasGrid = document.getElementById('noticias-grid');
  const noticiasCategoryTabs = document.getElementById('category-tabs-noticias');
  if (noticiasGrid) {
    renderArticles(articlesList, 'all', noticiasGrid);

    if (noticiasCategoryTabs) {
      noticiasCategoryTabs.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          noticiasCategoryTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          renderArticles(articlesList, tab.dataset.category, noticiasGrid);
        });
      });
    }
  }

  function renderArticles(articles, category, gridElement) {
    const filtered = category === 'all' ? articles : articles.filter(a => a.category === category);
    if (filtered.length === 0) {
      gridElement.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:3rem;grid-column: 1/-1;">No hay noticias en esta categoría.</p>';
      return;
    }

    gridElement.innerHTML = filtered.map(article => `
      <article class="article-card" onclick="window.location.href='noticia.html?id=${article.id}'">
        <div class="thumb">
          <img src="${article.image}" alt="${article.title}" loading="lazy">
          <span class="category-badge">${article.categoryIcon || '📰'} ${article.categoryLabel || 'NOTICIAS'}</span>
        </div>
        <div class="content">
          <h3>${article.title}</h3>
          <div class="meta">
            <span><i class="far fa-clock"></i> ${article.time}</span>
            <span><i class="far fa-user"></i> ${article.author}</span>
            <span><i class="far fa-comment"></i> ${article.comments || 0}</span>
            <span><i class="far fa-eye"></i> ${article.views || 0}</span>
          </div>
          <p class="excerpt">${article.excerpt}</p>
          <span class="read-more">Leer más <i class="fas fa-arrow-right"></i></span>
        </div>
      </article>
    `).join('');
  }

  // ---- TheSportsDB Dynamic Integration (World Cup League 4429) ----

  // Helper for flag emojis mapping English country names
  function getFlagEmoji(teamName) {
    if (!teamName) return '🏳️';
    const cleanName = teamName.toLowerCase().trim();
    const flags = {
      'argentina': '🇦🇷', 'brazil': '🇧🇷', 'mexico': '🇲🇽', 'canada': '🇨🇦',
      'usa': '🇺🇸', 'united states': '🇺🇸', 'colombia': '🇨🇴', 'ecuador': '🇪🇨',
      'england': '🇬🇧', 'france': '🇫🇷', 'germany': '🇩🇪', 'spain': '🇪🇸',
      'netherlands': '🇳🇱', 'portugal': '🇵🇹', 'uruguay': '🇺🇾', 'chile': '🇨🇱',
      'peru': '🇵🇪', 'italy': '🇮🇹', 'croatia': '🇭🇷', 'belgium': '🇧🇪',
      'morocco': '🇲🇦', 'senegal': '🇸🇳', 'nigeria': '🇳🇬', 'japan': '🇯🇵',
      'south korea': '🇰🇷', 'australia': '🇦🇺', 'denmark': '🇩🇰', 'poland': '🇵🇱',
      'switzerland': '🇨🇭', 'sweden': '🇸🇪', 'ukraine': '🇺🇦', 'austria': '🇦🇹',
      'turkey': '🇹🇷', 'saudi arabia': '🇸🇦', 'iran': '🇮🇷', 'tunisia': '🇹🇳',
      'ghana': '🇬🇭', 'cameroon': '🇨🇲', 'costa rica': '🇨🇷', 'paraguay': '🇵🇾',
      'wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'bosnia-herzegovina': '🇧🇦',
      'czech republic': '🇨🇿', 'slovakia': '🇸🇰', 'hungary': '🇭🇺',
      'romania': '🇷🇴', 'albania': '🇦🇱', 'slovenia': '🇸🇮', 'georgia': '🇬🇪',
      'serbia': '🇷🇸', 'venezuela': '🇻🇪', 'bolivia': '🇧🇴', 'panama': '🇵🇦',
      'honduras': '🇭🇳', 'el salvador': '🇸🇻', 'guatemala': '🇬🇹', 'jamaica': '🇯🇲',
      'algeria': '🇩🇿', 'egypt': '🇪🇬'
    };
    return flags[cleanName] || '🏳️';
  }

  // Countdown Hero Widget
  const countdownEl = document.getElementById('countdown-timer');
  if (countdownEl) {
    const matchInfoEl = countdownEl.closest('.countdown-card');
    const nextMatchText = matchInfoEl ? matchInfoEl.querySelector('.next-match') : null;

    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4429`)
      .then(res => res.json())
      .then(data => {
        let nextMatch = null;
        if (data && data.events && data.events.length > 0) {
          const now = new Date();
          for (const ev of data.events) {
            let evTs = ev.strTimestamp || `${ev.dateEvent}T${ev.strTime}`;
            if (evTs && !evTs.endsWith('Z') && !evTs.includes('+')) evTs += 'Z';
            const eventTime = new Date(evTs);
            if (eventTime > now) {
              nextMatch = ev;
              break;
            }
          }
          if (!nextMatch) nextMatch = data.events[0];
        }

        if (nextMatch) {
          // TheSportsDB timestamps are UTC but sometimes missing the 'Z' suffix
          let tsStr = nextMatch.strTimestamp || `${nextMatch.dateEvent}T${nextMatch.strTime}`;
          if (tsStr && !tsStr.endsWith('Z') && !tsStr.includes('+')) tsStr += 'Z';
          const matchDate = new Date(tsStr);
          if (nextMatchText) {
            const grp = nextMatch.strGroup ? ` — Grupo ${nextMatch.strGroup}` : '';
            nextMatchText.textContent = `${getFlagEmoji(nextMatch.strHomeTeam)} ${nextMatch.strHomeTeam} vs ${nextMatch.strAwayTeam} ${getFlagEmoji(nextMatch.strAwayTeam)}${grp}`;
          }

          function runCountdown() {
            const now = new Date();
            let diff = matchDate - now;

            if (diff <= 0) {
              const units = countdownEl.querySelectorAll('.countdown-unit .number');
              if (units.length >= 3) {
                units[0].textContent = '🔴';
                units[1].textContent = 'EN';
                units[2].textContent = 'VIVO';
              }
              const labels = countdownEl.querySelectorAll('.countdown-unit .label');
              if (labels.length >= 3) {
                labels[0].textContent = 'PARTIDO';
                labels[1].textContent = 'EN';
                labels[2].textContent = 'CURSO';
              }
              return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            const units = countdownEl.querySelectorAll('.countdown-unit .number');
            if (units.length >= 3) {
              if (days > 0) {
                units[0].textContent = String(days).padStart(2, '0');
                units[1].textContent = String(hours).padStart(2, '0');
                units[2].textContent = String(mins).padStart(2, '0');
                const labels = countdownEl.querySelectorAll('.countdown-unit .label');
                if (labels.length >= 3) {
                  labels[0].textContent = 'DÍAS';
                  labels[1].textContent = 'HORAS';
                  labels[2].textContent = 'MIN';
                }
              } else {
                units[0].textContent = String(hours).padStart(2, '0');
                units[1].textContent = String(mins).padStart(2, '0');
                units[2].textContent = String(secs).padStart(2, '0');
                const labels = countdownEl.querySelectorAll('.countdown-unit .label');
                if (labels.length >= 3) {
                  labels[0].textContent = 'HORAS';
                  labels[1].textContent = 'MIN';
                  labels[2].textContent = 'SEG';
                }
              }
            }
          }

          runCountdown();
          setInterval(runCountdown, 1000);
        } else {
          if (nextMatchText) nextMatchText.textContent = 'Mundial 2026';
        }
      })
      .catch(err => console.error('Error fetching countdown match details', err));
  }

  // Today's matches widget (Homepage Sidebar)
  const todayMatchesContainer = document.getElementById('today-matches-sidebar');
  if (todayMatchesContainer) {
    const todayStr = new Date().toISOString().split('T')[0]; // Format current system date: YYYY-MM-DD
    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${todayStr}&l=4429`)
      .then(res => res.json())
      .then(data => {
        if (data && data.events && data.events.length > 0) {
          todayMatchesContainer.innerHTML = '';

          // Separate finished, live, and upcoming matches
          const finished = data.events.filter(e => e.strStatus === 'FT' || e.strStatus === 'AET' || e.strStatus === 'AP');
          const live = data.events.filter(e => e.strStatus && e.strStatus !== 'FT' && e.strStatus !== 'AET' && e.strStatus !== 'AP' && e.strStatus !== 'NS' && e.strStatus !== '');
          const upcoming = data.events.filter(e => !e.strStatus || e.strStatus === 'NS' || e.strStatus === '');

          let html = '';

          // LIVE matches first
          if (live.length > 0) {
            html += `<div style="padding:4px 8px; font-size:0.7rem; font-weight:800; color:var(--red); text-transform:uppercase; border-bottom:1px solid var(--border-color);">🔴 EN VIVO</div>`;
            live.forEach(event => {
              const homeScore = event.intHomeScore ?? '';
              const awayScore = event.intAwayScore ?? '';
              html += `
                <div class="sidebar-match" style="background:rgba(239,68,68,0.08); border-left:3px solid var(--red);">
                  <span class="live-dot" style="display:inline-block;"></span>
                  <span style="flex:1;">${getFlagEmoji(event.strHomeTeam)} ${event.strHomeTeam} <b style="color:var(--gold); font-size:1.1rem;">${homeScore} - ${awayScore}</b> ${event.strAwayTeam} ${getFlagEmoji(event.strAwayTeam)}</span>
                </div>`;
            });
          }

          // UPCOMING matches
          if (upcoming.length > 0) {
            html += `<div style="padding:4px 8px; font-size:0.7rem; font-weight:800; color:var(--gold); text-transform:uppercase; border-bottom:1px solid var(--border-color);">⏰ POR JUGAR</div>`;
            upcoming.forEach(event => {
              // Convert UTC time to visitor's local timezone
              let utcTs = event.strTimestamp || `${event.dateEvent}T${event.strTime}`;
              if (utcTs && !utcTs.endsWith('Z') && !utcTs.includes('+')) utcTs += 'Z';
              const localTime = new Date(utcTs);
              const timeStr = localTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              html += `
                <div class="sidebar-match">
                  <span class="time">${timeStr}</span>
                  <span>${getFlagEmoji(event.strHomeTeam)} ${event.strHomeTeam} vs ${event.strAwayTeam} ${getFlagEmoji(event.strAwayTeam)}</span>
                </div>`;
            });
          }

          // FINISHED matches
          if (finished.length > 0) {
            html += `<div style="padding:4px 8px; font-size:0.7rem; font-weight:800; color:var(--green); text-transform:uppercase; border-bottom:1px solid var(--border-color);">✅ FINALIZADOS</div>`;
            finished.forEach(event => {
              const homeScore = event.intHomeScore ?? '0';
              const awayScore = event.intAwayScore ?? '0';
              html += `
                <div class="sidebar-match" style="opacity:0.85;">
                  <span class="time" style="background:var(--green); color:#000; font-weight:800; font-size:0.65rem;">FIN</span>
                  <span>${getFlagEmoji(event.strHomeTeam)} ${event.strHomeTeam} <b style="color:var(--gold); font-size:1.05rem;">${homeScore} - ${awayScore}</b> ${event.strAwayTeam} ${getFlagEmoji(event.strAwayTeam)}</span>
                </div>`;
            });
          }

          todayMatchesContainer.innerHTML = html;
        } else {
          // If no games today, fallback to showing next 3 scheduled games
          fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4429`)
            .then(res => res.json())
            .then(nextData => {
              if (nextData && nextData.events && nextData.events.length > 0) {
                todayMatchesContainer.innerHTML = nextData.events.slice(0, 3).map(event => {
                  let fbTs = event.strTimestamp || `${event.dateEvent}T${event.strTime}`;
                  if (fbTs && !fbTs.endsWith('Z') && !fbTs.includes('+')) fbTs += 'Z';
                  const dateObj = new Date(fbTs);
                  const formattedDate = dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                  return `
                    <div class="sidebar-match">
                      <span class="time" style="font-size: 0.7rem; width: auto; padding: 2px 6px; background: var(--bg-secondary); border-radius: 4px; color: var(--gold);">${formattedDate} ${formattedTime}</span>
                      <span>${getFlagEmoji(event.strHomeTeam)} ${event.strHomeTeam} vs ${event.strAwayTeam} ${getFlagEmoji(event.strAwayTeam)}</span>
                    </div>
                  `;
                }).join('');
              } else {
                todayMatchesContainer.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">No hay partidos hoy</div>';
              }
            });
        }
      })
      .catch(err => {
        console.error('Error fetching today matches', err);
        todayMatchesContainer.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">Error al conectar con la API</div>';
      });
  }

  // DEFAULT GROUPS FOR WORLD CUP 2026 (48 teams)
  const DEFAULT_GROUPS = {
    "Grupo A": [
      { strTeam: "Mexico", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "South Korea", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Czech Republic", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "South Africa", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo B": [
      { strTeam: "Canada", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Italy", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Switzerland", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Qatar", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo C": [
      { strTeam: "Brazil", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Morocco", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Scotland", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Haiti", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo D": [
      { strTeam: "USA", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Paraguay", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Australia", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Romania", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo E": [
      { strTeam: "Germany", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Ecuador", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Ivory Coast", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Curacao", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo F": [
      { strTeam: "Netherlands", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Japan", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Poland", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Tunisia", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo G": [
      { strTeam: "Belgium", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Iran", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Egypt", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "New Zealand", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo H": [
      { strTeam: "Spain", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Uruguay", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Saudi Arabia", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Cape Verde", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo I": [
      { strTeam: "France", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Senegal", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Norway", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Bolivia", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo J": [
      { strTeam: "Argentina", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Austria", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Algeria", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Jordan", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo K": [
      { strTeam: "Portugal", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Colombia", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Uzbekistan", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Jamaica", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ],
    "Grupo L": [
      { strTeam: "England", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Croatia", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Ghana", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 },
      { strTeam: "Panama", intPlayed: 0, intWin: 0, intDraw: 0, intLoss: 0, intPoints: 0 }
    ]
  };

  const TEAM_TRANSLATIONS = {
    "Mexico": "México", "South Korea": "Corea del Sur", "Czech Republic": "República Checa", "South Africa": "Sudáfrica",
    "Canada": "Canadá", "Italy": "Italia", "Switzerland": "Suiza", "Qatar": "Catar",
    "Brazil": "Brasil", "Morocco": "Marruecos", "Scotland": "Escocia", "Haiti": "Haití",
    "USA": "USA", "United States": "USA", "Paraguay": "Paraguay", "Australia": "Australia", "Romania": "Rumania",
    "Germany": "Alemania", "Ecuador": "Ecuador", "Ivory Coast": "Costa de Marfil", "Curacao": "Curaçao",
    "Netherlands": "Países Bajos", "Japan": "Japón", "Poland": "Polonia", "Tunisia": "Túnez",
    "Belgium": "Bélgica", "Iran": "Irán", "Egypt": "Egipto", "New Zealand": "Nueva Zelanda",
    "Spain": "España", "Uruguay": "Uruguay", "Saudi Arabia": "Arabia Saudita", "Cape Verde": "Cabo Verde",
    "France": "Francia", "Senegal": "Senegal", "Norway": "Noruega", "Bolivia": "Bolivia",
    "Argentina": "Argentina", "Austria": "Austria", "Algeria": "Argelia", "Jordan": "Jordania",
    "Portugal": "Portugal", "Colombia": "Colombia", "Uzbekistan": "Uzbekistán", "Jamaica": "Jamaica",
    "England": "Inglaterra", "Croatia": "Croacia", "Ghana": "Ghana", "Panama": "Panamá"
  };

  function getStandingsData(apiTable) {
    const groups = JSON.parse(JSON.stringify(DEFAULT_GROUPS));
    
    if (apiTable && apiTable.length > 0) {
      apiTable.forEach(team => {
        let grpName = null;
        if (team.strGroup) {
          const match = team.strGroup.match(/Group\s+([A-L])/i);
          if (match) grpName = 'Grupo ' + match[1].toUpperCase();
        }
        
        if (grpName && groups[grpName]) {
          const existingTeam = groups[grpName].find(t => t.strTeam.toLowerCase().trim() === team.strTeam.toLowerCase().trim());
          if (existingTeam) {
            existingTeam.intPlayed = parseInt(team.intPlayed || 0);
            existingTeam.intWin = parseInt(team.intWin || 0);
            existingTeam.intDraw = parseInt(team.intDraw || 0);
            existingTeam.intLoss = parseInt(team.intLoss || 0);
            existingTeam.intPoints = parseInt(team.intPoints || 0);
          } else {
            groups[grpName].push({
              strTeam: team.strTeam,
              intPlayed: parseInt(team.intPlayed || 0),
              intWin: parseInt(team.intWin || 0),
              intDraw: parseInt(team.intDraw || 0),
              intLoss: parseInt(team.intLoss || 0),
              intPoints: parseInt(team.intPoints || 0)
            });
          }
        }
      });
    }

    // Sort teams inside groups by points
    Object.keys(groups).forEach(grp => {
      groups[grp].sort((a, b) => b.intPoints - a.intPoints);
    });

    return groups;
  }

  // Standings page (grupos.html)
  const groupsFullContainer = document.querySelector('.groups-full');
  if (groupsFullContainer) {
    groupsFullContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--gold);"></i><p style="margin-top:1rem;">Cargando tablas de posiciones en tiempo real...</p></div>';

    fetch('https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4429&s=2026')
      .then(res => res.json())
      .then(data => {
        const apiTable = data ? data.table : [];
        const groups = getStandingsData(apiTable);

        const sortedGroupNames = Object.keys(groups).sort();
        groupsFullContainer.innerHTML = sortedGroupNames.map(grpName => {
          const teamRows = groups[grpName].map(team => {
            const flagEmoji = getFlagEmoji(team.strTeam);
            const teamDisplayName = TEAM_TRANSLATIONS[team.strTeam] || team.strTeam;
            return `
              <tr>
                <td>${flagEmoji} ${teamDisplayName}</td>
                <td>${team.intPlayed}</td>
                <td>${team.intWin}</td>
                <td>${team.intDraw}</td>
                <td>${team.intLoss}</td>
                <td class="pts">${team.intPoints}</td>
              </tr>
            `;
          }).join('');

          return `
            <div class="group-card">
              <div class="gh">⚽ ${grpName}</div>
              <table>
                <thead>
                  <tr>
                    <th>Selección</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${teamRows}
                </tbody>
              </table>
            </div>
          `;
        }).join('');
      })
      .catch(err => {
        console.error('Error fetching standings table', err);
        groupsFullContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:2rem;">Error al cargar las posiciones de los grupos.</p>';
      });
  }

  // Homepage groups preview
  const groupsMiniContainer = document.querySelector('.groups-mini');
  if (groupsMiniContainer) {
    fetch('https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4429&s=2026')
      .then(res => res.json())
      .then(data => {
        const apiTable = data ? data.table : [];
        const groups = getStandingsData(apiTable);

        const sortedGroupNames = Object.keys(groups).sort().slice(0, 4);
        groupsMiniContainer.innerHTML = sortedGroupNames.map(grpName => {
          const teamRows = groups[grpName].map(team => {
            const flagEmoji = getFlagEmoji(team.strTeam);
            const teamDisplayName = TEAM_TRANSLATIONS[team.strTeam] || team.strTeam;
            return `
              <div class="team-row"><span class="flag">${flagEmoji}</span> ${teamDisplayName} <span class="pts">${team.intPoints}</span></div>
            `;
          }).join('');

          return `
            <div class="group-card-mini">
              <div class="group-header">${grpName}</div>
              ${teamRows}
            </div>
          `;
        }).join('');
      })
      .catch(err => console.error('Error rendering mini standings', err));
  }

  // Calendar page (calendario.html)
  const calendarContainer = document.getElementById('match-days');
  if (calendarContainer) {
    calendarContainer.innerHTML = '<div style="text-align:center; padding: 4rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--gold);"></i><p style="margin-top:1rem;">Cargando fixture y marcadores en vivo...</p></div>';

    Promise.all([
      fetch('https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4429').then(r => r.json().catch(() => ({ events: [] }))),
      fetch('https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4429').then(r => r.json().catch(() => ({ events: [] })))
    ]).then(([pastData, nextData]) => {
      const pastEvents = (pastData && pastData.events) ? pastData.events : [];
      const nextEvents = (nextData && nextData.events) ? nextData.events : [];

      const allEventsMap = {};
      [...pastEvents, ...nextEvents].forEach(ev => {
        allEventsMap[ev.idEvent] = ev;
      });
      const allEvents = Object.values(allEventsMap);

      allEvents.sort((a, b) => {
        const timeA = new Date(a.strTimestamp || `${a.dateEvent}T${a.strTime}`);
        const timeB = new Date(b.strTimestamp || `${b.dateEvent}T${b.strTime}`);
        return timeA - timeB;
      });

      if (allEvents.length === 0) {
        calendarContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">No hay partidos programados.</p>';
        return;
      }

      // Group events by local date string
      const groupedEvents = {};
      allEvents.forEach(event => {
        const dateObj = new Date(event.strTimestamp || `${event.dateEvent}T${event.strTime}`);
        const dayStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const capitalizedDayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
        if (!groupedEvents[capitalizedDayStr]) {
          groupedEvents[capitalizedDayStr] = [];
        }
        groupedEvents[capitalizedDayStr].push(event);
      });

      window.calendarEvents = allEvents;
      window.groupedEvents = groupedEvents;

      renderCalendar(groupedEvents);

      if (typeof updateAllTimes === 'function') {
        updateAllTimes();
      }
    }).catch(err => {
      console.error('Error fetching calendar events', err);
      calendarContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem;">Error al conectar con la API del calendario.</p>';
    });
  }

  function renderCalendar(grouped) {
    const calendarContainer = document.getElementById('match-days');
    if (!calendarContainer) return;

    const activePhaseTab = document.querySelector('.cal-filters .tab.active');
    const phaseText = activePhaseTab ? activePhaseTab.textContent.toLowerCase() : '';

    const groupSelect = document.getElementById('group-filter-select');
    const selectedGroup = groupSelect ? groupSelect.value : 'all';

    let html = '';

    Object.keys(grouped).forEach(dayName => {
      const filteredEvents = grouped[dayName].filter(event => {
        // Filter by group dropdown
        if (selectedGroup !== 'all') {
          if (event.strGroup !== selectedGroup) return false;
        }

        // Filter by tab phase
        const isKnockout = parseInt(event.intRound || 0) > 3 || !event.strGroup;
        if (phaseText.includes('grupo')) {
          if (isKnockout) return false;
        } else if (phaseText.includes('octavos')) {
          if (event.intRound !== '16' && !event.strEvent.toLowerCase().includes('octavos') && !event.strEvent.toLowerCase().includes('round of 16')) return false;
        } else if (phaseText.includes('cuartos')) {
          if (event.intRound !== '8' && !event.strEvent.toLowerCase().includes('cuartos') && !event.strEvent.toLowerCase().includes('quarter')) return false;
        } else if (phaseText.includes('semifinal')) {
          if (event.intRound !== '4' && !event.strEvent.toLowerCase().includes('semi')) return false;
        } else if (phaseText.includes('final')) {
          if (event.intRound !== '1' && event.intRound !== '2' && !event.strEvent.toLowerCase().includes('final')) return false;
        }

        return true;
      });

      if (filteredEvents.length === 0) return;

      const matchRows = filteredEvents.map(event => {
        const homeScore = event.intHomeScore !== null && event.intHomeScore !== undefined ? event.intHomeScore : '';
        const awayScore = event.intAwayScore !== null && event.intAwayScore !== undefined ? event.intAwayScore : '';

        const isFinished = event.strStatus === 'FT';
        const isLive = !isFinished && event.strStatus !== 'NS' && event.strStatus !== null;
        
        let scoreDisplay = '';
        if (homeScore !== '' || awayScore !== '') {
          scoreDisplay = `<span class="me-score ${isLive ? 'live' : ''}">${homeScore} - ${awayScore}${isLive ? ' <span class="live-dot"></span>' : ''}</span>`;
        } else {
          scoreDisplay = `<span class="me-score">VS</span>`;
        }

        const timeStr = event.strTime ? event.strTime.substring(0, 5) : '';
        const utcTimestamp = event.strTimestamp || `${event.dateEvent}T${event.strTime}`;
        const grpLabel = event.strGroup ? `Grupo ${event.strGroup}` : 'Fase Final';

        return `
          <div class="match-entry" data-utc="${utcTimestamp}">
            <div class="me-teams" style="display:flex; align-items:center; width:100%; justify-content:space-between;">
              <div style="display:flex; align-items:center; flex:1; justify-content:flex-end; gap:8px;">
                <span>${event.strHomeTeam}</span>
                <span style="font-size:1.2rem;">${getFlagEmoji(event.strHomeTeam)}</span>
              </div>
              <div style="padding: 0 1rem; min-width:80px; text-align:center;">
                ${scoreDisplay}
              </div>
              <div style="display:flex; align-items:center; flex:1; justify-content:flex-start; gap:8px;">
                <span style="font-size:1.2rem;">${getFlagEmoji(event.strAwayTeam)}</span>
                <span>${event.strAwayTeam}</span>
              </div>
            </div>
            <div class="me-time" style="display:none;">${timeStr}</div>
            <div class="me-venue">
              🏟️ ${event.strVenue || 'Estadio'}<br>
              ${grpLabel} · ${event.strCity || ''}
            </div>
          </div>
        `;
      }).join('');

      html += `
        <div class="match-day">
          <div class="match-day-header">
            <h3>📅 ${dayName}</h3>
            <span class="phase">${filteredEvents[0].strGroup ? 'Fase de Grupos' : 'Fase Final'}</span>
          </div>
          ${matchRows}
        </div>
      `;
    });

    calendarContainer.innerHTML = html || '<p style="text-align:center; color:var(--text-muted); padding:4rem;">No hay partidos que coincidan con los filtros.</p>';
  }

  // Setup filters handlers for calendar.html
  const calFilters = document.querySelectorAll('.cal-filters .tab');
  if (calFilters.length > 0) {
    calFilters.forEach(tab => {
      tab.addEventListener('click', () => {
        calFilters.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (window.groupedEvents) {
          renderCalendar(window.groupedEvents);
          if (typeof updateAllTimes === 'function') updateAllTimes();
        }
      });
    });
  }

  const groupFilterSelect = document.getElementById('group-filter-select');
  if (groupFilterSelect) {
    groupFilterSelect.addEventListener('change', () => {
      if (window.groupedEvents) {
        renderCalendar(window.groupedEvents);
        if (typeof updateAllTimes === 'function') updateAllTimes();
      }
    });
  }

  // Timezone converter logic for calendar.html
  const tzSelect = document.getElementById('tz-select');
  if (tzSelect) {
    const tzCity = document.getElementById('tz-city');
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tzCity) tzCity.textContent = userTz.split('/').pop().replace(/_/g,' ');

    const tzMap = {
      'America/Mexico_City': 0, 'America/Bogota': 1, 'America/Lima': 2,
      'America/Guayaquil': 3, 'America/Caracas': 4, 'America/La_Paz': 5,
      'America/New_York': 6, 'America/Chicago': 7, 'America/Denver': 8,
      'America/Los_Angeles': 9, 'America/Argentina/Buenos_Aires': 10,
      'America/Montevideo': 11, 'America/Sao_Paulo': 12, 'America/Santiago': 13,
      'America/Asuncion': 14, 'America/Costa_Rica': 15, 'America/Panama': 16,
      'America/Tegucigalpa': 17, 'America/El_Salvador': 18, 'America/Guatemala': 19,
      'Europe/Madrid': 20
    };
    if (tzMap[userTz] !== undefined) tzSelect.selectedIndex = tzMap[userTz];

    window.updateAllTimes = function() {
      const offset = parseInt(tzSelect.value);
      const chipOffsets = [
        {label:'MX',off:-6},{label:'CO',off:-5},{label:'PE',off:-5},
        {label:'US ET',off:-4},{label:'AR',off:-3},{label:'CL',off:-4},
        {label:'ES',off:2},{label:'BR',off:-3}
      ];

      document.querySelectorAll('.match-entry[data-utc]').forEach(entry => {
        const utc = new Date(entry.dataset.utc);
        const localH = (utc.getUTCHours() + offset + 24) % 24;
        const localM = String(utc.getUTCMinutes()).padStart(2,'0');
        const timeEl = entry.querySelector('.me-time');
        
        if (timeEl) {
          timeEl.textContent = `${String(localH).padStart(2,'0')}:${localM}`;
          timeEl.style.display = 'block';
        }

        let existingChips = entry.querySelector('.tz-chips');
        if (!existingChips) {
          existingChips = document.createElement('div');
          existingChips.className = 'tz-chips';
          const target = timeEl || entry.querySelector('.me-teams');
          target.parentNode.insertBefore(existingChips, target.nextSibling);
        }
        existingChips.innerHTML = chipOffsets.map(c => {
          const h = (utc.getUTCHours() + c.off + 24) % 24;
          const isSelected = c.off === offset;
          return `<span class="tz-chip${isSelected?' highlight':''}">${c.label} ${String(h).padStart(2,'0')}:${localM}</span>`;
        }).join('');
      });
    };

    tzSelect.addEventListener('change', window.updateAllTimes);
  }
});
