(() => {
  const box = document.querySelector('.brand-film-player');
  const button = document.querySelector('.brand-film-play');
  const poster = document.querySelector('.brand-film-poster');
  const error = document.querySelector('.brand-film-error');
  if (!box || !button) return;
  let media, pending, hovering = false, engaged = false, timer;
  const hoverAllowed = () => matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sync = () => {
    if (!media) return;
    if (document.hidden || (!engaged && !hovering)) { media.pause(); return; }
    media.mute(!engaged);
    media.play();
  };
  const reveal = () => { poster.hidden = true; button.hidden = engaged; };
  const fail = () => { error.hidden = false; button.hidden = false; };
  function initialize() {
    if (pending) return pending;
    error.hidden = true;
    if (location.protocol === 'file:') {
      const video = document.createElement('video');
      video.src = 'assets/brand-film/cuimei-showreel-v18.mp4';
      video.playsInline = true;
      video.controls = true;
      video.preload = 'none';
      video.setAttribute('aria-label', '粹美設計 Cuimei Design — Brand film');
      box.insertBefore(video, button);
      video.addEventListener('playing', reveal);
      video.addEventListener('error', fail);
      media = {play: () => video.play().catch(fail), pause: () => video.pause(), mute: value => {video.muted = value;}};
      pending = Promise.resolve();
      return pending;
    }
    pending = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Player load timeout')), 20000);
      const create = () => {
        const frame = document.createElement('iframe');
        frame.id = 'brand-film-youtube';
        frame.title = '粹美設計 Cuimei Design — Brand film';
        frame.src = 'https://www.youtube-nocookie.com/embed/oDCoKAREKss?enablejsapi=1&playsinline=1&rel=0&origin=' + encodeURIComponent(location.origin);
        frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        box.insertBefore(frame, button);
        new YT.Player(frame, {events: {
          onReady: event => {
            clearTimeout(timeout);
            const p = event.target;
            media = {play: () => p.playVideo(), pause: () => p.pauseVideo(), mute: value => value ? p.mute() : p.unMute()};
            resolve();
          },
          onStateChange: event => { if (event.data === 1) reveal(); },
          onError: () => { clearTimeout(timeout); reject(new Error('Video unavailable')); fail(); },
          onAutoplayBlocked: () => { button.hidden = false; }
        }});
      };
      if (window.YT?.Player) { create(); return; }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (previous) previous(); create(); };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Player unavailable')); };
      document.head.append(script);
    });
    pending.catch(fail);
    return pending;
  }
  box.addEventListener('pointerenter', () => {
    if (!hoverAllowed() || engaged) return;
    hovering = true;
    timer = setTimeout(() => { initialize().then(sync).catch(fail); }, 250);
  });
  box.addEventListener('pointerleave', () => {
    hovering = false;
    clearTimeout(timer);
    if (!engaged) sync();
  });
  button.addEventListener('click', () => {
    engaged = true;
    clearTimeout(timer);
    if (media) { sync(); button.hidden = true; }
    else initialize().then(sync).catch(fail);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) media?.pause(); });
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) { hovering = false; clearTimeout(timer); media?.pause(); }
  }).observe(box);
})();
