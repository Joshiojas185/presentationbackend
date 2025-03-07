// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// const path = require('path');
// const multer = require("multer");
// const fs = require("fs");


// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//     cors: {
//         origin: '*',
//         methods: ['GET', 'POST'],
//         allowedHeaders: ['my-custom-header'],
//         credentials: true
//     }
// });

// // Serve static files
// app.use(cors());
// app.use(express.static('hostel'));
// app.use(express.static('host'));
// app.use(express.static('viewer'));
// app.use('/uploads', express.static('uploads'));


// const uploadFolder = "uploads";

// // Ensure 'uploads' folder exists
// if (!fs.existsSync(uploadFolder)) {
//     fs.mkdirSync(uploadFolder);
// }

// // Function to delete all files in 'uploads' folder
// const clearUploadsFolder = () => {
//     return new Promise((resolve, reject) => {
//         fs.readdir(uploadFolder, (err, files) => {
//             if (err) {
//                 console.error("Error reading upload folder:", err);
//                 reject(err);
//                 return;
//             }
//             let deletePromises = files.map(file =>
//                 fs.promises.unlink(path.join(uploadFolder, file))
//             );
//             Promise.all(deletePromises)
//                 .then(() => resolve())
//                 .catch(err => reject(err));
//         });
//     });
// };

// // Configure multer to always save the file as 'slides.pdf'
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, uploadFolder);
//     },
//     filename: (req, file, cb) => {
//         cb(null, "slides.pdf"); // Fixed filename
//     }
// });

// const upload = multer({ storage });

// // File upload route
// app.post("/upload", async (req, res) => {
//     try {
//         // 1️⃣ Clear the folder **before** uploading
//         await clearUploadsFolder();

//         // 2️⃣ Now process the file upload
//         upload.single("pdf")(req, res, (err) => {
//             if (err) {
//                 return res.status(500).json({ message: "File upload error", error: err.message });
//             }
//             if (!req.file) {
//                 return res.status(400).json({ message: "No file uploaded" });
//             }
//             res.json({ message: "File uploaded successfully as slides.pdf" });
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Error clearing folder", error: error.message });
//     }
// });


// // WebSocket connection
// let rooms = {};

// io.on('connection', (socket) => {
//     console.log('A user connected:', socket.id);

//     //BEST SOCKET.ON('JOIN ROOM')
//     socket.on('joinRoom', (roomName, playerName) => {
//         socket.join(roomName);
        
//         // Initialize the room if it doesn't exist
//         if (!rooms[roomName]) {
//             rooms[roomName] = {
//                 players: [],
//                 host: null,
//                 pdfPath: path.join(__dirname, 'uploads', 'slides.pdf'), // Set the default PDF path
//                 currentPage: 1
//             };
//         }

//         // Add the player to the room
//         rooms[roomName].players.push({ id: socket.id, name: playerName });

//         // Assign host if the player is tcshost in the tcs room
//         if (roomName === 'tcs') {
//             if (playerName === 'tcshost') {
//                 rooms[roomName].host = socket.id; // Assign this socket as the host
//                 io.to(socket.id).emit('hostAssigned'); // Notify the host
//             }
//             // If the player is not tcshost, do not assign them as host
//         } else {
//             // For other rooms, assign the first player as the host if there is no host yet
//             if (rooms[roomName].host === null) {
//                 rooms[roomName].host = socket.id; // Assign this socket as the host
//                 io.to(socket.id).emit('hostAssigned'); // Notify the host
//             }
//         }

//         // Notify all players in the room about the updated player list
//         io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        
//         // Notify the new player if they are the host
//         if (socket.id === rooms[roomName].host) {
//             io.to(socket.id).emit('hostAssigned');
//         }

//         // Notify the first user with the PDF path
//         if (rooms[roomName].pdfPath) {
//             io.to(socket.id).emit('pdfUploaded', `/uploads/slides.pdf`);
//             io.to(socket.id).emit('pageChanged', rooms[roomName].currentPage); // Send current page
//         }
//     });
//     socket.on('nextPage', (roomName) => {
//         if (rooms[roomName].pdfPath) {
//             rooms[roomName].currentPage++;
//             io.to(roomName).emit('pageChanged', rooms[roomName].currentPage);
//         }
//     });

//     socket.on('prevPage', (roomName) => {
//         if (rooms[roomName].currentPage > 1) {
//             rooms[roomName].currentPage--;
//             io.to(roomName).emit('pageChanged', rooms[roomName].currentPage);
//         }
//     });

