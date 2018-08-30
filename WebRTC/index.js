'use strict';

const express = require('express');
var socketIO = require('socket.io');
const path = require('path');
var nodeStatic = require('node-static');
const PORT = process.env.PORT || 5000
var qrcode = require('qrcode-terminal');
var os = require('os');
var ifaces = os.networkInterfaces();

var userDB = { instructor: null, operator: null }



const INSTRUCTOR_ROOM = 'INSTRUCTOR_ROOM';
const OPERATOR_ROOM = 'OPERATOR_ROOM';

var app = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .listen(PORT, () => {
        printMyQR()
        console.log(`Listening on ${PORT}`)
    })

var io = socketIO.listen(app);


io.sockets.on('connection', function (socket) {

    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function (message) {
        log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
    });

    /** Request from client to join or create room 
     * 
    */
    socket.on('create or join', function (room) {
        log('Received request to create or join room ' + room);

        /** */
        var clientsInInsturctorRoom = io.sockets.adapter.rooms[INSTRUCTOR_ROOM];
        var numClients_InstructorRoom = clientsInInsturctorRoom ? Object.keys(clientsInInsturctorRoom).length : 0;
        if(numClients_InstructorRoom === 0 ) {
            socket.join(INSTRUCTOR_ROOM);
            io_instructor.join(INSTRUCTOR_ROOM);
            socket.emit('created', INSTRUCTOR_ROOM, socket.id)
            console.log("INSTRUCTOR_ROOM", clientsInInsturctorRoom);
        }
        /** */
        // var clientsInRoom = io.sockets.adapter.rooms[room];
        // var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

        // log('Room ' + room + ' now has ' + numClients + ' client(s)');

        // if (numClients === 0) {
        //     socket.join(room);
        //     log('Client ID ' + socket.id + ' created room ' + room);
        //     socket.emit('created', room, socket.id);
        //     userDB.instructor = socket.id /** J: First to join becomes instructor */
        // } else if (numClients === 1) {
        //     log('Client ID ' + socket.id + ' joined room ' + room);
        //     io.sockets.in(room).emit('join', room);
        //     socket.join(room);
        //     socket.emit('joined', room, socket.id);
        //     userDB.operator = socket.id /** J: Second to join becomes operator */
        //     io.sockets.in(room).emit('ready');
        // } else { // max two clients
        //     socket.emit('full', room);
        // }
    });

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });
});

function printMyQR() {
    // require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    //     qrcode.generate('http://' + add + ':5000')
    //     console.log('\nServer IP is ' + add + ':5000')
    //     // console.log('addr: ' + add);
    // })

    var ip

    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                if (ifname == 'wlan0' || ifname == 'en0') {
                    ip = iface.address
                }
            }
            ++alias;
        });
    });



    qrcode.generate('http://' + ip + ':5000')
    console.log('\nServer IP is ' + ip + ':5000')
}

