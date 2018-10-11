var { cv, Mat } = require('./utils');



// segmenting by skin color (has to be adjusted)
// var colorUpperThreshold = new cv.Vec(0.0, 0.8 * 255, 0.6 * 255);
var lH = 0;
var lS = 0.1 * 255;
var lV = 0.05 * 255;
var uH = 12;
var uS = 0.8 * 255;
var uV = 0.6 * 255;

var hueVariance = 0.07;
var satVariance = 0.9;
var valVariance = 0.9;


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

	}
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

const kernel = new cv.Mat(2, 2, cv.CV_8U, 1); //ones 5X5 kernel 
const kernelClose = new cv.Mat(3, 3, cv.CV_8U, 1);//ones 20x20 kernel

function makeHandMask(img) {
	// Denoising the color 
	for (var i = 0; i < 2; i++) {
		img = img.blur(new cv.Size(10, 10));
	}
	// filter by skin color
	const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
	var rangeMask = imgHLS.inRange(new cv.Vec(lH, lS, lV), new cv.Vec(uH, uS, uV));
	// remove noise
	var blurred = rangeMask.blur(new cv.Size(5, 5));
	const thresholded = blurred.threshold(240, 255, cv.THRESH_BINARY);
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
function calibrateHSV(hsv) {
	//calibrate lower hue value
	if (hsv[0] >= hueVariance) {
		lH = (hsv[0] - hueVariance) * 180;

	}
	else // hsv[0] < hueVariance
	{
		lH = 0.00;
	}
	//calibrate lower saturation value
	if (hsv[1] >= satVariance) {
		lS = (hsv[1] - satVariance) * 255;
	}
	else //hsv[1] < satVariance
	{
		lS = 0.00;
	}
	//calibrate lower value value
	if (hsv[2] >= valVariance) {
		lV = (hsv[2] - valVariance) * 255;
	}
	else //hsv[2] < valVariance
	{
		lV = 0.00;
	}
	//calibrate upper hue value
	if (hsv[0] <= (1 - hueVariance)) {
		uH = (hsv[0] + hueVariance) * 180;
	}
	else //hsv[0] > 1 - hueVariance
	{
		uH = 1 * 180;
	}
	//calibrate upper saturation value
	if (hsv[1] <= 1 - satVariance) {
		uS = (hsv[1] + satVariance) * 255;
	}
	else  //hsv[1] > 1 - satVariance
	{
		uS = 1 * 255;
	}
	//calibrate upper value value
	if (hsv[2] <= 1 - valVariance) {
		uV = (hsv[2] + valVariance) * 255;
	}
	else //hsv[2] > 1 - valVariance
	{
		uV = 1 * 255;
	}

	console.log("lH - ", lH);
	console.log("lS - ", lS);
	console.log("lv - ", lV);
	console.log("uH - ", uH);
	console.log("uS - ", uS);
	console.log("uV - ", uV);
}