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

namespace InstallList
{
	const catalogue = [];
	
	reg filter = "";
	reg filteredItems;
	
	//! Look and Feel
	const lafInstallList = Content.createLocalLookAndFeel();
	
	lafInstallList.registerFunction("drawTableHeaderBackground", function(g, obj)
	{		 
		g.fillAll(0xff1b1a1a);
	});
	
	lafInstallList.registerFunction("drawTableHeaderColumn", function(g, obj)
	{
		 var a = obj.area;
	
		 g.setFont("medium", 22);
		 g.setColour(0xffcccccc);
		 g.drawAlignedText(obj.text, a, "left");
	});	
	
	lafInstallList.registerFunction("drawTableRowBackground", function(g, obj)
	{
		g.fillAll(Colours.withAlpha(obj.rowIndex % 2 == 0 ? 0xff171616 : 0xff1b1a1a, 0.5));
	});
	
	lafInstallList.registerFunction("drawTableCell", function(g, obj)
	{
		var a = obj.area;
		var col = obj.columnIndex;
	
		if (col == -1)
		{
			if (!this.isImageLoaded(obj.text))
				return;
	
			g.setColour(Colours.withAlpha(Colours.white, 0.8));
			g.drawImage(obj.text, Rect.reduced(a, 10), 0, 75);
		}
		else
		{
			g.setFont("regular", 20);
			g.setColour(0xffcccccc);			
			g.drawAlignedText(obj.text, [a[0] + 10 * (col == 0), a[1], a[2], a[3]], "left");
		}
	});
	
	lafInstallList.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
	
		g.setColour(Colours.withMultipliedBrightness(0xffcccccc, obj.over ? 1.0 - 0.1 * obj.down : 0.8));
		g.fillRoundedRectangle([a[0] + 3, a[3] / 2 - 28 / 2, a[2] - 6, 28], 2);
	
		g.setFont("medium", 18);
		g.setColour(Colours.black);
		g.drawAlignedText(filteredItems[obj.RowIndex].action.capitalize(), a, "centred");
	});
	
	lafInstallList.registerFunction("drawScrollbar", function(g, obj)
	{
		 LookAndFeel.drawScrollbar(g, obj, 0xff111111);
	});
	
	//! pnlAvailable
	const pnlAvailable = Content.getComponent("pnlAvailable");
	
	pnlAvailable.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
	
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.setFont("bold", 28);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 10], "centred");
	});
	
	//! vptAvailable
	const vptAvailable = Content.getComponent("vptAvailable");
	vptAvailable.setLocalLookAndFeel(lafInstallList);
	
	vptAvailable.setTableMode({
		MultiColumnMode: false,
		HeaderHeight: 0,
		RowHeight: 80,
		ScrollOnDrag: false
	});
	
	vptAvailable.setTableColumns(
	[
		{ID: "Image", Type: "Text", MinWidth: 175},
		{ID: "Instrument", Type: "Text", MinWidth: 400},
		{ID: "Version", Type: "Text", MinWidth: 100},
		{ID: "Size", Type: "Text", MinWidth: 125},
		{ID: "Action", Type: "Button", Toggle: false, MinWidth: 100, MaxWidth: 100}
	]);
	
	vptAvailable.setTableCallback(onvptAvailableTableCallback);
	
	inline function onvptAvailableTableCallback(obj)
	{
		if (obj.Type != "Button" || obj.value)
			return;
	
		local item = catalogue[obj.rowIndex];
		DownloadList.addItem(item);
	};
	
	//! btnSync
	const btnSync = Content.getComponent("btnSync");
	btnSync.setLocalLookAndFeel(LookAndFeel.textIconButton);
	btnSync.setControlCallback(onbtnSyncControl);
	
	inline function onbtnSyncControl(component, value)
	{
		if (value)
			return;
	
		Cache.sync();
	}
	
	//! Functions
	inline function applyFilter()
	{
		local listData = [];

		filteredItems = filterItems(filter);
		Engine.sortWithFunction(filteredItems, sortByName);

		for (x in filteredItems)
		{
			if (isDefined(x.progress))
				continue;

			local obj = {
				Image: x.id,
				Instrument: x.name.capitalize(),
				Version: x.latestVersion == "" ? "N/A" : "v" + x.latestVersion,
				Size: x.fileSize == "" ? "N/A" : FileSystem.descriptionOfSizeInBytes(x.fileSize),
				Action: ""
			};

			listData.push(obj);
		}

		vptAvailable.setTableRowData(listData);

		pnlAvailable.set("text", filteredItems.length > 0 ? "" : "No Downloads Available");
		pnlAvailable.repaint();		
	}

	inline function sortByName(a, b)
	{
		if (a.name < b.name)
			return -1;

		return a.name > b.name;
	}

	inline function: Array filterItems(query: string)
	{
		local result = [];

		if (query == "")
			return catalogue;

		for (x in catalogue)
		{
			local tags = (isDefined(x.tags) && Array.isArray(x.tags) && x.tags.length > 0) ? x.tags : [""];

			for (i = 0; i < tags.length; i++)
			{
				local t = tags[i].toLowerCase();

				if (!Engine.matchesRegex(t.toLowerCase(), query) && !Engine.matchesRegex(x.name.toLowerCase(), query) && !Engine.matchesRegex(x.company.toLowerCase(), query))
					continue;

				result.push(x);

				break;
			}
		}

		return result;
	}

	inline function refresh()
	{
		catalogue.clear();

		for (x in Cache.getData())
		{
			local name = x.name;

			if (isDefined(x.projectName))
				name = x.projectName;

			if (isDefined(x.expansionName))
				name = x.expansionName;

			if (isDefined(x.variationName))
				name += " - " + x.variationName;

			local action = Expansions.isInstallable(x.company, name, x.latestVersion);

			if (action == "")
				continue;

			x.action = action;
			catalogue.push(x);				
		}

		loadImages();
		applyFilter();
	}

	inline function loadImages()
	{
		lafInstallList.unloadAllImages();

		for (x in catalogue)
		{
			local img = Cache.getImage(x.id + ".jpg");

			if (img.isFile())
				lafInstallList.loadImage(img.toString(img.FullPath), x.id);
		}
	}

	//! Broadcasters
	Downloader.broadcasters.isDownloading.addComponentPropertyListener("btnSync", "enabled", "Disable during downloads", function(index, state)
	{
		return !state;
	});

	Filter.getValueBroadcaster().addListener(0, "Listen for filter change", function(value)
	{
		filter = isDefined(value) ? value.toLowerCase().trim() : "";
		applyFilter();
	});	

	//! Calls 
 	refresh();
}
