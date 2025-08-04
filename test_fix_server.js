// Test endpoint để fix agency orphan
const express = require('express');
const { Agency, User } = require('./models');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

app.post('/test-fix-orphan-agency/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔧 Fixing orphan agency: ${id}`);
    
    const agency = await Agency.findByPk(id, { include: 'user' });
    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }
    
    if (agency.user) {
      return res.json({ message: 'Agency already has user', user: agency.user.id });
    }
    
    // Tạo user mới
    let baseUsername = agency.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
      
    let username = baseUsername;
    let counter = 1;
    
    while (await User.findOne({ where: { username } })) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }
    
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    
    const newUser = await User.create({
      id: agency.user_id, // Use existing ID
      name: agency.name,
      username,
      email: agency.email,
      password_hash: hashedPassword,
      role: "agency",
      status: "active",
      isVerified: true
    });
    
    res.json({
      message: 'Fixed orphan agency',
      agency: { id: agency.id, name: agency.name },
      user: { id: newUser.id, username, email: newUser.email },
      tempPassword
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: POST http://localhost:${PORT}/test-fix-orphan-agency/487ef622-57b5-43a1-8d40-e02792bcc1d4`);
});
