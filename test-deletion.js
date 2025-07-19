const { Destination } = require('./models');

async function testDestinationDeletion() {
  try {
    console.log('Testing destination deletion...');
    
    // Try to delete the destination
    const result = await Destination.destroy({
      where: { id: 'dest-dalat-center' }
    });
    
    console.log('Deletion result:', result);
    console.log('Destination deleted successfully!');
    
  } catch (error) {
    console.error('Deletion failed:', error.message);
    console.error('Error details:', error);
  } finally {
    process.exit();
  }
}

testDestinationDeletion();
