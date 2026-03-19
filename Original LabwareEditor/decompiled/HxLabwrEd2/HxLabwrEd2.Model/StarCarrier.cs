using System.Collections.ObjectModel;
using System.Drawing;

namespace HxLabwrEd2.Model;

public class StarCarrier : Carrier
{
	public StarCarrier(CarrierConfig carrierConfig)
		: base(carrierConfig)
	{
		if (carrierConfig.PedestalTypes.Count == 4 && carrierConfig.Dimensions.X == 157.5)
		{
			base.Properties.Add(new Property("MlStarCarCountOfBCPos", "0"));
			base.Properties.Add(new Property("MlStarCarIsAutoLoad", "0"));
			base.Properties.Add(new Property("MlStarCarIsLoadable", "0"));
			base.Properties.Add(new Property("MlStarCarIsRecognizable", "0"));
			base.Properties.Add(new Property("MlStarCarNoReadBarcode", "1"));
			base.Properties.Add(new Property("MlStarCarPosAreRecognizable", "0"));
			base.Properties.Add(new Property("MlStarCarWidthAsT", "7"));
		}
		else
		{
			base.Barcode = "APE*****";
			base.Properties.Add(new Property("MlStarCarBCOrientation", "1"));
			if (carrierConfig.PedestalTypes.Count == 3)
			{
				base.Properties.Add(new Property("MlStarCarBCReadWidth", "700"));
				base.Properties.Add(new Property("MlStarCarFirstBCPos", "1160"));
				base.Properties.Add(new Property("MlStarCarRasterWidth", "1460"));
				base.Properties.Add(new Property("MlStarCarWidthAsT", "5"));
			}
			else
			{
				base.Properties.Add(new Property("MlStarCarBCReadWidth", "300"));
				base.Properties.Add(new Property("MlStarCarFirstBCPos", "615"));
				base.Properties.Add(new Property("MlStarCarRasterWidth", "960"));
				base.Properties.Add(new Property("MlStarCarWidthAsT", "6"));
			}
			base.Properties.Add(new Property("MlStarCarCountOfBCPos", $"{carrierConfig.PedestalTypes.Count}"));
			base.Properties.Add(new Property("MlStarCarIsAutoLoad", "1"));
			base.Properties.Add(new Property("MlStarCarIsLoadable", "1"));
			base.Properties.Add(new Property("MlStarCarIsRecognizable", "1"));
			base.Properties.Add(new Property("MlStarCarLabelName", "MFX_Carrier"));
			base.Properties.Add(new Property("MlStarCarNoReadBarcode", "0"));
			base.Properties.Add(new Property("MlStarCarPosAreRecognizable", "0"));
		}
		base.CategoryIds = new ObservableCollection<int>();
		base.CategoryIds.Add(184);
		base.CategoriesChanged = true;
		base.BackgroundColor = Color.FromArgb(0, 192, 192, 192);
		base.Clearance = base.Dimensions.Z + 5.0;
		base.UseBoundary = false;
		base.Visible = true;
	}
}
