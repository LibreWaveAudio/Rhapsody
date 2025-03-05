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

namespace LookAndFeel
{
	Content.setUseHighResolutionForPanels(true);
	
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/Inter-Regular.ttf", "regular");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/Inter-Medium.ttf", "medium");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/Inter-SemiBold.ttf", "semibold");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/Inter-Bold.ttf", "bold");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/JosefinSans-Bold.ttf", "title");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Icons/Phosphor/Phosphor.ttf", "phosphor");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Icons/Phosphor/Phosphor-Fill.ttf", "phosphorFill");
	
    const laf = Engine.createGlobalScriptLookAndFeel();
    
	// empty
	const empty = Content.createLocalLookAndFeel();
	
	empty.registerFunction("drawToggleButton", function(g, obj) {});
	empty.registerFunction("drawRotarySlider", function(g, obj) {});
	
	// Scrollbar
	laf.registerFunction("drawScrollbar", function(g, obj)
	{
		drawScrollbar(g, obj, 0xff111111);
	});

    // textButton
    const textButton = Content.createLocalLookAndFeel();
    
    textButton.registerFunction("drawToggleButton", function(g, obj)
    {
		drawTextButton(obj, obj.text, obj.area);
    });
        
    // linkButton
    const linkButton = Content.createLocalLookAndFeel();
    
    linkButton.registerFunction("drawToggleButton", function(g, obj)
    {
	    var a = obj.area;

	    g.setFont("medium", 14);
	    g.setColour(Colours.withAlpha(obj.textColour, obj.over ? 1.0 - (0.3 * obj.value) : 0.8));
	    g.drawAlignedText(obj.text, a, "left");

	    var stringWidth = g.getStringWidth(obj.text);
	    g.drawHorizontalLine(a[3] - 5, a[0], stringWidth);
    });

    //! iconButton
    const iconButton = Content.createLocalLookAndFeel();
    
    iconButton.registerFunction("drawToggleButton", function(g, obj)
    {
		var icons = {
			"show password": "\ue220",
			"backspace": "\ue0ae",
			"folder": "\ue256",
			"close": "\ue4f6"
		};
	
		if (!isDefined(icons[obj.text]))
			return;

	    var c = Colours.withMultipliedBrightness(obj.itemColour1, obj.over ? 1.0 - 0.3 * obj.down : 0.8);
	    g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

	    g.setFont("phosphor", obj.area[2]);
	    g.drawAlignedText(icons[obj.text], obj.area, "centred");
    });
    
    //! textIconButton
    const textIconButton = Content.createLocalLookAndFeel();
    
    textIconButton.registerFunction("drawToggleButton", function(g, obj)
    {
		var a = obj.area;
		var down = obj.text == "favourites" ? obj.down : (obj.value && obj.over);
		
		var icons = {
			"sync": "\ue094",
			"favourites": "\ue2a8",
			"log out": "\ue42a",
			"login": "\ue428",
			"work offline": "\ue4f2"
		};

		if (!isDefined(icons[obj.text]))
			return;

		var c = Colours.withMultipliedBrightness(obj.itemColour1, obj.over ? 1.0 - 0.1 * down : 0.9);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

		g.setFont("phosphor", 18);
		
		if (obj.text == "favourites" && obj.value)
			g.setFont("phosphorFill", 18);
				
		g.drawAlignedText(icons[obj.text], a, "left");
		
		g.setFont("regular", 18);
		g.drawAlignedText(obj.text.capitalize(), a, "right");
    });
    
    //! filledIconButton
    const filledIconButton = Content.createLocalLookAndFeel();
    
    filledIconButton.registerFunction("drawToggleButton", function(g, obj)
    {
		var a = obj.area;
		var icon = obj.text;
		var down = obj.down || obj.value;

		g.setColour(Colours.withAlpha(obj.bgColour, obj.over && obj.enabled ? 1.0 - 0.2 * down : 0.9 - (0.3 * !obj.enabled)));
		g.fillRoundedRectangle(a, 2);

		g.setColour(Colours.withAlpha(Colours.black, obj.enabled ? 1.0 : 0.6));
		g.drawRoundedRectangle([a[0] + 0.5, a[1] + 0.5, a[2] - 1, a[3] - 1], 2, 1);

		var wh = a[3] / 1.8;
		g.setColour(Colours.withAlpha(obj.textColour, obj.over && obj.enabled ? 0.8 + 0.2 * down: 0.9 - (0.3 * !obj.enabled)));
		g.fillPath(Paths.icons[icon], [a[0] + a[2] / 2 - wh / 2, a[1] + a[3] / 2 - wh / 2, wh, wh]);
    });

	//! Alert window
    laf.registerFunction("drawAlertWindow", function(g, obj)
    {
		var a = obj.area;
    
   		g.fillAll(Colours.withMultipliedBrightness(0xff222222, 1.5));
   
   		g.setColour(Colours.withAlpha(Colours.black, 0.5));
   		g.drawRoundedRectangle(a, 1, 1);
   	
   		g.setFont("bold", 20);
   		g.setColour(0xffcccccc);
   		g.drawAlignedText(obj.title, [a[0], a[1] + 10, a[2], 25], "centred");
	});

   	laf.registerFunction("getAlertWindowMarkdownStyleData", function(obj)
   	{
		obj.headlineFont = "bold";
   		obj.font = "medium";
   		obj.fontSize = 18;
   		obj.textColour = 0xffcccccc;
   		return obj;
   	});
    	
   	laf.registerFunction("drawAlertWindowIcon", function(g, obj)
   	{
		var a = obj.area;
   		var icons = {"Info": "\ue2ce", "Warning": "\ue4e0", "Question": "\ue3e8", "Error": "\ue7fc"};
   
   		g.setFont("phosphor", 42);
   		g.setColour(Colours.withAlpha(0xffcccccc, 0.8));
   		g.drawAlignedText(icons[obj.type], a, "centred");	
   	});
   	    	
   	laf.registerFunction("drawDialogButton", function(g, obj)
   	{
   		var a = obj.area;
   		var fontSize = 18;
   		var text = obj.text;

   		if (["Exit"].contains(obj.parentName))
   			text = obj.text == "OK" ? "Yes" : "No";

   		var colours = {
   			bgColour: Colours.withMultipliedBrightness(0xff222222, 1.5),		
   			textColour: 0xffcccccc
   		};

		drawDialogButton();
   	});

   	//! Dialog button
   	inline function drawDialogButton()
   	{
   		local a = obj.area;
   		local radius = 2;
   		local bgColour = isDefined(colours.bgColour) ? colours.bgColour : obj.bgColour;
   		local textColour = isDefined(colours.textColour) ? colours.textColour : obj.textColour;

   		local c = Colours.withMultipliedBrightness(bgColour, 2.5 + obj.over - 0.2 * obj.down);
   		g.setColour(Colours.withAlpha(c, obj.enable ? 1.0 : 0.5));

   		g.fillRoundedRectangle(a, radius);

   		g.setColour(Colours.withAlpha(Colours.black, 0.7));
   		g.drawRoundedRectangle([a[0] + 0.25, a[1] + 0.25, a[2] - 0.5, a[3] - 0.5], radius, 1);

   		g.setColour(Colours.withMultipliedBrightness(textColour, 1.0 + obj.over - 0.2 * obj.down));
   		g.setFont("medium", isDefined(fontSize) ? fontSize : 18);
   		g.drawAlignedText(text, a, "centred");
   	}

    inline function drawTextButton(obj, text, area)
    {
		local alignment = "centred";
		local down = obj.down || obj.value;
		
		local c = Colours.withMultipliedBrightness(obj.bgColour, obj.over ? 1.0 - 0.2 * obj.down : 0.9);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

        g.fillRoundedRectangle(area, 2);

		c = Colours.withMultipliedBrightness(obj.textColour, obj.over ? 1.0 - 0.2 * obj.down : 0.9);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

        g.setFont("semibold", 16);
        g.drawAlignedText(text, [area[0], area[1], area[2], area[3]], alignment);
    }

	//! Close Button
	const closeButton = Content.createLocalLookAndFeel()
	
	closeButton.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
	
		g.setFont("phosphor", 20);
		var c = Colours.withMultipliedBrightness(obj.textColour, obj.over ? 1.0 - 0.2 * obj.value : 0.7);
		g.setColour(Colours.withMultipliedAlpha(c, obj.enabled ? 1.0 : 0.5));
		
		g.drawAlignedText("\ue4f6", a, "centred");
	});
	
	//! viewportTable
	const viewportTable = Content.createLocalLookAndFeel();
				
	viewportTable.registerFunction("drawTableHeaderBackground", function(g, obj)
	{
		 
	});
	
	viewportTable.registerFunction("drawTableHeaderColumn", function(g, obj)
	{
		 var a = obj.area;
		 
		 g.setFont("medium", 16);
		 g.setColour(0xffcccccc);
		 g.drawAlignedText(obj.text, a, "left");
	});	
	
	viewportTable.registerFunction("drawTableRowBackground", function(g, obj)
	{
		g.fillAll(obj.rowIndex % 2 == 0 ? 0xff171616 : 0xff1b1a1a);
	});
	
	viewportTable.registerFunction("drawTableCell", function(g, obj)
	{	
		var a = obj.area;
	
		g.setFont("regular", 14);
		g.setColour(0xffcccccc);
		g.drawAlignedText(obj.text, obj.area, "left");
	});
	
	viewportTable.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
		a[0] += 10;
		var buttonSize = a[3] / 2.2;

		g.setColour(0xffcccccc);
		g.drawEllipse([a[0] + 1, a[3] / 2 - buttonSize / 2, buttonSize, buttonSize], 1.5);

		var c = Colours.withMultipliedBrightness(0xffcccccc, (obj.value ? 0.9 : 0.3) + 0.2 * obj.over);
		g.setColour(c);

		g.fillEllipse(Rect.reduced([a[0] + 1, a[3] / 2 - buttonSize / 2, buttonSize, buttonSize], 2.8));
	});
	
	viewportTable.registerFunction("drawScrollbar", function(g, obj)
	{
		 drawScrollbar(g, obj, 0xff111111);
	});
	
	//! Combo box
	laf.registerFunction("drawPopupMenuBackground", function(g, obj)
	{
	   	drawPopupMenuBackground();
	});
	
	laf.registerFunction("drawPopupMenuItem", function(g, obj)
	{
		drawPopupMenuItem();
	});
	
	laf.registerFunction("getIdealPopupMenuItemSize", function(obj)
	{
		var width = Engine.getStringWidth(obj.text, "regular", 18, 0.0) + 60;		
		return [width, 30];
	});

    inline function drawPopupMenuBackground()
    {
	    g.fillAll(0xff2a2a2a);
    }
    
    inline function drawPopupMenuItem()
    {
		local a = obj.area;
		local radius = 1;
		local highlightColour = Colours.darkgrey;
		local textColour = 0xffcccccc;
		
		if (obj.isSeparator)
		{
			g.setColour(Colours.withAlpha(textColour, 0.3));
			g.drawHorizontalLine(a[3] / 2, a[0] + 5, a[2] - 10);
			return;
		}
		
		if (obj.isHighlighted)
		{
			g.setColour(highlightColour);
			g.fillRoundedRectangle(a, radius);
		}
		
		local x = a[0] + 40;
		g.setFont("regular", 18);
		g.setColour(Colours.withMultipliedAlpha(textColour, obj.isHighlighted ? 1.0 : 0.9));
		g.drawFittedText(obj.text, [x, a[1], a[2] - x - 10, a[3]], "left", 1.0, 1.0);
		
		local icons = {
			"Install from File": "\ue390",
			"Add a License": "\ue2d6",
			"Add to Favourites": "\ue2a8",
			"Remove Favourite": "\uebe8",
			"Set Samples Folder": "\ue238",
			"Uninstall": "\ue4a8",
			"Visit Webpage": "\ue0f4"
		};		

		if (!isDefined(icons[obj.text]))
			return;

		g.setFont("phosphor", 22);
		g.drawAlignedText(icons[obj.text], [a[0] + 10, a[1], a[2], a[3]], "left");
    }
        
	inline function fullPageBackground()
	{
		g.fillAll(this.get("bgColour"));
		
		// Logo
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[2] / 2 - 36 / 2, 80, 36, 36]);
			
		g.setFont("title", Engine.getOS() == "WIN" ? 42 : 28);
		g.drawAlignedText(Engine.getName().toUpperCase(), [0, 135 - 7 * (Engine.getOS() == "WIN"), a[2], 30], "centred");
		
		g.setFont("phosphor", 12);
		g.drawAlignedText("\ue3f4", [85, 138 - 7 * (Engine.getOS() == "WIN"), a[2], 30], "centred");
	}

    inline function drawScrollbar(g, obj, bgColour)
    {
		local a = obj.area;
		local radius = 1;
		local ha = obj.handle;
		local w = 10;
		
		g.setColour(bgColour);
		g.fillRoundedRectangle([a[2] - w + 2, a[1], w - 4, a[3]], radius + 1);

		g.setColour(Colours.withAlpha(0xffaaaaaa, obj.over || obj.down ? 0.8 - 0.3 * obj.down : 0.3));
		g.fillRoundedRectangle([a[2] - w + 3, ha[1] + 1, w - 6, ha[3] - 2], radius);
    }
}
