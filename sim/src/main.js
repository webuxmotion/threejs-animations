import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Drone } from './Drone.js';

// --- Three.js setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Plane
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(50,50),
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


// --- Simulation ---
function physics(){
  // Joystick mapping
  const rollInput = axes[0] || 0;    // right stick X
  const pitchInput = axes[1] || 0;   // right stick Y
  const throttleInput = axes[3] || 0; // left stick Y
  const yawInput = axes[4] || 0;     // left stick X

  // Rotation speeds
  const rotationSpeed = 1.5; // radians/sec
  droneState.rot.x += -pitchInput * rotationSpeed * dt;  // pitch
  droneState.rot.z += -rollInput * rotationSpeed * dt;   // roll
  droneState.rot.y += -yawInput * rotationSpeed * dt;    // yaw
  drone.rotation.copy(droneState.rot);

  // Thrust magnitude
  const thrust = (throttleInput + 1)/2 * 15; // 0..15 N

  // Thrust direction in local drone coordinates
  const localThrust = new THREE.Vector3(0, thrust, 0);

  // Rotate thrust to world coordinates according to drone rotation
  localThrust.applyEuler(droneState.rot);

  // Gravity
  const gravity = new THREE.Vector3(0, -g, 0);

  // Acceleration = thrust + gravity
  const accel = new THREE.Vector3().add(localThrust).add(gravity);

  // Update velocity and position
  droneState.vel.addScaledVector(accel, dt);
  droneState.pos.addScaledVector(droneState.vel, dt);
  drone.position.copy(droneState.pos);
}

// Add grid helper on the plane
const grid = new THREE.GridHelper(50, 50, 0x000000, 0x888888); // size 50, divisions 50
grid.position.y = 0.01;
scene.add(grid);

function animate(){
  // --- Read gamepad axes ---
  

  // --- Update physics ---
  physics();

  // --- Update camera ---
  updateCamera();

  const gps = navigator.getGamepads();
  if(gps[0]){
    axes = gps[0].axes;
    drawSticks(axes);
  }

  // --- Render scene ---
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}
animate();

// --- Resize ---
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});