using System;
using System.Collections.ObjectModel;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.RackDrawing;

internal class WellToolTipViewModel : ViewModelBase
{
	private ObservableCollection<TextBlock> infoTextBlocks;

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

	public WellToolTipViewModel(DrawContainer drawContainer, RackWell rackWell, Rack rack)
	{
		InfoTextBlocks = new ObservableCollection<TextBlock>();
		TextBlock item = new TextBlock
		{
			Text = "Well",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = "Position ID: " + rackWell.Label,
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		if (rack is RectangularRack { WellPattern: WellPattern.Irregular })
		{
			item = new TextBlock
			{
				Text = $"Well Center X: {rackWell.CenterX} mm",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
			item = new TextBlock
			{
				Text = $"Well Center Y: {rackWell.CenterY} mm",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
		}
		if (rack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			item = new TextBlock
			{
				Text = $"Container Center X Offset: {rackWell.ContainerOffsets.X} mm",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
			item = new TextBlock
			{
				Text = $"Container Center Y Offset: {rackWell.ContainerOffsets.Y} mm",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
			item = new TextBlock
			{
				Text = $"Container Base Offset: {rackWell.ContainerOffsets.Z} mm",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
		}
		if (drawContainer.Status != AssignedLabwareStatus.NotFound && drawContainer.FileStatus == FileOpeningStatus.SuccessfullyOpened)
		{
			if (string.IsNullOrEmpty(rack.LabwareFileFullPath) || drawContainer.Status == AssignedLabwareStatus.FoundUsingAbsolutePath)
			{
				item = new TextBlock
				{
					Text = "Container Path: \"" + drawContainer.FilePath + "\"",
					Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
			}
			else
			{
				item = new TextBlock
				{
					Text = "Container Relative Path: \"" + drawContainer.RelativeFilePath + "\"",
					Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
			}
			if (drawContainer.Shape == Shape.Rectangle)
			{
				item = new TextBlock
				{
					Text = $"Container Aperture Width (X-Axis): {drawContainer.Dimensions.X} mm",
					Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
				item = new TextBlock
				{
					Text = $"Container Aperture Length (Y-Axis): {drawContainer.Dimensions.Y} mm",
					Margin = new Thickness(5.0, 5.0, 5.0, 5.0)
				};
				InfoTextBlocks.Add(item);
			}
			else
			{
				item = new TextBlock
				{
					Text = $"Container Aperture Diameter: {drawContainer.Dimensions.Z} mm",
					Margin = new Thickness(5.0, 5.0, 5.0, 5.0)
				};
				InfoTextBlocks.Add(item);
			}
		}
		else if (drawContainer.Status == AssignedLabwareStatus.NotFound)
		{
			item = new TextBlock
			{
				Text = "Container Path: \"" + drawContainer.FilePath + "\"",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
			item = new TextBlock
			{
				Text = "Unable to find a Container (*.ctr) using provided path!",
				Margin = new Thickness(5.0, 5.0, 5.0, 5.0)
			};
			InfoTextBlocks.Add(item);
		}
		else
		{
			if (string.IsNullOrEmpty(rack.LabwareFileFullPath) || drawContainer.Status == AssignedLabwareStatus.FoundUsingAbsolutePath)
			{
				item = new TextBlock
				{
					Text = "Container Path: \"" + drawContainer.FilePath + "\"",
					Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
			}
			else
			{
				item = new TextBlock
				{
					Text = "Container Relative Path: \"" + drawContainer.RelativeFilePath + "\"",
					Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
			}
			item = new TextBlock
			{
				Text = drawContainer.FileStatusError,
				Margin = new Thickness(5.0, 5.0, 5.0, 5.0)
			};
			InfoTextBlocks.Add(item);
		}
	}

	public WellToolTipViewModel(double wellDiameter, string label)
	{
		InfoTextBlocks = new ObservableCollection<TextBlock>();
		TextBlock item = new TextBlock
		{
			Text = "Well (Empty)",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = "Position ID: " + label,
			Margin = new Thickness(5.0, 5.0, 5.0, 5.0)
		};
		InfoTextBlocks.Add(item);
	}
}
