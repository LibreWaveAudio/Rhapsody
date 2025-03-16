/*
    Copyright 2022, 2023, 2025 David Healey

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
	reg startFolder = FileSystem.Downloads;
	reg mode = 0;
	reg hideOnSubmit = true;
	reg filter = "";
	reg file;
	reg callback;
	reg data;

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

		g.setFont("semibold", 20);
		g.setColour(this.get("textColour"));

		if (isDefined(this.data.title))
			g.drawAlignedText(this.data.title, [lblArea[0] + 2, lblArea[1] - 90, a[2], 30], "left");

		if (!isDefined(this.data.message))
			return;

		g.setFont("phosphor", 18);
		g.drawAlignedText("\ue2ce", [lblArea[0] + 2, lblArea[1] - 40, 20, 20], "left");
		
		g.setFont("regular", 16);		
		g.drawAlignedText(this.data.message, [lblArea[0] + 25, lblArea[1] - 40, lblArea[2], 20], "left");
	});
	
	//! lblFilePicker
	const lblFilePicker = Content.getComponent("lblFilePicker");
	lblFilePicker.setLocalLookAndFeel(LookAndFeel.empty);
	lblFilePicker.setControlCallback(onlblFilePickerControl);
	
	inline function onlblFilePickerControl(component, value)
	{
		file = FileSystem.fromAbsolutePath(value);

		if ((mode == 0 && !file.isFile()) || (mode == 1 && !file.isDirectory()))
		{
			file = undefined;
			return component.set("text", "");
		}			

		btnFilePickerSubmit.set("enabled", true);
		lblFilePicker.set("text", getTruncatedPath(file, 55));
	}

	//! btnFilePicker
	const btnFilePicker = Content.getComponent("btnFilePicker");
	btnFilePicker.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
	btnFilePicker.setControlCallback(onbtnFilePickerControl);
	
	inline function onbtnFilePickerControl(component, value)
	{
	    if (!value)
			mode == 0 ? showFileBrowser() : showDirectoryBrowser();			
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
	inline function show(properties, callbackFunction)
	{
		pnlFilePicker.data.title = properties.title;
		pnlFilePicker.data.message = properties.message;
		filter = isDefined(properties.filter) ? properties.filter : "";
		mode = properties.mode;
		hideOnSubmit = !isDefined(properties.hideOnSubmit) || properties.hideOnSubmit;
		callback = callbackFunction;
		data = isDefined(properties.data) ? properties.data : {};
		btnFilePickerSubmit.set("text", properties.buttonText);
		btnFilePickerSubmit.set("enabled", false);

		if (isDefined(properties.startFolder) && properties.startFolder != "" && properties.startFolder.isDirectory())
			startFolder = properties.startFolder;

		if (isDefined(startFolder))
		{
			btnFilePickerSubmit.set("enabled", mode == 1);
			lblFilePicker.set("text", getTruncatedPath(startFolder, 55));
			file = startFolder;
		}
		else
		{
			lblFilePicker.set("text", "");
		}

		pnlFilePicker.repaint();
		
		if (!isDefined(properties.fadeIn) || properties.fadeIn)
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
	    FileSystem.browse(startFolder, false, filter, function(f)
	    {
			if (!f.isFile())
				return;

			file = f;
			btnFilePickerSubmit.set("enabled", true);
			lblFilePicker.set("text", f.toString(f.Filename));
	    });
    }

    inline function showDirectoryBrowser()
    {
	    FileSystem.browseForDirectory(startFolder, function(dir)
	    {
		    if (!dir.isDirectory())
		    	return;

	    	file = dir;

	    	btnFilePickerSubmit.set("enabled", true);
	    	lblFilePicker.set("text", getTruncatedPath(dir, 55));
	    });
    }
        
    inline function getTruncatedPath(f, maxLength)
    {
		local fullPath = f.toString(startFolder.FullPath);
		
		if (fullPath.length <= maxLength)
			return fullPath;
			
		local subpath = fullPath.substring(fullPath.length - maxLength, fullPath.length);
		local result = ".." + subpath.substring(subpath.indexOf("/"), subpath.length);
		
		return result;		
    }
}
