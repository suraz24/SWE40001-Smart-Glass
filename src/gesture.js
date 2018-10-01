var { cv, Mat } = require('./utils');



// segmenting by skin color (has to be adjusted)
// var colorUpperThreshold = new cv.Vec(0.0, 0.8 * 255, 0.6 * 255);
var lH = 0;
var lS = 0.1;
var lV = 0.05;
var uH = 12;
var uS = 0.8;
var uV = 0.6;
var variance = 0.3;


const transparentPixel = cv.Vec4(0, 0, 0, 0);

module.exports = {

     Set_HSV_Gesture(hsv) {
          console.log("Setting HSV of Gestures", hsv);
		  calibrateHSV(hsv);
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
     const rangeMask = imgHLS.inRange(new cv.Vec(lH, lS, lV), new cv.Vec(uH, uS,uV));
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


/**
 * calibrate the lower and upper HSV Values
 * 
 * @param {var hsv[3]} float hsv[3]
 * @returns void
 */
function calibrateHSV(hsv){
	//calibrate lower hue value
	if(hsv[0] >= variance)
	{
		lH = (hsv[0] -variance)*180;
		
	}
	else // hsv[0] < variance
	{
		lH = 0.00;
	}
	//calibrate lower saturation value
	if(hsv[1] >= variance)
	{
		lS = (hsv[1] -variance)*255;
	}
	else //hsv[1] < variance
	{
		lS = 0.00;
	}
	//calibrate lower value value
	if(hsv[2] >= variance)
	{
		lV = (hsv[2] - variance)*255;
	}
	else //hsv[2] < variance
	{
		lV = 0.00;
	}
	//calibrate upper hue value
	if(hsv[0] <= (1 - variance))
	{
		uH = (hsv[0] + variance)*180;
	}
	else //hsv[0] > 1 - variance
	{
		uH = 1*180;
	}
	//calibrate upper saturation value
	if(hsv[1] <= 1 - variance)
	{
		uS = (hsv[1] + variance)*255;
	}
	else  //hsv[1] > 1 - variance
	{
		uS = 1*255;
	}
	//calibrate upper value value
	if(hsv[2] <=1 - variance)
	{
		uV = (hsv[2] + variance)*255;
	}
	else //hsv[2] > 1 - variance
	{
		uV = 1*255;
	}
	
	console.log("lH - ",lH);
	console.log("lS - ",lS);
	console.log("lv - ",lV);
	console.log("uH - ", uH);
	console.log("uS - ", uS);
	console.log("uV - ", uV);
}