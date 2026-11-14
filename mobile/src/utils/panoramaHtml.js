/**
 * Generates standalone, self-contained HTML for an interactive WebGL 360° Equirectangular Panorama Viewer.
 * Runs seamlessly in React Native WebView (iOS/Android) and HTML5 iframe (Web).
 * Includes touch drag, inertia, pinch-to-zoom, auto-rotate, offline procedural fallback, and bidirectional postMessage.
 */

export function generatePanoramaHtml({
  scene,
  scenes = [],
  propertyTitle = 'Virtual Tour',
  autoRotate = false,
}) {
  const safeScene = scene || (scenes && scenes[0]) || {
    id: 'default',
    name: 'Room',
    panoramaUrl: '',
    initialYaw: 0,
    initialPitch: 0,
    initialFov: 75,
  };

  const initialYawRad = ((safeScene.initialYaw || 0) * Math.PI) / 180;
  const initialPitchRad = ((safeScene.initialPitch || 0) * Math.PI) / 180;
  const initialFovRad = ((safeScene.initialFov || 75) * Math.PI) / 180;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${propertyTitle || '360° Virtual Tour'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    #viewport {
      position: relative;
      width: 100%;
      height: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
    }
    canvas:active {
      cursor: grabbing;
    }
    .loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.82);
      color: #F8FAFC;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 10;
    }
    .loading-overlay.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #2563EB;
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: 14px;
      font-weight: 500;
      color: #E2E8F0;
      letter-spacing: 0.3px;
    }
    .retrying-badge {
      font-size: 12px;
      color: #94A3B8;
      margin-top: 6px;
    }
    .compass {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #F8FAFC;
      font-size: 11px;
      font-weight: bold;
      pointer-events: none;
      z-index: 5;
    }
    .compass-needle {
      position: absolute;
      width: 2px;
      height: 22px;
      background: linear-gradient(to bottom, #EF4444 50%, #94A3B8 50%);
      transform-origin: center;
    }
  </style>
</head>
<body>
  <div id="viewport">
    <canvas id="glcanvas"></canvas>
    <div id="loader" class="loading-overlay">
      <div class="spinner"></div>
      <div id="loaderText" class="loading-text">Loading 360° Scene...</div>
      <div id="loaderSub" class="retrying-badge">Equirectangular VR Projection</div>
    </div>
    <div class="compass" id="compass">
      <div class="compass-needle" id="compassNeedle"></div>
    </div>
  </div>

  <script>
    (function() {
      var currentScene = ${JSON.stringify(safeScene)};
      var autoRotate = ${autoRotate ? 'true' : 'false'};
      var canvas = document.getElementById('glcanvas');
      var loader = document.getElementById('loader');
      var loaderText = document.getElementById('loaderText');
      var compassNeedle = document.getElementById('compassNeedle');

      var yaw = ${initialYawRad};
      var pitch = ${initialPitchRad};
      var targetYaw = yaw;
      var targetPitch = pitch;
      var fov = ${initialFovRad};
      var targetFov = fov;

      var minFov = 35 * Math.PI / 180;
      var maxFov = 95 * Math.PI / 180;
      var minPitch = -85 * Math.PI / 180;
      var maxPitch = 85 * Math.PI / 180;

      var isDragging = false;
      var lastPointerX = 0;
      var lastPointerY = 0;
      var touchStartDist = 0;
      var lastInteractionTime = Date.now();
      var isUsingFallback = false;

      // WebGL setup
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        showFallbackMessage('WebGL not supported on this device.');
        return;
      }

      var vsSource = [
        'attribute vec2 aPosition;',
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = (aPosition + 1.0) * 0.5;',
        '  gl_Position = vec4(aPosition, 0.0, 1.0);',
        '}'
      ].join('\\n');

      var fsSource = [
        'precision mediump float;',
        'varying vec2 vUv;',
        'uniform sampler2D uTexture;',
        'uniform float uYaw;',
        'uniform float uPitch;',
        'uniform float uFov;',
        'uniform float uAspect;',
        'const float PI = 3.14159265358979323846;',
        'void main() {',
        '  vec2 ndc = (vUv - 0.5) * 2.0;',
        '  float tanFov = tan(uFov * 0.5);',
        '  vec3 ray = normalize(vec3(ndc.x * tanFov * uAspect, ndc.y * tanFov, 1.0));',
        '  float cp = cos(uPitch);',
        '  float sp = sin(uPitch);',
        '  vec3 r1 = vec3(ray.x, ray.y * cp - ray.z * sp, ray.y * sp + ray.z * cp);',
        '  float cy = cos(uYaw);',
        '  float sy = sin(uYaw);',
        '  vec3 r2 = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);',
        '  float phi = atan(r2.x, r2.z);',
        '  float theta = asin(clamp(r2.y, -0.9999, 0.9999));',
        '  vec2 uv = vec2(phi / (2.0 * PI) + 0.5, 0.5 - theta / PI);',
        '  gl_FragColor = texture2D(uTexture, uv);',
        '}'
      ].join('\\n');

      function createShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      var vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
      var fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      var program = gl.createProgram();
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      var positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      var positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      var aPosition = gl.getAttribLocation(program, 'aPosition');
      var uTexture = gl.getUniformLocation(program, 'uTexture');
      var uYaw = gl.getUniformLocation(program, 'uYaw');
      var uPitch = gl.getUniformLocation(program, 'uPitch');
      var uFov = gl.getUniformLocation(program, 'uFov');
      var uAspect = gl.getUniformLocation(program, 'uAspect');

      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([30, 41, 59, 255]));

      function notifyParent(data) {
        var str = JSON.stringify(data);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(str);
        } else if (window.parent && window.parent.postMessage) {
          window.parent.postMessage(str, '*');
        }
      }

      function createProceduralPanorama(roomName) {
        var offCanvas = document.createElement('canvas');
        offCanvas.width = 2048;
        offCanvas.height = 1024;
        var ctx = offCanvas.getContext('2d');

        // Ceiling gradient
        var grad = ctx.createLinearGradient(0, 0, 0, 1024);
        grad.addColorStop(0.0, '#1E293B');
        grad.addColorStop(0.35, '#334155');
        grad.addColorStop(0.5, '#475569');
        grad.addColorStop(0.65, '#3E2723');
        grad.addColorStop(1.0, '#1F1610');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 2048, 1024);

        // Grid floor perspective simulation
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        for (var x = 0; x <= 2048; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, 560);
          ctx.lineTo(x + (x - 1024) * 0.4, 1024);
          ctx.stroke();
        }
        for (var y = 560; y <= 1024; y += 45) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(2048, y);
          ctx.stroke();
        }

        // Room walls with stylized windows & architectural elements
        ctx.fillStyle = '#0F766E';
        ctx.fillRect(400, 320, 360, 240);
        ctx.fillStyle = '#E0F2FE';
        ctx.fillRect(420, 340, 320, 200);

        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(1200, 320, 400, 240);
        ctx.fillStyle = '#EEF2FF';
        ctx.fillRect(1220, 340, 360, 200);

        // Ceiling downlights
        ctx.fillStyle = 'rgba(255, 253, 231, 0.85)';
        for (var lx = 250; lx <= 1800; lx += 380) {
          ctx.beginPath();
          ctx.arc(lx, 180, 24, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center room name watermark
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(roomName || 'Virtual Tour Room', 1024, 460);
        ctx.font = '24px -apple-system, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('NestMate 360° Panoramic Preview', 1024, 510);

        return offCanvas;
      }

      function loadSceneImage(sceneObj) {
        loader.classList.remove('hidden');
        loaderText.textContent = 'Loading ' + (sceneObj.name || 'Room') + ' 360°...';

        var img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = function() {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

          loader.classList.add('hidden');
          isUsingFallback = false;
          notifyParent({ type: 'loaded', sceneId: sceneObj.id, isFallback: false });
        };

        img.onerror = function() {
          console.warn('Panorama image failed to load, generating offline procedural scene:', sceneObj.panoramaUrl);
          var fallbackCanvas = createProceduralPanorama(sceneObj.name);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fallbackCanvas);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

          loader.classList.add('hidden');
          isUsingFallback = true;
          notifyParent({
            type: 'loaded',
            sceneId: sceneObj.id,
            isFallback: true,
            warning: 'Network image unavailable, displayed offline 360° fallback.'
          });
        };

        if (sceneObj.panoramaUrl) {
          img.src = sceneObj.panoramaUrl;
        } else {
          img.onerror();
        }
      }

      function resize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }

      window.addEventListener('resize', resize);
      resize();
      loadSceneImage(currentScene);

      // Touch and pointer controls
      canvas.addEventListener('pointerdown', function(e) {
        isDragging = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        lastInteractionTime = Date.now();
      });

      window.addEventListener('pointermove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - lastPointerX;
        var dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        lastInteractionTime = Date.now();

        var speed = fov / canvas.clientWidth;
        targetYaw -= dx * speed;
        targetPitch += dy * speed;
        targetPitch = Math.max(minPitch, Math.min(maxPitch, targetPitch));
      });

      window.addEventListener('pointerup', function() {
        isDragging = false;
      });
      window.addEventListener('pointercancel', function() {
        isDragging = false;
      });

      // Touch pinch zoom
      canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          var dx = e.touches[0].clientX - e.touches[1].clientX;
          var dy = e.touches[0].clientY - e.touches[1].clientY;
          touchStartDist = Math.sqrt(dx * dx + dy * dy);
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && touchStartDist > 0) {
          var dx = e.touches[0].clientX - e.touches[1].clientX;
          var dy = e.touches[0].clientY - e.touches[1].clientY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var factor = touchStartDist / dist;
          targetFov = Math.max(minFov, Math.min(maxFov, targetFov * factor));
          touchStartDist = dist;
          lastInteractionTime = Date.now();
        }
      }, { passive: true });

      // Wheel zoom (web)
      canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        var delta = e.deltaY * 0.001;
        targetFov = Math.max(minFov, Math.min(maxFov, targetFov + delta));
        lastInteractionTime = Date.now();
      }, { passive: false });

      // Animation loop
      var lastTime = performance.now();
      function render(time) {
        var dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        // Auto-rotation when enabled and user is idle for >2.5s
        if (autoRotate && !isDragging && (Date.now() - lastInteractionTime > 2500)) {
          targetYaw += 0.15 * dt;
        }

        // Smooth damping
        yaw += (targetYaw - yaw) * 0.18;
        pitch += (targetPitch - pitch) * 0.18;
        fov += (targetFov - fov) * 0.18;

        // Update compass needle
        if (compassNeedle) {
          var deg = -yaw * 180 / Math.PI;
          compassNeedle.style.transform = 'rotate(' + deg + 'deg)';
        }

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1i(uTexture, 0);
        gl.uniform1f(uYaw, yaw);
        gl.uniform1f(uPitch, pitch);
        gl.uniform1f(uFov, fov);
        gl.uniform1f(uAspect, canvas.width / canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);

      // Inbound message handler
      function handleInboundMessage(raw) {
        try {
          var data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!data || !data.type) return;

          if (data.type === 'switchScene' && data.scene) {
            currentScene = data.scene;
            targetYaw = ((data.scene.initialYaw || 0) * Math.PI) / 180;
            targetPitch = ((data.scene.initialPitch || 0) * Math.PI) / 180;
            targetFov = ((data.scene.initialFov || 75) * Math.PI) / 180;
            loadSceneImage(currentScene);
          } else if (data.type === 'zoomIn') {
            targetFov = Math.max(minFov, targetFov - 12 * Math.PI / 180);
            lastInteractionTime = Date.now();
          } else if (data.type === 'zoomOut') {
            targetFov = Math.min(maxFov, targetFov + 12 * Math.PI / 180);
            lastInteractionTime = Date.now();
          } else if (data.type === 'resetView') {
            targetYaw = ((currentScene.initialYaw || 0) * Math.PI) / 180;
            targetPitch = ((currentScene.initialPitch || 0) * Math.PI) / 180;
            targetFov = ((currentScene.initialFov || 75) * Math.PI) / 180;
            lastInteractionTime = Date.now();
          } else if (data.type === 'toggleAutoRotate') {
            autoRotate = data.enabled !== undefined ? !!data.enabled : !autoRotate;
            lastInteractionTime = Date.now();
          }
        } catch (err) {
          console.error('Error handling inbound virtual tour message:', err);
        }
      }

      window.addEventListener('message', function(ev) {
        handleInboundMessage(ev.data);
      });
      document.addEventListener('message', function(ev) {
        handleInboundMessage(ev.data);
      });
    })();
  </script>
</body>
</html>`;
}
