const db = require('./database')

const connectToDatabase = () => {
    db.connect((error) => {
        if (error) {
            console.log(error);
        } else {
            console.log('MySQL connected');
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
            update_type VARCHAR(255),
            date_updated TIMESTAMP
            )
            `;
            const createTableUsers = `
            CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255),
            password VARCHAR(255),
            isVerified TINYINT(1) DEFAULT 0,
            address VARCHAR(255),
            role ENUM('admin', 'superuser', 'user') DEFAULT 'user',
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
                        console.log(`Error adding foreign key ${index + 1} :`, alterTableError);
                    } else {
                        console.log(`Foreign key ${index + 1} added successfully !`);
                    }
                });
            });

            db.query(createTableBookingHeader, (createTableError1, result1) => {
                if (createTableError1) {
                    console.log("Error creating table 'bookingHeader' :", createTableError1);
                } else {
                    console.log("Table 'bookingHeader' created successfully !");
                }

                db.query(createTableBookingElement, (createTableError2, result2) => {
                    if (createTableError2) {
                        console.log("Error creating table 'BookingElement' :", createTableError2);
                    } else {
                        console.log("Table 'BookingElement' created successfully !");
                    }
                });

                db.query(createTableUsers, (createTableError2, result2) => {
                    if (createTableError2) {
                        console.log("Error creating table 'users' :", createTableError2);
                    } else {
                        console.log("Table 'users' created successfully !");
                    }
                });


                db.query(createTableUpdateTrack, (createTableError2, result2) => {
                    if (createTableError2) {
                        console.log("Error creating table 'UpdateTrack' :", createTableError2);
                    } else {
                        console.log("Table 'UpdateTrack' created successfully !");
                    }
                });
            });
        }
    });
};

module.exports = {
    connectToDatabase,
};