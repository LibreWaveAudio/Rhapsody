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

namespace License
{
	const pnlAddLicense = Content.getComponent("pnlAddLicense");
	
	pnlAddLicense.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		// Label
		g.setColour(this.get("itemColour"));

		var lblArea = [lblAddLicense.get("x") - 30, lblAddLicense.get("y"), lblAddLicense.getWidth() + 60, lblAddLicense.getHeight()];
		g.fillRoundedRectangle(lblArea, 2);

		g.setFont("phosphor", 18);
		g.setColour(Colours.withAlpha(this.get("itemColour2"), 0.8));

		g.drawAlignedText("\ue2d6", [lblArea[0] + 8, lblArea[1], lblArea[3], lblArea[3]], "left");
		
		// Text
		g.setColour(this.get("textColour"));
		g.setFont("semibold", 20);
		g.drawAlignedText(this.get("text"), a, "topLeft");
			
		g.setFont("regular", 18);
		g.drawAlignedText("1) Enter your license key and click activate.", Rect.fromTop(a, 80), "left");
		g.drawAlignedText("2) Once activated, go to the downloads list to download and install your instrument.", Rect.fromTop(a, 135), "left");
		
	});
	
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
		    	
		Spinner.show("Adding license to your account");
		
		Server.callWithPOST(endpoint, p, function(status, response)
		{
			Spinner.hide();
		    
			if (status == 200 && typeof(response) == "object")
			{
				if (isDefined(response.status))
					return Engine.showMessageBox("Server Error: 200", trace(response), 1);
	
				//Products.sync();
				lblAddLicense.set("text", "");
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
}