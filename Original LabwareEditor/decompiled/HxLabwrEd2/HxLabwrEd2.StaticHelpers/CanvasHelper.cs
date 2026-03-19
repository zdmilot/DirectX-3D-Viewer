using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Shapes;
using HxLabwrEd2.CustomControls;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.StaticHelpers;

public static class CanvasHelper
{
	public static Vector2 MinimizeDimensions(Canvas canvas, double marginPercentage = 0.0)
	{
		Vector2 vector = Vector2.Zero();
		Vector2 vector2 = Vector2.Zero();
		foreach (FrameworkElement child in canvas.Children)
		{
			Vector2 vector3 = Vector2.FromRectangular(Canvas.GetLeft(child), Canvas.GetBottom(child));
			Vector2 vector4 = Vector2.FromRectangular(child.Width, child.Height);
			vector.X = Math.Min(vector.X, vector3.X);
			vector.Y = Math.Min(vector.Y, vector3.Y);
			vector2.X = Math.Max(vector2.X, vector3.X + vector4.X);
			vector2.Y = Math.Max(vector2.Y, vector3.Y + vector4.Y);
		}
		Vector2 vector5 = (vector2 - vector) * marginPercentage;
		vector -= vector5;
		vector2 += vector5;
		Vector2 vector6 = vector2 - vector;
		canvas.Width = vector6.X;
		canvas.Height = vector6.Y;
		return vector;
	}

	public static void AssignBorderThicknessToChildren(Canvas canvas, double percentageOfPanelWidth)
	{
		double strokeThickness = canvas.Width * percentageOfPanelWidth;
		foreach (object child in canvas.Children)
		{
			if (child is Shape)
			{
				(child as Shape).StrokeThickness = strokeThickness;
			}
			object obj = (child as ContentControl)?.Content;
			if (obj is ShapeUI)
			{
				(obj as ShapeUI).StrokeThickness = strokeThickness;
			}
		}
	}

	public static void CenterChildren(Canvas canvas, Vector2 viewportOrigin)
	{
		foreach (FrameworkElement child in canvas.Children)
		{
			Canvas.SetLeft(child, Canvas.GetLeft(child) - viewportOrigin.X);
			Canvas.SetBottom(child, Canvas.GetBottom(child) - viewportOrigin.Y);
		}
	}

	public static void PositionElementOnCanvas(UIElement element, Vector2 position)
	{
		Canvas.SetLeft(element, position.X);
		Canvas.SetBottom(element, position.Y);
	}
}
