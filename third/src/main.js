import './style.css'
import * as THREE from 'three';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  50
);
camera.position.set(5, 10, 15);
camera.lookAt(5, 0, 5); // look at center of plane

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Plane 10m x 10m
const planeSize = 10;
const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // lay flat
plane.receiveShadow = true;
scene.add(plane);


// --- Cube ---
const cubeSize = 1; // 1 meter cube
const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

// Position cube above the plane
cube.position.set(0, cubeSize / 2, 0); // center of plane
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);


// Grid helper (1m grid)
const grid = new THREE.GridHelper(planeSize, planeSize); // size, divisions
grid.position.y = 0.01;
scene.add(grid);




// Enable shadows in renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;




// Camera orbit controls (optional)
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls(camera, renderer.domElement);

// Keep your sun (DirectionalLight)
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 15, 5);
sunLight.castShadow = true;
scene.add(sunLight);

// Add ambient light for soft shadows
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // color, intensity
scene.add(ambientLight);

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
