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

namespace LoginPage
{	
	//! lafPlainTextButton
	const lafPlainTextButton = Content.createLocalLookAndFeel();
	
	lafPlainTextButton.registerFunction("drawToggleButton", function(g, obj)
	{	
		var c = Colours.withMultipliedBrightness(obj.textColour, obj.over ? 1.0 - 0.3 * obj.down : 0.8);
	    g.setColour(Colours.withAlpha(c, obj.enabled ? 1.0 : 0.5));
		g.setFont("medium", 14);
		g.drawAlignedText(obj.text, obj.area, "left");
	});

	//! pnlLoginContainer
	const pnlLoginContainer = Content.getComponent("pnlLoginContainer");

	pnlLoginContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		LookAndFeel.fullPageBackground();

		// Label backgrounds
		g.setColour(this.get("itemColour"));

		var usernameArea = Rectangle(lblUsername.get("x") - 36, lblUsername.get("y"), lblUsername.getWidth() + 50, lblUsername.getHeight());
		var passwordArea = Rectangle(lblPassword.get("x") - 36, lblPassword.get("y"), lblPassword.getWidth() + 71, lblPassword.getHeight());

		g.fillRoundedRectangle(usernameArea, 5);
		g.fillRoundedRectangle(passwordArea, 5);

		// Tooltip
		g.setFont("regular", 18);
		g.setColour(this.get("textColour"));
		g.drawAlignedText(this.get("tooltip"), usernameArea.translated(0, -60), "centred");

		// Label icons
		g.setFont("phosphor", 20);
		g.setColour(this.get("itemColour2"));

		g.drawAlignedText("\ue218", [usernameArea[0] + 8, usernameArea[1], usernameArea[3], usernameArea[3]], "left");
		g.drawAlignedText("\uea78", [passwordArea[0] + 8, passwordArea[1], passwordArea[3], passwordArea[3]], "left");

		// Version
		g.setFont("regular", 16);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.5));
		g.drawAlignedText("v" + Engine.getVersion(), a.reduced(20), "bottomRight");
	});

	//! lblUsername
	const lblUsername = Content.getComponent("lblUsername");
	
	//! lblPassword
	const lblPassword = Content.getComponent("lblPassword");
	
	//! btnShowPassword
	const btnShowPassword = Content.getComponent("btnShowPassword");
	btnShowPassword.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
	btnShowPassword.setControlCallback(onbtnShowPasswordControl);
	
	inline function onbtnShowPasswordControl(component, value)
	{
		lblPassword.set("fontStyle", value ? "plain" : "Password");
	}
	
	//! btnLoginCancel
	const btnLoginCancel = Content.getComponent("btnLoginCancel");
	btnLoginCancel.setLocalLookAndFeel(LookAndFeel.textButton);
	btnLoginCancel.setControlCallback(onbtnLoginCancelControl);
	
	inline function onbtnLoginCancelControl(component, value)
	{
		if (!value)
			workOffline();
	}
		
	//! btnLoginSubmit
	const btnLoginSubmit = Content.getComponent("btnLoginSubmit");
	btnLoginSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnLoginSubmit.setControlCallback(onbtnLoginSubmitControl);
	
	inline function onbtnLoginSubmitControl(component, value)
	{
		if (!value)
			Account.login(lblUsername.get("text"), lblPassword.get("text"));
	}
	
	//! btnLoginRecovery
	const btnLoginRecovery = Content.getComponent("btnLoginRecovery");
	btnLoginRecovery.setLocalLookAndFeel(lafPlainTextButton);
	btnLoginRecovery.setControlCallback(onbtnLoginRecoveryControl);
	
	inline function onbtnLoginRecoveryControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "my-account/lost-password/");
	}

	//! btnRegisterAccount
	const btnRegisterAccount = Content.getComponent("btnRegisterAccount");
	btnRegisterAccount.setLocalLookAndFeel(lafPlainTextButton);
	btnRegisterAccount.setControlCallback(onbtnRegisterAccountControl);
	
	inline function onbtnRegisterAccountControl(component, value)
	{
		if (!value)
			Engine.openWebsite(App.baseUrl[App.mode] + "my-account/");
	}

	//! Functions
	inline function show()
	{
		clear();
		pnlLoginContainer.showControl(true);
	}
	
	inline function hide()
	{
		pnlLoginContainer.showControl(false);
		clear();
	}
	
	inline function clear()
	{
		lblUsername.set("text", "");
		lblPassword.set("text", "");
	}
	
	inline function workOffline()
	{
		UserSettings.setProperty("rhapsody", "workOffline", true);
		hide();
	}

	//! Broadcasters
	Account.broadcasters.loggedIn.addListener(0, "Respond to changes in logged in status", function(state)
	{
		if (!state && !UserSettings.getProperty("rhapsody", "workOffline"))
			show();
		else
			hide();
	});
	
	const bcUserMenuValue = Engine.createBroadcaster({id: "bcLoginUserMenuValue", args: ["component", "value"]});
	bcUserMenuValue.attachToComponentValue("cmbUserMenu", "");
	
	bcUserMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		if (component.getItemText().toLowerCase() != "sign in")
			return;

		show();	
	});
}
