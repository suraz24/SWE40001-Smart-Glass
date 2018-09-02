'use strict';

const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000
var nodeStatic = require('node-static');
var socketIO = require('socket.io');
var qrcode = require('qrcode-terminal');
var os = require('os');
var ifaces = os.networkInterfaces();


var app = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => { console.log(`Listening on ${PORT}`) })

var io = socketIO.listen(app);

var _clients = {};

const INSTRUCTOR = "INSTRUCTOR"
const OPERATOR = "OPERATOR"

io.sockets.on('connection', function (socket) {

    _clients[INSTRUCTOR]  = _clients[INSTRUCTOR] == null ? socket.id : _clients[INSTRUCTOR];
    _clients[OPERATOR]  = _clients[OPERATOR] == null ? socket.id : _clients[OPERATOR];


    console.log("connected", socket.id, _clients);
    
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('frame', data => {
        if( socket.id == _clients[INSTRUCTOR]) {
            console.log("Sending frame to OPERATOR");
            socket.emit('cvFrame', {data: data.data, target: OPERATOR});
        }
        if( socket.id == _clients[OPERATOR]) {
            console.log("Sending frame to INSTRUCTOR");
            socket.emit('cvFrame', {data: data.data, target: INSTRUCTOR});
        } 
    })

    socket.on('getRole', isInitiator=>{
        if(isInitiator) {
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

    socket.on('bye', ()=>{
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

