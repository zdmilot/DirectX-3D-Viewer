using System;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Site : ObservableObject
{
	private string id;

	private bool isCovered;

	private bool label;

	private int position;

	private bool snapBase;

	private bool isStack;

	private int stackSize;

	private bool visible;

	private Dimensions dimensions;

	private Offsets offsetsToParentOrigin;

	private string labware;

	private string labwareRelative;

	public string Id
	{
		get
		{
			return id;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Id), ref id, value);
		}
	}

	public bool IsCovered
	{
		get
		{
			return isCovered;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsCovered), ref isCovered, value);
		}
	}

	public bool Label
	{
		get
		{
			return label;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => Label), ref label, value);
		}
	}

	public int Position
	{
		get
		{
			return position;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => Position), ref position, value);
		}
	}

	public bool SnapBase
	{
		get
		{
			return snapBase;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => SnapBase), ref snapBase, value);
		}
	}

	public bool IsStack
	{
		get
		{
			return isStack;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsStack), ref isStack, value);
		}
	}

	public int StackSize
	{
		get
		{
			return stackSize;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => StackSize), ref stackSize, value);
		}
	}

	public bool Visible
	{
		get
		{
			return visible;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => Visible), ref visible, value);
		}
	}

	public Dimensions Dimensions
	{
		get
		{
			return dimensions;
		}
		set
		{
			if (value != dimensions)
			{
				if (dimensions != null)
				{
					((ObservableObject)dimensions).PropertyChanged -= DataChangedDelegate;
				}
				((ObservableObject)this).Set<Dimensions>((Expression<Func<Dimensions>>)(() => Dimensions), ref dimensions, value);
				if (dimensions != null)
				{
					((ObservableObject)dimensions).PropertyChanged += DataChangedDelegate;
				}
			}
		}
	}

	public Offsets OffsetsToParentOrigin
	{
		get
		{
			return offsetsToParentOrigin;
		}
		set
		{
			if (value != offsetsToParentOrigin)
			{
				if (offsetsToParentOrigin != null)
				{
					((ObservableObject)offsetsToParentOrigin).PropertyChanged -= DataChangedDelegate;
				}
				((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => OffsetsToParentOrigin), ref offsetsToParentOrigin, value);
				if (offsetsToParentOrigin != null)
				{
					((ObservableObject)offsetsToParentOrigin).PropertyChanged += DataChangedDelegate;
				}
			}
		}
	}

	public string Labware
	{
		get
		{
			return labware;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Labware), ref labware, value);
		}
	}

	public string LabwareRelative
	{
		get
		{
			return labwareRelative;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => LabwareRelative), ref labwareRelative, value);
		}
	}

	public Site()
	{
		StackSize = 1;
		Dimensions = new Dimensions();
		dimensions.X = 10.0;
		dimensions.Y = 10.0;
		OffsetsToParentOrigin = new Offsets();
		Visible = true;
		SnapBase = true;
	}

	public Site(string Id)
	{
		this.Id = Id;
		StackSize = 1;
		Dimensions = new Dimensions();
		dimensions.X = 10.0;
		dimensions.Y = 10.0;
		OffsetsToParentOrigin = new Offsets();
		Visible = true;
		SnapBase = true;
	}

	public Site(Site site)
	{
		Id = site.Id;
		IsCovered = site.IsCovered;
		Label = site.Label;
		Position = site.Position;
		SnapBase = site.SnapBase;
		IsStack = site.IsStack;
		StackSize = site.StackSize;
		Visible = site.Visible;
		Dimensions = new Dimensions(site.Dimensions);
		OffsetsToParentOrigin = new Offsets(site.OffsetsToParentOrigin);
		Labware = site.Labware;
		LabwareRelative = site.LabwareRelative;
	}

	~Site()
	{
		try
		{
			((ObservableObject)Dimensions).PropertyChanged -= DataChangedDelegate;
			((ObservableObject)OffsetsToParentOrigin).PropertyChanged -= DataChangedDelegate;
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void DataChangedDelegate(object sender, PropertyChangedEventArgs e)
	{
		((ObservableObject)this).PropertyChangedHandler?.Invoke(this, e);
	}

	public static string FindNextDefaultLabel(TrulyObservableCollection<Site> sitesCollection)
	{
		int nextDefaultLabel = 1;
		while (sitesCollection.FirstOrDefault((Site x) => x.Id == nextDefaultLabel.ToString()) != null)
		{
			nextDefaultLabel++;
		}
		return nextDefaultLabel.ToString();
	}
}
