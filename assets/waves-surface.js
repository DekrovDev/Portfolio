/* Dark water: displaced 3D vertices, travelling ripples and Fresnel reflections.
   The reference image is only a fallback; it is never stretched by this renderer.
   Browser-only WebGL; no dependencies, network API, or server-side rendering.
   Two-scale wave/normal approach: NVIDIA GPU Gems, chapter 1, Effective Water Simulation. */
(() => {
  const layer = document.querySelector('.wave-background');
  const hero = document.getElementById('hero');
  if (!layer || !hero) return;
  const canvas = layer.querySelector('canvas');
  const image = layer.querySelector('.wave-image');
  if (!canvas || !image) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cssOnly = new URLSearchParams(location.search).get('waves') === 'css';
  const control = document.getElementById('wave-control');
  const controlLabel = document.getElementById('wave-control-label');
  // Reduced motion sets the initial state, but an explicit click may opt in.
  let paused = reduced.matches || cssOnly, faded = false, optedIn = false;
  let render, initialized = false, visible = true, lost = false, failed = false;
  let resizeObserver;
  let software;
  const gpuLost = () => lost && !software;
  const motionAllowed = () => !reduced.matches || optedIn;
  let frame = 0, scrollFrame = 0, stamp = 0, lastDraw = 0, elapsed = 0;
  const updateFade = () => {
    const bounds = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -bounds.top / Math.max(1, bounds.height - 100)));
    layer.style.setProperty('--wave-opacity', (1 - progress * progress * (3 - 2 * progress)).toFixed(3));
    const nextFaded = progress >= 1;
    if (nextFaded !== faded) {
      faded = nextFaded;
      faded ? stop() : resume();
      syncControl();
    }
    scrollFrame = 0;
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; stamp = 0; };
  const tick = time => {
    frame = 0;
    if (paused || faded || !visible || document.hidden || !motionAllowed() || !render || gpuLost()) return;
    elapsed += stamp ? Math.min((time - stamp) * .001, .08) : 0;
    stamp = time;
    if (time - lastDraw >= (software ? 50 : 32)) { render(elapsed); lastDraw = time; }
    frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    if (!paused && !faded && render && visible && !document.hidden && motionAllowed() && !gpuLost() && !frame) frame = requestAnimationFrame(tick);
  };
  const syncControl = () => {
    const still = !render || gpuLost() || !motionAllowed();
    layer.dataset.waveMotion = still ? 'static' : paused ? 'paused' : faded || !visible || document.hidden ? 'suspended' : 'running';
    if (!control || !controlLabel) return;
    control.hidden = false;
    control.disabled = false;
    control.setAttribute('aria-pressed', String(paused || still));
    const key = failed ? 'ui-wave-unavailable' : paused || still ? 'ui-wave-resume' : 'ui-wave-pause';
    const fallbackText = failed ? 'Animation unavailable — retry' : paused || still ? 'Resume waves' : 'Pause waves';
    controlLabel.textContent = window.portfolioTranslations?.[key] || fallbackText;
    control.title = failed ? window.portfolioTranslations?.['ui-wave-unavailable-help'] || 'WebGL is unavailable. Click to try again.' : '';
  };
  const fallback = reason => {
    stop(); render = null; initialized = false; failed = true;
    resizeObserver?.disconnect();
    layer.classList.remove('webgl-ready'); layer.dataset.waveMode = 'fallback'; syncControl();
    layer.dataset.waveError = reason || 'WebGL context unavailable';
    try {
      software?.destroy();
      software = window.portfolioWaterFallback?.(layer);
      if (!software) return;
      render = software.render;
      const renderer = software;
      const resize = () => {
        if (software !== renderer) return;
        renderer.resize(); renderer.render(elapsed); updateFade();
      };
      resize();
      layer.dataset.waveMode = 'water-software';
      layer.classList.add('webgl-ready'); failed = false;
      resizeObserver = new ResizeObserver(resize); resizeObserver.observe(layer);
      resume(); syncControl();
    } catch (error) {
      software?.destroy(); software = null; render = null; failed = true;
      layer.classList.remove('webgl-ready'); layer.dataset.waveMode = 'fallback'; syncControl();
      console.warn('Software water unavailable:', error.message);
    }
  };
  const init = () => {
    if (initialized || software || !motionAllowed() || (cssOnly && !optedIn) || lost) return;
    // The GPU surface does not use the fallback image and must not wait for it.
    initialized = true;
    try {
      const gl = canvas.getContext('webgl', { alpha: false, antialias: true, depth: true, powerPreference: 'low-power' });
      if (!gl) { fallback(); return; }
      const derivatives = !!gl.getExtension('OES_standard_derivatives');
      const wideIndices = !!gl.getExtension('OES_element_index_uint');
      const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision > 0 ? 'highp' : 'mediump';
      const shader = (type, source) => {
        const handle = gl.createShader(type);
        gl.shaderSource(handle, source); gl.compileShader(handle);
        if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(handle);
          gl.deleteShader(handle); throw new Error(message || 'Wave shader unavailable');
        }
        return handle;
      };
      const surfaceField = `
        vec3 dune(vec2 point, vec2 center, float angle, float width, float length, float size, float seed) {
          vec2 axis=vec2(cos(angle),sin(angle)), crossAxis=vec2(-axis.y,axis.x);
          vec2 p=point-center;
          float along=dot(p,axis), across=dot(p,crossAxis);
          float phase=time*(.24+seed*.007);
          float a=along*.22+seed+phase, b=along*.47-seed*.7-phase*.67, c=along*.32-phase*2.1+seed;
          float curve=sin(a)*1.1+sin(b)*.35+sin(c)*.42;
          float curveSlope=cos(a)*.242+cos(b)*.1645+cos(c)*.1344;
          float side=across-curve;
          float f=clamp(side+.5,0.0,1.0);
          // C2-continuous profile: neither slope nor curvature has a seam at the crest.
          float blend=f*f*f*(f*(f*6.0-15.0)+10.0);
          float flank=width*(1.3-.52*blend);
          float flankSlope=-width*.52*30.0*f*f*(1.0-f)*(1.0-f);
          float r=side/flank;
          float crest=exp(-r*r), envelope=exp(-along*along/(length*length));
          float swell=1.0+.12*sin(along*.36-phase*2.8+seed);
          float crestSlope=-2.0*r*(flank-side*flankSlope)/(flank*flank)*crest;
          float envelopeSlope=-2.0*along/(length*length)*envelope;
          float swellSlope=.0432*cos(along*.36-phase*2.8+seed);
          vec2 gradient=size*(crestSlope*envelope*swell*(crossAxis-axis*curveSlope)
                       +crest*(envelopeSlope*swell+envelope*swellSlope)*axis);
          return vec3(size*crest*envelope*swell,gradient);
        }
        vec3 field(vec2 p) {
          vec3 h=dune(p,vec2(5,0),.23,1.6,11.0,2.0,1.0)
                +dune(p,vec2(-7,-5),-.48,1.8,7.0,1.6,5.0)
                +dune(p,vec2(12,-10),.55,1.4,10.0,2.5,9.0)
                +dune(p,vec2(-2,-18),-.16,2.0,12.0,1.7,15.0)
                +dune(p,vec2(16,-27),.37,1.9,10.0,2.1,21.0);
          vec2 k0=vec2(.95,.57), k1=vec2(-.71,1.36);
          float a=dot(p,k0)-time*.82, b=dot(p,k1)-time*1.05;
          return h*.88+vec3(.075*sin(a)+.045*sin(b)-.45,
                             .075*cos(a)*k0+.045*cos(b)*k1);
        }
`;
      const vertex = shader(gl.VERTEX_SHADER, `
        precision highp float;
        attribute vec2 position;
        uniform ${precision} float time, aspect, cameraX;
        varying ${precision} vec3 surface;
        varying ${precision} vec2 slope;
        varying ${precision} float distance;
        ${surfaceField}
        void main() {
          vec3 shape=field(position);
          surface=vec3(position.x,shape.x,position.y);
          slope=shape.yz;
          vec3 eye=vec3(cameraX,4.8,8.5);
          vec3 forward=normalize(vec3(0,-.29,-1));
          vec3 up=vec3(0,-forward.z,forward.y);
          vec3 relative=surface-eye;
          distance=dot(relative,forward);
          // Fixed perspective camera. Vertices really rise/fall and occlude one another.
          gl_Position=vec4(relative.x*1.95/aspect,dot(relative,up)*1.95,
                           1.00334*distance-.200334,distance);
        }
      `);
      const fragment = shader(gl.FRAGMENT_SHADER, `
        ${derivatives ? '#extension GL_OES_standard_derivatives : enable' : ''}
        precision ${precision} float;
        uniform float cameraX, time;
        uniform vec2 viewport;
        varying ${precision} vec3 surface;
        varying ${precision} vec2 slope;
        varying ${precision} float distance;
        ${surfaceField}
        float waveFilter(vec2 k, vec2 footprint) {
          return 1.0-smoothstep(.55,1.8,dot(abs(k),footprint));
        }
        float filteredBand(float offset, float width, float footprint) {
          float filteredWidth=sqrt(width*width+footprint*footprint*.25);
          return width/filteredWidth*exp(-pow(offset/filteredWidth,2.0));
        }
        void main() {
          // Analytic slopes of small waves: flowing detail instead of a grain texture.
          vec2 q=surface.xz;
          // Fade frequencies that cannot be represented by a pixel, before lighting.
          vec2 footprint=${derivatives ? 'fwidth(q)' : 'vec2(distance*2.0,distance*distance*.4)/(viewport.y*1.95)'};
          vec2 k0=vec2(2.9,1.4), k1=vec2(-4.3,2.7), k2=vec2(6.9,4.1), k3=vec2(13.1,-8.2);
          vec2 ripple=k0*.020*cos(dot(q,k0)-time*1.65)*waveFilter(k0,footprint)
                     +k1*.011*cos(dot(q,k1)-time*2.13+1.7)*waveFilter(k1,footprint)
                     +k2*.005*cos(dot(q,k2)-time*2.92+4.1)*waveFilter(k2,footprint)
                     +k3*.0018*cos(dot(q,k3)-time*3.75+2.8)*waveFilter(k3,footprint);
          ripple*=1.0/(1.0+distance*.032);
          vec2 smoothSlope=slope;
          // Evaluate the real surface per pixel in the distance, rather than lighting
          // interpolated triangle normals. Close waves keep the cheaper mesh gradient.
          if(distance>12.0) smoothSlope=mix(slope,field(q).yz,smoothstep(12.0,20.0,distance));
          vec3 n=normalize(vec3(-smoothSlope.x-ripple.x,1.0,-smoothSlope.y-ripple.y));
          vec3 view=normalize(vec3(cameraX,4.8,8.5)-surface);
          vec3 light=normalize(vec3(-.4,.8,-.45));
          float diffuse=max(dot(n,light),0.0);
          float variance=${derivatives ? 'dot(dFdx(n),dFdx(n))+dot(dFdy(n),dFdy(n))' : 'dot(footprint,footprint)*.005'};
          // Preserve highlight energy while smoothing sparkling subpixel reflections.
          float shininess=220.0/(1.0+variance*220.0);
          float highlight=pow(max(dot(n,normalize(light+view)),0.0),shininess)*shininess/220.0;
          float fresnel=.02+.98*pow(1.0-max(dot(n,view),0.0),5.0);
          vec3 reflected=reflect(-view,n);
          // A quiet monochrome environment; thin reflected light breaks across ripples.
          float sky=.002+.018*smoothstep(-.1,.7,reflected.y);
          float reflectionWidth=${derivatives ? 'fwidth(reflected.y)' : 'sqrt(variance)*2.0'};
          float horizon=filteredBand(reflected.y-.12,.065,reflectionWidth)
                       *(.35+.65*smoothstep(-.6,.55,reflected.x));
          float softbox=exp(-pow((reflected.x+.36)/.18,2.0)-pow((reflected.y-.48)/.36,2.0));
          float reflection=sky+horizon*.24+softbox*.055;
          float shade=.00012+diffuse*.0008+reflection*fresnel+highlight*.32;
          float fog=exp(-distance*distance*.0015);
          float water=pow(shade*fog,1.0/2.2);
          gl_FragColor=vec4(vec3(water),1.0);
        }
      `);
      const program = gl.createProgram();
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Wave program unavailable');
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);
      // Reuse the same mesh and buffers; height and normals evolve on the GPU.
      const mobile = layer.clientWidth <= 800;
      const columns = mobile ? 240 : (wideIndices ? 420 : 240), rows = mobile ? 240 : (wideIndices ? 340 : 270);
      const vertices = new Float32Array((columns + 1) * (rows + 1) * 2);
      const IndexArray = !mobile && wideIndices ? Uint32Array : Uint16Array;
      const indexType = IndexArray === Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      const indices = new IndexArray(columns * rows * 6);
      let vi = 0, ii = 0;
      for (let row = 0; row <= rows; row++) {
        for (let column = 0; column <= columns; column++) {
          vertices[vi++] = -24 + column / columns * 48;
          vertices[vi++] = -38 + row / rows * 45;
        }
      }
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const a = row * (columns + 1) + column, b = a + columns + 1;
          indices.set([a, b, a + 1, a + 1, b, b + 1], ii); ii += 6;
        }
      }
      const vertexBuffer = gl.createBuffer(), indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const clock = gl.getUniformLocation(program, 'time');
      const aspect = gl.getUniformLocation(program, 'aspect');
      const cameraX = gl.getUniformLocation(program, 'cameraX');
      const viewport = gl.getUniformLocation(program, 'viewport');
      render = time => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1f(clock, time);
        gl.drawElements(gl.TRIANGLES, indices.length, indexType, 0);
      };
      const resize = () => {
        if (lost) return;
        const width = Math.max(1, layer.clientWidth), height = Math.max(1, layer.clientHeight);
        const pixels = width <= 800 ? 850000 : 3000000;
        // Also supersample standard-density screens, where the distant rim was jagged.
        const ratio = Math.min(Math.max(devicePixelRatio || 1, 1.35), 2, 2400 / width, Math.sqrt(pixels / (width * height)));
        canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(viewport, canvas.width, canvas.height);
        gl.uniform1f(aspect, width / height);
        gl.uniform1f(cameraX, width <= 800 ? 4 : 0);
        render(elapsed); updateFade();
      };
      resize(); failed = false; layer.dataset.waveMode = 'water';
      layer.dataset.waveAntialias = gl.getContextAttributes().antialias ? 'multisample' : 'supersample';
      layer.dataset.waveFilter = derivatives ? 'screen-space' : 'distance';
      layer.dataset.waveSurface = 'analytic';
      layer.classList.add('webgl-ready'); resume(); syncControl();
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(layer);
    } catch (error) {
      render = null; fallback(error.message); console.warn('Dark water uses software rendering:', error.message);
    }
  };
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; fallback(); });
  canvas.addEventListener('webglcontextrestored', () => {
    stop(); resizeObserver?.disconnect(); software?.destroy(); software = null; render = null;
    layer.classList.remove('webgl-ready'); layer.dataset.waveMode = 'fallback';
    lost = false; failed = false; initialized = false; init(); syncControl();
  });
  control?.addEventListener('click', () => {
    if (!render || gpuLost() || !motionAllowed()) {
      optedIn = true; paused = false; failed = false;
      init();
      if (!render) failed = true;
    } else paused = !paused;
    if (render && !gpuLost()) layer.classList.add('webgl-ready');
    paused ? stop() : resume();
    syncControl();
  });
  document.addEventListener('portfolio:translations-updated', syncControl);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? resume() : stop(); syncControl(); }).observe(hero);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : resume(); syncControl(); });
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFade); }, { passive: true });
  reduced.addEventListener('change', () => {
    // A changed OS preference takes precedence until another explicit opt-in.
    optedIn = false;
    paused = reduced.matches || cssOnly;
    if (reduced.matches) { stop(); layer.classList.remove('webgl-ready'); }
    else { if (!software) init(); if (render && !gpuLost()) { layer.classList.add('webgl-ready'); resume(); } }
    syncControl();
  });
  init(); updateFade(); syncControl();
})();
