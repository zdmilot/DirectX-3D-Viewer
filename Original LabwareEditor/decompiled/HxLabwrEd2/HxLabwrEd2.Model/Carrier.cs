using System.Collections.Generic;

namespace HxLabwrEd2.Model;

public abstract class Carrier : Template
{
	public Pedestal[] Pedestals { get; set; }

	public List<Offsets> PedestalOffsets { get; }

	public List<string> PedestalTypes { get; }

	public Offsets ModelEdgeOffsets { get; }

	public Carrier(CarrierConfig carrierConfig)
	{
		base.Model = carrierConfig.ModelFilePath;
		base.Dimensions = new Dimensions(carrierConfig.Dimensions);
		base.ModelOffsets = new Offsets(carrierConfig.ModelOffsets);
		PedestalOffsets = new List<Offsets>();
		foreach (Offsets pedestalOffset in carrierConfig.PedestalOffsets)
		{
			PedestalOffsets.Add(new Offsets(pedestalOffset));
		}
		PedestalTypes = carrierConfig.PedestalTypes;
		Pedestals = new Pedestal[PedestalOffsets.Count];
		base.Properties = new TrulyObservableCollection<Property>();
		ModelEdgeOffsets = new Offsets(carrierConfig.ModelEdgeOffsets);
	}
}
