using System;
using System.Linq.Expressions;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.CustomControls.RackDrawing;

internal class RectangularRack2DViewModel : ViewModelBase
{
	private readonly double canvasHeight;

	private readonly double canvasWidth;

	private Canvas drawingSurface;

	public Canvas DrawingSurface
	{
		get
		{
			return drawingSurface;
		}
		set
		{
			((ObservableObject)this).Set<Canvas>((Expression<Func<Canvas>>)(() => DrawingSurface), ref drawingSurface, value);
		}
	}

	public RectangularRack2DViewModel(double displaySquareEdge, RectangularRack rectangularRack)
	{
		canvasHeight = displaySquareEdge;
		canvasWidth = displaySquareEdge;
		DrawRectangularRack(rectangularRack);
	}

	private void DrawRectangularRack(RectangularRack rectangularRack)
	{
		double errorOrEmptyWellDimension = RackHelper.GetErrorOrEmptyWellDimension(rectangularRack);
		RackHelper.GetRectangularBoundaryContainerEdges(rectangularRack, out var minX, out var maxX, out var minY, out var maxY);
		double num = Math.Abs(minX) + Math.Abs(maxX);
		double num2 = Math.Abs(maxY) + Math.Abs(minY);
		double num3 = num2 / 95.0 * 100.0;
		double num4 = num / 95.0 * 100.0;
		double num5 = ((!(num3 > num4)) ? (canvasWidth / num4) : (canvasHeight / num3));
		Canvas canvas = new Canvas();
		canvas.Width = canvasWidth;
		canvas.Height = canvasHeight;
		double num6 = canvas.Width / 2.0 - (num / 2.0 + minX) * num5;
		double num7 = canvas.Height / 2.0 - (num2 / 2.0 + minY) * num5;
		double num8 = ((!(rectangularRack.Dimensions.X > rectangularRack.Dimensions.Y)) ? (rectangularRack.Dimensions.Y * 0.0035 * num5) : (rectangularRack.Dimensions.X * 0.0035 * num5));
		Rectangle element = new Rectangle
		{
			Width = rectangularRack.Dimensions.X * num5,
			Height = rectangularRack.Dimensions.Y * num5,
			Stroke = Brushes.Black,
			StrokeThickness = num8,
			Fill = new SolidColorBrush(Color.FromArgb((rectangularRack.BackgroundColor.A == 0) ? byte.MaxValue : rectangularRack.BackgroundColor.A, rectangularRack.BackgroundColor.R, rectangularRack.BackgroundColor.G, rectangularRack.BackgroundColor.B))
		};
		canvas.Children.Add(element);
		Canvas.SetLeft(element, num6);
		Canvas.SetBottom(element, num7);
		if (rectangularRack.WellPattern != WellPattern.Irregular)
		{
			_ = rectangularRack.BoundaryOffsets.X;
		}
		else
		{
			_ = rectangularRack.IrregularRackBoundaryOffsets.X;
		}
		if (rectangularRack.WellPattern != WellPattern.Irregular)
		{
			_ = rectangularRack.BoundaryOffsets.Y;
		}
		else
		{
			_ = rectangularRack.IrregularRackBoundaryOffsets.Y;
		}
		double num9;
		double num10;
		if (rectangularRack.WellPattern == WellPattern.Irregular)
		{
			num9 = num6 + rectangularRack.IrregularRackBoundaryOffsets.X * num5;
			num10 = num7 + num5 * rectangularRack.IrregularRackBoundaryOffsets.Y;
		}
		else
		{
			num9 = num6 + rectangularRack.BoundaryOffsets.X * num5;
			num10 = ((rectangularRack.RectangularDefaultSequence.StartCorner != Corner.BackLeft) ? (num7 + num5 * rectangularRack.BoundaryOffsets.Y) : (num7 + num5 * (rectangularRack.BoundaryOffsets.Y + (double)(rectangularRack.Rows - 1) * rectangularRack.RowSpacing)));
		}
		double strokeThickness = num8 / 2.0;
		foreach (RackWell rackWell in rectangularRack.RackWells)
		{
			ContentControl contentControl = new ContentControl();
			double length;
			double length2;
			ShapeUI shapeUI;
			if (string.IsNullOrWhiteSpace(rackWell.ContainerRelativeFilePath))
			{
				length = num9 + num5 * (rackWell.CenterX - errorOrEmptyWellDimension / 2.0);
				length2 = num10 + num5 * (rackWell.CenterY - errorOrEmptyWellDimension / 2.0);
				shapeUI = new CircularWellViewModel(errorOrEmptyWellDimension, num5);
				shapeUI.ToolTip = new WellToolTipViewModel(errorOrEmptyWellDimension, rackWell.Label);
			}
			else
			{
				if (rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Status == AssignedLabwareStatus.NotFound || rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].FileStatus == FileOpeningStatus.Error)
				{
					length = num9 + num5 * (rackWell.CenterX + rackWell.ContainerOffsets.X - rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Dimensions.Z / 2.0);
					length2 = num10 + num5 * (rackWell.CenterY + rackWell.ContainerOffsets.Y - rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Dimensions.Z / 2.0);
					shapeUI = new CircularWellViewModel(rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath], num5);
				}
				else if (rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Shape == HxLabwrEd2.Model.Shape.Cylinder)
				{
					double num11 = rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Dimensions.Z / 2.0;
					length = num9 + num5 * (rackWell.CenterX + rackWell.ContainerOffsets.X - num11);
					length2 = num10 + num5 * (rackWell.CenterY + rackWell.ContainerOffsets.Y - num11);
					shapeUI = new CircularWellViewModel(rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath], num5);
				}
				else
				{
					length = num9 + num5 * (rackWell.CenterX + rackWell.ContainerOffsets.X - rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Dimensions.X / 2.0);
					length2 = num10 + num5 * (rackWell.CenterY + rackWell.ContainerOffsets.Y - rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath].Dimensions.Y / 2.0);
					shapeUI = new RectangularWellViewModel(rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath], num5);
				}
				shapeUI.ToolTip = new WellToolTipViewModel(rectangularRack.DrawContainers[rackWell.ContainerRelativeFilePath], rackWell, rectangularRack);
			}
			shapeUI.StrokeThickness = strokeThickness;
			contentControl.Content = shapeUI;
			canvas.Children.Add(contentControl);
			Canvas.SetLeft(contentControl, length);
			Canvas.SetBottom(contentControl, length2);
		}
		DrawingSurface = canvas;
	}
}
