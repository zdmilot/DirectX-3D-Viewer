using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.TemplateDrawing;

internal class Template2DViewModel : ViewModelBase
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

	public Template2DViewModel(double displaySquareEdge, Template template)
	{
		canvasHeight = displaySquareEdge;
		canvasWidth = displaySquareEdge;
		DrawTemplate(template);
	}

	private void DrawTemplate(Template template)
	{
		double num = 0.0;
		double num2 = 0.0;
		double num3 = 0.0;
		List<double> list = new List<double>();
		List<double> list2 = new List<double>();
		list.Add(0.0);
		list2.Add(0.0);
		list.Add(template.Dimensions.X);
		list2.Add(template.Dimensions.Y);
		foreach (Site site in template.Sites)
		{
			if (site.Visible)
			{
				list.Add(site.OffsetsToParentOrigin.X);
				list2.Add(site.OffsetsToParentOrigin.Y);
				list.Add(site.OffsetsToParentOrigin.X + site.Dimensions.X);
				list2.Add(site.OffsetsToParentOrigin.Y + site.Dimensions.Y);
			}
		}
		num = list.Min();
		num3 = list.Max();
		num2 = list2.Min();
		double num4 = list2.Max();
		double num5 = num3 + -1.0 * num;
		double num6 = num4 + -1.0 * num2;
		double num7 = ((!(num5 > num6)) ? (canvasHeight * 0.95 / num6) : (canvasWidth * 0.95 / num5));
		double num8 = (num3 + num) * 0.5;
		double num9 = (num4 + num2) * 0.5;
		Canvas canvas = new Canvas();
		canvas.Width = canvasWidth;
		canvas.Height = canvasHeight;
		Rectangle rectangle = new Rectangle();
		rectangle.Width = template.Dimensions.X * num7;
		rectangle.Height = template.Dimensions.Y * num7;
		rectangle.Fill = new SolidColorBrush(Color.FromArgb((template.BackgroundColor.A == 0) ? byte.MaxValue : template.BackgroundColor.A, template.BackgroundColor.R, template.BackgroundColor.G, template.BackgroundColor.B));
		rectangle.Stroke = Brushes.Black;
		rectangle.StrokeThickness = (canvas.Height + canvas.Width) * 0.5 * 0.003;
		double num10 = (template.Dimensions.X * 0.5 - num8) * num7;
		double num11 = canvas.Width * 0.5 - rectangle.Width * 0.5 + num10;
		double num12 = (template.Dimensions.Y * 0.5 - num9) * num7;
		double num13 = canvas.Height * 0.5 - rectangle.Height * 0.5 + num12;
		Canvas.SetLeft(rectangle, num11);
		Canvas.SetBottom(rectangle, num13);
		canvas.Children.Add(rectangle);
		foreach (Site item in from x in template.Sites.AsQueryable()
			orderby x.OffsetsToParentOrigin.Z
			select x)
		{
			if (item.Visible)
			{
				ContentControl contentControl = new ContentControl();
				contentControl.Width = item.Dimensions.X * num7;
				contentControl.Height = item.Dimensions.Y * num7;
				ShapeUI shapeUI = new SiteViewModel(item, template, canvas, num7);
				shapeUI.ToolTip = new SiteToolTipViewModel(item, template);
				double length = num11 + item.OffsetsToParentOrigin.X * num7;
				double length2 = num13 + item.OffsetsToParentOrigin.Y * num7;
				contentControl.Content = shapeUI;
				Canvas.SetLeft(contentControl, length);
				Canvas.SetBottom(contentControl, length2);
				canvas.Children.Add(contentControl);
			}
		}
		ContentControl contentControl2 = new ContentControl();
		contentControl2.Width = canvas.Width * 0.025;
		contentControl2.Height = canvas.Height * 0.025;
		contentControl2.Content = new TemplateOriginViewModel((canvas.Height + canvas.Width) / 2.0 * 0.0015);
		Canvas.SetLeft(contentControl2, num11 - contentControl2.Width / 2.0);
		Canvas.SetBottom(contentControl2, num13 - contentControl2.Height / 2.0);
		canvas.Children.Add(contentControl2);
		DrawingSurface = canvas;
	}
}
