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

namespace App
{	
	//! pnlMain
	const pnlMain = Content.getComponent("pnlMain");
	pnlMain.setFileDropCallback("All Callbacks", "*.hr1", onpnlMainFileDrop);
	
	inline function onpnlMainFileDrop(obj)
	{
		if (obj.hover)
			FileDropper.show();
	}

	pnlMain.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.fillAll(this.get("bgColour"));

		g.setFont("monoRegular", 12);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.5));
		g.drawAlignedText("v" + Engine.getVersion(), a.translated(-20, -5), "bottomRight");
		
		g.addNoise({alpha: 0.025, scaleFactor: 1.5, area: a.toArray(), monochromatic: true});
	});
	
	//! Functions	
	inline function registerMacros()
	{
		local names = [];

		for (i = 1; i < 33; i++)
			names.push("Macro " + i);

		Engine.setFrontendMacros(names);
	}

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
	registerMacros();
}
