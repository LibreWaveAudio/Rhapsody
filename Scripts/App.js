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
	
	//! pnlMain
	const pnlMain = Content.getComponent("pnlMain");

	pnlMain.setFileDropCallback("All Callbacks", "*.pdf", onpnlMainFileDrop);
	
	inline function onpnlMainFileDrop(obj)
	{
		Console.print(trace(obj));
	}

	pnlMain.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.fillAll(this.get("bgColour"));

		g.setColour(this.get("textColour"));
		g.fillPath(Paths.rhapsodyFullLogo, [a[0] + 20, a[1] + 32, 168, 24]);
	});

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
	
	//! Calls
	createDefaultLinkFile();	
}
