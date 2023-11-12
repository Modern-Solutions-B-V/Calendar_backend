const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql')
const fs = require('fs');

const jsonData = JSON.parse(fs.readFileSync('./response.json'));
const numbers = (jsonData.response.changes)
const cors = require('cors')
const { getClientById, getUpdatedClientByDateRange, getBookingById, getBookingChange } = require('./controllers/relation')
const app = express()
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'calendar'

})

db.connect((error) => {
    if (error) {
        console.log(error)
    }
    else {
        console.log("mysql connected");
        const createTableBookingHeader = `
        CREATE TABLE IF NOT EXISTS bookingheader (
            id INT AUTO_INCREMENT PRIMARY KEY,
            number VARCHAR(255),
            trip_name TEXT,
            status_code VARCHAR(255),
            status_name VARCHAR(255),
            company_name VARCHAR(255),
            deptor_place VARCHAR(255),
            contact_first_name VARCHAR(255),
            contact_middle_name VARCHAR(255),
            contact_surname VARCHAR(255),
            summary INT,
            startdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            enddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `;

        const createTableBookingElement = `
            CREATE TABLE IF NOT EXISTS bookingelement (
                id INT AUTO_INCREMENT PRIMARY KEY,
                element_name VARCHAR(255),
                element_type_code VARCHAR(255),
                supplier_place VARCHAR(255),
                supplier_country VARCHAR(50),
                startdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                starttime TIME,
                enddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                endtime TIME,
                amount INT,
                amount_description VARCHAR(255),
                booking_id INT
            )
        `;

        const createTableUpdateTrack = `
        CREATE TABLE IF NOT EXISTS updatetrack (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_updated VARCHAR(255),
        date_updated TIMESTAMP
        )
        `;
        const createTableUsers = `
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        password VARCHAR(255),
        address VARCHAR(255),
        phone INT
        )
        `;
        const addForeignKeysQueries = [
            `
        ALTER TABLE bookingelement
        ADD FOREIGN KEY (booking_id) REFERENCES bookingheader (id);
        `,

        ];
        addForeignKeysQueries.forEach((query, index) => {
            db.query(query, (alterTableError, result) => {
                if (alterTableError) {
                    console.log(`Erreur lors de l'ajout de la clé étrangère ${index + 1} :`, alterTableError);
                } else {
                    console.log(`Clé étrangère ${index + 1} ajoutée avec succès !`);
                }
            });
        });

        db.query(createTableBookingHeader, (createTableError1, result1) => {
            if (createTableError1) {
                console.log("Erreur lors de la création de la table 'bookingHeader' :", createTableError1);
            } else {
                console.log("Table 'bookingHeader' créée avec succès !");
            }

            db.query(createTableBookingElement, (createTableError2, result2) => {
                if (createTableError2) {
                    console.log("Erreur lors de la création de la table 'BookingElement' :", createTableError2);
                } else {
                    console.log("Table 'BookingElement' créée avec succès !");
                }
            });

            db.query(createTableUsers, (createTableError2, result2) => {
                if (createTableError2) {
                    console.log("Erreur lors de la création de la table 'users' :", createTableError2);
                } else {
                    console.log("Table 'users' créée avec succès !");
                }
            });


            db.query(createTableUpdateTrack, (createTableError2, result2) => {
                if (createTableError2) {
                    console.log("Erreur lors de la création de la table 'UpdateTrack' :", createTableError2);
                } else {
                    console.log("Table 'UpdateTrack' créée avec succès !");
                }
            });
        });


    }

})

app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', require('./routes/pages'))



