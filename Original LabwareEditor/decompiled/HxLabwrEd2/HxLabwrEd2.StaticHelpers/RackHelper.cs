using System.Collections.Generic;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.StaticHelpers;

public static class RackHelper
{
	public static void GetRectangularBoundaryContainerEdges(Rack rack, out double minX, out double maxX, out double minY, out double maxY)
	{
		minX = 0.0;
		minY = 0.0;
		maxX = rack.Dimensions.X;
		maxY = rack.Dimensions.Y;
		double errorOrEmptyWellDimension = GetErrorOrEmptyWellDimension(rack);
		RectangularRack rectangularRack = rack as RectangularRack;
		double num = 0.0;
		if (rectangularRack != null && rectangularRack.WellPattern != WellPattern.Irregular && rectangularRack.RectangularDefaultSequence.StartCorner == Corner.BackLeft)
		{
			num = (double)(rectangularRack.Rows - 1) * rectangularRack.RowSpacing;
		}
		foreach (RackWell rackWell in rack.RackWells)
		{
			double num2;
			double num3;
			if (rectangularRack != null && rectangularRack.WellPattern == WellPattern.Irregular)
			{
				num2 = rackWell.CenterX + rectangularRack.IrregularRackBoundaryOffsets.X;
				num3 = rackWell.CenterY + rectangularRack.IrregularRackBoundaryOffsets.Y;
			}
			else
			{
				num2 = rackWell.CenterX + rack.BoundaryOffsets.X;
				num3 = rackWell.CenterY + rack.BoundaryOffsets.Y + num;
			}
			if (!string.IsNullOrEmpty(rackWell.ContainerFilePath))
			{
				num2 += rackWell.ContainerOffsets.X;
				num3 += rackWell.ContainerOffsets.Y;
			}
			double num5;
			double num6;
			double num7;
			double num8;
			if (!string.IsNullOrWhiteSpace(rackWell.ContainerRelativeFilePath) && rack.DrawContainers[rackWell.ContainerRelativeFilePath].Status != AssignedLabwareStatus.NotFound && rack.DrawContainers[rackWell.ContainerRelativeFilePath].FileStatus == FileOpeningStatus.SuccessfullyOpened)
			{
				DrawContainer drawContainer = rack.DrawContainers[rackWell.ContainerRelativeFilePath];
				if (drawContainer.Shape == Shape.Cylinder)
				{
					double num4 = drawContainer.Dimensions.Z / 2.0;
					num5 = num2 - num4;
					num6 = num2 + num4;
					num7 = num3 - num4;
					num8 = num3 + num4;
				}
				else
				{
					double num4 = drawContainer.Dimensions.X / 2.0;
					num5 = num2 - num4;
					num6 = num2 + num4;
					num4 = drawContainer.Dimensions.Y / 2.0;
					num7 = num3 - num4;
					num8 = num3 + num4;
				}
			}
			else
			{
				double num4 = errorOrEmptyWellDimension / 2.0;
				num5 = num2 - num4;
				num6 = num2 + num4;
				num7 = num3 - num4;
				num8 = num3 + num4;
			}
			if (num5 < minX)
			{
				minX = num5;
			}
			if (num6 > maxX)
			{
				maxX = num6;
			}
			if (num7 < minY)
			{
				minY = num7;
			}
			if (num8 > maxY)
			{
				maxY = num8;
			}
		}
	}

	public static double GetErrorOrEmptyWellDimension(Rack rack)
	{
		double result = 4.5;
		if (rack.ContainerLayout == ContainerLayout.WellsOnly)
		{
			result = rack.WellDiameter;
		}
		else if (rack is RectangularRack)
		{
			result = ((rack.RackWells.Count <= 96) ? 4.5 : ((rack.RackWells.Count > 384) ? 1.125 : 2.25));
		}
		return result;
	}

	public static void UpdateSingleContainerFilePath(Rack rack)
	{
		if (rack != null)
		{
			rack.SingleRepeatingContainer.FilePath = PathHelper.GenerateNewFullFilePathBasedOnParent(rack.SingleRepeatingContainer.FilePath, rack.LabwareFileFullPath);
		}
	}

