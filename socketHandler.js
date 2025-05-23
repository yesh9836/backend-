const waitingUsers = new Map();
const activePairs = new Map();

module.exports = (io, socket) => {
  socket.on('user-details', ({ gender, interest }) => {
    socket.data = { gender, interest };
    console.log(`User ${socket.id} joined with gender: ${gender}, interest: ${interest}`);

    for (let [id, otherSocket] of waitingUsers) {
      if (id === socket.id) continue;

      if (
        otherSocket.data &&
        otherSocket.data.gender === interest &&
        otherSocket.data.interest === gender
      ) {
        waitingUsers.delete(id);
        const matchedSocket = io.sockets.sockets.get(id);

        if (matchedSocket && matchedSocket.emit) {
          matchedSocket.emit('match-found', { matched: true, socketId: socket.id });
          socket.emit('match-found', { matched: true, socketId: matchedSocket.id });

          // Store active pair
          activePairs.set(socket.id, matchedSocket.id);
          activePairs.set(matchedSocket.id, socket.id);

          console.log(`🎯 Match found: ${socket.id} <--> ${matchedSocket.id}`);
        }
        return;
      }
    }

    waitingUsers.set(socket.id, socket);
    console.log(`User ${socket.id} added to waiting list.`); 
    
  });

  socket.on('send-message', (message, toSocketId) => {
    const targetSocket = io.sockets.sockets.get(toSocketId);
    if (targetSocket) {
      targetSocket.emit('receive-message', message);
    }
  });

  socket.on('disconnect-chat', (partnerSocketId) => {
    const partnerSocket = io.sockets.sockets.get(partnerSocketId);

    // Notify both users
    if (partnerSocket) {
      partnerSocket.emit('disconect', " disconnected. press find user "); 

  
    }

    socket.emit('disconect', "You disconnected. press find user"); 
    waitingUsers.set(partnerSocketId,partnerSocket)
    waitingUsers.set(socket.id,socket)


    // Remove active pair
    activePairs.delete(socket.id);
    activePairs.delete(partnerSocketId); 

  });

  socket.on('disconnect', () => {
    waitingUsers.delete(socket.id);
    const partnerId = activePairs.get(socket.id);

    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('receive-message', "User disconnected. press find user");
    
      }

      activePairs.delete(partnerId);
      activePairs.delete(socket.id);
    }
  });

socket.on("video-offer", (offer, toSocketId) => {
  const target = io.sockets.sockets.get(toSocketId);
  if (target) {
    target.emit("video-offer", offer, socket.id);
  }
});

socket.on("video-answer", (answer, toSocketId) => {
  const target = io.sockets.sockets.get(toSocketId);
  if (target) {
    target.emit("video-answer", answer);
  }
});

socket.on("ice-candidate", (candidate, toSocketId) => {
  const target = io.sockets.sockets.get(toSocketId);
  if (target) {
    target.emit("ice-candidate", candidate);
  }
});

socket.on("start-call", (partnerId) => {
  const partnerSocket = io.sockets.sockets.get(partnerId);
  if (partnerSocket) {
    partnerSocket.emit("start-video", socket.id);
  }
});

socket.on("end-call", (partnerId) => {
  const partnerSocket = io.sockets.sockets.get(partnerId);
  if (partnerSocket) {
    partnerSocket.emit("end-video");
  }
}); 
};

