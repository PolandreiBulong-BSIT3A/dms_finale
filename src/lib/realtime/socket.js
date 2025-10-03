import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/frontend/client.js';

// Derive Socket.IO base origin from API_BASE_URL (e.g., https://host/api -> https://host)
function deriveSocketOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    return url.origin;
  } catch {
    if (typeof window !== 'undefined' && API_BASE_URL && API_BASE_URL.startsWith('http')) return API_BASE_URL;
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
  }
}

const SOCKET_URL = deriveSocketOrigin();

// Singleton Socket.IO client for the whole app
const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});

export default socket;
