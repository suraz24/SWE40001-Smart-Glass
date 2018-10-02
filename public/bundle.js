(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
 /**
 * 
 * @summary On Start
 * Once got user media(audio, video). Try to establish connection with server and the other peer
 * 
 * Connection initiator becomes Instrutor automatically, the other peer becomes Operator
 * 
 * Audio from both peers are streamed to each other regardless of roles via p2p
 * Video from both peers are streamed to each other regardless of roles via p2p
 * 
 * Roles determines whether remote/local video to display
 * Operator displays local video stream(from self)
 * Instructor displays remote video stream(from operator)
 * Instructor's Frames are captured and processed
 * 
 * Processed frames are sent to both users by server
 *
 * 
 * @summary On switch roles
 * When any of the two users press buttons to switch roles, both users switch roles
 * 
 * Operator plays remote video stream 
 * Operator becomes Instructor^
 * Instructor^ start sending frames to server
 * 
 * Instructor plays local video stream
 * Instructor becomes Operator^
 * Instructor^ stop sendng frames
 * 
 * 
 * @summary On taking snapshot
 * 
 * 
 * 
 * 
 */

'use strict';

var room = 'foo';
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var isConnected = false;

var pc, remoteAudioStream, localAudioStream, remoteVideoStream, localVideoStream;
var socket = io.connect({ reconnection: false });

var width = 120;
var height = 68;

const ROLES = { INSTRUCTOR: "INSTRUCTOR", OPERATOR: "OPERATOR" };

const STATE = { STREAMING : "STREAMING", SKETCHING: "SKETCHING" };

var CURRENT_STATE = null;

var sendFrameInterval;
var my_role;

var remoteAudioPlayer = document.querySelector('#remoteAudio'); // Audio from remote peer
var localVideoPlayer = document.querySelector('#localVideo');
var bgVideoPlayer = document.querySelector('#bgVideo'); // Background video, usually from operator
var svg = document.querySelector('#sketch_svg'); // Background video, usually from operator
var polyline = document.querySelector('#sketch_polyline'); // Background video, usually from operator
var fgFrame = document.querySelector('#fgFrame'); // Foreground frame, usually from instructor
var canvas = document.querySelector('#canvas'); // Canvas for capturing/drawing local video
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

var lastFrame = null;


/** Set up Media from device */
navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
    // Audio stream from local device
    localAudioStream = stream;

    navigator.mediaDevices.getUserMedia({ audio: false, video: { width: width * 2, height: height * 2, frameRate: 10 } }).then(stream => {


        // // Video stream from local device
        localVideoStream = stream;

        // Set local video soource to local stream
        localVideoPlayer.src = window.URL.createObjectURL(localVideoStream);

        // Notify server, maybe initiate peer connection
        sendMessage('got user media');
        if (isInitiator) {
            maybeStart();
        }
    })
});

/**
 * Try to join room on server via socket
 */
if (room !== '') {
    socket.emit('create or join', room);
    console.log('CLIENT: Attempted to create or  join room', room);
}


/**
 * @description  This function is fired once connections between peers have been established 
 * AND once peers have started exchanging media streams
 * Set @var my_role, 
 * Set @var CURRENT_STATE = STATE.STREAMING
 * Set respective DOM object source to mediastream
 * @param {MediaStream} MediaStream event 
 */
function OnRemoteStream(event) {

    console.log('Remote stream recieved;', event);

    // Connection Established
    isConnected = true;

    // Initial role election
    my_role = isInitiator ? ROLES.INSTRUCTOR : ROLES.OPERATOR;

    CURRENT_STATE = STATE.STREAMING;

    document.querySelector('#role').innerHTML = my_role;

    if (event.track.kind == 'audio') {
        remoteAudioStream = event.streams[0];
        remoteAudioPlayer.srcObject = remoteAudioStream;
        console.log("go audio, playing now");
    }
    if (event.track.kind == 'video') {
        remoteVideoStream = event.streams[0];
        streamVideoAs(my_role);
    }
}

