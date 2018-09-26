//const cv = require('../../node_modules/opencv4nodejs');
const cv = require('opencv4nodejs');
const Enum = require('enum');
const state = new Enum(['STREAM','TRACE','CALIBRATE']);
exports.state = state;
exports.cv = cv;
exports.Mat = Mat;

exports.grabFrames = (videoFile, delay, onFrame) => {
  const cap = new cv.VideoCapture(videoFile);
  let done = false;
  const intvl = setInterval(() => {
    let frame = cap.read();
    // loop back to start on end of stream reached
    if (frame.empty) {
      cap.reset();
      frame = cap.read();
    }
    onFrame(frame);

    const key = cv.waitKey(delay);
    done = key !== -1 && key !== 255;
    if (done) {
      clearInterval(intvl);
      console.log('Key pressed, exiting.');
    }
  }, 0);
};