-- Registers a HTTP request and handles it
SetHttpHandler(function(req, res)
	local Value = 'Bad Request'
	local path = URLEncode(req.path)
	if path:sub(2, GetConvar('DTF_Password'):len() + 1) == GetConvar('DTF_Password') then
		path = path:sub(GetConvar('DTF_Password'):len() + 2)
	end
	
	if req.method == 'GET' then
		if path == '/chkcon' then
			Value = 'Connection successfull'
		elseif path == '/getclients' then
			Value = 'Nothing'
			local clientList = {}

			for _, ID in ipairs(GetPlayers()) do
				table.insert(clientList, 'Name: ' .. GetPlayerName(ID) .. ' - ServerID: ' .. ID)
			end
			
			if #clientList > 0 then
				Value = clientList
			end
		elseif path:sub(1, 12) == '/sendmessage' then
			local path = path:sub(21)
			local MessageBegin, MessageEnd = path:find('MESSAGE=')
			local Sender = path:sub(1, MessageBegin - 1)
			local Message = path:sub(MessageEnd + 1)
			if Message == '[MESSAGE]' then
				Value = 'Message invalid'
			else
				if UsingDiscordBot then
					TriggerEvent('DiscordBot:ToDiscord', 'Chat', Sender, Message, '', true)
				end
				TriggerClientEvent('chatMessage', -1, Sender, {222, 199, 132}, Message)
				Value = 'Successful'
			end
		elseif path:sub(1, 5) == '/kick' then
			Value = nil
			path = path:sub(7)
			local ReasonBegin, ReasonEnd = path:find("REASON=")
			local ServerID = tonumber(path:sub(10, ReasonBegin - 1))
			local Reason = path:sub(ReasonEnd + 1)
			local Name = GetPlayerName(ServerID)
			if Name then
				DropPlayer(ServerID, 'Reason: ' .. Reason)
				print('>> Kicked ' .. Name .. '\n>> Reason: ' .. Reason)
				if SendKickToChat then
					TriggerClientEvent('chatMessage', -1, 'DiscordToFiveM', {222, 199, 132}, 'Kicked ' .. Name .. '\nReason: ' .. Reason)
				end
				if UsingDiscordBot then
					TriggerEvent('DiscordBot:ToDiscord', 'Chat', 'DiscordToFiveM', 'Kicked ' .. Name .. '\nReason: ' .. Reason, '', true)
				end
				Value = 'Kicked'
			end
		elseif path:sub(1, 4) == '/ban' then
			Value = nil
			path = path:sub(6)
			local ReasonBegin, ReasonEnd = path:find("REASON=")
			local ServerID = tonumber(path:sub(10, ReasonBegin - 1))
			local Reason = path:sub(ReasonEnd + 1):gsub(';', ',')
			local Name = GetPlayerName(ServerID):gsub(';', ',')
			if Name then
				local UTC = os.time(os.date('*t'))
				local IDLicense = GetIDFromSource('license', ServerID)
				local IDSteam = GetIDFromSource('steam', ServerID)
				if IDLicense ~= nil then
					local Content = DTF_Load('BannedPlayer', 'LICENSE.txt')
					DTF_Save('BannedPlayer', 'LICENSE.txt', Content .. Name .. ';' .. IDLicense .. ';' .. tostring(UTC) .. ';' .. Reason .. ';' .. BanDuration .. '\n')
				end
				if IDSteam ~= nil then
					local Content = DTF_Load('BannedPlayer', 'STEAM.txt')
					DTF_Save('BannedPlayer', 'STEAM.txt', Content .. Name .. ';' .. IDSteam .. ';' .. tostring(UTC) .. ';' .. Reason .. ';' .. BanDuration .. '\n')
				end
				DropPlayer(ServerID, 'Banned! Reason: ' .. Reason)
				print('>> Banned ' .. Name .. '\n>> Reason: ' .. Reason)
				if SendBanToChat then
					TriggerClientEvent('chatMessage', -1, 'DiscordToFiveM', {222, 199, 132}, 'Banned ' .. Name .. '\nReason: ' .. Reason)
				end
				if UsingDiscordBot then
					TriggerEvent('DiscordBot:ToDiscord', 'Chat', 'DiscordToFiveM', 'Banned ' .. Name .. '\nReason: ' .. Reason, '', true)
				end
				Value = 'Banned'
			end
		end
	end
	res.send(json.encode(Value))
end)

