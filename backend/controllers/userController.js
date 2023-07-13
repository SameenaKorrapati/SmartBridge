// Desc: User controller

const User = require('../models/User')
const errorHandler = require('express-async-handler')
const { StatusCodes } = require('http-status-codes')


exports.register = errorHandler(async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Please fill all the fields' })
        throw new Error('Please fill all the fields')
    }
    //check if the user already exists
    const user = await User.findOne({ email })

    if (user) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'User already exists' })
        throw new Error('User already exists')
    }

    const newUser = await User.create({ ...req.body });

    if (newUser) {
        const token = newUser.createJWT();
        res.status(StatusCodes.CREATED).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            token: token
        });
    } else {
        res.status(StatusCodes.BAD_REQUEST);
        throw new Error('Failed to create user');
    }

});

exports.login = errorHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error('Please fill all the fields')
    }
    const user = await User.findOne({ email })

    if (!user) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: "User doesn't exist" })
        throw new Error("User doesn't exist")
    }

    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: 'Incorrect credentials' })
        throw new Error('Incorrect credentials')
    }

    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: token
    })
});

exports.getAll = errorHandler(async (req, res) => {
    let query = {};
    if (req.query.search) {
        query = {
            $or: [
                { name: { $regex: '^' + req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ]
        }
    }
    const users = await User.find(query).find({ _id: { $ne: req.user._id } })
    res.send({ nb: users.length, data: users });

});