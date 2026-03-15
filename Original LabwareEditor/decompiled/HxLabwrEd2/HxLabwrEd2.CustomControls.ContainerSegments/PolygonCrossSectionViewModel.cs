using System;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Media;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.ContainerSegments;

internal class PolygonCrossSectionViewModel : ShapeUI
{
	private PointCollection points;

	public PointCollection Points
	{
		get
		{
			return points;
		}
		set
		{
			((ObservableObject)this).Set<PointCollection>((Expression<Func<PointCollection>>)(() => Points), ref points, value);
		}
	}

	public PolygonCrossSectionViewModel(ContainerSegment segment, Brush fillBrush, double scaleFactor)
	{
		Points = new PointCollection();
		if (segment.Shape == Shape.Cylinder)
		{
			Points.Add(new Point(0.0, 0.0));
			Points.Add(new Point(segment.Dz * scaleFactor, 0.0));
			Points.Add(new Point(segment.Dz * scaleFactor, segment.Height * scaleFactor));
			Points.Add(new Point(0.0, segment.Height * scaleFactor));
		}
		else if (segment.Shape == Shape.Rectangle)
		{
			Points.Add(new Point(0.0, 0.0));
			Points.Add(new Point(segment.Dx * scaleFactor, 0.0));
			Points.Add(new Point(segment.Dx * scaleFactor, segment.Height * scaleFactor));
			Points.Add(new Point(0.0, segment.Height * scaleFactor));
		}
		else if (segment.Shape == Shape.VCone || segment.Shape == Shape.InvertedVCone)
		{
			if (segment.Dx > segment.Dy)
			{
				double num = (segment.Dx - segment.Dy) / 2.0 * scaleFactor;
				Points.Add(new Point(0.0, 0.0));
				Points.Add(new Point(segment.Dx * scaleFactor, 0.0));
				Points.Add(new Point(segment.Dy * scaleFactor + num, segment.Height * scaleFactor));
				Points.Add(new Point(num, segment.Height * scaleFactor));
			}
			else
			{
				double num = (segment.Dy - segment.Dx) / 2.0 * scaleFactor;
				Points.Add(new Point(num, 0.0));
				Points.Add(new Point(segment.Dx * scaleFactor + num, 0.0));
				Points.Add(new Point(segment.Dy * scaleFactor, segment.Height * scaleFactor));
				Points.Add(new Point(0.0, segment.Height * scaleFactor));
			}
		}
		else
		{
			Points.Add(new Point(0.0, 0.0));
			Points.Add(new Point(segment.Dz * scaleFactor, 0.0));
			Points.Add(new Point(segment.Dz / 2.0 * scaleFactor, segment.Height * scaleFactor));
		}
		base.Fill = fillBrush;
		savedFill = fillBrush;
		highlightFill = new SolidColorBrush(Color.FromRgb(byte.MaxValue, 130, 130));
		base.ToolTip = new CrossSectionToolTipViewModel(segment);
	}
}
