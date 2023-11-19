const express = require('express');
const bookingController = require('../controllers/bookingController');
const router = express.Router();


/**
 * @swagger
 * /booking/getBookingsByDateRange:
 *   get:
 *     summary: Get bookings within a date range
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date of the range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date of the range (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successfully retrieved bookings within the specified date range
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 startdate: "2023-01-01"
 *                 enddate: "2023-01-05"
 *                 booking_elements:
 *                   - id: 101
 *                     booking_id: 1
 *                     # Other booking element properties
 *                   - id: 102
 *                     booking_id: 1
 *                     # Other booking element properties
 *               - id: 2
 *                 startdate: "2023-01-10"
 *                 enddate: "2023-01-15"
 *                 booking_elements:
 *                   - id: 201
 *                     booking_id: 2
 *                     # Other booking element properties
 *                   - id: 202
 *                     booking_id: 2
 *                     # Other booking element properties
 *       400:
 *         description: Bad request. Invalid date range format or other error.
 *         content:
 *           application/json:
 *             example:
 *               error: "Invalid date range format"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Internal server error"
 */
router.get('/getBookingsByDateRange', bookingController.getBookingsByDateRange);


router.get('/getAllBookings', bookingController.getAllBookings);


module.exports = router;