/**
 * @description  This function is called when the INSTRUCTOR client request to start sketching
 * Notify all clients to switch to STATE.SKETCHING mode, set @var CURRENT_STATE to STATE.SKETCHING
 */
function notifySketching() {
    if (my_role == ROLES.INSTRUCTOR) {
        socket.emit('notify_sketching');
    } else return;
}
/**
 * @description This function fires when a INSTRUCTOR notifies all clients 
 * to switch STATE.SKETCHING, inclusive.
 * Set @var CURRENT_STATE = STATE.SKETCHING
 * 
 * @OPERATOR: PAUSE and HIDE local video, wait for fg_frame from server
 * @INSTRUCTOR: PAUSE and HIDE remote video, continue playing localVideo(hidden) for sendFrame()
 */
socket.on('do_sketching', data => {
    if (data) {
        if (my_role == ROLES.INSTRUCTOR) {
            // bgVideoPlayer.style.display = "none";
            bgVideoPlayer.pause();
        } else if (my_role == ROLES.OPERATOR) {
            // localVideoPlayer.pause();
            bgVideoPlayer.pause();
            // localVideoPlayer.style.display = "none";
        }
        CURRENT_STATE = STATE.SKETCHING;
    }
})


/**
 * @description This function fires when INSTRUCTOR client request to switch to STATE.STREAMING
 * Since STATE.STREAMING is the app's initial state, this function can only be called when NOT in 
 * STATE.STREAMING state, in this case, can only be called when in STATE.SKETCHING. Only callable by INSTRUCTOR client
 * 
 * Notify all clients to switch back to STATE.STREAMING mode
 * 
 */
function notifyStreaming() {
    if (my_role == ROLES.INSTRUCTOR) {
        socket.emit('notify_streaming');
    } else return;
}
/**
 * @description This function fires when client is notified to switch to STATE.STREAMING
 * Set @var CURRENT_STATE = STATE.STREAMING
 * 
 * @OPERATOR: SHOW and PLAY local video, wait for fg_frame as usual
 * @INSTRUCTOR: SHOW and PLAY remote video, continue playing localVideo(hidden) for sendFrame()
 */
socket.on('do_streaming', data => {
    if (data) {
        if (my_role == ROLES.INSTRUCTOR) {
            // bgVideoPlayer.style.display = "block";
            bgVideoPlayer.play();
        } else if (my_role == ROLES.OPERATOR) {
            bgVideoPlayer.play();
            // bgVideoPlayer.style.display = "block";
        }
        CURRENT_STATE = STATE.STREAMING;
    }
})

/**
 * @description This function notifies all clients to change their role
 * This will only execute while the clients are in STATE.STREAMING
 */
function notifyChangeRole() {
    if (CURRENT_STATE == STATE.STREAMING) {
        socket.emit('notify_change_role');
    }
}
/**
 * @description This fires when a client request to change role
 * SET @var my_role swap between INSTRUCTOR && OPERATOR
 */
socket.on('do_change_role', data => {
    if (data) {
        document.querySelector('#role').innerHTML = my_role;
        my_role = my_role == ROLES.INSTRUCTOR ? ROLES.OPERATOR : ROLES.INSTRUCTOR;
        streamVideoAs(my_role);
    }
});


/**
 * @description Start Streaming video base on @var my_role
 * @INSTRUCTOR:
 *  Set REMOTE video stream(from OPERATOR) to bgVideoPlayer DOM source
 *  PLAY LOCAL video stream(from self, is hidden) to capture frames
 *  Bind and start sendFrame() interval to @var sendFrameInterval
 * @OPERATOR:
 *  PAUSE LOCAL video stream(from self, not hidden)
 *  SET @var sendFrameInterval=>clearInterval() if exists
 *  Bind LOCAL video stream(from self) to bgVideoPlayer DOM source
 *  PLAY LOCAL video stream
 * @param {ROLES} role 
 */