//     socket.on('goToPage', (roomName, pageNumber) => {
//         if (rooms[roomName] && rooms[roomName].pdfPath) {
//             rooms[roomName].currentPage = pageNumber; // Update page number
//             io.to(roomName).emit('pageChanged', rooms[roomName].currentPage);
//         }
//     });

//     socket.on('disconnect', () => {
//         for (const roomName in rooms) {
//             rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
//             if (socket.id === rooms[roomName].host) {
//                 rooms[roomName].host = null; // Clear host if they disconnect
//             }
//             io.to(roomName).emit('updatePlayers', rooms[roomName].players);
//         }
//     });
   
// });

// const PORT = process.env.PORT || 5000;

// const HOST = '0.0.0.0';


// server.listen(PORT, () => {
//     console.log(`Server running on http://${HOST}:${PORT}`);
// });




const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
});

// Serve static files
app.use(cors());
app.use(express.static(path.join(__dirname, '../host'))); // Serve frontend files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads from the new location

const uploadFolder = path.join(__dirname, 'uploads'); // Update this path

// Ensure 'uploads' folder exists
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// Function to delete all files in 'uploads' folder
const clearUploadsFolder = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(uploadFolder, (err, files) => {
            if (err) {
                console.error("Error reading upload folder:", err);
                reject(err);
                return;
            }
            let deletePromises = files.map(file =>
                fs.promises.unlink(path.join(uploadFolder, file))
            );
            Promise.all(deletePromises)
                .then(() => resolve())
                .catch(err => reject(err));
        });
    });
};

// Configure multer to always save the file as 'slides.pdf'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, "slides.pdf"); // Fixed filename
    }
});

const upload = multer({ storage });

// File upload route
app.post("/upload", async (req, res) => {
    try {
        // Clear the folder before uploading
        await clearUploadsFolder();

        // Now process the file upload
        upload.single("pdf")(req, res, (err) => {
            if (err) {
                return res.status(500).json({ message: "File upload error", error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }
            res.json({ message: "File uploaded successfully as slides.pdf" });
        });
    } catch (error) {
        res.status(500).json({ message: "Error clearing folder", error: error.message });
    }
});

// WebSocket connection
let rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (roomName, playerName) => {
        socket.join(roomName);
        
        // Initialize the room if it doesn't exist
        if (!rooms[roomName]) {
            rooms[roomName] = {
                players: [],
                host: null,
                pdfPath: path.join(__dirname, 'uploads', 'slides.pdf'), // Set the default PDF path
                currentPage: 1
            };
        }

        // Add the player to the room
        rooms[roomName].players.push({ id: socket.id, name: playerName });

        // Assign host if the player is tcshost in the tcs room
        if (roomName === 'tcs') {
            if (playerName === 'tcshost') {
                rooms[roomName].host = socket.id; // Assign this socket as the host
                io.to(socket.id).emit('hostAssigned'); // Notify the host
            }
        } else {
            // For other rooms, assign the first player as the host if there is no host yet
            if (rooms[roomName].host === null) {
                rooms[roomName].host = socket.id; // Assign this socket as the host
                io.to(socket.id).emit('hostAssigned'); // Notify the host
            }
        }

        // Notify all players in the room about the updated player list
        io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        
        // Notify the new player if they are the host
        if (socket.id === rooms[roomName].host) {
            io.to(socket.id).emit('hostAssigned');
        }

        // Notify the first user with the PDF path
        if (rooms[roomName].pdfPath) {
            io.to(socket.id).emit('pdfUploaded', `/uploads/slides.pdf`);
            io.to(socket.id).emit('pageChanged', rooms[roomName].currentPage); // Send current page
        }
    });

    socket.on('nextPage', (roomName) => {
        if (rooms[roomName].pdfPath) {
            rooms[roomName].currentPage++;
            io.to(roomName).emit('pageChanged', rooms[roomName].currentPage);
        }
    });

    socket.on('prevPage', (roomName) => {
        if (rooms[roomName].currentPage > 1) {
            rooms[roomName].currentPage--;
            io.to(roomName).emit('pageChanged', rooms[roomName].currentPage);
        }
    });

    socket.on('goToPage', (roomName, pageNumber) => {
        if (rooms[roomName] && rooms[roomName].pdfPath) {
            rooms[roomName].currentPage = pageNumber; // Update page number
            io.to(roomName).emit('pageChanged', rooms[roomName].currentPage);
        }
    });

    // Other socket events...

    socket.on('disconnect', () => {
        for (const roomName in rooms) {
            rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
            if (socket.id === rooms[roomName].host) {
                rooms[roomName].host = null; // Clear host if they disconnect
            }
            io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        }
    });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});