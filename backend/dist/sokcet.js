"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLocationSocket = setupLocationSocket;
const socket_io_1 = require("socket.io");
function setupLocationSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('subscribe:patient', (patientId) => {
            socket.join(`patient:${patientId}`);
            console.log(`Client ${socket.id} subscribed to patient ${patientId}`);
        });
        socket.on('leave:patient', (patientId) => {
            socket.leave(`patient:${patientId}`);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    return io;
}