	public static void UpdateMultipleContainersFilePath(Rack rack)
	{
		if (rack == null)
		{
			return;
		}
		Dictionary<string, string> dictionary = new Dictionary<string, string>();
		foreach (RackWell rackWell in rack.RackWells)
		{
			string containerFilePath = rackWell.ContainerFilePath;
			string value = string.Empty;
			if (!string.IsNullOrEmpty(rackWell.ContainerFilePath))
			{
				if (dictionary.TryGetValue(containerFilePath, out value))
				{
					rackWell.ContainerFilePath = value;
					continue;
				}
				rackWell.ContainerFilePath = PathHelper.GenerateNewFullFilePathBasedOnParent(rackWell.ContainerFilePath, rack.LabwareFileFullPath);
				dictionary.Add(containerFilePath, rackWell.ContainerRelativeFilePath);
			}
		}
	}

	public static void UpdateSingleContainerRelativePath(Rack rack, string oldFullLabwarePath)
	{
		rack.SingleRepeatingContainer.RelativeFilePath = PathHelper.GenerateNewRelativePath(rack, oldFullLabwarePath);
		ConfigFileReader.UpdateRackDrawContainers(rack);
		rack.RefreshRackWellsWithRepeatingData();
	}

	public static void UpdateSingleRackWellContainerRelativePath(RackWell rackWell, string labwareFullPath)
	{
		if (rackWell != null)
		{
			rackWell.ContainerRelativeFilePath = PathHelper.GenerateNewRelativePath(rackWell.ContainerFilePath, rackWell.ContainerRelativeFilePath, labwareFullPath);
		}
	}

	public static void UpdateMultipleContainersRelativePath(Rack rack, string oldParentLabwarePath)
	{
		if (rack == null)
		{
			return;
		}
		Dictionary<string, string> dictionary = new Dictionary<string, string>();
		foreach (RackWell rackWell in rack.RackWells)
		{
			string containerRelativeFilePath = rackWell.ContainerRelativeFilePath;
			string value = string.Empty;
			if (string.IsNullOrWhiteSpace(containerRelativeFilePath))
			{
				rackWell.ContainerFilePath = string.Empty;
				continue;
			}
			if (dictionary.TryGetValue(containerRelativeFilePath, out value))
			{
				rackWell.ContainerRelativeFilePath = value;
				continue;
			}
			rackWell.ContainerRelativeFilePath = PathHelper.GenerateNewRelativePath(rackWell, rack.LabwareFileFullPath, oldParentLabwarePath);
			dictionary.Add(containerRelativeFilePath, rackWell.ContainerRelativeFilePath);
		}
		ConfigFileReader.UpdateRackDrawContainers(rack);
	}

	public static void UpdateAssignedLabwarePaths(Rack rack, string oldParentLabwarePath)
	{
		if (rack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			if (rack.DrawContainers[rack.SingleRepeatingContainer.RelativeFilePath].Status == AssignedLabwareStatus.FoundUsingAbsolutePath)
			{
				UpdateSingleContainerFilePath(rack);
				UpdateSingleContainerRelativePath(rack, null);
			}
			else if (rack.DrawContainers[rack.SingleRepeatingContainer.RelativeFilePath].Status == AssignedLabwareStatus.FoundUsingRelativePath && !string.IsNullOrEmpty(oldParentLabwarePath))
			{
				UpdateSingleContainerRelativePath(rack, oldParentLabwarePath);
				UpdateSingleContainerFilePath(rack);
			}
			ConfigFileReader.UpdateRackDrawContainers(rack);
		}
		else if (rack.ContainerLayout == ContainerLayout.MultipleContainers)
		{
			if (string.IsNullOrEmpty(oldParentLabwarePath))
			{
				UpdateMultipleContainersFilePath(rack);
				UpdateMultipleContainersRelativePath(rack, oldParentLabwarePath);
			}
			else
			{
				UpdateMultipleContainersRelativePath(rack, oldParentLabwarePath);
				UpdateMultipleContainersFilePath(rack);
			}
			ConfigFileReader.UpdateRackDrawContainers(rack);
		}
	}
}
