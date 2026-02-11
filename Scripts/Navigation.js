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
	
	//! Look and Feel
	const laf = Content.createLocalLookAndFeel();
	
	laf.registerFunction("drawToggleButton", function(g, obj)
	{
		 var a = obj.area;

		 if (!obj.enabled)
		 	g.setColour(Colours.withAlpha(obj.textColour, 0.2));
		 else	
		 	g.setColour(Colours.withAlpha(obj.textColour, (obj.value ? 0.9 + (0.1 * obj.over) : 0.5 + (0.3 * obj.over))));

		 g.setFont("phosphorFill", 18);
		 g.drawAlignedText(LookAndFeel.getIcon(obj.text), a, "left");
		 
		 g.setFont("medium", 18);
		 g.drawAlignedText(obj.text, a, "right");
	});

	//! pnlPages
	const pnlPages = Pager.create("pnlPages", "pnlNavigation", 1);
	
	//! pnlNavigation
	const pnlNavigation = pnlPages.data.buttonContainer;

	//! btnPage
	const btnPage = Content.getAllComponents("btnPage\\d");

	for (x in btnPage)
		x.setLocalLookAndFeel(laf);

	//! Functions
	inline function setButtonPositions()
	{
		local margin = 25;
		local x = 0;

		for (i = 0; i < btnPage.length; i++)
		{
			btnPage[i].set("x", x);
			x += btnPage[i].get("width") + margin;
		}

		pnlNavigation.set("width", x - margin);
	}
	
	//! Function Calls
	setButtonPositions();

	//! Broadcasters
	Account.broadcasters.loggedIn.addListener(0, "Respond to changes in logged in status", function(state)
	{
		btnPage[0].setValue(1);
		btnPage[0].changed();
		btnPage[1].set("enabled", state);
	});
}
