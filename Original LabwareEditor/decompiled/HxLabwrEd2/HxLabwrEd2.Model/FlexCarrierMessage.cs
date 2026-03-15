using System.Collections.Generic;

namespace HxLabwrEd2.Model;

internal class FlexCarrierMessage
{
	public Carrier Carrier { get; }

	public SortedDictionary<string, SortedDictionary<string, Pedestal>> AvailablePedestals { get; }

	public FlexCarrierMessage(Carrier carrier, SortedDictionary<string, SortedDictionary<string, Pedestal>> availablePedestals)
	{
		Carrier = carrier;
		AvailablePedestals = availablePedestals;
	}
}
