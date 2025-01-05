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

namespace Grid
{
	reg filterValue = 1;

	const MARGIN = 10;
	const NUM_COLS = 4;

	//! pnlGridContainer
	const pnlGridContainer = Content.getComponent("pnlGridContainer");
	
	pnlGridContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.fillAll(this.get("bgColour"));
		
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.6));
		g.setFont("bold", 32);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 45], "centred");
	});

	//! vptGrid
	const vptGrid = Content.getComponent("vptGrid");

	//! pnlGrid
	const pnlGrid = Content.getComponent("pnlGrid");
	
	pnlGrid.setPaintRoutine(function(g)
	{
		for (cp in this.getChildPanelList())
		{
			if (!cp.get("visible"))
				continue;

			var a = [cp.get("x"), cp.get("y"), cp.getWidth(), cp.getHeight()];
			g.drawDropShadow([a[0], a[1] + 8, a[2], a[3] - 10], Colours.withAlpha(Colours.black, 0.8), 20);
			
			g.setColour(this.get("bgColour"));
			g.fillRoundedRectangle(a, 2);
		}
	});

	//! pnlFilter
	const pnlFilter = Content.getComponent("pnlFilter");
	pnlFilter.set("text", "Search...");

	pnlFilter.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		var radius = this.get("borderRadius");

		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, radius);

		g.setFont("phosphor", 16);
		g.setColour(this.get("textColour"));
		g.drawAlignedText("\ue30c", [a[0] + 9, a[1], a[2], a[3]], "left");

		g.drawVerticalLine(a[0] + 35, a[1] + 30 / 2 - a[3] / 2 / 2, a[1] + 30 / 2 - a[3] / 2 / 2 + a[3] / 2);
	});

	//! lblFilter
	const lblFilter = Content.getComponent("lblFilter");
	lblFilter.set("text", "Search...");
	lblFilter.setControlCallback(onlblFilterControl);
	
	inline function onlblFilterControl(component, value)
	{
		btnFilterClear.showControl(value != "Search...");
		refresh();
	}

	lblFilter.setConsumedKeyPresses({description: "escape", keyCode: 27});
	
	lblFilter.setKeyPressCallback(function(event)
	{
		if (event.isFocusChange)
			return;
	
		clearFilter();
	});

	//! btnFilterClear
	const btnFilterClear = Content.getComponent("btnFilterClear");
	btnFilterClear.setLocalLookAndFeel(LookAndFeel.iconButton);
	btnFilterClear.showControl(false);
	btnFilterClear.setControlCallback(onbtnFilterClearControl);
	
	inline function onbtnFilterClearControl(component, value)
	{
		if (value)
			return;

		clearFilter();
	}
	
	//! btnFavourites
	const btnFavourites = Content.getComponent("btnFavourites");
	btnFavourites.setValue(0);
	btnFavourites.setControlCallback(onbtnFavouritesControl);
	
	inline function onbtnFavouritesControl(component, value)
	{
		filterValue = value == 1 ? 5 : 1;
		refresh();
	}

	//! Functions
	inline function update(data: Array)
	{
		local isOnline = false;
		local width = pnlGrid.getWidth() / NUM_COLS - MARGIN;
		local height = width + 40;

		if (Account.isLoggedIn())
			isOnline = Server.isOnline();

		removeAllTiles();

		for (x in data)
		{
			local cp = Tile.create(pnlGrid, [0, 0, width, height], x, isOnline);
			updateImage(x.projectName);
		}

		refresh();
	}

	inline function refresh()
	{
		local childPanels = pnlGrid.getChildPanelList();	
		local width = pnlGrid.getWidth() / NUM_COLS - MARGIN;
		local height = width + 40;
		
		for (x in childPanels)
			x.showControl(false);

		local filteredChildren = getFilteredTiles(childPanels);
		local numRows = Math.ceil(filteredChildren.length / NUM_COLS);		

		Engine.sortWithFunction(filteredChildren, sortChildPanels);

		pnlGridContainer.set("text", filteredChildren.length > 0 ? "" : "Nothing to see here.");
		pnlGridContainer.repaint();

		pnlGrid.set("height", Math.max(height, numRows * height + MARGIN * numRows));

		for (i = 0; i < filteredChildren.length; i++)
		{
			local index = (i % NUM_COLS);
			local childPanel = filteredChildren[i];
			local x = MARGIN + (index * width) + (index * MARGIN);
			local y = Math.floor(i / NUM_COLS) * (height + MARGIN);

			childPanel.setPosition(x, y, width, height);
			childPanel.showControl(true);
			childPanel.repaint();
		}
		
		pnlGrid.repaint();
	}
	
	inline function: Array getFilteredTiles(tiles: Array)
	{
		local result = [];
		local query = lblFilter.getValue() == "Search..." ? "" : lblFilter.getValue().toLowerCase();
		local index = 0;
		
		for (tile in tiles)
		{
			local x = tile.data;
			local tags = x.tags.length > 0 ? x.tags : [""];
	
			for (i = 0; i < tags.length; i++)
			{
				local t = tags[i].toLowerCase();
				local value;
	
				if (!Engine.matchesRegex(t.toLowerCase(), query) && !Engine.matchesRegex(x.name.toLowerCase(), query))
					continue;
	
				switch (filterValue)
				{
					case 1:
						value = index;
						break;
						
					case 2:
						value = isDefined(x.installedVersion) ? index : undefined;
						break;
						
					case 3:
						if ((x.hasLicense && !isDefined(x.installedVersion)) || (x.regularPrice == "0"))
							value = index;
						break;
	
					case 4:
						value = (isDefined(x.hasUpdate) && x.hasUpdate) ? index : undefined;
						break;
						
					case 5:
						value = (isDefined(x.favourite) && x.favourite) ? index : undefined;
						break;
				}
				
				if (isDefined(value))
					result.push(tiles[value]);
	
				break;				
			}
			
			index++;
		}
	
		return result;
	}

	inline function sortChildPanels(a, b)
	{
		if (a.data.projectName < b.data.projectName)
			return -1;
		else
			return a.data.projectName > b.data.projectName;
	}

	inline function: object getChildPanel(projectName: string)
	{
		for (x in pnlGrid.getChildPanelList())
		{
			if (x.data.projectName == projectName)
				return x;
		}

		return {};
	}
	
	inline function updateTileData(projectName: string, data: object)
	{
		local cp = getChildPanel(projectName);
		cp.data = data;
		Tile.removeButtons(cp);
		Tile.addButtons(cp, Server.isOnline());
		cp.repaint();	
	}

	inline function updateImage(projectName: string)
	{
		local cp = getChildPanel(projectName);

		if (!isDefined(cp))
			return;
			
		if (cp.data.format != "expansion")
			return;

		cp.unloadAllImages();		

		local img = Expansions.getImagePath(projectName, "Icon");

		if (!isDefined(img))
			img = getCachedImagePath(projectName);
		
		if (isDefined(img) && img != "")
			cp.loadImage(img, projectName);

		cp.data.img = img;			
		cp.repaint();
	}
	
	inline function removeAllTiles()
	{
		for (x in pnlGrid.getChildPanelList())
		{
			x.unloadAllImages();
			x.removeFromParent();
		}
	}
	
	inline function: string getCachedImagePath(projectName: string)
	{
		local cache = FileSystem.getFolder(FileSystem.AppData).getChildFile("cache");
		local img = cache.getChildFile(projectName + ".jpg");

		if (isDefined(img) && img.isFile())
			return img.toString(img.FullPath);

		return "";
	}
	
	inline function clearFilter()
	{
		lblFilter.set("text", "Search...");
		lblFilter.changed();
	}
	
	//! Broadcasters
	const var bcStatusBarVisibility = Engine.createBroadcaster({"id": "bcStatusBarVisibility", "args": ["component", "isVisible"]});
	bcStatusBarVisibility.attachToComponentVisibility("pnlStatusBar", "");
	
	bcStatusBarVisibility.addListener(pnlGridContainer, "Resize grid based on status bar visibility", function(component, isVisible)
	{
		this.set("height", 640 - 50 * isVisible);
		refresh();
	});	
}