AddEventHandler('playerConnecting', function(playerName, setKickReason) --Checks if a Player is banned and kicks him if needed
	local UTC = os.time(os.date('*t'))

	local LICENSEContent = DTF_Load('BannedPlayer', 'LICENSE.txt')
	if LICENSEContent ~= nil and LICENSEContent ~= '' then
		local Splitted = stringsplit(LICENSEContent, '\n')
		if #Splitted >= 1 then
			for i, line in ipairs(Splitted) do
				local lineSplitted = stringsplit(line, ';')
				local BanName = lineSplitted[1]
				local BanID = lineSplitted[2]
				local BanTimeThen = tonumber(lineSplitted[3])
				local BanReason = lineSplitted[4]
				local BanDuration = tonumber(lineSplitted[5])
				if BanID == GetIDFromSource('license', source) then
					if BanDuration == 0 then
						setKickReason('You are banned forever! Reason: ' .. BanReason)
						CancelEvent()
					else
						local Duration = BanDuration * 3600
						local PassedTime = UTC - BanTimeThen
						if PassedTime > Duration then
							DTF_Save('BannedPlayer', 'LICENSE.txt', LICENSEContent:gsub(line .. '\n', ''))
						else
							local Remaining
							if math.floor(Duration - PassedTime) < 60 then
								Remaining = math.floor(Duration - PassedTime) .. ' Seconds'
							elseif round((math.floor(Duration - PassedTime) / 60), 1) < 60 then
								Remaining = round((math.floor(Duration - PassedTime) / 60), 1) .. ' Minutes'
							else
								Remaining = round((round((math.floor(Duration - PassedTime) / 60), 1) / 60), 1) .. ' Hours'
							end
							setKickReason('You are still banned for ' .. Remaining .. '! Reason: ' .. BanReason)
							CancelEvent()
							return
						end
					end
				end
			end
		end
	end
	
	local STEAMContent = DTF_Load('BannedPlayer', 'STEAM.txt')
	if STEAMContent ~= nil and STEAMContent ~= '' then
		local Splitted = stringsplit(STEAMContent, '\n')
		if #Splitted >= 1 then
			for i, line in ipairs(Splitted) do
				local lineSplitted = stringsplit(line, ';')
				local BanName = lineSplitted[1]
				local BanID = lineSplitted[2]
				local BanTimeThen = tonumber(lineSplitted[3])
				local BanReason = lineSplitted[4]
				local BanDuration = tonumber(lineSplitted[5])
				if BanID == GetIDFromSource('steam', source) then
					if BanDuration == 0 then
						setKickReason('You are banned forever! Reason: ' .. BanReason)
						CancelEvent()
					else
						local Duration = BanDuration * 3600
						local PassedTime = UTC - BanTimeThen
						if PassedTime > Duration then
							DTF_Save('BannedPlayer', 'STEAM.txt', STEAMContent:gsub(line .. '\n', ''))
						else
							local Remaining
							if math.floor(Duration - PassedTime) < 60 then
								Remaining = math.floor(Duration - PassedTime) .. ' Seconds'
							elseif round((math.floor(Duration - PassedTime) / 60), 1) < 60 then
								Remaining = round((math.floor(Duration - PassedTime) / 60), 1) .. ' Minutes'
							else
								Remaining = round((round((math.floor(Duration - PassedTime) / 60), 1) / 60), 1) .. ' Hours'
							end
							setKickReason('You are still banned for ' .. Remaining .. '! Reason: ' .. BanReason)
							CancelEvent()
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
local CurrentVersion = '1.1.0'
local GithubResourceName = 'DiscordToFiveMBot'

PerformHttpRequest('https://raw.githubusercontent.com/Flatracer/FiveM_Resources/master/' .. GithubResourceName .. '/VERSION', function(Error, NewestVersion, Header)
	PerformHttpRequest('https://raw.githubusercontent.com/Flatracer/FiveM_Resources/master/' .. GithubResourceName .. '/CHANGES', function(Error, Changes, Header)
		print('\n')
		print('##############')
		print('## ' .. GithubResourceName)
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

