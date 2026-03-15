using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Cover : ObservableObject
{
	private string name;

	private string description;

	private string bitmap;

	private string image;

	private string model;

	private Offsets modelOffsets;

	private double thickness;

	private double coveredRackStackHeight;

	private double rackBaseToCoverBase;

	private double stackHeight;

	private Dimensions dimensions;

	private Dimensions overriddenExtent;

	private bool overrideExtent;

	public string Name
	{
		get
		{
			return name;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Name), ref name, value);
		}
	}

	public string Description
	{
		get
		{
			return description;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Description), ref description, value);
		}
	}

	public string Bitmap
	{
		get
		{
			return bitmap;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Bitmap), ref bitmap, value);
		}
	}

	public string Image
	{
		get
		{
			return image;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Image), ref image, value);
		}
	}

	public string Model
	{
		get
		{
			return model;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Model), ref model, value);
		}
	}

	public Offsets ModelOffsets
	{
		get
		{
			return modelOffsets;
		}
		set
		{
			if (value != modelOffsets)
			{
				if (modelOffsets != null)
				{
					((ObservableObject)modelOffsets).PropertyChanged -= DataChangedDelegate;
				}
				((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => ModelOffsets), ref modelOffsets, value);
				if (modelOffsets != null)
				{
					((ObservableObject)modelOffsets).PropertyChanged += DataChangedDelegate;
				}
			}
		}
	}

	public double Thickness
	{
		get
		{
			return thickness;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Thickness), ref thickness, value);
		}
	}

	public double CoveredRackStackHeight
	{
		get
		{
			return coveredRackStackHeight;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => CoveredRackStackHeight), ref coveredRackStackHeight, value);
		}
	}

	public double RackBaseToCoverBase
	{
		get
		{
			return rackBaseToCoverBase;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => RackBaseToCoverBase), ref rackBaseToCoverBase, value);
		}
	}

	public double StackHeight
	{
		get
		{
			return stackHeight;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => StackHeight), ref stackHeight, value);
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

	public Dimensions OverriddenExtent
	{
		get
		{
			return overriddenExtent;
		}
		set
		{
			if (value != overriddenExtent)
			{
				if (overriddenExtent != null)
				{
					((ObservableObject)overriddenExtent).PropertyChanged -= DataChangedDelegate;
				}
				((ObservableObject)this).Set<Dimensions>((Expression<Func<Dimensions>>)(() => OverriddenExtent), ref overriddenExtent, value);
				if (overriddenExtent != null)
				{
					((ObservableObject)overriddenExtent).PropertyChanged += DataChangedDelegate;
				}
			}
		}
	}

	public bool OverrideExtent
	{
		get
		{
			return overrideExtent;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => OverrideExtent), ref overrideExtent, value);
		}
	}

	protected void DataChangedDelegate(object sender, PropertyChangedEventArgs e)
	{
		((ObservableObject)this).PropertyChangedHandler?.Invoke(this, e);
	}

	public Cover()
	{
		Thickness = 0.0;
		CoveredRackStackHeight = 0.0;
		RackBaseToCoverBase = 0.0;
		StackHeight = 0.0;
		ModelOffsets = new Offsets();
		Dimensions = new Dimensions();
		OverriddenExtent = new Dimensions();
		OverrideExtent = false;
	}

	public Cover(Cover cover)
	{
		CoveredRackStackHeight = 0.0;
		RackBaseToCoverBase = 0.0;
		StackHeight = 0.0;
		ModelOffsets = new Offsets();
		Dimensions = new Dimensions();
		OverriddenExtent = new Dimensions();
		OverrideExtent = false;
		if (cover != null)
		{
			Name = cover.Name;
			Description = cover.Description;
			Bitmap = cover.Bitmap;
			Model = cover.Model;
			Thickness = cover.Thickness;
			CoveredRackStackHeight = cover.CoveredRackStackHeight;
			RackBaseToCoverBase = cover.RackBaseToCoverBase;
			StackHeight = cover.StackHeight;
			ModelOffsets = new Offsets(cover.ModelOffsets);
			Dimensions = new Dimensions(cover.Dimensions);
			OverriddenExtent = new Dimensions(cover.OverriddenExtent);
			OverrideExtent = cover.OverrideExtent;
		}
	}

	~Cover()
	{
		try
		{
			if (ModelOffsets != null)
			{
				((ObservableObject)ModelOffsets).PropertyChanged -= DataChangedDelegate;
			}
			if (Dimensions != null)
			{
				((ObservableObject)Dimensions).PropertyChanged -= DataChangedDelegate;
			}
			if (OverriddenExtent != null)
			{
				((ObservableObject)OverriddenExtent).PropertyChanged -= DataChangedDelegate;
			}
		}
		finally
		{
			((object)this).Finalize();
		}
	}
}
