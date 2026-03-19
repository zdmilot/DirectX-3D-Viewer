using System.Collections.ObjectModel;
using System.Drawing;

namespace HxLabwrEd2.Model;

public class NimbusCarrier : Carrier
{
	public NimbusCarrier(CarrierConfig carrierConfig)
		: base(carrierConfig)
	{
		if (carrierConfig.Loadable)
		{
			base.Barcode = carrierConfig.BarcodeMask;
			base.Properties.Add(new Property("IsLoadable", "1"));
			base.Properties.Add(new Property("ROI_Left", "0"));
			base.Properties.Add(new Property("ROI_Right", "752"));
			base.Properties.Add(new Property("ROI_Top", "0"));
			base.Properties.Add(new Property("ROI_Bottom", "480"));
		}
		base.CategoryIds = new ObservableCollection<int>();
		base.CategoryIds.Add(30015);
		base.CategoriesChanged = true;
		base.BackgroundColor = Color.FromArgb(0, 192, 192, 192);
		base.BarcodeIsUnique = true;
		base.Clearance = base.Dimensions.Z + 5.0;
		base.UseBoundary = false;
		base.Visible = true;
	}
}
