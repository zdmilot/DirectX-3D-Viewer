using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class ContainerSegment : ObservableObject, IDataErrorInfo
{
	private double dx;

	private double dy;

	private double dz;

	private double height;

	private double maxHeight;

	private double minHeight;

	private string volumeEquation;

	private double volume;

	private Shape shape;

	public bool IsBaseSegment { get; private set; }

	public double Dx
	{
		get
		{
			return dx;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Dx), ref dx, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Dy
	{
		get
		{
			return dy;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Dy), ref dy, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Dz
	{
		get
		{
			return dz;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Dz), ref dz, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double Height
	{
		get
		{
			return height;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Height), ref height, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double MaxHeight
	{
		get
		{
			return maxHeight;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => MaxHeight), ref maxHeight, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public double MinHeight
	{
		get
		{
			return minHeight;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => MinHeight), ref minHeight, Math.Round(value, 3, MidpointRounding.AwayFromZero));
		}
	}

	public string VolumeEquation
	{
		get
		{
			return volumeEquation;
		}
		private set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => VolumeEquation), ref volumeEquation, value);
		}
	}

	public double Volume
	{
		get
		{
			return volume;
		}
		private set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Volume), ref volume, Math.Round(value, 4, MidpointRounding.AwayFromZero));
		}
	}

	public Shape Shape
	{
		get
		{
			return shape;
		}
		set
		{
			((ObservableObject)this).Set<Shape>((Expression<Func<Shape>>)(() => Shape), ref shape, value);
			if (value == Shape.RoundBase || value == Shape.VConeBase)
			{
				IsBaseSegment = true;
			}
		}
	}

	public string Error => null;

	public string this[string propertyName]
	{
		get
		{
			if ((propertyName == "Dx" && Dx <= 0.0) || (propertyName == "Dy" && Dy <= 0.0) || (propertyName == "Dz" && Dz <= 0.0) || (propertyName == "Height" && Height <= 0.0))
			{
				return "Value must be greater than zero.";
			}
			return string.Empty;
		}
	}

	public static void RecalculateMinMaxHeights(TrulyObservableCollection<ContainerSegment> segments)
	{
		double num = 0.0;
		for (int num2 = segments.Count - 1; num2 > -1; num2--)
		{
			segments[num2].MinHeight = num;
			segments[num2].MaxHeight = num + segments[num2].Height;
			num = segments[num2].MaxHeight;
		}
	}

	public ContainerSegment(Shape shape)
	{
		Shape = shape;
	}

	public ContainerSegment(ContainerSegment segment)
	{
		IsBaseSegment = segment.IsBaseSegment;
		Height = segment.Height;
		MinHeight = segment.MinHeight;
		MaxHeight = segment.MaxHeight;
		Shape = segment.Shape;
		Dx = segment.Dx;
		Dy = segment.Dy;
		Dz = segment.Dz;
	}

	public void RecalculateHeightAndVolume()
	{
		Height = UpdateInternalHeight(this);
		Volume = UpdateVolume(this);
		VolumeEquation = UpdateVolumeEquation(this);
	}

	private static string UpdateVolumeEquation(ContainerSegment segment)
	{
		double num = segment.Dz / 2.0;
		switch (segment.Shape)
		{
		case Shape.Cylinder:
			return string.Format("h*{0}", Math.Round(Math.PI * num * num, 4, MidpointRounding.AwayFromZero).ToString("F4"));
		case Shape.Rectangle:
			return string.Format("h*{0}", Math.Round(segment.Dx * segment.Dy, 4, MidpointRounding.AwayFromZero).ToString("F4"));
		case Shape.InvertedVCone:
		case Shape.VCone:
			return string.Format("h*{0}", Math.Round(Math.PI / 12.0 * (segment.Dx * segment.Dx + segment.Dx * segment.Dy + segment.Dy * segment.Dy), 4, MidpointRounding.AwayFromZero).ToString("F4"));
		case Shape.RoundBase:
			return string.Format("h*{0}", Math.Round(num * num * Math.PI / 2.0, 4, MidpointRounding.AwayFromZero).ToString("F4"));
		case Shape.VConeBase:
			return string.Format("h*{0}", Math.Round(num * num * Math.PI / 3.0, 4, MidpointRounding.AwayFromZero).ToString("F4"));
		default:
			return "";
		}
	}

	private static double UpdateVolume(ContainerSegment segment)
	{
		double num = segment.Dz / 2.0;
		switch (segment.Shape)
		{
		case Shape.Cylinder:
			return Math.Round(segment.Height * num * num * Math.PI, 4, MidpointRounding.AwayFromZero);
		case Shape.Rectangle:
			return Math.Round(segment.Height * segment.Dx * segment.Dy, 4, MidpointRounding.AwayFromZero);
		case Shape.InvertedVCone:
		case Shape.VCone:
			return Math.Round(segment.Height * Math.PI / 12.0 * (segment.Dx * segment.Dx + segment.Dx * segment.Dy + segment.Dy * segment.Dy), 4, MidpointRounding.AwayFromZero);
		case Shape.RoundBase:
			return Math.Round(segment.Height * num * num * Math.PI / 2.0, 4, MidpointRounding.AwayFromZero);
		case Shape.VConeBase:
			return Math.Round(segment.Height * num * num * Math.PI / 3.0, 4, MidpointRounding.AwayFromZero);
		default:
			return 0.0;
		}
	}

	private static double UpdateInternalHeight(ContainerSegment segment)
	{
		return segment.MaxHeight - segment.MinHeight;
	}
}
