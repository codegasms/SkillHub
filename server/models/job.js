const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "completed", "closed"],
      default: "open",
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bidAccepted: {
      type: Boolean,
      default: false,
    },
    categories: [{ type: String }], // Categories for jobs
    skillsRequired: [{ type: String }], // Skills required for the job
  },
  { timestamps: true }
);

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
module.exports = Job;
