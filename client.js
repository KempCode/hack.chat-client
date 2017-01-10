var webSocket = require("ws");
var log = require("./log");
var chalk = require('chalk');
var commands = [];
var readlineSync = require('readline-sync');
var ws = new webSocket("wss://hack.chat/chat-ws");
var serverOptions = {
    cmd: "join",
    nick: "",
    channel: ""
};
//function that gets user input for serverOptions object to be sent to the hack.chat ws server
var nickname;
var chan;

function setupServerOptions() {
    console.log(chalk.green("Welcome to hack.chat"));
    nickname = readlineSync.question(chalk.green('May I have your name and trip pass? '));
    if (/^[a-zA-Z0-9_]{1,24}(#.*)?$/.test(nickname)) {
        serverOptions.nick = nickname;
        chan = readlineSync.question(chalk.green('What channel do you wish to join?: '));
        serverOptions.channel = chan;
    } else {
        console.log("Invalid username, please try again");
        setupServerOptions();
    }
}
setupServerOptions();

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//when ws connection is established send serverOptions, check whos online and startt prompt
ws.on("open", function open() {
    ws.send(JSON.stringify(serverOptions));
    whosOnline();

    rl.on("line", function(input) {
        rl.prompt(true);
        ws.send(JSON.stringify({
            cmd: "chat",
            text: input
        }));
    });
});

//Ping every 50 seconds to server to maintain ws connection
setTimeout(function() {
    ws.send(JSON.stringify({
        cmd: 'ping'
    }));
}, 50000)

//Really hacky way around prompt() issues
function console_out(msg) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(msg);
    rl.prompt(true);
}

log.createLog(chan);
//receive messages
ws.on("message", function(data) {
    var args = JSON.parse(data);
    if (args.nick == nickname.split("#")[0]) {
        if (args.trip == undefined) {
            args.trip = "(No trip)";
        }
        log.logData(args, chan);
        return;
    }

    if (args.cmd === 'chat') {
        if (args.trip == undefined) {
            args.trip = "(No trip)";
        }
        console_out("\n" + "\033[F" + chalk.blue(args.trip + " " + args.nick + ": ") + args.text);
        log.logData(args, chan);
    }

    if (args.cmd === "warn") {
        if (args.text === "Nickname taken") {
            console_out(chalk.green(args.text));
            process.exit();
        }
        console_out(chalk.green("Your IP is being rate-limited or blocked."));
    }

});

//function to check who is online
var online = [];

function whosOnline() {
    ws.on("message", function(data) {
        //See online users.
        var args = JSON.parse(data);
        if (args.cmd === 'onlineSet') {
            for (var i = 0; i < args.nicks.length; i++) {
                online.push(args.nicks[i]);

            }
            console.log("\n" + chalk.green.bold("Active users: ") + chalk.green(online) + "\n");
        } else if (args.cmd === 'onlineAdd') {
            online.push(args.nick);
            console_out(chalk.green(args.nick + " has entered the chatroom"));
        } else if (args.cmd === 'onlineRemove') {
            var x = online.indexOf(args.nick);
            if (x != -1) {
                online.splice(x, 1);
                console_out(chalk.green(args.nick + " has left the chatroom"));
            }
        }
    });
}
