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

namespace DownloadList
{
	const catalogue = [];
	const selected = [];
	
	reg filter = "";

	//! Look and Feel
	const lafDownloadList = Content.createLocalLookAndFeel();
	
	lafDownloadList.registerFunction("drawTableHeaderBackground", function(g, obj)
	{		 
		g.fillAll(0xff1b1a1a);
	});

	lafDownloadList.registerFunction("drawTableHeaderColumn", function(g, obj)
	{
		 var a = obj.area;

		 g.setFont("medium", 22);
		 g.setColour(0xffcccccc);
		 g.drawAlignedText(obj.text, a, "left");
	});	
	
	lafDownloadList.registerFunction("drawTableRowBackground", function(g, obj)
	{
		g.fillAll(Colours.withAlpha(obj.rowIndex % 2 == 0 ? 0xff171616 : 0xff1b1a1a, 0.5));
	});
	
	lafDownloadList.registerFunction("drawTableCell", function(g, obj)
	{	
		var a = obj.area;

		if (obj.columnIndex == 0)
		{
			if (!this.isImageLoaded(obj.text))
				return;

			g.setColour(Colours.withAlpha(Colours.white, 0.8));
			g.drawImage(obj.text, [a[0], a[3] / 2 - a[3] * 0.8 / 2, a[2] * 0.9, a[3] * 0.8], 0, 75);
		}
		else
		{
			g.setFont("regular", 20);
			g.setColour(0xffcccccc);
			g.drawAlignedText(obj.text, obj.area, "left");
		}
	});
	
	lafDownloadList.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
		a[0] += 5;

		var buttonSize = a[2] / 3.2;

		g.setFont("phosphor", buttonSize);
		g.setColour(Colours.withMultipliedBrightness(0xffcccccc, (obj.value ? 0.9 : 0.6) + 0.2 * obj.over));

		if (obj.value)
			g.drawAlignedText("\ue186", [a[2] / 2 - buttonSize / 2, a[3] / 2 - buttonSize / 2, buttonSize, buttonSize], "centred");
		else
			g.drawAlignedText("\ue45e", [a[2] / 2 - buttonSize / 2, a[3] / 2 - buttonSize / 2, buttonSize, buttonSize], "centred");
	});

	lafDownloadList.registerFunction("drawScrollbar", function(g, obj)
	{
		 LookAndFeel.drawScrollbar(g, obj, 0xff111111);
	});

	//! pnlDownloads
	const pnlDownloads = Content.getComponent("pnlDownloads");
	
	pnlDownloads.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.setFont("bold", 28);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 40], "centred");
	});

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

	//! vptDownloads
	const vptDownloads = Content.getComponent("vptDownloads");

	vptDownloads.setLocalLookAndFeel(lafDownloadList);

	vptDownloads.setTableMode({
		MultiColumnMode: false,
		HeaderHeight: 0,
		RowHeight: 80,
		ScrollOnDrag: false
	});

	vptDownloads.setTableColumns(
	[
		{ID: "Check", Label: "", Type: "Button", Toggle: true, MinWidth: 75, MaxWidth: 75},
		{ID: "Image", Label: "", Type: "Text", MinWidth: 150},
		{ID: "Instrument", Type: "Text", MinWidth: 400},
		{ID: "Version", Type: "Text", MinWidth: 100},
		{ID: "Size", Type: "Text", MinWidth: 125},
		{ID: "Type", Type: "Text", MinWidth: 100},
	]);

	vptDownloads.setTableCallback(onvptDownloadsTableCallback);

	inline function onvptDownloadsTableCallback(obj)
	{
		if (obj.Type != "Button")
			return;

		local item = catalogue[obj.rowIndex];

		obj.value == 1 ? selected.push(item.id) : selected.remove(item.id);
		btnDownloadsSubmit.set("enabled", selected.length > 0);
	};

	//! btnDownloadsSubmit
	const btnDownloadsSubmit = Content.getComponent("btnDownloadsSubmit");
	btnDownloadsSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnDownloadsSubmit.setControlCallback(onbtnDownloadsSubmitControl);

	inline function onbtnDownloadsSubmitControl(component, value)
	{
		if (value)
			return;

		Downloader.addDownloads(selected);
	}

	//! Functions
	inline function applyFilter()
	{
		local listData = [];

		selected.clear();

		local filteredItems = filterItems(filter);
		Engine.sortWithFunction(filteredItems, sortByName);

		for (x in filteredItems)
		{
			local obj = {
				Check: 0,
				Image: x.id,
				Instrument: x.name.capitalize(),
				Version: x.latestVersion == "" ? "N/A" : "v" + x.latestVersion,
				Size: x.fileSize == "" ? "N/A" : FileSystem.descriptionOfSizeInBytes(x.fileSize),
				Type: x.action.capitalize()
			};

			listData.push(obj);
		}

		pnlDownloads.set("text", filteredItems.length > 0 ? "" : "No Downloads Available");
		pnlDownloads.repaint();

		btnDownloadsSubmit.set("enabled", false);
		btnDownloadsSubmit.showControl(filteredItems.length > 0);
		vptDownloads.setTableRowData(listData);
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
		lafDownloadList.unloadAllImages();

		for (x in catalogue)
		{
			local img = Cache.getImage(x.id + ".jpg");

			if (img.isFile())
				lafDownloadList.loadImage(img.toString(img.FullPath), x.id);
		}
	}

	//! Broadcasters
	Filter.getValueBroadcaster().addListener(0, "Listen for filter change", function(value)
	{
		filter = isDefined(value) ? value.toLowerCase().trim() : "";
		applyFilter();
	});	

	//! Calls 
 	refresh();		
}
