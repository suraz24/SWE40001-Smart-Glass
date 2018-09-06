'use strict';

const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000
var socketIO = require('socket.io');

var { ProcessFrames } = require('./gesture');

var app = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    // .get('/admin', (req, res) => res.render('pages/admin'))
    .listen(PORT, () => { console.log(`Listening on ${PORT}`) })

var io = socketIO.listen(app);

const USER = {
    INSTRUCTOR : "INSTRUCTOR",
    OPERATOR : "OPERATOR"
}
var isReady = false

var current_iFrame, current_oFrame, last_iFrame, last_oFrame;

io.sockets.on('connection', function (socket) {

    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('frame', data => {
        /**
         * Get frames from client
         * 
         */
        if(data.from == USER.INSTRUCTOR) {
            current_iFrame = data.data
        } else if( data.from == USER.OPERATOR) {
            current_oFrame = data.data
        }
        if(current_oFrame && current_iFrame) {
            ProcessFrames(current_iFrame, current_oFrame).then(processedFrame=>{
                socket.emit("cvFrame", processedFrame)
            })
        }

    })

    socket.on('getRole', isInitiator => {
        if (isInitiator) {
            _clients[socket.id] = INSTRUCTOR;
            socket.emit('getRole', INSTRUCTOR);
        } else {
            _clients[socket.id] = OPERATOR;
            socket.emit('getRole', OPERATOR);
        }
    });

    socket.on('message', function (message) {
        log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
    });

    socket.on('bye', () => {
        io.close();
    })
    /** Request from client to join or create room 
     * 
    */
    socket.on('create or join', function (room) {
        log('Received request to create or join room ' + room);

        /** */
        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

        log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
            socket.join(room);
            log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, socket.id);

        } else if (numClients === 1) {
            log('Client ID ' + socket.id + ' joined room ' + room);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, socket.id);

            io.sockets.in(room).emit('ready');
        } else { // max two clients
            socket.emit('full', room);
        }
    });


});

