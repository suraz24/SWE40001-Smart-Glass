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

// get the polygon from a contours hull such that there
// will be only a single hull point for a local neighborhood
const getRoughHull = (contour, maxDist) => {
  // get hull indices and hull points
  const hullIndices = contour.convexHullIndices();
  const contourPoints = contour.getPoints();
  const hullPointsWithIdx = hullIndices.map(idx => ({
    pt: contourPoints[idx],
    contourIdx: idx
  }));
  const hullPoints = hullPointsWithIdx.map(ptWithIdx => ptWithIdx.pt);
  
 // group all points in local neighborhood
  const ptsBelongToSameCluster = (pt1, pt2) => ptDist(pt1, pt2) < maxDist;
  const { labels } = cv.partition(hullPoints, ptsBelongToSameCluster);
  const pointsByLabel = new Map();
  labels.forEach(l => pointsByLabel.set(l, []));
  hullPointsWithIdx.forEach((ptWithIdx, i) => {
    const label = labels[i];
    pointsByLabel.get(label).push(ptWithIdx);
  });
  
  // map points in local neighborhood to most central point
  const getMostCentralPoint = (pointGroup) => {
    // find center
    const center = getCenterPt(pointGroup.map(ptWithIdx => ptWithIdx.pt));
    // sort ascending by distance to center
    return pointGroup.sort(
      (ptWithIdx1, ptWithIdx2) => ptDist(ptWithIdx1.pt, center) - ptDist(ptWithIdx2.pt, center)
    )[0];
  };
  const pointGroups = Array.from(pointsByLabel.values());
  // return contour indeces of most central points
  return pointGroups.map(getMostCentralPoint).map(ptWithIdx => ptWithIdx.contourIdx);
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


  // get defect points of hull to contour and return vertices
  // of each hull point to its defect points


  // fingertip points are those which have a sharp angle to its defect points
  const maxAngleDeg = 60;
  const verticesWithValidAngle = filterVerticesByAngle(vertices, maxAngleDeg);

  const result = resizedImg.copy();
  // draw bounding box and center line
  resizedImg.drawContours(
    [handContour],
    blue,
    { thickness: 2 }
  );
  
  // display detection result
  const numFingersUp = verticesWithValidAngle.length;
  result.drawRectangle(
    new cv.Point(10, 10),
    new cv.Point(70, 70),
    { color: green, thickness: 2 }
  );

  const fontScale = 2;
  result.putText(
    String(numFingersUp),
    new cv.Point(20, 60),
    cv.FONT_ITALIC,
    fontScale,
    { color: green, thickness: 2 }
  );
  
  const { rows, cols } = result;
  const sideBySide = new cv.Mat(rows, cols * 2, cv.CV_8UC3);
  result.copyTo(sideBySide.getRegion(new cv.Rect(0, 0, cols, rows)));
  resizedImg.copyTo(sideBySide.getRegion(new cv.Rect(cols, 0, cols, rows)));

  cv.imshow('handMask', handMask);
  cv.imshow('result', sideBySide);
});