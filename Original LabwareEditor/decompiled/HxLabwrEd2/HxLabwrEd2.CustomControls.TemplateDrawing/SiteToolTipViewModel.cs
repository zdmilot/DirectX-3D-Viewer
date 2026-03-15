using System;
using System.Collections.ObjectModel;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using GalaSoft.MvvmLight;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.CustomControls.TemplateDrawing;

internal class SiteToolTipViewModel : ViewModelBase
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

	public SiteToolTipViewModel(Site site, Template template)
	{
		InfoTextBlocks = new ObservableCollection<TextBlock>();
		TextBlock item = new TextBlock
		{
			Text = "Site",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = $"Site ID: {site.Id}",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = $"Width (X-Axis): {site.Dimensions.X} mm",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = $"Length (Y-Axis): {site.Dimensions.Y} mm",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = $"X Offset: {site.OffsetsToParentOrigin.X} mm",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = $"Y Offset: {site.OffsetsToParentOrigin.Y} mm",
			Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
		};
		InfoTextBlocks.Add(item);
		item = new TextBlock
		{
			Text = $"Z Offset: {site.OffsetsToParentOrigin.Z} mm",
			Margin = new Thickness(5.0, 5.0, 5.0, 5.0)
		};
		InfoTextBlocks.Add(item);
		if (string.IsNullOrWhiteSpace(site.Labware))
		{
			return;
		}
		if (template.AssignedRackStatus[site.LabwareRelative] != AssignedLabwareStatus.NotFound)
		{
			if (string.IsNullOrEmpty(template.LabwareFileFullPath) || template.AssignedRackStatus[site.LabwareRelative] == AssignedLabwareStatus.FoundUsingAbsolutePath)
			{
				item = new TextBlock
				{
					Text = $"Assigned Rack Path: \"{site.Labware}\"",
					Margin = new Thickness(5.0, 0.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
			}
			else
			{
				item = new TextBlock
				{
					Text = $"Assigned Rack Relative Path: \"{site.LabwareRelative}\"",
					Margin = new Thickness(5.0, 0.0, 5.0, 0.0)
				};
				InfoTextBlocks.Add(item);
			}
		}
		else
		{
			item = new TextBlock
			{
				Text = $"Assigned Rack Path: \"{site.Labware}\"",
				Margin = new Thickness(5.0, 0.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
			item = new TextBlock
			{
				Text = "Unable to find a Rack (*.rck or *.crk) using provided path!",
				Margin = new Thickness(5.0, 5.0, 5.0, 0.0)
			};
			InfoTextBlocks.Add(item);
		}
		item = new TextBlock();
		if (site.SnapBase)
		{
			item.Text = "Snap By Rack Base";
		}
		else
		{
			item.Text = "Snap By Container Base";
		}
		item.Margin = new Thickness(5.0, 5.0, 5.0, 5.0);
		InfoTextBlocks.Add(item);
	}
}
