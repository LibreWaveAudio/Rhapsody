/*
    Copyright 2022, 2023, 2025, 2026 David Healey

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

namespace FilePicker
{
	const options = {};
	reg callback;
	reg file;

	//! pnlFilePicker
	const pnlFilePicker = Content.getComponent("pnlFilePicker");
	pnlFilePicker.showControl(false);

	pnlFilePicker.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		LookAndFeel.fullPageBackground();
		
		g.setColour(this.get("itemColour"));
		var lblArea = [lblFilePicker.get("x") - 10, lblFilePicker.get("y"), lblFilePicker.getWidth() + 20, lblFilePicker.getHeight()];
		g.fillRoundedRectangle(lblArea, 2);	  

		g.setFont("semibold", 22);
		g.setColour(this.get("textColour"));

		if (isDefined(options.title))
			g.drawAlignedText(options.title, [lblArea[0] + 2, lblArea[1] - 90, a[2], 30], "left");

		if (!isDefined(options.message))
			return;

		g.setFont("phosphor", 18);
		g.drawAlignedText("\ue2ce", [lblArea[0] + 2, lblArea[1] - 40, 20, 20], "left");
		
		g.setFont("regular", 18);		
		g.drawAlignedText(options.message, [lblArea[0] + 25, lblArea[1] - 40, lblArea[2], 20], "left");
	});
	
	//! lblFilePicker
	const lblFilePicker = Content.getComponent("lblFilePicker");
	lblFilePicker.setLocalLookAndFeel(LookAndFeel.empty);
	lblFilePicker.setControlCallback(onlblFilePickerControl);
	
	inline function onlblFilePickerControl(component, value)
	{
		file = FileSystem.fromAbsolutePath(value);
		
		component.set("text", "");

		if (!isDefined(file))
			return;

		if (!options.mode && !file.isFile())
			return file = undefined;
			
		if (options.mode && !file.isDirectory())
			return file = undefined;

		btnFilePickerSubmit.set("enabled", true);
		component.set("text", getTruncatedPath(file, 55));
	}

	//! btnFilePicker
	const btnFilePicker = Content.getComponent("btnFilePicker");
	btnFilePicker.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
	btnFilePicker.setControlCallback(onbtnFilePickerControl);
	
	inline function onbtnFilePickerControl(component, value)
	{
	    if (!value)
			options.mode == 0 ? showFileBrowser() : showDirectoryBrowser();			
	}

	//! btnFilePickerCancel
	const btnFilePickerCancel = Content.getComponent("btnFilePickerCancel");
	btnFilePickerCancel.setLocalLookAndFeel(LookAndFeel.textButton);
	btnFilePickerCancel.setControlCallback(onbtnFilePickerCancelControl);
	
	inline function onbtnFilePickerCancelControl(component, value)
	{
	    if (!value)
	    	hide();
	}
	
	//! btnFilePickerSubmit
    const btnFilePickerSubmit = Content.getComponent("btnFilePickerSubmit");
    btnFilePickerSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
    btnFilePickerSubmit.setControlCallback(onbtnFilePickerSubmitControl);

    inline function onbtnFilePickerSubmitControl(component, value)
    {
        if (value)
        	return;

		if (hideOnSubmit)
        	hide();

        callback(file, data);
    }
    
    //! Functions
    inline function setDefaultOptions()
    {
		options.title = "";
		options.message = "";
		options.startFolder = FileSystem.Downloads;
		options.mode = 0;
		options.hideOnSubmit = true;
		options.forWriting = false;
		options.bytesRequired = 0;
		options.filter =  "";
		options.data = {};
    }
    
	inline function show(properties, callbackFunction)
	{
		setDefaultOptions();

		for (x in properties)
			options[x] = properties[x];

		callback = callbackFunction;
		
		btnFilePickerSubmit.set("text", options.buttonText);
		btnFilePickerSubmit.set("enabled", false);
		lblFilePicker.set("textColour", Colours.withAlpha(lblFilePicker.get("textColour"), options.mode ? 1.0 : 0.5));
		lblFilePicker.set("text", "");
		
		if (isDefined(options.startFolder))
		{
			btnFilePickerSubmit.set("enabled", options.mode == 1);
			lblFilePicker.set("text", getTruncatedPath(options.startFolder, 55));
			file = options.startFolder;
		}

		pnlFilePicker.repaint();

		if (!isDefined(options.fadeIn) || options.fadeIn)
			pnlFilePicker.fadeComponent(true, 100);
		else
			pnlFilePicker.fadeComponent(true, 1);
	}
        
    inline function hide()
    {
	    pnlFilePicker.fadeComponent(false, 100);
    }
    
    inline function showFileBrowser()
    {
	    FileSystem.browse(options.startFolder, false, options.filter, function(f)
	    {
			if (!f.isFile())
				return;

			file = f;

			var fileName = f.toString(f.Filename);
			var path = f.toString(f.FullPath).replace("/" + fileName);
			var dir = path.substring(path.lastIndexOf("/"), path.length);

			btnFilePickerSubmit.set("enabled", true);
			lblFilePicker.set("text", ".." + dir + "/" + fileName);
			lblFilePicker.set("textColour", Colours.withAlpha(lblFilePicker.get("textColour"), 1.0));
	    });
    }

    inline function showDirectoryBrowser()
    {
	    FileSystem.browseForDirectory(options.startFolder, function(dir)
	    {
		    if (!dir.isDirectory())
		    	return;

		    if (options.forWriting && !dir.hasWriteAccess())
	    		return Engine.showMessageBox("Write Access", "It is not possible to write to the selected folder, please choose a different location.", 1);

	    	if (options.bytesRequired > 0 && dir.getBytesFreeOnVolume() < (options.bytesRequired * 2))
	    		return Engine.showMessageBox("Disk Space", "There is not enough free space on the select drive, please choose a different location.", 1);

	    	file = dir;

	    	btnFilePickerSubmit.set("enabled", true);
	    	lblFilePicker.set("text", getTruncatedPath(dir, 55));
	    });
    }

    inline function: string getTruncatedPath(f: ScriptObject, maxLength: number)
    {
		local fullPath = f.toString(f.FullPath);
		
		if (fullPath.length <= maxLength)
			return fullPath;
			
		local subpath = fullPath.substring(fullPath.length - maxLength, fullPath.length);
		return ".." + subpath.substring(subpath.indexOf("/"), subpath.length);
    }
}
