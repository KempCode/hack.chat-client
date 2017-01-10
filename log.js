var fs = require("fs");
var logDate = new Date();
module.exports = {
    createLog: function(chan) {
        if (!fs.existsSync("./logs")) {
            fs.mkdirSync("logs");

            if (!fs.existsSync("./logs/" + chan + ".txt")) {
                fs.writeFileSync("./logs/" + chan + ".txt", "")
            }

        }

    },
    logData: function(x, c) {
        fs.appendFile('logs/' + c + ".txt", logDate + "  " + x.trip + " " + x.nick +
            ": " + x.text + "\n");
    }
}
