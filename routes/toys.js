const express = require("express");
const bcrypt = require("bcrypt")
const { UserModel, validateSignIn, validateLogin, genToken } = require("../models/userModel");
const router = express.Router()
const { auth } = require("../middlewares/auth");
const { ToyModel } = require("../models/toysModel");

// Get list of toys
// http://localhost:3000/toys
// http://localhost:3000/toys/?perPage=4
// http://localhost:3000/toys/?page=2&perPage=3
// http://localhost:3000/toys/?page=2&perPage=3&sort=name
router.get("/", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    try {
        let data = await ToyModel
            .find({})
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ _id: -1 })
        res.json(data)

    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "There error try again later", err })
    }
})

// Get single toy by id 
// http://localhost:3000/toys/single/6479a7752075eda9b6200b3c
router.get("/single/:id", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    try {
        let toyId = req.params.id
        let data = await ToyModel
            .findOne({_id: toyId})
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ _id: -1 })
        res.json(data)

    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "There error try again later", err })
    }
})

// Get list of toys with token
// http://localhost:3000/toys
// http://localhost:3000/toys/?perPage=4
// http://localhost:3000/toys/?page=2&perPage=3
// http://localhost:3000/toys/?page=2&perPage=3&sort=name
// router.get("/", auth, async (req, res) => {
//     let perPage = Math.min(req.query.perPage, 20) || 10;
//     let page = req.query.page || 1;
//     let sort = req.query.sort || "_id";
//     let reverse = req.query.reverse == "yes" ? -1 : 1;
//     let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
//     try {
//         let data = await ToyModel
//             .find({ user_id: user.id })
//             .limit(perPage)
//             .skip((page - 1) * perPage)
//             .sort({ [sort]: reverse })
//         res.json(data)

//     } catch (err) {
//         console.log(err)
//         res.status(500).json({ msg: "err", err })
//     }
// })


// Search toy by name or info
// http://localhost:3000/toys/search?s=w
router.get("/search", async (req, res) => {
    let perPage = req.query.perPage || 10;
    let page = req.query.page || 1;
    try {
        let queryS = req.query.s
        let searchReg = new RegExp(queryS, "i")
        let data = await ToyModel.find({ $or: [{ name: searchReg }, { info: searchReg }] })
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ _id: -1 })
        res.json(data)
    } catch (err) {
        res.status(500).json({ msg: "err", err })
    }
})

// Get by price
// http://localhost:3000/toys/prices?min=100&max=300
router.get("/prices", async (req, res) => {
    let perPage = req.query.perPage || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "price"
    let reverse = req.query.reverse == "yes" ? -1 : 1;
    try {
        let minP = req.query.min;
        let maxP = req.query.max;
        let data;
        if (minP && maxP) {
            data = await ToyModel.find({ $and: [{ price: { $gte: minP } }, { price: { $lte: maxP } }] }).limit(perPage)
                .skip((page - 1) * perPage)
                .sort({ [sort]: reverse })
        }
        else if (maxP) {
            data = await ToyModel.find({ price: { $lte: maxP } }).limit(perPage)
                .skip((page - 1) * perPage)
                .sort({ [sort]: reverse })
        } else if (minP) {
            data = await ToyModel.find({ price: { $gte: minP } }).limit(perPage)
                .skip((page - 1) * perPage)
                .sort({ [sort]: reverse })
        } else {
            data = await ToyModel.find({}).limit(perPage)
                .skip((page - 1) * perPage)
                .sort({ [sort]: reverse })
        }

        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "there error try again later", err })
    }
})

// Get by category
// http://localhost:3000/toys/category/Bike
router.get("/category/:catName", async (req, res) => {
    let perPage = req.query.perPage || 10;
    let page = req.query.page || 1;
    try {
        let catN = req.params.catName;
        let catReg = new RegExp(catN, "i")
        let data = await ToyModel.find({ category: catReg })
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ _id: -1 })
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "there error try again later", err })
    }
})

// Add toy -need token
// http://localhost:3000/toys
router.post("/", auth, async (req, res) => {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    let toyObj = { ...req.body, user_id: user.id }
    if (!user) {
        return res.status(404).json({ msg: "user not found" })
    }
    try {
        let toy = new ToyModel(toyObj)
        console.log(toy)
        await toy.save()
        res.status(201).json(toy)
    } catch (err) {
        res.status(500).json({ msg: "err", err })
    }
})



// Delete toy
// http://localhost:3000/toys/64732656c73441cf136e0786
router.delete("/:idDel", auth, async (req, res) => {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    if (!user) {
        return res.status(404).json({ msg: "you can`t delete toy from other user" })

    }
    try {
        let idDel = req.params.idDel
        let data = await ToyModel.deleteOne({ _id: idDel })
        res.status(200).json(data)
    } catch {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

// Update toy
// http://localhost:3000/toys/646b3b8bc4605a71e3c1a0b2
router.put("/:idEdit", auth, async (req, res) => {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    if (!user) {
        return res.status(404).json({ msg: "you can`t edit toy from other user" })
    }
    try {
        let idEdit = req.params.idEdit
        let data = await ToyModel.updateOne({ _id: idEdit }, req.body)
        res.json(data)
    } catch {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

module.exports = router