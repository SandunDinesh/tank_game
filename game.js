import * as THREE from "three";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// Player tank - Adjusted for rear-facing barrel
const tank = new THREE.Group();
scene.add(tank);

// Body
const bodyGeometry = new THREE.BoxGeometry(3, 0.8, 4);
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2e4d2e });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.set(0, 0.4, 0);
tank.add(body);

// Tracks
const trackGeometry = new THREE.BoxGeometry(0.5, 0.5, 4.2);
const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x1a2b1a });
const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
leftTrack.position.set(1.75, 0.25, 0);
tank.add(leftTrack);
const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
rightTrack.position.set(-1.75, 0.25, 0);
tank.add(rightTrack);

// Turret (rear-facing)
const turretBaseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
const turretBaseMaterial = new THREE.MeshPhongMaterial({
  color: 0x2e4d2e,
});
const turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
turretBase.position.set(0, 0.85, 0);
turretBase.rotation.x = Math.PI / 2;
tank.add(turretBase);

const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 16);
const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x1a2b1a });
const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
barrel.position.set(0, 0.85, 1.75); // Moved to rear (positive z)
barrel.rotation.x = Math.PI / 2;
tank.add(barrel);

// Sloped front (now rear)
const frontGeometry = new THREE.BoxGeometry(3, 0.5, 1);
const frontMaterial = new THREE.MeshPhongMaterial({ color: 0x2e4d2e });
const front = new THREE.Mesh(frontGeometry, frontMaterial);
front.position.set(0, 0.55, -2); // Moved to front (negative z)
front.rotation.x = Math.PI / 6; // Reversed slope
tank.add(front);

tank.position.set(0, 0, 0);

// Sound initialization
const engineSound = document.getElementById("engineSound");
const fireSound = document.getElementById("fireSound");
engineSound.isPlaying = false;

// Camera setup
camera.position.set(0, 5, -10);
camera.lookAt(tank.position);
function updateCamera() {
  const offset = new THREE.Vector3(0, 5, -10);
  const tankMatrix = new THREE.Matrix4().extractRotation(tank.matrixWorld);
  const cameraPos = offset.applyMatrix4(tankMatrix).add(tank.position);
  camera.position.copy(cameraPos);
  camera.lookAt(tank.position);
}

// Tank movement (S to rear, W to front)
const keys = {};
window.addEventListener("keydown", (e) => {
  e.preventDefault();
  keys[e.key] = true;
  if (e.key === " ") shoot();
});
window.addEventListener("keyup", (e) => {
  e.preventDefault();
  keys[e.key] = false;
});
const speed = 0.1;
const rotationSpeed = 0.03;
function updateTank() {
  if (keys["w"] || keys["s"] || keys["a"] || keys["d"]) {
    if (!engineSound.isPlaying) {
      engineSound.play();
      engineSound.isPlaying = true;
    }
  } else {
    if (engineSound.isPlaying) {
      engineSound.pause();
      engineSound.currentTime = 0;
      engineSound.isPlaying = false;
    }
  }
  const direction = new THREE.Vector3();
  tank.getWorldDirection(direction);
  if (keys["s"]) tank.position.add(direction.multiplyScalar(speed)); // S = Rear (positive z)
  if (keys["w"]) tank.position.add(direction.multiplyScalar(-speed)); // W = Front (negative z)
  if (keys["a"]) tank.rotation.y += rotationSpeed;
  if (keys["d"]) tank.rotation.y -= rotationSpeed;
  updateCamera();
}

