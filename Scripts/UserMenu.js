/*
    Copyright 2023, 2025, 2026 David Healey

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

namespace UserMenu
{
	//! pnlUserMenuContainer
	const pnlUserMenuContainer = Content.getComponent("pnlUserMenuContainer");
	pnlUserMenuContainer.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);

	//! cmbUserMenu
	const cmbUserMenu = Content.getComponent("cmbUserMenu");
	
	const lafcmbUserMenu = Content.createLocalLookAndFeel();
	cmbUserMenu.setLocalLookAndFeel(lafcmbUserMenu);
	cmbUserMenu.setControlCallback(oncmbUserMenuControl);
	
	inline function oncmbUserMenuControl(component, value)
	{
		component.setValue(-1);
	}

	lafcmbUserMenu.registerFunction("drawComboBox", function(g, obj)
	{
		var c = Colours.withMultipliedBrightness(obj.textColour, obj.hover ? 1.0 - 0.3 * obj.down : 0.8);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

		g.setFont("phosphorBold", obj.area[2]);
		g.drawAlignedText("\ue272", obj.area, "centred");
	});

	lafcmbUserMenu.registerFunction("drawPopupMenuBackground", function(g, obj)
	{
	   	LookAndFeel.drawPopupMenuBackground();
	});

	lafcmbUserMenu.registerFunction("drawPopupMenuItem", function(g, obj)
	{
		var topLevel = ["columns", "zoom level", "check for updates"];
		var menuIcons = {"columns": "\ue546", "zoom level": "\ued6e", "check for updates": "\ue094"};

		LookAndFeel.drawPopupMenuItem();
	});

	lafcmbUserMenu.registerFunction("getIdealPopupMenuItemSize", function(obj)
	{
		var width = Engine.getStringWidth(obj.text, "regular", 18, 0.0) + 60;		
		return [width, 40];
	});

	//! Functions
	inline function updateMenuItems()
	{
		local items = [];
		
		items.concat([
			"Columns::4",
			"Columns::5",
			"Columns::6"
		]);

		items.concat([
			"Zoom Level::0.75x",
			"Zoom Level::1.0x",
			"Zoom Level::1.5x",
			"Zoom Level::2x"
		]);

		items.push("Check for Updates");

		cmbUserMenu.set("items", items.join("\n"));
	}
	
	//! Calls
	updateMenuItems();
}
