using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Template : Labware
{
	private TrulyObservableCollection<Site> sites;

	public TrulyObservableCollection<Site> Sites
	{
		get
		{
			return sites;
		}
		set
		{
			if (sites != value)
			{
				if (sites != null)
				{
					sites.CollectionChanged -= base.CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<TrulyObservableCollection<Site>>((Expression<Func<TrulyObservableCollection<Site>>>)(() => Sites), ref sites, value);
				if (sites != null)
				{
					sites.CollectionChanged += base.CollectionChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public Dictionary<string, AssignedLabwareStatus> AssignedRackStatus { get; set; }

	private void SubscribeToPropertyEvents()
	{
		if (sites != null)
		{
			sites.CollectionChanged += base.CollectionChangedDelegate;
		}
	}

	public Template()
	{
		sites = new TrulyObservableCollection<Site>();
		AssignedRackStatus = new Dictionary<string, AssignedLabwareStatus>();
		SubscribeToPropertyEvents();
	}

	~Template()
	{
		if (sites != null)
		{
			sites.CollectionChanged -= base.CollectionChangedDelegate;
		}
	}
}
