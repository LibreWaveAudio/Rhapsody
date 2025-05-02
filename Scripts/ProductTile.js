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
		p.set("textColour", parentPanel.get("textColour"));
		p.data.expansion = expansion;

		local expansionProperties = expansion.getProperties();

		for (x in expansionProperties)
			p.data[x] = expansionProperties[x];
			
		for (x in options)
			p.data[x] = options[x];

		p.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
			var fontSize = isDefined(this.data.fontSize) ? this.data.fontSize : a[2] > 200 ? 18 : 16;

			g.beginLayer(false);			
			g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 1.0 : 0.9));
			g.drawImage("icon", [a[0], a[1], a[2], a[2]], 0, 0);

			var mask = Content.createPath();
			mask.addRoundedRectangle([a[0], a[1], a[2], a[2]], 5);
			g.applyMask(mask, [a[0], a[1], a[2], a[2]], false);				
			g.endLayer();

			g.setFont("medium", fontSize);
			g.setColour(Colours.withMultipliedBrightness(this.get("textColour"), this.data.hover ? 1.0 : 0.9));
			g.drawFittedText(this.data.Name, [a[0], a[1], a[2] - a[2] * 0.12, a[3] - 15], "bottomLeft", 1, 1.0);
		});

		p.setMouseCallback(function(event)
		{
			var a = this.getLocalBounds(0);

			this.data.hover = event.hover;
			this.setMouseCursor(event.hover && event.y < (a[3] - 40) ? "PointingHandCursor" : "NormalCursor", Colours.white, [0, 0]);

			if (event.y > (a[3] - 40))
				return this.repaint();

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

		menu.setPosition(area[2] - 18, area[3] - 35, 22, 22);
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

			var c = Colours.withMultipliedBrightness(this.get("textColour"), this.data.hover ? 1.0 : 0.8);
			g.setColour(Colours.withAlpha(c, this.get("enabled") ? 1.0 : 0.5));

			g.setFont("phosphorBold", a[2]);
			g.drawAlignedText("\ue208", a, "centred");
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
				Engine.openWebsite(data.CompanyURL);
				break;
		}
	}
}