'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Creating performance indexes...');
    
    try {
      // 🚀 OPTIMIZATION: Primary indexes for tour queries
      await queryInterface.addIndex('tour', ['status'], {
        name: 'idx_tour_status'
      });
      console.log('✅ Created idx_tour_status');
      
      await queryInterface.addIndex('tour', ['created_at'], {
        name: 'idx_tour_created_at'
      });
      console.log('✅ Created idx_tour_created_at');
      
      await queryInterface.addIndex('tour', ['agency_id'], {
        name: 'idx_tour_agency_id'
      });
      console.log('✅ Created idx_tour_agency_id');
      
      // 🚀 OPTIMIZATION: Composite indexes for common queries
      await queryInterface.addIndex('tour', ['status', 'created_at'], {
        name: 'idx_tour_status_created'
      });
      console.log('✅ Created idx_tour_status_created');
      
      await queryInterface.addIndex('tour', ['agency_id', 'status'], {
        name: 'idx_tour_agency_status'
      });
      console.log('✅ Created idx_tour_agency_status');
      
      // 🚀 OPTIMIZATION: Search optimization indexes
      await queryInterface.addIndex('tour', ['name'], {
        name: 'idx_tour_name'
      });
      console.log('✅ Created idx_tour_name');
      
      await queryInterface.addIndex('tour', ['destination'], {
        name: 'idx_tour_destination'
      });
      console.log('✅ Created idx_tour_destination');
      
      await queryInterface.addIndex('tour', ['location'], {
        name: 'idx_tour_location'
      });
      console.log('✅ Created idx_tour_location');
      
      // 🚀 OPTIMIZATION: Booking related indexes
      await queryInterface.addIndex('booking', ['status'], {
        name: 'idx_booking_status'
      });
      console.log('✅ Created idx_booking_status');
      
      await queryInterface.addIndex('booking', ['user_id'], {
        name: 'idx_booking_user'
      });
      console.log('✅ Created idx_booking_user');
      
      await queryInterface.addIndex('booking', ['tour_id'], {
        name: 'idx_booking_tour'
      });
      console.log('✅ Created idx_booking_tour');
      
      await queryInterface.addIndex('booking', ['created_at'], {
        name: 'idx_booking_created'
      });
      console.log('✅ Created idx_booking_created');
      
      // 🚀 OPTIMIZATION: Image indexes
      await queryInterface.addIndex('tour_image', ['tour_id'], {
        name: 'idx_tour_image_tour'
      });
      console.log('✅ Created idx_tour_image_tour');
      
      await queryInterface.addIndex('tour_image', ['is_main'], {
        name: 'idx_tour_image_main'
      });
      console.log('✅ Created idx_tour_image_main');
      
      // 🚀 OPTIMIZATION: Departure date indexes  
      await queryInterface.addIndex('departure_date', ['tour_id'], {
        name: 'idx_departure_date_tour'
      });
      console.log('✅ Created idx_departure_date_tour');
      
      await queryInterface.addIndex('departure_date', ['departure_date'], {
        name: 'idx_departure_date_date'
      });
      console.log('✅ Created idx_departure_date_date');
      
      // 🚀 OPTIMIZATION: Agency indexes
      await queryInterface.addIndex('agency', ['status'], {
        name: 'idx_agency_status'
      });
      console.log('✅ Created idx_agency_status');
      
      await queryInterface.addIndex('agency', ['user_id'], {
        name: 'idx_agency_user'
      });
      console.log('✅ Created idx_agency_user');
      
      console.log('🎉 All performance indexes created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🗑️ Removing performance indexes...');
    
    const indexes = [
      { table: 'tour', name: 'idx_tour_status' },
      { table: 'tour', name: 'idx_tour_created_at' },
      { table: 'tour', name: 'idx_tour_agency_id' },
      { table: 'tour', name: 'idx_tour_status_created' },
      { table: 'tour', name: 'idx_tour_agency_status' },
      { table: 'tour', name: 'idx_tour_name' },
      { table: 'tour', name: 'idx_tour_destination' },
      { table: 'tour', name: 'idx_tour_location' },
      { table: 'booking', name: 'idx_booking_status' },
      { table: 'booking', name: 'idx_booking_user' },
      { table: 'booking', name: 'idx_booking_tour' },
      { table: 'booking', name: 'idx_booking_created' },
      { table: 'tour_image', name: 'idx_tour_image_tour' },
      { table: 'tour_image', name: 'idx_tour_image_main' },
      { table: 'departure_date', name: 'idx_departure_date_tour' },
      { table: 'departure_date', name: 'idx_departure_date_date' },
      { table: 'agency', name: 'idx_agency_status' },
      { table: 'agency', name: 'idx_agency_user' }
    ];
    
    for (const { table, name } of indexes) {
      try {
        await queryInterface.removeIndex(table, name);
        console.log(`✅ Removed ${name} from ${table}`);
      } catch (error) {
        console.log(`⚠️ Index ${name} not found on ${table}, skipping...`);
      }
    }
    
    console.log('🎉 All indexes removed successfully!');
  }
};
