const express = require('express')
const { check } = require('express-validator')
const router = express.Router()


const userController = require("../controllers/userController")

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       description: User information for registration
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (at least 8 characters)
 *               address:
 *                 type: string
 *                 description: User's address
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *     responses:
 *       200:
 *         description: User created successfully. Please activate your account.
 *       400:
 *         description: Bad request. Validation errors in request body.
 *       500:
 *         description: Internal server error.
 */
router.post('/register', [
    check('name', "name is required").not().isEmpty(),
    check('email', "please include a valid email").isEmail(),
    check('password', "password must contain at least 8 characters").isLength({ min: 8 })
], userController.registerUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             example:
 *               payload: { id: 1, role: 'user' }
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Bad request. Invalid credentials or account not verified.
 *         content:
 *           application/json:
 *             example:
 *               errors: [{ msg: "Invalid credentials" }, { msg: "Account not verified. Please check your email for activation." }]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               errors: [{ msg: "Server error" }]
 */

router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], userController.loginUser);



/**
 * @swagger
 * /activationemail/{activation_token}:
 *   post:
 *     summary: Activate user account
 *     parameters:
 *       - in: path
 *         name: activation_token
 *         required: true
 *         description: Token for activating the user account
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User account activated successfully
 *         content:
 *           application/json:
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               msg: "Your account has been activated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               errors: [{ msg: "Server error" }]
 */
router.post('/activationemail/:activation_token', userController.activateUser);



/**
 * @swagger
 * /forget-password:
 *   post:
 *     summary: Initiate password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             example:
 *               msg: "email sent successfully"
 *       400:
 *         description: User not found or other error
 *         content:
 *           application/json:
 *             example:
 *               msg: "user not found" 
 *               details: { message: "Error details" }
 */

router.post('/forget-password', [
    check('email', 'Please include a valid email').isEmail(),
], userController.forgetPassword);

/**
 * @swagger
 * /reset-password/{id}/{token}:
 *   get:
 *     summary: Verify password reset request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user for password reset verification
 *         schema:
 *           type: integer
 *       - in: path
 *         name: token
 *         required: true
 *         description: Token for password reset verification
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           text/plain:
 *             example: "verified"
 *       400:
 *         description: User not found or other error
 *         content:
 *           application/json:
 *             example:
 *               msg: "user not found" 
 *               details: { message: "Error details" }
 */
router.get('/reset-password/:id/:token', userController.verifyResetPassword);


/**
 * @swagger
 * /reset-password/{id}/{token}:
 *   post:
 *     summary: Reset user's password
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user for password reset
 *         schema:
 *           type: integer
 *       - in: path
 *         name: token
 *         required: true
 *         description: Token for password reset
 *         schema:
 *           type: string
 *     requestBody:
 *       description: New password for the user
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password for the user
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             example:
 *               msg: "password changed"
 *       400:
 *         description: User not found or other error
 *         content:
 *           application/json:
 *             example:
 *               msg: "user not found" 
 *               details: { message: "Error details" }
 */
router.post('/reset-password/:id/:token', userController.resetPassword);


/**
 * @swagger
 * /allUsers:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: Return a list of all users
 *         content:
 *           application/json:
 *             example:
 *               users:
 *                 - id: 1
 *                   name: John Doe
 *                   email: john@example.com
 *                   role: user
 *                   isVerified: 1
 *                   createdAt: "2023-01-01T12:00:00Z"
 *                   updatedAt: "2023-01-01T12:00:00Z"
 *                 - id: 2
 *                   name: Jane Doe
 *                   email: jane@example.com
 *                   role: admin
 *                   isVerified: 1
 *                   createdAt: "2023-01-02T12:00:00Z"
 *                   updatedAt: "2023-01-02T12:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Database error"
 */
router.get('/allUsers', userController.getAllUsers);

/**
 * @swagger
 * /updateUser/{userId}:
 *   put:
 *     summary: Update user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to be updated
 *         schema:
 *           type: integer
 *     requestBody:
 *       description: Updated user data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated user's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated user's email
 *               password:
 *                 type: string
 *                 description: Updated user's password
 *               address:
 *                 type: string
 *                 description: Updated user's address
 *               phone:
 *                 type: string
 *                 description: Updated user's phone number
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "User updated successfully"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Database error"
 */
router.put('/updateUser/:userId', userController.updateUser);

/**
 * @swagger
 * /deleteUser/{userId}:
 *   delete:
 *     summary: Delete user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to be deleted
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "User deleted successfully"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               error: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: "Database error"
 */
router.delete('/deleteUser/:userId', userController.deleteUser);



module.exports = router;


