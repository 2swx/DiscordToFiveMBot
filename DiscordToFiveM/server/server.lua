local IdentifiersUsed = {'license', 'steam'}

-- Registers a HTTP request and handles it
SetHttpHandler(function(req, res)
	local Value = 'Bad Request'
	local path = URLEncode(req.path):sub(2)
	if path:sub(1, GetConvar('DTF_Password'):len()) == GetConvar('DTF_Password') then
		path = path:sub(GetConvar('DTF_Password'):len() + 2)
		local Sender = path:sub(1, path:find('/') - 1)
		path = path:sub(Sender:len() + 2)

		if req.method == 'GET' then
			if path == 'chkcon' then
				Value = 'Connection successfull'
			elseif path == 'getclients' then
				Value = 'Nothing'
				local Clients = ""

				for _, ID in ipairs(GetPlayers()) do
					if tonumber(ID) < 10 then
						ID = '0' .. tostring(ID)
					end
					Clients = Clients .. ID .. '   |   ' .. GetPlayerName(ID) .. ';'
				end

				if Clients:len() > 0 then
					Value = Clients
				end
			elseif path:sub(1, 4) == 'send' then
				local Message = path:sub(6)
				if UsingDiscordBot then
					TriggerEvent('DiscordBot:ToDiscord', 'Chat', Sender, Message, '', true)
				end
				TriggerClientEvent('chatMessage', -1, Sender, {222, 199, 132}, Message)
				Value = 'Sent'
			elseif path:sub(1, 4) == 'kick' then
				Value = nil
				path = path:sub(6)
				local ServerID = tonumber(path:sub(1, 2))
				local Reason = path:sub(4)
				local Name = GetPlayerName(ServerID)
				if Name then
					DropPlayer(ServerID, 'Kicked! Reason: ' .. Reason)
					print('>> ' .. Lang.Kicked .. ' ' .. Name .. '\n>> ' .. Lang.Reason .. ': ' .. Reason)
					if SendKickToChat then
						TriggerClientEvent('chatMessage', -1, 'DiscordToFiveM', {222, 199, 132}, Lang.Kicked .. ' ' .. Name .. '\n' .. Lang.Reason .. ': ' .. Reason)
					end
					if UsingDiscordBot then
						TriggerEvent('DiscordBot:ToDiscord', 'Chat', 'DiscordToFiveM', Lang.Kicked .. ' ' .. Name .. '\n' .. Lang.Reason .. ': ' .. Reason, '', true)
					end
					Value = 'Kicked ' .. Name
				end
			elseif path:sub(1, 3) == 'ban' then
				Value = nil
				path = path:sub(5)
				local ServerID = tonumber(path:sub(1, 2))
				local Reason = path:sub(4)
				local Name = GetPlayerName(ServerID):gsub(';', ',')
				if Name then
					local UTC = os.time(os.date('*t'))
					for i, IdentifierUsed in ipairs(IdentifiersUsed) do
						local ID = GetIDFromSource(IdentifierUsed, ServerID)
						if ID ~= nil then
							local Content = DTF_Load('BannedPlayer', IdentifierUsed:upper() .. '.txt')
							DTF_Save('BannedPlayer', IdentifierUsed:upper() .. '.txt', Content .. Name .. ';' .. ID .. ';' .. tostring(UTC) .. ';' .. Reason .. ';' .. BanDuration .. '\n')
						end
					end
					DropPlayer(ServerID, 'Banned! Reason: ' .. Reason)
					local Dur
					if BanDuration == 0 then
						Dur = Lang.Forever
					else
						Dur = BanDuration .. ' ' .. Lang.Hours
					end
					print('>> ' .. Lang.Banned .. ' ' .. Name .. '\n>> ' .. Lang.Reason .. ': ' .. Reason .. '\n>> ' ..  Lang.Duration .. ': ' .. Dur)
					if SendBanToChat then
						TriggerClientEvent('chatMessage', -1, 'DiscordToFiveM', {222, 199, 132}, Lang.Banned .. ' ' .. Name .. '\n' .. Lang.Reason .. ': ' .. Reason .. '\n' ..  Lang.Duration .. ': ' .. Dur)
					end
					if UsingDiscordBot then
						TriggerEvent('DiscordBot:ToDiscord', 'Chat', 'DiscordToFiveM', Lang.Banned .. ' ' .. Name .. '\n' .. Lang.Reason .. ': ' .. Reason .. '\n' ..  Lang.Duration .. ': ' .. Dur, '', true)
					end
					Value = 'Banned ' .. BanDuration .. ' ' .. Name
				end
			end
		end
	end
	res.send(json.encode(Value))
end)

