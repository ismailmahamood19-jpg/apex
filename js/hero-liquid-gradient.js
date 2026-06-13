/**
 * Hero Liquid Gradient (Three.js) — container-scoped, Apex white/gold theme
 */
;(function () {
  if (typeof window === "undefined") return;

  function hexToVec3(hex, fallback) {
    const value = typeof hex === "string" && hex.trim() ? hex.trim() : fallback;
    const color = new THREE.Color(value);
    return new THREE.Vector3(color.r, color.g, color.b);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  class TouchTexture {
    constructor() {
      this.size = 64;
      this.width = this.height = this.size;
      this.maxAge = 64;
      this.radius = 0.25 * this.size;
      this.speed = 1 / this.maxAge;
      this.trail = [];
      this.last = null;
      this.initTexture();
    }

    initTexture() {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext("2d");
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.texture = new THREE.Texture(this.canvas);
    }

    clear() {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    addTouch(point) {
      let force = 0;
      let vx = 0;
      let vy = 0;
      const last = this.last;
      if (last) {
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (dx === 0 && dy === 0) return;
        const dd = dx * dx + dy * dy;
        const d = Math.sqrt(dd);
        vx = dx / d;
        vy = dy / d;
        force = Math.min(dd * 20000, 2.0);
      }
      this.last = { x: point.x, y: point.y };
      this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
    }

    drawPoint(point) {
      const pos = {
        x: point.x * this.width,
        y: (1 - point.y) * this.height,
      };

      let intensity = 1;
      if (point.age < this.maxAge * 0.3) {
        intensity = Math.sin((point.age / (this.maxAge * 0.3)) * (Math.PI / 2));
      } else {
        const t = 1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7);
        intensity = -t * (t - 2);
      }
      intensity *= point.force;

      const radius = this.radius;
      const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
      const offset = this.size * 5;
      this.ctx.shadowOffsetX = offset;
      this.ctx.shadowOffsetY = offset;
      this.ctx.shadowBlur = radius * 1;
      this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

      this.ctx.beginPath();
      this.ctx.fillStyle = "rgba(255,0,0,1)";
      this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    update() {
      this.clear();
      const speed = this.speed;
      for (let i = this.trail.length - 1; i >= 0; i--) {
        const point = this.trail[i];
        const f = point.force * speed * (1 - point.age / this.maxAge);
        point.x += point.vx * f;
        point.y += point.vy * f;
        point.age++;
        if (point.age > this.maxAge) {
          this.trail.splice(i, 1);
        } else {
          this.drawPoint(point);
        }
      }
      this.texture.needsUpdate = true;
    }
  }

  class GradientBackground {
    constructor(sceneManager) {
      this.sceneManager = sceneManager;
      this.mesh = null;
      this.uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uColor1: { value: new THREE.Vector3(0.99, 0.99, 0.99) },
        uColor2: { value: new THREE.Vector3(0.788, 0.635, 0.153) },
        uColor3: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
        uColor4: { value: new THREE.Vector3(0.894, 0.753, 0.302) },
        uColor5: { value: new THREE.Vector3(0.969, 0.973, 0.98) },
        uColor6: { value: new THREE.Vector3(0.788, 0.635, 0.153) },
        uSpeed: { value: 0.9 },
        uIntensity: { value: 0.55 },
        uTouchTexture: { value: null },
        uGrainIntensity: { value: 0.03 },
        uZoom: { value: 1.0 },
        uDarkNavy: { value: new THREE.Vector3(0.99, 0.99, 0.99) },
        uGradientSize: { value: 0.38 },
        uGradientCount: { value: 6.0 },
        uColor1Weight: { value: 1.0 },
        uColor2Weight: { value: 0.18 },
      };
    }

    init() {
      const viewSize = this.sceneManager.getViewSize();
      const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);

      const material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: `
varying vec2 vUv;
void main() {
  vec3 pos = position.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  vUv = uv;
}
`,
        fragmentShader: `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform float uSpeed;
uniform float uIntensity;
uniform sampler2D uTouchTexture;
uniform float uGrainIntensity;
uniform float uZoom;
uniform vec3 uDarkNavy;
uniform float uGradientSize;
uniform float uGradientCount;
uniform float uColor1Weight;
uniform float uColor2Weight;

varying vec2 vUv;

float grain(vec2 uv, float time) {
  vec2 grainUv = uv * uResolution * 0.5;
  float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
  return grainValue * 2.0 - 1.0;
}

vec3 getGradientColor(vec2 uv, float time) {
  float gradientRadius = uGradientSize;

  vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
  vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
  vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
  vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
  vec2 center5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
  vec2 center6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);

  vec2 center7 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
  vec2 center8 = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
  vec2 center9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
  vec2 center10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
  vec2 center11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
  vec2 center12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);

  float dist1 = length(uv - center1);
  float dist2 = length(uv - center2);
  float dist3 = length(uv - center3);
  float dist4 = length(uv - center4);
  float dist5 = length(uv - center5);
  float dist6 = length(uv - center6);
  float dist7 = length(uv - center7);
  float dist8 = length(uv - center8);
  float dist9 = length(uv - center9);
  float dist10 = length(uv - center10);
  float dist11 = length(uv - center11);
  float dist12 = length(uv - center12);

  float influence1 = 1.0 - smoothstep(0.0, gradientRadius, dist1);
  float influence2 = 1.0 - smoothstep(0.0, gradientRadius, dist2);
  float influence3 = 1.0 - smoothstep(0.0, gradientRadius, dist3);
  float influence4 = 1.0 - smoothstep(0.0, gradientRadius, dist4);
  float influence5 = 1.0 - smoothstep(0.0, gradientRadius, dist5);
  float influence6 = 1.0 - smoothstep(0.0, gradientRadius, dist6);
  float influence7 = 1.0 - smoothstep(0.0, gradientRadius, dist7);
  float influence8 = 1.0 - smoothstep(0.0, gradientRadius, dist8);
  float influence9 = 1.0 - smoothstep(0.0, gradientRadius, dist9);
  float influence10 = 1.0 - smoothstep(0.0, gradientRadius, dist10);
  float influence11 = 1.0 - smoothstep(0.0, gradientRadius, dist11);
  float influence12 = 1.0 - smoothstep(0.0, gradientRadius, dist12);

  vec2 rotatedUv1 = uv - 0.5;
  float angle1 = time * uSpeed * 0.15;
  rotatedUv1 = vec2(
    rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
    rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
  );
  rotatedUv1 += 0.5;

  vec2 rotatedUv2 = uv - 0.5;
  float angle2 = -time * uSpeed * 0.12;
  rotatedUv2 = vec2(
    rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
    rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
  );
  rotatedUv2 += 0.5;

  float radialGradient1 = length(rotatedUv1 - 0.5);
  float radialGradient2 = length(rotatedUv2 - 0.5);
  float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, radialGradient2);

  float blobMask = 0.0;
  blobMask = max(blobMask, influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)));
  blobMask = max(blobMask, influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)));
  blobMask = max(blobMask, influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)));
  blobMask = max(blobMask, radialInfluence2 * 0.45);
  blobMask = clamp(blobMask * uColor2Weight * 2.4, 0.0, 1.0);

  vec3 white = vec3(1.0);
  vec3 goldTone = mix(uColor2, uColor4, 0.4);
  return mix(white, goldTone, blobMask * uIntensity);
}

void main() {
  vec2 uv = vUv;
  vec4 touchTex = texture2D(uTouchTexture, uv);
  float vx = -(touchTex.r * 2.0 - 1.0);
  float vy = -(touchTex.g * 2.0 - 1.0);
  float intensity = touchTex.b;

  uv.x += vx * 0.1 * intensity;
  uv.y += vy * 0.1 * intensity;

  vec2 center = vec2(0.5);
  float dist = length(uv - center);
  float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.012 * intensity;
  float wave = sin(dist * 15.0 - uTime * 2.0) * 0.009 * intensity;
  uv += vec2(ripple + wave);

  vec3 color = getGradientColor(uv, uTime);
  color = clamp(color, vec3(0.0), vec3(1.0));

  gl_FragColor = vec4(color, 1.0);
}
`,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.z = 0;
      this.sceneManager.scene.add(this.mesh);
    }

    update(delta) {
      if (this.uniforms.uTime) this.uniforms.uTime.value += delta;
    }

    onResize(width, height) {
      const viewSize = this.sceneManager.getViewSize();
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
      }
      if (this.uniforms.uResolution) this.uniforms.uResolution.value.set(width, height);
    }
  }

  class HeroLiquidGradient {
    constructor(containerEl, pointerTargetEl) {
      this.containerEl = containerEl;
      this.pointerTargetEl = pointerTargetEl || containerEl;
      this.renderer = null;
      this.camera = null;
      this.scene = null;
      this.clock = null;
      this.touchTexture = null;
      this.gradientBackground = null;
      this.rafId = null;
      this.paused = false;
      this.initialized = false;
      this.resizeObserver = null;
      this.onMouseMoveBound = null;
      this.onTouchMoveBound = null;
      this.onTouchStartBound = null;
      this.onLeaveBound = null;
      this._lastRect = null;
    }

    init() {
      if (!this.containerEl) return;

      const reducedMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;

      if (typeof window.THREE === "undefined") return;

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        alpha: true,
        stencil: false,
        depth: false,
      });
      this.renderer.setAnimationLoop(null);
      this.renderer.domElement.className = "hero-webgl-canvas";
      this.containerEl.appendChild(this.renderer.domElement);

      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
      this.camera.position.z = 50;
      this.scene = new THREE.Scene();
      this.scene.background = null;
      this.clock = new THREE.Clock();

      this.touchTexture = new TouchTexture();
      this.gradientBackground = new GradientBackground(this);
      this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;

      const u = this.gradientBackground.uniforms;
      const themeColors = (window.__SITE_THEME__ && window.__SITE_THEME__.colors) || {};
      const whiteBase = hexToVec3(themeColors.primary, "#ffffff");
      const whiteLight = hexToVec3(themeColors.primaryLight, "#ffffff");
      const gold = hexToVec3(themeColors.secondary, "#c9a227");
      const goldLight = hexToVec3(themeColors.secondaryLight, "#e4c04d");

      u.uColor1.value.copy(whiteBase);
      u.uColor2.value.copy(gold);
      u.uColor3.value.copy(whiteLight);
      u.uColor4.value.copy(goldLight);
      u.uColor5.value.copy(whiteLight);
      u.uColor6.value.copy(gold);
      u.uDarkNavy.value.copy(whiteBase);

      u.uIntensity.value = 0.65;
      u.uSpeed.value = 0.9;
      u.uGrainIntensity.value = 0.03;
      u.uGradientSize.value = 0.38;
      u.uGradientCount.value = 6.0;
      u.uColor1Weight.value = 1.0;
      u.uColor2Weight.value = 0.32;

      this.gradientBackground.init();
      this.resize();
      this.setupEvents();
      this.initialized = true;
      this.paused = false;
      this.tick();
    }

    setupEvents() {
      this.onMouseMoveBound = (ev) => this.onPointerMove(ev.clientX, ev.clientY);
      this.onTouchMoveBound = (ev) => {
        if (!ev.touches || !ev.touches[0]) return;
        this.onPointerMove(ev.touches[0].clientX, ev.touches[0].clientY);
      };
      this.onTouchStartBound = (ev) => {
        if (!ev.touches || !ev.touches[0]) return;
        this.onPointerMove(ev.touches[0].clientX, ev.touches[0].clientY);
      };
      this.onLeaveBound = () => {
        this.touchTexture && this.touchTexture.addTouch({ x: 0.5, y: 0.5 });
      };

      const target = this.pointerTargetEl || this.containerEl;
      target.addEventListener("mousemove", this.onMouseMoveBound, { passive: true });
      target.addEventListener("touchmove", this.onTouchMoveBound, { passive: true });
      target.addEventListener("touchstart", this.onTouchStartBound, { passive: true });
      target.addEventListener("mouseleave", this.onLeaveBound, { passive: true });

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.containerEl);
      window.addEventListener("resize", () => this.resize(), { passive: true });
    }

    onPointerMove(clientX, clientY) {
      if (!this.touchTexture || this.paused) return;
      const rect = this.containerEl.getBoundingClientRect();
      this._lastRect = rect;
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
      this.touchTexture.addTouch({ x, y });
    }

    getViewSize() {
      const fovInRadians = (this.camera.fov * Math.PI) / 180;
      const height = Math.abs(this.camera.position.z * Math.tan(fovInRadians / 2) * 2);
      return { width: height * this.camera.aspect, height };
    }

    resize() {
      if (!this.renderer || !this.camera || !this.gradientBackground) return;
      const rect = this.containerEl.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.gradientBackground.onResize(width, height);
    }

    update(delta) {
      this.touchTexture && this.touchTexture.update();
      this.gradientBackground && this.gradientBackground.update(delta);
    }

    render() {
      if (!this.renderer || !this.scene || !this.camera) return;
      const delta = this.clock.getDelta();
      const clampedDelta = Math.min(delta, 0.1);
      this.renderer.render(this.scene, this.camera);
      this.update(clampedDelta);
    }

    tick() {
      if (this.paused || !this.initialized) return;
      this.render();
      this.rafId = requestAnimationFrame(() => this.tick());
    }

    pause() {
      this.paused = true;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    resume() {
      if (!this.initialized || !this.paused) return;
      this.paused = false;
      this.tick();
    }

    dispose() {
      this.pause();

      if (this.resizeObserver) this.resizeObserver.disconnect();
      this.resizeObserver = null;

      if (this.pointerTargetEl && this.onMouseMoveBound) {
        this.pointerTargetEl.removeEventListener("mousemove", this.onMouseMoveBound);
        this.pointerTargetEl.removeEventListener("touchmove", this.onTouchMoveBound);
        this.pointerTargetEl.removeEventListener("touchstart", this.onTouchStartBound);
        this.pointerTargetEl.removeEventListener("mouseleave", this.onLeaveBound);
      }

      if (this.gradientBackground && this.gradientBackground.mesh) {
        this.gradientBackground.mesh.geometry.dispose();
        this.gradientBackground.mesh.material.dispose();
        this.gradientBackground.mesh = null;
      }

      if (this.touchTexture && this.touchTexture.texture) {
        this.touchTexture.texture.dispose();
      }

      if (this.renderer) {
        this.renderer.dispose();
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
      }

      this.renderer = null;
      this.camera = null;
      this.scene = null;
      this.clock = null;
      this.touchTexture = null;
      this.gradientBackground = null;
      this.initialized = false;
    }
  }

  window.HeroLiquidGradient = HeroLiquidGradient;

  const container = document.getElementById("hero-webgl-bg");
  const hero = document.querySelector(".hero-liquid");
  if (container && hero && window.THREE) {
    window.__heroLiquidGradient = new HeroLiquidGradient(container, hero);
    window.__heroLiquidGradient.init();
  }
})();
