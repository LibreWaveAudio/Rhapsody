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

namespace ProductTile
{
	inline function: ScriptObject create(parentPanel: ScriptObject, expansion: object, area: Array, options: object)
	{
		local p = parentPanel.addChildPanel();
		p.set("allowCallbacks", "All Callbacks");
		p.setPosition(area[0], area[1], area[2], area[3]);
		p.loadImage(expansion.icon, "icon");
		p.set("bgColour", parentPanel.get("bgColour"));
		p.set("itemColour", parentPanel.get("itemColour"));
		p.set("textColour", parentPanel.get("textColour"));

		for (x in expansion)
			p.data[x] = expansion[x];
			
		for (x in options)
			p.data[x] = options[x];

		p.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
			var imgArea = Rectangle(a[0], a[1], a[2], a[2]).reduced(14).translated(0, -10);
			var fontSize = isDefined(this.data.fontSize) ? this.data.fontSize : a[2] > 200 ? 20 : 18;

			g.drawDropShadow(imgArea.translated(2, 4), Colours.withAlpha(Colours.black, 0.8), 10);

			g.setColour(Colours.withMultipliedBrightness(Colours.white, this.data.hover ? 1.0 : 0.6));
			
			if (this.isImageLoaded("icon"))
				g.drawImage("icon", imgArea, 0, 0);
			else
				drawPlaceholderImage(imgArea);

			g.setColour(Colours.withAlpha(Colours.white, this.data.hover ? 0.1 : 0.0));
			g.fillRect(imgArea);

			g.setFont("monoMedium", fontSize);
			g.setColour(Colours.withMultipliedBrightness(this.get("textColour"), this.data.hover ? 1.0 : 0.9));
			g.drawAlignedText(this.data.name, [imgArea[0] + 2, imgArea[3] + 15, imgArea[2] - 30, 25], "left");

			if (!isDefined(this.data.hasUpdate) || !this.data.hasUpdate)
				return;

			var badgeArea = Rectangle(imgArea[0] + imgArea[2] - 38, imgArea[1] + 8, 30, 30).reduced(3);

			g.setColour(0xffff9807);
			g.fillEllipse(badgeArea);

			g.setColour(Colours.white);
			g.drawEllipse(badgeArea, 2);

			g.setFont("phosphorFill", 16);
			g.drawAlignedText("\ue5e8", badgeArea, "centred");
		});

		p.setMouseCallback(function(event)
		{
			var a = this.getLocalBounds(0);

			if (event.y > a[3] - 35)
			{
				this.setMouseCursor("NormalCursor", Colours.white, [0, 0]);
				this.data.hover = false;
				this.repaint();
				return;
			}

			this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
			this.data.hover = event.hover;
			
			if (event.clicked && !event.rightClick)
				Expansions.setCurrent(this.data.uuid, this.data.company, this.data.name);

			this.repaint();
		});

		p.data.menu = createMenu(p);

		return p;
	}
	
	inline function drawPlaceholderImage(area: JSON)
	{
		g.setColour(0xff1e1e23);
		g.fillRect(area);

		g.setColour(0xffe2e2e2);
		g.fillPath(Paths.rhapsodyLogoWithBg, area.reduced(60));
	}
	
	inline function: ScriptObject createMenu(parentPanel: ScriptObject)
	{
		local area = parentPanel.getLocalBounds(0);
		local menu = parentPanel.addChildPanel();
		local menuItems = ["e0f4-Visit Webpage", "e260-Set Samples Folder", "e4a8-Uninstall"];

		menu.data.parent = parentPanel;
		menu.setPosition(area[2] - 34, area[3] - 41, 20, 22);
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
		local data = component.data.parent.data;
		local items = component.get("popupMenuItems").split("\n");
		local text = items[value - 1];

		if (!isDefined(text) || text == "")
			return;

		text = text.replace(text.substring(0, text.indexOf("-") + 1));

		switch (text)
		{		
			case "Set Samples Folder":
				Expansions.edit(data.uuid, data.company, data.name);
				break;
		
			case "Uninstall":
				Expansions.uninstall(data.uuid, data.company, data.name);
				break;

			case "Visit Webpage":
				Engine.showYesNoWindow("Open Website", "Do you want Rhapsody to open " + data.companyUrl + " in your web browser?", function[data](response)
				{
					if (response)
						Engine.openWebsite(data.companyUrl);	
				});
				
				break;
		}
	}
}