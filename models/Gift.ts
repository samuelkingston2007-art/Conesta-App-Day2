import mongoose, { Schema } from "mongoose";

const GiftSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    occasion: {
      type: String,
      required: true,
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Gift || mongoose.model("Gift", GiftSchema);
