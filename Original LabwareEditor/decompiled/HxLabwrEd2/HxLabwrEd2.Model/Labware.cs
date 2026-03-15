using System;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Drawing;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Labware : ObservableObject
{
	protected string labwareFileFullPath;

	protected string name;

	protected string description;

	protected string bitmap;

	protected string image;

	protected string model;

	protected Dimensions dimensions;

	protected double clearance;

	protected Offsets modelOffsets;

	protected bool visible;

	protected string barcode;

	protected bool barcodeIsUnique;

	protected bool readOnly;

	protected TrulyObservableCollection<Property> properties;

	protected ObservableCollection<int> categoryIds;

	protected bool useBoundary;

	protected Shape boundaryShape;

	protected Offsets boundaryOffsets;

	protected Color backgroundColor;

	protected bool dataChanged;

	protected FileValidation validation;

	protected bool redraw;

	public string LabwareFileFullPath
	{
		get
		{
			return labwareFileFullPath;
		}
		set
		{
			labwareFileFullPath = value;
		}
	}

	public string Name
	{
		get
		{
			return name;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Name), ref name, value))
			{
				DataChanged = true;
			}
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
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Description), ref description, value))
			{
				DataChanged = true;
			}
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
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Bitmap), ref bitmap, value))
			{
				DataChanged = true;
			}
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
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Image), ref image, value))
			{
				DataChanged = true;
			}
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
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Model), ref model, value))
			{
				DataChanged = true;
			}
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
				DataChanged = true;
			}
		}
	}

	public double Clearance
	{
		get
		{
			return clearance;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Clearance), ref clearance, Math.Round(value, 3, MidpointRounding.AwayFromZero)))
			{
				DataChanged = true;
			}
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
				DataChanged = true;
			}
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
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => Visible), ref visible, value))
			{
				DataChanged = true;
			}
		}
	}

	public string Barcode
	{
		get
		{
			return barcode;
		}
		set
		{
			if (((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Barcode), ref barcode, value))
			{
				DataChanged = true;
			}
		}
	}

	public bool BarcodeIsUnique
	{
		get
		{
			return barcodeIsUnique;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => BarcodeIsUnique), ref barcodeIsUnique, value))
			{
				DataChanged = true;
			}
		}
	}

	public bool ReadOnly
	{
		get
		{
			return readOnly;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ReadOnly), ref readOnly, value);
		}
	}

	public TrulyObservableCollection<Property> Properties
	{
		get
		{
			return properties;
		}
		set
		{
			if (value != properties)
			{
				if (properties != null)
				{
					properties.CollectionChanged -= CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<TrulyObservableCollection<Property>>((Expression<Func<TrulyObservableCollection<Property>>>)(() => Properties), ref properties, value);
				if (properties != null)
				{
					properties.CollectionChanged += CollectionChangedDelegate;
				}
				DataChanged = true;
			}
		}
	}

	public ObservableCollection<int> CategoryIds
	{
		get
		{
			return categoryIds;
		}
		set
		{
			if (value != categoryIds)
			{
				if (categoryIds != null)
				{
					categoryIds.CollectionChanged -= CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<ObservableCollection<int>>((Expression<Func<ObservableCollection<int>>>)(() => CategoryIds), ref categoryIds, value);
				if (categoryIds != null)
				{
					categoryIds.CollectionChanged += CollectionChangedDelegate;
				}
				DataChanged = true;
			}
		}
	}

	public bool UseBoundary
	{
		get
		{
			return useBoundary;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => UseBoundary), ref useBoundary, value))
			{
				DataChanged = true;
			}
		}
	}

	public Shape BoundaryShape
	{
		get
		{
			return boundaryShape;
		}
		set
		{
			if (((ObservableObject)this).Set<Shape>((Expression<Func<Shape>>)(() => BoundaryShape), ref boundaryShape, value))
			{
				DataChanged = true;
			}
		}
	}

	public Offsets BoundaryOffsets
	{
		get
		{
			return boundaryOffsets;
		}
		set
		{
			if (value != boundaryOffsets)
			{
				if (boundaryOffsets != null)
				{
					((ObservableObject)boundaryOffsets).PropertyChanged -= DataChangedDelegate;
				}
				((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => BoundaryOffsets), ref boundaryOffsets, value);
				if (boundaryOffsets != null)
				{
					((ObservableObject)boundaryOffsets).PropertyChanged += DataChangedDelegate;
				}
				DataChanged = true;
			}
		}
	}

	public Color BackgroundColor
	{
		get
		{
			return backgroundColor;
		}
		set
		{
			if (!(value == backgroundColor) && ((ObservableObject)this).Set<Color>((Expression<Func<Color>>)(() => BackgroundColor), ref backgroundColor, value))
			{
				DataChanged = true;
			}
		}
	}

	public bool DataChanged
	{
		get
		{
			return dataChanged;
		}
		set
		{
			if (!Saving && ((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => DataChanged), ref dataChanged, value) && value && !Loading && validation != FileValidation.Irrelevant)
			{
				Validation = FileValidation.Invalid;
			}
		}
	}

	public bool Redraw
	{
		get
		{
			return redraw;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => Redraw), ref redraw, value);
		}
	}

	public FileValidation Validation
	{
		get
		{
			return validation;
		}
		set
		{
			((ObservableObject)this).Set<FileValidation>((Expression<Func<FileValidation>>)(() => Validation), ref validation, value);
		}
	}

	public bool IsHamiltonOriginalLabware { get; set; }

	public bool FileIsReadOnly { get; set; }

	public bool CategoriesChanged { get; set; }

	public bool Loading { get; set; }

	public bool Saving { get; set; }

	public Labware()
	{
		dimensions = new Dimensions();
		modelOffsets = new Offsets();
		properties = new TrulyObservableCollection<Property>();
		categoryIds = new ObservableCollection<int>();
		boundaryOffsets = new Offsets();
		backgroundColor = Color.FromArgb(255, 255, 255, 255);
		SubscribeToPropertyEvents();
		visible = true;
	}

	public Labware(Labware labware)
	{
		labwareFileFullPath = labware.labwareFileFullPath;
		name = labware.Name;
		description = labware.Description;
		bitmap = labware.Bitmap;
		image = labware.Image;
		model = labware.Model;
		dimensions = new Dimensions(labware.Dimensions);
		clearance = labware.Clearance;
		modelOffsets = new Offsets(labware.ModelOffsets);
		visible = labware.Visible;
		barcode = labware.Barcode;
		barcodeIsUnique = labware.BarcodeIsUnique;
		readOnly = labware.ReadOnly;
		properties = new TrulyObservableCollection<Property>();
		foreach (Property property in labware.Properties)
		{
			properties.Add(new Property(property.Name, property.Value));
		}
		categoryIds = new ObservableCollection<int>();
		foreach (int categoryId in labware.CategoryIds)
		{
			categoryIds.Add(categoryId);
		}
		useBoundary = labware.UseBoundary;
		boundaryShape = labware.BoundaryShape;
		boundaryOffsets = new Offsets(labware.BoundaryOffsets);
		backgroundColor = default(Color);
		backgroundColor = Color.FromArgb(labware.BackgroundColor.ToArgb());
		SubscribeToPropertyEvents();
	}

	~Labware()
	{
		try
		{
			if (dimensions != null)
			{
				((ObservableObject)dimensions).PropertyChanged -= DataChangedDelegate;
			}
			if (modelOffsets != null)
			{
				((ObservableObject)modelOffsets).PropertyChanged -= DataChangedDelegate;
			}
			if (boundaryOffsets != null)
			{
				((ObservableObject)boundaryOffsets).PropertyChanged -= DataChangedDelegate;
			}
			if (properties != null)
			{
				properties.CollectionChanged -= CollectionChangedDelegate;
			}
			if (categoryIds != null)
			{
				categoryIds.CollectionChanged -= CollectionChangedDelegate;
			}
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void SubscribeToPropertyEvents()
	{
		if (dimensions != null)
		{
			((ObservableObject)dimensions).PropertyChanged += DataChangedDelegate;
		}
		if (modelOffsets != null)
		{
			((ObservableObject)modelOffsets).PropertyChanged += DataChangedDelegate;
		}
		if (boundaryOffsets != null)
		{
			((ObservableObject)boundaryOffsets).PropertyChanged += DataChangedDelegate;
		}
		if (properties != null)
		{
			properties.CollectionChanged += CollectionChangedDelegate;
		}
		if (categoryIds != null)
		{
			categoryIds.CollectionChanged += CollectionChangedDelegate;
		}
	}

	protected void DataChangedDelegate(object sender, PropertyChangedEventArgs e)
	{
		if (!Loading && !Saving)
		{
			DataChanged = true;
			((ObservableObject)this).PropertyChangedHandler?.Invoke(this, e);
		}
	}

	protected void CollectionChangedDelegate(object sender, NotifyCollectionChangedEventArgs e)
	{
		if (!Loading && !Saving)
		{
			DataChanged = true;
		}
	}

	public void TriggerRedraw()
	{
		redraw = false;
		Redraw = true;
	}
}