// Shooting with sound (blue projectiles from barrel tip)
const projectiles = [];
function shoot() {
  console.log("Shooting!");
  const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const projectileMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
  }); // Blue
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
  // Start at barrel tip (rear)
  projectile.position.set(
    tank.position.x,
    tank.position.y + 0.85,
    tank.position.z
  );
  const direction = new THREE.Vector3();
  tank.getWorldDirection(direction);
  projectile.position.add(direction.multiplyScalar(2.5)); // Offset to barrel tip
  projectile.userData = {
    velocity: direction.clone().multiplyScalar(0.5),
    fromEnemy: false,
  };
  scene.add(projectile);
  projectiles.push(projectile);
  fireSound.play();
}
function updateProjectiles() {
  projectiles.forEach((p, i) => {
    p.position.add(p.userData.velocity);
    if (p.position.distanceTo(tank.position) > 50) {
      scene.remove(p);
      projectiles.splice(i, 1);
    }
  });
}

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const sandTexture = new THREE.TextureLoader().load(
  "https://threejs.org/examples/textures/terrain/sand.jpg"
);
sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(10, 10);
const groundMaterial = new THREE.MeshPhongMaterial({ map: sandTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Cover objects
function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 2),
    new THREE.MeshPhongMaterial({ color: 0x8b4513 })
  );
  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshPhongMaterial({ color: 0x00ff00 })
  );
  foliage.position.y = 2;
  const tree = new THREE.Group();
  tree.add(trunk, foliage);
  tree.position.set(x, 1, z);
  scene.add(tree);
}
function createBuilding(x, z) {
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshPhongMaterial({ color: 0x808080 })
  );
  building.position.set(x, 1.5, z);
  scene.add(building);
}
createTree(5, 5);
createBuilding(-5, -5);

// Enemy tanks (moving, red projectiles)
const enemies = [];
function createEnemyTank(x, z) {
  const enemy = tank.clone();
  enemy.traverse((child) => {
    if (child.isMesh)
      child.material = new THREE.MeshPhongMaterial({ color: 0x8b0000 });
  });
  enemy.position.set(x, 0, z);
  enemy.userData = { velocity: new THREE.Vector3(0, 0, 0) }; // For movement
  scene.add(enemy);
  enemies.push(enemy);
}
createEnemyTank(10, 10);

// Enemy shooting
setInterval(() => {
  enemies.forEach((e) => {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 }) // Red
    );
    p.position.set(e.position.x, e.position.y + 0.85, e.position.z);
    const direction = new THREE.Vector3();
    e.getWorldDirection(direction);
    p.position.add(direction.multiplyScalar(2.5)); // From barrel tip
    const targetDirection = tank.position.clone().sub(e.position).normalize();
    p.userData = {
      velocity: targetDirection.multiplyScalar(0.3),
      fromEnemy: true,
    };
    scene.add(p);
    projectiles.push(p);
  });
}, 2000);

// Enemy movement
function updateEnemies() {
  enemies.forEach((e) => {
    // Simple AI: Move toward player with some randomness
    const directionToPlayer = tank.position.clone().sub(e.position).normalize();
    const randomFactor = (Math.random() - 0.5) * 0.02; // Slight randomness
    e.userData.velocity
      .copy(directionToPlayer)
      .multiplyScalar(0.05)
      .addScaledVector(new THREE.Vector3(1, 0, 1), randomFactor);
    e.position.add(e.userData.velocity);
    // Keep on ground
    e.position.y = 0;
  });
}

// Health system
let playerHealth = 5;
function checkCollisions() {
  projectiles.forEach((p, i) => {
    if (p.userData.fromEnemy && p.position.distanceTo(tank.position) < 1) {
      playerHealth--;
      console.log(`Health: ${playerHealth}`);
      if (playerHealth <= 0) alert("Game Over!");
      scene.remove(p);
      projectiles.splice(i, 1);
    }
    if (!p.userData.fromEnemy) {
      enemies.forEach((e) => {
        if (p.position.distanceTo(e.position) < 1) {
          scene.remove(e);
          enemies.splice(enemies.indexOf(e), 1);
          scene.remove(p);
          projectiles.splice(i, 1);
        }
      });
    }
  });
}

// Health collectibles
const healthPacks = [];
function spawnHealthPack() {
  const healthPack = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshPhongMaterial({ color: 0x00ffff })
  );
  healthPack.position.set(
    Math.random() * 50 - 25,
    0.25,
    Math.random() * 50 - 25
  );
  scene.add(healthPack);
  healthPacks.push(healthPack);
}
setInterval(spawnHealthPack, 5000);
function checkHealthPickup() {
  healthPacks.forEach((hp, i) => {
    if (tank.position.distanceTo(hp.position) < 1) {
      playerHealth = Math.min(playerHealth + 1, 5);
      console.log(`Health: ${playerHealth}`);
      scene.remove(hp);
      healthPacks.splice(i, 1);
    }
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  updateTank();
  updateProjectiles();
  updateEnemies();
  checkCollisions();
  checkHealthPickup();
  renderer.render(scene, camera);
}
animate();
