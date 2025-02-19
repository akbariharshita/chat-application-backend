import mongoose from "mongoose";
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;
export const clientSchema = new Schema(
  {
    password: {
      type: String,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    accessToken: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
      trim: true,
    },
    resetToken: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", clientSchema);
