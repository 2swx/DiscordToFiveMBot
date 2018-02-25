SetHttpHandler(function(req, res)
	local Value = 'Bad Request'
	local path = URLEncode(req.path)
	if path:sub(2, GetConvar('DTF_Password'):len()) == GetConvar('DTF_Password') then
		path = path:sub(GetConvar('DTF_Password'):len() + 1)
	end
	
	if req.method == 'GET' then
		if path == '/getclients' then
			Value = nil
			local clientList = {}

			for _, ID in ipairs(GetPlayers()) do
				table.insert(clientList, 'Name: ' .. GetPlayerName(ID) .. ' - ServerID: ' .. ID)
			end
			
			if #clientList > 0 then
				Value = clientList
			end
		elseif path:sub(1, 12) == '/sendmessage' then
			local message = path:sub(22)
			if UsingDiscordBot then
				TriggerEvent('DiscordBot:ToDiscord', 'Chat', 'DiscordToFiveM', message, '', true)
			end
			TriggerClientEvent('chatMessage', -1, 'DiscordToFiveM', {222, 199, 132}, message)
			Value = 'Successful'
		elseif path:sub(1, 5) == '/kick' then
			Value = nil
			path = path:sub(7)
			local ReasonBegin, ReasonEnd = path:find("REASON=")
			local ServerID = tonumber(path:sub(10, ReasonBegin - 1))
			local Reason = path:sub(ReasonEnd + 1)
			local Name = GetPlayerName(ServerID)
			if Name then
				DropPlayer(ServerID, Reason)
				if UsingDiscordBot then
					TriggerEvent('DiscordBot:ToDiscord', 'Chat', 'DiscordToFiveM', 'Kicked ' .. Name .. '\nReason: ' .. Reason, '', true)
				end
				Value = 'Kicked'
			end
		end
	end
	res.send(json.encode(Value))
end)

function URLEncode(String)
	String = string.gsub(String, "+", " ")
	String = string.gsub(String, "%%(%x%x)", function(H)
		return string.char(tonumber(H, 16))
	end)
	return String
end

