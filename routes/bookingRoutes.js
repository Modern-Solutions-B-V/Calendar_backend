const express = require('express');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

router.get('/getBookingsByDateRange', bookingController.getBookingsByDateRange);

router.get('/getAllBookings', bookingController.getAllBookings);


module.exports = router;