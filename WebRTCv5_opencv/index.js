'use strict';

const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000
var socketIO = require('socket.io');

var { ProcessFrames, ProcessHands } = require('./gesture');

var app = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    // .get('/admin', (req, res) => res.render('pages/admin'))
    .listen(PORT, () => { console.log(`Listening on ${PORT}`) })

var io = socketIO.listen(app);

const USER = { INSTRUCTOR: "INSTRUCTOR", OPERATOR: "OPERATOR" }

var isProcessing = false
var iFrame_isCaptured = false;


var n = 0, k = 0;

io.sockets.on('connection', function (socket) {

    console.log("conn");
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }


    /**
     * @description Receiving Frames from clients, process according to frame origin/client type
     * */
    socket.on('frame', data => {

        n++;
        console.log("Frames Recieved:::", n);

        /***********************************************
         *  Insturctor's frame
         *********************************************** */
        if (data.from == USER.INSTRUCTOR) {
            /** Process instructor's frames */
            if (iFrame_isCaptured && isProcessing) return;

            k++;
            console.log("Frames Captured:::", k);

            /** Capture Frame, stop further capture until processing is done */
            var iFrame = data.data
            iFrame_isCaptured = true

            if (iFrame !== undefined) {
                /**
                 * Process Frame, emit to all clients
                 */
                var processedFrame = ProcessHands(iFrame);
                io.sockets.emit('cvFrame', { type:'fgFrame', data: processedFrame });

                /**
                 * Reset Conditions
                 */
                iFrame_isCaptured = false;
                isProcessing = false;
            }
        }
        /***********************************************
         *  Operator's frame
         *********************************************** */
        else if (data.from == USER.OPERATOR) {
            /** 
             * No need to process operator's frames, relay frame back to all clients
             */
            io.sockets.emit('cvFrame', { type:'bgFrame', data: data.data });
        }
    })

    // socket.on('getRole', isInitiator => {
    //     if (isInitiator) {
    //         _clients[socket.id] = INSTRUCTOR;
    //         socket.emit('getRole', INSTRUCTOR);
    //     } else {
    //         _clients[socket.id] = OPERATOR;
    //         socket.emit('getRole', OPERATOR);
    //     }
    // });

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

