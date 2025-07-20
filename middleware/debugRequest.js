// Debug middleware để log raw request body
const debugRequestBody = (req, res, next) => {
  console.log('\n🔍 DEBUG REQUEST:');
  console.log('URL:', req.method, req.url);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  
  // Log raw body nếu có
  if (req.body) {
    console.log('Parsed Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture raw body
  let rawBody = '';
  req.on('data', chunk => {
    rawBody += chunk;
  });
  
  req.on('end', () => {
    if (rawBody) {
      console.log('Raw Body:', rawBody);
      console.log('Raw Body Length:', rawBody.length);
      console.log('First 100 chars:', rawBody.substring(0, 100));
    }
  });
  
  next();
};

module.exports = debugRequestBody;
