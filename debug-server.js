const express = require('express');
const app = express();

app.use(express.json());

// Middleware để log tất cả request body
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/tours')) {
    console.log("=== REQUEST DEBUG ===");
    console.log("Method:", req.method);
    console.log("Path:", req.path);
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("=====================");
  }
  next();
});

// Simple endpoint for testing
app.post('/api/tours', (req, res) => {
  console.log("Tour create endpoint hit!");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  
  // Extract fields
  const { hotel_ids, service, category_ids, selectedCategories } = req.body;
  
  console.log("Extracted fields:");
  console.log("- hotel_ids:", hotel_ids, "Type:", typeof hotel_ids, "IsArray:", Array.isArray(hotel_ids));
  console.log("- service:", service, "Type:", typeof service, "IsArray:", Array.isArray(service));
  console.log("- category_ids:", category_ids);
  console.log("- selectedCategories:", selectedCategories);
  
  res.json({
    message: "Debug endpoint - tour creation",
    received: {
      hotel_ids,
      service,
      category_ids,
      selectedCategories
    }
  });
});

const port = 6000;
app.listen(port, () => {
  console.log(`Debug server running on port ${port}`);
});
