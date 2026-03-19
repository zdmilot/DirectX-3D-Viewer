using System;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using GalaSoft.MvvmLight;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.CustomControls.RackDrawing;

public class CircularRack2DViewModel : ViewModelBase
{
	private const double BorderThicknessFactor = 0.0025;

	private readonly CircularRack _circularRack;

	private Canvas _drawingSurface;

	public Canvas DrawingSurface
	{
		get
		{
			return _drawingSurface;
		}
		set
		{
			((ObservableObject)this).Set<Canvas>((Expression<Func<Canvas>>)(() => DrawingSurface), ref _drawingSurface, value);
		}
	}

	public CircularRack2DViewModel(CircularRack circularRack)
	{
		_circularRack = circularRack;
		DrawCircularRack();
	}

	private void DrawCircularRack()
	{
		Canvas canvas = new Canvas
		{
			Width = 0.0,
			Height = 0.0,
			ClipToBounds = true
		};
		DrawBoundary(canvas);
		DrawRackWells(canvas);
		Vector2 viewportOrigin = CanvasHelper.MinimizeDimensions(canvas, 0.05);
		CanvasHelper.CenterChildren(canvas, viewportOrigin);
		CanvasHelper.AssignBorderThicknessToChildren(canvas, 0.0025);
		DrawingSurface = canvas;
	}

	private void DrawBoundary(Canvas canvas)
	{
		SolidColorBrush fillBrush = new SolidColorBrush(Color.FromArgb(_circularRack.BackgroundColor.A, _circularRack.BackgroundColor.R, _circularRack.BackgroundColor.G, _circularRack.BackgroundColor.B));
		FrameworkElement element = ((_circularRack.BoundaryShape == HxLabwrEd2.Model.Shape.Rectangle) ? DrawRectangularBoundary(fillBrush) : DrawCircularBoundary(fillBrush));
		canvas.Children.Add(element);
		CanvasHelper.PositionElementOnCanvas(element, Vector2.Zero());
	}

	private FrameworkElement DrawRectangularBoundary(Brush fillBrush)
	{
		return new Rectangle
		{
			Width = _circularRack.Dimensions.X,
			Height = _circularRack.Dimensions.Y,
			Stroke = Brushes.Black,
			Fill = fillBrush
		};
	}

	private FrameworkElement DrawCircularBoundary(Brush fillBrush)
	{
		return new Ellipse
		{
			Width = _circularRack.Dimensions.X,
			Height = _circularRack.Dimensions.Y,
			Stroke = Brushes.Black,
			Fill = fillBrush
		};
	}

	private void DrawRackWells(Canvas canvas)
	{
		foreach (RackWell rackWell in _circularRack.RackWells)
		{
			Vector2 dimensions;
			ShapeUI content = DetermineRackWellDisplayShape(rackWell, out dimensions);
			ContentControl element = new ContentControl
			{
				Content = content,
				Width = dimensions.X,
				Height = dimensions.Y
			};
			canvas.Children.Add(element);
			Vector2 position = ((_circularRack.BoundaryShape == HxLabwrEd2.Model.Shape.Rectangle) ? _circularRack.BoundaryOffsets.AsVector2() : (_circularRack.RelativeReferencePoint() + _circularRack.Dimensions.AsVector2() / 2));
			if (rackWell.HasContainer())
			{
				position += rackWell.Container.Offsets.AsVector2();
			}
			position += rackWell.Center - dimensions / 2;
			CanvasHelper.PositionElementOnCanvas(element, position);
		}
	}

	private ShapeUI DetermineRackWellDisplayShape(RackWell rackWell, out Vector2 dimensions)
	{
		if (string.IsNullOrEmpty(rackWell.ContainerRelativeFilePath))
		{
			double errorOrEmptyWellDimension = RackHelper.GetErrorOrEmptyWellDimension(_circularRack);
			dimensions = Vector2.FromRectangular(errorOrEmptyWellDimension, errorOrEmptyWellDimension);
			return new CircularWellViewModel(errorOrEmptyWellDimension)
			{
				ToolTip = new WellToolTipViewModel(errorOrEmptyWellDimension, rackWell.Label)
			};
		}
		DrawContainer drawContainer = _circularRack.DrawContainers[rackWell.ContainerRelativeFilePath];
		WellToolTipViewModel toolTip = new WellToolTipViewModel(drawContainer, rackWell, _circularRack);
		if (drawContainer.Status == AssignedLabwareStatus.NotFound || drawContainer.FileStatus == FileOpeningStatus.Error || drawContainer.Shape == HxLabwrEd2.Model.Shape.Cylinder)
		{
			dimensions = Vector2.FromRectangular(drawContainer.Dimensions.Z, drawContainer.Dimensions.Z);
			return new CircularWellViewModel(drawContainer)
			{
				ToolTip = toolTip
			};
		}
		dimensions = Vector2.FromRectangular(drawContainer.Dimensions.X, drawContainer.Dimensions.Y);
		return new RectangularWellViewModel(drawContainer)
		{
			ToolTip = toolTip
		};
	}
}
