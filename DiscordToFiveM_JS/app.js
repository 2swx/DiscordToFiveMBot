const Discord = require("discord.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const client = new Discord.Client();
const config = require("./config.json");
const lang = require("./lang.json");
client.on("ready", () => {
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  client.user.setActivity(`Discord To FiveM`);
});

client.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});


client.on("message", async message => {
	if(message.author.bot) return;
	if(message.content.indexOf(config.prefix) !== 0) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	
	if(command === "cmdlist") {
		message.channel.send("" + lang.CommandList + ":\n`" + config.prefix + "cmdlist` - " + lang.cmdlistDesc + "\n\n`" + config.prefix + "chkcon` - " + lang.chkconDesc + "\n\n`" + config.prefix + "send [MESSAGE]` - " + lang.sendDesc + "\n\n`" + config.prefix + "getclients` - " + lang.getclientsDesc + "\n\n`" + config.prefix + "kick [" + lang.SERVERID + "] [" + lang.REASON + "]` - " + lang.kickDesc + "\n\n`" + config.prefix + "ban [" + lang.SERVERID + "] [" + lang.REASON + "]` - " + lang.banDesc + "");
	} else if (command === "chkcon") {
		var request = new XMLHttpRequest();

		request.onload = function () {
			var status = request.status;
			var data = request.responseText;
			if (data === '"Connection successfull"') {
				message.channel.send(lang.chkconSuccessful);
			} else {
				message.channel.send(lang.chkconUnsuccessful);
			}
		}

		request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/chkcon", true);

		request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

		request.send();
	} else {
		if(config.password.length > 0) {
			if(config.ip.length > 0) {
				if(config.port.length > 0) {
					if(command === "send") {
						var TheMessage = args.join(" ");
						if (TheMessage.length > 0) {
							var request = new XMLHttpRequest();

							request.onload = function () {
								var status = request.status;
								var data = request.responseText;
								if (data === '"Successful"') {
									message.reply(lang.sendMessageSent);
								} else if (data === '"Message invalid"'){
									message.reply(lang.sendErrorMessage);
								} else {
									message.reply(lang.sendError);
								}
							}

							request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/sendmessage?SENDER=" + config.sender + "MESSAGE=" + TheMessage, true);

							request.setRequestHeader("Content-type", "application/json");
							
							request.send();
						} else {
							message.reply("Please enter a message");
						}
					} else if(command === "getclients") {
						var request = new XMLHttpRequest();

						request.onload = function () {
							var status = request.status;
							var data = request.responseText;
							var data = data.replace("[", "");
							var data = data.replace("]", "");
							if (typeof data !== 'undefined' && data.length > 0 && data !== '"Nothing"') {
								var data = data.replace(/\u0022/g, "");
								var data = data.replace(/,/g, "\n");
								message.channel.send(lang.getclientsConnectedClients + ":\n" + data);
							} else {
								message.channel.send(lang.getclientsNoClients + " ¯\\_(ツ)_/¯");
							}
						}

						request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/getclients", true);

						request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

						request.send();
					} else if(command === "kick") {
						var ServerID = parseInt(args[0], 10);
						var request = new XMLHttpRequest();

						request.onload = function () {
							var status = request.status;
							var data = request.responseText;
							if (data === '"Kicked"') {
								message.reply(lang.kickKicked);
							} else {
								message.reply(lang.kickbanElse);
							}
						}

						if (ServerID) {
							args.splice(0, 1);
							var TheMessage = args.join(" ");

							if (TheMessage.length > 0 && TheMessage !== "[MESSAGE]") {
								request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/kick?SERVERID=" + ServerID + "REASON=" + TheMessage, true);

								request.setRequestHeader("Content-type", "application/json");
								
								request.send();
							} else {
								message.reply(lang.kickbanNoReason);
							}
						} else {
							message.reply(lang.kickbanNoServerID);
						}
					} else if(command === "ban") {
						var ServerID = parseInt(args[0], 10);
						var request = new XMLHttpRequest();

						request.onload = function () {
							var status = request.status;
							var data = request.responseText;
							if (data === '"Banned"') {
								message.reply(lang.banBanned);
							} else {
								message.reply(lang.kickbanElse);
							}
						}

						if (ServerID) {
							args.splice(0, 1);
							var TheMessage = args.join(" ");

							if (TheMessage.length > 0) {
								request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/ban?SERVERID=" + ServerID + "REASON=" + TheMessage, true);

								request.setRequestHeader("Content-type", "application/json");
								
								request.send();
							} else {
								message.reply(lang.kickbanNoReason);
							}
						} else {
							message.reply(lang.kickbanNoServerID);
						}
					}
				} else {
					message.channel.send(lang.NoPort);
				}
			} else {
				message.channel.send(lang.NoIP);
			}
		} else {
			message.channel.send(lang.NoPassword);
		}
	}
	message.delete().catch(O_o=>{}); 
});

client.login(config.token);

