const express = require('express');
const router = express.Router();
const { 
    searchRooms, 
    viewAllRooms, 
    sendMessage, 
    searchRoomsCombined, 
    createBooking, 
    getCombinationDetails, 
    getAllCombinations, 
    getDynamicPrice,
    adminViewAllReservations,
    adminViewAllMessages  // Add this import
} = require('../controllers/roomController');

// Search available rooms
router.get('/search', searchRooms);
// Search room combinations
router.get('/search-combinations', searchRoomsCombined);
// View all rooms
router.get('/all', viewAllRooms);
// CONTACT FORM
router.post('/contact', sendMessage);
// CREATE BOOKING
router.post('/booking', createBooking);
// GET COMBINATION DETAILS
router.get('/combination/:combinationId', getCombinationDetails);
// GET ALL COMBINATIONS (for hotel management)
router.get('/combinations', getAllCombinations);
router.get('/dynamic-price', getDynamicPrice);
// ADMIN: View all reservations
router.get('/admin/reservations', adminViewAllReservations);

// Admin route for viewing all messages
router.get('/admin/messages', adminViewAllMessages);

module.exports = router;