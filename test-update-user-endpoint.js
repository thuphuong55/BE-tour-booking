// Test endpoint cập nhật thông tin user
// Sử dụng sau khi đã đăng nhập và có token

const testUpdateUserInfo = {
  // Test cases cho việc cập nhật thông tin user

  // 1. Cập nhật thông tin cơ bản (không đổi mật khẩu)
  basicUpdate: {
    method: 'PUT',
    url: '/api/auth/me',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: {
      username: 'new_username',
      email: 'newemail@example.com',
      name: 'Tên Mới'
    }
  },

  // 2. Chỉ cập nhật tên hiển thị
  updateNameOnly: {
    method: 'PUT',
    url: '/api/auth/me',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: {
      name: 'Nguyễn Văn A'
    }
  },

  // 3. Đổi mật khẩu
  changePassword: {
    method: 'PUT',
    url: '/api/auth/me',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: {
      currentPassword: 'old_password_123',
      newPassword: 'new_password_456'
    }
  },

  // 4. Cập nhật toàn bộ thông tin bao gồm đổi mật khẩu
  fullUpdate: {
    method: 'PUT',
    url: '/api/auth/me',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: {
      username: 'updated_username',
      email: 'updated@example.com',
      name: 'Tên Đã Cập Nhật',
      currentPassword: 'current_password',
      newPassword: 'new_secure_password'
    }
  }
};

// Validation Rules:
const validationRules = {
  username: 'Phải unique, không trùng với user khác',
  email: 'Phải unique, format email hợp lệ, không trùng với user khác',
  name: 'Optional, có thể null',
  currentPassword: 'Bắt buộc nếu muốn đổi mật khẩu',
  newPassword: 'Tối thiểu 6 ký tự, chỉ cần nếu muốn đổi mật khẩu'
};

// Response format:
const responseFormat = {
  success: {
    status: 200,
    body: {
      message: 'Cập nhật thông tin người dùng thành công',
      user: {
        id: 'uuid',
        username: 'updated_username',
        email: 'updated@example.com',
        role: 'user',
        status: 'active',
        name: 'Tên Đã Cập Nhật',
        created_at: 'timestamp',
        updated_at: 'timestamp'
      }
    }
  },
  errors: {
    emailExists: {
      status: 400,
      message: 'Email đã được sử dụng bởi người dùng khác'
    },
    usernameExists: {
      status: 400,
      message: 'Username đã được sử dụng bởi người dùng khác'
    },
    wrongCurrentPassword: {
      status: 400,
      message: 'Mật khẩu hiện tại không đúng'
    },
    missingCurrentPassword: {
      status: 400,
      message: 'Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu mới'
    },
    userNotFound: {
      status: 404,
      message: 'Người dùng không tồn tại'
    }
  }
};

// Frontend usage example:
const frontendExample = `
// Cập nhật thông tin user từ Frontend
const updateUserInfo = async (updateData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Cập nhật thành công:', result.user);
      // Cập nhật state/context với thông tin user mới
      return result.user;
    } else {
      console.error('Lỗi cập nhật:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
    throw error;
  }
};

// Sử dụng:
// updateUserInfo({ name: 'Tên mới' });
// updateUserInfo({ email: 'email@new.com', currentPassword: 'old', newPassword: 'new' });
`;

module.exports = {
  testUpdateUserInfo,
  validationRules,
  responseFormat,
  frontendExample
};
