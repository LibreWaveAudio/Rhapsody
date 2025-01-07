/*
    Copyright 2023, 2025 David Healey

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

namespace Header
{
	//! lafHeaderButton
	const lafHeaderButton = Content.createLocalLookAndFeel();
	
	lafHeaderButton.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;
		
		var icons = {
			"sync": "\ue094",
			"favourites": "\ue2a8",
			"logout": "\ue42a",
			"login": "\ue428"
		};

		var c = Colours.withMultipliedBrightness(obj.itemColour1, obj.over ? 1.0 - 0.1 * obj.down : 0.9);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));

		g.setFont("phosphor", 18);
		
		if (obj.text == "favourites" && obj.value)
			g.setFont("phosphorFill", 18);

		g.drawAlignedText(icons[obj.text], a, "left");
		
		g.setFont("regular", 18);
		g.drawAlignedText(obj.text.capitalize(), [a[0] + 22, a[1], a[2] - 22, a[3]], "left");
	});
	
	//! lafcmbAdd
	const lafcmbAdd = Content.createLocalLookAndFeel();
	
	lafcmbAdd.registerFunction("drawComboBox", function(g, obj)
	{
		var a = obj.area;

		var c = Colours.withMultipliedBrightness(obj.itemColour1, obj.hover ? 1.0 - 0.1 * obj.down : 0.9);
		g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));
		
		g.setFont("phosphor", 18);
		g.drawAlignedText("\ue3d4", a, "left");
		
		g.setFont("regular", 18);
		g.drawAlignedText(obj.text, [a[0] + 22, a[1], a[2] - 22, a[3]], "left");
	});
	
	lafcmbAdd.registerFunction("drawPopupMenuBackground", function(g, obj)
	{
		LookAndFeel.drawPopupMenuBackground(); 
	});
	
	lafcmbAdd.registerFunction("drawPopupMenuItem", function(g, obj)
	{
		LookAndFeel.drawPopupMenuItem();
	});
	
	lafcmbAdd.registerFunction("getIdealPopupMenuItemSize", function(obj)
	{
		return [140, 30];
	});

	//! pnlHeader
	const pnlHeader = Content.getComponent("pnlHeader");
	
	pnlHeader.setPaintRoutine(function(g)
	{
		g.fillAll(this.get("bgColour"));
	});
	
	//! btnLogo
	const btnLogo = Content.getComponent("btnLogo");
	btnLogo.setControlCallback(onbtnLogoControl);
	
	inline function onbtnLogoControl(component, value)
	{
		if (value)
			return;
			
		About.show();	
	}

	const lafbtnLogo = Content.createLocalLookAndFeel();
	btnLogo.setLocalLookAndFeel(lafbtnLogo);

	lafbtnLogo.registerFunction("drawToggleButton", function(g, obj)
	{
		 var a = obj.area;

		 g.setColour(Colours.withMultipliedBrightness(obj.itemColour1, obj.over ? 1.0 - 0.1 * obj.value: 0.9));
		 		 
		 g.fillPath(Paths.rhapsodyLogoWithBg, [a[0], a[1], a[3], a[3]]);

		 g.setFont("title", Engine.getOS() == "WIN" ? 38 : 25);
		 g.drawAlignedText("RHAPSODY", [a[0] + 38, a[1], a[2] - 40, a[3] + 5 - (10 * (Engine.getOS() == "WIN"))], "left");
	});
	
	//! btnSync
	const btnSync = Content.getComponent("btnSync");
	btnSync.setLocalLookAndFeel(lafHeaderButton);
	btnSync.setControlCallback(onbtnSyncControl);

	inline function onbtnSyncControl(component, value)
	{
		if (!value)
			Library.sync();
	}

	//! pnlAddContainer - exists to allow setting mouse pointer for cmbAdd
	const pnlAddContainer = Content.getComponent("pnlAddContainer");
	pnlAddContainer.setMouseCursor("PointingHandCursor", Colours.white, [0, 0]);
		
	//! cmbAdd
	const cmbAdd = Content.getComponent("cmbAdd");
	cmbAdd.setLocalLookAndFeel(lafcmbAdd);
	cmbAdd.setControlCallback(oncmbAddControl);
	
	inline function oncmbAddControl(component, value)
	{
		switch (value)
		{
			case 1:
				Installer.manualInstall();
				break;
		
			case 2:
				LicenseHandler.show();
				break;
		}

		component.setValue(-1);
	}
	
	//! btnFavourites
	const btnFavourites = Content.getComponent("btnFavourites");
	btnFavourites.setLocalLookAndFeel(lafHeaderButton);
	
	//! btnLogin
	const btnLogin = Content.getComponent("btnLogin");
	btnLogin.setLocalLookAndFeel(lafHeaderButton);
	btnLogin.setControlCallback(onbtnLoginControl);
	
	inline function onbtnLoginControl(component, value)
	{
		if (value)
			return;

		LoginPage.show();
	}
		
	//! btnLogout
	const btnLogout = Content.getComponent("btnLogout");
	btnLogout.setLocalLookAndFeel(lafHeaderButton);
	btnLogout.setControlCallback(onbtnLogoutControl);
	
	inline function onbtnLogoutControl(component, value)
	{
		if (value)
			return;
	
		if (!Account.isLoggedIn())
			return Account.logout();
	
		Engine.showYesNoWindow("Confirmation", "Do you want to logout?", function(response)
		{
			if (response)
				Account.logout();
		});
	}
	
	//! Listeners
	App.broadcasters.isLoggedIn.addListener("Login button visibility", "Respond to login changes", function(state)
	{
		btnLogin.showControl(!state);
		btnLogout.showControl(state);
	});
}