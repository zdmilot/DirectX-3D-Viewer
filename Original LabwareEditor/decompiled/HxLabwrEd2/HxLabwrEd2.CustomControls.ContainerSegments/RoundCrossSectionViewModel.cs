using System;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Media;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.ContainerSegments;

internal class RoundCrossSectionViewModel : ShapeUI
{
	private Size size;

	private Point pointFirstArc;

	private Point pointSecondArc;

	public Size Size
	{
		get
		{
			return size;
		}
		set
		{
			((ObservableObject)this).Set<Size>((Expression<Func<Size>>)(() => Size), ref size, value);
		}
	}

	public Point PointFirstArc
	{
		get
		{
			return pointFirstArc;
		}
		set
		{
			((ObservableObject)this).Set<Point>((Expression<Func<Point>>)(() => PointFirstArc), ref pointFirstArc, value);
		}
	}

	public Point PointSecondArc
	{
		get
		{
			return pointSecondArc;
		}
		set
		{
			((ObservableObject)this).Set<Point>((Expression<Func<Point>>)(() => PointSecondArc), ref pointSecondArc, value);
		}
	}

	public RoundCrossSectionViewModel(ContainerSegment segment, Brush fillBrush, double scaleFactor)
	{
		PointFirstArc = new Point(segment.Dz * scaleFactor / 2.0, segment.Height * scaleFactor);
		PointSecondArc = new Point(segment.Dz * scaleFactor, 0.0);
		Size = new Size(segment.Dz * scaleFactor / 2.0, segment.Height * scaleFactor);
		base.Fill = fillBrush;
		savedFill = fillBrush;
		highlightFill = new SolidColorBrush(Color.FromRgb(byte.MaxValue, 130, 130));
		base.ToolTip = new CrossSectionToolTipViewModel(segment);
	}
}
