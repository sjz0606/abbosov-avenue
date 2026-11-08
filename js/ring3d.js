/* 3D lookbook: kolleksiya suratlari egilgan panellarda halqa bo'lib aylanadi.
   Sudrab aylantiriladi, panel bosilsa mahsulot kartochkasi ochiladi.
   WebGL yo'q bo'lsa — oddiy gorizontal lenta (CSS fallback) qoladi. */
import * as THREE from "three";

const stage = document.getElementById("ringStage");
const canvas = document.getElementById("ring");
const caption = document.getElementById("ringCaption");
const AA = window.AA;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const IDS = ["suit-brown", "blazer-navy", "denim-overshirt", "jacket-beige", "knit-polo", "puffer", "suit-olive", "tee-black", "tees-set", "sneaker-brown"];

function start() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1d1f21, 8, 15);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

  const products = IDS.map(id => AA.products.find(p => p.id === id)).filter(Boolean);
  const N = products.length, R = 4.4, arc = (Math.PI * 2 / N) * 0.84;
  const H = (R * arc) * 4 / 3;                       // 3:4 nisbat
  const ring = new THREE.Group();
  ring.rotation.x = 0.05;
  scene.add(ring);

  const loader = new THREE.TextureLoader();
  const backMat = new THREE.MeshBasicMaterial({ color: 0x2a2c2f, side: THREE.BackSide });
  const panels = products.map((p, i) => {
    const start = i * (Math.PI * 2 / N) - arc / 2;
    const geo = new THREE.CylinderGeometry(R, R, H, 24, 1, true, start, arc);
    const mat = new THREE.MeshBasicMaterial({ color: 0x3a3c3f, side: THREE.FrontSide, transparent: true, opacity: 1 });
    loader.load(p.img + "-sm.jpg", tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      // 3:4 kadrni panel nisbatiga markazdan qirqish
      const img = tex.image, want = 3 / 4, have = img.width / img.height;
      if (have > want) { tex.repeat.set(want / have, 1); tex.offset.set((1 - want / have) / 2, 0); }
      else { tex.repeat.set(1, have / want); tex.offset.set(0, (1 - have / want) / 2); }
      mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
    });
    const front = new THREE.Mesh(geo, mat);
    const back = new THREE.Mesh(geo, backMat);
    front.userData = { id: p.id, index: i };
    ring.add(front, back);
    return front;
  });

  // kichik "pol" chizig'i — halqa ostida yupqa latun aylana
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(R * 0.995, R * 1.005, 128),
    new THREE.MeshBasicMaterial({ color: 0xa8843f, transparent: true, opacity: .55, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -H / 2 - 0.25;
  ring.add(floor);

  /* ---------- o'lcham ---------- */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // tor ekranda kamerani uzoqlashtiramiz
    // halqa vertikal va gorizontal sig'ishi uchun masofani hisoblaymiz
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distV = R + (H / 2 + 0.75) / tv;
    const distH = (R + 0.6) / (tv * camera.aspect) + R * 0.25;
    // tor ekranda halqa chetlari kesilishi mumkin — oldingi panel yirik bo'lishi muhimroq
    const dist = Math.max(distV, Math.min(distH, distV * 1.15), 10.5);
    camera.position.set(0, 0.9, dist);
    camera.lookAt(0, -0.15, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------- boshqaruv ---------- */
  let rot = 0, vel = reduced ? 0 : 0.0016, target = null, dragging = false, lastX = 0, moved = 0;
  const auto = reduced ? 0 : 0.0016;
  canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; moved = 0; target = null; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", e => {
    if (dragging) {
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      vel = dx * 0.0045; rot += vel;
    } else hover(e);
  });
  const end = e => {
    if (!dragging) return; dragging = false;
    if (moved < 6) click(e);
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  canvas.tabIndex = 0;
  canvas.addEventListener("keydown", e => {
    const step = Math.PI * 2 / N;
    if (e.key === "ArrowLeft") { target = snap(rot) + step; e.preventDefault(); }
    if (e.key === "ArrowRight") { target = snap(rot) - step; e.preventDefault(); }
    if (e.key === "Enter") AA.open(products[frontIndex()].id);
  });
  const snap = r => Math.round(r / (Math.PI * 2 / N)) * (Math.PI * 2 / N);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(panels)[0]?.object;
  }
  let hovered = null;
  function hover(e) {
    const o = pick(e);
    canvas.style.cursor = o ? "pointer" : "grab";
    hovered = o || null;
  }
  function click(e) {
    const o = pick(e);
    if (!o) return;
    // oldingi panel bo'lmasa — avval uni oldinga buramiz
    if (o.userData.index !== frontIndex()) { target = -o.userData.index * (Math.PI * 2 / N); target += Math.round((rot - target) / (Math.PI * 2)) * Math.PI * 2; }
    else AA.open(o.userData.id);
  }

  function frontIndex() {
    const step = Math.PI * 2 / N;
    return ((Math.round(-rot / step) % N) + N) % N;
  }
  let lastFront = -1;
  function updateCaption(force) {
    const i = frontIndex();
    if (i === lastFront && !force) return;
    lastFront = i;
    const p = products[i];
    caption.textContent = `${AA.L(p.name)} — ${AA.priceOf(p)}`;
  }
  document.addEventListener("aa:lang", () => updateCaption(true));

  /* ---------- kadr sikli (ekrandan tashqarida to'xtaydi) ---------- */
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(stage);
  function loop() {
    if (!visible) return;
    if (!dragging) {
      if (target != null) {
        rot += (target - rot) * 0.09;
        if (Math.abs(target - rot) < 0.0005) { rot = target; target = null; }
        vel = 0;
      } else {
        vel += (auto - vel) * 0.03;               // inersiya → sekin avtomatik aylanish
        rot += hovered ? vel * 0.25 : vel;
      }
    }
    ring.rotation.y = rot;
    panels.forEach(m => {
      const s = m === hovered ? 1.025 : 1;
      m.scale.x += (s - m.scale.x) * 0.15; m.scale.z = m.scale.x; m.scale.y += (s - m.scale.y) * 0.15;
    });
    updateCaption();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  stage.classList.add("is-gl");
}

if (AA) start();
