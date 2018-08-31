const { RTCPeerConnection, RTCSessionDescription } = require('wrtc');
var express = require('express');
var { createServer } = require('http');
var { Server } = require('ws');

// App Setup
var app = express()
     .use(express.static('public'))
     
var server = createServer(app);

server.listen(1337, () => {
     console.log("Server running at", server.address().port);
});


// Connetion Configurations
var _connectionID = 0;
var users = []


var pc_1 = new RTCPeerConnection({
     buldlePolicy: 'max-bundle',
     rtcpMuxPolicy: 'require'
});
var pc_2 = new RTCPeerConnection({
     buldlePolicy: 'max-bundle',
     rtcpMuxPolicy: 'require'
});

var frameFrom_1 = null;
/**
 * Create a new peer connection on request of new client
 * Attempt to establish RTCPeerConnection with client
 */
new Server({ server }).on('connection', async ws => {
     // Increase # of connection
     var n = _connectionID;
     _connectionID += 1 ;

     n == 0 ? users[0] = "Instructor" : users[n] = "Operator"

     console.log(n, ": Creating new RTCPeerConnection");

     // New Peer Setting
     // var pc = new RTCPeerConnection({
     //      buldlePolicy: 'max-bundle',
     //      rtcpMuxPolicy: 'require'
     // });

     var pc = n == 0 ? pc_1 : pc_2;

     // ICE request
     pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
               console.log(n, ": Sending ICE candidate");
               ws.send(JSON.stringify({
                    type: 'candidate', candidate
               }));
          }
     }

     /** Entry Point for opencv */
     // Recieving media stream from peer
     pc.ontrack = ({ track, streams }) => {
          console.log("Stream type", streams);
          console.log(n, ": Recieved", track.kind, "MediaStreamTrack with ID", track.id);
          // Stream back to peer
          // Do opencv
          // pc.addTrack(track, ...streams);
     };


     let queuedCandidates = [];
     onCandidate(ws, async candidate => {
          if (!pc.remoteDescription) {
               queuedCandidates.push(candidate);
               return;
          }
          console.log(n, ": Adding ICE Candidate");
          await pc.addIceCandidate(candidate);
          console.log(n, ": Added ICE Candidate");
     })

     ws.once('close', () => {
          console.log(n, ": Closing RTCPeerConnection");
          pc.close();
     });

     // Handle events between server and client
     ws.onmessage = data => {
          var frame = JSON.parse(data.data).data
          frameFrom_1 = frame
          var frameObjReturn = {
               type: 'frame',
               data: frameFrom_1
          }
          ws.send(JSON.stringify(frameObjReturn));
     }


     // Establish connection with client
     try {
          console.log(n, ": Waiting for offer");
          var offer = await getOffer(ws);

          console.log(n, ": Recieved offer; Setting remote description");
          await pc.setRemoteDescription(offer);

          console.log(n, ": Set remote description success; creating answer");
          var answer = await pc.createAnswer();

          console.log(n, ": Created answer; setting local description");
          await pc.setLocalDescription(answer);

          console.log(n, ": Set local description; sending answer");
          ws.send(JSON.stringify(answer));

          await Promise.all(queuedCandidates.splice(0).map(async candidate => {
               console.log(n, ": Adding ICE candidate");
               await pc.addIceCandidate(candidate);
               console.log(n, ": Added ICE candidate");
          }));
     } catch (error) {
          console.log("Error occured");
          console.error(error);
          ws.close();
     }
});


// Websocket Functions
async function getOffer(ws) {
     const offer = await getMessage(ws, 'offer');
     return new RTCSessionDescription(offer);
}

function onCandidate(ws, callback) {
     ws.addEventListener('message', ({ data }) => {
          try {
               const message = JSON.parse(data);
               if (message.type === 'candidate') {
                    const candidate = new RTCIceCandidate(message.candidate);
                    callback(candidate);
                    return
               }
          } catch (error) { }
     })
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



