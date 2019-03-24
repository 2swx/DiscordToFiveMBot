const Discordie = require("discordie");
const Events = Discordie.Events;
const Client = new Discordie();
const Config = require("./config.json");
const Lang = require("./language.json");
const Chans = require("./channels.json");
var Reason = "";
var Message;

Client.connect({ token: Config.token });

Client.Dispatcher.on(Events.GATEWAY_READY, e => {
	console.log(`Bot has started as ${Client.User.username}.`); 
});

Client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
	var message = e.message
	if(message.author.bot) return;
	if(message.content.indexOf(Config.prefix) !== 0) return;

	const args = message.content.slice(Config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	const ChannelCheck = IsChannelAllowed(message.channel.id, command);
	
	if (ChannelCheck === true) {
		Message = message
		
		if (command === "cmdlist") {
			ReturnMessageToDiscord(command, "");
			return message.delete().catch(O_o=>{}); 
		};
		
		switch(command) {
			case "getclients":
				if (args.length === 0) {
					emit("D2FiveM:Request", command);
				} else {
					message.reply(Lang.commandNoArgs);
				};
				break;
			case "send":
				var TheActualMessage = args.join(" ");
				if (TheActualMessage.length > 0 && TheActualMessage !== "<MESSAGE>") {
					emit("D2FiveM:Request", command, "^8From Discord: ^9@" + Message.author.username + "#" + Message.author.discriminator, TheActualMessage);
				} else {
					message.reply(Lang.sendNoMessage);
				};
				break;
			case "kick":
				var ServerID = parseInt(args[0], 10);

				if (ServerID) {
					args.splice(0, 1);
					var TheActualReason = args.join(" ");
					
					if (ServerID < 10) {
						ServerID = "0" + ServerID;
					};
					
					if (TheActualReason.length > 0 && TheActualReason !== "<REASON>") {
						Reason = TheActualReason;
						emit("D2FiveM:Request", command, ServerID, TheActualReason);
					} else {
						message.reply(Lang.kickbanNoReason);
					};
				} else {
					message.reply(Lang.kickbanNoServerID);
				};
				break;
			case "ban":
				var ServerID = parseInt(args[0], 10);

				if (ServerID) {
					args.splice(0, 1);
					var TheActualReason = args.join(" ");

					if (ServerID < 10) {
						ServerID = "0" + ServerID;
					};
					
					if (TheActualReason.length > 0 && TheActualReason !== "<REASON>") {
						Reason = TheActualReason;
						emit("D2FiveM:Request", command, ServerID, TheActualReason);
					} else {
						message.reply(Lang.kickbanNoReason);
					};
				} else {
					message.reply(Lang.kickbanNoServerID);
				};
				break;
			case "resourcestop":
				if (args.length === 1 || args[0] !== "<RESOURCE_NAME>") {
					emit("D2FiveM:Request", command, args[0]);
				} else {
					message.reply(Lang.resourceNoSpace);
				};
				break;
			case "resourcestart":
				if (args.length === 1 || args[0] !== "<RESOURCE_NAME>") {
					emit("D2FiveM:Request", command, args[0]);
				} else {
					message.reply(Lang.resourceNoSpace);
				};
				break;
			case "resourcerestart":
				if (args.length === 1 || args[0] !== "<RESOURCE_NAME>") {
					emit("D2FiveM:Request", command, args[0]);
				} else {
					message.reply(Lang.resourceNoSpace);
				};
				break;
			case "resourcerefresh":
				if (args.length === 0) {
					emit("D2FiveM:Request", command);
				} else {
					message.reply(Lang.commandNoArgs);
				};
				break;
			case "resourcelist":
				if (args.length === 0) {
					emit("D2FiveM:Request", command);
				} else {
					message.reply(Lang.commandNoArgs);
				};
				break;
			default:
		};
	};
	message.delete().catch(O_o=>{}); 
});

