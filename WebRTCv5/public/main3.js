'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var pc;
var remoteStream;
var remoteAudioStream;
var turnReady;


var localAudioStream;
var localAudioTrack;
var localVideoTrack;

var isConnected = false;

var room = 'foo';

var socket = io.connect();



var remoteAudioPlayer = document.querySelector('#remoteAudio');
var remoteVideoPlayer = document.querySelector('#remoteVideo');
var localAudioPlayer = document.querySelector('#localAudio');
var localVideoPlayer = document.querySelector('#localVideo');
var canvas = document.querySelector('#canvas');

var width = 150;
var height = 84;

var ROLE;

navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {

    localAudioStream = stream

    navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then(stream => {

        localVideoPlayer.src = window.URL.createObjectURL(stream)
        localVideoPlayer.style.display = 'none';
        localVideoPlayer.play();

        setInterval(() => sendFrame(localVideoPlayer), 10);
        

        sendMessage('got user media');
        if (isInitiator) {
            maybeStart();
        }
    })
});

if (room !== '') {
    socket.emit('create or join', room);
    console.log('CLIENT: Attempted to create or  join room', room);
}

function sendFrame(video) {
    if(isConnected) {
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        var jpgQuality = 0.6;
        var theDataURL = canvas.toDataURL('image/jpeg', jpgQuality);
    
        var frameObj = { type: 'frame', data: theDataURL }
    
        socket.emit('frame', frameObj)
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream recieved;', event);
    remoteAudioStream = event.streams[0];
    remoteAudioPlayer.srcObject = remoteAudioStream;
    isConnected = true;
    console.log('Remote stream added.');
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.ontrack = handleRemoteStreamAdded;
        // pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.' + e.message);
        return;
    }
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
        doElection(isInitiator);
    }
}

function doElection(isInitiator) {
    socket.emit('getRole', isInitiator);
}

socket.on('getRole', data=>{
    console.log("I am", data);
    ROLE = data
    document.getElementById('role').innerHTML = ROLE;
})

socket.on('cvFrame', data=>{
    if(data.target == ROLE) {
        console.log(data);
    }
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

function sendMessage(message) {
    console.log('CLIENT: Client sending message: ', message);
    socket.emit('message', message);
}

// This client receives a message
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




window.onbeforeunload = function () {
    sendMessage('bye');
    socket.close();
};




function handleIceCandidate(event) {
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
