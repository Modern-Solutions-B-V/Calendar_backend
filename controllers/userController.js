const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mysql = require('mysql');
const db = require('../config/database');

const registerUser = async (req, res) => {
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
            } else {
                const utilisateur = { name, email, password, address, phone }
                const activation_token = createActivationToken(utilisateur);
                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    "INSERT INTO users (name, email, password, address, phone) VALUES (?, ?, ?, ?, ?)",
                    [name, email, hashedPassword, address, phone],
                    async (error, result) => {
                        if (error) {
                            console.log(error);
                            return res.status(500).json({ errors: [{ msg: "Server error" }] });
                        }
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
                    })
            }
        });

    } catch (error) {
        console.log("Error sending email:", error.message);
        res.status(500).json({ msg: "Error sending email", error: error.message });
    }
};

const createActivationToken = (payload) => {
    return jwt.sign(payload, "mysecrettoken", { expiresIn: '30m' });
};

const activateUser = async (req, res) => {
    try {
        const { activation_token } = req.params;
        const user = jwt.verify(activation_token, "mysecrettoken");

        const { name, email, password, phone, address, role } = user;

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "UPDATE users SET isVerified = 1, password = ? WHERE email = ?",
            [hashedPassword, email],
            (error, result) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ errors: [{ msg: "Server error" }] });
                }

                const payload = {
                    newUser: {
                        id: result.insertId,
                    },
                };

                jwt.sign(payload, "mysecrettoken", { expiresIn: 3600 }, (err, token) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).json({ errors: [{ msg: "Server error" }] });
                    }
                    res.json({ token, msg: 'Your account has been activated' });
                });
            }
        );
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};



const loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        db.query("SELECT id, email, role, password, isVerified FROM users WHERE email = ?", [email], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ errors: [{ msg: "Server error" }] });
            }

            if (results.length === 0 || !bcrypt.compareSync(password, results[0].password)) {
                return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
            }

            if (results[0].isVerified !== 1) {
                return res.status(400).json({ errors: [{ msg: "Account not verified. Please check your email for activation." }] });
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
};
const forgetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let email = req.body.email;
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
            res.status(200).json({ msg: "email sent successfully" });
        } else {
            res.status(400).json({ msg: "user not found" });
        }
    });
};

const verifyResetPassword = async (req, res) => {
    const { id } = req.params;
    db.query('Select * FROM users where id=? limit 1', id, async function (error, result, fields) {
        if (error) {
            return res.status(400).json({ message: error });
        }
        if (result.length > 0) {
            try {
                res.send("verified");
            } catch (err) {
                res.status(500).json({ msg: err.message });
            }
        } else {
            res.status(400).json({ msg: "user not found" });
        }
    });
};

const resetPassword = async (req, res) => {
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
                    db.query(`UPDATE users SET password='${hash}' where id= '${id}'`);
                });
                res.status(200).json({ msg: "password changed" });
            } catch (err) {
                res.status(500).json({ msg: err.message });
            }
        } else {
            res.status(400).json({ msg: "user not found" });
        }
    });
};


const getAllUsers = (req, res) => {
    const sql = `SELECT * FROM users`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ users: results });
    });
};

const updateUser = (req, res) => {
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
};

const deleteUser = (req, res) => {
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
};

module.exports = {
    registerUser,
    activateUser,
    loginUser,
    forgetPassword,
    verifyResetPassword,
    resetPassword,
    getAllUsers,
    updateUser,
    deleteUser,
};
