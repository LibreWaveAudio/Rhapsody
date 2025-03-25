/*
    Copyright 2025 David Healey

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

	//! pnlPages
	const pnlPages = Pager.create("pnlPages", "pnlMenu", 1);
	
	//! pnlMenu
	const pnlMenu = pnlPages.data.buttonContainer;

	//! btnPage
	const btnPage = Content.getAllComponents("btnPage\\d");

	for (x in btnPage)
		x.setLocalLookAndFeel(LookAndFeel.iconButtonToggle);

	//! btnLogout
	const btnLogout = Content.getComponent("btnLogout");

	//! Functions
	inline function setButtonPositions(online: number)
	{
		local onlineButtonIndexes = [2, 3];
		local buttons = [];

		for (i = 0; i < btnPage.length; i++)
		{
			btnPage[i].showControl(false);

			if (!btnPage[i].get("enabled"))
				continue;

			if (online || !onlineButtonIndexes.contains(i))
				buttons.push(btnPage[i]);
		}

		local numButtons = buttons.length; // Add 1 for login button
		local buttonWidth = buttons[0].getWidth();
		local totalButtonWidth = numButtons * buttonWidth;
		local margin = (pnlMenu.getWidth() - totalButtonWidth) / (numButtons - 1);

		for (i = 0; i < buttons.length; i++)
		{
			local x = i * (buttonWidth + margin);
			buttons[i].set("x", x);
			buttons[i].showControl(true);
		}
	}

	//! Broadcasters
	Account.broadcasters.loggedIn.addComponentPropertyListener("btnPage5", "enabled", "Set login button enabled state based on logged in state", function(index, state)
	{
		return !state;
	});
	
	Account.broadcasters.loggedIn.addListener({}, "Respond to changes in logged in status", function(state)
	{
		setButtonPositions(state && App.isOnline);		
		//btnPage[0].setValue(1);
		//btnPage[0].changed();
	});

	Downloader.broadcasters.isDownloading.addComponentPropertyListener("pnlMenu", "enabled", "Disable menu during downloads", function(index, state)
	{
		downloadInstallStates[0] = state;
		return !downloadInstallStates.contains(true);
	});

	Installer.broadcasters.isInstalling.addComponentPropertyListener("pnlMenu", "enabled", "Disable menu during install", function(index, state)
	{
		downloadInstallStates[1] = state;
		return !downloadInstallStates.contains(true);
	});

}
