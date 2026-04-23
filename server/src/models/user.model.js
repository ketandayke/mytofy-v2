import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        avatar: {
            type: String,
            default: ""
        },
        recentRooms: [{
            type: Schema.Types.ObjectId,
            ref: "Room"
        }]
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function () {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d"
        }
    )
}

export const User = mongoose.model("User", userSchema)
