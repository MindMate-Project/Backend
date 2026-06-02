import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

export function setupLocationSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe:patient', (patientId: string) => {
      socket.join(`patient:${patientId}`);
      console.log(`Client ${socket.id} subscribed to patient ${patientId}`);
    });

    socket.on('leave:patient', (patientId: string) => {
      socket.leave(`patient:${patientId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}