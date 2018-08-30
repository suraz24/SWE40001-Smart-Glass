const { RTCPeerConnection } = require('wrtc');

async function main() {

     // Get stream from device
     var stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {width: 120, height: 80 }
          // video: true
     });

     // Create peer connection with server
     console.log("Creating RTCPeerconnection");
     var pc = new RTCPeerConnection({
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
     });

     // Stream in/out
     stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
     });

     var cleanup = () => {
          console.log("Stopping MediaStreamTracks");
          stream.getTracks().forEach(track => track.stop());
          console.log("Closing RTCPeerConnection");
          pc.close();
     }


     // Establish Connection
     try {
          // var ws = new WebSocket(WebSocket_URI);
          var ws = new WebSocket("ws://192.168.43.104:5050");
          await onOpen(ws);
          // Key Press Event
          onKeypress(ws);
          ws.onclose = cleanup;

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
     document.onkeypress = e =>{ 
          console.log("Key pressed", e.key);
          ws.send("keyPressed");
     }
}


main();