import { User, Patient, Caregiver } from "../models/User.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, relation, phone, dateOfBirth, medicalNotes } = req.body;

  // Check if the user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  let user;
  if (role === "patient") {
    user = await Patient.create({ name, email, password, dateOfBirth, medicalNotes });
  } else if (role === "caregiver") {
    user = await Caregiver.create({ name, email, password, relation, phone });
  } else {
    user = await User.create({ name, email, password });
  }

  // Generate a random verification code
  const verificationToken = crypto.randomBytes(20).toString("hex");

  // Store the verificationToken
  user.verificationToken = verificationToken;
  // Save the user with the token
  await user.save(); // <<<=== This is important! Save before sending email

  // Send verification email
  const verificationUrl = `http://localhost:5000/api/users/verify/${verificationToken}`;
  const message = `
      <h3>Hello ${user.name}</h3>
      <p>Thank you for registering. Click the link below to activate your account:</p>
      <a href="${verificationUrl}">Activate Account</a>
  `;
  
  try {
  console.log("verificationToken : ",verificationToken);
    await sendEmail(user.email, "Account Verification", message);

    res.status(201).json({
      message: "User registered successfully. Please check your email to activate your account.",
      data: { user: { name: user.name, email: user.email, role: user.role } }
    });
  } catch (emailError) {
    // Optional: If email fails, you might want to delete the user or let them try again
    console.error(emailError);
 res.status(500);
 throw new Error("User registered, but email verification failed to send.");
 }
});
// This is a new controller function
export const verifyUserAccount = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  // Find user by token
  const user = await User.findOne({ verificationToken });

  if (!user) {
    res.status(400);
    throw new Error("Invalid verification token");
  }

  // Verify user
  user.isVerified = true;
  user.verificationToken = undefined; 
  await user.save();

  res.status(200).json({ message: "Account verified successfully. You can now log in." });
});

// login 
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Check if user exists
  const user = await User.findOne({ email });

  // 2. Check if password matches
  if (user && (await user.matchPassword(password))) {
    
    // 3. NOW check if user is verified
    if (!user.isVerified) {
      res.status(401); // 401 Unauthorized
      throw new Error('Please verify your account first. Check your email for the activation link.');
    }

    const token = generateToken(user._id);
    res.json({
      message: "Login successful",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("There is no user with that email address");
  }

  // 1. Generate a random 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Hash the reset code and set it on the user model
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // 3. Set an expiration time (e.g., 10 minutes from now)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // 4. Send the code to the user's email
  try {
    const message = `
      <h3>Hello ${user.name}</h3>
      <p>You requested a password reset. Please use the code below to reset your password.</p>
      <h2>${resetCode}</h2>
      <p>This code will expire in 10 minutes.</p>
    `;
    await sendEmail(user.email, "Password Reset Code", message);

    res.status(200).json({
      message: "Password reset code sent to your email.",
    });

  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.error(error);
    res.status(500);
    throw new Error("Failed to send the password reset email.");
  }
});
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;

  // 1. Hash the incoming code from the user
  const hashedCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

  // 2. Find the user by email, and with a valid (non-expired) token
  const user = await User.findOne({
    email,
    passwordResetToken: hashedCode,
    passwordResetExpires: { $gt: Date.now() }, // Check that the token is not expired
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid code or code has expired.");
  }

  user.password = password; // The 'pre-save' hook in your model will hash it automatically

  // Clear the reset token fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
// Log the user in immediately by generating a new token
  const token = generateToken(user._id);

  res.status(200).json({
    message: "Password has been reset successfully.",
    token,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});