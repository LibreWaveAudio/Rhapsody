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

namespace License
{
	//! pnlAddLicenseContainer
	const pnlAddLicenseContainer = Content.getComponent("pnlAddLicenseContainer");
	pnlAddLicenseContainer.showControl(false);
	
	pnlAddLicenseContainer.setPaintRoutine(function(g)
	{
		g.fillAll(this.get("bgColour"));

		var shadowArea = [pnlAddLicense.get("x"), pnlAddLicense.get("y"), pnlAddLicense.getWidth(), pnlAddLicense.getHeight()];
		g.drawDropShadow(shadowArea, Colours.withAlpha(Colours.black, 1.0), 25);
	});
	
	pnlAddLicenseContainer.setMouseCallback(function(event)
	{
		if (event.clicked && !event.rightClick)
			hide();
	});

	//! pnlAddLicense
	const pnlAddLicense = Content.getComponent("pnlAddLicense");
	
	pnlAddLicense.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, this.get("borderRadius"));

		// Label
		g.setColour(this.get("itemColour"));

		var lblArea = [lblAddLicense.get("x") - 30, lblAddLicense.get("y"), lblAddLicense.getWidth() + 60, lblAddLicense.getHeight()];
		g.fillRoundedRectangle(lblArea, 2);

		g.setFont("phosphor", 18);
		g.setColour(Colours.withAlpha(this.get("itemColour2"), 0.8));

		g.drawAlignedText("\ue2d6", [lblArea[0] + 8, lblArea[1], lblArea[3], lblArea[3]], "left");
		
		// Text
		g.setColour(this.get("textColour"));
		g.setFont("semibold", 22);
		g.drawAlignedText(this.get("text"), a.reduced(25), "topLeft");
			
		g.setFont("regular", 18);
		g.drawAlignedText("Enter your license key and click Activate.", a.reduced(25).withTrimmedTop(40), "topLeft");
		g.drawAlignedText("Then go to the downloads list to install your instrument.", a.reduced(25).withTrimmedTop(70), "topLeft");
		
		g.addNoise({alpha: 0.025, scaleFactor: 2.0, area: a, monochromatic: true});
	});
	
	//! btnAddLicenseClose
	const btnAddLicenseClose = Content.getComponent("btnAddLicenseClose");
	btnAddLicenseClose.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
	btnAddLicenseClose.setControlCallback(onbtnAddLicenseCloseControl);
	
	inline function onbtnAddLicenseCloseControl(component, value)
	{
		if (!value)
			hide();
	}

	//! lblAddLicense
	const lblAddLicense = Content.getComponent("lblAddLicense");
	lblAddLicense.set("text", "");
	lblAddLicense.setControlCallback(onlblAddLicenseControl);
	
	inline function onlblAddLicenseControl(component, value)
	{
		btnAddLicenseSubmit.set("enabled", isLicenseFormatValid(value));
	}	

	//! btnAddLicenseSubmit
	const btnAddLicenseSubmit = Content.getComponent("btnAddLicenseSubmit");
	btnAddLicenseSubmit.set("enabled", false);
	btnAddLicenseSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnAddLicenseSubmit.setControlCallback(onbtnAddLicenseSubmitControl);
	
	inline function onbtnAddLicenseSubmitControl(component, value)
	{
		if (value)
			return;
			
		local license = lblAddLicense.get("text").trim();

		if (!isLicenseFormatValid(license))
			return Engine.showMessageBox("License Error", "Please enter a valid license key.", 1);

		activateLicense(license);
	}
	
	//! Functions
	inline function show()
	{
		pnlAddLicenseContainer.showControl(true);
	}
	
	inline function hide()
	{
		pnlAddLicenseContainer.showControl(false);
		lblAddLicense.set("text", "");
	}
	
	inline function isLicenseFormatValid(license: string)
	{
		return (license != "" && license.contains("-") && license.length == 19);
	}
	
	inline function activateLicense(license: string)
	{		
		local token = Account.readToken();
		local endpoint = App.apiPrefix + "transfer_license";
		local headers = ["Authorization: Bearer " + token];
		local p = {"license_key": license};

		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.setHttpHeader(headers.join("\n"));

		Spinner.setText("Adding license to your account");

		Server.callWithPOST(endpoint, p, function(status, response)
		{
			if (status == 200 && typeof(response) == "object")
			{
				if (isDefined(response.status))
					return Engine.showMessageBox("Server Error: 200", trace(response), 1);

				Cache.sync();
				hide();

				return Engine.showMessageBox("Success", "The license has been activated.", 0);
			}

			var msg = "There was a problem adding the license to your account. Please contact support.";

			if (isDefined(response.code) && response.code == "rest_invalid_param")
				msg = "The license key you entered was not recognised.";
			else if (isDefined(response.message))
				msg = response.message;

			return Engine.showMessageBox("Server Error: " + status, msg, 1);
		});
	}
	
	//! Broadcasters
	const bcMenuValue = Engine.createBroadcaster({id: "bcLicenseMenuValue", args: ["component", "value"]});
	bcMenuValue.attachToComponentValue("cmbMenu", "");
	
	bcMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		if (component.getItemText().toLowerCase() != "add license")
			return;
			
		show();	
	});
}
