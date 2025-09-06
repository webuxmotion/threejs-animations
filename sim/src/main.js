import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
  new THREE.MeshStandardMaterial({ color: 0x228822 })
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
const droneGeometry = new THREE.BoxGeometry(1,0.2,1);
const droneMaterial = new THREE.MeshStandardMaterial({color:0xff0000});
const drone = new THREE.Mesh(droneGeometry, droneMaterial);
drone.castShadow = true;
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

function drawSticks(axes){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // right stick: axes 0,1
  const rx = (axes[0]||0)*50+300;
  const ry = (axes[1]||0)*-50+100;
  ctx.beginPath(); ctx.arc(rx, ry, 20,0,Math.PI*2); ctx.fillStyle='blue'; ctx.fill(); ctx.stroke();
  // left stick: axes 3,4
  const lx = (axes[4]||0)*50+100;
  const ly = (axes[3]||0)*-50+100;
  ctx.beginPath(); ctx.arc(lx, ly, 20,0,Math.PI*2); ctx.fillStyle='red'; ctx.fill(); ctx.stroke();
}

// --- Gamepad ---
let axes = [0,0,0,0,0,0];

window.addEventListener("gamepadconnected",(e)=>{
  console.log("Gamepad connected:",e.gamepad);
});

function updateGamepads(){
  const gps = navigator.getGamepads();
  if(gps[0]){
    axes = gps[0].axes;
    drawSticks(axes);
  }
  requestAnimationFrame(updateGamepads);
}
updateGamepads();

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
scene.add(grid);

// --- Animation loop ---
function animate(){
  physics();
  updateCamera();    
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();

// --- Resize ---
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});