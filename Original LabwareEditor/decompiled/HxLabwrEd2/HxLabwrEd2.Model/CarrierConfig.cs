using System;
using System.Collections.Generic;
using System.Windows.Media.Imaging;

namespace HxLabwrEd2.Model;

public class CarrierConfig
{
	private string _imageFilePath;

	public string DisplayName { get; set; }

	public string DisplayPartNumber { get; set; }

	public Dimensions Dimensions { get; set; }

	public bool Loadable { get; set; }

	public string BarcodeMask { get; set; }

	public string ModelFilePath { get; set; }

	public List<Offsets> PedestalOffsets { get; set; }

	public List<string> PedestalTypes { get; set; }

	public Offsets ModelOffsets { get; set; }

	public BitmapImage Image { get; private set; }

	public Offsets ModelEdgeOffsets { get; set; }

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

	public CarrierConfig()
	{
		PedestalOffsets = new List<Offsets>();
		PedestalTypes = new List<string>();
		Dimensions = new Dimensions();
		ModelOffsets = new Offsets();
		ModelEdgeOffsets = new Offsets();
	}
}
