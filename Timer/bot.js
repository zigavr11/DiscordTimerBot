var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');

var timers = [];
var counter = 0;
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

function CountDownTimer(index, id, time, channelID){
    this.id = id;
    var t;
    bot.sendMessage({
        to: channelID,
        message: '```Timer for ' + this.id + ' started.```'
    });
    var x = setInterval(function(){
        if (time < 0) {
            bot.sendMessage({
                to: channelID,
                message: '@here ```It is time for ' + id + '!```'
            });
            clearInterval(x);
            counter--;
            delete timers[index];
        }
        time--;
        t = time;
    }, 1000);
    this.stopInterval = function(){
        bot.sendMessage({
            to: channelID,
            message: '```Timer for ' + this.id + ' has been canceled.```'
        });
        clearInterval(x);
        counter--;
        delete timers[index];
    }
    this.checkCountDown = function(){
        bot.sendMessage({
            to: channelID,
            message: '```Timer for ' + this.id + ' is at ' + t +  '.```'
        });
    }
    this.getTime = function(){
        return time;
    }
}
bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var timerExists = false;
        switch(cmd) {
            // !ping
            case 'timer':
                if(args.length == 4 && args[2] == 'start'){
                    for(var i = 0; i < counter; i++){
                        if(timers[i].id == args[1]){
                            timerExists = true;
                            bot.sendMessage({
                                to: channelID,
                                message: '```Timer already exists!```'
                            });
                        }    
                    }
                    if(!timerExists){
                        if(args[3].search(':') == -1){
                            timers[counter] = new CountDownTimer(counter, args[1], args[3], channelID);    
                            counter++;
                        }
                        else{
                            var time = args[3].split(':');
                            //var now = new Date().getTime();
                            var now = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDay(), (new Date()).getHours(), (new Date()).getMinutes(), (new Date()).getSeconds(), (new Date()).getMilliseconds()).getTime();
                            var until = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDay(), time[0], time[1], 0, 0).getTime();
                            var timer = (until - now);
                            if(timer < 0)
                            {
                                var until = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDay() + 1, time[0], time[1], 0, 0).getTime();
                                var timer = (until - now);
                            }
                            var hours = Math.floor((timer % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            var minutes = Math.floor((timer % (1000 * 60 * 60)) / (1000 * 60));
                            var seconds = Math.floor((timer % (1000 * 60)) / 1000);
                            seconds += (hours * 3600) + (minutes * 60);
                            timers[counter] = new CountDownTimer(counter, args[1], seconds, channelID);    
                            counter++;
                        }
                    }
                }
                else if(args.length == 3 && args[2] == 'stop'){
                    if(counter < 1){
                        bot.sendMessage({
                            to: channelID,
                            message:  '```No active timers!```'
                        });
                    }
                    else{
                        for(var i = 0; i < counter; i++){
                            if(timers[i].id == args[1]){
                                timers[i].stopInterval();
                            }
                        }
                    }
                }
                else if(args.length == 3 && args[2] == 'check'){
                    if(counter < 1){
                        bot.sendMessage({
                            to: channelID,
                            message:  '```No active timers!```'
                        });
                    }
                    else{
                        for(var i = 0; i < counter; i++){
                            if(timers[i].id == args[1]){
                                timers[i].checkCountDown();
                            }
                        }
                    }
                }
                else if(args.length == 2 && args[1] == 'help'){
                    bot.sendMessage({
                        to: channelID,
                        message:  '```Template: \n \t !timer "id" "command" "time" \n Commands: \n  \tstart: Starts a new timer specified by name \n \t stop: Stops the specific timer \n \t check: Checks the specific timer \n Id: \n \tSpecifies the name of the timer, and its used to stop or check a timer. \n Time: \n \tHow long is the timer \n!timer active: \n \tDisplays all active timers.\n```'
                    });
                }
                else if(args.length == 2 && args[1] == 'active'){
                    if(counter > 0){
                        var output = '```**Id**\t\t**Time**\n';
                        for(var i = 0; i < counter; i++){
                            output += '\n' + timers[i].id + "\t\t" + timers[i].getTime();
                        }
                        output += '```';
                        bot.sendMessage({
                            to: channelID,
                            message: output
                        });
                    }
                    else{
                        bot.sendMessage({
                            to: channelID,
                            message: '```No active timers.```'
                        });
                    }
                }
                else{
                    bot.sendMessage({
                        to: channelID,
                        message: '```Wrong template! It is suppose to look like this:\n!timer Ziga start 10```'
                    });
                }
                break;
         }
        
     }
});

