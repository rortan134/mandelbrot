"use client";

import "@radix-ui/themes/styles.css";
import { Flex, Text, Button, Box } from "@radix-ui/themes";
import * as React from "react";
import * as THREE from "three";

export const dynamic = "error";

let i;

// Time variables and constants
const deltaMaximum = 1e-3;
const deltaMinimum = 1e-7;
const deltaPerStep = 1e-5;
const tStart = -2.5;
const tEnd = 3.0;
let rollingDelta = deltaPerStep;

// Computational and simulation variables
const iters = 512;
const steps = 512;
let t = tStart;
let params: number[] = [];
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let uniforms: Record<string, Omit<THREE.Uniform, "clone">>;

// Base27 conversion
const CHAR_TO_N: Record<string, number> = {
  _: 0,
  A: 1,
  N: 14,
  B: 2,
  O: 15,
  C: 3,
  P: 16,
  D: 4,
  Q: 17,
  E: 5,
  R: 18,
  F: 6,
  S: 19,
  G: 7,
  T: 20,
  H: 8,
  U: 21,
  I: 9,
  V: 22,
  J: 10,
  W: 23,
  K: 11,
  X: 24,
  L: 12,
  Y: 25,
  M: 13,
  Z: 26,
};

function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num;
}

function floatEquals(a: number, b: number) {
  return Math.abs(b - a) < 0.001;
}

function getRandomChaosParameters() {
  const p = [];
  for (i = 0; i < 18; i++) {
    const r = Math.floor(Math.random() * 3);
    if (r === 0) {
      p[i] = 1.0;
    } else if (r === 1) {
      p[i] = -1.0;
    } else {
      p[i] = 0.0;
    }
  }
  return p;
}

