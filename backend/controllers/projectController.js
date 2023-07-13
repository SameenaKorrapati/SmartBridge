// Desc: Project controller

const Project = require('../models/Project')
const User = require('../models/User')
const errorHandler = require('express-async-handler')


exports.create = errorHandler(async (req, res) => {
    const { name } = req.body;

    try {
        var newProject = await Project.create({ name: name, createdBy: req.user.userId, editors: [req.user.userId] });

        const populatedProject = await Project.findById(newProject._id)
            .populate("createdBy", "-password")
            .populate("editors", "-password")
            .populate("viewers", "-password")
            .exec();

        newProject.createdBy = populatedProject.createdBy;
        newProject.editors = populatedProject.editors;
        newProject.viewers = populatedProject.viewers;

        res.status(201).json({ message: "success", data: newProject });
    } catch (e) {
        console.log(e);

        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Error occurred");
    }

})

//get all projects that the logged in user is a part of 
exports.getAll = errorHandler(async (req, res) => {
    let query = {};
    if (req.query.search) {
        query = { name: { $regex: '^' + req.query.search, $options: 'i' } };
    }

    const userId = req.user.userId;
    query.$or = [{ editors: userId }, { viewers: userId }];

    try {
        const projects = await Project.find(query)
            .populate("createdBy", "-password")
            .populate("editors", "-password")
            .populate("viewers", "-password")

        res.status(200).send({ message: "success", nb: projects.length, data: projects });
    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Some error occurred");
    }
});

//only editors can add new users
exports.addUser = errorHandler(async (req, res) => {
    const { projectID } = req.params;
    const { userEmail, permission } = req.body;
    const project = await Project.findOne({ _id: projectID }).populate("createdBy", "-password");
    if (!project) {
        return res.status(404).json({ message: "error", data: "Project not found" });
    }

    //editors can add new users
    if (!project.editors.includes(req.user.userId)) {
        return res.status(401).json({ message: "error", data: "Only editors can add new users" });
    }

    const userToBeAdded = await User.findOne({ email: userEmail });
    if (!userToBeAdded) {
        return res.status(404).json({ message: "error", data: "User not found" });
    }

    if (project.editors.includes(userToBeAdded._id) || project.viewers.includes(userToBeAdded._id)) {
        return res.status(400).json({ message: "error", data: "User is already added" });
    }

    try {
        let updatedProject;

        if (permission === "editor") {
            updatedProject = await Project.findOneAndUpdate(
                { _id: projectID },
                { $addToSet: { editors: { $each: [userToBeAdded] } } },
                {
                    new: true,
                    populate: [
                        { path: "createdBy", select: "-password" },
                        { path: "editors", select: "-password" },
                        { path: "viewers", select: "-password" },
                    ],
                }
            );
        } else if (permission === "viewer") {
            updatedProject = await Project.findOneAndUpdate(
                { _id: projectID },
                { $addToSet: { viewers: { $each: [userToBeAdded] } } },
                {
                    new: true,
                    populate: [
                        { path: "createdBy", select: "-password" },
                        { path: "editors", select: "-password" },
                        { path: "viewers", select: "-password" },
                    ],
                }
            );
        } else {
            return res.status(400).json({ message: "error", data: "Invalid permission value" });
        }

        res.status(200).json({ message: "success", data: updatedProject });
    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Some error occurred");
    }
});

//only creator can change permissions
exports.updatePermission = errorHandler(async (req, res) => {
    const { projectID } = req.params;
    const { newPermission } = req.body;

    const project = await Project.findOne({ _id: projectID }).populate("createdBy", "-password");
    if (!project) {
        return res.status(404).json({ message: "error", data: "Project not found" });
    }

    if (project.createdBy._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: "error", data: "Only the creator can update permissions" });
    }

    const userToUpdate = await User.findOne({ _id: userID });
    if (!userToUpdate) {
        return res.status(404).json({ message: "error", data: "User not found" });
    }

    try {
        if (newPermission === "viewer") {
            // Remove user from editors and add to viewers

            //if user is already viewer, do nothing
            if (project.viewers.includes(userToUpdate._id)) {
                return res.status(200).json({ message: "success", data: project });
            }

            await Project.findOneAndUpdate(
                { _id: projectID },
                { $pull: { editors: userToUpdate._id }, $addToSet: { viewers: userToUpdate._id } }
            );
        } else if (newPermission === "editor") {
            // Remove user from viewers and add to editors

            //if user is already editor, do nothing
            if (project.editors.includes(userToUpdate._id)) {
                return res.status(200).json({ message: "success", data: project });
            }


            await Project.findOneAndUpdate(
                { _id: projectID },
                { $pull: { viewers: userToUpdate._id }, $addToSet: { editors: userToUpdate._id } }
            );
        } else {
            return res.status(400).json({ message: "error", data: "Invalid permission value" });
        }

        const updatedProject = await Project.findOne({ _id: projectID })
            .populate("createdBy", "-password")
            .populate("editors", "-password")
            .populate("viewers", "-password");

        res.status(200).json({ message: "success", data: updatedProject });

    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Some error occurred");
    }
});

//only creator can delete users from project
exports.deleteUser = errorHandler(async (req, res) => {
    const { projectID, userID } = req.params;
    const project = await Project.findOne({ _id: projectID }).populate("createdBy", "-password");
    if (!project) {
        return res.status(404).json({ message: "error", data: "Project not found" });
    }

    if (project.createdBy._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: "error", data: "Only the creator can delete users" });
    }

    const userToDelete = await User.findOne({ _id: userID });
    if (!userToDelete) {
        return res.status(404).json({ message: "error", data: "User not found" });
    }

    //if user to delete is not present in editors or viewers, do nothing
    if (!project.editors.includes(userToDelete._id) && !project.viewers.includes(userToDelete._id)) {
        return res.status(200).json({ message: "success", data: project });
    }

    try {
        await Project.findOneAndUpdate(
            { _id: projectID },
            { $pull: { editors: userToDelete._id, viewers: userToDelete._id } }
        );

        const updatedProject = await Project.findOne({ _id: projectID })
            .populate("createdBy", "-password")
            .populate("editors", "-password")
            .populate("viewers", "-password");

        res.status(200).json({ message: "success", data: updatedProject });
    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Some error occurred");
    }
});


//only creator can delete project
exports.deleteProject = errorHandler(async (req, res) => {
    const { projectID } = req.params;

    const project = await Project.findOne({ _id: projectID }).populate("createdBy", "-password");

    if (!project) {
        return res.status(404).json({ message: "error", data: "Project not found" });
    }

    if (project.createdBy._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: "error", data: "Only the creator can delete the project" });
    }

    try {
        await Project.findOneAndDelete({ _id: projectID });

        res.status(200).json({ message: "success", data: "Project deleted successfully" });
    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Some error occurred");
    }
});

//only editors can rename project
exports.renameProject = errorHandler(async (req, res) => {
    const { projectID } = req.params;
    const { newName } = req.body;

    const project = await Project.findOne({ _id: projectID }).populate("createdBy", "-password");

    if (!project) {
        return res.status(404).json({ message: "error", data: "Project not found" });
    }

    //only editors can rename the project

    if (!project.editors.includes(req.user.userId)) {
        return res.status(400).json({ message: "error", data: "Only editors can rename the project" });
    }

    try {
        project.name = newName;
        await project.save();

        res.status(200).json({ message: "success", data: project });
    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "error", data: e.message });
        throw new Error("Some error occurred");
    }
});