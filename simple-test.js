const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/agency/bookings',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZjMjZkMmVkLWJjMWYtNDNkZi05MTRiLTE2Y2Y4NWVhNzJhZSIsImVtYWlsIjoiYWdlbmN5MTJAZ21haWwuY29tIiwicm9sZSI6ImFnZW5jeSIsImlhdCI6MTc1Mjg5MzczNCwiZXhwIjoxNzUyOTgwMTM0fQ.P3Qa4PzFi9Z1F9ye1n87pJPEDSPyNIKrgP5FvxDEGio',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end(); 