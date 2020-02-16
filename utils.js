
const fs = require('fs');

var getGoogleURL = function (lat, lon) {
    var retval = "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
    return retval;
}

var getDate = function (date, time) {
    var day = parseInt(date.substr(0, 2));
    var month = parseInt(date.substr(2, 2)) - 1;
    var year = parseInt("20" + date.substr(4, 2));
    var hour = parseInt(time.substr(0, 2));
    var min = parseInt(time.substr(2, 2));
    var sec = parseInt(time.substr(4, 2));
    return new Date(Date.UTC(year, month, day, hour, min, sec));
}

var getBatState = function (value) {
    //06= 100% 05=80% 04=60% 03=40% 02=20% 01=10%
    switch (parseInt(value)) {
        case 6: return "100%";
        case 5: return "80%";
        case 4: return "60%";
        case 3: return "40%";
        case 2: return "20%";
        case 1: return "10%";
    }
    return "0%";
}

var getGoogleCoords = function (value) {
    var x;
    if (value.length == 8) {
        x = parseFloat(value.substr(0, 4) + "." + value.substr(4, 4));

    } else if (value.length == 9) {
        x = parseFloat(value.substr(0, 5) + "." + value.substr(5, 4));
    }
    var degWhole = parseFloat(parseInt(x / 100));
    var degDec = (x - degWhole * 100) / 60;
    return degWhole + degDec;
}

var round = function (num, places) {
    return +(Math.round(num + "e+" + places) + "e-" + places);
}

var getDistance = function (lat1, lat2, lon1, lon2) {
    var dx = 71.5 * (lon1 - lon2);
    var dy = 111.3 * (lat1 - lat2);
    return Math.sqrt(dx * dx + dy * dy);
}

var diffdate = function (date) {
    var datenow = new Date();
    var diff = datenow - date, sign = diff < 0 ? -1 : 1, milliseconds, seconds, minutes, hours, days;
    diff /= sign; // or diff=Math.abs(diff);
    diff = (diff - (milliseconds = diff % 1000)) / 1000;
    diff = (diff - (seconds = diff % 60)) / 60;
    diff = (diff - (minutes = diff % 60)) / 60;
    days = (diff - (hours = diff % 24)) / 24;
    var result = (sign === 1 ? "E " : "R ") + days + "d-" + hours + ":" + minutes + ":" + seconds + ":" + milliseconds;
    return result;
}

module.exports = {

    log: function (logtext) {
        console.log(logtext);
    },
    getGoogleURL: getGoogleURL,
    round: round,
    getDistance: getDistance,
    getDate: getDate,
    getBatState: getBatState,
    getGoogleCoords: getGoogleCoords,
    diffdate: diffdate,

    logFile: function (value) {
        fs.appendFile('log.txt', value, function (err) {
            if (err) {
                console.log(err);
            }
        });
    },

    parse24msg: function (message, lastGPSobj, cb) {
        var gpsobj = {};
        var ptr = 0;
        var len = 2;
        gpsobj.type = message.substr(ptr, len);
        ptr += len; len = 10;
        gpsobj.emei = message.substr(ptr, len);
        ptr += len; len = 6;
        var time = message.substr(ptr, len);
        ptr += len; len = 6;
        var date = message.substr(ptr, len);
        gpsobj.date = getDate(date, time);
        gpsobj.datelocal = gpsobj.date.toLocaleString();
        ptr += len; len = 8;
        gpsobj.latitude = getGoogleCoords(message.substr(ptr, len));
        ptr += len; len = 2;
        gpsobj.battery = getBatState(message.substr(ptr, len));
        ptr += len; len = 9;
        gpsobj.longitude = getGoogleCoords(message.substr(ptr, len));
        ptr += len; len = 1;
        gpsobj.bit = parseInt(message.substr(ptr, len), 16);
        ptr += len; len = 3;
        gpsobj.speed = parseInt(message.substr(ptr, len)) * 1.852;
        ptr += len; len = 3;
        gpsobj.direction = parseInt(message.substr(ptr, len));
        ptr += len; len = 8;
        gpsobj.vehicle_data = message.substr(ptr, len);
        ptr += len; len = 2;
        gpsobj.user_alert = message.substr(ptr, len);
        ptr += len; len = 2;
        gpsobj.backup_data = message.substr(ptr, len);
        ptr += len; len = 2;
        gpsobj.gsm_signal = parseInt(message.substr(ptr, len), 16);
        ptr += len; len = 2;
        gpsobj.gps_satellites = parseInt(message.substr(ptr, len), 16);
        ptr += len; len = 8;
        gpsobj.mileage = parseInt(message.substr(ptr, len), 16);
        ptr += len; len = 4;
        gpsobj.country_code = message.substr(ptr, len);
        ptr += len; len = 2;
        gpsobj.mnc = message.substr(ptr, len);
        ptr += len; len = 4;
        gpsobj.lac = message.substr(ptr, len);
        ptr += len; len = 4;
        gpsobj.cell_id = message.substr(ptr, len);
        ptr += len; len = 2;
        gpsobj.paket_no = parseInt(message.substr(ptr, len), 16);
        gpsobj.google_URI = getGoogleURL(gpsobj.latitude, gpsobj.longitude);

        if (lastGPSobj != null && lastGPSobj.latitude != null) {
            gpsobj.distance = round(getDistance(lastGPSobj.latitude, gpsobj.latitude, lastGPSobj.longitude, gpsobj.longitude) * 1000, 3);
            cb(gpsobj);
        } else {
            gpsobj.distance = 0;
            cb(gpsobj);
        }
    },

    parseTextmsg: function (message, lastGPSobj, cb) {
        //console.log("Received Text: " + message);

        // Do parsing here and return gpsobj in callback
        cb(null);
    }
};


