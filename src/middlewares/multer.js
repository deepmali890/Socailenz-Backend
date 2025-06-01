const multer = require('multer');

const storage = multer.memoryStorage();
const fileHandle = multer({ storage }).fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'post', maxCount: 10 },
    { name: 'music', maxCount: 1 }
]);

module.exports = fileHandle;
