const { cv,skinColorUpperHSV,skinColorLowerHSV } = require('./utils');

// segmenting by skin color (has to be adjusted)
var skinColorUpper = hue => new cv.Vec(hue, 0.8 * 255, 0.9 * 255);
var skinColorLower = hue => new cv.Vec(hue, 0.1 * 255, 0.6 * 255);

var skinColorUpperSetting = skinColorUpper(12);
var skinColorLowerSetting = skinColorLower(0);

var percent_h = 0.7;
var percent_v = 0.7;
var percent_s = 0.8;

const makeHandMask = (img) => {
  // filter by skin color
  const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
  const rangeMask = imgHLS.inRange(skinColorLowerHSV(((percent_h-0.3)*360)/2, (percent_s - 0.3)* 255, (percent_v - 0.3)* 255),skinColorUpperHSV(((percent_h + 0.3)*360)/2,(percent_s + 0.3) * 255,(percent_v + 0.3) * 255));
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

module.exports = {
	GetTraceCoordinates: GetTraceCoordinates,
	CalibrateColorThreshold: function(_skinColorLower,_skinColorUpper) {
	console.log("CalibrateColorThreshold getTraceCoordinates - lower value:", _skinColorLower, ", upper value:", _skinColorUpper);
		skinColorLowerSetting = _skinColorLower;
		skinColorUpperSetting = _skinColorUpper;
	},
	setHSVPercent: function(h,s,v) { //decimal value percentage
		console.log("setHSVPercent GetTraceCoordinates - h - ",h,", s - ", s ,", v - ", v);
		percent_h = h;
		percent_v = s;
		percent_s = v;
	}
}