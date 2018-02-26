const Discord = require("discord.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const client = new Discord.Client();
const config = require("./config.json");
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
		message.channel.send("Command List:\n`" + config.prefix + "cmdlist` - Shows a list of commands\n\n`" + config.prefix + "send [MESSAGE]` - Sends a chat message to the FiveM server\n\n`" + config.prefix + "getclients` - Gets the connected clients of the FiveM Server\n\n`" + config.prefix + "kick [SERVERID] [REASON]` - Kicks a client from the FiveM server");
	} else {
		if(config.password.length > 0) {
			if(config.ip.length > 0) {
				if(config.port.length > 0) {
					if(command === "send") {
						var TheMessage = args.join(" ");
						var request = new XMLHttpRequest();

						request.onload = function () {
							var status = request.status;
							var data = request.responseText;
							if (data === '"Successful"') {
								message.reply("Message sent to FiveM!");
							} else {
								message.reply("ERROR!\nCouldn't send the message to FiveM");
							}
						}

						request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/sendmessage?MESSAGE=" + TheMessage, true);

						request.setRequestHeader("Content-type", "application/json");
						
						request.send();
					}
				  
					if(command === "getclients") {
						var request = new XMLHttpRequest();

						request.onload = function () {
							var status = request.status;
							var data = request.responseText;
							var data = data.replace("[", "");
							var data = data.replace("]", "");
							console.log(data)
							if (typeof data !== 'undefined' && data.length > 0 && data !== '"Nothing"') {
								var data = data.replace(/\u0022/g, "");
								var data = data.replace(/,/g, "\n");
								message.channel.send("These are the connected Clients:\n" + data);
							} else {
								message.channel.send("Seems like there are no clients... ¯\\_(ツ)_/¯");
							}
						}

						request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/getclients", true);

						request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

						request.send();
					}
				  
					if(command === "kick") {
								var ServerID = parseInt(args[0], 10);
								var request = new XMLHttpRequest();

								request.onload = function () {
									var status = request.status;
									var data = request.responseText;
									if (data === '"Kicked"') {
										message.reply("Done! The Client got kicked!");
									} else {
										message.reply("Hmm, seems like there is no Client with this ID...");
									}
								}

								if (ServerID) {
									args.splice(0, 1);
									var TheMessage = args.join(" ");

									if (TheMessage.length > 0) {
										request.open("GET", "http://" + config.ip + ":" + config.port + "/DiscordToFiveM/" + config.password + "/kick?SERVERID=" + ServerID + "REASON=" + TheMessage, true);

										request.setRequestHeader("Content-type", "application/json");
										
										request.send();
									} else {
										message.reply("Please add a Reason after the Server ID");
									}
								} else {
									message.reply("Please enter a Server ID");
								}
							}
				} else {
					message.channel.send("Please configure the port");
				}
			} else {
				message.channel.send("Please configure the IP");
			}
		} else {
			message.channel.send("Please configure the password");
		}
	}
	message.delete().catch(O_o=>{}); 
});

client.login(config.token);
