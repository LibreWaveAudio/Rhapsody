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

namespace Tile
{
	inline function create(parent: ScriptObject, width: number, height: number, data: object)
	{
		local cp = parent.addChildPanel();
		cp.setPosition(0, 0, width, height);
		cp.set("text", data.projectName);
		cp.set("tooltip", isDefined(data.shortDescription) ? data.shortDescription : "");
		cp.set("allowCallbacks", "All Callbacks");

		for (x in data)
			cp.data[x] = data[x];

		cp.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
			var image = this.get("text");
			var imageSize = this.getImageSize(image);

			g.setColour(Colours.withMultipliedBrightness(0xff232323, this.data.hover ? 1.0 : 0.9));
			g.fillRoundedRectangle(a, 2);

			if (!isDefined(this.data.progress))
			{
				var alpha = 0.3;

				if (this.data.hasLicense || !this.data.regularPrice)
					alpha += 0.2;

				if (isDefined(this.data.installedVersion))
					alpha = this.data.hover ? 1.0 - 0.1 * this.getValue() : 0.9;

				g.setColour(Colours.withAlpha(Colours.white, alpha));					
			}

			if (this.isImageLoaded(image) && imageSize[0] == imageSize[1])
				g.drawImage(image, [0, 0, a[2], a[3]], 0, 0);
			else
				drawPlaceholderImage();

			g.setFont("regular", 18);
			g.setColour(Colours.withAlpha(0xffcccccc, this.data.hover ? 1.0 : 0.9));

			var textWidth = a[2] - 35 - (30 * (isDefined(this.data.hasUpdate) && this.data.hasUpdate)) - (12 * (this.data.hasLicense && !isDefined(this.data.installedVersion)));

			g.drawFittedText(this.data.name, [a[0] + 10, a[3] - 40, textWidth, 41], "left", 1, 1);

			if (isDefined(this.data.progress))
				drawProgressIndicator(a, this.data.progress);

			g.addNoise({alpha: 0.025, scaleFactor: 2.0, area: a, monochromatic: true});
		});

		cp.setMouseCallback(function(event)
		{
			if (!isDefined(this.data) || !isDefined(this.data.installedVersion))
				return;

			var a = this.getLocalBounds(0);

			this.setMouseCursor(event.hover && event.y < (a[3] - 40) ? "PointingHandCursor" : "NormalCursor", Colours.white, [0, 0]);
			this.data.hover = event.hover && this.get("enabled") && event.y < (a[3] - 40);

			if (event.y > (a[3] - 40))
				return this.repaint();

			this.repaint();

			if (event.clicked && !event.rightClick)
				Expansions.setCurrent(this.data.company, this.data.projectName);
		});

		App.broadcasters.downloading.addListener(cp, "Disable the panel while downloads are in progress", function(state, progress)
		{
			this.set("enabled", !state);
			this.repaint();
		});

		addListeners(cp);
		addButtons(cp);
	}

	inline function addButtons(cp)
	{
		local data = cp.data;

		if (data.isInstalled)
			data.btnEdit = createEditMenu(cp);

		if (!App.isOnline)
			return;

		if ((!isDefined(data.hasLicense) || !data.hasLicense ) && !data.isInstalled && isDefined(data.url) && data.regularPrice != "0")
			return createBuyButton(cp);

		if ((!isDefined(data.hasLicense) || !data.hasLicense) && data.regularPrice != "0")
			return;

		if (!data.isInstalled)
			data.btnInstall = createInstallButton(cp, "Install");
		else if (data.isInstalled && isDefined(data.hasUpdate) && data.hasUpdate)
			data.btnInstall = createInstallButton(cp, "Update");

		if (!data.isInstalled || (isDefined(data.hasUpdate) && data.hasUpdate))
			data.btnAbort = createAbortButton(cp);
	}

	inline function createEditMenu(parent)
	{
		local area = parent.getLocalBounds(0);
		local data = parent.data;
		local b = parent.addChildPanel();

		local menuItems = [];

		menuItems = ["Add to Favourites", "Set Samples Folder"];

		if (isDefined(data.favourite) && data.favourite)
			menuItems[0] = "Remove Favourite";

		if (isDefined(data.url) && data.url != "")
			menuItems.push("Visit Webpage");
			
		menuItems.push("Uninstall");

		b.setPosition(area[2] - 22, area[3] - 30, 22, 22);
		b.set("itemColour", 0xffa8b2bd);
		b.set("allowCallbacks", "All Callbacks");
		b.set("popupMenuItems", menuItems.join("\n"));
		b.set("popupMenuAlign", true);
		b.set("popupOnRightClick", false);
		b.setControlCallback(oncmbEditControl);

		b.setPaintRoutine(function(g)
		{
			var fontSize = 22;
			drawButton(this.getLocalBounds(0), "\ue208");
		});

		b.setMouseCallback(function(event)
		{
			this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
			this.data.hover = event.hover;

			if (isDefined(event.result))
			{
				this.setValue(event.result);
				this.changed();
			}

			this.repaint();
		});

		App.broadcasters.downloading.addListener(b, "Disable the edit menu while downloads are in progress", function(state, progress)
		{
			this.set("enabled", !state);
			this.repaint();
		});

		return b;
	}

	inline function createBuyButton(parent)
	{
		local area = parent.getLocalBounds(0);
		local b = parent.addChildPanel();
	
		b.setPosition(area[2] - 28, area[3] - 27, 18, 18);	
		b.set("tooltip", type + " " + parent.get("text") + ".");
		b.set("itemColour", 0xffa8b2bd);
		b.set("allowCallbacks", "Clicks & Hover");
		b.data.url = parent.data.url;
	
		b.setPaintRoutine(function(g)
		{
			drawButton(this.getLocalBounds(0), "\ue41e");
		});
	
		b.setMouseCallback(function(event)
		{
			buttonMouseCallback();
	
			if (event.mouseUp)
				Engine.openWebsite(this.data.url);
		});

		return b;		
	}	

	inline function createInstallButton(parent, type)
	{
		local area = parent.getLocalBounds(0);
		local b = parent.addChildPanel();

		if (type == "Install")
			b.setPosition(area[2] - 30, area[3] - 29, 18, 18);
		else
			b.setPosition(area[2] - 45, area[3] - 29, 18, 18);

		b.set("tooltip", type + " " + parent.get("text") + ".");
		b.set("itemColour", 0xff7fff74);
		b.set("allowCallbacks", "Clicks & Hover");
		b.setControlCallback(onbtnInstallControl);
		b.data.icon = type == "Install" ? "\ue20c" : "\ue1ac";

		b.setPaintRoutine(function(g)
		{			
			drawButton(this.getLocalBounds(0), this.data.icon);
		});

		b.setMouseCallback(function(event)
		{
			buttonMouseCallback();
		});
		
		if (isDefined(parent.data.bcDownloading))
		{
			parent.data.bcDownloading.addListener(b, "Hide the install/update button while downloading", function(state, progress)
			{
				this.showControl(!state);
				this.repaint();
			});
		}

		return b;		
	}
	
	inline function createAbortButton(parent)
	{	
		local area = parent.getLocalBounds(0);	
		local b = parent.addChildPanel();

		b.setPosition(area[2] - 28, area[1] + 10, 20, 20);
		b.set("allowCallbacks", "Clicks & Hover");
		b.set("itemColour", Colours.white);
		b.data.icon = "\ue4f8";
		b.showControl(false);
		b.setControlCallback(onbtnAbortControl);

		b.setPaintRoutine(function(g)
		{
			var a = this.getLocalBounds(0);
			drawButton(a, this.data.icon);
		});
			
		b.setMouseCallback(function(event)
		{
			buttonMouseCallback();
		});

		if (isDefined(parent.data.bcDownloading))
		{
			parent.data.bcDownloading.addListener(b, "Show abort button during download", function(state, progress)
			{
				this.showControl(state);
				this.repaint();
			});
		}
	
		return b;
	}
	
	inline function buttonMouseCallback()
	{
		this.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
		this.setValue(event.clicked);
		this.data.hover = event.hover;
		this.repaint();

		if (event.mouseUp)
			this.changed();
	}
	
	inline function drawButton(area, icon)
	{			
		local c = Colours.withMultipliedBrightness(this.get("itemColour"), this.data.hover ? 1.0 - 0.3 * this.getValue() : 0.8);
		g.setColour(Colours.withAlpha(c, this.get("enabled") ? 1.0 : 0.5));
	
		g.setFont("phosphor", isDefined(fontSize) ? fontSize : area[2]);
		g.drawAlignedText(icon, area, "centred");
	}

	inline function drawPlaceholderImage()
	{
		local h = (a[3] - 40);

		g.setColour(0xff1F1F1F);
		g.fillRoundedRectangle([a[0], a[1], a[2], h], {CornerSize: 5, Rounded:[1, 1, 0, 0]});

		g.setColour(0xffe2e2e2);
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[0] + a[2] / 2 - a[2] / 3 / 2, a[1] + h / 2 - a[2] / 3 / 2, a[2] / 3, a[2] / 3]);
	}
	
	inline function drawProgressIndicator(a, progress)
	{
		local v = Math.min(1, progress.value);
		local diameter = a[3] / 1.4;
		local arcArea = [a[2] / 2 - diameter / 2, a[3] / 2 - diameter / 2 - 10, diameter, diameter];
		local path = Content.createPath(a[2]);
		local arcThickness = 0.05;
		local startOffset = 3.15;
		local endOffset = -startOffset + 2.0 * startOffset * v;

		g.setColour(Colours.withAlpha(Colours.black, 0.8));
		g.fillRoundedRectangle(a, 2);

		g.setColour(Colours.withAlpha(Colours.darkgrey, 0.6));
		g.drawEllipse(arcArea, 13);

	    g.setColour(Colours.withAlpha(0xffc8d4e2, 1.0));

	    endOffset = Math.max(endOffset, -startOffset + 0.01);
	    path.addArc(arcArea, -startOffset, endOffset);

	    g.drawPath(path, 0, a[2] * arcThickness);
		
		g.setColour(Colours.white);

		if (isDefined(progress.status))
		{			
			if (v > 0 && progress.value <= 1)
			{
				g.setFont("semibold", 18);
				g.drawAlignedText(progress.status, [a[0], a[1] + 10, a[2], a[3] + 20], "centred");
			}
			else
			{
				g.setFont("semibold", 22);
				g.drawAlignedText(progress.status, [a[0], a[1] - 20, a[2], a[3] + 20], "centred");
			}
		}

		if (v > 0 && progress.value <= 1)
		{
			g.setFont("bold", 38);
			g.drawAlignedText(parseInt(v * 100) + "%", [a[0], a[1] - 40, a[2], a[3] + 20], "centred");
		}	    	
	}
	
	inline function oncmbEditControl(component, value)
	{
		local parent = component.getParentPanel();
		local data = parent.data;
		local items = component.get("popupMenuItems").split("\n");

		switch (items[value - 1])
		{
			case "Add to Favourites":
			case "Remove Favourite":
				data.favourite = Library.toggleFavourite(data.projectName);
				removeButtons(parent);
				addButtons(parent);

				if (!data.favourite)
					Grid.refresh();
				break;

			case "Set Samples Folder":
				Expansions.edit(data.projectName);
				break;

			case "Uninstall":
				uninstall(data.projectName);
				break;

			case "Visit Webpage":
				Engine.openWebsite(data.url);
				break;
		}
	}

	inline function onbtnInstallControl(component, value)
	{
		if (value)
			return;

		local data = component.getParentPanel().data;
		
		if (isDefined(data.sampleDir) && data.sampleDir.isDirectory())
			return Downloader.preflight(data);

		Installer.askForSampleDirectory(data, function(dir, obj)
		{
			obj.sampleDir = dir;
			Downloader.preflight(obj);
		});		
	}

	inline function onbtnAbortControl(component, value)
	{
		local data = component.getParentPanel().data;

		Engine.showYesNoWindow("Cancel", "Do you want to cancel the download and installation?", function[data](response)
		{
			if (!response)
				return;
			
			Downloader.abortDownloads(data);
			Installer.abortInstallation();
		});
	}
	
	inline function uninstall(projectName: string)
	{
		local numVariants = ManifestHandler.getVariants(projectName).length;

		if (numVariants <= 1)
			return Expansions.uninstall(projectName);

		Variations.show(projectName, false, {buttonText: "Uninstall", message: "Select components to remove.", fromCache: false, data: {numVariants: numVariants}}, function(variants, data)
		{
			if (data.numVariants == variants.length)
				Expansions.uninstall(data.projectName);
			else
				Variations.uninstall(data.projectName, variants);
		});	
	}

	inline function removeButtons(cp)
	{
		for (x in cp.getChildPanelList())
			x.removeFromParent();
	}

	inline function addListeners(cp)
	{
		local data = cp.data;
		local isInstalled = isDefined(data.installedVersion) && data.installedVersion > 0;

		if (data.regularPrice != "0")
		{
			if (!data.hasLicense || (isInstalled && (!isDefined(data.hasUpdate) || !data.hasUpdate)))
				return;			
		}

		data.bcDownloading = Engine.createBroadcaster({id: data.id + "Downloading", args: ["state", "progress"]});
		
		data.bcDownloading.addListener(cp, "Update panel when download state changes", function(state, progress)
		{	
			this.data.progress = progress == -1 ? undefined : progress;
			this.repaint();
		});
	}	
}