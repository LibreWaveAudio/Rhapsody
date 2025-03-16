/*
    Copyright 2023, 2025 David Healey

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

namespace UpdateChecker
{
	reg sessionCheck = App.mode == "development" ; // Only allow one check per session

	//! Functions
	inline function autoCheck()
	{
		local now = Date.getSystemTimeMs();
		local lastChecked = UserSettings.getProperty("rhapsody", "lastUpdateChecked");
		local MS_PER_WEEK = 604800000;

		if (!Account.isLoggedIn() || !App.isOnline)
			return;

		 if ((now - lastSync) < MS_PER_WEEK)
		 	return;
	
		 checkForAppUpdate();
	}

	inline function checkForAppUpdate()
	{
		local token = Account.readToken();

		if (sessionCheck || !isDefined(token) || !App.isOnline)
			return;

		local endpoint = App.apiPrefix + "check_for_app_update/";
		local headers = ["Authorization: Bearer " + token];
		local p = {"user_version": Engine.getVersion()};

		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.setHttpHeader(headers.join("\n"));

		Server.callWithGET(endpoint, p, function(status, response)
		{
			if (!status == 200 || !response[0])
				return;

			var message = parseBody(response[0].body, response[0].version);
			
			Engine.showYesNoWindow("Update Available", message, function(response)
			{
				if (response)					
					Engine.openWebsite(Engine.getProjectInfo().CompanyURL);
			});
			
			UserSettings.setProperty("rhapsody", "lastUpdateChecked", Date.getSystemTimeMs());
			sessionCheck = true;
		});
	}

	inline function parseBody(body, version)
	{
		local heading = Engine.getName() + " " + version + " is available with the following changes:";	
		local lines = body.replace("\n").trim().split("\r\n");
		local numLines = lines.length + 3;
		local changelog = "\r\n";

		for (l in lines)
		{
			local text = l;

			if (l.contains("#") || l.contains("made their first") || l.contains("Full Changelog"))
			{
				numLines--;
				continue;
			}

			if (l.contains("by @"))
				text = l.substring(0, l.indexOf("by @"));

			if (text.length > 60)
				text = text.substring(0, 55) + "...";

			if (text.charAt(0) != "*" && text.charAt(0) != "-")
				text = "-" + text;

			changelog += text + "\r\n";
		}

		changelog = changelog.replace("*", "-");
		
		local question = "Would you like to download the update now?";
		
		return heading + changelog + question;
	}
	
	//! Calls
	Account.broadcasters.loggedIn.addListener("Library login", "Respond to login changes", function(state)
	{
		if (state)
			return autoCheck();
	});	
}