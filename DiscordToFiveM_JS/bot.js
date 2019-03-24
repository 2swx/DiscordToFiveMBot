const Discord = require("discord.js");
const HttpRequest = require("request");
const Client = new Discord.Client();
const Config = require("./config.json");
const Servs = require("./servers.json");
const Lang = require("./language.json");
const Chans = require("./channels.json");
var Reason = "";

Client.on("ready", () => {
	console.log(`Bot has started, with ${Client.users.size} users, in ${Client.channels.size} channels of ${Client.guilds.size} guilds.`); 
	CheckForUpdate();
	Client.user.setActivity(`Discord To FiveM`);
});

Client.on("guildCreate", guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

Client.on("guildDelete", guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

Client.on("message", async message => {
	if(message.author.bot) return;
	if(message.content.indexOf(Config.prefix) !== 0) return;

	const args = message.content.slice(Config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	const ChannelCheck = IsChannelAllowed(message.channel.id, command);
	
	if (ChannelCheck === true) {
		if (command === "cmdlist" || command === "serverlist") {
			ReturnMessageToDiscord(message, "", command, "", "");
			return message.delete().catch(O_o=>{}); 
		};
		
		if (args.length !== 0) {

			const ServerInformations = GetServerInformations(message, args.shift().toLowerCase());
			
			if (ServerInformations !== false && ServerInformations !== undefined) {
				if (command === "chkcon") {
					HTTPReq(message, ServerInformations[0], ServerInformations[1], ServerInformations[2], "chkcon");
				};
			
				if (command === "getclients") {
					HTTPReq(message, ServerInformations[0], ServerInformations[1], ServerInformations[2], "getclients");
				};
			
				if (command === "send") {
					var TheActualMessage = args.join(" ");
					if (TheActualMessage.length > 0 && TheActualMessage !== "<MESSAGE>") {
						HTTPReq(message, ServerInformations[0], ServerInformations[1], ServerInformations[2], "send", TheActualMessage);
					} else {
						message.reply(Lang.sendNoMessage);
					};
				};

				if (command === "kick") {
					var ServerID = parseInt(args[0], 10);

					if (ServerID) {
						args.splice(0, 1);
						var TheActualReason = args.join(" ");
						
						if (ServerID < 10) {
							ServerID = "0" + ServerID;
						};
						
						if (TheActualReason.length > 0 && TheActualReason !== "<REASON>") {
							Reason = TheActualReason;
							HTTPReq(message, ServerInformations[0], ServerInformations[1], ServerInformations[2], "kick", ServerID + "/" + TheActualReason);
						} else {
							message.reply(Lang.kickbanNoReason);
						};
					} else {
						message.reply(Lang.kickbanNoServerID);
					};
				};
			
				if (command === "ban") {
					var ServerID = parseInt(args[0], 10);
					
					if (ServerID) {
						args.splice(0, 1);
						var TheActualReason = args.join(" ");

						if (ServerID < 10) {
							ServerID = "0" + ServerID;
						};
						
						if (TheActualReason.length > 0 && TheActualReason !== "<REASON>") {
							Reason = TheActualReason;
							HTTPReq(message, ServerInformations[0], ServerInformations[1], ServerInformations[2], "ban", ServerID + "/" + TheActualReason);
						} else {
							message.reply(Lang.kickbanNoReason);
						};
					} else {
						message.reply(Lang.kickbanNoServerID);
					};
				};
			};
			
		} else {
			message.reply(Lang.NoServerSpecified);
		};
	};
	message.delete().catch(O_o=>{}); 
});

Client.login(Config.token);

function GetServerInformations(message, name) {	
	var server = "Servs." + name;
	server = eval(server);
	
	if (server == null || server == "" || server == "{}"  || server.ip == undefined || server.port == undefined){
		message.reply(Lang.SpecifiedServerNotAvailable);
		return false;
	} else {
		var infos = [server.ip + ":" + server.port, server.password, server.sender]
		return infos;
	};
}

function HTTPReq(message, IPandPort, Password, Sender, Path, AdditionalPath) {
	if (AdditionalPath !== undefined && AdditionalPath !== "" && AdditionalPath !== null) {
		AdditionalPath = "?" + AdditionalPath
	} else {
		AdditionalPath = ""
	};
	
	HttpRequest(
				{
				 url: "http://" + IPandPort + "/DiscordToFiveM/" + Password + "/" + Sender + "/" + Path + AdditionalPath,
				 timeout: 5000,
				 time: true
				},
				function (Error, Response, Body) {
					ReturnMessageToDiscord(message, IPandPort, Path, Body);
				}
			   );	
	
}

function ReturnMessageToDiscord(message, IPandPort, Path, Data) {	
	var ReturnChannels = GetReturnChannels(message, Path);
	var DataSplitted;
	
	if (Data  !== undefined && Data.length > 0) {
		DataSplitted = Data.split(" ");
	} else {
		DataSplitted = ['', '', ''];
	};

	ReturnChannels.forEach(function(channel) {
		switch(Path) {
			case "cmdlist":
				var EmbedCommandList = new Discord.RichEmbed()
				.setTitle(Lang.CommandList + ":")
				.addField(Config.prefix + "cmdlist", Lang.cmdlistDesc)
				.addField(Config.prefix + "serverlist", Lang.serverlistDesc)
				.addField(Config.prefix + "chkcon <SERVER>", Lang.chkconDesc)
				.addField(Config.prefix + "getclients <SERVER>", Lang.getclientsDesc)
				.addField(Config.prefix + "send <SERVER> <MESSAGE>", Lang.sendDesc)
				.addField(Config.prefix + "kick <SERVER> <SERVER_ID> <REASON>", Lang.kickDesc)
				.addField(Config.prefix + "ban <SERVER> <SERVER_ID> <REASON>", Lang.banDesc)
				.setColor(0x48C4A0)
				
				Client.channels.get(channel).send(EmbedCommandList);
				break;
			case "serverlist":
				var AvailableServers = ""
				for (CurrentServer in Servs) {
					if (eval("Servs." + CurrentServer + ".ip") !== "YOUR_IP_HERE") {
						AvailableServers = AvailableServers + "`" + CurrentServer + " - " + eval("Servs." + CurrentServer + ".ip") + ":" + eval("Servs." + CurrentServer + ".port") + "`\n\n"
					};
				};
				Client.channels.get(channel).send("**" + Lang.AvailableServer + ":**\n" + AvailableServers);
				break;
			case "chkcon":
				if (Data === '"Connection successfull"') {
					Client.channels.get(channel).send(Lang.chkconSuccessful);
				} else {
					Client.channels.get(channel).send(Lang.chkconUnsuccessful);
				};
				break;
			case "getclients":
				Data = Data.replace("[", "");
				Data = Data.replace("]", "");
				if (Data !== undefined && Data.length > 0 && Data !== '"Nothing"') {
					Data = Data.replace(/\u0022/g, "");
					Data = Data.replace(/;/g, "\n");
					Client.channels.get(channel).send("**" + Lang.getclientsConnectedClients + ":**\n" + Data);
				} else {
					Client.channels.get(channel).send(Lang.getclientsNoClients + " ¯\\_(ツ)_/¯");
				};
				break;
			case "send":
				if (Data === '"Sent"') {
					Client.channels.get(channel).send(message.author + "\n" + Lang.sendMessageSent + " " + IPandPort);
				} else {
					Client.channels.get(channel).send(message.author + "\n" + Lang.sendError + " " + IPandPort);
				};
				break;
			case "kick":
				if (DataSplitted[0] === '"Kicked') {
					if (Config.kickbanLogChannel !== undefined && Config.kickbanLogChannel !== "") {
						Client.channels.get(Config.kickbanLogChannel).send(message.author + " " + Lang.kickLogKicked + " " + DataSplitted[1].replace(/\u0022/g, "") + "\n" + Lang.kickbanLogReason + ": " + Reason);
					};
					Client.channels.get(channel).send(message.author + "\n" + Lang.kickKicked);
				} else {
					Client.channels.get(channel).send(message.author + "\n" + Lang.kickbanElse);
				};
				break;
			case "ban":
				if (DataSplitted[0] === '"Banned') {
					if (Config.kickbanLogChannel !== undefined && Config.kickbanLogChannel !== "") {
						var dur = ""
						if (DataSplitted[1] === "0") {
							dur = Lang.banLogBannedForever
						} else {
							dur = DataSplitted[1] + " " + Lang.banLogBannedHours
						};
						Client.channels.get(Config.kickbanLogChannel).send(message.author + " " + Lang.banLogBanned + " " + DataSplitted[2].replace(/\u0022/g, "") + "\n" + Lang.kickbanLogReason + ": " + Reason + "\n" + Lang.banLogBannedDuration + ": " + dur);
					};
					Client.channels.get(channel).send(message.author + "\n" + Lang.banBanned);
				} else {
					Client.channels.get(channel).send(message.author + "\n" + Lang.kickbanElse);
				};
				break;
			default:
		};
	});
	Reason = "";
}

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

function CheckForUpdate() {	
	const CurrentVersion = "2.0.0";
	const GithubResourceName = "DiscordToFiveMBot"

	HttpRequest(
				{
				 url: "https://raw.githubusercontent.com/Flatracer/FiveM_Resources/master/" + GithubResourceName + "/VERSION",
				 timeout: 5000,
				 time: true
				},
				function (Error, Response, NewestVersion) {
					console.log("\n");
					console.log("##############");
					console.log("## Current Version: " + CurrentVersion);
					console.log("## Newest Version: " + NewestVersion);
					console.log("##");
					if (NewestVersion === CurrentVersion) {
						console.log("## Up to date!");
						console.log("##############");
						console.log("\n");
					} else {
						console.log("## Outdated");
						console.log("## Check the Topic");
						console.log("## For the newest Version!");
						console.log("##############");
						HttpRequest(
									{
									 url: "https://raw.githubusercontent.com/Flatracer/FiveM_Resources/master/" + GithubResourceName + "/CHANGES",
									 timeout: 5000,
									 time: true
									},
									function (Error, Response, Changes) {
										console.log("CHANGES: " + Changes);
										console.log("\n");
									}
								   );	
					};
				}
			   );	
}

