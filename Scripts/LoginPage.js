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

		g.setFont("medium", 20);
		g.setColour(this.get("itemColour2"));
		g.drawAlignedText("Login", [pnlLoginForm.get("x") + 1, pnlLoginForm.get("y") - 30, 100, 20], "left");

		g.setFont("regular", 14);
		g.setColour(Colours.withAlpha(this.get("itemColour2"), 0.8));
		
		var versionText = "v" + Engine.getVersion();
		
		if (App.mode != "release")
			versionText += " Development Build";
		
		g.drawAlignedText(versionText, [a[0], a[3] - 40, a[2] - 34, 25], "right");
		
		g.addNoise({alpha: 0.025, scaleFactor: 2.0, area: a, monochromatic: true});
	});

	//! pnlLoginForm
	const pnlLoginForm = Content.getComponent("pnlLoginForm");

	pnlLoginForm.setPaintRoutine(function(g)
	{
		// Label backgrounds
		g.setColour(this.get("itemColour"));    	
		
		var usernameArea = [lblUsername.get("x") - 36, lblUsername.get("y") - 8, lblUsername.getWidth() + 50, lblUsername.getHeight() + 16];
		var passwordArea = [lblPassword.get("x") - 36, lblPassword.get("y") - 8, lblPassword.getWidth() + 71, lblPassword.getHeight() + 16];
		
		g.fillRoundedRectangle(usernameArea, 2);
		g.fillRoundedRectangle(passwordArea, 2);
		
		// Label icons
		g.setFont("phosphor", 20);
		g.setColour(this.get("itemColour2"));
	
		g.drawAlignedText("\ue218", [usernameArea[0] + 8, usernameArea[1], usernameArea[3], usernameArea[3]], "left");
		g.drawAlignedText("\uea78", [passwordArea[0] + 8, passwordArea[1], passwordArea[3], passwordArea[3]], "left");
	});
	
	//! pnlNoAccount
	const pnlNoAccount = Content.getComponent("pnlNoAccount");
	
	pnlNoAccount.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);		
		var signupArea = [btnRegisterAccount.get("x"), btnRegisterAccount.get("y"), btnRegisterAccount.getWidth(), btnRegisterAccount.getHeight()];
	
		g.setFont("regular", 14);
		g.setColour(this.get("textColour"));
		g.drawAlignedText("No Account?", [a[0] + 20, a[1], a[2], a[3]], "left");
		g.drawAlignedText("or", [signupArea[0] + signupArea[2], signupArea[1], 50, signupArea[3]], "left");
	});
	
	//! lblUsername
	const lblUsername = Content.getComponent("lblUsername");
	
	//! lblPassword
	const lblPassword = Content.getComponent("lblPassword");
	
	//! btnShowPassword
	const btnShowPassword = Content.getComponent("btnShowPassword");
	btnShowPassword.setLocalLookAndFeel(LookAndFeel.iconButton);
	btnShowPassword.setControlCallback(onbtnShowPasswordControl);
	
	inline function onbtnShowPasswordControl(component, value)
	{
		lblPassword.set("fontStyle", value ? "plain" : "Password");
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
	
	//! btnOfflineMode
	const btnOfflineMode = Content.getComponent("btnOfflineMode");
	btnOfflineMode.setLocalLookAndFeel(lafPlainTextButton);
	btnOfflineMode.setControlCallback(onbtnOfflineModeControl);
	
	inline function onbtnOfflineModeControl(component, value)
	{
		if (!value)
			hide();
	}	
	
	//! btnGettingStarted
	const btnGettingStarted = Content.getComponent("btnGettingStarted");
	btnGettingStarted.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnGettingStarted.setControlCallback(onbtnGettingStartedControl);
	
	inline function onbtnGettingStartedControl(component, value)
	{
		if (!value)
			Engine.openWebsite(Engine.getProjectInfo().CompanyURL + "/rhapsody/");
	}

	//! btnDocumentation
	const btnDocumentation = Content.getComponent("btnDocumentation");
	btnDocumentation.setLocalLookAndFeel(LookAndFeel.linkButton);
	btnDocumentation.setControlCallback(onbtnDocumentationControl);
	
	inline function onbtnDocumentationControl(component, value)
	{
		if (!value)
			Engine.openWebsite(Engine.getProjectInfo().CompanyURL + "/knowledge-base/");
	}

	//! Functions
	inline function show()
	{
		lblUsername.set("text", "");
		lblPassword.set("text", "");
		pnlLoginContainer.showControl(true);
	}

	inline function hide()
	{
		pnlLoginContainer.showControl(false);
	}

	//! Listeners
	App.broadcasters.isLoggedIn.addListener("Login button visibility", "Respond to login changes", function(state)
	{
		state == 1 ? hide() : show();
	});
}