using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Windows.Media.Imaging;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Pedestal : ObservableObject
{
	public static Pedestal EmptyPedestal = new Pedestal("Empty");

	private string _name;

	private string _partNumber;

	private string _type;

	private string _templateFilePath;

	private string _modelFilePath;

	private string _imageFilePath;

	private Dimensions _dimensions;

	private Offsets _modelOffsetsOverride;

	private Offsets _sitesOffsetsOverride;

	private Site[] _sites;

	public string Name
	{
		get
		{
			return _name;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Name), ref _name, value);
		}
	}

	public string PartNumber
	{
		get
		{
			return _partNumber;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => PartNumber), ref _partNumber, value);
		}
	}

	public string TemplateFilePath
	{
		get
		{
			return _templateFilePath;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => TemplateFilePath), ref _templateFilePath, value);
		}
	}

	public string ModelFilePath
	{
		get
		{
			return _modelFilePath;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ModelFilePath), ref _modelFilePath, value);
		}
	}

	public Dimensions Dimensions
	{
		get
		{
			return _dimensions;
		}
		set
		{
			((ObservableObject)this).Set<Dimensions>((Expression<Func<Dimensions>>)(() => Dimensions), ref _dimensions, value);
		}
	}

	public Offsets ModelOffsetsOverride
	{
		get
		{
			return _modelOffsetsOverride;
		}
		set
		{
			((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => ModelOffsetsOverride), ref _modelOffsetsOverride, value);
		}
	}

	public Offsets SitesOffsetsOverride
	{
		get
		{
			return _sitesOffsetsOverride;
		}
		set
		{
			((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => SitesOffsetsOverride), ref _sitesOffsetsOverride, value);
		}
	}

	public Site[] Sites
	{
		get
		{
			return _sites;
		}
		set
		{
			((ObservableObject)this).Set<Site[]>((Expression<Func<Site[]>>)(() => Sites), ref _sites, value);
		}
	}

	public string Type
	{
		get
		{
			return _type;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => Type), ref _type, value);
		}
	}

	public string ImageFilePath
	{
		get
		{
			return _imageFilePath;
		}
		set
		{
			if (value != _imageFilePath)
			{
				_imageFilePath = value;
				BitmapImage image = null;
				try
				{
					image = new BitmapImage(new Uri(_imageFilePath));
				}
				catch (Exception)
				{
					Image = null;
				}
				Image = image;
			}
		}
	}

	public BitmapImage Image { get; private set; }

	public List<int> Oversized { get; }

	public Pedestal()
	{
		Dimensions = new Dimensions();
		ModelOffsetsOverride = new Offsets();
		SitesOffsetsOverride = new Offsets();
		Oversized = new List<int>();
	}

	public Pedestal(string name)
	{
		Dimensions = new Dimensions();
		ModelOffsetsOverride = new Offsets();
		SitesOffsetsOverride = new Offsets();
		Oversized = new List<int>();
		Name = name;
	}

	public Pedestal(string name, string partNumber)
	{
		Dimensions = new Dimensions();
		ModelOffsetsOverride = new Offsets();
		SitesOffsetsOverride = new Offsets();
		Oversized = new List<int>();
		Name = name;
		PartNumber = partNumber;
	}

	public Pedestal(string name, string partNumber, string type, string templateFilePath, string modelFilePath, string imageFilePath)
	{
		Name = name;
		PartNumber = partNumber;
		Type = type;
		TemplateFilePath = templateFilePath;
		ModelFilePath = modelFilePath;
		ImageFilePath = imageFilePath;
		Dimensions = new Dimensions();
		ModelOffsetsOverride = new Offsets();
		SitesOffsetsOverride = new Offsets();
		Oversized = new List<int>();
	}

	public Pedestal(string name, string partNumber, string type, string templateFilePath, string modelFilePath, string imageFilePath, Offsets modelOffsetsOverride, Offsets siteOffsetsOverride, List<int> oversized)
	{
		Name = name;
		PartNumber = partNumber;
		Type = type;
		TemplateFilePath = templateFilePath;
		ModelFilePath = modelFilePath;
		ImageFilePath = imageFilePath;
		Dimensions = new Dimensions();
		ModelOffsetsOverride = new Offsets(modelOffsetsOverride);
		SitesOffsetsOverride = new Offsets(siteOffsetsOverride);
		Oversized = new List<int>(oversized);
	}

	public Pedestal(Pedestal pedestal)
	{
		Name = pedestal.Name;
		PartNumber = pedestal.PartNumber;
		Type = pedestal.Type;
		TemplateFilePath = pedestal.TemplateFilePath;
		ModelFilePath = pedestal.ModelFilePath;
		Dimensions = new Dimensions(pedestal.Dimensions);
		ModelOffsetsOverride = new Offsets(pedestal.ModelOffsetsOverride);
		SitesOffsetsOverride = new Offsets(pedestal.SitesOffsetsOverride);
		Oversized = new List<int>(pedestal.Oversized);
		Type = pedestal.Type;
	}
}
