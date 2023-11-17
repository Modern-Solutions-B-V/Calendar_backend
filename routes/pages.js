const express = require('express')
const { check, validationResult } = require('express-validator')
const nodemailer = require('nodemailer')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth');
const mysql = require('mysql')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'calendar'

})



router.post('/register', [
    check('name', "name is required").not().isEmpty(),
    check('email', "please include a valid email").isEmail(),
    check('password', "password must contain at least 8 characters").isLength({ min: 8 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, password, address, phone, role } = req.body;

        db.query("SELECT email FROM users WHERE email= ?", [email], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ errors: [{ msg: "Server error" }] });
            }

            if (results.length > 0) {
                return res.status(400).json({ errors: [{ msg: "User already exists" }] });
            }
            else {
                const utilisateur = { name, email, password, address, phone }
                const activation_token = createActivationToken(utilisateur);
                console.log(activation_token)

                const url = `http://localhost:3000/activationemail/${activation_token}`;

                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    service: 'gmail',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'noreplyhuski@gmail.com',
                        pass: 'sopa ctfa dmep bewr'
                    }
                });

                await transporter.sendMail({
                    from: 'noreplyhuski@gmail.com',
                    to: email,
                    subject: 'Verify Email',
                    html: `
                        <div>
                            <p><strong>Hello ${name}</strong></p>
                            <p>You registered an account on Huski. Before being able to use your account, you need to verify your email address by clicking here:</p>
                            <a href=${url}><button style="background-color:#609966; display:inline-block; padding:20px; width:200px;color:#ffffff;text-align:center;">Click here</button></a>
                            <br />
                            <p>Kind Regards</p>
                        </div>
                    `
                });
                

                res.status(200).json({ msg: "Please activate your account" });
            }
        });

    } catch (error) {
        console.log("Error sending email:", error.message);
        res.status(500).json({ msg: "Error sending email", error: error.message });
    }
});

const createActivationToken = (payload) => {
    return jwt.sign(payload, "mysecrettoken", { expiresIn: '30m' });
};

router.post('/activationemail', async (req, res) => {
    try {
        const { activation_token } = req.body;
        const user = jwt.verify(activation_token, "mysecrettoken");

        const { name, email, password, phone, address, role } = user;

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query("INSERT INTO users SET ?", { name, email, password: hashedPassword, phone, address }, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ errors: [{ msg: "Server error" }] });
            }

            const payload = {
                newUser: {
                    id: result.insertId
                }
            };

            jwt.sign(payload, "mysecrettoken", { expiresIn: 3600 }, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).json({ errors: [{ msg: "Server error" }] });
                }
                res.json({ token, msg: 'Your account has been activated' });
            });
        });

    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        db.query("SELECT id, email,role, password FROM users WHERE email = ?", [email], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ errors: [{ msg: "Server error" }] });
            }

            if (results.length === 0 || !bcrypt.compareSync(password, results[0].password)) {
                return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
            }

            const payload = {
                utilisateur: {
                    id: results[0].id,
                    role: results[0].role
                }
            };

            jwt.sign(payload, "mysecrettoken", { expiresIn: 3600 }, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).json({ errors: [{ msg: "Server error" }] });
                }
                res.json({ payload, token });
            });

        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});





router.post('/logout', (req, res) => {
    res.cookie('token', "", { expires: new Date(0) });
    res.status(200).json({ msg: "user logged out" })
})


router.post('/forget-password', [
    check('email', 'Please include a valid email').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let email = req.body.email
    db.query('Select * FROM users where email=? limit 1', email, async function (error, result, fields) {
        if (error) {
            return res.status(400).json({ message: error });
        }
        if (result.length > 0) {
            const secret = "mysecrettoken" + result[0].password;
            const token = jwt.sign({ email: result[0].email, id: result[0].id }, secret, { expiresIn: "30m" });
            const link = `http://localhost:3000/resetPage/${result[0].id}/${token}`;

            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                service: 'gmail',
                port: 465,
                secure: true,
                auth: {
                    user: 'noreplyhuski@gmail.com',
                    pass: 'sopa ctfa dmep bewr'
                }
            });

            await transporter.sendMail({
                from: 'noreplyhuski@gmail.com',
                to: email,
                subject: 'change password',
                html: link
            });
            res.status(200).json({ msg: "email sent successfully" })
        }


        else {
            res.status(400).json({ msg: "user not found" })
        }
    })
})

router.get('/reset-password/:id/:token', async (req, res) => {
    const { id } = req.params;
    db.query('Select * FROM users where id=? limit 1', id, async function (error, result, fields) {
        if (error) {
            return res.status(400).json({ message: error });
        }
        if (result.length > 0) {
            try {
                res.send("verified")
            } catch (err) {
                res.status(500).json({ msg: err.message })

            }

        }
        else {
            res.status(400).json({ msg: "user not found" })
        }
    })
})

router.post('/reset-password/:id/:token', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    db.query('Select * FROM users where id=? limit 1', id, async function (error, result, fields) {
        if (error) {
            return res.status(400).json({ message: error });
        }
        if (result.length > 0) {
            try {
                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        console.log(err);
                    }
                    db.query(`UPDATE users SET password='${hash}' where id= '${id}'`)
                })
                res.status(200).json({ msg: "password changed" })

            } catch (err) {
                res.status(500).json({ msg: err.message })

            }

        }
        else {
            res.status(400).json({ msg: "user not found" })
        }
    })
})


router.get('/getBookingsByDateRange', (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(req.query)

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
});




router.get('/getAllBookings', (req, res) => {

    const sql = `
        SELECT *
        FROM bookingheader
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ bookings: results });
    });
});

router.get('/allUsers', (req, res) => {
    const sql = `SELECT * FROM users`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ users: results });
    });
})

router.put('/updateUser/:userId', (req, res) => {
    const userId = req.params.userId;
    const updatedUserData = req.body;

    const sql = 'UPDATE users SET ? WHERE id = ?';
    db.query(sql, [updatedUserData, userId], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

router.delete('/deleteUser/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    });
});

module.exports = router;    