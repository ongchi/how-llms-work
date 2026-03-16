// 3×3 edge-detection kernel applied to a 5×5 pixel grid
const kernel = [
  [-1, -1, -1],
  [-1,  8, -1],
  [-1, -1, -1],
];

const image = [
  [0, 0, 0,   0, 0],
  [0, 0, 0,   0, 0],
  [0, 0, 255, 0, 0], // bright pixel in center
  [0, 0, 0,   0, 0],
  [0, 0, 0,   0, 0],
];

function convolve(image, kernel) {
  const result = [];
  for (let y = 1; y < image.length - 1; y++) {
    result[y] = [];
    for (let x = 1; x < image[0].length - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += image[y + ky][x + kx] * kernel[ky + 1][kx + 1];
        }
      }
      result[y][x] = Math.max(0, sum); // ReLU: clamp negatives to 0
    }
  }
  return result;
}

const output = convolve(image, kernel);
console.log(output[2][2]); // 2040 — the bright center pixel stands out strongly
console.log(output[1][1]); // 0    — uniform dark region: no edge detected
