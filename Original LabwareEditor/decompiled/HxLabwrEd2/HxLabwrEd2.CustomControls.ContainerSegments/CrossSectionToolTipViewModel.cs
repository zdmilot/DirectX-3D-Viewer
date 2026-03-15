using System;
using System.Collections.ObjectModel;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.ContainerSegments;

internal class CrossSectionToolTipViewModel : ViewModelBase
{
	private string imageSource;

	private ObservableCollection<TextBlock> infoTextBlocks;

	public string ImageSource
	{
		get
		{
			return imageSource;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => ImageSource), ref imageSource, value);
		}
	}

	public ObservableCollection<TextBlock> InfoTextBlocks
	{
		get
		{
			return infoTextBlocks;
		}
		set
		{
			((ObservableObject)this).Set<ObservableCollection<TextBlock>>((Expression<Func<ObservableCollection<TextBlock>>>)(() => InfoTextBlocks), ref infoTextBlocks, value);
		}
	}

	public CrossSectionToolTipViewModel(ContainerSegment segment)
	{
		SetImageSource(segment);
		AddInfoTextBlocks(segment);
	}

	private void SetImageSource(ContainerSegment segment)
	{
		if (segment.Shape == Shape.Cylinder)
		{
			ImageSource = "/Images/Cylinder400x400.png";
		}
		else if (segment.Shape == Shape.InvertedVCone || segment.Shape == Shape.VCone)
		{
			ImageSource = "/Images/HalfCone400x400.png";
		}
		else if (segment.Shape == Shape.Rectangle)
		{
			ImageSource = "/Images/Rectangle400x400.png";
		}
		else if (segment.Shape == Shape.VConeBase)
		{
			ImageSource = "/Images/ConeBase400x400.png";
		}
		else
		{
			ImageSource = "/Images/RoundBase400x400.png";
		}
	}

	private void AddInfoTextBlocks(ContainerSegment segment)
	{
		InfoTextBlocks = new ObservableCollection<TextBlock>();
		string arg = ((segment.Shape == Shape.Cylinder) ? "Cylinder" : ((segment.Shape == Shape.InvertedVCone || segment.Shape == Shape.VCone) ? "Half Cone" : ((segment.Shape == Shape.Rectangle) ? "Rectangle" : ((segment.Shape != Shape.RoundBase) ? "Cone (Base)" : "Round (Base)"))));
		TextBlock textBlock = new TextBlock();
		textBlock.Text = $"{arg} Container Segment";
		textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
		InfoTextBlocks.Add(textBlock);
		if (segment.Shape == Shape.Rectangle)
		{
			textBlock = new TextBlock();
			textBlock.Text = $"Width (X-Axis): {segment.Dx} mm";
			textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
			InfoTextBlocks.Add(textBlock);
			textBlock = new TextBlock();
			textBlock.Text = $"Length (Y-Axis): {segment.Dy} mm";
			textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
			InfoTextBlocks.Add(textBlock);
		}
		else if (segment.Shape == Shape.VCone || segment.Shape == Shape.InvertedVCone)
		{
			textBlock = new TextBlock();
			textBlock.Text = $"Upper Diameter: {segment.Dx} mm";
			textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
			InfoTextBlocks.Add(textBlock);
			textBlock = new TextBlock();
			textBlock.Text = $"Lower Diameter: {segment.Dy} mm";
			textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
			InfoTextBlocks.Add(textBlock);
		}
		else
		{
			textBlock = new TextBlock();
			textBlock.Text = $"Diameter: {segment.Dz} mm";
			textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
			InfoTextBlocks.Add(textBlock);
		}
		textBlock = new TextBlock();
		textBlock.Text = $"Height: {segment.Height} mm";
		textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 0.0);
		InfoTextBlocks.Add(textBlock);
		textBlock = new TextBlock();
		textBlock.Text = $"Volume: {Math.Round(segment.Volume / 1000.0, 4, MidpointRounding.AwayFromZero)} mL";
		textBlock.Margin = new Thickness(5.0, 5.0, 5.0, 5.0);
		InfoTextBlocks.Add(textBlock);
	}
}
