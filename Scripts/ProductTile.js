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

namespace ProductTile
{
	inline function: ScriptObject create(parentPanel: ScriptObject, expansion: object, area: Array, options: object)
	{
		local p = parentPanel.addChildPanel();
		p.set("allowCallbacks", "All Callbacks");
		p.setPosition(area[0], area[1], area[2], area[3]);
		p.loadImage(Expansions.getIcon(expansion), "icon");
		p.set("bgColour", parentPanel.get("bgColour"));
		p.set("textColour", parentPanel.get("textColour"));
		p.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
		p.data.expansion = expansion;

		local expansionProperties = expansion.getProperties();

		for (x in expansionProperties)
			p.data[x] = expansionProperties[x];
			
		for (x in options)
			p.data[x] = options[x];

		p.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
			var fontSize = isDefined(this.data.fontSize) ? this.data.fontSize : a[2] > 200 ? 20 : 18;

			g.setColour(Colours.withAlpha(this.get("bgColour"), obj.hover ? 1.0 : 0.8));
			g.fillRoundedRectangle(a, 5);

			g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 1.0 : 0.8));
			g.drawImage("icon", [a[0] + 7, a[1] + 7, a[2] - 14, a[2] - 14], 0, 0);

			g.setFont("medium", fontSize);
			g.setColour(Colours.withMultipliedBrightness(this.get("textColour"), this.data.hover ? 1.0 : 0.9));
			g.drawFittedText(this.data.Name, [a[0] + 8, a[3] - 41, a[2] - 40, 45], "left", 1, 1.0);
		});

		p.setMouseCallback(function(event)
		{
			var a = this.getLocalBounds(0);

			this.data.hover = event.hover;

			if (event.clicked && !event.rightClick)
				Expansions.setCurrent(this.data.Company, this.data.Name);

			this.repaint();
		});
		
		p.data.menu = createMenu(p);
		
		return p;
	}
	
	inline function: ScriptObject createMenu(parentPanel: ScriptObject)
	{
		local area = parentPanel.getLocalBounds(0);
		local menu = parentPanel.addChildPanel();
		local menuItems = ["Visit Webpage", "Set Samples Folder", "Uninstall"];

		menu.setPosition(area[2] - 30, area[3] - 29, 22, 22);
		menu.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
		menu.set("allowCallbacks", "All Callbacks");
		menu.set("popupMenuItems", menuItems.join("\n"));
		menu.set("popupMenuAlign", true);
		menu.set("popupOnRightClick", false);
		menu.set("textColour", parentPanel.get("textColour"));
		menu.setControlCallback(onMenuControl);
		
		menu.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);

			g.setColour(Colours.withAlpha(this.get("textColour"), this.data.hover ? 1.0 : 0.7));

			g.setFont("phosphorBold", a[2]);
			g.drawAlignedText("\ue1fe", a, "centred");
		});

		menu.setMouseCallback(function(event)
		{
			this.data.hover = event.hover;

			if (isDefined(event.result))
			{
				this.setValue(event.result);
				this.changed();
			}
		
			this.repaint();
		});
		
		return menu;
	}
	
	inline function onMenuControl(component, value)
	{
		local data = component.getParentPanel().data;
		local items = component.get("popupMenuItems").split("\n");

		switch (items[value - 1])
		{		
			case "Set Samples Folder":
				Expansions.edit(data.expansion);
				break;
		
			case "Uninstall":
				Expansions.uninstall(data.expansion);
				break;

			case "Visit Webpage":
				Engine.showYesNoWindow("Open Website", "Do you want Rhapsody to open " + data.CompanyURL + " in your web browser?", function[data](response)
				{
					if (response)
						Engine.openWebsite(data.CompanyURL);	
				});
				
				break;
		}
	}
}