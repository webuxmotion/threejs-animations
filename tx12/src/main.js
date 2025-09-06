import "./style.css";

// Add canvas to the page
const canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 200;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

function drawSticks(axes) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // right stick (axes 0 and 1)
  const rx = (axes[0] || 0) * 50 + 300; // map -1..1 to pixel offset
  const ry = (axes[1] || 0) * -50 + 100;

  // left stick (axes 2 and 3)
  const lx = (axes[4] || 0) * 50 + 100;
  const ly = (axes[3] || 0) * -50 + 100;

  // Draw left stick
  ctx.beginPath();
  ctx.arc(lx, ly, 20, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.stroke();

  // Draw right stick
  ctx.beginPath();
  ctx.arc(rx, ry, 20, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.stroke();
}

// In your gamepad loop
function updateGamepads(setItems) {
  function loop() {
    const gamepads = navigator.getGamepads();
    if (gamepads[0]) {
      const gp = gamepads[0];
      setItems(gp.axes);

      drawSticks(gp.axes);
    }
    requestAnimationFrame(loop);
  }
  loop();
}

let items = [];
const setItems = (value) => {
  items = value;
};

updateGamepads(setItems);