function streamVideoAs(role) {
    console.log("streaming as", role);
    if (role == ROLES.INSTRUCTOR) {
        bgVideoPlayer.src = window.URL.createObjectURL(remoteVideoStream);
        bgVideoPlayer.play();

        localVideoPlayer.play();

        sendFrameInterval = setInterval(() => sendFrame(localVideoPlayer), 150);
    }
    if (role == ROLES.OPERATOR) {
        localVideoPlayer.pause();
        if (sendFrameInterval) {
            clearInterval(sendFrameInterval);
        }
        bgVideoPlayer.src = window.URL.createObjectURL(localVideoStream);
        bgVideoPlayer.play();
    }
}

/**
 * @description Client communication functions
 */

/** @param {*} video Send video frames to server */
function sendFrame(video) {
    context.drawImage(video, 0, 0, width, height);
    socket.emit('fgFrame', canvas.toDataURL());
}

/**
 * @description send the role to the other peer if connected
 */
document.onkeypress = (e) => {
    console.log("Key presssed; Changing Role", e);
    // t (lower case) key
    if (e.charCode == 0) {// button press on glasses
        if(CURRENT_STATE == STATE.SKETCHING) {
            notifyStreaming();
        } 
        if(CURRENT_STATE == STATE.STREAMING){
            notifySketching();
        }
    }
	else if(e.charCode == 32) //space press - change roles
	{
		//Note: must be connected to a blue tooth keyboard to change roles
		notifyChangeRole();
	}
    else {
		alert("button pressed - "+e.charCode); 
    }
}


/**
 * @summary Server Listeners
 */
socket.on('fgFrame', data => {
    console.log("FGFRAME: ", data);
    if(CURRENT_STATE == STATE.SKETCHING && data !=null) {
        var point = svg.createSVGPoint();
        point.x = data[0];
        point.y = data[1];
        polyline.points.appendItem(point);
    } 
    fgFrame.src = data
});

socket.on('created', function (room) {
    console.log('CLIENT: Created room ' + room);
    isInitiator = true;
});

socket.on('full', function (room) {
    console.log('CLIENT: Room ' + room + ' is full');
});

socket.on('join', function (room) {
    console.log('CLIENT: Another peer made a request to join room ' + room);
    console.log('CLIENT: This peer is the initiator of room ' + room + '!');
    isChannelReady = true;
});

socket.on('joined', function (room) {
    console.log('CLIENT: joined: ' + room);
    isChannelReady = true;
});

socket.on('log', function (array) {
    console.log.apply(console, array);
});

socket.on('message', function (message) {
    console.log('CLIENT: Client received message:', message);
    if (message === 'got user media') {
        maybeStart();
    }
    else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
            maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
});


/** 
 * @description A list of functions for establishing peer connection 
 */

/**
 * @description send a message to server
 * @param {string} message 
 */
function sendMessage(message) {
    console.log('CLIENT: Client sending message: ', message);
    socket.emit('message', message);
}

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localAudioStream, isChannelReady);
    if (!isStarted && typeof localAudioStream !== 'undefined' && isChannelReady) {
        console.log('CLIENT: >>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localAudioStream);
        pc.addStream(localVideoStream);
        console.log("Added audio stream to peer");
        console.log("Added video stream to peer");
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
        }
    }
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = OnIceCandidate;
        pc.ontrack = OnRemoteStream

        console.log('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.' + e.message);
        return;
    }
}


function OnIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidates.');
    }
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
    );
}

function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}

function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}

function stop() {
    isStarted = false;
    pc.close();
    pc = null;
}

/**
 * @description call when user close the browser window
 */

window.onbeforeunload = function () {
    sendMessage('bye');
    isConnected = false;
    socket.close();
};
},{}]},{},[1]);
