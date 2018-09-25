const { cv } = require('./utils');

// segmenting by skin color (has to be adjusted)
const skinColorUpper = hue => new cv.Vec(hue, 0.8 * 255, 0.9 * 255);
const skinColorLower = hue => new cv.Vec(hue, 0.1 * 255, 0.6 * 255);

const makeHandMask = (img) => {
  // filter by skin color
  const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
  const rangeMask = imgHLS.inRange(skinColorLower(100), skinColorUpper(180));
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
	return [xpt,ypt]    // returns an array with the x and y cordinates 
};
  
const GetTraceCoordinates = (frame) => {
	const resizedImg = frame.resizeToMax(640);
	const handMask = makeHandMask(resizedImg);
	const handContour = getHandContour(handMask);
	if (!handContour) {
		return [-1,-1];
	}
	const objectCenter = getObjectCenter(handContour);
	return objectCenter;
}

module.exports = {
	GetTraceCoordinates: GetTraceCoordinates
}