AddEventHandler('playerConnecting', function(playerName, setKickReason) --Checks if a Player is banned and kicks him if needed
	for i, IdentifierUsed in ipairs(IdentifiersUsed) do
		local UTC = os.time(os.date('*t'))
		local Content = DTF_Load('BannedPlayer', IdentifierUsed:upper() .. '.txt')
		if Content ~= nil and Content ~= '' then
			local Splitted = stringsplit(Content, '\n')
			if #Splitted >= 1 then
				for i, line in ipairs(Splitted) do
					local lineSplitted = stringsplit(line, ';')
					local BanName = lineSplitted[1]
					local BanID = lineSplitted[2]
					local BanTimeThen = tonumber(lineSplitted[3])
					local BanReason = lineSplitted[4]
					local BanDuration = tonumber(lineSplitted[5])
					if BanID == GetIDFromSource(IdentifierUsed, source) then
						if BanDuration == 0 then
							setKickReason('You are banned forever! Reason: ' .. BanReason)
							CancelEvent()
							return
						else
							local Duration = BanDuration * 3600
							local PassedTime = UTC - BanTimeThen
							if PassedTime > Duration then
								DTF_Save('BannedPlayer', IdentifierUsed:upper() .. '.txt', Content:gsub(line .. '\n', ''))
							else
								local Remaining, RemainingString = math.floor(Duration - PassedTime), ' Seconds'
								if round((Remaining / 60), 1) < 60 then
									Remaining, RemainingString = round((Remaining / 60), 1), ' Minutes'
								else
									Remaining, RemainingString = round((round((Remaining / 60), 1) / 60), 1), ' Hours'
								end
								setKickReason('You are still banned for ' .. Remaining .. RemainingString .. '! Reason: ' .. BanReason)
								CancelEvent()
								return
							end
						end
					end
				end
			end
		end
	end
end)

-- Functions
function URLEncode(String)
	String = string.gsub(String, "+", " ")
	String = string.gsub(String, "%%(%x%x)", function(H)
		return string.char(tonumber(H, 16))
	end)
	return String
end

function stringsplit(input, seperator)
	if seperator == nil then
		seperator = '%s'
	end
	
	local t={} ; i=1
	
	for str in string.gmatch(input, '([^'..seperator..']+)') do
		t[i] = str
		i = i + 1
	end
	
	return t
end

function round(num, numDecimalPlaces)
	local mult = 10^(numDecimalPlaces or 0)
	return math.floor(num * mult + 0.5) / mult
end

function GetOSSep()
	if os.getenv('HOME') then
		return '/'
	end
	return '\\'
end

function DTF_Save(Folder, File, Content)
	local UnusedBool = SaveResourceFile(GetCurrentResourceName(), Folder .. GetOSSep() .. File, Content, -1)
end

function DTF_Load(Folder, File)
	local Content = LoadResourceFile(GetCurrentResourceName(), Folder .. GetOSSep() .. File)
	return Content
end

function GetIDFromSource(Type, ID) --(Thanks To WolfKnight [forum.FiveM.net])
    local IDs = GetPlayerIdentifiers(ID)
    for k, CurrentID in pairs(IDs) do
        local ID = stringsplit(CurrentID, ':')
        if (ID[1]:lower() == string.lower(Type)) then
            return ID[2]:lower()
        end
    end
    return nil
end

-- Version Checking down here, better don't touch this
local CurrentVersion = '2.0.0'
local GithubResourceName = 'DiscordToFiveMBot'

PerformHttpRequest('https://raw.githubusercontent.com/Flatracer/FiveM_Resources/master/' .. GithubResourceName .. '/VERSION', function(Error, NewestVersion, Header)
	PerformHttpRequest('https://raw.githubusercontent.com/Flatracer/FiveM_Resources/master/' .. GithubResourceName .. '/CHANGES', function(Error, Changes, Header)
		print('\n')
		print('##############')
		print('## ' .. GetCurrentResourceName())
		print('##')
		print('## Current Version: ' .. CurrentVersion)
		print('## Newest Version: ' .. NewestVersion)
		print('##')
		if CurrentVersion ~= NewestVersion then
			print('## Outdated')
			print('## Check the Topic')
			print('## For the newest Version!')
			print('##############')
			print('CHANGES: ' .. Changes)
		else
			print('## Up to date!')
			print('##############')
		end
		print('\n')
	end)
end)

