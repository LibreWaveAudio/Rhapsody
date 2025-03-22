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
	const items = [];

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
			var data = items[obj.RowIndex];

			g.setFont("semibold", 18);
			g.setColour(0xffcccccc);			
			g.drawAlignedText(data.name, [a[0] + 10, a[1] + 10, a[2], 25], "left");
			
			g.setColour(0xff151515);
			g.fillRoundedRectangle([a[0] + 10, a[1] + a[3] / 2 - 6 / 2, a[2] - 30, 6], 2);
			
			g.setColour(0xffcccccc);
			g.fillRoundedRectangle([a[0] + 10, a[1] + a[3] / 2 - 6 / 2, (a[2] - 30) * 0.5, 6], 2);
		}
	});
	
	lafDownloadList.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
	
		g.setFont("phosphor", a[2] / 1.5);
		g.setColour(Colours.withMultipliedBrightness(0xffcccccc, obj.over ? 1.0 - 0.1 * obj.down : 0.8));
		g.drawAlignedText("\ue4f8", [a[0], a[3] / 2 - a[2] / 2, a[2], a[2]], "centred");
	});
	
	lafDownloadList.registerFunction("drawScrollbar", function(g, obj)
	{
		 LookAndFeel.drawScrollbar(g, obj, 0xff111111);
	});

	//! pnlDownloads
	const pnlDownloads = Content.getComponent("pnlDownloads");
	pnlDownloads.data.hover = -1;
	pnlDownloads.setControlCallback(onpnlDownloadsControl);
	
	inline function onpnlDownloadsControl(component, value)
	{
		for (i = 0; i < pnlDownloadLists.length; i++)
		{
			pnlDownloadLists[i].showControl(i == value);
		}
	}

	pnlDownloads.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		var pages = ["Available", "Downloading"];

		g.setFont("semibold", 18);

		for (i = 0; i < pages.length; i++)
		{
			var w = this.getWidth() / pages.length;
			var x = w * i;
			g.setColour(Colours.withMultipliedBrightness(this.get("textColour"), (this.getValue() == i ? 1.0 : 0.7 + (this.data.hover == i) * 0.1)));
			g.drawAlignedText(pages[i], [x, a[1] + 10, w, 25], "centred");
		}
	});
	
	pnlDownloads.setMouseCallback(function(event)
	{
		var index = Math.floor(event.x / this.getWidth() * pnlDownloadLists.length);
		
		this.data.hover = event.hover ? index : -1;

		if (event.clicked)
		{
			this.setValue(index);
			this.changed();
		}			

		this.repaint();
	});

	//! pnlDownloading
	const pnlDownloading = Content.getComponent("pnlDownloading");

	pnlDownloading.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
	
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.setFont("bold", 28);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 10], "centred");
	});
	
	//! pnlDownloadLists - both downloadable and downloading lists
	const pnlDownloadLists = [Content.getComponent("pnlAvailable"), Content.getComponent("pnlDownloading")];
	
	//! vptDownloading
	const vptDownloading = Content.getComponent("vptDownloading");
	vptDownloading.setLocalLookAndFeel(lafDownloadList);
	
	vptDownloading.setTableMode({
		MultiColumnMode: false,
		HeaderHeight: 0,
		RowHeight: 100,
		ScrollOnDrag: false
	});

	vptDownloading.setTableColumns(
	[
		{ID: "Image", Type: "Text", MinWidth: 175},
		{ID: "Data", Type: "Text", MinWidth: 500},
		{ID: "Cancel", Type: "Button", MinWidth: 50}
	]);

	vptDownloading.setTableCallback(onvptDownloadingTableCallback);

	inline function onvptDownloadingTableCallback(obj)
	{
		if (obj.Type != "Button" || obj.value)
			return;

		Console.print(trace(obj));
	};
	
	//! Functions
	inline function addItem(data)
	{
		for (x in items)
		{
			if (x.id == data.id)
				return;
		}	

		//data.progress = 0.5;
		items.push(data);
		
		//Downloader.addToQueue(data);
		
		loadImages();
		refresh();
	}
	
	inline function refresh()
	{
		local listData = [];

		for (x in items)
		{
			if (isDefined(x.progress))
				continue;
		
			local obj = {
				Image: x.id,
				Data: "Coming Soon",
				Cancel: ""
			};

			listData.push(obj);
		}
				
		vptDownloading.setTableRowData(listData);
		
		pnlDownloading.set("text", items.length > 0 ? "" : "No Active Downloads");
		pnlDownloading.repaint();
	}

	inline function loadImages()
	{
		lafDownloadList.unloadAllImages();

		for (x in items)
		{
			local img = Cache.getImage(x.id + ".jpg");
	
			if (img.isFile())
				lafDownloadList.loadImage(img.toString(img.FullPath), x.id);
		}
	}
	
	//! Calls
	refresh();
}
