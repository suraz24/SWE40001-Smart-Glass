# SWE40001-Smart-Glass

## Steps to run the app
1. Run the server
   - Clone this project.
   - Run `npm install` to install all the dependencies
   - Run `npm start` to run the app
   >The app is now running on port 5000. It can be accessed by going to `localhost:5000` from the browser of your choice.
   > You can also access the admin portal through `localhost:5000/admin`
   > If you are accessing the app via glasses, make sure the server and glasses are connected to the same network(same wifi). Then, access     `<ipaddress>:5000` through the glasses.

2. Streaming mode
   > Streaming starts automatically, the first pair of glasses to connect to the server is automatically assigned the INSTRUCTOR role, second pair is OPERATOR
3. Sketching mode
   > Access the admin panel in 4.2, click “switch to sketching”, both user’s video feed will freeze (a snapshot). Finger tracking/sketching processing will proceed from instructor’s camera/hand
4. Calibration
   - Color calibration is accessible on the admin panel in step 1.2.
   - Calibrate for streaming: click “calibrate for streaming”, a snapshot will be taken from the instructor’s camera This will only work if users are currently in streaming mode
   - Calibrate for sketching: click “calibrate for sketching”, a snapshot will be taken from the instructor’s camera This will only work if users are currently in sketching mode
   - Mouse over and click on the desired color in the snapshot to calibrate

  > Note: Firefox should be used to browse on the smart glasses instead of the default browser. There is no keyboard on the smart glasses,   we have set browser homepage to the server ip for development purposes. Another app (autostart) is used to launch Firefox 10 seconds       after boot(wait for wifi) due to having no access to root. 
  We have disabled Firefox mediadevice permission in `about:config` to eliminate permission dialogs. A bluetooth keyboard can be used to     change the homepage. The QR code scanner can also be used to scan generated web address for firefox to open, in our case, the server’s     ip address/port. It can also be used to connect to wifi.
