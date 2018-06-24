const socketIo = require('socket.io');
let io;
let guestNumber = 1;
let nicknames = {};
let namesUsed = [];
let currentRoom = {};

function assignGuestName(socket, guestNumber, nicknames, namesUsed) {
    let name = 'Guest' + guestNumber;
    nicknames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    console.log(room);
    socket.emit('joinResult', {room: room});
    if (io.sockets.rooms.indexOf(room) === -1) {
        io.sockets.rooms.push(room);
    }
    socket.broadcast.to(room).emit('message', {text: nicknames[socket.id] + 'has joined ' + room + '.'});
    let usersInRoom = io.sockets.adapter.rooms[room];
    console.log(usersInRoom);
    if (usersInRoom && usersInRoom.length && usersInRoom.length > 1) {
        let usesInRoomSummary = 'Users currently in ' + room + ': ';
        let index = 0;
        for (const id in  usersInRoom.sockets) {
            if (id !== socket.id) {
                if (index++ < usersInRoom.length) {
                    usesInRoomSummary += ', ';
                }
                // noinspection JSUnfilteredForInLoop
                usesInRoomSummary += nicknames[id];
            }
        }
        usesInRoomSummary += '.';
        socket.emit('message', {text: usesInRoomSummary});
    }

}

function handleMessageBroadcasting(socket, nicknames) {
    socket.on('message', (message) => {
        socket.broadcast.to(message.room).emit('message', {text: nicknames[socket.id] + ': ' + message.text});
    });
}

function handleNameChangeAttempts(socket, nicknames, namesUsed) {
    socket.on('nameAttempt', (name) => {
        if (name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        } else {
            if (namesUsed.indexOf(name) === -1) {
                let previousName = nicknames[socket.id];
                let previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nicknames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now know as ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });

}

function handleRoomJoining(socket) {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id], (err) => {
            console.log(err);
        });
        joinRoom(socket, room.newRoom);
    });

}

function handleClientDisconnection(socket, nicknames, namesUsed) {
    socket.on('disconnect', () => {
        delete namesUsed[namesUsed.indexOf(nicknames[socket.id])];
        delete nicknames[socket.id];
    });
}

exports.listen = function (server) {
    io = socketIo.listen(server);
    io.sockets.on('connection', function (socket) {
        guestNumber = assignGuestName(socket, guestNumber, nicknames, namesUsed);
        joinRoom(socket, 'Lobby');
        handleMessageBroadcasting(socket, nicknames);
        handleNameChangeAttempts(socket, nicknames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', () => {
            const rooms = io.sockets.adapter.rooms;
            const rs = [];
            io.sockets.rooms.forEach(room => {
                let r = rooms[room];
                if (room && r && r.length) {
                    console.log(r.length);
                    rs.push(room);
                }
            });
            io.sockets.rooms = rs;
            console.log(io.sockets.rooms);
            socket.emit('rooms', rs);

        });

        handleClientDisconnection(socket, nicknames, namesUsed);
    });
};