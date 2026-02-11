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
	
	reg filter = "";
	reg filteredItems = [];

	//! Look and Feel
	const lafList = Content.createLocalLookAndFeel();
	
	lafList.registerFunction("drawTableHeaderBackground", function(g, obj) {});
	
	lafList.registerFunction("drawTableHeaderColumn", function(g, obj) {});	
	
	lafList.registerFunction("drawTableRowBackground", function(g, obj)
	{
		var a = obj.area;

		g.setColour(obj.itemColour);
		g.fillRoundedRectangle(a.withTrimmedBottom(5), 5);
	});
	
	lafList.registerFunction("drawTableCell", function(g, obj)
	{
		var a = obj.area;
		var col = obj.columnIndex;

		if (col == 0)
		{
			if (!this.isImageLoaded(obj.text))
				return;

			g.setColour(Colours.withAlpha(Colours.white, 0.9));
			g.drawImage(obj.text, a.withTrimmedBottom(5).reduced(7, 7), 0, 90);
		}
		else
		{
			g.setFont("medium", 20);
			g.setColour(obj.textColour);
			g.drawAlignedText(obj.text, [a[0] + 10 * (col == 1), a[1], a[2], a[3] - 5], "left");
		}
	});
	
	lafList.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
		var item = filteredItems[obj.RowIndex];

		g.setColour(Colours.withMultipliedBrightness(pnlDownloads.get("bgColour"), obj.over ? 1.0 - 0.1 * obj.down : 0.8));
		g.fillRoundedRectangle(a.withTrimmedBottom(5).reduced(0, 20), 3);

		g.setFont("medium", 18);
		g.setColour(Colours.black);

		var text = item.action.capitalize();
		g.drawAlignedText(text, a.withTrimmedBottom(5), "centred");
	});
	
	lafList.registerFunction("drawScrollbar", function(g, obj)
	{
		 LookAndFeel.drawScrollbar(g, obj, 0xff11111b);
	});

	//! pnlDownloads
	const pnlDownloads = Content.getComponent("pnlDownloads");
	
	pnlDownloads.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
	
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.setFont("bold", 28);
		g.drawAlignedText(this.get("text"), a.withTrimmedBottom(10), "centred");
	});
	
	//! vptDownloads
	const vptDownloads = Content.getComponent("vptDownloads");
	vptDownloads.setLocalLookAndFeel(lafList);
	
	vptDownloads.setTableMode({
		MultiColumnMode: false,
		HeaderHeight: 0,
		RowHeight: 80,
		ScrollOnDrag: false
	});
	
	vptDownloads.setTableColumns(
	[
		{ID: "Image", Type: "Text", MinWidth: 175},
		{ID: "Instrument", Type: "Text", MinWidth: 425},
		{ID: "Version", Type: "Text", MinWidth: 100},
		{ID: "Size", Type: "Text", MinWidth: 125},
		{ID: "Action", Type: "Button", Toggle: true, MinWidth: 100, MaxWidth: 100}
	]);

	vptDownloads.setTableCallback(onvptDownloadsTableCallback);

	inline function onvptDownloadsTableCallback(obj)
	{
		if (obj.Type != "Button")
			return;

		local item = filteredItems[obj.rowIndex];

		if (!item.sampleFolder.isDirectory())
			promptForSampleFolder(item);
		else
			Downloader.downloadProduct(item);
	};

	//! pnlUpdateIndicator
	const pnlUpdateIndicator = Content.getComponent("pnlUpdateIndicator");
	
	pnlUpdateIndicator.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		g.setColour(this.get("bgColour"));
		
		g.setFont("phosphorFill", a[2]);
		g.drawAlignedText("\ue0ce", a, "centred");

		g.setFont("bold", 12);
		g.setColour(this.get("textColour"));
		g.drawAlignedText(parseInt(this.get("text")), a.withTrimmedBottom(1.5), "centred");
	});
	
	//! Functions
	inline function promptForSampleFolder(item: object)
	{
		local startFolder;
		local startFolderPath = UserSettings.getProperty("rhapsody", "lastSampleFolder");
		
		if (isDefined(startFolderPath) && startFolderPath != "")
			startFolder = FileSystem.fromAbsolutePath(startFolderPath);

		if (!isDefined(startFolderPath) || startFolderPath == "" || !startFolder.isDirectory())
			startFolder = FileSystem.getFolder(FileSystem.UserHome);	

		FilePicker.show({
			startFolder: startFolder,
			mode: 1,
			filter: "",
			title: "Install",
			message: "Choose a location to install the samples.",
			buttonText: "Install",
			forWriting: true,
			data: {item: item}
		}, function(dir, data)
		{
			UserSettings.setProperty("rhapsody", "lastSampleFolder", dir.toString(dir.FullPath));
			data.item.sampleFolder = dir;
			Downloader.downloadProduct(data.item);
		});
	}

	inline function updateList()
	{
		local listData = [];

		filteredItems = filterItems();

		for (x in filteredItems)
		{
			local obj = {
				Image: x.id,
				Instrument: x.name.capitalize(),
				Version: x.latestVersion == "" ? "N/A" : "v" + x.latestVersion,
				Size: x.fileSize == "" ? "N/A" : FileSystem.descriptionOfSizeInBytes(x.fileSize),
				Action: ""
			};

			listData.push(obj);
		}

		vptDownloads.setTableRowData(listData);
		pnlDownloads.set("text", filteredItems.length > 0 ? "" : "No Downloads Available");
		pnlDownloads.repaint();		
	}

	inline function sortByName(a, b)
	{
		if (a.name < b.name)
			return -1;

		return a.name > b.name;
	}

	inline function filterItems()
	{
		local result = [];

		for (x in catalogue)
		{
			if (queue.length > 0 && queue[0] == x)
				continue;

			local tags = (isDefined(x.tags) && Array.isArray(x.tags) && x.tags.length > 0) ? x.tags : [""];

			for (i = 0; i < tags.length; i++)
			{
				local t = tags[i].toLowerCase();

				if (!Engine.matchesRegex(t.toLowerCase(), filter) && !Engine.matchesRegex(x.name.toLowerCase(), filter) && !Engine.matchesRegex(x.company.toLowerCase(), filter))
					continue;

				result.push(x);
				break;
			}
		}
		
		Engine.sortWithFunction(result, sortByName);
		
		return result;
	}

	inline function refresh()
	{
		updateCatalogue();
		loadImages();
	}

	inline function updateCatalogue()
	{
		catalogue.clear();

		local numUpdatable = 0;

		for (x in Cache.getData())
		{
			local action = Expansions.isInstallable(x.company, x.projectName, x.latestVersion);
			
			if (action == "")
				continue;

			if (action == "update")
				numUpdatable++;

			x.sampleFolder = Expansions.getSampleFolder(x.company, x.projectName);
			x.action = action;
			catalogue.push(x);
		}

		pnlUpdateIndicator.showControl(numUpdatable > 0);
		pnlUpdateIndicator.set("text", numUpdatable < 10 ? Math.max(1, numUpdatable) : "!");
		
		updateList();
	}

	inline function loadImages()
	{
		lafList.unloadAllImages();

		for (x in catalogue)
		{
			local img = Cache.getImage(x.id + ".jpg");

			if (img.isFile())
				lafList.loadImage(img.toString(img.FullPath), x.id);
		}
	}
	
	//! Broadcasters
	Filter.getValueBroadcaster().addListener(0, "Listen for filter change", function(value)
	{
		filter = isDefined(value) ? value.toLowerCase().trim() : "";
		updateList();
	});

	//! Calls 
	refresh();
}
