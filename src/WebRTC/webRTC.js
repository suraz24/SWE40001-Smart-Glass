'use strict';

const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 5000
var socketIO = require('socket.io');

//var { ProcessHands } = require('../object tracking/gesture');
var {ProcessFrame,
		state,
		CalibrateColorRange,
		CalibrateGrabCutThreshold,
		//skinColorUpperHSV,
		//skinColorLowerHSV,
		setHSVPercent} = require('../object tracking/GestureFacade');

var app = express()
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .get('/admin', (req, res) => res.render('pages/admin'))
    .listen(PORT, () => { console.log(`Listening on ${PORT}`) })

var io = socketIO.listen(app);

const USER = { INSTRUCTOR: "INSTRUCTOR", OPERATOR: "OPERATOR" }

var isProcessing = false
var iFrame_isCaptured = false;
var latest_snapshot = null;


var fg_count = 0, fg_processed_count = 0;

//Thresholding settings
var skinColorLower = 0;
var skinColorUpper = 12;
var grabCutThreshLower = 100;
var grabCutThreshUpper = 500;
//colour hsv setting 
var hRaw = 200/255;
var hHigh = hRaw*1.2;
var hLow  = hRaw*0.8;

var sRaw = (0.8*255)/255;
var sHigh = sRaw*1.2;
var sLow = sRaw*0.8;

var vRaw = (0.6*255)/255;
var vHigh = vRaw*1.2;
var vLow = vRaw*0.8;


//State settings
const STATE = {STREAM: 'STREAM',TRACE: 'TRACE'}
var currentState = STATE.STREAM;

io.sockets.on('connection', function (socket) {

    console.log("conn");
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    /**
     * Recieved fgFrame, from instructor
     * Capture frame to @param iFrame, stop capturing while processing
     */
    socket.on('s_fgFrame', data => {

        fg_count++;
        console.log("fgFrame recieved:", fg_count);

        /*** Stop capturing if in progress */
        if (isProcessing) return;

        isProcessing = true;
        /*** Capture Frame, stop further capture until processing is done */
        // var iFrame = data
        // iFrame_isCaptured = true

        /*** Process Frame */
        // var processedFrame = ProcessHands(data);

        fg_processed_count++;
        console.log("fgFrame processed:", fg_processed_count, "\n");
		
	
		

        /** Capture the latest snapshot */
        latest_snapshot = data;

        /*** Emit processed frame to all clients */
        // io.sockets.emit('c_fgFrame', processedFrame);
        //io.sockets.emit('c_fgFrame', ProcessHands(data));
		
		//CalibrateColorRange(skinColorLowerHSV(hLow*360,sLow*255,vLow*255),skinColorUpperHSV(hHigh*360,sHigh*255,vHigh*255));
		//CalibrateGrabCutThreshold(grabCutThreshLower,grabCutThreshUpper);
		setHSVPercent(hRaw,sRaw,vRaw);
		io.sockets.emit('c_fgFrame', ProcessFrame(data,latest_snapshot,currentState));
        // io.sockets.emit('c_fgFrame', data);

        /*** Reset Conditions */
        // iFrame_isCaptured = false;
        isProcessing = false;

    });

    /**
     * 
     */
    socket.on('req_change_role', () => {
        io.sockets.emit('do_change_role', true);
    })
	
	/***********************************************
       *  Threshold settings
       *********************************************** */

	socket.on('req_increase_thresh_skin_color_upper', () =>{ 
	//increase color threshold range value
		if(skinColorUpper <= 200)
		{
			skinColorUpper += 1;
		}
		console.log("req_increase_thresh_skin_color_upper - ", skinColorLower,", skinColorUpper - ", skinColorUpper);
	})
	socket.on('req_increase_thresh_skin_color_lower', () =>{ 
	//increase color threshold range value
		if(skinColorLower <= 200)
		{
			skinColorLower += 1;
		}
		console.log("req_increase_thresh_skin_color_lower - ", skinColorLower,", skinColorUpper - ", skinColorUpper);
	})
	socket.on('req_decrease_thresh_skin_color_upper', () =>{
	//decrease color threshold range value
		if(skinColorUpper > 0)
		{
			skinColorUpper -= 1;
		}
		console.log("'req_decrease_thresh_skin_color_upper - ", skinColorLower,", skinColorUpper - ", skinColorUpper);
	})
	
	
	socket.on('req_decrease_thresh_skin_color_lower', () =>{
	//decrease color threshold range value
		if(skinColorLower > 0)
		{
			skinColorLower -= 1;
		}
		console.log("req_decrease_thresh_skin_color_lower - ", skinColorLower,", skinColorUpper - ", skinColorUpper);
	})
		/***********************************************
       *  color selector settings
       *********************************************** */
	socket.on('admin_calibrate_hsv',data =>{
		hRaw = data[0];
		sRaw = data[1];
		vRaw = data[2];
		console.log("admin_calibrate_hsv: hRaw - ",data[0], ",sRaw - ",data[1],",vRaw - ",data[2]);
	})
	
	/***********************************************
       *  state settings
       *********************************************** */
	socket.on('req_streaming_state',() =>{
		console.log("STATE: STREAMING STATE!!");
		currentState = STATE.STREAM;
	})
	
	
	socket.on('req_trace_state',() =>{
		console.log("STATE: TRACE STATE!!");
		currentState = STATE.TRACE;
	})
	
	
	//*******************************

    socket.on('admin_get_snapshot', () => {
        if (latest_snapshot !== null) {
            io.sockets.emit('admin_snapshot', latest_snapshot);
        } else {
            io.sockets.emit('admin_snapshot', false);
        }
    })
	
	


    /**
     * @deprecated 'frame' event deprecated, use 'bgFrame' and 'fgFrame' instead;
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
                io.sockets.emit('cvFrame', { type: 'fgFrame', data: processedFrame });

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
            io.sockets.emit('cvFrame', { type: 'bgFrame', data: data.data });
        }
    })


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



