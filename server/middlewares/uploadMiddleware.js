const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');

// Set up Multer storage
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extname && mimeType) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Middleware function for handling profile picture upload
const handleProfilePicUpload = async (req, res, next) => {
    if (!req.file) {
        return next(); // No file to upload, proceed to the next middleware
    }

    const userId = req.body.userId; // Pass userId in the request
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const publicDir = path.join(__dirname, '../public/profilepic');
    const newFileName = `${user.username}.jpg`;
    const newFilePath = path.join(publicDir, newFileName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // Delete old profile picture if it exists
    if (user.info && user.info.profilePic) {
        const oldFilePath = path.join(__dirname, '../public', user.info.profilePic);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }
    }

    // Compress and save the new profile picture using sharp
    await sharp(req.file.buffer)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toFile(newFilePath);

    // Update user profilePic path in the database
    user.info.profilePic = `/profilepic/${newFileName}`;
    await user.save();

    req.profilePicPath = user.info.profilePic; // Attach the new path to req
    next(); // Proceed to the next middleware or route handler
};

// Export the upload and middleware
module.exports = { upload, handleProfilePicUpload };