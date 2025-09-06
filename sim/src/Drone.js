import * as THREE from "three";
import { Rotor } from "./Rotor.js";

export class Drone extends THREE.Group {
  constructor() {
    super();

    // Physics state
    this.state = {
      pos: new THREE.Vector3(0, 2, 0),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Euler(0, 0, 0),
      angVel: new THREE.Vector3(0, 0, 0),
    };

    this.mass = 1;
    this.g = 9.81;

    // Create drone mesh
    this.createDroneMesh();
  }

  createDroneMesh() {
    // Central body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.3, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.add(body);

    const arm1Geometry = new THREE.BoxGeometry(0.1, 0.1, 2);
    const arm1Material = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const arm1 = new THREE.Mesh(arm1Geometry, arm1Material);
    arm1.rotation.y = Math.PI / 4;
    this.add(arm1);

    const arm2Geometry = new THREE.BoxGeometry(0.1, 0.1, 2);
    const arm2Material = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const arm2 = new THREE.Mesh(arm2Geometry, arm2Material);
    arm2.rotation.y = -Math.PI / 4;
    this.add(arm2);

    // Arms
    const armLength = 2.5;
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, armLength, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const angles = [
      Math.PI / 4,
      -Math.PI / 4,
      (-3 * Math.PI) / 4,
      (3 * Math.PI) / 4,
    ];
    angles.forEach((angle) => {
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      //arm.rotation.z = angle;
      this.add(arm);
    });

    // Rotors
    this.rotors = [];

    const offset = armLength / 2.9;
    const positions = [
      [offset, offset],
      [-offset, offset],
      [offset, -offset],
      [-offset, -offset],
    ];

    positions.forEach(([x, z], idx) => {
      const rotor = new Rotor();
      rotor.position.set(x, 0.05, z);
      this.rotors.push(rotor);
      this.add(rotor);
    });

    this.castShadow = true;
  }

  updatePhysics(throttle, roll, pitch, yaw, dt) {
    // Rotation speeds
    const rotationSpeed = 1.5;
    this.state.rot.x += -pitch * rotationSpeed * dt;
    this.state.rot.z += -roll * rotationSpeed * dt;
    this.state.rot.y += -yaw * rotationSpeed * dt;
    this.rotation.copy(this.state.rot);

    // Thrust magnitude
    const thrust = ((throttle + 1) / 2) * 15;

    // Thrust in local drone coordinates
    const localThrust = new THREE.Vector3(0, thrust, 0);
    localThrust.applyEuler(this.state.rot);

    // Gravity
    const gravity = new THREE.Vector3(0, -this.g, 0);

    // Acceleration
    const accel = new THREE.Vector3().add(localThrust).add(gravity);

    // Update velocity and position
    this.state.vel.addScaledVector(accel, dt);
    this.state.pos.addScaledVector(this.state.vel, dt);
    this.position.copy(this.state.pos);

    // Rotate rotors
    this.rotors.forEach((rotor, idx) => {
        if (idx === 0 || idx === 3) {
            rotor.spin(dt, 40, true);
        } else {
            rotor.spin(dt, 40, false);
        }
    });
  }
}