const insertBookingInfo = (bookingInfo) => {
    const sql = `
        INSERT INTO bookingheader (id, number, trip_name, status_code, status_name, company_name, deptor_place, contact_first_name, contact_middle_name, contact_surname, summary, startdate, enddate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        number = VALUES(number),
        trip_name = VALUES(trip_name),
        status_code = VALUES(status_code),
        status_name = VALUES(status_name),
        company_name = VALUES(company_name),
        deptor_place = VALUES(deptor_place),
        contact_first_name = VALUES(contact_first_name),
        contact_middle_name = VALUES(contact_middle_name),
        contact_surname = VALUES(contact_surname),
        summary = VALUES(summary),
        startdate = VALUES(startdate),
        enddate = VALUES(enddate)
    `;
    const values = [bookingInfo.id, bookingInfo.number, bookingInfo.trip, bookingInfo.status_code, bookingInfo.status_name, bookingInfo.debtor.companyname, bookingInfo.debtor.place, bookingInfo.contactdetails.firstname, bookingInfo.contactdetails.middlename, bookingInfo.contactdetails.surname, bookingInfo.summary, bookingInfo.dates.startdate, bookingInfo.dates.enddate];

    db.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        } else {
            console.log(`Booking ${bookingInfo.number} info inserted or updated`);
            const updateTrackSql = `
            INSERT INTO updatetrack (booking_updated, date_updated)
            VALUES (?, NOW())
        `;
            const updateTrackValues = [bookingInfo.number];
            db.query(updateTrackSql, updateTrackValues, (updateTrackErr, updateTrackResult) => {
                if (updateTrackErr) {
                    throw updateTrackErr;
                } else {
                    console.log(`Update track entry added for Booking ${bookingInfo.number}`);
                }
            });
        }
    });
};


const insertBookingElement = (element, bookingId) => {
    if (['ACCO', 'VERVOER', 'ACTIVITEIT'].includes(element.elementtype_code)) {
        const selectSql = 'SELECT id FROM bookingelement WHERE element_name = ? AND booking_id = ?';
        const selectValues = [element.name, bookingId];

        db.query(selectSql, selectValues, (selectErr, selectResult) => {
            if (selectErr) {
                throw selectErr;
            }

            if (selectResult.length > 0) {
                const updateSql = `
                    UPDATE bookingelement
                    SET element_type_code = ?,
                        supplier_place = ?,
                        supplier_country = ?,
                        startdate = ?,
                        starttime = ?,
                        enddate = ?,
                        endtime = ?,
                        amount = ?,
                        amount_description = ?
                    WHERE id = ?
                `;

                const updateValues = [
                    element.elementtype_code,
                    element.supplier.place,
                    element.supplier.country,
                    element.dates.startdate,
                    element.dates.starttime,
                    element.dates.enddate,
                    element.dates.endtime,
                    element.bookingitems[Object.keys(element.bookingitems)[0]].amount,
                    element.bookingitems[Object.keys(element.bookingitems)[0]].description,
                    selectResult[0].id
                ];

                db.query(updateSql, updateValues, (updateErr, updateResult) => {
                    if (updateErr) {
                        throw updateErr;
                    } else {
                        console.log(`Booking Element ${element.name} updated for Booking ID ${bookingId}`);
                    }
                });
            } else {
                const insertSql = `
                    INSERT INTO bookingelement (element_name, element_type_code, supplier_place, supplier_country, startdate, starttime, enddate, endtime, amount, amount_description, booking_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const insertValues = [
                    element.name,
                    element.elementtype_code,
                    element.supplier.place,
                    element.supplier.country,
                    element.dates.startdate,
                    element.dates.starttime,
                    element.dates.enddate,
                    element.dates.endtime,
                    element.bookingitems[Object.keys(element.bookingitems)[0]].amount,
                    element.bookingitems[Object.keys(element.bookingitems)[0]].description,
                    bookingId
                ];

                db.query(insertSql, insertValues, (insertErr, insertResult) => {
                    if (insertErr) {
                        throw insertErr;
                    } else {
                        console.log(`Booking Element ${element.name} inserted for Booking ID ${bookingId}`);
                    }
                });
            }
        });
    }
};

numbers.forEach(async ({ number }) => {
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
});

app.listen(5000, () => {
    console.log('server running on port 5000');
})