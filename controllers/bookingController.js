const mysql = require('mysql');
const db = require('../config/database');
const cron = require('cron');
const { getBookingChange, getBookingById } = require('./relation');
const { insertBookingInfo, insertBookingElement } = require('../config/bookingUtils')
const fs = require('fs');
const jsonData = JSON.parse(fs.readFileSync('./response.json'));

const numbers = (jsonData.response.changes)

const getBookingsByDateRange = (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(req.query);

    const sql = `
        SELECT bh.*, be.*
        FROM bookingheader bh
        LEFT JOIN bookingelement be ON bh.id = be.booking_id
        WHERE bh.startdate >= ? AND bh.enddate <= ?
    `;

    db.query(sql, [startDate, endDate], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const bookings = results.reduce((acc, current) => {
            const bookingId = current.booking_id;
            const booking = acc[bookingId] || {
                ...current,
                booking_elements: []
            };

            booking.booking_elements.push(current);

            acc[bookingId] = booking;
            return acc;
        }, {});

        res.json(Object.values(bookings));
    });
};

const getAllBookings = (req, res) => {
    const sql = `SELECT * FROM bookingheader`;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ bookings: results });
    });
};


const job = new cron.CronJob('0 */6 * * *', async () => {
    try {
        const lastRunDateTime = "2023-11-01T10:00:00";
        const currentDateTime = new Date();

        const list = await getBookingChange({
            "range": {
                "from": lastRunDateTime,
                "till": currentDateTime
            }
        });

        const bookingChangeList = list.response.changes;


        for (const bookingNumber of bookingChangeList) {
            const bookingDetails = await getBookingById(bookingNumber.number);
            const bookingDetailsListArray = Object.values(bookingDetails);

            insertBookingInfo(bookingDetails.response.booking);

            for (const element of bookingDetailsListArray) {
                insertBookingElement(element, bookingDetails.id);
            }
            const updateTrackSql = `
                INSERT INTO updatetrack (booking_updated, update_type, date_updated)
                VALUES (?, 'schedule', NOW())
            `;
            const updateTrackValues = [bookingNumber.number];

            db.query(updateTrackSql, updateTrackValues, (updateTrackErr, updateTrackResult) => {
                if (updateTrackErr) {
                    console.error(`Error adding update track entry for Booking ${bookingNumber.number}:`, updateTrackErr.message);
                } else {
                    console.log(`Update track entry added for Booking ${bookingNumber.number}`);
                }
            });
        }
    } catch (error) {
        console.error('Error in scheduled job:', error.message);
    }
}, null, true, 'UTC');


async function processBookingNumbers() {
    for (const { number } of numbers) {
        try {
            const response = await getBookingById(number);
            const bookingInfo = response.response.booking;


            if (typeof bookingInfo.bookingelements === 'object') {
                insertBookingInfo(bookingInfo);
                for (const elementId in bookingInfo.bookingelements) {
                    const element = bookingInfo.bookingelements[elementId];
                    if (['ACCO', 'VERVOER', 'ACTIVITEIT'].includes(element.elementtype_code)) {
                        insertBookingElement(element, bookingInfo.id);
                    }
                }
                console.log("Done");
            } else {
                console.log(`Booking ${bookingInfo.number} has no valid booking elements. Skipping insertion.`);
            }
        } catch (error) {
            console.error(`Error processing booking number ${number}: ${error.message}`);
        }
    }
}


module.exports = {
    getBookingsByDateRange,
    getAllBookings,
    job,
    processBookingNumbers
};