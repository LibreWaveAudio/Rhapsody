/*
    Copyright 2021, 2022, 2023, 2025, 2026 David Healey

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
	
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/AtkinsonHyperlegibleMono-Regular.ttf", "monoRegular");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/AtkinsonHyperlegibleMono-Medium.ttf", "monoMedium");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/AtkinsonHyperlegibleMono-SemiBold.ttf", "monoSemiBold");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/AtkinsonHyperlegibleMono-Bold.ttf", "monoBold");	
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Text/JosefinSans-Bold.ttf", "title");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Icons/Phosphor/Phosphor.ttf", "phosphor");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Icons/Phosphor/Phosphor-Bold.ttf", "phosphorBold");
	Engine.loadFontAs("{PROJECT_FOLDER}Fonts/Icons/Phosphor/Phosphor-Fill.ttf", "phosphorFill");

    const laf = Engine.createGlobalScriptLookAndFeel();

	//! Alert window	
	laf.registerFunction("drawAlertWindow", function(g, obj)
	{
		drawAlertWindow();
	});

	inline function drawAlertWindow()
	{
		local a = obj.area.expanded(20);
		local titleFont = "monoSemiBold";
		local titleFontSize = 24;
		local font = "monoRegular";
		local fontSize = 20;
		local bgColour = 0xff2f2f2f;
		local itemColour = 0xff1f1f1f;
		local itemColour2 = 0x77d6dadd;
		local itemColour3 = 0xff101112;
		local textColour = 0xffd6dadd;
		local radius = 2;
		local borderSize = 1;
		local labelRadius = 2;
		local hasLabel = isDefined(obj.labelArea) && obj.labelArea[0] != 0;

		g.drawDropShadow(a, Colours.withAlpha(Colours.black, 0.5), 20);

		g.setColour(bgColour);
		g.fillRoundedRectangle(a, radius);

		g.setColour(itemColour);
		g.fillRoundedRectangle([a[0], a[1], a[2], 45], {CornerSize: radius, Rounded:[1, 1, 0, 0]});

		g.setColour(itemColour2);

		if (borderSize > 0)
			g.drawRoundedRectangle(a.reduced(borderSize / 2), radius, borderSize);

		g.setFont(titleFont, titleFontSize);
		g.setColour(textColour);
		g.drawAlignedText(obj.title, [a[0], a[1] + 10, a[2], 25], "centred");

		if (isDefined(obj.text))
		{
			g.setColour(textColour);
			g.setFont(font, fontSize);

			if (hasLabel)
				g.drawAlignedText(obj.text, [a[0], a[1], a[2], a[3] - 85], "centred");
			else
				g.drawAlignedText(obj.text, [a[0], a[1], a[2], a[3] - 30], "centred");				
		}

		g.setColour(Colours.withMultipliedBrightness(itemColour3, 0.6));

		if (hasLabel)
			g.fillRoundedRectangle(obj.labelArea, labelRadius);

		g.addNoise({alpha: 0.025, scaleFactor: 1.5, area: a.toArray(), monochromatic: true});
	}

	laf.registerFunction("getAlertWindowMarkdownStyleData", function(obj)
	{
		return getAlertWindowMarkdownStyleData();
	});

	inline function getAlertWindowMarkdownStyleData()
	{
		obj.headlineFont = "monoMedium";
		obj.font = "monoRegular";
		obj.fontSize = 22;
		obj.textColour = 0xffd7d8da;
		return obj;
	}
	
	laf.registerFunction("drawAlertWindowIcon", function(g, obj)
	{
		drawAlertWindowIcon();
	});
	
	inline function drawAlertWindowIcon()
	{
		local a = obj.area;
		local icons = {"Info": "\ue2ce", "Warning": "\ue4e0", "Question": "\ue3e8", "Error": "\ue7fc"};
		local textColour = 0xffd7d8da;

		g.setFont("phosphor", 42);
		g.setColour(Colours.withAlpha(textColour, 0.8));
		g.drawAlignedText(icons[obj.type], a, "centred");		
	}
	
	laf.registerFunction("drawDialogButton", function(g, obj)
	{
		drawDialogButton();
	});

    //! Text Button
    const textButton = Content.createLocalLookAndFeel();
    
    textButton.registerFunction("drawToggleButton", function(g, obj)
    {
		drawTextButton(obj);
    });

	inline function drawTextButton(obj)
	{
		local a = obj.area;
		local radius = 2;
		local borderSize = 1;
		local down = obj.down || obj.value;

		local c = Colours.withMultipliedBrightness(obj.bgColour, obj.over ? 1.2 - 0.2 * down : 1.0);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

		if (obj.bgColour != 0x0)
			g.fillRoundedRectangle(a, radius);
		
		g.setColour(Colours.withMultipliedBrightness(obj.itemColour1, obj.over ? 1.2 - 0.2 * down : 1.0));
		g.drawRoundedRectangle(a.reduced(borderSize / 2), radius, borderSize);
		
		g.setColour(Colours.withMultipliedBrightness(obj.textColour, obj.over ? 1.1 - 0.1 * down : 0.8));
		g.setFont("monoSemiBold", 18);
		g.drawAlignedText(obj.text.toUpperCase(), a, "centred");
	}
	
	//! Dialog button
	inline function drawDialogButton()
	{
		local a = obj.area;
		local text = obj.text;
		local bgColour = 0xff1d1d1d;
		local textColour = 0xffd6dadd;
		local font = "monoMedium";
		local fontSize = 18;
		local radius = 2;
		
		if (["Update Check", "Rhapsody Update", "Uninstall", "Open Website", "Installation Complete", "Remove Presets"].contains(obj.parentName))
			text = obj.text == "OK" ? "Yes" : "No";
	
		g.setColour(Colours.withMultipliedBrightness(bgColour, obj.over ? 2.0 - 0.5 * obj.down : 1.0));
		g.fillRoundedRectangle(a, radius);
	
		g.setColour(Colours.withAlpha(Colours.black, 0.7));
		g.drawRoundedRectangle([a[0] + 0.25, a[1] + 0.25, a[2] - 0.5, a[3] - 0.5], radius, 1);
	
		g.setColour(Colours.withMultipliedBrightness(textColour, 1.0 + obj.over - 0.2 * obj.down));
		g.setFont(font, fontSize);
		g.drawAlignedText(text.toUpperCase(), a, "centred");
	}

    //! Icon Button Momentary
    const iconButtonMomentary = Content.createLocalLookAndFeel();
    
    iconButtonMomentary.registerFunction("drawToggleButton", function(g, obj)
    {
	    var c = Colours.withMultipliedBrightness(obj.textColour, obj.over ? 1.0 - 0.3 * obj.down : 0.8);
	    g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

	    g.setFont("phosphorBold", obj.area[2]);
	    g.drawAlignedText(String.fromCharCode(obj.text), obj.area, "centred");
    });
	
	//! Popup Menu
	laf.registerFunction("drawPopupMenuBackground", function(g, obj)
	{
	   	drawPopupMenuBackground();
	});
	
	inline function drawPopupMenuBackground()
	{
		local a = obj.area;
		local bgColour = 0xff1f1f1f;
		local borderColour = 0x77d6dadd;
		local borderSize = 1;
		local borderRadius = 2;
	
		g.setColour(bgColour);
		g.fillRoundedRectangle(a, borderRadius);
	
		g.addNoise({alpha: 0.025, scaleFactor: 1.5, area: a.toArray(), monochromatic: true});
	
		g.setColour(borderColour);
		g.drawRoundedRectangle(a.reduced(borderRadius / 4), borderRadius, borderSize);
	}
	
	laf.registerFunction("drawPopupMenuItem", function(g, obj)
	{
		drawPopupMenuItem();
	});
	
	inline function drawPopupMenuItem()
	{
		local a = obj.area;
		local hasIcon = obj.text.startsWith("e");
		local icon = obj.text.substring(0, obj.text.indexOf("-"));
		local text = obj.text.replace(icon + "-");
		local itemColour2 =0x995E6167;
		local textColour = 0xffd7d8da;
		local font = "monoRegular";
		local fontSize = 18;
		local iconFont = "phosphor";
		local iconFontSize = 22;
		local subMenuIcon = "e13a";
		local subMenuIconFontSize = 16;
		local radius = 2;

		if (obj.isSeparator)
		{
			g.setColour(Colours.withAlpha(textColour, 0.3));
			g.drawHorizontalLine(a[3] / 2, a[0] + 5, a[2] - 10);
			return;
		}
	
		if (obj.isHighlighted || obj.isTicked)
		{
			g.setColour(Colours.withMultipliedAlpha(itemColour2, obj.isHighlighted && !obj.isTicked ? 0.6 : 1.0));
			g.fillRoundedRectangle(a.reduced(5, 2), radius);
		}
	
		g.setFont(font, fontSize);
		g.setColour(Colours.withMultipliedAlpha(textColour, obj.isHighlighted ? 1.0 : 0.9));
		g.drawFittedText(text, a.withTrimmedRight(10 + (30 * hasIcon)).translated(10 + (30 * hasIcon), textOffsetY), "left", 1.0, 1.0);
	
		if (hasIcon)
		{
			g.setFont(iconFont, iconFontSize);
			g.drawAlignedText(String.fromCharCode(icon), a.translated(10, 0), "left");
		}			
	
		if (obj.hasSubMenu)
		{
			g.setFont(iconFont, subMenuIconFontSize);
			g.drawAlignedText(String.fromCharCode(subMenuIcon), a.translated(-10, 0), "right");
		}
	
		g.addNoise({alpha: 0.025, scaleFactor: 1.5, area: a.toArray(), monochromatic: true});
	}
	
	laf.registerFunction("getIdealPopupMenuItemSize", function(obj)
	{
		return getIdealPopupMenuItemSize();
	});
	
	inline function getIdealPopupMenuItemSize()
	{
		local width = Engine.getStringWidth(obj.text, "monoRegular", 18, 0.0) + 30;
		return [width, 40];		
	}

	//! Full Page Background
	inline function fullPageBackground()
	{
		g.fillAll(this.get("bgColour"));

		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.fillPath(Paths.rhapsodyLogo, [a[2] / 2 - 223 / 2, 80, 223, 38]);
	}
	
	//! Scrollbar
	laf.registerFunction("drawScrollbar", function(g, obj)
	{
		drawScrollbar();
	});

    inline function drawScrollbar()
    {
		local a = obj.area;
		local radius = 1;
		local ha = obj.handle;
		local w = 10;

		g.setColour(obj.bgColour);
		g.fillRoundedRectangle([a[2] - w + 2, a[1], w - 4, a[3]], radius + 1);

		g.setColour(Colours.withMultipliedBrightness(obj.itemColour, obj.over || obj.down ? 0.8 - 0.2 * obj.down : 0.5));
		g.fillRoundedRectangle([a[2] - w + 3, ha[1] + 1, w - 6, ha[3] - 2], radius);
    }
}
