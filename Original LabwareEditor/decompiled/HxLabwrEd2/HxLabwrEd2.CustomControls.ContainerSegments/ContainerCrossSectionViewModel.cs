using System;
using System.Linq.Expressions;
using System.Windows.Media;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.ContainerSegments;

internal class ContainerCrossSectionViewModel : ViewModelBase
{
	private double segmentScaleFactor;

	private double controlHeight;

	private double controlWidth;

	private TrulyObservableCollection<ViewModelBase> crossSections;

	public double ControlHeight
	{
		get
		{
			return controlHeight;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => ControlHeight), ref controlHeight, value);
		}
	}

	public double ControlWidth
	{
		get
		{
			return controlWidth;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => ControlWidth), ref controlWidth, value);
		}
	}

	public TrulyObservableCollection<ViewModelBase> CrossSections
	{
		get
		{
			return crossSections;
		}
		set
		{
			((ObservableObject)this).Set<TrulyObservableCollection<ViewModelBase>>((Expression<Func<TrulyObservableCollection<ViewModelBase>>>)(() => CrossSections), ref crossSections, value);
		}
	}

	public ContainerCrossSectionViewModel(double displaySquareEdge, TrulyObservableCollection<ContainerSegment> segments)
	{
		ControlHeight = displaySquareEdge;
		ControlWidth = displaySquareEdge;
		MakeCrossSections(segments);
	}

	private void MakeCrossSections(TrulyObservableCollection<ContainerSegment> segments)
	{
		CalculateSegmentScaleFactor(segments);
		CrossSections = new TrulyObservableCollection<ViewModelBase>();
		int num = 25;
		int num2 = 140;
		int num3 = 220;
		int num4 = (185 - num) / segments.Count;
		int num5 = (num3 - num2) / segments.Count;
		Color color = new Color
		{
			A = byte.MaxValue,
			B = byte.MaxValue
		};
		for (int i = 0; i < segments.Count; i++)
		{
			color.R = (byte)(num + num4 * i);
			color.G = (byte)(num2 + num5 * i);
			CrossSections.Add(MakeCrossSection(segments[i], new SolidColorBrush(color)));
		}
	}

	private ViewModelBase MakeCrossSection(ContainerSegment segment, Brush fill)
	{
		if (segment.Shape == Shape.RoundBase)
		{
			return (ViewModelBase)(object)new RoundCrossSectionViewModel(segment, fill, segmentScaleFactor);
		}
		return (ViewModelBase)(object)new PolygonCrossSectionViewModel(segment, fill, segmentScaleFactor);
	}

	private void CalculateSegmentScaleFactor(TrulyObservableCollection<ContainerSegment> segments)
	{
		double num = 0.0;
		double num2 = 0.0;
		foreach (ContainerSegment segment in segments)
		{
			num += segment.Height;
			if (segment.Shape == Shape.Cylinder)
			{
				if (num2 < segment.Dz)
				{
					num2 = segment.Dz;
				}
			}
			else if (segment.Shape == Shape.Rectangle)
			{
				if (num2 < segment.Dx)
				{
					num2 = segment.Dx;
				}
			}
			else if (segment.Shape == Shape.VCone || segment.Shape == Shape.InvertedVCone)
			{
				if (segment.Dx > segment.Dy)
				{
					if (num2 < segment.Dx)
					{
						num2 = segment.Dx;
					}
				}
				else if (num2 < segment.Dy)
				{
					num2 = segment.Dy;
				}
			}
			else if (num2 < segment.Dz)
			{
				num2 = segment.Dz;
			}
		}
		if (num > num2)
		{
			segmentScaleFactor = ControlHeight * 0.8 / num;
		}
		else
		{
			segmentScaleFactor = ControlHeight * 0.8 / num2;
		}
	}
}
