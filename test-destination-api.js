const axios = require('axios');

async function testDestinationDeletionAPI() {
  try {
    console.log('Testing destination deletion API...');
    
    // First, let's get an auth token (you may need to adjust this based on your auth system)
    const baseURL = 'http://localhost:5001/api';
    
    // Test the delete endpoint directly (assuming admin access)
    console.log('Attempting to delete destination: dest-dalat-center');
    
    const deleteResponse = await axios.delete(`${baseURL}/destinations/dest-dalat-center`, {
      timeout: 10000
    });
    
    console.log('Delete response status:', deleteResponse.status);
    console.log('Delete response data:', deleteResponse.data);
    
    // Verify the destination is deleted by trying to get it
    try {
      const getResponse = await axios.get(`${baseURL}/destinations/dest-dalat-center`);
      console.log('Destination still exists (unexpected)');
    } catch (getError) {
      if (getError.response && getError.response.status === 404) {
        console.log('✅ Destination successfully deleted (returns 404)');
      } else {
        console.log('Unexpected error when trying to get deleted destination:', getError.message);
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Request Error:', error.message);
    }
  } finally {
    process.exit();
  }
}

testDestinationDeletionAPI();
