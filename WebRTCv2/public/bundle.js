(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

exports.MediaStream = window.MediaStream;
exports.RTCIceCandidate = window.RTCIceCandidate;
exports.RTCPeerConnection = window.RTCPeerConnection;
exports.RTCSessionDescription = window.RTCSessionDescription;

},{}],2:[function(require,module,exports){
const { RTCPeerConnection } = require('wrtc');


/**
 * @description 
 * 0: Setting up 
 *   New Peer connection to server
 *   
 *   Canvas object from DOM to draw video frame to image
 * 1: Wait for navigator.getUserMedia() to get both Video and Audio
 * 2: 
 * 
 */
async function main() {

     var canvas = document.getElementById('canvas');
     var img = document.getElementById('playFrame');
     var width = 120;
     var height = 80;

     var stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

     // Create peer connection with server
     console.log("Creating RTCPeerconnection");
     var pc = new RTCPeerConnection({
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
     });


     stream.getVideoTracks().forEach(track => {
          var video = document.getElementById('video');
          // var video = document.createElement('video');
          video.src = window.URL.createObjectURL(stream);
          video.play()
          setInterval(() => takePhoto(video), 100);
     });

     stream.getAudioTracks().forEach(track => {
          pc.addTrack(track, stream);
     })

     function takePhoto(video) {
          var context = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;
          context.drawImage(video, 0, 0, width, height);
          var jpgQuality = 0.6;
          var theDataURL = canvas.toDataURL('image/jpeg', jpgQuality);

          var frameObj = { type: 'frame', data: theDataURL }

          // console.log("DataURL", theDataURL);
          ws.send(JSON.stringify(frameObj));
     }
     
     function onmessage(msg) {
          var data = JSON.parse(msg.data);
          img.src = data.data;
     }
     
     function cleanup() {
          console.log("Stopping MediaStreamTracks");
          stream.getTracks().forEach(track => track.stop());
          console.log("Closing RTCPeerConnection");
          pc.close();
     }

     // Establish Connection
     try {
          // var ws = new WebSocket(WebSocket_URI);
          var ws = new WebSocket("ws://192.168.0.12:1337");
          await onOpen(ws);
          // Key Press Event
          // onKeypress(ws);
          ws.onclose = cleanup;
          ws.onmessage = onmessage;

          pc.onicecandidate = ({ candidate }) => {
               if (candidate) {
                    console.log("Sending ICE candidate to server");
                    ws.send(JSON.stringify({
                         type: 'candidate',
                         candidate
                    }));
               }
          }

          let queuedCandiates = [];
          onCandidate(ws, async candidate => {
               if (!pc.remoteDescription) {
                    queuedCandiates.push(candidate);
                    return;
               }
               console.log("Adding ICE candidate");
               await pc.addIceCandidate(candidate);
               console.log("Added ICE candidate");
          });

          document.getElementById('loader').style.display = 'none';
          var video = document.createElement('video');
          document.body.appendChild(video);

          pc.ontrack = ({ track, streams }) => {
               console.log("Recieved", track.kind, "MediaStreamTrack with", track.id);
               video.srcObject = streams[0]
               video.autoplay = true;
          }

          console.log("Creating offer");
          var offer = await pc.createOffer();

          console.log("Created offer; setting local description");
          await pc.setLocalDescription(offer);

          console.log("Set local description; sending offer to server");
          ws.send(JSON.stringify(offer));

          console.log("Waiting for answer");
          var answer = await getAnswer(ws);

          console.log("Recieved answer; setting remote description");
          await pc.setRemoteDescription(answer);

          await Promise.all(queuedCandiates.splice(0).map(async candidate => {
               console.log("Adding ICE candidate");
               await pc.addIceCandidate(candiate);
               console.log("Added ICE candidate");
          }));
     } catch (error) {
          document.getElementById('loader').innerHTML = error
          cleanup();
          throw error;
     }

};

// Functions
async function getAnswer(ws) {
     const answer = await getMessage(ws, 'answer');
     return new RTCSessionDescription(answer);
}
function onCandidate(ws, callback) {
     ws.addEventListener('message', ({ data }) => {
          try {
               const message = JSON.parse(data);
               if (message.type === 'candidate') {
                    const candidate = new RTCIceCandidate(message.candidate);
                    callback(candidate);
                    return;
               }
          } catch (error) {
               // Do nothing.
          }
     });
}
function getMessage(ws, type) {
     return new Promise((resolve, reject) => {
          function onMessage({ data }) {
               try {
                    const message = JSON.parse(data);
                    if (message.type === type) {
                         resolve(message);
                    }
               } catch (error) {
                    reject(error);
               } finally {
                    cleanup();
               }
          }

          function onClose() {
               reject(new Error('WebSocket closed'));
               cleanup();
          }

          function cleanup() {
               ws.removeEventListener('message', onMessage);
               ws.removeEventListener('close', onClose);
          }

          ws.addEventListener('message', onMessage);
          ws.addEventListener('close', onClose);
     });
}
function onOpen(ws) {
     return new Promise((resolve, reject) => {
          ws.onopen = () => resolve();
          ws.onclose = () => reject(new Error("WebSocket closed"));
     });
}
function onKeypress(ws) {
     document.onkeypress = e => {
          console.log("Key pressed", e.key);
          ws.send("keyPressed");
     }
}


main();
},{"wrtc":1}]},{},[2]);
