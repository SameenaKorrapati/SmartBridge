const mongoose = require('mongoose');
const User = require('./User');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide name of project'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    editors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    viewers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ]
})

module.exports = mongoose.model('Project', ProjectSchema);