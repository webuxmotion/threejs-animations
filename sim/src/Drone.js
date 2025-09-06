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

    // In Drone constructor
    this.state.angVel = new THREE.Vector3(0, 0, 0);
    this.angularDamping = 0.9; // 0 = no damping, 1 = stops instantly
    this.linearDamping = 0.995;
  }

  createDroneMesh() {
    // Central body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.3, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
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
    const rotationSpeed = 2; // torque strength

    // Convert inputs into angular acceleration (torque)
    const angAccel = new THREE.Vector3(
      -pitch * rotationSpeed,
      -yaw * rotationSpeed,
      -roll * rotationSpeed
    );

    // Update angular velocity
    this.state.angVel.addScaledVector(angAccel, dt);

    // Apply damping
    this.state.angVel.multiplyScalar(this.angularDamping);

    // Update rotation based on angular velocity
    this.state.rot.x += this.state.angVel.x * dt;
    this.state.rot.y += this.state.angVel.y * dt;
    this.state.rot.z += this.state.angVel.z * dt;
    this.rotation.copy(this.state.rot);

    // Thrust
    const thrust = ((throttle + 1) / 2) * 15; // double thrust

    const localThrust = new THREE.Vector3(0, thrust, 0);
    localThrust.applyEuler(this.state.rot);

    // Gravity
    const gravity = new THREE.Vector3(0, -this.g, 0);

    // Linear acceleration
    const accel = new THREE.Vector3().add(localThrust).add(gravity);

    // Update velocity with damping
    this.state.vel.addScaledVector(accel, dt);
    this.state.vel.multiplyScalar(this.linearDamping);

    // Update position
    this.state.pos.addScaledVector(this.state.vel, dt);
    this.position.copy(this.state.pos);

    const baseSpeed = 10; // minimal spinning at 0 throttle
    const maxExtraSpeed = 40; // extra spin added at full throttle
    const rotorSpeed = baseSpeed + maxExtraSpeed * ((throttle + 1) / 2); // map throttle -1..1 to 0..1

    // Rotate rotors
    this.rotors.forEach((rotor, idx) => {
      if (idx === 0 || idx === 3) {
        rotor.spin(dt, rotorSpeed, true);
      } else {
        rotor.spin(dt, rotorSpeed, false);
      }
    });
  }
}
