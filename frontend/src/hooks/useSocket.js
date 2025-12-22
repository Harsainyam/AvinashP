import { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import socketService from '../services/socket';

const useSocket = (event, callback) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Connect socket if not connected
    if (!socketService.connected) {
      socketService.connect(user.id);
    }

    // Listen to event
    socketService.on(event, callback);

    // Cleanup
    return () => {
      socketService.off(event, callback);
    };
  }, [event, callback, isAuthenticated, user]);

  return socketService;
};

export default useSocket;