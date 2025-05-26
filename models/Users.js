import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    resID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
    },
    empID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    role: {
      type: String,
      required: true,
      enum: ["Resident", "Secretary", "Official", "Clerk", "Justice"],
    },
    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "Deactivated",
        "Password Not Set",
        "Archived",
      ],
      required: true,
      default: "Password Not Set",
    },
    pushtoken: {
      type: String,
    },
    securityquestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified("securityquestions")) {
    const salt = await bcrypt.genSalt(10);
    this.securityquestions = await Promise.all(
      this.securityquestions.map(async (q) => {
        const hashedAnswer = await bcrypt.hash(q.answer, salt);
        return { question: q.question, answer: hashedAnswer };
      })
    );
  }

  next();
});

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

const User = mongoose.model("User", userSchema);

export default User;
