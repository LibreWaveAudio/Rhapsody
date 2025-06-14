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

namespace Navigation
{
	const downloadInstallStates = [0, 0];

	//! pnlPages
	const pnlPages = Pager.create("pnlPages", "pnlNavigation", 1);
	
	//! pnlNavigation
	const pnlNavigation = pnlPages.data.buttonContainer;

	//! btnPage
	const btnPage = Content.getAllComponents("btnPage\\d");

	for (x in btnPage)
		x.setLocalLookAndFeel(LookAndFeel.iconButtonToggle);

	//! Functions
	inline function setButtonPositions()
	{
		local buttons = [];

		for (x in btnPage)
		{
			x.showControl(false);

			if (x.get("enabled"))
				buttons.push(x);
		}

		local numButtons = buttons.length;
		local buttonWidth = buttons[0].getWidth();
		local totalButtonWidth = numButtons * buttonWidth;
		local totalSpacing = pnlNavigation.getWidth() - totalButtonWidth;
		local margin = totalSpacing / (numButtons + 1); // +1 for left and right

		for (i = 0; i < buttons.length; i++)
		{
			local x = margin + i * (buttonWidth + margin);
			buttons[i].set("x", x);
			buttons[i].showControl(true);
		}
	}

	//! Broadcasters
	Account.broadcasters.loggedIn.addListener(0, "Respond to changes in logged in status", function(state)
	{
		btnPage[1].set("enabled", state);	

		setButtonPositions();
		btnPage[0].setValue(1);
		btnPage[0].changed();
	});

	Downloader.broadcasters.isDownloading.addComponentPropertyListener("pnlNavigation", "enabled", "Disable menu during downloads", function(index, state)
	{
		downloadInstallStates[0] = state;
		return !downloadInstallStates.contains(true);
	});

	Installer.broadcasters.isInstalling.addComponentPropertyListener("pnlNavigation", "enabled", "Disable menu during install", function(index, state)
	{
		downloadInstallStates[1] = state;
		return !downloadInstallStates.contains(true);
	});
}
