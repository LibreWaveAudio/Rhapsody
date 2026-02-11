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
	const pnlLicenseContainer = Content.getComponent("pnlLicenseContainer");
	pnlLicenseContainer.showControl(false);
	
	pnlLicenseContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		LookAndFeel.fullPageBackground();

		// Label
		g.setColour(this.get("itemColour"));

		var labelArea = Rectangle(lblLicense.get("x") - 36, lblLicense.get("y"), lblLicense.getWidth() + 50, lblLicense.getHeight());
		g.fillRoundedRectangle(labelArea, 5);
		
		g.setFont("phosphor", 18);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		
		g.drawAlignedText("\ue2d6", [labelArea[0] + 8, labelArea[1], labelArea[3], labelArea[3]], "left");
		
		// Title
		g.setColour(this.get("textColour"));
		g.setFont("semibold", 22);
		g.drawAlignedText(this.get("text"), labelArea.translated(0, -110), "left");
		
		// Tooltip
		g.setFont("regular", 18);
		g.setColour(this.get("textColour"));
		g.drawAlignedText("Enter your license key and click Activate.", labelArea.translated(0, -70), "left");
		g.drawAlignedText("Then go to the downloads list to install your instrument.", labelArea.translated(0, -45), "left");
	});

	//! lblLicense
	const lblLicense = Content.getComponent("lblLicense");
	lblLicense.set("text", "");
	lblLicense.setControlCallback(onlblLicenseControl);
	
	inline function onlblLicenseControl(component, value)
	{
		btnLicenseSubmit.set("enabled", isLicenseFormatValid(value));
	}	

	//! btnLicenseSubmit
	const btnLicenseSubmit = Content.getComponent("btnLicenseSubmit");
	btnLicenseSubmit.set("enabled", false);
	btnLicenseSubmit.setLocalLookAndFeel(LookAndFeel.textButton);
	btnLicenseSubmit.setControlCallback(onbtnLicenseSubmitControl);
	
	inline function onbtnLicenseSubmitControl(component, value)
	{
		if (value)
			return;
			
		local license = lblLicense.get("text").trim();

		if (!isLicenseFormatValid(license))
			return Engine.showMessageBox("License Error", "Please enter a valid license key.", 1);

		activateLicense(license);
	}
	
	//! btnLicenseClose
	const btnLicenseClose = Content.getComponent("btnLicenseClose");
	btnLicenseClose.setLocalLookAndFeel(LookAndFeel.textButton);
	btnLicenseClose.setControlCallback(onbtnLicenseCloseControl);
	
	inline function onbtnLicenseCloseControl(component, value)
	{
		if (!value)
			hide();
	}
	
	//! Functions
	inline function show()
	{
		pnlLicenseContainer.showControl(true);
		lblLicense.set("text", "");
	}
	
	inline function hide()
	{
		pnlLicenseContainer.showControl(false);
	}
	
	inline function isLicenseFormatValid(license: string)
	{
		return (license != "" && license.contains("-") && license.length >= 19);
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

				Cache.sync(false);
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
	const bcUserMenuValue = Engine.createBroadcaster({id: "bcLicenseMenuValue", args: ["component", "value"]});
	bcUserMenuValue.attachToComponentValue("cmbUserMenu", "");
	
	bcUserMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		if (component.getItemText().toLowerCase() != "add license")
			return;
			
		show();	
	});
}
