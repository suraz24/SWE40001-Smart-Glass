const cv = require('../');
const { grabFrames } = require('./utils');
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
  var ypt = 0;		// contains the y cordinates
  for (var i=0;i<hullPoints.length;i++)
  {
	  xpt = xpt+(hullPoints[i].x)
	  ypt = ypt+(hullPoints[i].y)
  }
  xpt =  (xpt/(hullPoints.length)).toFixed(0)
  ypt = (ypt/(hullPoints.length)).toFixed(0)
  console.log(xpt);
  console.log(ypt);
  return [xpt,ypt]    // returns an array with the x and y cordinates 
  };
  
const blue = new cv.Vec(255, 0, 0);
// main
const delay = 20;
grabFrames('../data/example5.mp4', delay, (frame) => {
  const resizedImg = frame.resizeToMax(640);
  const handMask = makeHandMask(resizedImg);
  const handContour = getHandContour(handMask);
  if (!handContour) {
    return;
  }
  const maxPointDist = 25;
  const objectCenter = getObjectCenter(handContour);
  const result = resizedImg.copy();
  // draw bounding box and center line
  resizedImg.drawContours(
    [handContour],
    blue,
    { thickness: 2 }
  );
  // display detection result
  const { rows, cols } = result;
  const sideBySide = new cv.Mat(rows, cols * 2, cv.CV_8UC3);
  result.copyTo(sideBySide.getRegion(new cv.Rect(0, 0, cols, rows)));
  resizedImg.copyTo(sideBySide.getRegion(new cv.Rect(cols, 0, cols, rows)));

  cv.imshow('handMask', handMask);
  cv.imshow('result', sideBySide);
});