const { cv,skinColorUpperHSV,skinColorLowerHSV } = require('./utils');

// segmenting by skin color (has to be adjusted)
//var skinColorUpper = hue => new cv.Vec(hue, 0.8 * 255, 0.9 * 255);
//var skinColorLower = hue => new cv.Vec(hue, 0.1 * 255, 0.6 * 255);

//var skinColorUpperSetting = skinColorUpper(12);
//var skinColorLowerSetting = skinColorLower(0);

var lH = 0;
var lS = 0.1;
var lV = 0.05;
var uH = 12;
var uS = 0.8;
var uV = 0.6;
var variance = 0.3;

const makeHandMask = (img) => {
  // filter by skin color
  const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
  const rangeMask = imgHLS.inRange(new cv.Vec(lH, lS, lV), new cv.Vec(uH, uS,uV));
  // remove noise
  const blurred = rangeMask.blur(new cv.Size(10, 10));
  const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);
  return thresholded;
};

const getHandContour = (handMask) => {
  const mode = cv.RETR_EXTERNAL;
  const method = cv.CHAIN_APPROX_SIMPLE;
  const contours = handMask.findContours(mode, method);
  // largest contour
  return contours.sort((c0, c1) => c1.area - c0.area)[0];
};

const getObjectCenter = (contour) => {
	// get hull indices and hull points
	const hullIndices = contour.convexHullIndices();
	const contourPoints = contour.getPoints();
	const hullPointsWithIdx = hullIndices.map(idx => ({
		pt: contourPoints[idx],
		contourIdx: idx
	}));
	const hullPoints = hullPointsWithIdx.map(ptWithIdx => ptWithIdx.pt);

  // get the x and y values of the center of the object 
	var xpt = 0;		//contains the x cordinates
	var ypt = 0		// contains the y cordinates
	for (var i=0;i<hullPoints.length;i++) {
	  xpt = xpt+(hullPoints[i].x)
	  ypt = ypt+(hullPoints[i].y)
	}
	xpt =  (xpt/(hullPoints.length)).toFixed(0)
	ypt = (ypt/(hullPoints.length)).toFixed(0)
	console.log("getObjectCenter: xpt - ", xpt, ", ypt - ",ypt);
	return [xpt, ypt]; // returns an array with the x and y cordinates 
	// return new cv.Point(xpt, ypt); // returns an array with the x and y cordinates 
};
  
const GetTraceCoordinates = (frame) => {
	//console.log("GetTraceCoordinates - frame: ", frame);
	//console.log("frame type: ", typeof(frame));
	// const resizedImg = frame.resizeToMax(640);
	const handMask = makeHandMask(frame);
	const handContour = getHandContour(handMask);
	//cv.imshow('handContour',handContour);
	if (!handContour) {
		return null;
	}
	const objectCenter = getObjectCenter(handContour);
	console.log("GetTraceCoordinates - objectCenter", objectCenter);
	return objectCenter;
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

module.exports = {
	GetTraceCoordinates: GetTraceCoordinates,
	CalibrateColorThreshold: function(_skinColorLower,_skinColorUpper) {
	console.log("CalibrateColorThreshold getTraceCoordinates - lower value:", _skinColorLower, ", upper value:", _skinColorUpper);
		skinColorLowerSetting = _skinColorLower;
		skinColorUpperSetting = _skinColorUpper;
	},
	_Set_HSV_Trace: function(hsv) {
		console.log("Setting HSV of GetTraceCoordinates");
		calibrateHSV(hsv);
	}
}

