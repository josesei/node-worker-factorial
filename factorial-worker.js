const {Worker, parentPort, workerData} = require('worker_threads');

// get the array numbers
const [start, end] = workerData;

let  numbers = [];

for (let i = start+1n; i <= end; i++) {
    numbers.push(i);

  }

const calculateFactorial = numArray => numArray.reduce((acc, val) => acc * val, 1n);

const result = calculateFactorial(numbers);

// return result
parentPort.postMessage(result);
