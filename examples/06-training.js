// Gradient descent on a single parameter: minimize (prediction - target)²
let weight = 0.0;       // start random
const target = 3.0;     // what we want the model to output
const learningRate = 0.1;

for (let step = 0; step < 20; step++) {
  const prediction = weight * 2;           // model: output = weight × 2
  const loss = (prediction - target) ** 2; // how wrong are we?
  const gradient = 2 * (prediction - target) * 2; // d(loss)/d(weight)

  weight -= learningRate * gradient;       // nudge weight to reduce loss

  if (step % 5 === 0) {
    console.log(`Step ${step}: weight=${weight.toFixed(3)}, loss=${loss.toFixed(3)}`);
  }
}
// weight converges to 1.5 so that 1.5 × 2 = 3.0 (the target)
