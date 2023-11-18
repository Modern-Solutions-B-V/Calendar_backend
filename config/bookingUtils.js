const db = require('./database')

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
module.exports = { insertBookingInfo, insertBookingElement }