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

namespace Menu
{
	const downloadInstallStates = [0, 0];

	reg loggedIn;

	//! cmbMenu
	const cmbMenu = Content.getComponent("cmbMenu");
	
	const lafcmbMenu = Content.createLocalLookAndFeel();
	cmbMenu.setLocalLookAndFeel(lafcmbMenu);
	cmbMenu.setControlCallback(oncmbMenuControl);
	
	inline function oncmbMenuControl(component, value)
	{
		component.setValue(-1);
	}

	lafcmbMenu.registerFunction("drawComboBox", function(g, obj)
	{
		var c = Colours.withMultipliedBrightness(obj.textColour, obj.hover ? 1.0 - 0.3 * obj.down : 0.8);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

		g.setFont("phosphorBold", obj.area[2]);
		g.drawAlignedText("\ue208", obj.area, "centred");
	});

	lafcmbMenu.registerFunction("drawPopupMenuBackground", function(g, obj)
	{
	   	LookAndFeel.drawPopupMenuBackground();
	});

	lafcmbMenu.registerFunction("drawPopupMenuItem", function(g, obj)
	{
		LookAndFeel.drawPopupMenuItem();
	});

	lafcmbMenu.registerFunction("getIdealPopupMenuItemSize", function(obj)
	{
		var width = Engine.getStringWidth(obj.text, "regular", 18, 0.0) + 60;		
		return [width, 30];
	});

	//! Functions
	inline function updateMenuItems()
	{
		local items = ["Install Instrument from LWZ File", "Install Instruments from Folder"];
		
		items.push(loggedIn ? "Add License" : "~~Add License~~");
		items.push(loggedIn ? "Check for Updates" : "~~Check for Updates~~");
		items.push(loggedIn ? "Logout" : "Sign In");

		cmbMenu.set("items", items.join("\n"));
	}

	//! Broadcasters	
	Account.broadcasters.loggedIn.addListener(0, "Respond to changes in logged in status", function(state)
	{
		loggedIn = state;
		updateMenuItems();
	});

	Downloader.broadcasters.isDownloading.addListener(0, "Respond to download start/end", function(state)
	{
		downloadInstallStates[0] = state;
		cmbMenu.set("enabled", !downloadInstallStates.contains(true));
	});
	
	Installer.broadcasters.isInstalling.addListener(0, "Respond to install start/end", function(state)
	{
		downloadInstallStates[1] = state;
		cmbMenu.set("enabled", !downloadInstallStates.contains(true));
	});
}
