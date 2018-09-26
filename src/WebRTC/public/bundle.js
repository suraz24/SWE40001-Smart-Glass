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
var isStarted = false
var isConnected = false;

var pc, remoteAudioStream, localAudioStream, remoteVideoStream, localVideoStream;
var socket = io.connect({ reconnection: false });

var width = 120;
var height = 68;

const ROLES = ["INSTRUCTOR", "OPERATOR"];
var sendFrameInterval;
var my_role;

var remoteAudioPlayer = document.querySelector('#remoteAudio'); // Audio from remote peer
var localVideoPlayer = document.querySelector('#localVideo');
var bgVideoPlayer = document.querySelector('#bgVideo'); // Background video, usually from operator
var fgFrame = document.querySelector('#fgFrame'); // Foreground frame, usually from instructor
var canvas = document.querySelector('#canvas'); // Canvas for capturing/drawing local video
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');


/** Set up Media from device */
navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
    // Audio stream from local device
    localAudioStream = stream;
    
    navigator.mediaDevices.getUserMedia({ audio: false, video: {width: width * 2, height: height * 2} }).then(stream => {
    
        
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

/** */
if (room !== '') {
    socket.emit('create or join', room);
    console.log('CLIENT: Attempted to create or  join room', room);
}

/**
 * @description Client communication functions
 */
/** @param {*} video Send video frames to server */
function sendFrame(video) {

    context.drawImage(video, 0, 0, width, height);

    socket.emit('s_fgFrame', canvas.toDataURL());
 
}

/**
 * @description send a message to server
 * @param {string} message 
 */
function sendMessage(message) {
    console.log('CLIENT: Client sending message: ', message);
    socket.emit('message', message);
}

/**
 * @description send the role to the other peer if connected
 */
document.onkeypress = (e) => {
    console.log("Key presssed; Changing Role", e);
    
	if(e.charCode== 46) // . (period) key
	{
		if(e.ctrlKey == false)
		{
		//alert("ArrowUp - req_increase_thresh");
		socket.emit('req_increase_thresh_skin_color_upper');
		}
		else
		{
		socket.emit('req_increase_thresh_grab_cut_upper');
		}
	}
	else if(e.charCode == 62) // > key
	{
		if(e.ctrlKey == false)
		{
		socket.emit('req_increase_thresh_skin_color_lower');
		}
		else 
		{
		socket.emit('req_increase_thresh_grab_cut_lower');
		}
	}
	else if(e.charCode == 44) // , (comma) key
	{
		//alert("ArrowDown - req_decrease_thresh");
		if(e.ctrlKey == false)
		{
		socket.emit('req_decrease_thresh_skin_color_upper');
		}
		else 
		{
		socket.emit('req_decrease_thresh_grab_cut_upper');
		}
		
	}
	else if(e.charCode == 60) // < key
	{
		if(e.ctrlKey == false)
		{
		socket.emit('req_decrease_thresh_skin_color_lower');
		}
		else
		{
		socket.emit('req_decrease_thresh_grab_cut_lower');
		}
	}
	else if(e.charCode == 115)// s (lower case) key
	{
		//streaming state
		socket.emit('req_streaming_state');
	}
	else if(e.charCode == 116)// t (lower case) key
	{
		//trace state
		socket.emit('req_trace_state');
	}
	else 
	{
		socket.emit('req_change_role');
	}
}


document.onclick = (e) => {
	console.log("mouse clicked!", e);
}

function doChangeRole() {
    my_role = my_role == ROLES[0] ? ROLES[1] : ROLES[0];
    document.querySelector('#role').innerHTML = my_role;

    streamVideoAs(my_role);
}

///  A list of functions to handle socket events emitted by server

/**
 * On Recieving processed frames from server
 */

socket.on('c_fgFrame', data => {
    fgFrame.src = data
});
socket.on('do_change_role', (t)=>{
    if(t) {
        doChangeRole();
    }
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

function streamVideoAs(role) {
    print("streaming as", role);
    // If my role is instructor
    if (role == ROLES[0]) {
        /**
         * Set bgVideo to remote video
         * Send frames to server
         */
        bgVideoPlayer.src = window.URL.createObjectURL(remoteVideoStream);
        bgVideoPlayer.play();

        localVideoPlayer.play();

        
        sendFrameInterval = setInterval(() => sendFrame(localVideoPlayer), 150);
    }

    // If my role is operator
    if (role == ROLES[1]) {
        /**
         * Stop local video player (local frame capture)
         * Stop sending frames if any
         * Set bgVideo to local video
         */
        localVideoPlayer.pause();

        if(sendFrameInterval) {
            clearInterval(sendFrameInterval);
        }

        bgVideoPlayer.src = window.URL.createObjectURL(localVideoStream);
        bgVideoPlayer.play();
    }
}

function OnRemoteStream(event) {

    console.log('Remote stream recieved;', event);

    // Connection Established
    isConnected = true;

    // Initial role election
    my_role = isInitiator ? ROLES[0] : ROLES[1];
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
