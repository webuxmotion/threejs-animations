import * as THREE from 'three';

export class Rotor extends THREE.Group {
  constructor() {
    super();

    // --- Hub ---
    const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    this.add(hub);

    // --- Blades ---
    const bladeGeometry = new THREE.BoxGeometry(0.5, 0.02, 0.04); // width=1 along x, thin along y, depth z
    const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    this.blades = [];

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);

      // Move blade so that its pivot is at one end (root)
      blade.geometry.translate(0.1, 0, 0); // shift geometry by half its length along X

      // Create pivot Object3D for rotation around root
      const pivot = new THREE.Object3D();
      pivot.rotation.y = (i * 2 * Math.PI) / 3; // spread blades evenly
      pivot.add(blade);

      this.blades.push(pivot);
      this.add(pivot);
    }

    this.castShadow = true;
  }

  spin(dt, speed = 20, clockwise = true) {
    this.rotation.y += (clockwise ? 1 : -1) * speed * dt;
  }
}