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
        var time  = t;
        var hours = Math.floor(time / 3600);
        time -= hours * 3600;
        var minutes = Math.floor(time / 60);
        time -= minutes * 60;
        var seconds = time;

        bot.sendMessage({
            to: channelID,
            message: '```Time until ' + this.id + ' expires is: ' + hours + 'h ' + minutes + 'min ' + seconds + 's' +  '.```'
        });
    }
    this.getTime = function(){
        return time;
    }
}

bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        if(args[0] == 't')
            args[0] = 'timer';
        var timerExists = false;
        switch(args[0]) {
            // !ping
            case 'timer':
                if(counter < 5 && args.length == 4 && args[2].toLowerCase() == 'start'){
                    startTimer(args, channelID);
                }
                else if(args.length == 3 && (args[2].toLowerCase() == 'stop' || args[2].toLowerCase() == 'check')){
                    timerCommands(args, channelID, args[2]);
                }
                else if(args.length == 2 && args[1].toLowerCase() == 'help'){
                    helpTimer(channelID);
                }
                else if(args.length == 2 && args[1].toLowerCase() == 'active'){
                    activeTimers(channelID);
                }
                else{
                    bot.sendMessage({
                        to: channelID,
                        message: wrongTemplateCheck(args)
                    });
                }
                break;
         }
        
     }
});

wrongTemplateCheck = function(args){
    var none = true;
    for(var i = 0; i < args.length; i++){
        switch(args[i]){
            case 'start': 
                if(counter > 4) return "```You cannot add any more timers, because the maximum ammount of timers are active.```" ;
                else return "```Wrong template! Example: !timer Ziga start 10 or 12:09```"; 
            break;
            case 'stop': return "```Wrong template! Example: !timer Ziga stop```"; break;
            case 'check': return "```Wrong template! Example: !timer Ziga check```"; break;
            case 'active': return "```Wrong template! Example: !timer active```"; break;
            case 'help': return "```Wrong template! Example: !timer help```"; break;
        }
    }
    if(none){
        return "```Wrong template! To start a timer, it should look like this: !timer Ziga start 10```";
    }
}

startTimer = function(args, channelID){
    var timerExists = false;
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
            if(time[0] < 0 || time[0] > 23 || time[1] < 0 || time[1] > 59){
                bot.sendMessage({
                    to: channelID,
                    message: '```Wrong time input!```'
                });
            }
            else{
                var now = ((new Date()).getHours() * 3600) + ((new Date()).getMinutes() * 60) + (new Date()).getSeconds();
                var until = (time[0] * 3600) + (time[1] * 60);
                var timer = (until - now);
                if(timer < 0)
                {
                    timer =+ (24 * 3600);
                }
                timers[counter] = new CountDownTimer(counter, args[1], timer, channelID);    
                counter++;
            }
        }
    }
}

timerCommands = function(args, channelID, command){
    var timerExists = false;
    if(counter < 1){
        bot.sendMessage({
            to: channelID,
            message:  '```No active timers!```'
        });
    }
    else{
        for(var i = 0; i < counter; i++){
            if(timers[i].id == args[1]){
                switch(command){
                    case 'stop':
                        timers[i].stopInterval();
                        timerExists = true;
                    break;
                    case 'check':
                        timers[i].checkCountDown();
                        timerExists = true;
                    break;
                }
                break;
            }
        }
        if(!timerExists){
            bot.sendMessage({
                to: channelID,
                message:  '```Timer with that id does not exist!```'
            });
        }
    }
}

helpTimer = function(channelID){
    bot.sendMessage({
        to: channelID,
        message:  '```Info:\n\tThere can be maximum to five timers active at the same time.\n\tYou can write !t instead of !timer\nLegend:\n\tId -> Name of the timer (without spaces)\n\tTime -> Can be in seconds or in a specific time: 100 or 10:10\nTemplates:\n\tTo start a timer:\n\t\t!timer "id" start "time"\n\tTo stop a timer:\n\t\t!timer "id" stop\n\tTo check a timer:\n\t\t!timer "id" check\n\tTo output all active timers:\n\t\t!timer active\n```'
    });
}

activeTimers = function(channelID){
    if(counter > 0){
        var output = '```Id\tTime\n';
        for(var i = 0; i < counter; i++){
            output += '\n' + timers[i].id + "\t" + timers[i].getTime();
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