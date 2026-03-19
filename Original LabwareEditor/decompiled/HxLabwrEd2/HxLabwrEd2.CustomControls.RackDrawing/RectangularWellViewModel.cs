using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.RackDrawing;

internal class RectangularWellViewModel : ShapeUI
{
	private double width;

	private double height;

	public double Width
	{
		get
		{
			return width;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Width), ref width, value);
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
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Height), ref height, value);
		}
	}

	public RectangularWellViewModel(DrawContainer drawContainer, double scaleFactor = 1.0)
	{
		Width = drawContainer.Dimensions.X * scaleFactor;
		Height = drawContainer.Dimensions.Y * scaleFactor;
		if (drawContainer.Status == AssignedLabwareStatus.NotFound)
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

	protected override Vector2 DetermineDimensions()
	{
		return Vector2.FromRectangular(width, height);
	}
}
