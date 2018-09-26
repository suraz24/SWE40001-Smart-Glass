var {cv,Mat} = require('./utils');
var trace = require('./FrameTrace');
//var GPU = require('gpu.js');
var n = 0;



module.exports = {

     /**
      * @deprecated, use @function ProcessHands(iFrame)
      */
     ProcessFrames: function (iFrame, oFrame) {

          console.log("Processing Begin; Time:", getTime())

          iFrame = base64toMat(iFrame);
          console.log("iFrame converted; Time:", getTime());

          oFrame = base64toMat(oFrame);
          console.log("oFrame converted; Time:", getTime());

          // Process Image Matrix 
          var processedMat = grabCut(iFrame, oFrame);
          console.log("Grabcut done; Time:", getTime());

          var outBase64 = "data:image/jpeg;base64," + cv.imencode('.jpeg', processedMat).toString('base64');

          console.log("Processing End; Frame #", n);
          console.log("\n")

          n++;

          return outBase64;

     },

     ProcessHands: function (iFrame) {

          console.log("Processing Begin; Time:", getTime());
          iFrame = base64toMat(iFrame);

          var processedMat = grabHand(iFrame);
		  //Note: need to change Snapshot parameter to operator background for trace.FrameTrace(frame,Snapshot)
		  //var traceMat = trace.FrameTrace(processedMat,processedMat); 
          console.log("Grabhand done; Time:", getTime());

          var outBase64 = "data:image/png;base64," + cv.imencode('.png',processedMat).toString('base64');

          console.log("Processing End; Frame #", n, "\n");

          n++;
          return outBase64;

     },
	CalibrateColorThreshold: function(_skinColorLower,_skinColorUpper) {
		console.log("CalibrateColorThreshold gesture - lower value:", _skinColorLower, ", upper value:", _skinColorUpper);
		skinColorLower(_skinColorLower);
		skinColorUpper(_skinColorUpper);
	},
	CalibrateThresholdGrabCutMinMax: function(_min,_max){
		console.log("ClaibrateThresholdGrabCutMinMax - lower value: ", _min, ", upper value: ", _max);
		thresholdValLower = _min;
		thresholdValUpper = _max;
	}
	 
}

// segmenting by skin color (has to be adjusted)
const skinColorUpper = hue => new cv.Vec(hue, 0.8 * 255, 0.6 * 255);
const skinColorLower = hue => new cv.Vec(hue, 0.1 * 255, 0.05 * 255);
const transparentPixel = new cv.Vec4(0, 0, 0, 0);
var skinColorUpperSetting = skinColorUpper(12);
var skinColorLowerSetting = skinColorLower(0);

var thresholdValUpper = 500;
var thresholdValLower = 100;



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

/**
 * Extract hands from handFrame and combine with background frame
 * 
 * @param {Mat handFrame}
 * @param {Mat backgroundFrame} 
 * @returns a Mat, combined with hands from handFrame and backgroundFrame
 */
function grabCut(handFrame, backgroundFrame) {

     let src = handFrame;
     let background = backgroundFrame;
     src = src.cvtColor(cv.COLOR_RGBA2RGB);
     background = background.cvtColor(cv.COLOR_RGBA2RGB);
     let ksrc = src;
     const handMask = makeHandMask(src);
     // draw foreground
     for (let i = 0; i < src.rows; i++) {
          for (let j = 0; j < src.cols; j++) {
               if (handMask.at(i, j) == 0) {
                    let pixel = new cv.Vec(background.at(i, j).at(0), background.at(i, j).at(1), background.at(i, j).at(2));
                    ksrc.set(i, j, pixel);
               }
          }
     }
     return ksrc
}

function makeHandMask(img) {
     // filter by skin color
     const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
     const rangeMask = imgHLS.inRange(skinColorLowerSetting, skinColorUpperSetting);

     // remove noise
     const blurred = rangeMask.blur(new cv.Size(10, 10));
     //const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);
     const thresholded = blurred.threshold(thresholdValLower,thresholdValUpper, cv.THRESH_BINARY);

     return thresholded;
};

function getTime() {
     return new Date().getTime().toString();
}


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
