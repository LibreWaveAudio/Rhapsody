/*
    Copyright 2021, 2022, 2023, 2025 David Healey

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

namespace UserSettings
{
	const documents = FileSystem.getFolder(FileSystem.Documents);
	const temp = FileSystem.getFolder(FileSystem.Temp);

	const defaultPaths = {
		"contentPath": documents.toString(documents.FullPath) + "/Rhapsody",
		"downloadPath": temp.toString(temp.FullPath) + "/Rhapsody"
	};

	//! pnlUserSettings
	const pnlUserSettings = Content.getComponent("pnlUserSettings");	

	pnlUserSettings.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.setFont("regular", 14);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));

		var versionText = "v" + Engine.getVersion();

		if (App.mode != "release")
			versionText += " Development Build";

		g.drawAlignedText(versionText, a, "bottomRight");	
	});

	//! pnlSettingsBlock
	const pnlSettingsBlock = Content.getAllComponents("pnlSettingsBlock\\d");
	
	for (x in pnlSettingsBlock)
		x.setPaintRoutine(function(g) { drawSettingsBlock(g); });

	//! lblContentPath
	const lblContentPath = Content.getComponent("lblContentPath");
	lblContentPath.set("text", defaultPaths["contentPath"]);
	lblContentPath.setControlCallback(onlblContentPathControl);

	inline function onlblContentPathControl(component, value)
	{
		pathLabelAction(component, value, "contentPath");
	}

	//! btnContentPath
	const btnContentPath = Content.getComponent("btnContentPath");
	btnContentPath.set("x", lblContentPath.get("x") + lblContentPath.getWidth() - 20);
	btnContentPath.set("y", lblContentPath.get("y") + lblContentPath.getHeight() / 2 - 10);
	btnContentPath.setControlCallback(onbtnContentPathControl);

	inline function onbtnContentPathControl(component, value)
	{
		if (!value)
			pathButtonAction(lblContentPath, "contentPath");
	}
	
	//! lblDownloadPath
	const lblDownloadPath = Content.getComponent("lblDownloadPath");
	lblDownloadPath.set("text", defaultPaths["downloadPath"]);
	lblDownloadPath.setControlCallback(onlblDownloadPathControl);
	
	inline function onlblDownloadPathControl(component, value)
	{
		pathLabelAction(component, value, "downloadPath");
	}
	
	//! btnDownloadPath
	const btnDownloadPath = Content.getComponent("btnDownloadPath");
	btnDownloadPath.set("x", lblDownloadPath.get("x") + lblDownloadPath.getWidth() - 20);
	btnDownloadPath.set("y", lblDownloadPath.get("y") + lblDownloadPath.getHeight() / 2 - 10);
	btnDownloadPath.setControlCallback(onbtnDownloadPathControl);
	
	inline function onbtnDownloadPathControl(component, value)
	{
		if (!value)
			pathButtonAction(lblDownloadPath, "downloadPath");
	}

    //! Functions
    inline function setBlockPositions()
    {
		local margin = 40;
		local y = 0;
	
		for (x in pnlSettingsBlock)
		{
			if (!x.get("visible"))
				continue;

			x.set("y", y);
			y += x.getHeight() + margin;
		}
	}

	inline function setButtonLookAndFeel()
	{
		for (x in pnlUserSettings.getChildComponents())
		{
			local id = x.getId();

			if (!id.contains("btn"))
				continue;

			if (id.contains("Path"))
				x.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
			else
				x.setLocalLookAndFeel(LookAndFeel.textButton);
		}			
	}

    inline function pathLabelAction(label: ScriptObject, value: string, settingKey: string)
    {
	    local dir = FileSystem.fromAbsolutePath(value);

	    if (dir.isDirectory() && !dir.hasWriteAccess())
	    	return Engine.showMessageBox("Invalid Location", "Rhapsody is unable to write to the selected location.", 1);
	    
	    if (dir.isDirectory())
	    	return setProperty("rhapsody", settingKey, value);

	    local path = getProperty("rhapsody", settingKey);
	    	
	    if (isDefined(path) && path != "")
	    	label.set("text", path);
    }
    
    inline function pathButtonAction(label: ScriptObject, location: string)
    {
    	local savedPath = getProperty("rhapsody", location);
    	local startFolder;

    	if (isDefined(savedPath))
    		startFolder = FileSystem.fromAbsolutePath(savedPath);

    	if (!isDefined(startFolder) || !startFolder.isDirectory())
    		startFolder = FileSystem.fromAbsolutePath(defaultPaths[location]);

    	if (!isDefined(startFolder) || !startFolder.isDirectory())
    		startFolder = FileSystem.getFolder(FileSystem.UserHome);

    	FileSystem.browseForDirectory(startFolder, function[label, location](dir)
    	{
			if (!dir.isDirectory())
				return;

			if (!dir.hasWriteAccess())
				return Engine.showMessageBox("Invalid Location", "Rhapsody is unable to write to the selected location.", 1);
	
    		var path = dir.toString(dir.FullPath);

    		setProperty("rhapsody", location, path);
    		label.set("text", path);
    	});	
    }

    inline function drawSettingsBlock(g)
    {
    	local a = this.getLocalBounds(0);
    	
    	g.setColour(this.get("itemColour"));
    	
    	for (x in this.getChildComponents())
    	{
	    	if (x.get("type") != "ScriptLabel" || x.get("parentComponent") != this.getId())
	    		continue;

	    	local lblArea = [x.get("x") - 10, x.get("y"), x.getWidth() + 20, x.getHeight()];
	    	g.fillRoundedRectangle(lblArea, 2);	    		
    	}

    	g.setColour(this.get("textColour"));
    	g.setFont("semibold", 22);
    	g.drawAlignedText(this.get("text"), a, "topLeft");
    	
    	g.setFont("regular", 18);
    	g.drawAlignedText(this.get("tooltip"), a.withTrimmedTop(35), "topLeft");
    }

    inline function getDirectory(location: string)
    {
	    local savedPath = getProperty("rhapsody", location);

	    if (isDefined(savedPath))
	    	return temp.createDirectory(savedPath); // Temp is a placeholder here, the real directory path will be used

		return temp.createDirectory(defaultPaths[location]);
    }

    inline function restoreValues()
    {
    	local contentPath = getProperty("rhapsody", "contentPath");

    	if (!isDefined(contentPath) || contentPath == "")
    	{
    		contentPath = defaultPaths["contentPath"];
    		setProperty("rhapsody", "contentPath", contentPath);
    	}

    	lblContentPath.set("text", contentPath);

    	local downloadPath = getProperty("rhapsody", "downloadPath");

    	if (!isDefined(downloadPath) || downloadPath == "")
    	{
    		downloadPath = defaultPaths["downloadPath"];
    		setProperty("rhapsody", "downloadPath", downloadPath);
    	}

    	lblDownloadPath.set("text", downloadPath);
    }

    inline function setProperty(scope, key, value)
    {
		local obj = {};
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("UserSettings.json");
		
		if (f.isFile())
			obj = f.loadAsObject();
			
		if (!isDefined(obj[scope]))
			obj[scope] = {};

		obj[scope][key] = value;
		
		f.writeObject(obj);
    }

    inline function getProperty(scope, key)
    {
		local obj = {};
	    local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("UserSettings.json");
	    
	    if (f.isFile())
	    	obj = f.loadAsObject();

    	return obj[scope][key];
    }
    
    //! Broadcasters
    Account.broadcasters.loggedIn.addComponentPropertyListener(["pnlSettingsBlock1", "pnlSettingsBlock2", "pnlSettingsBlock3"], "visible", "Set logout button visibility based on logged in state", function(index, state)
    {
    	return state;
    });
    
    //! Calls
    restoreValues();
    setBlockPositions();
    setButtonLookAndFeel();
}
