const { exec } = require('child_process');

console.log('=== FIXING PORT ISSUE ===');

// 1. Kill tất cả process node
console.log('1. Killing all node processes...');
exec('taskkill /F /IM node.exe', (error, stdout, stderr) => {
  if (error) {
    console.log('No node processes to kill or error:', error.message);
  } else {
    console.log('Killed node processes');
  }
  
  // 2. Start server với port 5001
  console.log('2. Starting server on port 5001...');
  setTimeout(() => {
    exec('set PORT=5001 && node app.js', (error, stdout, stderr) => {
      if (error) {
        console.log('Error starting server:', error.message);
      } else {
        console.log('Server started:', stdout);
      }
    });
  }, 2000);
});

console.log('Script completed. Please wait for server to start...'); 