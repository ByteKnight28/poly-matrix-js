const { runWorkerTask, worker } = require('./backend/server');
(async () => {
  console.log('1. Starting worker task...');
  worker.on('error', err => console.error('WORKER ERR', err));
  worker.on('exit', code => console.log('WORKER EXIT', code));
  
  try {
     const res = await runWorkerTask({ type: 'keygen', paramSet: 'ML-KEM-512' });
     console.log('Success! ek length:', res.ek.length);
  } catch (e) {
     console.error('Task error', e);
  }
  worker.terminate();
  console.log('2. Done!');
})();
