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

namespace Theme
{
	const ALL_THEMES = getThemes();
	const DEFAULT = "catppuccin";

	reg current;

	//! Functions
	inline function: Array getThemes()
	{
		local result = [];

		local dir = FileSystem.getFolder(FileSystem.AppData).createDirectory("Themes");
		
		if (!isDefined(dir) || !dir.isDirectory())
			return [];
			
		local files = FileSystem.findFiles(dir, "*.json", false);
		
		for (x in files)
			result.push(x.loadAsObject());
			
		return result;
	}
	
	inline function getThemeByName(name: string)
	{
		for (x in ALL_THEMES)
		{
			if (x.name == name)
				return x;
		}
		
		return undefined;
	}
	
	inline function: Array getThemeNames()
	{
		local result = [];

		for (x in ALL_THEMES)
		{
			if (isDefined(x.name))
				result.push(x.name);
		}
		
		result.sortNatural();

		return result;
	}
	
	inline function restoreLastTheme()
	{
		local themeName = UserSettings.getProperty("rhapsody", "theme");
		
		if (!isDefined(themeName) || themeName == "")
			themeName = DEFAULT;

		setTheme(themeName);
	}
	
	inline function setTheme(name: string)
	{
		local theme = getThemeByName(name);
		
		if (!isDefined(theme))
			return;

		UserSettings.setProperty("rhapsody", "theme", name);
		current = theme;
		applyTheme(theme);
	}
	
	inline function applyTheme(theme)
	{
		for (x in Content.getAllComponents(""))
		{
			for (c in ThemeMap.components)
			{
				if (x.getId() != c.id)
					continue;
					
				for (property in c)
				{
					if (property != "id")
						x.set(property, current[c[property]]);
				}

				if (c.id == "cmbUserMenu")
				{
					LookAndFeel.extraColours.bgColour = current[c.bgColour];
					LookAndFeel.extraColours.textColour = current[c.textColour];
				}
			}

			if (x.get("type") == "ScriptPanel")
				x.repaint();
			else
				x.sendRepaintMessage();
		}

		ProductGrid.refresh();
	}
	
	//! Function Calls
	restoreLastTheme();
	
	//! Broadcasters
	const bcUserMenuValue = Engine.createBroadcaster({id: "bcThemeMenuValue", args: ["component", "value"]});
	bcUserMenuValue.attachToComponentValue("cmbUserMenu", "");
	
	bcUserMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		var themeNames = getThemeNames();
		var selection = component.getItemText().toLowerCase();
		
		if (!themeNames.contains(selection))
			return;

		setTheme(selection);
	});
}