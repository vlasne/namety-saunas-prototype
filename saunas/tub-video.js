/* Independent, progressively enhanced SPA video players. */
(() => {
  'use strict';

  function enhancePlayer(wrapper) {
    if (wrapper.dataset.videoEnhanced === 'true') return;
    const video = wrapper.querySelector('video');
    const controls = wrapper.querySelector('[data-video-controls]');
    const toggle = wrapper.querySelector('[data-video-toggle]');
    const sound = wrapper.querySelector('[data-video-sound]');
    const status = wrapper.querySelector('[data-video-status]');
    if (!video || !controls || !toggle || !sound || !status || typeof video.play !== 'function') return;

    const removers = [];
    const originalControls = video.controls;
    const originalControlsHidden = controls.hidden;
    const originalVideoHidden = video.hidden;
    let observer;
    let poster;
    let inView = false;
    let userPaused = false;
    let manuallyStarted = false;
    let attemptedAutoplay = false;
    let hasPlayed = false;
    let resumeWanted = false;
    let failed = false;
    let needsReload = false;
    let pending = false;
    let playRequest = 0;
    let expectedPauseEvents = 0;

    function measureVisibility() {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(0, rect.right - rect.left);
      const height = Math.max(0, rect.bottom - rect.top);
      const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return width > 0 && height > 0 && visibleWidth * visibleHeight / (width * height) >= 0.2;
    }

    function listen(target, type, handler) {
      target.addEventListener(type, handler);
      removers.push(() => target.removeEventListener(type, handler));
    }

    function syncControls() {
      const playing = !video.paused && !video.ended;
      const audible = !video.muted && video.volume > 0;
      toggle.textContent = playing ? 'Пауза' : 'Відтворити';
      toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Відтворити');
      toggle.setAttribute('aria-pressed', String(playing));
      sound.textContent = audible ? 'Вимкнути звук' : 'Увімкнути звук';
      sound.setAttribute('aria-label', audible ? 'Вимкнути звук' : 'Увімкнути звук');
      sound.setAttribute('aria-pressed', String(audible));
    }

    function pauseInternally() {
      playRequest += 1;
      pending = false;
      if (!video.paused) {
        expectedPauseEvents += 1;
        video.pause();
      }
      syncControls();
    }

    function showPoster(show) {
      if (show && !poster && video.poster) {
        poster = document.createElement('img');
        poster.src = video.poster;
        poster.alt = video.getAttribute('aria-label') || 'Кадр відео NAMETY';
        poster.width = video.width || 1920;
        poster.height = video.height || 1080;
        poster.style.width = '100%';
        poster.style.height = 'auto';
        poster.style.objectFit = 'contain';
        poster.setAttribute('data-video-poster', '');
        wrapper.insertBefore(poster, video);
      }
      if (poster) {
        poster.hidden = !show;
        video.hidden = show || originalVideoHidden;
      }
    }

    function playbackFailed(error) {
      failed = true;
      resumeWanted = false;
      needsReload = Boolean(video.error) || error?.name === 'NotSupportedError';
      pauseInternally();
      showPoster(true);
      status.textContent = error?.name === 'NotAllowedError'
        ? 'Натисніть «Відтворити», щоб переглянути відео.'
        : 'Не вдалося відтворити відео. Показуємо фото. Натисніть «Відтворити», щоб спробувати ще раз.';
    }

    function requestPlay(reason) {
      if (document.hidden || (pending && reason !== 'manual')) return;
      if (reason !== 'manual' && (!inView || userPaused || failed)) return;
      if (reason === 'manual') {
        userPaused = false;
        manuallyStarted = true;
        failed = false;
      }
      attemptedAutoplay = true;
      resumeWanted = false;
      // Muting applies only to the first automatic attempt, never to a retry
      // or a return to view after the visitor has chosen sound.
      if (reason === 'auto') video.muted = true;
      const request = ++playRequest;
      pending = true;
      status.textContent = '';
      showPoster(false);
      try {
        if (needsReload) {
          needsReload = false;
          video.load();
        }
        const result = video.play();
        Promise.resolve(result).then(() => {
          if (request !== playRequest) return;
          pending = false;
          syncControls();
        }).catch(error => {
          // A deliberate pause, visibility change or newer request invalidates
          // this promise; its AbortError must not replace the current UI.
          if (request !== playRequest) return;
          playbackFailed(error);
        });
        syncControls();
      } catch (error) {
        if (request === playRequest) playbackFailed(error);
      }
    }

    try {
      // A visitor can click before the first asynchronous observer callback.
      inView = measureVisibility();
      const reducedMotion = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const canAutoplay = () => Boolean(observer) && !reducedMotion?.matches && !connection?.saveData;

      function suspend() {
        if (!userPaused && !failed && hasPlayed && !video.paused && !video.ended) resumeWanted = true;
        pauseInternally();
      }

      function reconcile() {
        if (document.hidden || !inView) {
          suspend();
          return;
        }
        if (userPaused || failed || pending || !video.paused) return;
        if (resumeWanted && (manuallyStarted || canAutoplay())) requestPlay('resume');
        else if (!attemptedAutoplay && canAutoplay()) requestPlay('auto');
      }

      listen(toggle, 'click', () => {
        if (!video.paused || pending) {
          userPaused = true;
          resumeWanted = false;
          pauseInternally();
        } else requestPlay('manual');
      });

      listen(sound, 'click', () => {
        if (!video.muted && video.volume > 0) video.muted = true;
        else {
          video.muted = false;
          if (video.volume === 0) video.volume = 1;
          // Call play within this gesture, retaining the chosen sound state
          // even if the browser rejects playback or a later retry is needed.
          requestPlay('manual');
        }
        syncControls();
      });

      listen(video, 'play', syncControls);
      listen(video, 'playing', () => {
        if (userPaused || document.hidden || !inView) {
          suspend();
          return;
        }
        hasPlayed = true;
        failed = false;
        status.textContent = '';
        showPoster(false);
        syncControls();
      });
      listen(video, 'pause', () => {
        if (expectedPauseEvents > 0) expectedPauseEvents -= 1;
        else if (!video.ended && !failed) {
          // WebKit may pause on visibility loss before our observer runs.
          // Only a pause while visible is treated as an explicit user pause.
          inView = measureVisibility();
          if (document.hidden || !inView) {
            if (hasPlayed && !userPaused) resumeWanted = true;
          } else {
            userPaused = true;
            resumeWanted = false;
          }
          playRequest += 1;
          pending = false;
        }
        syncControls();
      });
      listen(video, 'ended', syncControls);
      listen(video, 'volumechange', syncControls);
      listen(video, 'error', () => playbackFailed(video.error));
      listen(document, 'visibilitychange', reconcile);
      listen(window, 'pagehide', suspend);
      listen(window, 'pageshow', reconcile);

      function preferencesChanged() {
        if (!manuallyStarted && !canAutoplay()) {
          resumeWanted = false;
          pauseInternally();
        } else reconcile();
      }
      if (reducedMotion?.addEventListener) listen(reducedMotion, 'change', preferencesChanged);
      else if (reducedMotion?.addListener) {
        reducedMotion.addListener(preferencesChanged);
        removers.push(() => reducedMotion.removeListener(preferencesChanged));
      }
      if (connection?.addEventListener) listen(connection, 'change', preferencesChanged);

      if (typeof window.IntersectionObserver === 'function') {
        observer = new IntersectionObserver(entries => {
          const entry = entries.find(item => item.target === wrapper);
          if (!entry) return;
          inView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
          reconcile();
        }, { threshold: [0, 0.2] });
        observer.observe(wrapper);
      } else {
        // Older browsers keep manual playback; still pause when scrolled away.
        const measure = () => {
          inView = measureVisibility();
          reconcile();
        };
        listen(window, 'scroll', measure);
        listen(window, 'resize', measure);
        measure();
      }

      syncControls();
      controls.hidden = false;
      video.controls = false;
      wrapper.dataset.videoEnhanced = 'true';
      if (video.error) playbackFailed(video.error);
    } catch (_) {
      // Leave a working native player if enhancement cannot be installed.
      observer?.disconnect();
      removers.forEach(remove => remove());
      video.controls = originalControls;
      controls.hidden = originalControlsHidden;
      video.hidden = originalVideoHidden;
      poster?.remove();
      delete wrapper.dataset.videoEnhanced;
    }
  }

  function init() {
    document.querySelectorAll('[data-spa-player], [data-tub-player]').forEach(enhancePlayer);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
