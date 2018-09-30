var { cv, Mat } = require('./utils');



// segmenting by skin color (has to be adjusted)
// var colorUpperThreshold = new cv.Vec(0.0, 0.8 * 255, 0.6 * 255);
var lH = 0;
var lS = 0.1;
var lV = 0.05;
var uH = 12;
var uS = 0.8;
var uV = 0.6;


const transparentPixel = cv.Vec4(0, 0, 0, 0);

module.exports = {

     Set_HSV(hsv) {
          console.log("Setting HSV", hsv);
          lH = hsv[0] * 0.6;
          lS = hsv[1] * 0.6;
          lV = hsv[2] * 0.6;
          uH = hsv[0] * 1.3;
          uS = hsv[1] * 1.3;
          uV = hsv[2] * 1.3;
     },

     ProcessHands: function (iFrame) {

          iFrame = base64toMat(iFrame);

          var processedMat = grabHand(iFrame);

          var outBase64 = "data:image/png;base64," + cv.imencode('.png', processedMat).toString('base64');

          return outBase64;

     },

}

/**
 * Extract hands from frame using mask
 * @param {Mat handFrame} handFrame 
 * @returns a Mat of original frame with inverted with hand mask
 */
function grabHand(handFrame) {
     let src = handFrame;
     src = src.cvtColor(cv.COLOR_RGB2RGBA);
     const handMask = makeHandMask(src);

     for (let i = 0; i < handMask.rows; i++) {
          for (let j = 0; j < handMask.cols; j++) {
               if (handMask.at(i, j) == 0) {
                    src.set(i, j, transparentPixel);
               }
          }
     }
     return src;
}


function makeHandMask(img) {

     // filter by skin color
     const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);

     const rangeMask = imgHLS.inRange(new cv.Vec(lH, lS * 255, lV * 255), new cv.Vec(uH, uS * 255, uV * 255));

     // remove noise
     const blurred = rangeMask.blur(new cv.Size(10, 10));
     const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);

     return thresholded;

};


/**
 * Split base64 string, convert to Mat
 * 
 * @param {string} base64 string
 * @returns {Mat} a Mat
 */
function base64toMat(base64) {
     var split = base64.split(',')[1]
     return cv.imdecode(Buffer.from(split, 'base64'));
}