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

namespace App
{
	const mode = "development";
	
	const isOnline = Server.isOnline();

	Synth.deferCallbacks(true);
	
	Engine.loadAudioFilesIntoPool();
	
	const systemId = FileSystem.getSystemId();
	
	const apiPrefix = "wp-json/librewave/v1/";
	
	const baseUrl = {
		"development": "http://192.168.0.40/",
		"testing": "http://192.168.0.40/",
		"staging": "https://librewave.com/",
		"release": "https://librewave.com/"
	};
	
	const broadcasters = {
		downloading: Engine.createBroadcaster({id: "Global download State", args: ["state", "progress"]}),
		isLoggedIn: Engine.createBroadcaster({id: "Triggered when user logs in or out", args: ["state"]})
	};
		
	broadcasters.downloading.addComponentPropertyListener(["btnSync", "cmbAdd", "btnLogin", "btnLogout"], "enabled", "meta", function(index, state, progress)
	{
		return !state;
	});
	
	broadcasters.downloading.sendAsyncMessage([false, -1]);
	
	//! Functions
	inline function createDefaultLinkFile()
	{
		local filename = "";
		local appData = FileSystem.getFolder(FileSystem.AppData);

		switch (Engine.getOS())
		{
			case "OSX": filename = "LinkOSX"; break;
			case "LINUX": filename = "LinkLinux"; break;
			case "WIN": filename = "LinkWindows"; break;
		}

		local f = appData.getChildFile(filename);
	
		if (!isDefined(f) || !f.isFile())
			f.writeString(appData.toString(appData.FullPath));		
	}
	
	createDefaultLinkFile();	
}
