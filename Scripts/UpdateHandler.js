/*
    Copyright 2023, 2025, 2026 David Healey

    This file is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This file is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with This file. If not, see <http://www.gnu.org/licenses/>.
*/

namespace UpdateHandler
{
	reg numCalls;
	
	const urls = [];
	const serverData = [];
	const expansionData = [];

	//! Functions
	inline function manualCheck()
	{
		local now = Date.getSystemTimeMs();
		local lastChecked = parseInt(UserSettings.getProperty("rhapsody", "lastUpdateChecked"));
		local msPerDay = 86400000;

		if ((now - lastChecked) < msPerDay)
			return Engine.showMessageBox("No Updates", "There are no new updates.", 0);

		if (!Server.isOnline)
			return Engine.showMessageBox("Offline", "You are currently offline.", 1);

		UserSettings.setProperty("rhapsody", "lastUpdateChecked", Date.getSystemTimeMs());

		checkForExpansionUpdates();
		checkForAppUpdate();
	}

	inline function autoCheck()
	{
		local now = Date.getSystemTimeMs();
		local lastChecked = UserSettings.getProperty("rhapsody", "lastUpdateChecked");
		local msPerMonth = 604800000 * 4;

		if (!isDefined(lastChecked))
			return UserSettings.setProperty("rhapsody", "lastUpdateChecked", Date.getSystemTimeMs());

		if (!Server.isOnline)
			return;

		if ((now - parseInt(lastChecked)) < msPerMonth)
			return;

		Engine.showYesNoWindow("Update Check", "It's been a while since you last checked for updates. Check now?", function(response)
		{
			UserSettings.setProperty("rhapsody", "lastUpdateChecked", Date.getSystemTimeMs());

			if (!response)
				return;

			checkForExpansionUpdates();
			checkForAppUpdate();
		});
	}

	inline function cacheExpansionData()
	{
		expansionData.clear();

		for (e in Expansions.getList())
		{
			if (isDefined(e.hasUpdate) && e.hasUpdate)
				continue;

			if (e.companyUrl == "")
				continue;

			if (getBlacklistCount(e.companyUrl) >= 9)
				continue;			

			expansionData.push({name: e.name, uuid: e.uuid, company: e.company, url: e.companyUrl, version: e.version});
		}
	}

	inline function: string getBaseUrl(url: string)
	{		
		local match = Engine.getRegexMatches(url, "^https?:\/\/[^\/]+");

		if (isDefined(match) && match.length != 0)
		    return match[0];

		return "";
	}

	inline function checkForExpansionUpdates()
	{
		cacheExpansionData();

		if (!expansionData.length)
			return;

		urls.clear();

		for (x in expansionData)
			urls.pushIfNotAlreadyThere(x.url);

		if (!urls.length)
			return;

		numCalls = urls.length;

		serverData.clear();

		Spinner.setText("Checking for Instrument Updates");

		for (url in urls)
		{
			Server.setBaseURL(getBaseUrl(url));

			Server.callWithGET("/rhapsody.json", {}, function(status, response)
			{
				if (status != Server.StatusOK)
					addUrlToBlacklist(urls[urls.length - numCalls]);

				numCalls--;

				if (status == Server.StatusOK)
				{
					if (!Array.isArray(response))
						response = [];

					for (x in response)
						serverData.push(x);

					if (numCalls <= 0)						
						writeToCache(serverData);						
				}
			});
		}
	}

	inline function checkForAppUpdate()
	{
		local endpoint = "api/v1/repos/librewave/rhapsody/releases/latest";

		Spinner.setText("Checking for Rhapsody Update");

		Server.setBaseURL("https://codeberg.org");

		Server.callWithGET(endpoint, {}, function(status, response)
		{
			if (status != Server.StatusOK || !isDefined(response.tag_name))
				return;
				
			if (response.tag_name.contains("beta") || response.tag_name.contains("rc"))
				return;

			var hasUpdate = compareVersion(response.tag_name, Engine.getVersion()) == 1;

			if (!hasUpdate)
				return;

			Engine.showYesNoWindow("Rhapsody Update", "A Rhapsody update is available. Go to the download page?", function(response)
			{
				if (response)
					Engine.openWebsite("https://librewave.com/rhapsody");
			});
		});
	}
	
	inline function: number getBlacklistCount(url: string)
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Blacklist.json");
		local obj = f.isFile() ? f.loadAsObject() : {};
		
		if (isDefined(obj[url]))
			return obj[url];
		
		return -1;
	}
	
	inline function addUrlToBlacklist(url: string)
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Blacklist.json");
		local obj = f.isFile() ? f.loadAsObject() : {};

		if (!isDefined(obj[url]))
			obj[url] = 0;
		else
			obj[url] = obj[url] + 1;

		f.writeObject(obj);
	}

	inline function writeToCache(data: Array)
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Cache.json");
		local obj = f.isFile() ? f.loadAsObject() : [];

		for (x in data)
		{
			local exp;

			for (k in expansionData)
			{
				if (x.uuid != "" && x.uuid == k.uuid)
					exp = k;
				else if (x.company == k.company && x.name.toLowerCase() == k.name.toLowerCase())
					exp = k;

				if (isDefined(exp))
					break;
			}

			if (!isDefined(exp))
				continue;

			exp.hasUpdate = compareVersion(x.version, exp.version) == 1;
			exp.version = x.version;
			obj.push(exp);
		}

		if (obj.length > 0)
		{
			f.writeObject(obj);
			Expansions.refresh();
		}			
	}
	
	inline function: number compareVersion(a: string, b: string)
	{
		local aParts = a.split(".");
		local bParts = b.split(".");
	
		for (i = 0; i < 3; i++)
		{
			local diff = parseInt(aParts[i]) - parseInt(bParts[i]);
			
			if (diff != 0)
				return diff > 0 ? 1 : -1;
		}
	
		return 0;
	}
	
	//! Broadcasters
	const bcUserMenuValue = Engine.createBroadcaster({id: "bcUpdateMenuValue", args: ["component", "value"]});
	bcUserMenuValue.attachToComponentValue("cmbUserMenu", "");
	
	bcUserMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		var selection = component.getItemText();

		if (selection != "Check for Updates")
			return;
			
		manualCheck();
	});
	
	//! Calls
	autoCheck();
}
