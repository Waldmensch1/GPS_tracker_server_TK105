"use strict";
const EventEmitter = require('events');
const TelegramBot = require('node-telegram-bot-api');
const utils = require('./utils.js');


class TeleBot extends EventEmitter {

    constructor(token, LocalStorage) {
        super();
        this.bot = new TelegramBot(token, { polling: true });
        this.localStorage = localStorage;
        this.chatIds = this.localStorage.getItem('chatIds') !== null ? JSON.parse(this.localStorage.getItem('chatIds')) : [];

        this.bot.onText(/\/echo (.+)/, (msg, match) => {
            var chatId = msg.chat.id;
            if (match[1] === "GPS") {
                this.addChatID(chatId);
                this.emit('activate_gps', chatId);
            }
            else if (match[1] === "GPS off") {
                this.emit('deactivate_gps', chatId);
                this.removeChatID(chatId);
                this.bot.sendMessage(chatId, "GPS messages off");
            } else if (match[1] === "GPS last") {
                this.emit('get_route', chatId);
            } else {
                this.bot.sendMessage(chatId, "Unknown command :(");
            }
        });
    }

    sendMessage(message, chatId) {
        if (chatId !== null) {
            this.bot.sendMessage(chatId, message, {
                "disable_notification": false,
            });
        }
    }

    sendLocation(chatId, lat, lon){
        if (chatId !== null) {
            this.bot.sendLocation(chatId, lat, lon, {
                "disable_notification": false,
            });
        }
    }

    sendTelegram(subject, gpsobj, chatId) {
        if (this.bot && chatId !== null) {
            this.bot.sendMessage(chatId, subject + "\n"
                + "Date: " + gpsobj.datelocal + "\n"
                + "Span: " + utils.diffdate(gpsobj.date) + "\n"
                + "Bat: " + gpsobj.battery + " GSM: " + gpsobj.gsm_signal + " GPS: " + gpsobj.gps_satellites + "\n"
                + gpsobj.google_URI);
        }
    }

    sendTelegramAround(subject, gpsobj) {
        if (this.chatIds.length > 0) {
            this.chatIds.forEach((chatId) => {
                this.sendTelegram(subject, gpsobj, chatId);
            })
        }
    }

    removeChatID(id) {
        const index = this.chatIds.indexOf(id);
        if (index > -1) {
            this.chatIds.splice(index, 1);
        }
        this.localStorage.setItem("chatIds", JSON.stringify(this.chatIds));
    }

    addChatID(id) {
        const index = this.chatIds.indexOf(id);
        if (index == -1) {
            this.chatIds.push(id);
        }
        this.localStorage.setItem("chatIds", JSON.stringify(this.chatIds));
    }
}

module.exports = TeleBot;