import * as THREE from "three";
import { Rotor } from "./Rotor.js";

export class Drone extends THREE.Group {
  constructor() {
    super();

    // Physics state
    this.state = {
      pos: new THREE.Vector3(0, 2, 0),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Euler(0, 0, 0, "YXZ"),
      angVel: new THREE.Vector3(0, 0, 0),
    };

    // Constants
    this.mass = 1;
    this.g = 9.81;
    this.angularDamping = 0.9;   // rotation drag
    this.linearDamping = 0.995;  // air drag

    this.createDroneMesh();
  }

  createDroneMesh() {
    // Central body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.3, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.add(body);

    // Cross arms
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
    // --- Angular motion ---
    const rotationSpeed = 3; // torque strength
    const angAccel = new THREE.Vector3(
      -pitch * rotationSpeed,
      -yaw * rotationSpeed,
      -roll * rotationSpeed
    );

    this.state.angVel.addScaledVector(angAccel, dt);
    this.state.angVel.multiplyScalar(this.angularDamping);

    this.state.rot.x += this.state.angVel.x * dt;
    this.state.rot.y += this.state.angVel.y * dt;
    this.state.rot.z += this.state.angVel.z * dt;
    this.rotation.copy(this.state.rot);

    // --- Linear motion ---
    const thrust = ((throttle + 1) / 2) * 20; // 0..20 N
    const localThrust = new THREE.Vector3(0, thrust, 0);
    localThrust.applyEuler(this.state.rot); // rotate to world space

    const gravity = new THREE.Vector3(0, -this.g, 0);
    const accel = new THREE.Vector3().add(localThrust).add(gravity);

    this.state.vel.addScaledVector(accel, dt);
    this.state.vel.multiplyScalar(this.linearDamping);

    this.state.pos.addScaledVector(this.state.vel, dt);
    this.position.copy(this.state.pos);

    // --- Rotor animation ---
    const baseSpeed = 10;
    const maxExtraSpeed = 40;
    const rotorSpeed = baseSpeed + maxExtraSpeed * ((throttle + 1) / 2);

    this.rotors.forEach((rotor, idx) => {
      if (idx === 0 || idx === 3) {
        rotor.spin(dt, rotorSpeed, true);
      } else {
        rotor.spin(dt, rotorSpeed, false);
      }
    });
  }
}