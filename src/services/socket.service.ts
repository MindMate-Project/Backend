import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { User, IMongooseBaseUser } from '../models/User';
import { canAccessPatient } from '../utils/ownership';

interface AuthedSocketData {
  user?: IMongooseBaseUser;
}

export function setupLocationSocket(httpServer: HTTPServer) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate every connection with a JWT from the handshake. Clients must
  // connect with: io(url, { auth: { token } }) (or an Authorization header).
  io.use(async (socket, next) => {
    try {
      const headerToken = (socket.handshake.headers['authorization'] as string | undefined)
        ?.replace(/^Bearer\s+/i, '');
      const token = (socket.handshake.auth as any)?.token || headerToken;

      if (!token) return next(new Error('Unauthorized: no token'));
      if (!process.env.JWT_SECRET_KEY) return next(new Error('Server auth misconfigured'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as { id: string; tokenVersion?: number };
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Unauthorized: user not found'));

      if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
        return next(new Error('Unauthorized: session expired, please log in again'));
      }

      (socket.data as AuthedSocketData).user = user as IMongooseBaseUser;
      next();
    } catch {
      next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Only allow subscribing to a patient the connected user is allowed to see.
    socket.on('subscribe:patient', async (patientId: string) => {
      const user = (socket.data as AuthedSocketData).user;
      if (!(await canAccessPatient(user, patientId))) {
        socket.emit('subscribe:error', { patientId, message: 'Access denied' });
        return;
      }
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
