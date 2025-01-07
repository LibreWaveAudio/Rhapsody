/*
    Copyright 2021, 2022, 2023 David Healey

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
		drawScrollbar(g, obj, 0xff302F34);
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

    // iconButton
    const iconButton = Content.createLocalLookAndFeel();
    
    iconButton.registerFunction("drawToggleButton", function(g, obj)
    {
		var icons = {
			"show password": "\ue220",
			"backspace": "\ue0ae",
			"folder": "\ue256"
		};
	
		if (!isDefined(icons[obj.text]))
			return;

	    var c = Colours.withMultipliedBrightness(obj.itemColour1, obj.over ? 1.0 - 0.3 * obj.down : 0.8);
	    g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

	    g.setFont("phosphor", obj.area[2]);
	    g.drawAlignedText(icons[obj.text], obj.area, "centred");

		/*var a = obj.area;
		var icon = obj.text;

		if (icon.indexOf("iconOff") != -1 && !obj.value)
		{
			icon = icon.substring(icon.indexOf("iconOff-") + 8, icon.indexOf(" "));
		}
		else if (icon.indexOf("iconOn") != -1 && obj.value)
		{
			icon = icon.substring(icon.indexOf("iconOn-") + 7, icon.length);
		}
		else
		{
			if (icon.indexOf("circle-") != -1)
			{
				icon = icon.replace("circle-");
				
				g.setColour(Colours.withAlpha(obj.bgColour, obj.over ? 1.0 : 0.8));
				g.fillEllipse(a);
				a = [a[2] / 2 - (a[2] / 2) / 2, a[3] / 2 - (a[3] / 2) / 2, a[2] / 2, a[3] / 2];
			}
		}

		var colour = obj.value == 0 ? obj.itemColour1 : obj.itemColour2;
		g.setColour(Colours.withAlpha(colour, obj.over && obj.enabled ? 1.0 - (0.2 * obj.down) : 0.8 - (0.2 * obj.down) - (0.3 * !obj.enabled)));

		g.fillPath(Paths.icons[icon], a);  */
    });
    
    // textIconButton
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
    
    // filledIconButton
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

		if (icon == "x")
		{
			var wh = a[3] / 3;
			g.setColour(obj.itemColour1);
			g.fillPath(Paths.icons[icon], [a[0] + a[2] / 2 - wh / 2, a[1] + a[3] / 2 - wh / 2, wh, wh]);  
		}
		else
		{
			var wh = a[3] / 1.8;
			g.setColour(Colours.withAlpha(obj.textColour, obj.over && obj.enabled ? 0.8 + 0.2 * down: 0.9 - (0.3 * !obj.enabled)));
			g.fillPath(Paths.icons[icon], [a[0] + a[2] / 2 - wh / 2, a[1] + a[3] / 2 - wh / 2, wh, wh]);
		}
    });

    // Combo box
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
		return [163, 30];
	});

    // Alert window    
    laf.registerFunction("drawAlertWindow", function(g, obj)
    {        
        var a = obj.area;
        var h = 40;

		g.fillAll(0xff2F2F34);

        g.setColour(0xff161619);
        g.fillRect([a[0], a[1], a[2], h]);

        g.setFont("semibold", 20);
        g.setColour(Colours.white);
        g.drawAlignedText(obj.title, [a[0] + 15, a[1], a[2], h], "left");        
        
        g.setColour(Colours.withAlpha(Colours.white, 0.3));
		g.drawRect(a, 1);
    });
    
    laf.registerFunction("getAlertWindowMarkdownStyleData", function(obj)
    {
        obj.font = "medium";
        obj.fontSize = 18;
        obj.textColour = Colours.white;
        return obj;
    });
    
	laf.registerFunction("drawAlertWindowIcon", function(g, obj)
    {
        var a = [obj.area[0], obj.area[1] + 10, obj.area[2], obj.area[3] - 10];
        var path = Paths.icons[obj.type.toLowerCase()];
		var multiplier = 1;
		
        switch (obj.type)
        {
	        case "Info": multiplier = 0.46; break;
	        case "Warning": multiplier = 0.18; break;
	        case "Question": multiplier = 0.58; break;
	        case "Error":
	        	multiplier = 0.18;
	        	path = Paths.icons.warning;
	        	break;
		}

		g.setColour(Colours.white);
		g.fillPath(path, [a[0], a[1] + a[3] / 2 - a[3] / 1.5 / 2, a[3] * multiplier / 1.5, a[3] / 1.5]);
    });
        
    laf.registerFunction("drawDialogButton", function(g, obj)
    {
    	var a = obj.area;

    	obj.bgColour = 0xff161619;
    	obj.textColour = Colours.white;
    	var text = obj.text;

		if (["Visit Website", "Confirmation", "Uninstall", "Uninstall Presets", "Batch Install"].contains(obj.parentName))
			text = obj.text == "OK" ? "Yes" : "No";

   		drawTextButton(obj, text, a);
    });
    
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

    inline function drawPopupMenuBackground()
    {
	    local a = [0, 0, obj.width, obj.height];

	    g.fillAll(0xff1d1d21);

	    g.setColour(Colours.grey);
	    g.drawRect(a, 1);
    }
    
    inline function drawPopupMenuItem()
    {
    	local a = obj.area;
    
		if (obj.isHighlighted)
			g.fillAll(Colours.withAlpha(0xffa8b2bd, 0.8));

		local icons = {
			"Install from File": "\ue390",
			"Add a License": "\ue2d6",
			"Add to Favourites": "\ue2a8",
			"Remove Favourite": "\uebe8",
			"Locate Samples": "\ue238",
			"Uninstall": "\ue4a8",
			"Visit Webpage": "\ue0f4"
		};

		if (obj.isSeparator)
		{
			g.setColour(Colours.white);
			g.drawHorizontalLine(a[3] / 2, a[0] + 5, a[2] - 10);
			return;
		}

		obj.isHighlighted ? g.setColour(Colours.black): g.setColour(Colours.lightgrey);
		g.setFont("regular", 16);
	
		if (!isDefined(icons[obj.text]))
			return g.drawFittedText(obj.text, [a[0] + 10, a[1], a[2] - 20, a[3]], "left", 1, 1.0);
	
		g.drawFittedText(obj.text, [a[0] + 30, a[1], a[2] - 20, a[3]], "left", 1, 1.0);
	
		g.setFont("phosphor", 16);
		g.drawAlignedText(icons[obj.text], [a[0] + 7, a[1], a[2], a[3]], "left");
    }
        
	inline function fullPageBackground()
	{
		g.fillAll(this.get("bgColour"));
		
		// Logo
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[2] / 2 - 36 / 2, 80, 36, 36]);    	
		g.setFont("title", Engine.getOS() == "WIN" ? 42 : 28);
		g.drawAlignedText(Engine.getName().toUpperCase(), [0, 135 - 7 * (Engine.getOS() == "WIN"), a[2], 30], "centred");
	}
        
    inline function drawScrollbar(g, obj, bgColour)
    {
    	local a = obj.area;
    	local ha = obj.handle;
    	local w = a[2] > 10 ? 10 : a[2];

    	g.setColour(Colours.withAlpha(bgColour, 0.8));
    	g.fillRoundedRectangle([a[0] + a[2] - w + 2, a[1], w - 4, a[3]], 2);

    	g.setColour(Colours.withAlpha(0xff696970, obj.over ? 0.8 + (0.2 * obj.down) : 0.5));
    	g.fillRoundedRectangle([ha[0] + a[2] - w, ha[1], w, ha[3]], 3);
    }
}
