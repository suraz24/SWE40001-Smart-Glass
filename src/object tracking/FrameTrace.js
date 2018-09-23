const { grabFrames, cv } = require('./utils.js');
const { GetTraceCoordinates } = require('./GetTraceCoordinates') 

function FrameTrace(inputVideo){
    var storageArray=[]; //saves every x,y point from the start
    var frameNumber=0;    //saves the current frame number
    const delay = 20;
    var twoPointDistance;
    const upperLeft = new cv.Point(0, 0)

    //later to be replaced with the snapshot
    Snapshot= cv.imread('./s1.jpg',cv.IMREAD_COLOR);
    grabFrames(inputVideo, delay, (frame) => {
        const drawParams = Object.assign(
            {},
            { thickness: 5 },   //can change the thickness of the drawing  
        )

        storageArray[frameNumber]=GetTraceCoordinates(frame); //saves every point from the start to this array

        for(iterator=1;iterator<frameNumber;iterator++){
        //distance between starting point and the current pooint
            twoPointDistance=Math.sqrt(Math.pow((storageArray[0][0]-storageArray[frameNumber][0]),2)+ Math.pow((storageArray[0][1]-storageArray[frameNumber][1]),2))
            if(frameNumber==0){       //if it is the first frame, then just draw a dot, because no previous x,y values
                Snapshot.drawLine(
                upperLeft.add(new cv.Point(storageArray[frameNumber][0],storageArray[frameNumber][1])),
                upperLeft.add(new cv.Point(storageArray[frameNumber][0],storageArray[frameNumber][1])),
                drawParams)
            } else {
                Snapshot.drawLine(        //if it is not the first frame, drawlines between each previous consecutive values,in real-time this looks like a drawing
                upperLeft.add(new cv.Point(storageArray[iterator-1][0],storageArray[iterator-1][1])),
                upperLeft.add(new cv.Point(storageArray[iterator][0],storageArray[iterator][1])),
                drawParams)
            }
        }
        console.log('x: '+storageArray[frameNumber][0]+" y: "+storageArray[frameNumber][1]+" Distance: "+twoPointDistance);        
        frameNumber++;
        cv.imshow('Snapshot',Snapshot); 
    });
}

module.exports = {FrameTrace : FrameTrace};