export default function HomePage() {
  // DOM variables
  let windowW = window.innerWidth;
  let windowH = window.innerHeight;
  // Viewport in world units
  const screenWorldUnits = new THREE.Vector2(5.0, (5.0 * windowH) / windowW);

  function getOrCreateInitialURLParameter() {
    try {
      // Get code hash from url and check its format
      const hash = window.location.hash.substr(1);
      if (RegExp("[A-Za-z_]{6}").test(hash)) return decodeStringToParams(hash);
    } catch (err) {}
    return getRandomChaosParameters();
  }

  const computeVertexArray = new Float32Array(iters * steps * 3);
  const computeBufferGeometry = new THREE.BufferGeometry();
  computeBufferGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(computeVertexArray, 3),
  );

  function createVirtualCamera() {
    const camera = new THREE.OrthographicCamera(
      screenWorldUnits.x / -2,
      screenWorldUnits.x / 2,
      screenWorldUnits.y / 2,
      screenWorldUnits.y / -2,
      1,
      1000,
    );
    camera.position.z = 10;
    return camera;
  }

  function createScene() {
    return new THREE.Scene();
  }

  function createSceneRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      precision: "lowp",
      depth: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
  }

  function appendSceneRendererToDOM() {
    const container = document.getElementById("main");
    if (container) container.appendChild(renderer.domElement);
  }

  function getVisualShaderMaterial() {
    uniforms = {
      iters: { value: iters },
      steps: { value: steps },
      cpuTime: { value: t },
      deltaTime: { value: 0.01 },
      px: { value: null },
      py: { value: null },
      pixelRatio: { value: window.devicePixelRatio },
      colorTexture: { value: createVertexColorTexture() },
    };

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vColor;

        uniform float iters;
        uniform float steps;
        uniform mat3 px;
        uniform mat3 py;
        uniform float cpuTime;
        uniform float deltaTime;
        uniform float pixelRatio;
        uniform sampler2D colorTexture;

        const int MAX_ITERATIONS = 2048;

        void main() {
          int thisIter = int(position.x);
          float t = cpuTime + deltaTime * position.y;

          vec3 pos = vec3(t, t, t);

          for (int iter = 0; iter < MAX_ITERATIONS; iter++) {
            if (iter > thisIter){
              break;
            }

            vec3 xxyytt = pos * pos; // x*x, y*y, t*t combinations
            vec3 xyxzyz = pos.xxy * pos.yzz; // x*y, x*z, y*z combinations

            pos.xy = vec2(
              xxyytt.x * px[0][0] + xxyytt.y * px[1][0] + xxyytt.z * px[2][0] + xyxzyz.x * px[0][1] + xyxzyz.y * px[1][1] + xyxzyz.z * px[2][1] + pos.x * px[0][2] + pos.y * px[1][2] + pos.z * px[2][2],
              xxyytt.x * py[0][0] + xxyytt.y * py[1][0] + xxyytt.z * py[2][0] + xyxzyz.x * py[0][1] + xyxzyz.y * py[1][1] + xyxzyz.z * py[2][1] + pos.x * py[0][2] + pos.y * py[1][2] + pos.z * py[2][2]
            );
          }

          gl_PointSize = 1.8 * pixelRatio;
          vec4 modelViewPosition = modelViewMatrix * vec4(pos.xy, 0., 1.);
          gl_Position = projectionMatrix * modelViewPosition;

          if (position.x > 1.0 && position.y > 1.0){
            vColor = texture2D(colorTexture, position.xy / vec2(steps, iters)).rgb;
          } else {
            vColor = vec3(1., 1., 1.);
          }
        }`,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          gl_FragColor = vec4(vColor, 1.);
        }
      `,
    });
  }

  function initializeVerticesOnPixelCoordinates() {
    let rowCounter = 0;
    let colCounter = 0;
    for (i = 2; i < computeVertexArray.length; i += 3) {
      computeVertexArray[i - 1] = rowCounter;
      computeVertexArray[i - 2] = colCounter;

      rowCounter++;
      if (rowCounter >= iters) {
        rowCounter = 0;
        colCounter++;
      }
    }
  }

  function setNewChaosParameters(newParams: number[]) {
    params = newParams;
    // Update UI
    createUI(params);
    // Update Url with new code
    window.location.hash = encodeParamsToString(params);
  }

  function onWindowResize() {
    windowW = window.innerWidth;
    windowH = window.innerHeight;
    //   camera.aspect = windowW / windowH;
    camera.updateProjectionMatrix();
    renderer.setSize(windowW, windowH);
  }

  function initialize() {
    initializeVerticesOnPixelCoordinates();
    setNewChaosParameters(getOrCreateInitialURLParameter());
    camera = createVirtualCamera();
    scene = createScene();
    renderer = createSceneRenderer();
    appendSceneRendererToDOM();
    scene.add(
      new THREE.Points(computeBufferGeometry, getVisualShaderMaterial()),
    );
    window.addEventListener("resize", onWindowResize, false);
    animate();
  }

  /**
   * Encodes 18 parameters into a string
   */
  function encodeParamsToString(params: number[]) {
    const base27 = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let a = 0;
    let n = 0;
    let result = "";
    for (i = 0; i < 18; i++) {
      a = a * 3 + Math.floor(params[i]!) + 1;
      n += 1;
      if (n === 3) {
        result += base27.charAt(a);
        a = 0;
        n = 0;
      }
    }
    return result;
  }

  function decodeStringToParams(str: string): number[] {
    const params = [];
    const ustr = str.toUpperCase();
    for (i = 0; i < 18 / 3; i++) {
      let a = 0;
      const c = i < ustr.length ? ustr.charAt(i) : "_";
      const char = CHAR_TO_N[c]!;
      const charA = CHAR_TO_N.A!;
      if (char >= charA && char <= CHAR_TO_N.Z!) {
        a = char - charA + 1;
      }
      params[i * 3 + 2] = parseInt((a % 3).toString()) - 1;
      a /= 3;
      params[i * 3 + 1] = parseInt((a % 3).toString()) - 1;
      a /= 3;
      params[i * 3] = parseInt((a % 3).toString()) - 1;
    }
    return params;
  }

  function makeEquationStr(params: number[]) {
    function SIGN_OR_SKIP(
      param: number,
      mathVariable: string,
      isFirst = false,
    ) {
      let string = "";
      if (!floatEquals(param, 0.0)) {
        if (isFirst) {
          if (floatEquals(param, -1.0)) {
            string += "-";
          }
        } else {
          if (floatEquals(param, -1.0)) {
            string += " - ";
          } else {
            string += " + ";
          }
        }
        string += mathVariable;
      }

      return string;
    }

    let equation = "";
    equation += SIGN_OR_SKIP(params[0]!, "x\u00b2", true);
    equation += SIGN_OR_SKIP(params[1]!, "y\u00b2");
    equation += SIGN_OR_SKIP(params[2]!, "t\u00b2");
    equation += SIGN_OR_SKIP(params[3]!, "xy");
    equation += SIGN_OR_SKIP(params[4]!, "xt");
    equation += SIGN_OR_SKIP(params[5]!, "yt");
    equation += SIGN_OR_SKIP(params[6]!, "x");
    equation += SIGN_OR_SKIP(params[7]!, "y");
    equation += SIGN_OR_SKIP(params[8]!, "t");
    return equation;
  }

  const ly = new Array(iters);
  const lx = new Array(iters);

  /**
   * Only do the first iterations on the CPU, and check delta
   */
  function getNextDeltaTime() {
    let foundInViewport = false;
    rollingDelta = rollingDelta * 0.99 + deltaPerStep * 0.01;
    let x = t;
    let y = t;

    // For all points in the series
    for (i = 0; i < iters; i++) {
      const xx = x * x;
      const yy = y * y;
      const tt = t * t;
      const xy = x * y;
      const xt = x * t;
      const yt = y * t;
      let nx =
        xx * params[0]! +
        yy * params[1]! +
        tt * params[2]! +
        xy * params[3]! +
        xt * params[4]! +
        yt * params[5]! +
        x * params[6]! +
        y * params[7]! +
        t * params[8]!;
      let ny =
        xx * params[9]! +
        yy * params[10]! +
        tt * params[11]! +
        xy * params[12]! +
        xt * params[13]! +
        yt * params[14]! +
        x * params[15]! +
        y * params[16]! +
        t * params[17]!;

      nx = clamp(nx, -10000, 10000);
      ny = clamp(ny, -10000, 10000);

      y = ny;
      x = nx;

      if (isPointWithinViewport(nx, ny)) {
        // Square of distance is enough for comparison
        const squaredDist =
          (lx[i] - nx) * (lx[i] - nx) + (ly[i] - ny) * (ly[i] - ny);
        rollingDelta = Math.min(
          rollingDelta,
          Math.max(deltaPerStep / (squaredDist + 1e-5), deltaMinimum),
        );
        foundInViewport = true;
        break;
      }

      lx[i] = nx;
      ly[i] = ny;
    }

    if (!foundInViewport) return deltaMaximum;
    if (isNaN(rollingDelta)) rollingDelta = deltaPerStep;

    return rollingDelta;
  }

  function updateShaderUniforms() {
    // Reset animation
    if (t > tEnd) {
      // New params (equation)
      setNewChaosParameters(getRandomChaosParameters());
      t = tStart;
    }

    const paramsX = new THREE.Matrix3();
    const paramsY = new THREE.Matrix3();

    paramsX.set(
      params[0]!,
      params[1]!,
      params[2]!,
      params[3]!,
      params[4]!,
      params[5]!,
      params[6]!,
      params[7]!,
      params[8]!,
    );
    paramsY.set(
      params[9]!,
      params[10]!,
      params[11]!,
      params[12]!,
      params[13]!,
      params[14]!,
      params[15]!,
      params[16]!,
      params[17]!,
    );

    const deltaTime = getNextDeltaTime();
    uniforms.px!.value = paramsX;
    uniforms.py!.value = paramsY;
    uniforms.deltaTime!.value = deltaTime;
    uniforms.cpuTime!.value = t;
    t += deltaTime * steps;
  }

  function isPointWithinViewport(x: number, y: number) {
    const sx = screenWorldUnits.x * 0.5;
    const sy = screenWorldUnits.y * 0.5;
    return x > -sx && x < sx && y > -sy && y < sy;
  }

  function createVertexColorTexture(): THREE.DataTexture {
    const data = new Uint8Array(steps * iters * 3);

    for (let i = 0; i < steps * iters; i++) {
      const color = getNextColor(i);
      const stride = i * 3;
      data[stride] = color.r * 255;
      data[stride + 1] = color.g * 255;
      data[stride + 2] = color.b * 255;
    }

    const texture = new THREE.DataTexture(data, steps, iters, THREE.RGBFormat);
    texture.needsUpdate = true;
    return texture;
  }

  function getNextColor(pos: number): THREE.Color {
    const r = Math.min(255, 90 + ((pos * 11909) % 256));
    const g = Math.min(255, 90 + ((pos * 52973) % 256));
    const b = Math.min(255, 90 + ((pos * 44111) % 256));
    return new THREE.Color(r / 255.0, g / 255.0, b / 255.0);
  }

  function createUI(params: number[]) {
    document.getElementById("chaos-ui--x-equation").textContent =
      "x' = " + makeEquationStr(params.slice(0, 9));
    document.getElementById("chaos-ui--y-equation").textContent =
      "y' = " + makeEquationStr(params.slice(9, 18));
    document.getElementById("chaos-ui--code").textContent =
      "Code: " + encodeParamsToString(params);
    document.getElementById("chaos-ui--time").textContent =
      "t = " + t.toFixed(6);
  }

  function updateUI() {
    const element = document.getElementById("chaos-ui--time");
    if (element) element.textContent = "t = " + t.toFixed(6);
  }

  function animate() {
    updateUI();
    updateShaderUniforms();
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  }

  React.useLayoutEffect(() => {
    initialize();
    return () => {
      const elements = document.getElementsByTagName("canvas");
      const container = document.getElementById("main");
      if (elements && container)
        [...elements].forEach((e) => container.removeChild(e));
    };
  }, []);

  return (
    <main
      id="main"
      tabIndex={-1}
      role="main"
      className="relative flex h-full max-h-screen flex-col items-center justify-center"
    >
      <Flex gap="3" align="center" justify="between">
        <span id="chaos-ui--x-equation"></span>
        <span id="chaos-ui--y-equation"></span>
        <span id="chaos-ui--time"></span>
        <span id="chaos-ui--code"></span>
      </Flex>
    </main>
  );
}
