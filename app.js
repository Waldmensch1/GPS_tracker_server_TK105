process.env["NTBA_FIX_319"] = 1; // TelegramBot fix

const net = require('net');
const utils = require('./utils.js');
const DBUtils = require('./dbutils.js')
const TeleBot = require('./telebot.js')

// Remote server to forward the Tracker Data
// example for https://gps.my-gps.org/ - you have to register first with IMEI of your tracker
// Register one tracker is free with limited functions.
// If REMOTE_ADDR is an empty string the forwarding is disabled.
const REMOTE_PORT = 1155;
const REMOTE_ADDR = ""//"82.223.25.222";

// last GPS Data
var lastGPSobj = null;

// Telegram Token
// You have to create a Telegram bot first. While creating you get a token for your bot.
const token = 'xxxxxxxxx';

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./storage');
}

// init database and load last object
const dbutils = new DBUtils('./db/tracker.db');
dbutils.connectDB(() => {
    dbutils.getLastDataFromDB((gpsobj) => {
        lastGPSobj = gpsobj;
        //console.log('Last GPS Object loaded from DB');
    })
})

// initiate Telegram bot and subscribe events
const telbot = new TeleBot(token, LocalStorage);
telbot.on('activate_gps', (chatID) => {
    // adding chatID to subscriber list is done by telebot class itself
    console.log('Telegram received "activate" for chatID ' + chatID);
    if (lastGPSobj !== null) {
        //telbot.sendTelegram("GPS enabled, last seen: ", lastGPSobj, chatID);
        telbot.sendLocation(chatID, lastGPSobj.latitude, lastGPSobj.longitude);
    } else {
        telbot.sendMessage("Sorry no GPS Data :(", chatId);
    }
});
telbot.on('deactivate_gps', (chatID) => {
    // removing chatID from subscriber list is done by telebot class itself
    console.log('Telegram received "deactivate" for chatID ' + chatID);
});
telbot.on('get_route', (chatID) => {
    dbutils.getRoute(20, (uri) => {
        telbot.sendMessage("Last Route:\n" + uri, chatID);
    });
});

// TCP listener
var server = net.createServer(function (socket) {

    socket.on('data', function (data) {
        var hexChunk = data.toString("hex").trim();
        var textChunk = data.toString("ascii").trim();

        if (hexChunk != "" && hexChunk.startsWith("24")) {

            // parse binary object
            utils.parse24msg(hexChunk, lastGPSobj, (gpsobj) => {
                if (gpsobj !== null) {
                    lastGPSobj = gpsobj;
                    // send telegram message
                    if (gpsobj.distance > 5) {
                        telbot.sendTelegramAround("!!Moving!! (" + gpsobj.distance + "m)", gpsobj);
                    }
                    // write to DB
                    dbutils.writeDB(gpsobj, (lastID) => {
                        console.log(`A row has been inserted with rowid ${lastID}`);
                    })
                }
            });

            // Fork into Textmessages for other Tracker than TK105
        } else if (hexChunk != "" && hexChunk.startsWith("2a")) {
            utils.parseTextmsg(textChunk, lastGPSobj, (gpsobj) => {
                if (gpsobj !== null) {
                    lastGPSobj = gpsobj;
                    // send telegram message
                    if (gpsobj.distance > 5) {
                        telbot.sendTelegramAround("!!Moving!! (" + gpsobj.distance + "m)", gpsobj);
                    }
                    // write to DB
                    dbutils.writeDB(gpsobj, (lastID) => {
                        console.log(`A row has been inserted with rowid ${lastID}`);
                    });
                }
            })
        }

        // forward messages to another Server
        if (REMOTE_ADDR != "") {
            var serviceSocket = new net.Socket();
            serviceSocket.connect(parseInt(REMOTE_PORT), REMOTE_ADDR, function () {
                //console.log('>> From proxy to remote', data.toString());
                serviceSocket.write(data);
            });
            serviceSocket.on("data", function (msg) {
                console.log('<< From remote to proxy', msg.toString());
            });
        }

    });

    socket.on('close', function () {
        console.info('Socket close');
    });

    socket.on('error', function (err) {
        console.error('Socket error: ' + err);
        console.error(new Error().stack);
    });

});

server.listen(1337, '0.0.0.0');
