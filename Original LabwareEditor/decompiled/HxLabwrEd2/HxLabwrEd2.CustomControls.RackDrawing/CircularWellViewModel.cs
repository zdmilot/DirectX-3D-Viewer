using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.RackDrawing;

internal class CircularWellViewModel : ShapeUI
{
	private double _diameter;

	public double Diameter
	{
		get
		{
			return _diameter;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Diameter), ref _diameter, value);
		}
	}

	protected override Vector2 DetermineDimensions()
	{
		return Vector2.FromRectangular(_diameter, _diameter) / 2;
	}

	public CircularWellViewModel(DrawContainer drawContainer, double scaleFactor = 1.0)
	{
		Diameter = drawContainer.Dimensions.Z * scaleFactor;
		if (drawContainer.Status == AssignedLabwareStatus.NotFound || drawContainer.FileStatus == FileOpeningStatus.Error)
		{
			base.Fill = ShapeUI.ErrorBrush;
			savedFill = ShapeUI.ErrorBrush;
		}
		else
		{
			base.Fill = ShapeUI.FillBrush;
			savedFill = ShapeUI.FillBrush;
		}
		highlightFill = ShapeUI.HighlightBrush;
	}

	public CircularWellViewModel(double diameter, double scaleFactor = 1.0)
	{
		Diameter = diameter * scaleFactor;
		base.Fill = ShapeUI.WhiteBrush;
		savedFill = ShapeUI.WhiteBrush;
		highlightFill = ShapeUI.HighlightBrush;
	}
}
