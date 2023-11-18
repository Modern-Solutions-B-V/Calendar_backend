const express = require('express')
const { check } = require('express-validator')
const router = express.Router()
const auth = require('../middleware/auth');


const userController = require("../controllers/userController")


router.post('/register', [
    check('name', "name is required").not().isEmpty(),
    check('email', "please include a valid email").isEmail(),
    check('password', "password must contain at least 8 characters").isLength({ min: 8 })
], userController.registerUser);


router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], userController.loginUser);



router.post('/activationemail/:activation_token', userController.activateUser);

router.post('/forget-password', [
    check('email', 'Please include a valid email').isEmail(),
], userController.forgetPassword);

router.get('/reset-password/:id/:token', userController.verifyResetPassword);

router.post('/reset-password/:id/:token', userController.resetPassword);


router.get('/allUsers', userController.getAllUsers);

router.put('/updateUser/:userId', userController.updateUser);

router.delete('/deleteUser/:userId', userController.deleteUser);



module.exports = router;


