import './style.css'
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// 1. Scene
const scene = new THREE.Scene();

// Raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let hovered = false;

// Listen for mouse movement
window.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// 2. Camera
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(3, 2, 5); // Move camera back and up
camera.lookAt(0, 0, 0);


// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
document.body.appendChild(renderer.domElement);



// 4. Plane (the ground)
const planeGeometry = new THREE.PlaneGeometry(10, 10);

const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  metalness: 0.6,  // 0 = matte, 1 = fully metallic
  roughness: 0.7   // 0 = shiny mirror, 1 = very rough
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate to lie flat
plane.receiveShadow = true;
scene.add(plane);

// 5. Cube
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 1; // Lift above ground
cube.castShadow = true;
scene.add(cube);

// 6. Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5); // Position the light
light.castShadow = true;
scene.add(light);

// Optional: light helper (to see light direction)
const helper = new THREE.DirectionalLightHelper(light, 1);
scene.add(helper);


// Create a square shape
const shape = new THREE.Shape();
shape.moveTo(-0.5, -0.5);
shape.lineTo(0.5, -0.5);
shape.lineTo(0.5, 0.5);
shape.lineTo(-0.5, 0.5);
shape.lineTo(-0.5, -0.5);

// Extrude with bevel
const extrudeSettings = {
  steps: 1,
  depth: 1,          // thickness (z-axis)
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.1,
  bevelSegments: 5
};

const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const beveledCube = new THREE.Mesh(geometry, material);
beveledCube.castShadow = true;
beveledCube.position.x = 2;
scene.add(beveledCube);


// Controls
const controls = new PointerLockControls(camera, document.body);

// Click to lock mouse
document.body.addEventListener('click', () => {
  controls.lock();
});

// Movement flags
const move = { forward: false, back: false, left: false, right: false };
const speed = 0.1;

// Keyboard events
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') move.forward = true;
  if (e.code === 'KeyS') move.back = true;
  if (e.code === 'KeyA') move.left = true;
  if (e.code === 'KeyD') move.right = true;
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') move.forward = false;
  if (e.code === 'KeyS') move.back = false;
  if (e.code === 'KeyA') move.left = false;
  if (e.code === 'KeyD') move.right = false;
});


let rotationSpeed = 0.01;
let angle = 0;
let originCubePositionY = cube.position.y;

// 7. Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (move.forward) controls.moveForward(speed);
  if (move.back) controls.moveForward(-speed);
  if (move.left) controls.moveRight(-speed);
  if (move.right) controls.moveRight(speed);

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(cube);

  if (intersects.length > 0) {
    if (!hovered) {
      cube.material.color.set(0xff0000); // change to red on hover
      hovered = true;
    }
  } else {
    if (hovered) {
      cube.material.color.set(0x00ff00); // back to green
      hovered = false;
    }
  }


  //cube.rotation.x += 0.01; // Rotate cube
  cube.rotation.y += 0.01;

  cube.position.y = originCubePositionY + Math.sin(angle) * 1;
  angle += rotationSpeed;

  renderer.render(scene, camera);
}
animate();