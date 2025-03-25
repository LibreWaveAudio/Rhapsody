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
	const queue = [];
	
	reg filter = "";
	reg filteredItems = [];

	//! Look and Feel
	const lafList = Content.createLocalLookAndFeel();
	
	lafList.registerFunction("drawTableHeaderBackground", function(g, obj)
	{		 
		g.fillAll(0xff1b1a1a);
	});
	
	lafList.registerFunction("drawTableHeaderColumn", function(g, obj)
	{
		 var a = obj.area;
	
		 g.setFont("medium", 22);
		 g.setColour(0xffcccccc);
		 g.drawAlignedText(obj.text, a, "left");
	});	
	
	lafList.registerFunction("drawTableRowBackground", function(g, obj)
	{
		g.fillAll(Colours.withAlpha(obj.rowIndex % 2 == 0 ? 0xff171616 : 0xff1b1a1a, 0.5));
	});
	
	lafList.registerFunction("drawTableCell", function(g, obj)
	{
		var a = obj.area;
		var col = obj.columnIndex;
	
		if (col == 0)
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
			g.drawAlignedText(obj.text, [a[0] + 10 * (col == 1), a[1], a[2], a[3]], "left");
		}
	});
	
	lafList.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
		var item = filteredItems[obj.RowIndex];
	
		var c = queue.contains(item) ? 0xff6b6b6b : 0xffbbbbbb;
		g.setColour(Colours.withMultipliedBrightness(c, obj.over ? 1.0 - 0.1 * obj.down : 0.8));
		g.fillRoundedRectangle([a[0] + 3, a[3] / 2 - 28 / 2, a[2] - 6, 28], 2);
	
		g.setFont("medium", 18);
		g.setColour(Colours.black);

		var text = queue.contains(item) ? "Queued" : isDefined(item.action) ? item.action.capitalize() : "";
		g.drawAlignedText(text, a, "centred");
	});
	
	lafList.registerFunction("drawScrollbar", function(g, obj)
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
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 10], "centred");
	});
	
	//! vptAvailable
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

		if (queue.contains(item))
			removeFromQueue(item);
		else
			addToQueue(item);
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
		loadImages();
	}

	//! Functions
	inline function addToQueue(item: object)
	{
		queue.push(item);

		Installer.setPostInstallCallback(processNextQueuedItem);

		if (queue.length == 1)
			passToDownloader(queue[0].id);

		updateList();
	}
	
	inline function passToDownloader(productId: number)
	{
		local img = Cache.getImage(productId + ".jpg");		
		ProgressBar.setImage(img.isFile() ? img.toString(img.FullPath) : "");

		Downloader.downloadProduct(productId);
	}

	inline function processNextQueuedItem()
	{
		if (queue.length > 0)
			removeFromQueue(queue[0]);

		Downloader.deleteDownloadedFiles();

		if (queue.length > 0)
			passToDownloader(queue[0].id);

		updateCatalogue();
	}

	inline function removeFromQueue(item: object)
	{
		if (!queue.contains(item))
			return;

		queue.remove(item);

		updateList();

		if (!queue.length)
			return Installer.clearPostInstallCallback();
	}	

	inline function clearQueue()
	{
		queue.clear();
		Downloader.deleteDownloadedFiles();
		Installer.clearPostInstallCallback();
		updateCatalogue();
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
	Downloader.broadcasters.isDownloading.addComponentPropertyListener("btnSync", "enabled", "Disable during downloads", function(index, state)
	{
		return !state;
	});

	//! bcProgressVisible
	const bcProgressVisible = Engine.createBroadcaster({id: "bcProgressVisible", args: ["component", "isVisible"]});
	bcProgressVisible.attachToComponentVisibility("pnlProgress1", "");

	bcProgressVisible.addListener(0, "Adjust list position when progress bar is visible", function(component, isVisible)
	{
		pnlDownloads.set("y", isVisible ? 110 : 0);
		pnlDownloads.set("height", isVisible ? 495 : 645);
		vptDownloads.set("y", isVisible ? 10 : 25);
		vptDownloads.set("height", isVisible ? 450 : 565);
	});

	Filter.getValueBroadcaster().addListener(0, "Listen for filter change", function(value)
	{
		filter = isDefined(value) ? value.toLowerCase().trim() : "";
		updateList();
	});

	//! Calls 
	refresh();
}
