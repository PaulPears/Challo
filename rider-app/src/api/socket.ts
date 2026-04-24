import { io } from 'socket.io-client';
import { API_URL } from '../config/constants';

const socket = io(API_URL, {
  transports: ['polling', 'websocket'],
  forceNew: true
});

export default socket;
