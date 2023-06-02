const express = require("express");
const bcrypt = require("bcrypt")
const { UserModel, validateSignIn, validateLogin, genToken } = require("../models/userModel");
const router = express.Router()
const { auth, authAdmin } = require("../middlewares/auth")

// Get list of all users - by token admin
// http://localhost:3000/users/?perPage=4
// http://localhost:3000/users/?page=2&perPage=3
// http://localhost:3000/users/?page=2&perPage=3&sort=name
router.get("/usersList", authAdmin, async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 5;
    let page = req.query.page || 1;
    let sort = req.query.sort || "_id";
    let reverse = req.query.reverse == "yes" ? -1 : 1;
    try {
        let data = await UserModel
            .find({})
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse })
        res.json(data)

    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

// Get your own info- by token
// http://localhost:3000/users/myInfo
router.get("/myInfo", auth, async (req, res) => {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    res.json(user)


})

// Add a new user
// http://localhost:3000/users
router.post("/", async (req, res) => {
    let validBody = validateSignIn(req.body)

    if (validBody.error) {
        return res.status(404).json(validBody.error.details)
    }
    try {
        let user = new UserModel(req.body)
        user.password = await bcrypt.hash(user.password, 10);

        await user.save()
        user.password = "******"
        res.status(201).json(user)
    } catch (err) {
        if (err.code == 11000) {
            return res.status(400).json({ msg: "Email is alredy in system try login", code: 11000 })
        }
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

// User login
// http://localhost:3000/users/login
router.post("/login", async (req, res) => {
    let valdiateBody = validateLogin(req.body);
    if (valdiateBody.error) {
        return res.status(400).json(valdiateBody.error.details)
    }
    try {
        let user = await UserModel.findOne({ email: req.body.email })
        if (!user) {
            return res.status(401).json({ msg: "user and password not match 1" })
        }
        let validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(401).json({ msg: "user and password not match 2" })
        }
        let newToken = genToken(user.id, user.role)
        res.json({ token: newToken });

    }
    catch (err) {

        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

// Delete user from DB
// http://localhost:3000/users/646b3a45c4605a71e3c1a0af
router.delete("/:idDel",auth, async (req, res) => {
    try {
        let idDel = req.params.idDel;
        let data;
        if (req.tokenData.role === "admin") {
            data = await UserModel.deleteOne({ _id: idDel });
        }
        else if (idDel === req.tokenData._id) {
            data = await UserModel.deleteOne({ _id: idDel });
        }
        else{
            return res.status(400).json({ err: "This operation is not enabled!" })
        }
        res.json(data);
    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

// http://localhost:3000/users/646b3b8bc4605a71e3c1a0b2
// ולשלוח את כל הנתנוים
router.put("/:idEdit",auth, async (req, res) => {
    let validBody = validateSignIn(req.body)

    if (validBody.error) {
        return res.status(400).json(validBody.error.details)
    }
    try {
        let idEdit = req.params.idEdit
        let data;
        // let data = await UserModel.updateOne({ _id: idEdit }, req.body)
        // res.json(data)

        
        if (req.tokenData.role === "admin") {
          data = await UserModel.updateOne({ _id: idEdit }, req.body)
        }
        else if (idEdit === req.tokenData._id) {
          data = await UserModel.updateOne({ _id: idEdit }, req.body)
        }
        if (!data) {
          return res.status(400).json({ err: "This operation is not enabled!" })
        }
        let user = await UserModel.findOne({ _id: idEdit });
        user.password = await bcrypt.hash(user.password, 10);
        await user.save()
        res.status(200).json({ msg: data })
      


    } catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

module.exports = router