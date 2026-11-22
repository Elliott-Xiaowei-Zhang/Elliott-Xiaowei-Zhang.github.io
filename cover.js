{
    const gallery = document.getElementById('uc-homepage-gallery');
    const bioTemplate = document.getElementById('uc-bio-template');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const views = [...gallery.querySelectorAll('.uc-design')];
    const switcher = gallery.querySelector('.uc-switcher');
    const choices = [...switcher.querySelectorAll('button[data-scene]')];
    const artwork = new Map(views.filter(view => view.dataset.artwork).map(view => [view.id, view.dataset.artwork]));
    const preloaded = new Map();
    const lerp = (a, b, t) => (1 - t) * a + t * b;
    const wave = (time, period) => .5 - .5 * Math.cos(Math.PI * 2 * time / period);
    const fraction = n => n - Math.floor(n);
    const upper = [[0, .265], [.18, .18], [.36, .16], [.44, .19], [.55, .29], [.65, .38], [.74, .40]];
    const lower = [[.18, .64], [.30, .57], [.39, .61], [.51, .72], [.61, .72], [.76, .56], [1, .32]];

    function prepareArtwork(scene, priority = 'low') {
      const existing = preloaded.get(scene);
      if (existing) {
        if (priority === 'high') existing.image.fetchPriority = priority;
        return existing;
      }

      const image = new Image();
      image.fetchPriority = priority;
      image.decoding = 'async';
      const asset = {image, ready: false};
      asset.loaded = new Promise(resolve => {
        image.onload = async () => {
          if (image.decode) await image.decode().catch(() => {});
          asset.ready = image.naturalWidth > 0;
          resolve(asset.ready);
        };
        image.onerror = () => {
          preloaded.delete(scene);
          resolve(false);
        };
      });
      preloaded.set(scene, asset);
      image.src = artwork.get(scene);
      return asset;
    }

    function showScene(choice) {
      const scene = choice.dataset.scene;
      gallery.dataset.active = scene;
      for (const view of views) {
        view.hidden = view.id !== scene;
        if (!view.hidden) gallery.dataset.surface = view.classList.contains('uc-light') ? 'light' : 'dark';
      }
      for (const option of choices) {
        option.setAttribute('aria-pressed', String(option === choice));
      }
    }

    let selection = 0;
    function selectScene(choice) {
      const request = ++selection;
      switcher.querySelector('[data-loading]')?.removeAttribute('data-loading');
      switcher.removeAttribute('aria-busy');
      const scene = choice.dataset.scene;
      if (gallery.dataset.active === scene) return;
      if (!artwork.has(scene)) {
        showScene(choice);
        return;
      }
      const asset = prepareArtwork(scene, 'high');
      if (asset.ready) {
        showScene(choice);
        return;
      }
      choice.setAttribute('data-loading', '');
      switcher.setAttribute('aria-busy', 'true');
      void asset.loaded.then(ready => {
        if (request !== selection) return;
        choice.removeAttribute('data-loading');
        switcher.removeAttribute('aria-busy');
        if (ready) showScene(choice);
      });
    }

    for (const choice of choices) {
      choice.addEventListener('click', () => selectScene(choice));
    }
    switcher.addEventListener('keydown', event => {
      const current = choices.indexOf(event.target);
      if (current === -1) return;
      const next = {
        ArrowUp: (current + choices.length - 1) % choices.length,
        ArrowDown: (current + 1) % choices.length,
        Home: 0,
        End: choices.length - 1
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectScene(choices[next]);
      choices[next].focus({preventScroll: true});
    });
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const beijingDay = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      weekday: 'short'
    }).format(new Date());
    showScene(choices[weekdays.indexOf(beijingDay)]);
    for (const view of views) {
      if (artwork.has(view.id)) prepareArtwork(view.id, view.hidden ? 'low' : 'high');
    }

    function sample(line, t) {
      const scaled = t * (line.length - 1);
      const i = Math.min(line.length - 2, Math.floor(scaled));
      return [lerp(line[i][0], line[i + 1][0], scaled - i), lerp(line[i][1], line[i + 1][1], scaled - i)];
    }

    function artPoint(pair, w, h, aspect) {
      const iw = Math.max(w, h * aspect);
      const ih = iw / aspect;
      return [iw * pair[0] + (w - iw) / 2, ih * pair[1] + (h - ih) / 2];
    }

    function glint(art, first, second, w, h, intensity, aspect) {
      const [ax, ay] = artPoint(first, w, h, aspect);
      const [bx, by] = artPoint(second, w, h, aspect);
      for (const [key, percent] of Object.entries({ax: ax * 100 / w, ay: ay * 100 / h, bx: bx * 100 / w, by: by * 100 / h})) {
        art.style.setProperty('--' + key, percent.toFixed(1) + '%');
      }
      art.style.setProperty('--shine', Math.min(.81, intensity).toFixed(3));
    }

    function prepareCanvas(canvas, ctx, w, h) {
      if (!ctx) return false;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.round(w * ratio), ph = Math.round(h * ratio);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, h);
      return true;
    }

    function flow(art) {
      const canvas = art.querySelector('.uc-specks');
      const ctx = canvas.getContext('2d');
      const dots = Array.from({length: 342}, (_, i) => ({
        at: fraction((i + 1) * .618034),
        radius: .34 + fraction(i * .732) * .93,
        lane: fraction(i * .569) - .5,
        speed: .021 + fraction(i * .297) * .017,
        line: i % 2 ? upper : lower
      }));
      return ({time, w, h, aspect, gain, still}) => {
        const t = wave(time + 1.6, 12.4);
        art.style.setProperty('--tide', still ? '0px' : (Math.sin(time * .53) * 3.2 * gain).toFixed(2) + 'px');
        glint(art, sample(upper, .25 + .58 * t), sample(lower, .78 - .57 * t), w, h, still ? 0 : (.16 + .2 * t) * gain, aspect);
        if (!prepareCanvas(canvas, ctx, w, h) || still) return;
        ctx.fillStyle = '#d5ff7c';
        for (const dot of dots) {
          const along = fraction(dot.at + dot.speed * time);
          const [x, y] = sample(dot.line, along);
          const [px, py] = artPoint([x, y + dot.lane * .12], w, h, aspect);
          ctx.globalAlpha = Math.min(.7, Math.sin(along * Math.PI) * (.24 + .28 * t) * gain);
          ctx.beginPath();
          ctx.arc(px, py, dot.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
    }

    function visibleCut(a, b, w, h) {
      let from = 0, to = 1;
      for (const [axis, limit] of [[0, w], [1, h]]) {
        const step = b[axis] - a[axis];
        if (!step) {
          if (a[axis] < 0 || a[axis] > limit) return null;
          continue;
        }
        const first = -a[axis] / step;
        const last = (limit - a[axis]) / step;
        from = Math.max(from, Math.min(first, last));
        to = Math.min(to, Math.max(first, last));
      }
      return from < to ? [from, to] : null;
    }

    function lightStreak(ctx, a, b, w, brightness) {
      if (brightness <= .002) return;
      const beam = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      beam.addColorStop(0, '#b8ff3900');
      beam.addColorStop(.35, '#aefa4840');
      beam.addColorStop(.72, '#e9ffb0');
      beam.addColorStop(1, '#d6ff7e00');
      ctx.lineCap = 'round';
      ctx.strokeStyle = beam;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.globalAlpha = brightness * .24;
      ctx.lineWidth = Math.max(11, w * .016);
      ctx.stroke();
      ctx.globalAlpha = brightness * .71;
      ctx.lineWidth = 3.4;
      ctx.shadowColor = '#a3ff36';
      ctx.shadowBlur = 17;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = brightness;
      ctx.lineWidth = 1.35;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function cutLights(art, edges) {
      const canvas = art.querySelector('.uc-seam-lights');
      const ctx = canvas.getContext('2d');
      return ({time, w, h, aspect, gain, still}) => {
        const drawable = prepareCanvas(canvas, ctx, w, h);
        const pulses = edges.map(edge => {
          const a = artPoint(edge.start, w, h, aspect);
          const b = artPoint(edge.end, w, h, aspect);
          const visible = visibleCut(a, b, w, h);
          const phase = fraction(time / edge.cycle + edge.offset);
          const crest = visible ? lerp(visible[0], visible[1], phase) : phase;
          const strength = Math.pow(Math.sin(phase * Math.PI), .75);
          if (drawable && visible && !still) {
            const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const trail = Math.min(.32, Math.max(82, w * .148) / length);
            const from = Math.max(visible[0], crest - trail);
            const to = Math.min(visible[1], crest + trail * .35);
            if (to - from > .002) {
              lightStreak(
                ctx,
                [lerp(a[0], b[0], from), lerp(a[1], b[1], from)],
                [lerp(a[0], b[0], to), lerp(a[1], b[1], to)],
                w,
                Math.min(1, strength * gain)
              );
            }
          }
          return {at:edge.start.map((value, i) => lerp(value, edge.end[i], crest)), strength};
        });
        const [first, second = first] = pulses;
        const brightness = .29 + .55 * Math.max(first.strength, second.strength);
        glint(art, first.at, second.at, w, h, still ? 0 : brightness * gain, aspect);
      };
    }

    function movePlates(art, upperX, upperY, lowerX, lowerY) {
      const positions = {'upper-x': upperX, 'upper-y': upperY, 'lower-x': lowerX, 'lower-y': lowerY};
      for (const [key, pos] of Object.entries(positions)) {
        art.style.setProperty('--' + key, pos.toFixed(2) + 'px');
      }
    }

    function print(art, amplitude = 1) {
      return ({time, w, gain, still}) => {
        const phase = time * Math.PI * 2 / 9.8;
        const motion = still ? 0 : gain * amplitude;
        const offset = Math.sin(phase) * Math.min(w * .009, 10) * motion;
        const lift = Math.sin(phase + .4) * 1.7 * motion;
        movePlates(art, offset, lift, -offset * .75, -lift * .65);
      };
    }

    function letterCut(art) {
      return ({time, w, h, gain, still}) => {
        const motion = still ? 0 : gain;
        const phase = (time + .42) * Math.PI * 2 / 5.6;
        const offset = Math.sin(phase) * Math.min(w * .034, 35) * motion;
        const opening = wave(time + .42, 5.6) * Math.min(h * .034, 12.5) * motion;
        movePlates(art, offset, -opening, -offset * .88, opening * .6);
      };
    }

    function moire(art) {
      const canvas = art.querySelector('.uc-moire-wave');
      const ctx = canvas.getContext('2d');
      const track = [[.255, .174], [.285, .281], [.339, .382], [.407, .442], [.483, .488], [.555, .532], [.624, .577], [.692, .636], [.747, .745]];
      return ({time, w, h, aspect, gain, still}) => {
        const phase = fraction(.16 + time / 4.5);
        const pulse = Math.sin(phase * Math.PI);
        const crest = .06 + .88 * phase;
        const drift = still ? 0 : Math.sin(phase * Math.PI * 2) * Math.min(w * .018, 16) * gain;
        art.style.setProperty('--moire-shift', drift.toFixed(2) + 'px');
        glint(art, sample(track, crest), sample(track, .87 - .59 * phase), w, h, still ? 0 : .87 * pulse * gain, aspect);
        if (!prepareCanvas(canvas, ctx, w, h) || still) return;

        const start = Math.max(0, crest - .24);
        const end = Math.min(1, crest + .26);
        const from = artPoint(sample(track, start), w, h, aspect);
        const to = artPoint(sample(track, end), w, h, aspect);
        const gradient = ctx.createLinearGradient(...from, ...to);
        gradient.addColorStop(0, '#8cdb2800');
        gradient.addColorStop(.43, '#adff53c2');
        gradient.addColorStop(.68, '#e7ffa2');
        gradient.addColorStop(1, '#c4d1ff00');
        ctx.beginPath();
        for (let step = 0; step <= 32; step++) {
          const along = lerp(start, end, step / 32);
          const [x, y] = sample(track, along);
          const bend = Math.sin(Math.PI * 2 * (along * 1.6 - .52 * time)) * .036 * gain;
          const point = artPoint([x, y + bend], w, h, aspect);
          if (step === 0) ctx.moveTo(...point);
          else ctx.lineTo(...point);
        }
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(11, w * .024);
        ctx.globalAlpha = Math.min(.38, .32 * pulse * gain);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.5, w * .0032);
        ctx.globalAlpha = Math.min(.96, .94 * pulse * gain);
        ctx.shadowColor = '#aef844';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      };
    }

    function stoneReflection(art) {
      const sweeps = [
        {
          surface: art.querySelector('.uc-stone-reflection-left'),
          path: [[.332, .154], [.132, .593]],
          compactPath: [[.393, .048], [.294, .342]],
          offset: 1.52
        },
        {
          surface: art.querySelector('.uc-stone-reflection-right'),
          path: [[.631, .817], [.950, .349]],
          compactPath: [[.562, .923], [.695, .699]],
          offset: .57
        }
      ];
      return ({time, w, h, aspect, gain, still}) => {
        const cropped = 1 - w / Math.max(w, h * aspect);
        const framing = Math.max(0, Math.min(1, (cropped - .16) / .43));
        for (const {surface, path, compactPath, offset} of sweeps) {
          const phase = fraction((time + offset) / 5.8);
          const travel = .5 - .5 * Math.cos(phase * Math.PI);
          const wide = sample(path, travel);
          const compact = sample(compactPath, travel);
          const position = wide.map((value, axis) => lerp(value, compact[axis], framing));
          const [x, y] = artPoint(position, w, h, aspect);
          const glow = still ? 0 : .96 * Math.pow(Math.sin(phase * Math.PI), 1.1) * gain;
          surface.style.setProperty('--stone-light-x', x.toFixed(2) + 'px');
          surface.style.setProperty('--stone-light-y', y.toFixed(2) + 'px');
          surface.style.setProperty('--stone-glow', Math.min(.94, glow).toFixed(3));
        }
      };
    }

    const painters = {
      'uc-flow': flow,
      'uc-stone': stoneReflection,
      'uc-print': print,
      'uc-fold': art => cutLights(art, [{start:[.334, .204], end:[.844, .435], cycle:7.3, offset:.31}]),
      'uc-stairs': art => print(art, .86),
      'uc-moire': moire,
      'uc-letter': letterCut
    };
    for (const variant of views) {
      const art = variant.querySelector('.uc-art');
      const intro = variant.querySelector('.uc-bio');
      if (!intro.firstElementChild) intro.append(bioTemplate.content.cloneNode(true));

      const paint = painters[variant.id](art);
      let w = 0, h = 0, aspect = 2, visible = !('IntersectionObserver' in window), handle = 0, previous = 0, time = 0;
      const render = still => { if (w && h) paint({time, w, h, aspect, gain: 1, still}); };
      const active = () => w > 0 && h > 0 && visible && !variant.hidden && !document.hidden && !reduced.matches;

      function tick(now) {
        handle = 0;
        if (!active()) { previous = 0; return; }
        if (!previous || now - previous >= 30) {
          if (previous) time += Math.min(100, now - previous) / 1000;
          previous = now;
          render(false);
        }
        handle = window.requestAnimationFrame(tick);
      }

      function reconcile() {
        if (active()) {
          if (!handle) handle = window.requestAnimationFrame(tick);
        } else {
          if (handle) window.cancelAnimationFrame(handle);
          handle = 0;
          previous = 0;
          if (reduced.matches) render(true);
        }
      }

      const size = new ResizeObserver(entries => {
        w = entries[0].contentRect.width;
        h = entries[0].contentRect.height;
        aspect = Number(getComputedStyle(art).getPropertyValue('--art-aspect')) || 2;
        render(true);
        reconcile();
      });
      size.observe(art);
      if ('IntersectionObserver' in window) {
        const coverage = new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting;
          reconcile();
        });
        coverage.observe(art);
      }
      document.addEventListener('visibilitychange', reconcile);
      reduced.addEventListener('change', reconcile);

    }
  }
