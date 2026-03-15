using System;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.TemplateDrawing;

internal class SiteViewModel : ShapeUI
{
	private double width;

	private double height;

	private string labelText;

	private Visibility labelVisible;

	private Thickness labelMargin;

	private double labelFontSize;

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

	public string LabelText
	{
		get
		{
			return labelText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => LabelText), ref labelText, value);
		}
	}

	public Visibility LabelVisible
	{
		get
		{
			return labelVisible;
		}
		set
		{
			((ObservableObject)this).Set<Visibility>((Expression<Func<Visibility>>)(() => LabelVisible), ref labelVisible, value);
		}
	}

	public Thickness LabelMargin
	{
		get
		{
			return labelMargin;
		}
		set
		{
			((ObservableObject)this).Set<Thickness>((Expression<Func<Thickness>>)(() => LabelMargin), ref labelMargin, value);
		}
	}

	public double LabelFontSize
	{
		get
		{
			return labelFontSize;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => LabelFontSize), ref labelFontSize, value);
		}
	}

	public SiteViewModel(Site site, Template template, Canvas canvas, double scaleFactor)
	{
		Width = site.Dimensions.X * scaleFactor;
		Height = site.Dimensions.Y * scaleFactor;
		if (string.IsNullOrWhiteSpace(site.Labware))
		{
			base.Fill = ShapeUI.WhiteBrush;
			savedFill = ShapeUI.WhiteBrush;
		}
		else if (template.AssignedRackStatus[site.LabwareRelative] == AssignedLabwareStatus.NotFound)
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
		base.StrokeThickness = (canvas.Height + canvas.Width) / 2.0 * 0.002;
		if (site.Label)
		{
			LabelVisible = Visibility.Visible;
			LabelText = site.Id;
			LabelFontSize = Height * 0.2;
			LabelMargin = new Thickness(Height / 10.0, Height / 10.0, 0.0, 0.0);
		}
		else
		{
			LabelVisible = Visibility.Hidden;
		}
	}
}
