using System.Collections;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class RackWellLabelSorter : MultiSelectionSorter, IComparer
{
	public int Compare(object x, object y)
	{
		return base.Compare((x as RackWell)?.Label, (y as RackWell)?.Label);
	}
}
