OpenTokChattr
=============
A multi-party text chat plugin written in Javascript. This project is built upon the [Signaling Library](https://tokbox.com/opentok/tutorials/signaling/js) of the [OpenTok API](https://tokbox.com).

Dependencies
-------------
The [OpenTok for WebRTC JS API](http://www.tokbox.com/opentok) is required.
The [jquery.event.ue](https://github.com/mmikowski/jquery.event.ue) and [jquery-udraggable](https://github.com/grantm/jquery-udraggable) libraries are required for a draggable interface. 

Running the Demo
------------------
1. Clone [this repo](https://github.com/shivamthapar/OpenTokChattr).
2. Get my API Key, Session ID, and Token from your [TokBox Dashboard](http://dashboard.tokbox.com/). For help on this step, visit the [Quickstart page](https://tokbox.com/opentok/quick-start/) in the OpenTok Docs. 
3. Replace `API KEY`, `SESSION ID`, and `TOKEN` with your corresponding credentials.
4. Run `npm install` to install the necessary packages.
5. Start the server with `node server.js`.
6. Open your browser to `localhost:8080/demo.html`.
