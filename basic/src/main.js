import * as THREE from 'three';

// Scene and Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(-30, 40, 30);
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Cube
const cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(5, 5, 0);
cube.castShadow = true;
scene.add(cube);

// Sphere
const sphereGeometry = new THREE.SphereGeometry(4, 32, 32);
const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x7777ff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0, 5, 0);
sphere.castShadow = true;
scene.add(sphere);

// Plane (ground)
const planeGeometry = new THREE.PlaneGeometry(60, 60);
const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.set(0, 0, 0);
plane.receiveShadow = true;
scene.add(plane);




const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(10, 10, 10);
dirLight.castShadow = true;
scene.add(dirLight);



// Animation loop
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  dirLight.position.x += 0.01;
  dirLight.position.z += 0.01;

  sphere.rotation.y += 0.005;

  renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});