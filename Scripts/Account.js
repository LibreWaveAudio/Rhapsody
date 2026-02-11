/*
    Copyright 2021, 2022, 2023, 2025 David Healey

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

namespace Account
{
	const appData = FileSystem.getFolder(FileSystem.AppData);

	//! Functions
	inline function logoutWithPrompt()
	{
		Engine.showYesNoWindow("Logout", "Do you want to log out?", function(response)
		{
			if (response)
				logout();
		});
	}
	
	inline function logout()
	{
		deleteToken();
		broadcasters.loggedIn.state = false;
	}

	inline function login(username: string, password: string)
	{
		local p = {"username": username.trim(), "password": password};

		if (!App.isOnline)
			return Engine.showMessageBox("Offline", "You need to be connected to the internet to do this.", 3);

		if (!isDefined(username) || username == "")
			return Engine.showMessageBox("Invalid Email", "Please enter a valid email address or username.", 3);

		if (!isDefined(password) || password == "")
			return Engine.showMessageBox("Invalid Password", "Please enter a valid password.", 3);

		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);

		Server.callWithPOST("wp-json/jwt-auth/v1/token", p, function(status, response)
		{
			if (status == Server.StatusOK && isDefined(response.data.token))
		        onLoginSuccess(response.data.token);
		    else
				onLoginFailed(response);
		});
	}

	inline function onLoginSuccess(token: string)
	{
		writeToken(token);
		UserSettings.setProperty("rhapsody", "workOffline", false);
		broadcasters.loggedIn.state = true;
	}
	
	inline function onLoginFailed(response: object)
	{
		if (status == Server.StatusNoConnection)
			return Engine.showMessageBox("The server could not be reached. The Libre Wave website might be down. Please try again later.", msg, 1);

		local msg = "A server error occurred. Please try again later.";

		if (isDefined(response.message))
		{
			if (response.message.contains("The password you entered"))
				msg = "The password you entered is incorrect.";
			else if (response.message.contains("The username"))
				msg = "Unknown username. Check again or try your email address instead.";
			else
				msg = response.message;
		}

		Engine.showMessageBox("Log in failure", msg, 1);
	}
		
   	inline function deleteToken()
	{
		local f = appData.getChildFile("Credentials.json");

		if (f.isFile())
			f.deleteFileOrDirectory();
	}

	inline function writeToken(token: string)
	{
		local data = {"token": token};
		local f = appData.getChildFile("Credentials.json");

		f.writeEncryptedObject(data, FileSystem.getSystemId());
	}
    
	inline function: string readToken()
	{
		local f = appData.getChildFile("Credentials.json");

		if (!isDefined(f) || !f.isFile())
			return "";

		local data = f.loadEncryptedObject(FileSystem.getSystemId());

		if (!isDefined(data) || !isDefined(data.token))
			return "";

		return data.token;
	}

	inline function: number isLoggedIn()
	{
		return readToken() != "" && App.isOnline;
	}

	//! Broadcasters
	const broadcasters = {};
	
	//! loggedIn
	broadcasters.loggedIn = Engine.createBroadcaster({id: "loggedIn", args: ["state"]});
	
	const bcUserMenuValue = Engine.createBroadcaster({id: "bcLogoutMenuValue", args: ["component", "value"]});
	bcUserMenuValue.attachToComponentValue("cmbUserMenu", "");
	
	bcUserMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		if (component.getItemText().toLowerCase() != "logout")
			return;
	
		logoutWithPrompt();
	});

	//! Calls
	broadcasters.loggedIn.state = isLoggedIn();
}