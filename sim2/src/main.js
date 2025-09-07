import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);



// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 500
);
camera.position.set(5, 3, 8);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;               
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);



// --- Lights ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 10, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -25;
dirLight.shadow.camera.right = 25;
dirLight.shadow.camera.top = 25;
dirLight.shadow.camera.bottom = -25;
scene.add(dirLight);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let hangarPartGlobal;

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  '/textures/concrete.png',
  (concreteTexture) => {
    // setup texture
    concreteTexture.wrapS = THREE.RepeatWrapping;
    concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(25, 25);

    // Ground material
    const groundMaterial = new THREE.MeshPhysicalMaterial({
      map: concreteTexture,
      bumpMap: concreteTexture,
      bumpScale: 0.05,
      metalness: 0,
      roughness: 0.9,
      clearcoat: 0
    });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Hangar part will also use the same concrete texture
    const loader = new GLTFLoader();
    loader.load(
      '/hangar-part.gltf',
      (gltf) => {
        const hangarPart = gltf.scene;
        hangarPart.position.set(0, 0, 0);
        hangarPart.rotation.x = -Math.PI / 2;

        hangarPart.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            child.material = new THREE.MeshPhysicalMaterial({
              color: 0x888888,
              metalness: 0,
              roughness: 0.9,
              map: concreteTexture,
              bumpMap: concreteTexture,
              bumpScale: 0.05,
              clearcoat: 0,
            });
          }
        });

        hangarPartGlobal = hangarPart;

        scene.add(hangarPart);
      },
      undefined,
      (err) => console.error('Error loading hangar part:', err)
    );
  },
  undefined,
  (err) => console.error('Error loading concrete texture:', err)
);



// --- Animate ---
function animate() {
  requestAnimationFrame(animate);

  if (hangarPartGlobal) {
    //hangarPartGlobal.rotation.z += 0.01; // optional rotation
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});