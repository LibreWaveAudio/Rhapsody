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

namespace Variations
{
	reg callback;
	reg data;
	reg items = [];
	
	const selected = [];	

	//! pnlVariantPickerContainer
	const pnlVariantPickerContainer = Content.getComponent("pnlVariantPickerContainer");
	pnlVariantPickerContainer.data.message = "";
	
	pnlVariantPickerContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		var pickerArea = [pnlVariantPicker.get("x"), pnlVariantPicker.get("y"), pnlVariantPicker.getWidth(), pnlVariantPicker.getHeight()];
		
		LookAndFeel.fullPageBackground();

		g.setFont("semibold", 26);
		g.setColour(this.get("textColour"));
		g.drawAlignedText(this.get("text"), [pickerArea[0] + 2, pickerArea[1] - 50, a[2], 30], "left");
		
		g.setColour(Colours.withMultipliedBrightness(this.get("textColour"), 0.8));
		
		g.setFont("phosphor", 18);
		g.drawAlignedText("\ue2ce", [pickerArea[0] + 2, pickerArea[1] - 30, 20, 20], "left");
		
		g.setFont("regular", 16);		
		g.drawAlignedText(this.data.message, [pickerArea[0] + 25, pickerArea[1] - 30, pickerArea[2], 20], "left");		
	});

	//! pnlVariantPicker
	const pnlVariantPicker = Content.getComponent("pnlVariantPicker");
	
	pnlVariantPicker.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, this.get("borderRadius"));
	});

	//! vptVariantList
	const vptVariantList = Content.getComponent("vptVariantList");
	vptVariantList.setLocalLookAndFeel(LookAndFeel.viewportTable);

	vptVariantList.setTableMode({
		MultiColumnMode: false,
		HeaderHeight: 30,
		RowHeight: 30,
		ScrollOnDrag: false
	});

	vptVariantList.setTableColumns(
	[
		{ID: "Check", Label: "", Type: "Button", Toggle: true, MinWidth: 40, MaxWidth: 40},
		{ID: "Component", Type: "Text", MinWidth: 200},
		{ID: "Action", Type: "Text", MinWidth: 70}
	]);

	vptVariantList.setTableCallback(onvptVariantListTableCallback);

	inline function onvptVariantListTableCallback(obj)
	{
		if (obj.Type != "Button")
			return;

		obj.value == 1 ? selected.push(obj.rowIndex) : selected.remove(obj.rowIndex);
		btnVariantPickerSubmit.set("enabled", selected.length > 0);
	};

	//! btnVariantPickerSubmit
	const btnVariantPickerSubmit = Content.getComponent("btnVariantPickerSubmit");
	btnVariantPickerSubmit.set("x", pnlVariantPicker.get("x") + pnlVariantPicker.getWidth() - btnVariantPickerSubmit.getWidth());
	btnVariantPickerSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnVariantPickerSubmit.setControlCallback(onbtnVariantPickerSubmit);
	
	inline function onbtnVariantPickerSubmit(component, value)
	{
		if (value)
			return;

		if (!isDefined(callback))
			return hide();

		local selectedItems = [];

		for (x in selected)
			selectedItems.push(items[x]);

		callback(selectedItems, data);
		hide();
	}

	//! btnVariantPickerCancel
	const btnVariantPickerCancel = Content.getComponent("btnVariantPickerCancel");
	btnVariantPickerCancel.set("x", btnVariantPickerSubmit.get("x") - btnVariantPickerCancel.getWidth() - 15);
	btnVariantPickerCancel.setLocalLookAndFeel(LookAndFeel.textButton);
	btnVariantPickerCancel.setControlCallback(onbtnVariantPickerCancelControl);
	
	inline function onbtnVariantPickerCancelControl(component, value)
	{
		if (!value)
			hide();
	}

	//! Functions
	inline function uninstall(projectName: string, variants: Array)
	{
		for (x in variants)
		{
			local filenames = ManifestHandler.getUniqueFiles(projectName, x.name);
			removeFiles(projectName, filenames);
			ManifestHandler.removeEntry(projectName, x.name);
		}
		
		Engine.showMessageBox("Success", "The selected components have been uninstalled.", 0);
		Library.updateCatalogue();
	}
	
	inline function removeFiles(projectName: string, filenames: Array)
	{
		local dataDir = Expansions.getDataDirectory(projectName);
		local samplesDir = Expansions.getSamplesDirectory(projectName);

		if (!isDefined(samplesDir) || !samplesDir.isDirectory())
			return;
		
		if (!isDefined(dataDir) || !dataDir.isDirectory())
			return;

		for (x in filenames)
		{
			local file;

			if (x.contains(".ch") && (isDefined(samplesDir) && samplesDir.isDirectory()))
				file = samplesDir.getChildFile(x);
			else
				file = dataDir.getChildFile(x);

			if (!isDefined(file) || !file.isFile())
				continue;

			file.deleteFileOrDirectory();

			if (file.toString(file.Extension) == ".preset")
				removePresetParentDirectoriesIfEmpty(projectName, file);
		}
	}
	
	inline function removePresetParentDirectoriesIfEmpty(projectName: string, presetFile: ScriptObject)
	{
		local presetsDir = Expansions.getPresetsDirectory(projectName);
		local bank = presetFile.getParentDirectory();
		local category = bank.getParentDirectory();

		if (bank.isSameFileAs(presetsDir))
			return;

		if (!FileSystem.findFiles(bank, "*", false).length)
			bank.deleteFileOrDirectory();

		if (category.isSameFileAs(presetsDir))
			return;

		if (!FileSystem.findFiles(category, "*", false).length)
			category.deleteFileOrDirectory();		
	}
	
	inline function updateViewport(action: number)
	{
		local listData = [];

		for (x in items)
		{
			local obj = {
				Check: {},
				Component: x.name.capitalize(),
				Action: action ? (x.hasUpdate ? "Update" : "Install") : "Uninstall"
			};

			listData.push(obj);
		}

		vptVariantList.setTableRowData(listData);
	}

	inline function show(projectName: string, forInstall: number, properties: object, callbackFunction: Function)
	{
		pnlVariantPickerContainer.data.message = properties.message;
		callback = callbackFunction;

		populatePicker(projectName, forInstall);
		data = isDefined(properties.data) ? properties.data : {};

		data.projectName = projectName;

		btnVariantPickerSubmit.set("text", isDefined(properties.buttonText) ? properties.buttonText : "Ok");
		btnVariantPickerSubmit.set("enabled", true);

		pnlVariantPickerContainer.showControl(true);
	}

	inline function populatePicker(projectName: string, forInstall: number)
	{
		if (!forInstall)
		{
			items = ManifestHandler.getVariants(projectName);
		}
		else
		{
			items = [];

			local cache = CacheHandler.getLicensedVariants(projectName).clone();

			for (x in cache)
			{
				x.isInstalled = ManifestHandler.getVersion(projectName, x.name) != "";
				x.hasUpdate = ManifestHandler.isUpdatable(projectName, x.name, x.latestVersion);

				if (!x.isInstalled || x.hasUpdate)
					items.push(x);
			}
		}

		Engine.sortWithFunction(items, sortVariantsByName);

		for (i = 0; i < items.length; i++)
			selected.push(i);

		updateViewport(forInstall);
	}
	
	inline function sortVariantsByName(a, b)
	{
		if (a.name < b.name)
			return -1;
		else
			return a.name > b.name;
	}

	inline function hide()
	{
		pnlVariantPickerContainer.showControl(false);
		reset();
	}
	
	inline function reset()
	{
		items.clear();
		selected.clear();
		callback = undefined;
		data = undefined;
	}

	hide();
}