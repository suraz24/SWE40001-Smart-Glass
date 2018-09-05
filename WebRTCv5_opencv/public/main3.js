'use strict';

var isChannelReady, isInitiator, isStarted, isConnected = false;
var pc, remoteStream, remoteAudioStream;


var localAudioStream;


var room = 'foo';

var socket = io.connect({ reconnection: false });


var remoteAudioPlayer = document.querySelector('#remoteAudio');
var remoteVideoPlayer = document.querySelector('#remoteVideo');
var localAudioPlayer = document.querySelector('#localAudio');
var localVideoPlayer = document.querySelector('#localVideo');
var canvas = document.querySelector('#canvas');
var cvFrame = document.querySelector('#cvFrame');

var width = 120;
var height = 90;

var my_role;
var ROLES = { INSTRUCTOR: "INSTRUCTOR", OPERATOR: "OPERATOR" }

var dataChannel;

/** Set up Media from device */
navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {

    localAudioStream = stream

    navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then(stream => {

        localVideoPlayer.src = window.URL.createObjectURL(stream)
        localVideoPlayer.style.display = 'none';
        localVideoPlayer.play();

        // Send Frames to server
        setInterval(() => sendFrame(localVideoPlayer), 250);

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
    if (isConnected && my_role) {
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        var jpgQuality = 0.6;
        var theDataURL = canvas.toDataURL('image/jpeg', jpgQuality);

        var frameObj = {
            type: 'frame',
            from: my_role,
            data: theDataURL
        }

        socket.emit('frame', frameObj)
    }
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
    console.log("Key presssed; Changing Role");
    EmitChangeRole();
}
function DoChangeRole() {
    my_role = my_role == ROLES.INSTRUCTOR ? ROLES.OPERATOR : ROLES.INSTRUCTOR;
    document.querySelector('#role').innerHTML = my_role;
    console.log("my role is now", my_role);
}
function EmitChangeRole() {
    DoChangeRole();
    DataChannelSend(JSON.stringify({ type: 'roleChange' }))
}

/**
 * @description Datachannel Functions for handeling data from data channel
 * @param {*} message 
 */
function OnDataChannel(dc) {
    /**
     * Upon establishing datachannel, set global data channel to this channel
     */
    var channel = dc.channel;
    console.log("Recieved data channel; Monitoring open events");
    channel.onopen = (e) => {
        console.log("Channel Opened; Sending initial role offer")

        my_role = isInitiator ? ROLES.INSTRUCTOR : ROLES.OPERATOR;

        DataChannelSend(JSON.stringify({ type: 'initialRoleOffer', value: my_role }))
        console.log("Initial role offer sent");
    }
    channel.onmessage = OnDataChannelMessage
}
function DataChannelSend(message) {
    dataChannel.send(message);
}
function OnDataChannelMessage(message) {
    var message = JSON.parse(message.data);
    if (message.type == 'roleChange') { DoChangeRole(); }
}


/** 
 * @description A list of functions to handle socket events emitted by server
 */

socket.on('cvFrame', data => {
    console.log("cvFrame");
    cvFrame.src = data.data
})

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

function OnRemoteStream(event) {
    console.log('Remote stream recieved;', event);
    remoteAudioStream = event.streams[0];
    remoteAudioPlayer.srcObject = remoteAudioStream;
    isConnected = true;
    console.log('Remote stream added.');
}

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localAudioStream, isChannelReady);
    if (!isStarted && typeof localAudioStream !== 'undefined' && isChannelReady) {
        console.log('CLIENT: >>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localAudioStream);
        console.log("Added audio stream to peer");
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
        dataChannel = pc.createDataChannel('roles');
        pc.ondatachannel = OnDataChannel


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
    socket.close();
};

