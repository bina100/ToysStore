const mongoose = require("mongoose")
const Joi = require("joi")
const jwt = require("jsonwebtoken")

const toySchema = new mongoose.Schema({
    name:String,
    info:String,
    category:String,
    img_url:String,
    price:Number,
    user_id:String,
    date_created:{
      type:Date, default:Date.now()
    }
  })

exports.ToyModel = mongoose.model("toys", toySchema)

exports.validateToy = (_bodyValid) =>{
    let schemaJoi = Joi.object({
        name: Joi.string().min(2).max(99).required(),
        info: Joi.string().min(3).max(100).required(),
        category: Joi.string().min(3).max(15).required(),
        img_url: Joi.string().allow(null, "").max(500),
        price: Joi.number().min(1).max(9999).required()
    })
    return schemaJoi.validate(_reqBody);
}