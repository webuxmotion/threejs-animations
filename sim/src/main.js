import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Drone } from './Drone.js';
import Stats from 'stats.js';

// --- Three.js setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;          // <-- enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // optional: softer shadows
document.body.appendChild(renderer.domElement);

const stats = new Stats();
stats.showPanel(0); // 0 = FPS
document.body.appendChild(stats.dom);

const planeSize = 100;

// Plane
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(planeSize,planeSize),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
plane.rotation.x = -Math.PI/2;
plane.receiveShadow = true;
scene.add(plane);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
hemi.position.set(0,50,0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(10,20,10);
dir.castShadow = true;

// Optional: increase shadow resolution for clarity
dir.shadow.mapSize.width = 2048;
dir.shadow.mapSize.height = 2048;
dir.shadow.camera.near = 1;
dir.shadow.camera.far = 200;
dir.shadow.camera.left = -50;
dir.shadow.camera.right = 50;
dir.shadow.camera.top = 50;
dir.shadow.camera.bottom = -50;

scene.add(dir);

// Drone (cube)
const drone = new Drone();
scene.add(drone);

// Physics state
const droneState = {
  pos: new THREE.Vector3(0,2,0),
  vel: new THREE.Vector3(0,0,0),
  rot: new THREE.Euler(0,0,0),
  angVel: new THREE.Vector3(0,0,0)
};

// Basic constants
const mass = 1; 
const g = 9.81; 
const dt = 0.016;

// --- Orbit controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(drone.position);
controls.update();

// Offset behind the drone (relative to drone's orientation)
const cameraOffset = new THREE.Vector3(0, 2, 6); // 2 units up, 6 units behind

function updateCamera() {
  // Apply drone rotation to get "behind" direction
  const offsetWorld = cameraOffset.clone().applyEuler(drone.rotation);
  
  camera.position.copy(drone.position).add(offsetWorld);
  camera.lookAt(drone.position); // always look at drone
}

// --- Joystick visualization ---
const canvas = document.getElementById('joystick');
const ctx = canvas.getContext('2d');

function resizeJoystickCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeJoystickCanvas);
resizeJoystickCanvas();

function drawSticks(axes){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const centerX = canvas.width / 2;
  const bottomY = canvas.height - 80; // 50 px from bottom
  const lineWidth = 60;

  // --- Right stick (blue) ---
  const rightCenterX = centerX + 80;
  const rightCenterY = bottomY;
  const rx = rightCenterX + (axes[0]||0) * 50;
  const ry = rightCenterY + (axes[1]||0) * -50;

  // Draw cross lines for right stick
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightCenterX - lineWidth, rightCenterY); // horizontal line
  ctx.lineTo(rightCenterX + lineWidth, rightCenterY);
  ctx.moveTo(rightCenterX, rightCenterY - lineWidth); // vertical line
  ctx.lineTo(rightCenterX, rightCenterY + lineWidth);
  ctx.stroke();

  // Draw stick circle
  ctx.beginPath();
  ctx.arc(rx, ry, 10, 0, Math.PI*2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.stroke();

  // --- Left stick (red) ---
  const leftCenterX = centerX - 80;
  const leftCenterY = bottomY;
  const lx = leftCenterX + (axes[4]||0) * 50;
  const ly = leftCenterY + (axes[3]||0) * -50;

  // Draw cross lines for left stick
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftCenterX - lineWidth, leftCenterY); // horizontal
  ctx.lineTo(leftCenterX + lineWidth, leftCenterY);
  ctx.moveTo(leftCenterX, leftCenterY - lineWidth); // vertical
  ctx.lineTo(leftCenterX, leftCenterY + lineWidth);
  ctx.stroke();

  // Draw stick circle
  ctx.beginPath();
  ctx.arc(lx, ly, 10, 0, Math.PI*2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.stroke();
}

// --- Gamepad ---
let axes = [0,0,0,0,0,0];

window.addEventListener("gamepadconnected",(e)=>{
  console.log("Gamepad connected:",e.gamepad);
});

// --- Add 100 random boxes on plane ---
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });

for (let i = 0; i < 1000; i++) {
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  
  // Random position within plane bounds (-25 to +25 for 50x50 plane)
  box.position.x = Math.random() * planeSize - planeSize / 2;
  box.position.y = Math.random() * planeSize; // half-height to sit on plane
  box.position.z = Math.random() * planeSize - planeSize / 2;
  
  box.castShadow = true;
  box.receiveShadow = true;
  
  scene.add(box);
}

drone.traverse(obj => {
  if (obj.isMesh) {
    obj.castShadow = true;
    obj.receiveShadow = true;
  }
});




// Add grid helper on the plane
const grid = new THREE.GridHelper(planeSize, planeSize, 0x000000, 0x888888); // size 50, divisions 50
grid.position.y = 0.01;
scene.add(grid);

function animate(){
  stats.begin();

  // --- Read gamepad axes ---


  // --- Update drone physics using Drone's method ---
  const rollInput = axes[0] || 0;    // right stick X
  const pitchInput = axes[1] || 0;   // right stick Y
  const throttleInput = axes[3] || 0; // left stick Y
  const yawInput = axes[4] || 0;     // left stick X

  drone.updatePhysics(throttleInput, rollInput, pitchInput, yawInput, dt);
  

  // --- Update physics ---

  // --- Update camera ---
  updateCamera();

  const gps = navigator.getGamepads();
  if(gps[0]){
    axes = gps[0].axes;
    drawSticks(axes);
  }

  // --- Render scene ---
  renderer.render(scene, camera);

  stats.end();

  requestAnimationFrame(animate);
}
animate();

// --- Resize ---
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});