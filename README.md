# GPS_tracker_server_TK105
GPS Tracker Server for TK105 tracker, with forwarding to second Server, with Telegram Bot Control


- clone the repo
- change into folder
- run npm install
- create a Bot on Telegram
- enter the Token in app.js

To receive messages from your tracker:
- forward the port 1337 (TCP) in your router to machine the server runs
- configure your tracker to send to your external IP address and port 1337

To forward the tracker messages to another server
- create an account e.g. on https://gps.my-gps.org/ and register the EMEI of your tracker
- enter the IP and port of this provider
- all messages received by your server will automatically and unchanged to this server additionally

