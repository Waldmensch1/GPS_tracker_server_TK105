const sqlite3 = require('sqlite3').verbose();
const utils = require('./utils.js');

class DBUtils {
    constructor(dbpath) {
        this.dbpath = dbpath;
    }

    connectDB(cb) {
        this.db = new sqlite3.Database('./db/tracker.db', (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to the tracker database.');
            this.createTable(() => {
                cb();
            })
        });
    }

    createTable(cb) {
        this.db.run(`CREATE TABLE IF NOT EXISTS "trackerlog" (
            "timestamp"	date,
            "emei"	TEXT,
            "type"	INTEGER,
            "latitude"	NUMERIC,
            "longitude"	NUMERIC,
            "speed"	INTEGER,
            "direction"	INTEGER,
            "gsm_signal"	INTEGER,
            "gps_satellites"	INTEGER,
            "mileage"	INTEGER,
            "battery"	TEXT,
            "distance_last"	NUMERIC
        )`, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                cb();
            });
    }

    getLastDataFromDB(cb) {
        this.db.all(`SELECT max(timestamp) as timestamp,emei,type,latitude,longitude,speed,direction,gsm_signal,gps_satellites,mileage,battery,distance_last from trackerlog`, [], (err, rows) => {
            if (err) {
                throw err;
            }
            if (rows.length > 0) {
                var lastGPSobj = {}
                lastGPSobj.date = new Date(rows[0].timestamp);
                lastGPSobj.datelocal = lastGPSobj.date.toLocaleString();
                lastGPSobj.emei = rows[0].emei;
                lastGPSobj.type = rows[0].type;
                lastGPSobj.latitude = rows[0].latitude;
                lastGPSobj.longitude = rows[0].longitude;
                lastGPSobj.speed = rows[0].speed;
                lastGPSobj.direction = rows[0].direction;
                lastGPSobj.gsm_signal = rows[0].gsm_signal;
                lastGPSobj.gps_satellites = rows[0].gps_satellites;
                lastGPSobj.mileage = rows[0].mileage;
                lastGPSobj.battery = rows[0].battery;
                lastGPSobj.distance = rows[0].distance_last;
                lastGPSobj.google_URI = utils.getGoogleURL(lastGPSobj.latitude, lastGPSobj.longitude);
                cb(lastGPSobj);
            } else {
                cb(null);
            }
        });
    }

    writeDB(trackerobj, cb) {
        this.db.run(`INSERT INTO trackerlog(timestamp,emei,type,latitude,longitude,speed,direction,gsm_signal,gps_satellites,mileage,battery,distance_last) 
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
            [trackerobj.date.toISOString(),
            trackerobj.emei,
            trackerobj.type,
            trackerobj.latitude,
            trackerobj.longitude,
            trackerobj.speed,
            trackerobj.direction,
            trackerobj.gsm_signal,
            trackerobj.gps_satellites,
            trackerobj.mileage,
            trackerobj.battery,
            trackerobj.distance],
            function (err) {
                if (err) {
                    return console.log(err.message);
                }
                cb(this.lastID);
            });
    }

    getLastPoints(points, cb) {

        //google doesn't accept more than 20 points
        points = points > 20 ? 20 : points;

        this.db.all(`SELECT max(timestamp) as timestamp, latitude || ',' || longitude as points from trackerlog
                    union
                    SELECT distinct timestamp, latitude || ',' || longitude as points from trackerlog where distance_last > 50 order by timestamp desc Limit 0,?`, [points], (err, rows) => {
                if (err) {
                    throw err;
                }
                if (rows.length > 0) {
                    var retval = "";
                    for (var i = rows.length - 1; i >= 0; i--) {
                        retval += i > 0 ? rows[i].points + "/" : "@" + rows[i].points
                    }
                    cb(retval);
                } else {
                    cb(null);
                }
            });
    }

    getRoute(points, cb) {
        this.getLastPoints(points, (pointsring) => {
            cb("https://www.google.com/maps/dir/[INSERT],15.61z".replace("[INSERT]", pointsring));
        })
    }
}

module.exports = DBUtils;