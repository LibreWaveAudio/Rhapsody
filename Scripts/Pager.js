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

namespace Pager
{
	inline function: ScriptObject create(pageContainerId: string, buttonContainerId: string, radioGroup: number)
	{
		local panel = Content.getComponent(pageContainerId);
		local buttonContainer = Content.getComponent(buttonContainerId);
		local buttons = [];
		local pages = [];

		for (x in buttonContainer.getChildComponents())
		{
			if (x.get("parentComponent") != buttonContainerId)
				continue;

			if (x.get("type") == "ScriptButton")
				buttons.push(x);
		}

		for (x in panel.getChildComponents())
		{
			if (x.get("parentComponent") == pageContainerId)
				pages.push(x);
		}			

		//! Broadcaster
		panel.data.bcPager = Engine.createBroadcaster({id: "pager" + panel.getId(), args: ["buttonIndex"]});
		panel.data.bcPager.attachToRadioGroup(radioGroup, "");

		panel.data.bcPager.addComponentValueListener(buttons, "Set button values", function(indexInList, buttonIndex)
		{
			return indexInList == buttonIndex;
		});

		panel.data.bcPager.addComponentPropertyListener(pages, "visible", "Show Panels", function(indexInList, buttonIndex)
		{
			return indexInList == buttonIndex;
		});

		panel.data.buttonContainer = buttonContainer;
		return panel;	
	}
}