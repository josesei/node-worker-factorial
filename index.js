const os = require('os');
const path = require('path');
const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');
const inquirer = require('inquirer');
const ora = require('ora');

const userCPUCount = os.cpus().length;
const NS_PER_SEC = 1e9;
const workerPath = path.resolve('factorial-worker.js');

const calculateFactorialWithWorker = number => {
  // Insert the array preparation code.
  let threadCount = 1;
  if(number < 0n){
    return null;
  }
  else if (number === 0n) {
    return 1;
  }
  else if (number < userCPUCount){
    threadCount = number;
  }
  else{
    threadCount = userCPUCount;
  }

  segments = [];

  const segmentSize = BigInt(Math.floor(Number(number) / userCPUCount));


  console.log(number, threadCount, segmentSize);

  for (let segmentIndex = 0n; segmentIndex < BigInt(userCPUCount); segmentIndex++) {
    const start = segmentIndex * segmentSize;
    const end = start + segmentSize;
    segments.push([BigInt(start), BigInt(end)]);

    if(segmentIndex+1n==BigInt(userCPUCount-1)){
      segments.push([BigInt(end+1n), BigInt(number)]);
    }
  }
  

  var promises = segments.map(
    segment =>
      new Promise((resolve, reject) => {
        const worker = new Worker(workerPath, {
          workerData: segment,
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
      })
  )

  return Promise.all(promises).then(results => {
    return results.reduce((acc, val) => acc * val, 1n);
  });
};

const calculatFactorial = (number) => {
  const numbers = []; 

  for (let i = 1n; i <= number; i++) {
    numbers.push(i);
  }

  return numbers.reduce((acc, val) => acc * val, 1n);
}

const benchmarkFactorial = async (inputNumber, factFun, label) => {
  const spinner = ora(`Calculating with ${label}..`).start();
  const startTime = process.hrtime();
  const result = await factFun(BigInt(inputNumber));

  
  const diffTime = process.hrtime(startTime);
  const time = diffTime[0] * NS_PER_SEC + diffTime[1];
  spinner.succeed(`${label} result done in: ${time}`);
  return time;
}

const run = async () => {
  const {inputNumber} = await inquirer.prompt([
    {
      type: 'input',
      name: 'inputNumber',
      message: 'Calculate factorial for:',
      default: 10,
    },
  ]);

  const timeWorker = await benchmarkFactorial(inputNumber, calculateFactorialWithWorker, 'Worker');
  const timeLocal = await benchmarkFactorial(inputNumber, calculatFactorial, 'Local');
  const diff = timeLocal - timeWorker;
  console.log(`Difference between local and worker: ${Math.floor(diff / 1000000)}ms`);
};

run();
