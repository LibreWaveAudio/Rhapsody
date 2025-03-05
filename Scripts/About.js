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

namespace About
{
	//! pnlAboutContainer
	const pnlAboutContainer = Content.getComponent("pnlAboutContainer");
	
	pnlAboutContainer.setPaintRoutine(function(g)
	{		
		g.fillAll(Colours.withAlpha(Colours.black, 0.6));
		
		var a = [pnlAbout.get("x"), pnlAbout.get("y"), pnlAbout.getWidth(), pnlAbout.getHeight()];
		g.drawDropShadow([a[0], a[1], a[2], a[3]], Colours.withAlpha(Colours.black, 0.6), 20);		
	});
	
	pnlAboutContainer.setMouseCallback(function(event)
	{
		if (event.clicked)
			hide();
	});
	
	//! pnlAbout
	const pnlAbout = Content.getComponent("pnlAbout");
	
	pnlAbout.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		var radius = this.get("borderRadius");
		
		g.setColour(Colours.withMultipliedBrightness(this.get("bgColour"), 1.0));
		g.fillRoundedRectangle(a, radius);
				
		// Inner frame
		g.setColour(Colours.withMultipliedBrightness(this.get("bgColour"), 1.3));
		g.fillRoundedRectangle([30, 82, 510, 183], 1);
	
		// Project name
		g.setColour(this.get("textColour"));
		g.setFontWithSpacing("title", 20, 0.1);
		g.drawAlignedText(this.get("text"), [30, a[1] + 30, a[2], 15], "left");
	
		// Rhapsody logo
		g.setColour(Colours.withAlpha(this.get("itemColour2"), 0.2));
		g.fillPath(Paths.rhapsodyLogoWithBg, [a[2] / 1.5, a[3] / 2 - 130 / 2 + 3, 130, 130]);
	});
	
	//! btnAboutClose
	const btnAboutClose = Content.getComponent("btnAboutClose");
	btnAboutClose.setLocalLookAndFeel(LookAndFeel.closeButton);
	btnAboutClose.setControlCallback(onbtnAboutCloseControl);
	
	inline function onbtnAboutCloseControl(component, value)
	{
		if (!value)
			hide();
	}
	
	//! btnAboutDocumentation
	const btnAboutDocumentation = Content.getComponent("btnAboutDocumentation");
	btnAboutDocumentation.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnAboutDocumentation.setControlCallback(onbtnAboutDocumentationControl);
	
	inline function onbtnAboutDocumentationControl(component, value)
	{
		if (!value)
			Engine.openWebsite(Engine.getProjectInfo().CompanyURL + "/knowledge-base/");
	}

	//! btnAboutSupport
	const btnAboutSupport = Content.getComponent("btnAboutSupport");
	btnAboutSupport.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnAboutSupport.setControlCallback(onbtnAboutSupportControl);
	
	inline function onbtnAboutSupportControl(component, value)
	{
		if (!value)			
			Engine.openWebsite(Engine.getProjectInfo().CompanyURL + "/my-account/support/");
	}
	
	//! Functions
	inline function hide()
	{
		pnlAboutContainer.showControl(false);
	}
	
	inline function show()
	{
		pnlAboutContainer.showControl(true);
	}
	
	//! Calls
	hide();
}