function ReturnMessageToDiscord(Command, Value1, Value2, Value3) {	
	var ReturnChannels = GetReturnChannels(Message, Command);
	
	ReturnChannels.forEach(function(channel) {
		switch(Command) {
			case "cmdlist":
				Message.channel.sendMessage("", false, {
														"color": 4768928,
														"title": Lang.CommandList + ":",
														"url":"https://forum.fivem.net/t/release-discord-to-fivem-bot/85348",
														"fields": [
																   {
																	"name": Config.prefix + "cmdlist",
																	"value": Lang.cmdlistDesc
																   },
																   {
																	"name": Config.prefix + "getclients",
																	"value": Lang.getclientsDesc
																   },
																   {
																	"name": Config.prefix + "send <MESSAGE>",
																	"value": Lang.sendDesc
																   },
																   {
																	"name": Config.prefix + "kick <SERVER_ID> <REASON>",
																	"value": Lang.kickDesc
																   },
																   {
																	"name": Config.prefix + "ban <SERVER_ID> <REASON>",
																	"value": Lang.banDesc
																   },
																   {
																	"name": Config.prefix + "resourcestop <RESOURCE_NAME>",
																	"value": Lang.resourcestopDesc
																   },
																   {
																	"name": Config.prefix + "resourcestart <RESOURCE_NAME>",
																	"value": Lang.resourcestartDesc
																   },
																   {
																	"name": Config.prefix + "resourcerestart <RESOURCE_NAME>",
																	"value": Lang.resourcerestartDesc
																   },
																   {
																	"name": Config.prefix + "resourcerefresh",
																	"value": Lang.resourcerefreshDesc
																   },
																   {
																	"name": Config.prefix + "resourcelist",
																	"value": Lang.resourcelistDesc
																   }
																  ],
														"footer": {
																   "text": "Requested by " + Message.author.username + "#" + Message.author.discriminator
																  }
														}
														   
										   );
				break;
			case "getclients":
				if (Value1 !== undefined && Value1.length > 0 && Value1 !== "Nothing") {
					Message.channel.sendMessage("**" + Lang.getclientsConnectedClients + ":**\n" + Value1);
				} else {
					Message.channel.sendMessage(Lang.getclientsNoClients + " ¯\\_(ツ)_/¯");
				};
				break;
			case "send":
				if (Value1 === "Sent") {
					Message.reply("\n" + Lang.sendMessageSent);
				} else {
					Message.reply("\n" + Lang.sendError);
				};
				break;
			case "kick":
				if (Value1 === 'Kicked') {
					if (Config.kickbanLogChannel !== undefined && Config.kickbanLogChannel !== "") {
						Client.channels.get(Config.kickbanLogChannel).send(Message.author + " " + Lang.kickLogKicked + " " + Value2 + "\n" + Lang.kickbanLogReason + ": " + Reason);
					};
					Message.reply("\n" + Lang.kickKicked);
				} else {
					Message.reply("\n" + Lang.kickbanElse);
				};
				break;
			case "ban":
				if (Value1 === 'Banned') {
					if (Config.kickbanLogChannel !== undefined && Config.kickbanLogChannel !== "") {
						var dur = ""
						if (Value3 === "0") {
							dur = Lang.banLogBannedForever
						} else {
							dur = Value3 + " " + Lang.banLogBannedHours
						};
						Client.channels.get(Config.kickbanLogChannel).send(Message.author + " " + Lang.banLogBanned + " " + Value2 + "\n" + Lang.kickbanLogReason + ": " + Reason + "\n" + Lang.banLogBannedDuration + ": " + dur);
					};
					Message.reply("\n" + Lang.banBanned);
				} else {
					Message.reply("\n" + Lang.kickbanElse);
				};
				break;
			case "resourcestop":
				if (Value1 === "Stopped") {
					Message.reply("\n" + Lang.resourcestopStopped);
				} else {
					Message.reply("\n" + Lang.resourceError);
				};
				break;
			case "resourcestart":
				if (Value1 === "Started") {
					Message.reply("\n" + Lang.resourcestartStarted);
				} else {
					Message.reply("\n" + Lang.resourceError);
				};
				break;
			case "resourcerestart":
				if (Value1 === "Restarted") {
					Message.reply("\n" + Lang.resourcerestartRestarted);
				} else {
					Message.reply("\n" + Lang.resourceError);
				};
				break;
			case "resourcerefresh":
				if (Value1 === "Refreshed") {
					Message.reply("\n" + Lang.resourcerefreshRefreshed);
				} else {
					Message.reply("\n" + Lang.resourceError);
				};
				break;
			case "resourcelist":
				Message.reply("\n```\n" + Value1 + "\n```");
				break;
			default:
		};
	});
	Reason = "";
	Message = null;
}

on('D2FiveM:Response', (Command, ResponseValue1, ResponseValue2, ResponseValue3) => {
	ReturnMessageToDiscord(Command, ResponseValue1, ResponseValue2, ResponseValue3);
});

function IsChannelAllowed(Channel, Command) {	
	const PathChannels = eval("Chans." + Command + "Channel");
	
	for (CurrentChannel in PathChannels) {
		if (eval("Chans." + Command + "Channel." + CurrentChannel) === Channel) {
			return true;
		};
	};
			
	return false;
}

function GetReturnChannels(message, Command) {	
	const PathReturnChannels = eval("Chans." + Command + "ReturnChannel");
	var AvailableChannels = [];

	for (CurrentChannel in PathReturnChannels) {
		if (eval("Chans." + Command + "ReturnChannel." + CurrentChannel) !== undefined && eval("Chans." + Command + "ReturnChannel." + CurrentChannel) !== "" && AvailableChannels.includes(eval("Chans." + Command + "ReturnChannel." + CurrentChannel)) === false) {
			AvailableChannels.splice(0, 0, eval("Chans." + Command + "ReturnChannel." + CurrentChannel));
		};
	};
			
	if (AvailableChannels.length === 0) {
		AvailableChannels.splice(0, 0, message.channel.id);
	};
	return AvailableChannels;
}

